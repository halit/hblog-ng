import { TokenizerAndRendererExtension } from 'marked';

/**
 * Obsidian WikiLinks: [[Page]] or [[Page|Label]] or [[Page#Section|Label]]
 */
export const wikilink: TokenizerAndRendererExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[[');
  },
  tokenizer(src: string) {
    const rule = /^\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'wikilink',
        raw: match[0],
        page: match[1].trim(),
        anchor: match[2]?.trim(),
        label: match[3]?.trim() || match[1].trim(),
      };
    }
    return undefined;
  },
};

/**
 * Obsidian Embeds: ![[Link]]
 */
export const embed: TokenizerAndRendererExtension = {
  name: 'embed',
  level: 'inline',
  start(src: string) {
    return src.indexOf('![[');
  },
  tokenizer(src: string) {
    const rule = /^!\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'embed',
        raw: match[0],
        link: match[1].trim(),
        anchor: match[2]?.trim(),
        caption: match[3]?.trim(),
      };
    }
    return undefined;
  },
};

/**
 * Math Block: $$ ... $$
 */
export const mathBlock: TokenizerAndRendererExtension = {
  name: 'mathBlock',
  level: 'block',
  start(src: string) {
    return src.indexOf('$$');
  },
  tokenizer(src: string) {
    const rule = /^\$\$([\s\S]*?)\$\$/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'mathBlock',
        raw: match[0],
        text: match[1].trim(),
      };
    }
    return undefined;
  },
};

/**
 * Inline Math: $ ... $
 */
export const mathInline: TokenizerAndRendererExtension = {
  name: 'mathInline',
  level: 'inline',
  start(src: string) {
    return src.indexOf('$');
  },
  tokenizer(src: string) {
    // Avoid matching single $ if it's not closed or looks like currency
    const rule = /^\$([^$\n]+?)\$/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'mathInline',
        raw: match[0],
        text: match[1].trim(),
      };
    }
    return undefined;
  },
};

/**
 * Obsidian Callouts: > [!TYPE] Title
 */
export const callout: TokenizerAndRendererExtension = {
  name: 'callout',
  level: 'block',
  start(src: string) {
    return src.indexOf('> [!');
  },
  tokenizer(src: string) {
    const rule = /^> \[!(\w+)\]([^\n]*)\n((?:>.*\n?)*)/;
    const match = rule.exec(src);
    if (match) {
      const type = match[1].trim();
      const title = match[2].trim();
      const content = match[3].replace(/^> /gm, '');
      return {
        type: 'callout',
        raw: match[0],
        calloutType: type,
        title: title,
        content: content.trim(),
        tokens: this.lexer.blockTokens(content.trim()),
      };
    }
    return undefined;
  },
};

/**
 * Reference Links: [ref:key]
 */
export const referenceLink: TokenizerAndRendererExtension = {
  name: 'referenceLink',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[ref:');
  },
  tokenizer(src: string) {
    const rule = /^\[ref:([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      const content = match[1].trim();
      const [refId, label] = content.includes('|') ? content.split('|') : [content, null];
      return {
        type: 'referenceLink',
        raw: match[0],
        refId: refId.trim(),
        label: label?.trim(),
      };
    }
    return undefined;
  },
};

/**
 * File Attachment: [file:path|name]
 */
export const fileAttachment: TokenizerAndRendererExtension = {
  name: 'fileAttachment',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[file:');
  },
  tokenizer(src: string) {
    const rule = /^\[file:([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      const content = match[1].trim();
      const [path, name] = content.includes('|') ? content.split('|') : [content, null];
      return {
        type: 'fileAttachment',
        raw: match[0],
        path: path.trim(),
        name: name?.trim() || path.split('/').pop()?.trim(),
      };
    }
    return undefined;
  },
};

/**
 * Video Player: [video:url|caption]
 */
export const videoPlayer: TokenizerAndRendererExtension = {
  name: 'videoPlayer',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[video:');
  },
  tokenizer(src: string) {
    const rule = /^\[video:([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      const content = match[1].trim();
      const [url, caption] = content.includes('|') ? content.split('|') : [content, null];
      return {
        type: 'videoPlayer',
        raw: match[0],
        url: url.trim(),
        caption: caption?.trim(),
      };
    }
    return undefined;
  },
};

/**
 * Asciinema: [asciinema:id|caption]
 */
export const asciinema: TokenizerAndRendererExtension = {
  name: 'asciinema',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[asciinema:');
  },
  tokenizer(src: string) {
    const rule = /^\[asciinema:([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      const content = match[1].trim();
      const [id, caption] = content.includes('|') ? content.split('|') : [content, null];
      return {
        type: 'asciinema',
        raw: match[0],
        id: id.trim(),
        caption: caption?.trim(),
      };
    }
    return undefined;
  },
};

/**
 * Hashtags: #tag
 */
export const hashtag: TokenizerAndRendererExtension = {
  name: 'hashtag',
  level: 'inline',
  start(src: string) {
    return src.indexOf('#');
  },
  tokenizer(src: string) {
    // Match # followed by alpha then alphanumeric/dots/hyphens/underscores
    // Ensure it's preceded by whitespace or start of string (handled by marked tokenizer call usually, but let's be specific)
    const rule = /^#([A-Za-z][A-Za-z0-9_.-]*)/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'hashtag',
        raw: match[0],
        text: match[1],
      };
    }
    return undefined;
  },
};

export const obsidianExtensions = [
  wikilink,
  embed,
  mathBlock,
  mathInline,
  callout,
  referenceLink,
  fileAttachment,
  videoPlayer,
  asciinema,
  hashtag,
];
