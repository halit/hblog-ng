/**
 * Brand color tokens — single source of truth.
 * Used by: tailwind.config.ts, config/graph.ts, components/ChartRenderer.tsx
 */
export const BRAND_COLORS = {
  offense: '#ff0055',
  defense: '#00e5ff',
  background: '#0a0f14',
  neutral: '#94a3b8',
  text: '#e5e5e5',
  grid: '#333333',
  gray: '#1a1a1a',
} as const;

/** Extended chart palette (offense / defense first, then accent colours) */
export const CHART_PALETTE = [
  BRAND_COLORS.offense,
  BRAND_COLORS.defense,
  '#ffcc00',
  '#bf00ff',
  '#00ff00',
  '#ff6600',
  '#00bcd4',
  '#e91e63',
  '#9c27b0',
  '#ff5722',
] as const;
