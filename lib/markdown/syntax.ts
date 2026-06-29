/**
 * Shared Obsidian-style / custom markdown syntax patterns and constants.
 * Consumed by:
 * - lib/markdown/extensions.ts (marked for React render)
 * - lib/rss-markdown.ts (string preprocessing for feeds)
 * - scripts/pipeline/remark-plugins.ts (build time processing)
 *
 * Keep regexes in sync here.
 */

// [[Page]] or [[Page|Label]] or [[Page#Section|Label]]
export const WIKILINK_RE = /^\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;

// ![[Embed]]
export const EMBED_RE = /^!\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;

// [file:path|name]
export const FILE_ATTACHMENT_RE = /\[file:([^\]]+)\]/g;

// [video:path]
export const VIDEO_RE = /\[video:([^\]]+)\]/g;

// [ref:key]
export const REF_RE = /\[ref:([^\]]+)\]/g;

// > [!TYPE] optional title
export const CALLOUT_RE = /^>\s*\[!(\w+)\](.*)/gm;

// Math $$block$$ or $inline$
export const MATH_BLOCK_RE = /\$\$([\s\S]*?)\$\$/g;
export const MATH_INLINE_RE = /\$([^\n$]+?)\$/g;

// Hashtags #foo-bar
export const HASHTAG_RE = /(?<!\w)#([a-zA-Z0-9_-]+)/g;

export const CALLOUT_TYPES = ['NOTE', 'INFO', 'WARNING', 'TIP', 'IMPORTANT', 'CAUTION'] as const;
