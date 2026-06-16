import fs from 'fs';
import { escape } from 'html-escaper';

/**
 * Ensures a directory exists, creating it recursively if necessary.
 */
export function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Escapes special characters for XML/SVG.
 */
export function escapeXML(str: string): string {
  return escape(str);
}

/**
 * Wraps text into multiple lines based on character limit.
 */
export function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const lines: string[] = [];
  if (!text) return lines;

  const words = text.split(/\s+/);
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    }

    if (currentLine.length > maxCharsPerLine) {
      let segment = currentLine.substring(0, maxCharsPerLine);
      const remaining = currentLine.substring(maxCharsPerLine);

      const lastSpace = segment.lastIndexOf(' ');
      if (lastSpace !== -1 && lastSpace > maxCharsPerLine * 0.7) {
        segment = segment.substring(0, lastSpace);
        currentLine = remaining.length > 0 ? `${currentLine.substring(lastSpace + 1)}` : '';
      } else {
        currentLine = remaining;
      }
      lines.push(segment.trim());
    }

    if (lines.length >= maxLines) break;
  }

  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine.trim());
  }

  while (lines.length > maxLines) {
    lines.pop();
  }

  // Add ellipsis if truncated
  if (
    lines.length === maxLines &&
    text.length > lines.join(' ').length + (words[words.length - 1]?.length || 0) &&
    !lines[lines.length - 1].endsWith('...')
  ) {
    let lastLine = lines[lines.length - 1];
    if (lastLine.length > maxCharsPerLine - 3) {
      lastLine = lastLine.substring(0, maxCharsPerLine - 3);
    }
    lines[lines.length - 1] = lastLine.trim() + '...';
  }

  return lines;
}

/**
 * Copies a file if it exists and is a file.
 */
export function copyFileSafe(src: string, dest: string) {
  if (fs.existsSync(src) && fs.statSync(src).isFile()) {
    fs.copyFileSync(src, dest);
  }
}
