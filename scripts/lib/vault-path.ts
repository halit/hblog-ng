import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get vault path from environment variable or fallback to default
 *
 * Priority:
 * 1. VAULT_PATH environment variable
 * 2. Fallback to local vault directory (for backward compatibility)
 *
 * @returns Resolved absolute path to the vault directory
 */
export function getVaultPath(): string {
  const envVaultPath = process.env.VAULT_PATH;
  if (envVaultPath) {
    return path.resolve(envVaultPath);
  }
  // Fallback to local vault directory for backward compatibility
  return path.resolve(__dirname, '../../vault');
}

/**
 * Get vault path with support for CLI argument override
 *
 * Priority:
 * 1. CLI argument (if provided)
 * 2. VAULT_PATH environment variable
 * 3. Fallback to local vault directory
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
