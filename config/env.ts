/**
 * Environment configuration
 * Loads environment variables with defaults.
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

  // API keys
  geminiApiKey?: string;

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
  siteTitle: getEnv('NEXT_PUBLIC_SITE_TITLE', 'Halit Alptekin'),
  siteDescription: getEnv(
    'NEXT_PUBLIC_SITE_DESCRIPTION',
    'Malware, reverse engineering, and offensive security research.',
  ),
  siteUrl: getEnv('NEXT_PUBLIC_SITE_URL', 'https://halit.alptekin.im'),
  authorName: getEnv('NEXT_PUBLIC_AUTHOR_NAME', 'Halit Alptekin'),
  authorEmail: getEnv('NEXT_PUBLIC_AUTHOR_EMAIL', 'halit@alptekin.im'),
  twitterHandle: getEnv('NEXT_PUBLIC_TWITTER_HANDLE', 'halitalptekin'),
  linkedinHandle: getEnv('NEXT_PUBLIC_LINKEDIN_HANDLE', 'halitalptekin'),
  githubHandle: getEnv('NEXT_PUBLIC_GITHUB_HANDLE', 'halitalptekin'),

  vaultPath: getEnv('VAULT_PATH') || undefined,

  pgpPrivateKey: getEnv('NEXT_PUBLIC_PGP_PRIVATE_KEY') || undefined,
  pgpPublicKey: getEnv('NEXT_PUBLIC_PGP_PUBLIC_KEY') || undefined,
  pgpKeyId: getEnv('NEXT_PUBLIC_PGP_KEY_ID') || undefined,
  pgpPassphrase: getEnv('NEXT_PUBLIC_PGP_PASSPHRASE') || undefined,
  pgpPrivateKeyPath: getEnv('NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH') || undefined,
  pgpPublicKeyPath: getEnv('NEXT_PUBLIC_PGP_PUBLIC_KEY_PATH') || undefined,

  geminiApiKey: getEnv('NEXT_PUBLIC_GEMINI_API_KEY') || undefined,

  appVersion: getEnv('NEXT_PUBLIC_APP_VERSION', '0.1.0'),
  baseUrl: getEnv('NEXT_PUBLIC_BASE_URL', ''),
  buildMode: getEnv('NODE_ENV', 'development') as AppConfig['buildMode'],
};
