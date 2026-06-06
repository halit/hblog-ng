import { useMemo, useState, useCallback } from 'react';
import { VaultNode } from '@/types/vault';
import { GraphNode, GraphLink } from '@/types/graph';
import { calculateSpectrum } from '@/utils';
import { GRAPH_CONFIG } from '@/config/graph';

export interface UseGraphDataProps {
  data: VaultNode[];
  searchTerm: string;
  activeFilters: string[];
  activeSpectrums: string[];
  hiddenNodes: Set<string>;
}

export function useGraphData({
  data,
  searchTerm,
  activeFilters,
  activeSpectrums,
  hiddenNodes,
}: UseGraphDataProps) {
  // 1. Base Data Transformation (VaultNodes -> GraphNodes/Links)
  const { nodes: allNodes, links: allLinks } = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>();
    const linksArr: GraphLink[] = [];
    const keywordNodes = new Map<string, GraphNode>();

    data.forEach((item) => {
      if (item.type === 'system' || item.exclude_from_graph) return;

      const spectrum = calculateSpectrum(item.content, item);

      const node: GraphNode = {
        id: item.id,
        title: item.title,
        group: item.type,
        icon: item.icon,
        x: Math.random() * 1200,
        y: Math.random() * 800,
        vx: 0,
        vy: 0,
        radius: 4 + Math.random() * 2,
        color: GRAPH_CONFIG.COLORS.NEUTRAL,
        connections: 0,
        keywords: item.keywords,
        offensive: spectrum.offensive,
        defensive: spectrum.defensive,
        misc: spectrum.misc,
        fixed: false,
      };
      nodesMap.set(item.id, node);

      if (item.keywords && item.keywords.length > 0) {
        item.keywords.forEach((k) => {
          const keywordId = `keyword-${k.toLowerCase()}`;
          if (!keywordNodes.has(keywordId)) {
            keywordNodes.set(keywordId, {
              id: keywordId,
              title: k,
              group: 'keyword',
              x: Math.random() * 1200,
              y: Math.random() * 800,
              vx: 0,
              vy: 0,
              radius: 3,
              color: '#ffffff',
              connections: 0,
              offensive: 0,
              defensive: 0,
              misc: 0,
              fixed: false,
            });
          }
          linksArr.push({
            source: item.id,
            target: keywordId,
            strength: 0.05,
          });
        });
      }
    });

    keywordNodes.forEach((node, id) => {
      nodesMap.set(id, node);
    });

    // Build lookup indexes once so wikilink resolution is O(1) per link.
    const byTitle = new Map<string, GraphNode>();
    const bySlugOrId = new Map<string, GraphNode>();
    nodesMap.forEach((n) => {
      if (n.group === 'keyword') return;
      byTitle.set(n.title.toLowerCase(), n);
      bySlugOrId.set(n.id, n);
      const slug = n.id.includes(':') ? n.id.split(':')[1] : n.id;
      bySlugOrId.set(slug, n);
    });

    const linkRegex = /\[\[([^\]]+)\]\]/g;
    data.forEach((source) => {
      if (!nodesMap.has(source.id)) return;
      let match;
      const content = source.content || '';
      while ((match = linkRegex.exec(content)) !== null) {
        const targetTitle = match[1].trim();
        const normalizedTarget = targetTitle.toLowerCase().replace(/\s+/g, '-');
        const targetNode =
          byTitle.get(targetTitle.toLowerCase()) || bySlugOrId.get(normalizedTarget);

        if (targetNode && targetNode.id !== source.id) {
          linksArr.push({ source: source.id, target: targetNode.id, strength: 0.1 });
          const sourceNode = nodesMap.get(source.id);
          if (sourceNode) sourceNode.connections++;
          if (targetNode) targetNode.connections++;
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), links: linksArr };
  }, [data]);

  // 2. Pathfinding State & Logic
  const [pathSourceId, setPathSourceId] = useState<string | null>(null);
  const [pathResult, setPathResult] = useState<{ nodes: Set<string>; links: Set<string> } | null>(
    null,
  );

  const findPaths = useCallback(
    (startId: string, endId: string) => {
      const adj = new Map<string, string[]>();
      allLinks.forEach((l) => {
        if (!adj.has(l.source)) adj.set(l.source, []);
        if (!adj.has(l.target)) adj.set(l.target, []);
        adj.get(l.source)?.push(l.target);
        adj.get(l.target)?.push(l.source);
      });

      const allPaths: string[][] = [];
      const visited = new Set<string>();
      visited.add(startId);

      const dfs = (currentId: string, currentPath: string[]) => {
        if (allPaths.length >= GRAPH_CONFIG.MAX_PATHS) return;
        if (currentPath.length > GRAPH_CONFIG.MAX_DEPTH) return;
        if (currentId === endId) {
          allPaths.push([...currentPath]);
          return;
        }

        const neighbors = adj.get(currentId) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            currentPath.push(neighbor);
            dfs(neighbor, currentPath);
            currentPath.pop();
            visited.delete(neighbor);
          }
        }
      };

      dfs(startId, [startId]);

      const uniqueNodes = new Set<string>();
      const uniqueLinks = new Set<string>();

      allPaths.forEach((path) => {
        path.forEach((nodeId) => uniqueNodes.add(nodeId));
        for (let i = 0; i < path.length - 1; i++) {
          uniqueLinks.add(`${path[i]}-${path[i + 1]}`);
          uniqueLinks.add(`${path[i + 1]}-${path[i]}`);
        }
      });

      if (uniqueNodes.size > 0) {
        setPathResult({ nodes: uniqueNodes, links: uniqueLinks });
        return uniqueNodes;
      } else {
        setPathResult(null);
        return null;
      }
    },
    [allLinks],
  );

  const clearPath = useCallback(() => {
    setPathSourceId(null);
    setPathResult(null);
  }, []);

  // 3. Filtering Logic
  const filteredNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (pathSourceId === node.id) return true;
      if (pathResult && pathResult.nodes.has(node.id)) return true;
      if (hiddenNodes.has(node.id)) return false;
      if (!activeFilters.includes(node.group)) return false;

      // Keywords are exempt from spectrum filtering
      if (node.group === 'keyword') return true;

      let dominant = 'misc';
      if (node.offensive > node.defensive && node.offensive > node.misc) dominant = 'offense';
      else if (node.defensive > node.offensive && node.defensive > node.misc) dominant = 'defense';

      return activeSpectrums.includes(dominant);
    });
  }, [allNodes, activeFilters, activeSpectrums, hiddenNodes, pathResult, pathSourceId]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return allLinks.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target));
  }, [allLinks, filteredNodes]);

  // 4. Search Highlight Calculation
  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return { direct: new Set<string>(), all: new Set<string>() };
    const lowerTerm = searchTerm.toLowerCase();
    const matches = filteredNodes.filter((node) => {
      return (
        node.title.toLowerCase().includes(lowerTerm) ||
        (node.keywords && node.keywords.some((k) => k.toLowerCase().includes(lowerTerm)))
      );
    });

    const directMatches = new Set(matches.map((n) => n.id));
    const allMatches = new Set(directMatches);

    allLinks.forEach((link) => {
      if (directMatches.has(link.source)) allMatches.add(link.target);
      if (directMatches.has(link.target)) allMatches.add(link.source);
    });

    return { direct: directMatches, all: allMatches };
  }, [filteredNodes, searchTerm, allLinks]);

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    searchMatches,
    pathSourceId,
    setPathSourceId,
    pathResult,
    findPaths,
    clearPath,
  };
}
