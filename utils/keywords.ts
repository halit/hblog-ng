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

/**
 * Returns the preferred publication / venue string.
 * Prefers the modern `published_in`; falls back to legacy `publication`.
 */
export function getPublication(node: VaultNode): string | undefined {
  return node.published_in || node.publication || undefined;
}

/**
 * Returns the first usable reference key (for BibTeX lookup) or raw bibtex string.
 * Prefers the modern `references` array; falls back to legacy `bibtex` field.
 */
export function getPrimaryReference(node: VaultNode): string | undefined {
  if (node.references && node.references.length > 0) {
    return node.references[0];
  }
  if (node.bibtex && node.bibtex !== '|') {
    return node.bibtex;
  }
  return undefined;
}

/**
 * Returns whether the node has any citation/reference material.
 */
export function hasReferences(node: VaultNode): boolean {
  return (
    (node.references && node.references.length > 0) || (node.bibtex != null && node.bibtex !== '|')
  );
}
