import { slug as githubSlug } from 'github-slugger';

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
  // Strip inline markdown (bold, code, links) first, then let github-slugger
  // produce the anchor slug. The `index` prefix keeps IDs unique per page.
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  return `heading-${index}-${githubSlug(cleanText)}`;
};
