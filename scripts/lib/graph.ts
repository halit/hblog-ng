import { VaultNode } from '../../types/vault';
import { extractInternalLinks, linkMatchesNode } from '../../lib/routing';

export function processRelationships(nodes: VaultNode[]): VaultNode[] {
  // Build map of nodes first
  const nodeMap = new Map<string, VaultNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build forward links map
  const linkMap = new Map<string, Set<string>>();

  const shouldExcludeFromRelated = (n: VaultNode): boolean =>
    n.type === 'system' || n.id === 'home' || n.id === 'root';

  for (const node of nodes) {
    if (shouldExcludeFromRelated(node)) continue;

    const internalLinks = extractInternalLinks(node.content);
    const related = new Set<string>();

    for (const linkLabel of internalLinks) {
      // Optimized find using simple loop or pre-computed lookups would be better
      // But for now, we use the array scan since we don't have a "Title -> Node" map yet
      const matchedNode = nodes.find((n) => linkMatchesNode(linkLabel, n));
      if (matchedNode && matchedNode.id !== node.id && !shouldExcludeFromRelated(matchedNode)) {
        related.add(matchedNode.id);
      }
    }
    linkMap.set(node.id, related);
  }

  // Bidirectional Links
  for (const [sourceId, targets] of linkMap.entries()) {
    for (const targetId of targets) {
      // If A -> B, ensure B -> A
      if (!linkMap.has(targetId)) linkMap.set(targetId, new Set());
      linkMap.get(targetId)!.add(sourceId);
    }
  }

  // Assign to nodes
  for (const node of nodes) {
    if (linkMap.has(node.id)) {
      node.related_ids = Array.from(linkMap.get(node.id)!);
    }
  }

  return nodes;
}
