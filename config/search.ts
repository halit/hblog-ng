/**
 * Shared MiniSearch configuration for the knowledge graph search index.
 * Used at build time (parse-vault) and client load time (search-client).
 */

export const SEARCH_INDEX_CONFIG = {
  fields: ['title', 'content', 'description', 'keywords', 'stack'],
  storeFields: ['id', 'title', 'description', 'type', 'keywords'],
  searchOptions: {
    boost: { title: 2, keywords: 1.5, stack: 1.5, description: 1.2 },
    fuzzy: 0.2,
  },
};

// Client adds prefix matching on top of base config.
export const CLIENT_SEARCH_OPTIONS = {
  ...SEARCH_INDEX_CONFIG.searchOptions,
  prefix: true,
} as const;
