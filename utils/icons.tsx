import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Helper to normalize icon names (kebab-case to PascalCase)
// e.g. "arrow-right" -> "ArrowRight"
const toPascalCase = (str: string) => {
  return str.replace(/(^\w|-\w)/g, (clear) => clear.replace(/-/, '').toUpperCase());
};

// Legacy/Custom mappings
const ICON_MAPPING: Record<string, string> = {
  chip: 'Cpu',
  graph: 'Share2',
  radar: 'Radar',
  wifi: 'Wifi',
  terminal: 'Terminal',
  research: 'FlaskConical',
  blog: 'FileText',
  project: 'FolderKanban',
  profile: 'User',
  system: 'Shield',
  // Timeline mappings
  disclosure: 'Shield',
  notification: 'Mail',
  response: 'CheckCircle',
  check: 'CheckCircle',
  update: 'AlertCircle',
  alert: 'AlertCircle',
  file: 'FileText',
};

export const getDefaultIconName = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'blog':
      return 'FileText';
    case 'research':
      return 'BookOpen';
    case 'project':
      return 'FolderKanban';
    case 'profile':
      return 'User';
    case 'system':
      return 'Shield';
    default:
      return 'FileText';
  }
};

export const getIconComponent = (name: string, fallback: string = 'HelpCircle'): LucideIcon => {
  if (!name) return LucideIcons[fallback as keyof typeof LucideIcons] as LucideIcon;

  name = name.trim();

  // 1. Check explicit mapping
  if (ICON_MAPPING[name.toLowerCase()]) {
    const mappedName = ICON_MAPPING[name.toLowerCase()];
    return LucideIcons[mappedName as keyof typeof LucideIcons] as LucideIcon;
  }

  // 2. Try PascalCase (e.g. "arrow-right" -> "ArrowRight")
  const pascal = toPascalCase(name);
  if (LucideIcons[pascal as keyof typeof LucideIcons]) {
    return LucideIcons[pascal as keyof typeof LucideIcons] as LucideIcon;
  }

  // 3. Try original name (e.g. "ArrowRight")
  if (LucideIcons[name as keyof typeof LucideIcons]) {
    return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon;
  }

  // 4. Fallback
  return (
    (LucideIcons[fallback as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.HelpCircle
  );
};

// Cache for generated icon images
const iconImageCache = new Map<string, HTMLImageElement>();

export const getIconImage = (
  name: string,
  color: string = '#94a3b8',
  size: number = 24,
): HTMLImageElement | null => {
  const cacheKey = `${name}-${color}-${size}`;

  if (iconImageCache.has(cacheKey)) {
    return iconImageCache.get(cacheKey)!;
  }

  const Icon = getIconComponent(name);
  if (!Icon) return null;

  // Render icon to SVG string
  const svgString = renderToStaticMarkup(<Icon color={color} size={size} strokeWidth={2} />);

  // Create Data URL
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Create Image
  const img = new Image();
  img.src = url;

  // We cache the image immediately, even if not loaded yet.
  // The consumer needs to handle onload or just redraw when ready.
  // Since we use it in a game loop (requestAnimationFrame), it will eventually appear.
  iconImageCache.set(cacheKey, img);

  return img;
};
