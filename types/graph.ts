export interface GraphNode {
  id: string;
  title: string;
  group: string;
  icon?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: number;
  keywords?: string[];
  offensive: number;
  defensive: number;
  misc: number;
  fixed?: boolean;
  width?: number;
  height?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export interface SimulationState {
  nodes: GraphNode[];
  links: GraphLink[];
  hoveredNode: GraphNode | null;
  draggedNode: GraphNode | null;
  pathSourceId: string | null;
  pathResult: { nodes: Set<string>; links: Set<string> } | null;
  searchMatches: { direct: Set<string>; all: Set<string> };
  zoom: number;
  width: number;
  height: number;
}
