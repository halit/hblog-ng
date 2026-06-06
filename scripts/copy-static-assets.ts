import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVaultPath } from './lib/vault-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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
