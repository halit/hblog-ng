import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import * as openpgp from 'openpgp';
import './pipeline/load-env';

import { getVaultPath } from './pipeline/vault-path';
import { VaultProcessor } from './pipeline/processor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PASSPHRASE = process.env.NEXT_PUBLIC_PGP_PASSPHRASE;
const KEY_ID = process.env.NEXT_PUBLIC_PGP_KEY_ID;
const VAULT_DIR = getVaultPath();
// Mirror parse-vault.ts so the signed bytes equal the published `node.content`.
const ASSETS_DIR = path.resolve(__dirname, '../public/images');

async function getPrivateKey(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY) {
    return process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY;
  }

  if (process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH) {
    try {
      const keyPath = path.resolve(process.cwd(), process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH);
      if (fs.existsSync(keyPath)) {
        return await fsPromises.readFile(keyPath, 'utf-8');
      }
    } catch (error) {
      console.warn('Error reading private key file:', error);
    }
  }

  return null;
}

async function checkGpgAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn('gpg', ['--version']);
    p.on('error', () => resolve(false));
    p.on('close', (code) => resolve(code === 0));
  });
}

async function signWithSystemGpg(content: string, keyId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['--detach-sign', '--armor'];
    if (keyId) {
      args.push('--local-user', keyId);
    }

    const gpg = spawn('gpg', args);
    let stdout = '';
    let stderr = '';

    gpg.stdout.on('data', (data) => (stdout += data));
    gpg.stderr.on('data', (data) => (stderr += data));

    gpg.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`GPG process exited with code ${code}: ${stderr}`));
      }
    });

    gpg.on('error', (err) => reject(err));

    gpg.stdin.write(content.trim()); // Use trimmed content like other signer
    gpg.stdin.end();
  });
}

/**
 * Returns true if `sigArmored` is a valid detached signature of `content` under
 * `publicKey`. Used to make signing idempotent: a post whose signature already
 * verifies against the current content is left untouched, so re-running the
 * pipeline only re-signs posts whose content actually changed.
 */
async function signatureIsValid(
  sigArmored: string,
  content: string,
  publicKey: openpgp.PublicKey,
): Promise<boolean> {
  try {
    const signature = await openpgp.readSignature({ armoredSignature: sigArmored });
    const message = await openpgp.createMessage({ text: content.trim() });
    const result = await openpgp.verify({ message, signature, verificationKeys: publicKey });
    return await result.signatures[0].verified;
  } catch {
    return false;
  }
}

async function signContent(
  content: string,
  privateKeyArmored: string,
  passphrase?: string,
): Promise<string> {
  try {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

    let decryptedKey = privateKey;
    if (passphrase) {
      try {
        decryptedKey = await openpgp.decryptKey({
          privateKey,
          passphrase,
        });
      } catch {
        console.warn('  ! Failed to decrypt key with passphrase, trying without...');
      }
    }

    const message = await openpgp.createMessage({ text: content.trim() });
    const signature = await openpgp.sign({
      message,
      signingKeys: decryptedKey,
      detached: true,
    });

    return signature as string;
  } catch (error) {
    throw new Error(`Signing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function processFile(
  filePath: string,
  vaultAssetsDir: string,
  processor: VaultProcessor,
  privateKey: string | null,
  useSystemGpg: boolean,
  publicKey: openpgp.PublicKey | null,
): Promise<'signed' | 'skipped' | 'up-to-date' | 'failed'> {
  // Sign exactly what the site publishes as `node.content` (processed body,
  // trimmed) so the in-browser Verify button matches the served content.
  const bodyToSign = await processor.getSignableContent(filePath);

  if (!bodyToSign) {
    console.log(`  ! Skipping empty body: ${path.basename(filePath)}`);
    return 'skipped';
  }

  const filename = path.basename(filePath, '.md');
  const sigPath = path.join(vaultAssetsDir, 'signatures', `${filename}.asc`);

  // Idempotent: if a signature already exists and still verifies against the
  // current content, leave it as-is. Only missing/stale signatures are rewritten.
  if (publicKey && fs.existsSync(sigPath)) {
    const existing = await fsPromises.readFile(sigPath, 'utf-8');
    if (await signatureIsValid(existing, bodyToSign, publicKey)) {
      return 'up-to-date';
    }
  }

  try {
    let signature: string;

    if (privateKey) {
      signature = await signContent(bodyToSign, privateKey, PASSPHRASE);
    } else if (useSystemGpg) {
      signature = await signWithSystemGpg(bodyToSign, KEY_ID);
    } else {
      throw new Error('No signing method available');
    }

    await fsPromises.writeFile(sigPath, signature);
    console.log(`  ✓ Signed: ${filename}`);
    return 'signed';
  } catch (error) {
    console.error(`  ✗ Failed to sign ${path.basename(filePath)}:`, error);
    return 'failed';
  }
}

async function main() {
  const privateKey = await getPrivateKey();
  let useSystemGpg = false;

  // Signing runs as part of `prepare-data`, so a missing key must NOT fail the
  // build (fresh clones, CI, and the example-vault demo have no private key).
  // Require an explicit key: a configured private key, or system GPG with an
  // explicit KEY_ID — never sign with a stray default GPG key in CI.
  if (!privateKey) {
    if (KEY_ID && (await checkGpgAvailable())) {
      console.log('Private key not found in environment, falling back to system GPG.');
      useSystemGpg = true;
    } else {
      console.log('ℹ Skipping PGP signing: no signing key configured (set NEXT_PUBLIC_PGP_*).');
      return;
    }
  }

  if (!fs.existsSync(VAULT_DIR)) {
    console.log(`ℹ Skipping PGP signing: vault directory not found (${VAULT_DIR}).`);
    return;
  }

  // Derive the public key so we can verify existing signatures and skip posts
  // whose content hasn't changed (idempotent re-runs).
  let publicKey: openpgp.PublicKey | null = null;
  if (privateKey) {
    try {
      publicKey = (await openpgp.readPrivateKey({ armoredKey: privateKey })).toPublic();
    } catch {
      // Verification is best-effort; without it every post is re-signed.
    }
  }

  console.log('Starting PGP signing process...');
  console.log(`Vault Directory: ${VAULT_DIR}`);

  if (useSystemGpg) {
    console.log(`Method: System GPG ${KEY_ID ? `(Key ID: ${KEY_ID})` : '(Default Key)'}`);
  } else {
    console.log('Method: OpenPGP.js (Env Key)');
  }

  const vaultAssetsDir = path.join(VAULT_DIR, 'assets');
  const signaturesDir = path.join(vaultAssetsDir, 'signatures');

  if (!fs.existsSync(signaturesDir)) {
    fs.mkdirSync(signaturesDir, { recursive: true });
  }

  // Find all .md files recursively
  const files: string[] = [];

  async function traverse(dir: string) {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'assets' && !entry.name.startsWith('.')) {
          await traverse(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await traverse(VAULT_DIR);
  console.log(`Found ${files.length} markdown files.`);

  const processor = VaultProcessor.forVault(VAULT_DIR, ASSETS_DIR);

  const tally = { signed: 0, 'up-to-date': 0, skipped: 0, failed: 0 };
  for (const file of files) {
    const result = await processFile(
      file,
      vaultAssetsDir,
      processor,
      privateKey,
      useSystemGpg,
      publicKey,
    );
    tally[result]++;
  }

  console.log(
    `\nSigning complete: ${tally.signed} signed, ${tally['up-to-date']} up to date, ` +
      `${tally.skipped} skipped, ${tally.failed} failed.`,
  );
}

main().catch(console.error);
