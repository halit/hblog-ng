/**
 * Global client-side cache for vault data
 * Prevents multiple fetches of vault.json
 */

import { VaultNode } from '@/types/vault';
import { FALLBACK_VAULT_DATA } from '@/config/constants';
import { getWindowGlobals } from './window-globals';

// Global cache with expiration (15 minutes) - disabled in development
const CACHE_EXPIRATION_MS = process.env.NODE_ENV === 'development' ? 0 : 15 * 60 * 1000;

interface CachedData {
  data: VaultNode[];
  timestamp: number;
}

let vaultDataCache: CachedData | null = null;
let vaultDataPromise: Promise<VaultNode[]> | null = null;

/**
 * Check if cache is still valid
 */
function isCacheValid(cache: CachedData | null): boolean {
  if (!cache) return false;
  const now = Date.now();
  return now - cache.timestamp < CACHE_EXPIRATION_MS;
}

/**
 * Get vault data from cache or fetch it
 * Returns a promise that resolves to the vault data
 */
export async function getVaultData(): Promise<VaultNode[]> {
  // Return cached data if still valid
  if (vaultDataCache !== null && isCacheValid(vaultDataCache)) {
    return vaultDataCache.data;
  }

  // Cache expired — clear it
  vaultDataCache = null;

  // Reuse an in-flight fetch rather than starting a second one
  if (vaultDataPromise !== null) {
    return vaultDataPromise;
  }

  // Create new fetch promise
  vaultDataPromise = (async () => {
    try {
      // Priority 1: Use server-side injected data
      const { __VAULT_DATA__ } = getWindowGlobals();
      if (__VAULT_DATA__) {
        vaultDataCache = { data: __VAULT_DATA__, timestamp: Date.now() };
        return __VAULT_DATA__;
      }

      // Priority 2: Fetch from vault.json (no-cache to ensure fresh data)
      const response = await fetch('/vault.json', {
        cache: 'no-cache', // Always fetch fresh data
      });

      if (response.ok) {
        const data = await response.json();
        vaultDataCache = { data, timestamp: Date.now() };
        return data;
      }
    } catch (error) {
      console.warn('Failed to load vault.json:', error);
    }

    // Priority 3: Fallback
    const data = FALLBACK_VAULT_DATA;
    vaultDataCache = { data, timestamp: Date.now() };
    return data;
  })();

  return vaultDataPromise;
}

/**
 * Get vault data synchronously if available in cache
 * Returns null if not cached yet
 */
export function getVaultDataSync(): VaultNode[] | null {
  // Try server-side injected data first
  const { __VAULT_DATA__ } = getWindowGlobals();
  if (__VAULT_DATA__) {
    if (!vaultDataCache || !isCacheValid(vaultDataCache)) {
      vaultDataCache = { data: __VAULT_DATA__, timestamp: Date.now() };
    }
    return vaultDataCache.data;
  }

  // Return cached data if valid
  if (vaultDataCache && isCacheValid(vaultDataCache)) {
    return vaultDataCache.data;
  }

  return null;
}

/**
 * Clear the cache (useful for development/testing)
 */
export function clearVaultCache(): void {
  vaultDataCache = null;
  vaultDataPromise = null;
}

/**
 * Force refresh vault data (clears cache and fetches fresh)
 */
export async function refreshVaultData(): Promise<VaultNode[]> {
  clearVaultCache();
  return getVaultData();
}

// Expose clearVaultCache to window for browser console access
if (typeof window !== 'undefined') {
  const win = window as unknown as {
    clearVaultCache: typeof clearVaultCache;
    refreshVaultData: typeof refreshVaultData;
  };
  win.clearVaultCache = clearVaultCache;
  win.refreshVaultData = refreshVaultData;
}
