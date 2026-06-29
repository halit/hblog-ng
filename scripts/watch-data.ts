import { watch } from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import debounce from 'just-debounce-it';
import { getVaultPath } from './pipeline/vault-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const vaultDir = getVaultPath();

let isRunning = false;
let pendingChange = false;

function runParser() {
  if (isRunning) {
    pendingChange = true;
    return;
  }

  isRunning = true;
  console.log('🔄 Change detected, re-parsing vault...');

  // Run both parse-vault and parse-bibtex
  exec('npm run parse-vault && npm run parse-bibtex', { cwd: rootDir }, (error) => {
    isRunning = false;

    if (error) {
      console.error(`❌ Error during re-parsing: ${error.message}`);
    } else {
      console.log('✅ Vault re-parsed successfully');
    }

    if (pendingChange) {
      pendingChange = false;
      runParser();
    }
  });
}

const debouncedRunParser = debounce(runParser, 500);

console.log(`👀 Watching for changes in ${vaultDir}...`);

watch(vaultDir, { recursive: true }, (event, filename) => {
  if (filename && (filename.endsWith('.md') || filename.endsWith('.bib'))) {
    debouncedRunParser();
  }
});
