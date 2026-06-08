import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import {
  remarkFrontmatterExtractor,
  remarkWikiLinks,
  remarkHashtags,
  remarkAssets,
  remarkPreserveSyntax,
} from './remark-plugins';
import fs from 'fs';
import path from 'path';

export interface ProcessorConfig {
  vaultDir: string;
  publicImagesDir: string;
  publicFilesDir: string;
  publicVideosDir: string;
}

export class VaultProcessor {
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig) {
    this.config = config;
  }

  /**
   * Build a processor with the same public-asset directory layout that
   * `parse-vault.ts` uses. Keeping this in one place guarantees that the
   * signer (`sign-posts.ts`) and the data pipeline produce byte-identical
   * `content`, so PGP signatures verify against the published `node.content`.
   */
  static forVault(vaultDir: string, assetsDir?: string): VaultProcessor {
    return new VaultProcessor({
      vaultDir,
      publicImagesDir: assetsDir || path.join(vaultDir, '..', 'public', 'images'),
      publicFilesDir: path.join(vaultDir, '..', 'public', 'files'),
      publicVideosDir: path.join(vaultDir, '..', 'public', 'videos'),
    });
  }

  /**
   * The exact text that gets PGP-signed and that the site stores as
   * `node.content`: the processed body, trimmed. The signer and the verifier
   * must both use this so signatures match.
   */
  async getSignableContent(filePath: string): Promise<string> {
    const { content } = await this.processFile(filePath);
    return content.trim();
  }

  async processFile(filePath: string): Promise<{
    frontmatter: Record<string, unknown>;
    content: string;
    links: string[];
    hashtags: string[];
  }> {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    let frontmatter: Record<string, unknown> = {};
    const links: string[] = [];
    const hashtags: Set<string> = new Set();

    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkFrontmatterExtractor, {
        onFrontmatter: (data) => {
          frontmatter = data;
        },
      })
      .use(remarkWikiLinks, {
        onLink: (link) => {
          links.push(link);
        },
      })
      .use(remarkHashtags, {
        onHashtag: (tag) => {
          hashtags.add(tag);
        },
      })
      .use(remarkAssets, {
        vaultDir: this.config.vaultDir,
        filePath,
        publicImagesDir: this.config.publicImagesDir,
        publicFilesDir: this.config.publicFilesDir,
        publicVideosDir: this.config.publicVideosDir,
      })
      .use(remarkPreserveSyntax)
      .use(remarkGfm)
      .use(remarkStringify);

    const result = await processor.process(rawContent);

    return {
      frontmatter,
      content: result.toString(),
      links,
      hashtags: Array.from(hashtags).sort(),
    };
  }
}
