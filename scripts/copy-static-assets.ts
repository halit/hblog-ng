import './pipeline/load-env';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVaultPath } from './pipeline/vault-path.js';
import { config } from '@/config/env';
import pkg from '../package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Pin a major version like "^19.2.0" → "19" for display in humans.txt.
function majorVersion(range: string | undefined): string {
  const match = (range ?? '').match(/\d+/);
  return match ? match[0] : '';
}

// Generate the identity-bearing well-known files from `config` so they never
// drift from `.env`. These used to be hand-committed and silently held stale
// handles/email; sourcing them here keeps every field in one place.
function generateMetaFiles() {
  console.log('Generating humans.txt and security.txt from config...');

  const siteUrl = config.siteUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const reactMajor = majorVersion(pkg.dependencies?.react);
  const nextMajor = majorVersion(pkg.dependencies?.next);

  const humans = `/* TEAM */
Developer: ${config.authorName}
Contact: mailto:${config.authorEmail}
Twitter: https://twitter.com/${config.twitterHandle}
LinkedIn: https://www.linkedin.com/in/${config.linkedinHandle}
GitHub: https://github.com/${config.githubHandle}

/* SITE */
Last update: ${today}
Standards: HTML5, CSS3, TypeScript
Components: React ${reactMajor}, Next.js ${nextMajor}
Software: Obsidian, Git
`;

  // security.txt requires an Expires within the next year (RFC 9116). Stamp it
  // one year out from the build so it stays valid as long as the site is rebuilt.
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const security = `Contact: mailto:${config.authorEmail}
Policy: ${siteUrl}/bug-bounty/
Encryption: ${siteUrl}/public-key.asc
Preferred-Languages: en
Canonical: ${siteUrl}/.well-known/security.txt
Expires: ${expires.toISOString()}

# Found a vulnerability or exposed data? Please report it.
# See the bug bounty page for what to report, rewards, and how:
# ${siteUrl}/bug-bounty/
`;

  const publicDir = path.join(projectRoot, 'public');
  const wellKnownDir = path.join(publicDir, '.well-known');
  if (!fs.existsSync(wellKnownDir)) {
    fs.mkdirSync(wellKnownDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'humans.txt'), humans);
  fs.writeFileSync(path.join(wellKnownDir, 'security.txt'), security);
}

function main() {
  console.log('Copying static assets...');

  // Mermaid
  const mermaidSrc = path.join(projectRoot, 'node_modules', 'mermaid', 'dist');
  const mermaidDest = path.join(projectRoot, 'public', 'mermaid');

  if (fs.existsSync(mermaidSrc)) {
    console.log('Copying Mermaid assets...');
    if (!fs.existsSync(mermaidDest)) {
      fs.mkdirSync(mermaidDest, { recursive: true });
    }
    // Copy minified js
    const jsSrc = path.join(mermaidSrc, 'mermaid.min.js');
    if (fs.existsSync(jsSrc)) {
      fs.copyFileSync(jsSrc, path.join(mermaidDest, 'mermaid.min.js'));
    }
  } else {
    console.warn('Mermaid node_modules not found. Skipping.');
  }

  // Vault Assets
  const vaultAssetsSrc = path.join(getVaultPath(), 'assets');
  const vaultAssetsDest = path.join(projectRoot, 'public', 'assets');

  if (fs.existsSync(vaultAssetsSrc)) {
    console.log('Copying Vault assets...');
    copyRecursiveSync(vaultAssetsSrc, vaultAssetsDest);
  } else {
    console.warn('Vault assets directory not found. Skipping.');
  }

  generateMetaFiles();

  console.log('Static assets copied successfully.');
}

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

main();
