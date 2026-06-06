import { VaultNode } from '@/types/vault';

/**
 * Extract slug from ID (handles both old format and new type:slug format)
 * @param id - The node ID (e.g., "blog:system-capabilities" or "system-capabilities")
 * @returns The slug part of the ID
 */
export function extractSlugFromId(id: string): string {
  const colon = id.indexOf(':');
  return colon === -1 ? id : id.substring(colon + 1);
}

/**
 * Get the URL path for a node based on its ID and type
 * @param id - The node ID
 * @param node - Optional node object for type information
 * @returns The URL path (e.g., "/posts/system-capabilities")
 */
export function getPathFromId(id: string, node?: VaultNode): string {
  // Index pages
  if (id === 'home') return '/';
  if (id === 'posts_index') return '/posts';
  if (id === 'projects_index') return '/projects';
  if (id === 'research_index') return '/research';
  if (id === 'about') return '/about';

  // Keyword pages (format: keywords:keywordname)
  if (id.startsWith('keywords:')) {
    const keyword = id.replace('keywords:', '');
    return `/keywords/${encodeURIComponent(keyword.toLowerCase())}`;
  }

  // Extract slug from new ID format (type:slug)
  const slug = extractSlugFromId(id);

  // Detail pages - determine type from node
  if (node) {
    if (node.type === 'blog') return `/posts/${slug}`;
    if (node.type === 'project') return `/projects/${slug}`;
    if (node.type === 'research') return `/research/${slug}`;
    if (node.type === 'profile' || node.id === 'about') return '/about';
  }

  // Fallback: assume it's a post
  return `/posts/${slug}`;
}

/**
 * Find a node by slug or full ID
 * Useful for route handlers that receive slug in URL but need to find node by ID
 * @param vaultData - Array of all vault nodes
 * @param slugOrId - The slug or full ID to search for
 * @param type - Optional type filter
 * @returns The matching node or undefined
 */
export function findNodeBySlugOrId(
  vaultData: VaultNode[],
  slugOrId: string,
  type?: VaultNode['type'],
): VaultNode | undefined {
  return vaultData.find((n) => {
    const slug = extractSlugFromId(n.id);
    const matchesSlug = slug === slugOrId;
    const matchesId = n.id === slugOrId;
    const matchesAlias = n.aliases?.includes(slugOrId);
    const matchesType = type ? n.type === type : true;
    return (matchesSlug || matchesId || matchesAlias) && matchesType;
  });
}

/**
 * Extract all internal links [[link]] from markdown content
 */
export function extractInternalLinks(content: string): string[] {
  if (!content) return [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: Set<string> = new Set();
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.add(match[1].trim());
  }
  return Array.from(links);
}

/**
 * Match a link label to a node (optimized)
 */
export function linkMatchesNode(linkLabel: string, node: VaultNode): boolean {
  const lowerLabel = linkLabel.toLowerCase();
  const normalizedLabel = lowerLabel.replace(/\s+/g, '-');
  const slug = extractSlugFromId(node.id).toLowerCase();

  // Check ID first
  if (
    node.id.toLowerCase() === lowerLabel ||
    node.id.toLowerCase() === normalizedLabel ||
    slug === lowerLabel ||
    slug === normalizedLabel
  ) {
    return true;
  }

  // Check Title
  const lowerTitle = node.title.toLowerCase();
  if (lowerTitle === lowerLabel || lowerTitle.replace(/\s+/g, '-') === normalizedLabel) {
    return true;
  }

  // Check Aliases
  if (node.aliases) {
    return node.aliases.some((alias) => {
      const lowerAlias = alias.toLowerCase();
      return lowerAlias === lowerLabel || lowerAlias.replace(/\s+/g, '-') === normalizedLabel;
    });
  }

  return false;
}
