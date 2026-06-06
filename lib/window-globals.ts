/**
 * Typed accessors for globals injected into `window` by Next.js page scripts.
 * Centralises the `as unknown as` casts so they only live in one place.
 */

import type { VaultNode } from '@/types/vault';

interface InjectedWindowGlobals {
  /** Lite vault data injected server-side for the graph / search client */
  __VAULT_DATA__?: VaultNode[];
  /** Full node data for the current detail page, injected server-side */
  __INITIAL_NODE__?: VaultNode;
}

/**
 * Returns the typed injected globals from `window`.
 * Returns an empty object when called on the server (SSR/SSG).
 */
export function getWindowGlobals(): InjectedWindowGlobals {
  if (typeof window === 'undefined') return {};
  return window as unknown as InjectedWindowGlobals;
}
