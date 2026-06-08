import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import * as openpgp from 'openpgp';
import 'dotenv/config';

import { getVaultPath } from './lib/vault-path';
import { VaultProcessor } from './lib/processor';

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
) {
  // Sign exactly what the site publishes as `node.content` (processed body,
  // trimmed) so the in-browser Verify button matches the served content.
  const bodyToSign = await processor.getSignableContent(filePath);

  if (!bodyToSign) {
    console.log(`  ! Skipping empty body: ${path.basename(filePath)}`);
    return;
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

    const filename = path.basename(filePath, '.md');
    const sigPath = path.join(vaultAssetsDir, 'signatures', `${filename}.asc`);

    await fsPromises.writeFile(sigPath, signature);
    console.log(`  ✓ Signed: ${filename}`);
  } catch (error) {
    console.error(`  ✗ Failed to sign ${path.basename(filePath)}:`, error);
  }
}

async function main() {
  const privateKey = await getPrivateKey();
  let useSystemGpg = false;

  if (!privateKey) {
    const gpgAvailable = await checkGpgAvailable();
    if (gpgAvailable) {
      console.log('Private key not found in environment, falling back to system GPG.');
      useSystemGpg = true;
    } else {
      console.error(
        'Error: NEXT_PUBLIC_PGP_PRIVATE_KEY or NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH not set, and system GPG not available.',
      );
      process.exit(1);
    }
  }

  console.log('Starting PGP signing process...');
  console.log(`Vault Directory: ${VAULT_DIR}`);

  if (!fs.existsSync(VAULT_DIR)) {
    console.error(`Error: Vault directory not found: ${VAULT_DIR}`);
    console.error('Please set VAULT_PATH environment variable');
    console.error('Example: VAULT_PATH=/path/to/vault npm run sign-posts');
    process.exit(1);
  }

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

  for (const file of files) {
    await processFile(file, vaultAssetsDir, processor, privateKey, useSystemGpg);
  }

  console.log('\nSigning complete.');
}

main().catch(console.error);
