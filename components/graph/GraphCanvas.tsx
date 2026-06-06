import React, { useEffect, useRef, forwardRef } from 'react';
import { GraphNode, GraphLink } from '@/types/graph';
import { GRAPH_CONFIG } from '@/config/graph';
import { getIconImage } from '@/utils/icons';

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  zoom: number;
  searchTerm: string;
  searchMatches: { direct: Set<string>; all: Set<string> };
  pathSourceId: string | null;
  pathResult: { nodes: Set<string>; links: Set<string> } | null;
  hoveredNodeRef: React.RefObject<GraphNode | null>;
  updatePhysics: () => void;
  width: number;
  height: number;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
}

const GraphCanvasComponent = forwardRef<HTMLCanvasElement, GraphCanvasProps>(function GraphCanvas(
  {
    nodes,
    links,
    zoom,
    searchTerm,
    searchMatches,
    pathSourceId,
    pathResult,
    hoveredNodeRef,
    updatePhysics,
    width,
    height,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onContextMenu,
    onWheel,
  },
  ref,
) {
  const animationFrameIdRef = useRef(0);

  // Helper for drawing icons
  const drawIcon = (
    ctx: CanvasRenderingContext2D,
    iconName: string,
    x: number,
    y: number,
    size: number,
    color: string,
  ) => {
    const img = getIconImage(iconName, color, 24);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, size, size);
    }
  };

  useEffect(() => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement | null>)?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = () => {
      updatePhysics();

      // Render Logic
      ctx.fillStyle = GRAPH_CONFIG.COLORS.BACKGROUND;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const isSearchActive = searchMatches.direct.size > 0 || searchTerm.trim().length > 0;
      const isPathActive = pathResult !== null;

      // Index nodes by id once per frame so link lookups are O(1) instead of O(n).
      const nodeById = new Map<string, GraphNode>();
      for (const n of nodes) nodeById.set(n.id, n);

      // Draw Links
      links.forEach((link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) return;

        let opacity = 1;
        let isPathLink = false;

        if (isPathActive && pathResult) {
          const linkKey = `${link.source}-${link.target}`;
          if (pathResult.links.has(linkKey)) {
            isPathLink = true;
          } else {
            opacity = 0.05;
          }
        } else if (isSearchActive) {
          const isSourceMatched = searchMatches.all.has(source.id);
          const isTargetMatched = searchMatches.all.has(target.id);

          if (!isSourceMatched && !isTargetMatched) opacity = 0.05;
          else if (!isSourceMatched || !isTargetMatched) opacity = 0.05;
          else {
            if (searchMatches.direct.has(source.id) || searchMatches.direct.has(target.id)) {
              isPathLink = true;
            } else {
              opacity = 0.15;
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isPathLink) {
          ctx.strokeStyle = GRAPH_CONFIG.COLORS.LINK_PATH;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = `rgba(200, 200, 200, 0.3)`;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = opacity;
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNodeRef.current === node;
        const isPathStart = node.id === pathSourceId;
        const isInPath = pathResult?.nodes.has(node.id);
        const isMatched = isSearchActive && searchMatches.all.has(node.id);
        const isDirectMatch = isSearchActive && searchMatches.direct.has(node.id);

        let opacity = 1;
        if (isPathActive) {
          opacity = isInPath ? 1 : 0.1;
        } else if (isSearchActive && !isMatched) {
          opacity = 0.1;
        }

        ctx.globalAlpha = opacity;

        if (node.group === 'keyword') {
          ctx.font = '10px "JetBrains Mono"';
          const kWidth = ctx.measureText(node.title).width + 30;
          const kHeight = GRAPH_CONFIG.DIMENSIONS.KEYWORD_HEIGHT;
          node.width = kWidth;
          node.height = kHeight;

          const kX = node.x - kWidth / 2;
          const kY = node.y - kHeight / 2;

          ctx.fillStyle = GRAPH_CONFIG.COLORS.BACKGROUND;
          if (isPathStart || isInPath || isDirectMatch) {
            ctx.strokeStyle = GRAPH_CONFIG.COLORS.DEFENSE;
            ctx.lineWidth = 2;
          } else if (isMatched) {
            ctx.strokeStyle = GRAPH_CONFIG.COLORS.DEFENSE;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = isHovered ? '#e5e5e5' : GRAPH_CONFIG.COLORS.KEYWORD_DEFAULT;
            ctx.lineWidth = 1;
          }

          ctx.beginPath();
          ctx.roundRect(kX, kY, kWidth, kHeight, 4);
          ctx.fill();
          ctx.stroke();

          drawIcon(
            ctx,
            'hash',
            kX + 6,
            kY + 6,
            GRAPH_CONFIG.DIMENSIONS.ICON_SIZE,
            isHovered || isInPath || isMatched ? '#ffffff' : '#9ca3af',
          );

          ctx.fillStyle = '#9ca3af';
          ctx.fillText(node.title, kX + 24, kY + 16);
        } else {
          const nWidth = GRAPH_CONFIG.DIMENSIONS.NODE_WIDTH;
          const nHeight = GRAPH_CONFIG.DIMENSIONS.NODE_HEIGHT;
          node.width = nWidth;
          node.height = nHeight;

          const nX = node.x - nWidth / 2;
          const nY = node.y - nHeight / 2;

          if (isPathStart || isInPath || isDirectMatch) {
            ctx.strokeStyle = GRAPH_CONFIG.COLORS.ACTIVE;
            ctx.lineWidth = 2;
            if (isPathStart || isInPath) {
              ctx.shadowBlur = isInPath ? 5 : 10;
              ctx.shadowColor = GRAPH_CONFIG.COLORS.ACTIVE;
            }
          } else if (isMatched) {
            ctx.strokeStyle = GRAPH_CONFIG.COLORS.ACTIVE;
            ctx.lineWidth = 1;
          } else if (isHovered) {
            ctx.strokeStyle = GRAPH_CONFIG.COLORS.HOVER;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
          }

          ctx.fillStyle = GRAPH_CONFIG.COLORS.BACKGROUND;
          ctx.beginPath();
          ctx.roundRect(nX, nY, nWidth, nHeight, 4);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 11px "JetBrains Mono"';
          const title = node.title.length > 20 ? node.title.substring(0, 18) + '..' : node.title;
          ctx.fillText(title, nX + 10, nY + 20);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px "JetBrains Mono"';
          const typeLabel = node.group === 'blog' ? 'POST' : node.group.toUpperCase();
          const iconName =
            node.icon ||
            (node.group === 'project'
              ? 'FolderKanban'
              : node.group === 'research'
                ? 'FlaskConical'
                : 'FileText');

          drawIcon(ctx, iconName, nX + 10, nY + 28, GRAPH_CONFIG.DIMENSIONS.ICON_SIZE, '#94a3b8');
          ctx.fillText(typeLabel, nX + 28, nY + 38);

          // Spectrum Meter
          const meterX = nX + 10;
          const meterY = nY + 50;
          const totalBlocks = GRAPH_CONFIG.DIMENSIONS.TOTAL_METER_BLOCKS;
          const meterWidth = nWidth - 20;
          const blockWidth = (meterWidth - (totalBlocks - 1) * 2) / totalBlocks;

          const total = node.offensive + node.defensive + node.misc;
          const safeTotal = total === 0 ? 1 : total;
          const offCount = Math.round((node.offensive / safeTotal) * totalBlocks);
          let defCount = Math.round((node.defensive / safeTotal) * totalBlocks);
          if (offCount + defCount > totalBlocks) defCount = totalBlocks - offCount;

          for (let i = 0; i < totalBlocks; i++) {
            let fillStyle = '#6b7280';
            if (i < offCount) fillStyle = GRAPH_CONFIG.COLORS.OFFENSE;
            else if (i < offCount + defCount) fillStyle = GRAPH_CONFIG.COLORS.DEFENSE;
            ctx.fillStyle = fillStyle;
            ctx.fillRect(
              meterX + i * (blockWidth + 2),
              meterY,
              blockWidth,
              GRAPH_CONFIG.DIMENSIONS.METER_HEIGHT,
            );
          }
        }
        ctx.globalAlpha = 1;
      });

      ctx.restore();
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameIdRef.current);
  }, [
    nodes,
    links,
    zoom,
    searchTerm,
    searchMatches,
    pathSourceId,
    pathResult,
    width,
    height,
    updatePhysics,
    hoveredNodeRef,
    ref,
  ]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="absolute inset-0 block w-full h-full"
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
      onWheel={onWheel}
    />
  );
});

export const GraphCanvas = GraphCanvasComponent;
GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
