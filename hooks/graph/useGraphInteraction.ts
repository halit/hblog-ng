import { useState, useCallback, useRef, RefObject } from 'react';
import { GraphNode } from '@/types/graph';

interface UseGraphInteractionProps {
  nodes: GraphNode[];
  canvasRef: RefObject<HTMLCanvasElement | null>;
  draggedNodeRef: RefObject<GraphNode | null>;
  wakeSimulation: () => void;
  initialZoom?: number;
}

export function useGraphInteraction({
  nodes,
  canvasRef,
  draggedNodeRef,
  wakeSimulation,
  initialZoom = 1,
}: UseGraphInteractionProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: GraphNode } | null>(
    null,
  );
  const hoveredNodeRef = useRef<GraphNode | null>(null);

  const getWorldCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const width = canvas.width;
      const height = canvas.height;

      // Inverse Zoom Transform: World = (Screen - Center) / Zoom + Center
      const worldX = (screenX - width / 2) / zoom + width / 2;
      const worldY = (screenY - height / 2) / zoom + height / 2;

      return { x: worldX, y: worldY };
    },
    [canvasRef, zoom],
  );

  const findNodeAt = useCallback(
    (x: number, y: number) => {
      return nodes
        .slice()
        .reverse()
        .find((node) => {
          if (node.width && node.height) {
            return (
              Math.abs(node.x - x) <= node.width / 2 && Math.abs(node.y - y) <= node.height / 2
            );
          }
          const hoverRadius = 30;
          const dx = node.x - x;
          const dy = node.y - y;
          return Math.sqrt(dx * dx + dy * dy) < hoverRadius;
        });
    },
    [nodes],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getWorldCoordinates(e.clientX, e.clientY);

      if (draggedNodeRef.current) {
        draggedNodeRef.current.x = x;
        draggedNodeRef.current.y = y;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
        wakeSimulation();
      } else {
        const found = findNodeAt(x, y);
        hoveredNodeRef.current = found || null;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = found ? 'pointer' : 'default';
        }
      }
    },
    [getWorldCoordinates, findNodeAt, draggedNodeRef, wakeSimulation, canvasRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const { x, y } = getWorldCoordinates(e.clientX, e.clientY);
      const clickedNode = findNodeAt(x, y);

      if (clickedNode) {
        draggedNodeRef.current = clickedNode;
        hoveredNodeRef.current = clickedNode;
        setContextMenu(null);
        wakeSimulation();
      } else {
        setContextMenu(null);
      }
    },
    [getWorldCoordinates, findNodeAt, draggedNodeRef, wakeSimulation],
  );

  const handleMouseUp = useCallback(() => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.fixed = true;
      draggedNodeRef.current = null;
    }
  }, [draggedNodeRef]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom((prev) => {
        const newZoom = prev + delta * 0.001;
        return Math.min(Math.max(newZoom, 0.5), 2.0);
      });
      wakeSimulation();
    },
    [wakeSimulation],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { x, y } = getWorldCoordinates(e.clientX, e.clientY);
      const found = findNodeAt(x, y);

      if (found && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const menuX = e.clientX - rect.left + 10;
        const menuY = e.clientY - rect.top - 10;
        setContextMenu({ x: menuX, y: menuY, node: found });
      } else {
        setContextMenu(null);
      }
    },
    [getWorldCoordinates, findNodeAt, canvasRef],
  );

  return {
    zoom,
    setZoom,
    contextMenu,
    setContextMenu,
    hoveredNodeRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
  };
}
