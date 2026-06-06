import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Pre-process markdown content to handle custom syntax before passing to marked.
 * This mimics some of the logic in MarkdownRenderer.tsx but produces static HTML string
 * suitable for RSS feeds.
 */
export async function markdownToRssHtml(markdown: string): Promise<string> {
  let content = markdown;

  // 1. Handle Mermaid blocks - wrap in code block since RSS readers won't render diagrams
  content = content.replace(/```mermaid([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 2. Handle Callouts (> [!INFO]) -> Convert to blockquote with bold title
  // Regex handles: > [!TYPE] Title (optional) \n > Content
  // Simple approach: Replace the start with a strong tag
  content = content.replace(/^>\s*\[!(\w+)\](.*)/gm, '> <strong>$1: $2</strong>');

  // 3. Handle File Attachments [file:path|name] -> Link
  content = content.replace(/\[file:([^\]]+)\]/g, (match, capture) => {
    const parts = capture.split('|');
    const path = parts[0].trim();
    const name = parts.length > 1 ? parts[1].trim() : path.split('/').pop();
    const url = `/files/${encodeURIComponent(path.split('/').pop() || '')}`;
    return `[Download ${name}](${url})`;
  });

  // 4. Handle Wiki Links [[Link]] or [[Link|Label]]
  content = content.replace(/\[\[([^\]]+)\]\]/g, (match, capture) => {
    const parts = capture.split('|');
    const link = parts[0].trim();
    const label = parts.length > 1 ? parts[1].trim() : link;
    // We don't easily know the full URL here without more context, so strictly text or relative link
    // For RSS, plain text or a best-effort link is better than [[...]]
    return label;
  });

  // 5. Handle Math (LaTeX) - Convert to code/text for RSS
  // Block Math $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, '<pre>$1</pre>');
  // Inline Math $...$
  content = content.replace(/\$([^$]+)\$/g, '<code>$1</code>');

  // 6. Handle Reference Links [ref:key] -> [key]
  content = content.replace(/\[ref:([^\]]+)\]/g, '[$1]');

  // Convert to HTML using marked
  const rawHtml = await marked.parse(content);

  // Sanitize the HTML
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'title'],
      a: ['href', 'name', 'target', 'rel'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
