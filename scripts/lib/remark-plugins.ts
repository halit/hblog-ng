import { visit } from 'unist-util-visit';
import { Node, Parent } from 'unist';
import path from 'path';
import fs from 'fs';
import { ensureDir } from './utils';
import yaml from 'js-yaml';

export interface RemarkPluginOptions {
  vaultDir: string;
  filePath: string;
  publicImagesDir: string;
  publicFilesDir: string;
  publicVideosDir: string;
  onLink?: (link: string) => void;
  onHashtag?: (hashtag: string) => void;
  onFrontmatter?: (data: Record<string, unknown>) => void;
}

interface CustomNode extends Node {
  value?: string;
  url?: string;
  children?: CustomNode[];
}

/**
 * Remark plugin to extract YAML frontmatter and remove the node from AST
 */
export function remarkFrontmatterExtractor(options: {
  onFrontmatter: (data: Record<string, unknown>) => void;
}) {
  return (tree: Node) => {
    visit(tree, 'yaml', (node: CustomNode, index, parent: Parent) => {
      try {
        const data = yaml.load(node.value || '') as Record<string, unknown>;
        options.onFrontmatter(data);

        // Remove the frontmatter node so it's not included in the processed content
        if (parent && index !== undefined) {
          parent.children.splice(index, 1);
          return index;
        }
      } catch (e) {
        console.error('Error parsing frontmatter:', e);
      }
    });
  };
}

/**
 * Remark plugin to handle Obsidian-style WikiLinks [[Link]] or [[Link|Alias]]
 */
export function remarkWikiLinks(options: { onLink: (link: string) => void }) {
  return (tree: Node) => {
    visit(tree, 'text', (node: CustomNode) => {
      if (!node.value) return;
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = wikiLinkRegex.exec(node.value)) !== null) {
        const content = match[1].trim();
        const [link] = content.split('|');
        options.onLink(link.trim());
      }
    });
  };
}

/**
 * Remark plugin to extract hashtags
 */
export function remarkHashtags(options: { onHashtag: (hashtag: string) => void }) {
  return (tree: Node) => {
    visit(tree, 'text', (node: CustomNode, _index, parent: Parent) => {
      // Skip if parent is a link or code
      if (
        parent &&
        (parent.type === 'link' || parent.type === 'code' || parent.type === 'inlineCode')
      ) {
        return;
      }

      if (!node.value) return;
      const hashtagRegex = /(?:^|\s|>|\(|\[|,|;|:)#([A-Za-z0-9_.-]+)/g;
      let match;
      while ((match = hashtagRegex.exec(node.value)) !== null) {
        const tag = match[1].replace(/\.+$/, '');
        if (tag && /[A-Za-z]/.test(tag)) {
          options.onHashtag(tag.toLowerCase());
        }
      }
    });
  };
}

/**
 * Remark plugin to handle assets (images, files, videos)
 */
export function remarkAssets(options: RemarkPluginOptions) {
  return (tree: Node) => {
    // 1. Standard Images ![]()
    visit(tree, 'image', (node: CustomNode) => {
      const src = node.url;
      if (!src || src.startsWith('http') || src.startsWith('/')) return;

      const resolved = resolveAssetPath(src, options.filePath, options.vaultDir, 'images');
      if (resolved && fs.existsSync(resolved)) {
        const { relativePath, fileName } = getRelativeAssetInfo(
          resolved,
          options.vaultDir,
          'images',
        );
        const targetPath = path.join(options.publicImagesDir, relativePath);

        ensureDir(path.dirname(targetPath));
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(resolved, targetPath);
        }

        // Convert extension to webp for display if it's a common image format
        const ext = path.extname(fileName).toLowerCase();
        const convertible = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext);

        let displayPath = relativePath.replace(/\\/g, '/');
        if (convertible) {
          displayPath = displayPath.replace(new RegExp(`\\${ext}$`, 'i'), '.webp');
        }

        node.url = `/images/${displayPath}`;
      }
    });

    // 2. Custom [file:...] and [video:...] syntax in text nodes
    visit(tree, 'text', (node: CustomNode) => {
      if (!node.value) return;
      // Handle [file:path|name]
      const fileRegex = /\[file:([^\]]+)\]/g;
      node.value = node.value.replace(fileRegex, (match: string, content: string) => {
        const [filePathRef, displayName] = content.includes('|')
          ? content.split('|').map((s) => s.trim())
          : [content, null];

        if (filePathRef.startsWith('http') || filePathRef.startsWith('/')) return match;

        const resolved = resolveAssetPath(filePathRef, options.filePath, options.vaultDir, 'files');
        if (resolved && fs.existsSync(resolved)) {
          const { relativePath, fileName } = getRelativeAssetInfo(
            resolved,
            options.vaultDir,
            'files',
          );
          const ext = path.extname(fileName).toLowerCase();
          const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext);

          const targetDir = isImage ? options.publicImagesDir : options.publicFilesDir;
          const targetPath = path.join(targetDir, relativePath);

          ensureDir(path.dirname(targetPath));
          if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(resolved, targetPath);
          }

          const convertible = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext);
          let displayPath = relativePath.replace(/\\/g, '/');
          if (isImage && convertible) {
            displayPath = displayPath.replace(new RegExp(`\\${ext}$`, 'i'), '.webp');
          }

          const newPath = isImage ? `/images/${displayPath}` : `/files/${displayPath}`;
          return displayName ? `[file:${newPath}|${displayName}]` : `[file:${newPath}]`;
        }
        return match;
      });

      // Handle [video:path|caption]
      const videoRegex = /\[video:([^\]]+)\]/g;
      node.value = node.value.replace(videoRegex, (match: string, content: string) => {
        const [videoPathRef, caption] = content.includes('|')
          ? content.split('|').map((s) => s.trim())
          : [content, null];

        if (videoPathRef.startsWith('http') || videoPathRef.startsWith('/')) return match;

        const resolved = resolveAssetPath(
          videoPathRef,
          options.filePath,
          options.vaultDir,
          'videos',
        );
        if (resolved && fs.existsSync(resolved)) {
          const { relativePath } = getRelativeAssetInfo(resolved, options.vaultDir, 'videos');
          const targetPath = path.join(options.publicVideosDir, relativePath);

          ensureDir(path.dirname(targetPath));
          if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(resolved, targetPath);
          }

          const displayPath = relativePath.replace(/\\/g, '/');
          const newPath = `/videos/${displayPath}`;
          return caption ? `[video:${newPath}|${caption}]` : `[video:${newPath}]`;
        }
        return match;
      });
    });
  };
}

function getRelativeAssetInfo(resolvedPath: string, vaultDir: string, fallbackSubdir: string) {
  const fileName = path.basename(resolvedPath);

  // Cover images live in assets/covers but are still served under /images,
  // so preserve the covers/ prefix when computing the public display path.
  const coversBase = path.join(vaultDir, 'assets', 'covers');
  if (resolvedPath.startsWith(coversBase + path.sep)) {
    return { relativePath: path.join('covers', fileName), fileName };
  }

  const assetsBase = path.join(vaultDir, 'assets', fallbackSubdir);
  let relativePath = path.relative(assetsBase, resolvedPath);

  // If it's outside our expected assets subdir, just use the filename to avoid traversal issues
  if (relativePath.startsWith('..')) {
    relativePath = fileName;
  }

  return { relativePath, fileName };
}

function resolveAssetPath(
  ref: string,
  currentFilePath: string,
  vaultDir: string,
  fallbackSubdir: 'images' | 'files' | 'videos',
): string | null {
  if (path.isAbsolute(ref)) return ref;

  // Try relative to current file
  const relativePath = path.resolve(path.dirname(currentFilePath), ref);
  if (fs.existsSync(relativePath)) return relativePath;

  // Try in assets/{subdir}
  const assetsPath = path.join(vaultDir, 'assets', fallbackSubdir, ref);
  if (fs.existsSync(assetsPath)) return assetsPath;

  // Try in assets/
  const directAssetsPath = path.join(vaultDir, 'assets', ref);
  if (fs.existsSync(directAssetsPath)) return directAssetsPath;

  // Special case for cover images (assets/covers)
  if (fallbackSubdir === 'images') {
    const coverPath = path.join(vaultDir, 'assets', 'covers', ref);
    if (fs.existsSync(coverPath)) return coverPath;
  }

  return null;
}

/**
 * Remark plugin to prevent escaping of custom syntax by converting matches to HTML nodes
 * This ensures that [[WikiLinks]], [file:...], and [!CALLOUTS] pass through to the frontend
 * where they are rendered by the client-side markdown parser.
 */
export function remarkPreserveSyntax() {
  const pattern =
    /!?\[\[[^\]]+\]\]|\[(?:file|video|asciinema|ref|chart):[^\]]+\]|(?<=^|\n)\[![A-Za-z]+\]|MITRE ATT&CK/g;

  return (tree: Node) => {
    // 1. Merge nodes that were split by autolinks if they belong to custom syntax
    // This happens because [video:https://...] is parsed as text([video:) + link(https://...) + text(])
    visit(tree, (node: Node) => {
      if (!('children' in node)) return;
      const parent = node as Parent;
      if (!parent.children || parent.children.length < 2) return;

      const children = parent.children as CustomNode[];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (
          child.type === 'text' &&
          child.value &&
          (child.value.endsWith('[video:') ||
            child.value.endsWith('[file:') ||
            child.value.endsWith('[[') ||
            child.value.endsWith('![['))
        ) {
          let j = i + 1;
          let combinedValue = child.value;
          const nodesToMerge = [i];

          while (j < children.length) {
            const next = children[j];
            const nextValue =
              next.type === 'text'
                ? next.value
                : next.type === 'link'
                  ? next.children?.[0]?.value || next.url
                  : '';

            if (!nextValue && next.type !== 'link') break;

            combinedValue += nextValue;
            nodesToMerge.push(j);

            if (nextValue && nextValue.includes(']')) {
              children.splice(i, nodesToMerge.length, { type: 'text', value: combinedValue });
              break;
            }

            if (next.type !== 'text' && next.type !== 'link') break;
            j++;
          }
        }
      }
    });

    // 2. Convert matches to HTML nodes to prevent escaping
    visit(tree, 'text', (node: CustomNode, index, parent: Parent) => {
      if (!parent || index === undefined || !node.value) return;

      const value = node.value;
      const parts: CustomNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }

        parts.push({ type: 'html', value: match[0] });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < value.length) {
        parts.push({ type: 'text', value: value.slice(lastIndex) });
      }

      if (parts.length > 0 && !(parts.length === 1 && parts[0].type === 'text')) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
}
