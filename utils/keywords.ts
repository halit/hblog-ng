import type { VaultNode } from '@/types/vault';

/**
 * Returns the normalised keyword list for a node.
 * Prefers `keywords`; falls back to the legacy `stack` field.
 * All entries are lowercased strings.
 */
export function getNodeKeywords(node: VaultNode): string[] {
  const raw = node.keywords?.length ? node.keywords : (node.stack ?? []);
  return raw.map((k) => String(k).toLowerCase());
}
