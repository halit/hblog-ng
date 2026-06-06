export const calculateEntropy = (str: string): number => {
  const len = str.length;
  const frequencies = new Map<string, number>();

  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

// Simple DJB2 hash for visual "signature" purposes
export const djb2 = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

export interface SpectrumDistribution {
  offensive: number; // 0-10
  defensive: number; // 0-10
  misc: number; // 0-10
}

export interface SpectrumOverrides {
  offensive?: number;
  defensive?: number;
  misc?: number;
}

export const calculateSpectrum = (
  content: string,
  overrides?: SpectrumOverrides,
): SpectrumDistribution => {
  // If no overrides provided at all, default to misc: 10
  if (
    !overrides ||
    (overrides.offensive === undefined &&
      overrides.defensive === undefined &&
      overrides.misc === undefined)
  ) {
    return { offensive: 0, defensive: 0, misc: 10 };
  }

  const offensive = overrides.offensive ?? 0;
  const defensive = overrides.defensive ?? 0;

  // If misc is explicitly provided, use it.
  // Otherwise calculate remainder from 10.
  let misc = overrides.misc;

  if (misc === undefined) {
    misc = Math.max(0, 10 - offensive - defensive);
  }

  return {
    offensive,
    defensive,
    misc,
  };
};

export const calculateReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} MIN`;
};

/**
 * Formats bytes into a human-readable string (e.g., 1.2 KB, 4.5 MB).
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';
  if (!bytes || Number.isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${val} ${sizes[i] || 'B'}`;
};

/**
 * Formats a date string into a display format.
 * Supports:
 * - YYYY
 * - YYYY-MM
 * - YYYY-MM-DD
 * - ISO strings
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';

  const str = String(dateString).trim();

  // Handle year only: 2025
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  // Handle year-month: 2025-11
  if (/^\d{4}-\d{2}$/.test(str)) {
    const [y, m] = str.split('-').map(Number);
    const date = new Date(y, m - 1);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' }).toUpperCase();
  }

  // Handle full date: 2025-11-05
  // Parse manually to avoid timezone shifting
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date
      .toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase();
  }

  // Fallback to standard parsing
  const date = new Date(str);
  if (isNaN(date.getTime())) return str;

  return date
    .toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
};

import { VaultNode } from '@/types/vault';

/**
 * Helper to get the most relevant date for sorting a node.
 * Priority: created > year > updated
 */
export function getNodeSortDate(node: VaultNode): number {
  if (node.created) return new Date(node.created).getTime();
  if (node.year) return new Date(node.year).getTime();
  return new Date(node.updated).getTime();
}

/**
 * Comparator that sorts nodes newest-first by their sort date.
 * Usage: `nodes.sort(byNewest)`.
 */
export function byNewest(a: VaultNode, b: VaultNode): number {
  return getNodeSortDate(b) - getNodeSortDate(a);
}

/**
 * Strips common Markdown/wikilink syntax to produce plain text, e.g. for feed
 * summaries and meta descriptions. Optionally truncates to `maxLength`.
 */
export function stripMarkdownToText(content: string, maxLength?: number): string {
  let text = content
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> link text
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target) // wikilinks
    .replace(/\[ref:[^\]]+\]/g, '') // citations
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/^\s*[-*+]\s+/gm, '') // list bullets
    .replace(/\s+/g, ' ')
    .trim();

  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + '...';
  }

  return text;
}

/**
 * Safe date parsing that ignores timezone shifts for YYYY-MM-DD strings,
 * treating them as local dates.
 */
export const parseDateSafe = (dateString: string | undefined): Date => {
  if (!dateString) return new Date();

  const str = String(dateString).trim();

  // YYYY
  if (/^\d{4}$/.test(str)) {
    return new Date(parseInt(str), 0, 1);
  }

  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) {
    const [y, m] = str.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }

  return new Date(str);
};

/**
 * Scrolls to an element with an offset for the fixed navbar.
 */
export const smoothScrollToId = (id: string, offset = 80) => {
  const element = document.getElementById(id);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};

/**
 * Generates a consistent ID for headings to be used in TOC and anchor links.
 */
export const generateHeadingId = (text: string, index: number): string => {
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `heading-${index}-${cleanText}`;
};
