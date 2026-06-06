import { useEffect, useRef, useCallback } from 'react';
import { GraphNode } from '@/types/graph';
import { GRAPH_CONFIG } from '@/config/graph';

interface UseForceSimulationProps {
  nodes: GraphNode[];
  width: number;
  height: number;
}

export function useForceSimulation({ nodes, width, height }: UseForceSimulationProps) {
  const isSimulatingRef = useRef(true);
  const animationFrameIdRef = useRef(0);
  const draggedNodeRef = useRef<GraphNode | null>(null);

  const wakeSimulation = useCallback(() => {
    isSimulatingRef.current = true;
  }, []);

  const updatePhysics = useCallback(() => {
    if (!isSimulatingRef.current) return;

    let maxVelocity = 0;
    const nodeCount = nodes.length;

    // 1. Force Application
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      if (node.fixed || node === draggedNodeRef.current) continue;

      // Center Pull — D3 force simulation legitimately mutates node vx/vy
      node.vx += (width / 2 - node.x) * GRAPH_CONFIG.CENTER_PULL;
      node.vy += (height / 2 - node.y) * GRAPH_CONFIG.CENTER_PULL;

      // Repulsion
      for (let j = i + 1; j < nodeCount; j++) {
        const nodeB = nodes[j];
        const dx = node.x - nodeB.x;
        const dy = node.y - nodeB.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < 640000) {
          const dist = Math.sqrt(distSq);
          const force = GRAPH_CONFIG.REPULSION / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          node.vx += fx;
          node.vy += fy;
          if (!nodeB.fixed && nodeB !== draggedNodeRef.current) {
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        }
      }

      node.vx *= GRAPH_CONFIG.FRICTION;
      node.vy *= GRAPH_CONFIG.FRICTION;
    }

    // 2. Position Update & Bounds
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      if (node.fixed || node === draggedNodeRef.current) continue;

      node.x += node.vx;
      node.y += node.vy;

      const padding = 50;
      if (node.x < padding) {
        node.x = padding;
        node.vx *= -1;
      }
      if (node.x > width - padding) {
        node.x = width - padding;
        node.vx *= -1;
      }
      if (node.y < padding) {
        node.y = padding;
        node.vy *= -1;
      }
      if (node.y > height - padding) {
        node.y = height - padding;
        node.vy *= -1;
      }

      const vSq = node.vx * node.vx + node.vy * node.vy;
      if (vSq > maxVelocity) maxVelocity = vSq;
    }

    // 3. Sleep check
    if (
      maxVelocity < GRAPH_CONFIG.VELOCITY_THRESHOLD * GRAPH_CONFIG.VELOCITY_THRESHOLD &&
      !draggedNodeRef.current
    ) {
      isSimulatingRef.current = false;
    }
  }, [nodes, width, height]);

  useEffect(() => {
    wakeSimulation();
  }, [nodes, wakeSimulation]);

  return {
    isSimulatingRef,
    animationFrameIdRef,
    draggedNodeRef,
    wakeSimulation,
    updatePhysics,
  };
}
