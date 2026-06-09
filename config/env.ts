/**
 * Environment configuration.
 *
 * Defaults live in the committed `.env` file (public `NEXT_PUBLIC_*` values),
 * not here. Next.js loads `.env` automatically for dev and build; override any
 * value with a git-ignored `.env.local`.
 *
 * Public `NEXT_PUBLIC_*` vars are listed once in `STATIC_ENV` (literal
 * `process.env.*` accesses so Next.js can inline them into the client bundle)
 * and read through `pub`, which falls back to a `window.__ENV__` runtime
 * injection and then the supplied default.
 *
 * The app version is the single exception: it comes straight from
 * `package.json` (the one place a version lives), not from the environment.
 */

import { version as packageVersion } from '../package.json';

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

/**
 * Statically-referenced env vars.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` into the client bundle when
 * each var is accessed as a literal — a dynamic `process.env[key]` lookup is
 * NOT replaced and returns `undefined` in the browser. Listing every public var
 * here keeps server and client in agreement (avoiding hydration mismatches).
 */
const STATIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SITE_TITLE: process.env.NEXT_PUBLIC_SITE_TITLE,
  NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_AUTHOR_NAME: process.env.NEXT_PUBLIC_AUTHOR_NAME,
  NEXT_PUBLIC_AUTHOR_EMAIL: process.env.NEXT_PUBLIC_AUTHOR_EMAIL,
  NEXT_PUBLIC_TWITTER_HANDLE: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
  NEXT_PUBLIC_LINKEDIN_HANDLE: process.env.NEXT_PUBLIC_LINKEDIN_HANDLE,
  NEXT_PUBLIC_GITHUB_HANDLE: process.env.NEXT_PUBLIC_GITHUB_HANDLE,
  NEXT_PUBLIC_PGP_PRIVATE_KEY: process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY,
  NEXT_PUBLIC_PGP_PUBLIC_KEY: process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY,
  NEXT_PUBLIC_PGP_KEY_ID: process.env.NEXT_PUBLIC_PGP_KEY_ID,
  NEXT_PUBLIC_PGP_PASSPHRASE: process.env.NEXT_PUBLIC_PGP_PASSPHRASE,
  NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH: process.env.NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH,
  NEXT_PUBLIC_PGP_PUBLIC_KEY_PATH: process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY_PATH,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
};

/**
 * Reads a public env var from the inlined `STATIC_ENV` map, falling back to a
 * `window.__ENV__` runtime injection and then the supplied default. Every
 * `NEXT_PUBLIC_*` value flows through here, so each key is named exactly once
 * (in `STATIC_ENV`).
 */
function pub(key: keyof typeof STATIC_ENV, defaultValue = ''): string {
  const value = STATIC_ENV[key];
  if (value !== undefined) return value;

  // Browser runtime — check window.__ENV__ (optional injection)
  if (typeof window !== 'undefined') {
    const env = (window as unknown as { __ENV__?: Record<string, string> }).__ENV__;
    if (env?.[key]) return env[key];
  }

  return defaultValue;
}

export const config: AppConfig = {
  siteTitle: pub('NEXT_PUBLIC_SITE_TITLE'),
  siteDescription: pub('NEXT_PUBLIC_SITE_DESCRIPTION'),
  siteUrl: pub('NEXT_PUBLIC_SITE_URL'),
  authorName: pub('NEXT_PUBLIC_AUTHOR_NAME'),
  authorEmail: pub('NEXT_PUBLIC_AUTHOR_EMAIL'),
  twitterHandle: pub('NEXT_PUBLIC_TWITTER_HANDLE'),
  linkedinHandle: pub('NEXT_PUBLIC_LINKEDIN_HANDLE'),
  githubHandle: pub('NEXT_PUBLIC_GITHUB_HANDLE'),

  // Server-only — never reaches the browser, so a dynamic read is fine.
  vaultPath: process.env.VAULT_PATH || undefined,

  pgpPrivateKey: pub('NEXT_PUBLIC_PGP_PRIVATE_KEY') || undefined,
  pgpPublicKey: pub('NEXT_PUBLIC_PGP_PUBLIC_KEY') || undefined,
  pgpKeyId: pub('NEXT_PUBLIC_PGP_KEY_ID') || undefined,
  pgpPassphrase: pub('NEXT_PUBLIC_PGP_PASSPHRASE') || undefined,
  pgpPrivateKeyPath: pub('NEXT_PUBLIC_PGP_PRIVATE_KEY_PATH') || undefined,
  pgpPublicKeyPath: pub('NEXT_PUBLIC_PGP_PUBLIC_KEY_PATH') || undefined,

  appVersion: packageVersion,
  baseUrl: pub('NEXT_PUBLIC_BASE_URL'),
  buildMode: pub('NODE_ENV', 'development') as AppConfig['buildMode'],
};
