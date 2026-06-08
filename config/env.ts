/**
 * Environment configuration.
 *
 * Defaults live in the committed `.env` file (public `NEXT_PUBLIC_*` values),
 * not here. Next.js loads `.env` automatically for dev and build; override any
 * value with a git-ignored `.env.local`.
 *
 * `getEnv` reads from process.env (Node / Next.js build) first, then falls
 * back to window.__ENV__ (runtime injection), then to the supplied default.
 * Every field in `config` calls getEnv exactly once — no double-reads.
 */

export interface AppConfig {
  // Site metadata
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  authorName: string;
  authorEmail: string;

  // Social links
  twitterHandle: string;
  linkedinHandle: string;
  githubHandle: string;

  // Vault configuration
  vaultPath?: string;

  // PGP signing (can be file paths or raw content)
  pgpPrivateKey?: string;
  pgpPublicKey?: string;
  pgpKeyId?: string;
  pgpPassphrase?: string;
  pgpPrivateKeyPath?: string;
  pgpPublicKeyPath?: string;

  // App version
  appVersion: string;

  // Build settings
  baseUrl: string;
  buildMode: 'development' | 'production' | 'test';
}

function getEnv(key: string, defaultValue = ''): string {
  // Node.js / Next.js build environment
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (value !== undefined) return value;
  }

  // Browser runtime — check window.__ENV__ (optional injection)
  if (typeof window !== 'undefined') {
    const env = (window as unknown as { __ENV__?: Record<string, string> }).__ENV__;
    if (env?.[key]) return env[key];
  }

  return defaultValue;
}

export const config: AppConfig = {
  siteTitle: getEnv('NEXT_PUBLIC_SITE_TITLE'),
  siteDescription: getEnv('NEXT_PUBLIC_SITE_DESCRIPTION'),
  siteUrl: getEnv('NEXT_PUBLIC_SITE_URL'),
  authorName: getEnv('NEXT_PUBLIC_AUTHOR_NAME'),
  authorEmail: getEnv('NEXT_PUBLIC_AUTHOR_EMAIL'),
  twitterHandle: getEnv('NEXT_PUBLIC_TWITTER_HANDLE'),
  linkedinHandle: getEnv('NEXT_PUBLIC_LINKEDIN_HANDLE'),
  githubHandle: getEnv('NEXT_PUBLIC_GITHUB_HANDLE'),

  vaultPath: getEnv('VAULT_PATH') || undefined,

  pgpPrivateKey: getEnv('NEXT_PUBLIC_PGP_PRIVATE_KEY') || undefined,
  pgpPublicKey: getEnv('NEXT_PUBLIC_PGP_PUBLIC_KEY') || undefined,
  pgpKeyId: getEnv('NEXT_PUBLIC_PGP_KEY_ID') || undefined,
  pgpPassphrase: getEnv('NEXT_PUBLIC_PGP_PASSPHRASE') || undefined,
  pgpPrivateKeyPath: getEnv('NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH') || undefined,
  pgpPublicKeyPath: getEnv('NEXT_PUBLIC_PGP_PUBLIC_KEY_PATH') || undefined,

  appVersion: getEnv('NEXT_PUBLIC_APP_VERSION'),
  baseUrl: getEnv('NEXT_PUBLIC_BASE_URL'),
  buildMode: getEnv('NODE_ENV', 'development') as AppConfig['buildMode'],
};
