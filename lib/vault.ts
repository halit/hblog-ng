import fs from 'fs';
import path from 'path';
import { VaultNode } from '@/types/vault';
import { FALLBACK_VAULT_DATA } from '@/config/constants';
import { getNodeSortDate } from '@/utils';
import { getNodeKeywords } from '@/utils/keywords';
import { extractInternalLinks, linkMatchesNode } from './routing';

// Module-level cache for server-side vault data
let cachedVaultData: VaultNode[] | null = null;

/**
 * Load vault data from JSON file (cached)
 * Used for static generation at build time
 */
export function loadVaultData(): VaultNode[] {
  // Return cached data if available (skip in development to allow live updates)
  if (cachedVaultData !== null && process.env.NODE_ENV !== 'development') {
    return cachedVaultData;
  }

  try {
    // Try to load from data/vault.json first (Full content for SSG)
    const internalPath = path.join(process.cwd(), 'data', 'vault.json');
    if (fs.existsSync(internalPath)) {
      const data = JSON.parse(fs.readFileSync(internalPath, 'utf-8'));
      cachedVaultData = data;
      return data;
    }

    // Try to load from public/vault.json (Lite content as fallback)
    const publicPath = path.join(process.cwd(), 'public', 'vault.json');
    if (fs.existsSync(publicPath)) {
      const data = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
      cachedVaultData = data;
      return data;
    }

    // Final fallback
    cachedVaultData = FALLBACK_VAULT_DATA;
    return FALLBACK_VAULT_DATA;
  } catch (error) {
    console.error('Failed to load vault data:', error);
    cachedVaultData = FALLBACK_VAULT_DATA;
    return FALLBACK_VAULT_DATA;
  }
}

/**
 * Get nodes filtered by type, with optional sorting (newest first).
 */
export function getNodesByType(type: VaultNode['type'] | 'blog', sortNewest = true): VaultNode[] {
  const vaultData = loadVaultData();
  const filtered = vaultData.filter((n) => n.type === type);

  if (!sortNewest) return filtered;

  return [...filtered].sort((a, b) => {
    return getNodeSortDate(b) - getNodeSortDate(a);
  });
}

/**
 * Get all unique keywords across all nodes.
 */
export function getAllKeywords(): string[] {
  const allKeywords = new Set<string>();
  for (const node of loadVaultData()) {
    for (const kw of getNodeKeywords(node)) allKeywords.add(kw);
  }
  return Array.from(allKeywords).sort();
}

/**
 * Get all nodes matching a specific keyword (case-insensitive).
 */
export function getNodesByKeyword(keyword: string): VaultNode[] {
  const normalized = keyword.toLowerCase();
  return loadVaultData().filter((node) => {
    if (
      node.type === 'system' ||
      node.id === 'root' ||
      node.id === 'home' ||
      node.exclude_from_graph
    ) {
      return false;
    }
    return getNodeKeywords(node).includes(normalized);
  });
}

/**
 * Get related nodes (backlinks) - uses related_ids injected during build
 * Excludes system type posts (including root.md) from related nodes
 */
export function getRelatedNodes(node: VaultNode): VaultNode[] {
  const vaultData = loadVaultData();

  // Helper function to check if a node should be excluded from related nodes
  const shouldExcludeFromRelated = (n: VaultNode): boolean => {
    return n.type === 'system' || n.id === 'home' || n.id === 'root';
  };

  // Use related_ids if available (injected during build)
  if (node.related_ids && node.related_ids.length > 0) {
    // Create a map for O(1) lookup if vaultData is large, or just use filter since we have IDs
    const relatedMap = new Map(vaultData.map((n) => [n.id, n]));
    return node.related_ids
      .map((id) => relatedMap.get(id))
      .filter((n): n is VaultNode => n !== undefined && !shouldExcludeFromRelated(n));
  }

  // Fallback: determine from internal links if related_ids not available
  const links = extractInternalLinks(node.content);
  if (links.length === 0) return [];

  const related: VaultNode[] = [];

  for (const n of vaultData) {
    if (n.id === node.id || shouldExcludeFromRelated(n)) continue;

    for (const linkLabel of links) {
      if (linkMatchesNode(linkLabel, n)) {
        related.push(n);
        break;
      }
    }
  }

  return related;
}
