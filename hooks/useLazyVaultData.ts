import { useState, useEffect } from 'react';
import { VaultNode } from '../types/vault';
import { getVaultData, getVaultDataSync } from '../lib/vault-cache';

/**
 * Lazy hook to load vault data only when needed (e.g., for search)
 * Uses global cache to prevent multiple fetches
 */
export function useLazyVaultData(): [VaultNode[], boolean, () => void, boolean] {
  // Always initialize with empty array to match SSR and prevent hydration mismatch
  const [vaultData, setVaultData] = useState<VaultNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cached data on mount if available
  useEffect(() => {
    const cached = getVaultDataSync();
    if (cached) {
      setVaultData(cached);
      setIsLoaded(true);
    }
  }, []);

  const loadVaultData = async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);

    try {
      const data = await getVaultData();
      setVaultData(data);
      setIsLoaded(true);
    } catch (error) {
      console.warn('Failed to load vault data:', error);
      setVaultData([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  return [vaultData, isLoading, loadVaultData, isLoaded];
}
