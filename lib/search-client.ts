import MiniSearch, { SearchResult as MiniSearchResult } from 'minisearch';
import { VaultNode } from '@/types/vault';
import { SEARCH_INDEX_CONFIG, CLIENT_SEARCH_OPTIONS } from '@/config/search';

// Helper to lazily load the search index
let searchIndex: MiniSearch | null = null;
let searchIndexPromise: Promise<MiniSearch> | null = null;

export interface EnhancedSearchResult extends MiniSearchResult {
  node?: VaultNode;
}

// Helper to create regex for highlighting (moved from lib/search.ts)
export const createSearchRegex = (query: string): RegExp => {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escapedQuery.replace(/\s+/g, '[\\s\\n]+');
  return new RegExp(`(${pattern})`, 'gi');
};

export const loadSearchIndex = async (): Promise<MiniSearch> => {
  if (searchIndex) return searchIndex;
  if (searchIndexPromise) return searchIndexPromise;

  searchIndexPromise = (async () => {
    try {
      const response = await fetch('/search-index.json');
      if (!response.ok) {
        throw new Error('Failed to load search index');
      }
      const indexData = await response.text();

      searchIndex = MiniSearch.loadJSON(indexData, {
        fields: SEARCH_INDEX_CONFIG.fields,
        storeFields: SEARCH_INDEX_CONFIG.storeFields,
        searchOptions: CLIENT_SEARCH_OPTIONS,
      });

      return searchIndex;
    } catch (error) {
      console.error('Error loading search index:', error);
      // Return empty index in case of error to prevent crashes
      return new MiniSearch({ fields: ['title'] });
    } finally {
      searchIndexPromise = null;
    }
  })();

  return searchIndexPromise;
};

export const performSearch = async (
  query: string,
  vaultData: VaultNode[],
): Promise<EnhancedSearchResult[]> => {
  if (!query.trim()) return [];

  const miniSearch = await loadSearchIndex();

  // Perform the search
  const results = miniSearch.search(query);

  // Map results to include the full node data from vaultData (if needed for display)
  // Note: vaultData (lite) is used for display, while the index was used for searching
  const vaultMap = new Map(vaultData.map((node) => [node.id, node]));

  return results.map((result) => {
    return {
      ...result,
      node: vaultMap.get(result.id),
    };
  });
};
