import type { VaultNode } from '@/types/vault';

/**
 * Helper to get the most relevant date for sorting a node.
 * Priority: created > year > updated
 */
export function getNodeSortDate(node: VaultNode): number {
  if (node.created) return new Date(node.created).getTime();
  if (node.year) return new Date(node.year).getTime();
  return new Date(node.updated).getTime();
}

/**
 * Comparator that sorts nodes newest-first by their sort date.
 * Usage: `nodes.sort(byNewest)`.
 */
export function byNewest(a: VaultNode, b: VaultNode): number {
  return getNodeSortDate(b) - getNodeSortDate(a);
}
