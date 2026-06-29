import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_VAULT = path.resolve(__dirname, '../../vault');
const EXAMPLE_VAULT = path.resolve(__dirname, '../../example-vault');

/**
 * Get vault path from environment variable or fallback to a sensible default.
 *
 * Content is no longer committed to this repo — it's expected to live in a
 * separate Obsidian vault, pointed at via VAULT_PATH or bind-mounted at
 * `vault/` (see `.devcontainer/devcontainer.json`).
 *
 * Priority:
 * 1. VAULT_PATH environment variable
 * 2. A local `vault/` directory if present (e.g. an externally mounted vault)
 * 3. The bundled `example-vault/` so a fresh clone renders the demo out of the box
 *
 * @returns Resolved absolute path to the vault directory
 */
export function getVaultPath(): string {
  const envVaultPath = process.env.VAULT_PATH;
  if (envVaultPath) {
    return path.resolve(envVaultPath);
  }
  if (fs.existsSync(LOCAL_VAULT)) {
    return LOCAL_VAULT;
  }
  return EXAMPLE_VAULT;
}

/**
 * Get vault path with support for CLI argument override
 *
 * Priority:
 * 1. CLI argument (if provided)
 * 2. VAULT_PATH environment variable
 * 3. A local `vault/` directory if present
 * 4. The bundled `example-vault/`
 *
 * @param cliArg - Optional CLI argument path
 * @returns Resolved absolute path to the vault directory
 */
export function getVaultPathWithOverride(cliArg?: string): string {
  if (cliArg) {
    return path.resolve(cliArg);
  }
  return getVaultPath();
}
