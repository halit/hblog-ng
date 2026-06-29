import { useState, useEffect } from 'react';
import { VaultNode } from '@/types/vault';
import { getVaultData, getVaultDataSync } from '@/lib/vault-cache';
import { getWindowGlobals } from '@/lib/window-globals';

/**
 * Hook to load vault data dynamically (uses global cache)
 * Priority 1: Server-side injected data (window.__VAULT_DATA__)
 * Priority 2: Fetch from vault.json (cached)
 * Priority 3: Fallback to FALLBACK_VAULT_DATA
 */
export function useVaultData(): VaultNode[] {
  // Try to get cached data synchronously first
  const [vaultData, setVaultData] = useState<VaultNode[]>(() => {
    const cached = getVaultDataSync();
    if (cached) return cached;

    // Fallback to server-side injected data
    const { __VAULT_DATA__ } = getWindowGlobals();
    if (__VAULT_DATA__) return __VAULT_DATA__;

    return [];
  });

  useEffect(() => {
    const loadVaultData = async () => {
      if (typeof window === 'undefined') return;

      // Get from cache (will fetch if needed)
      const data = await getVaultData();

      // Merge initial node if present (for detail pages)
      const { __INITIAL_NODE__: initialNode } = getWindowGlobals();
      if (initialNode) {
        const index = data.findIndex((n: VaultNode) => n.id === initialNode.id);
        if (index >= 0) {
          const updated = [...data];
          updated[index] = initialNode;
          setVaultData(updated);
          return;
        }
      }

      setVaultData(data);
    };

    // Only fetch if we don't have data yet
    if (vaultData.length === 0) {
      loadVaultData();
    }
  }, [vaultData.length]);

  return vaultData;
}
