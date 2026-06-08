import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import { VaultNode } from '../types/vault';
import { processCoverImage } from './lib/assets';
import { processRelationships } from './lib/graph';
import MiniSearch from 'minisearch';
import { ensureDir, copyFileSafe } from './lib/utils';
import { VaultProcessor } from './lib/processor';

import { getVaultPathWithOverride } from './lib/vault-path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for raw frontmatter from YAML
interface RawFrontmatter {
  type?: string;
  cover_image?: string;
  image?: string;
  signature?: string;
  created?: string | number;
  date?: string | number;
  description?: string;
  aliases?: string[];
  stack?: string[];
  icon?: string;
  github?: string;
  published_in?: string;
  publication?: string;
  references?: string | string[];
  bibtex?: string;
  year?: string;
  url?: string;
  link?: string;
  exclude_from_graph?: boolean;
  disable_toc?: boolean;
  status?: string;
  stars?: number;
  forks?: number;
  avatar?: string;
  skills?: { name: string; level: number; type: 'offense' | 'defense' }[];
  languages?: { name: string; level: number }[];
  timeline?: { date: string; title: string; description?: string; icon?: string }[];
  offensive?: number;
  defensive?: number;
  misc?: number;
}

async function parseVault(vaultPath: string, assetsDir?: string): Promise<VaultNode[]> {
  const nodes: VaultNode[] = [];
  const vaultDir = path.resolve(vaultPath);

  if (!fs.existsSync(vaultDir)) {
    console.error(`Vault directory not found: ${vaultDir}`);
    return nodes;
  }

  const publicImagesDir = assetsDir || path.join(vaultDir, '..', 'public', 'images');
  const publicFilesDir = path.join(vaultDir, '..', 'public', 'files');
  const publicVideosDir = path.join(vaultDir, '..', 'public', 'videos');
  const publicCoversDir = path.join(publicImagesDir, 'covers');
  const publicChartsDir = path.join(vaultDir, '..', 'public', 'assets', 'charts');

  const vaultImagesDir = path.join(vaultDir, 'assets', 'images');
  const vaultFilesDir = path.join(vaultDir, 'assets', 'files');
  const vaultVideosDir = path.join(vaultDir, 'assets', 'videos');
  const vaultCoversDir = path.join(vaultDir, 'assets', 'covers');
  const vaultChartsDir = path.join(vaultDir, 'assets', 'charts');

  const processor = new VaultProcessor({
    vaultDir,
    publicImagesDir,
    publicFilesDir,
    publicVideosDir,
  });

  [
    publicImagesDir,
    publicFilesDir,
    publicVideosDir,
    publicCoversDir,
    publicChartsDir,
    vaultImagesDir,
    vaultFilesDir,
    vaultVideosDir,
    vaultCoversDir,
    vaultChartsDir,
  ].forEach(ensureDir);

  if (fs.existsSync(vaultCoversDir)) {
    fs.readdirSync(vaultCoversDir).forEach((cover) => {
      if (cover.startsWith('.')) return;
      copyFileSafe(path.join(vaultCoversDir, cover), path.join(publicCoversDir, cover));
    });
  }

  if (fs.existsSync(vaultChartsDir)) {
    fs.readdirSync(vaultChartsDir).forEach((chart) => {
      if (chart.startsWith('.')) return;
      copyFileSafe(path.join(vaultChartsDir, chart), path.join(publicChartsDir, chart));
    });
  }

  // Parallel file processing
  const files = (await fsPromises.readdir(vaultDir, { recursive: true }))
    .filter((file: string) => typeof file === 'string' && file.endsWith('.md'))
    .map((file: string) => path.join(vaultDir, file));

  // Process files in parallel batches to avoid EMFILE or memory issues
  const batchSize = 20;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (filePath) => {
        try {
          const stats = await fsPromises.stat(filePath);
          const {
            frontmatter: rawFrontmatter,
            content: processedBody,
            hashtags,
          } = await processor.processFile(filePath);
          const frontmatter = rawFrontmatter as RawFrontmatter;

          // Obsidian uses the filename as the note's display name and as the
          // target of [[wikilinks]]. We mirror that: the filename is the single
          // source of truth for the title — there is no `title` frontmatter.
          const filename = path.basename(filePath, '.md');
          const title = filename;
          const type = frontmatter.type || 'blog';

          let id: string;
          if (filename === 'root' && type === 'system') {
            id = 'home';
          } else if (filename === 'whoami' && type === 'profile') {
            id = 'about';
          } else {
            const normalizedTitle = title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            id = `${type}:${normalizedTitle}`;
          }

          let coverImage = processCoverImage(
            frontmatter.cover_image || frontmatter.image,
            filePath,
            vaultDir,
            assetsDir || path.join(vaultDir, '..', 'dist', 'assets'),
          );

          if (!coverImage && type !== 'system' && type !== 'profile') {
            const defaultCoverPngPath = path.join(
              vaultDir,
              '..',
              'public',
              'images',
              'covers',
              `default-${type}.png`,
            );
            if (fs.existsSync(defaultCoverPngPath)) {
              coverImage = `/images/covers/default-${type}.png`;
            } else if (
              fs.existsSync(
                path.join(vaultDir, '..', 'public', 'images', 'covers', `default-${type}.svg`),
              )
            ) {
              coverImage = `/images/covers/default-${type}.svg`;
            }
          }

          let signature = frontmatter.signature;

          // Look for signature in assets/signatures/{filename}.asc if not explicitly provided
          if (!signature) {
            const sigFileName = `${filename}.asc`;
            // Check standard locations
            const possibleSigPaths = [
              path.join(vaultDir, 'assets', 'signatures', sigFileName),
              path.join(vaultDir, 'signatures', sigFileName), // Legacy support
            ];

            for (const sigPath of possibleSigPaths) {
              if (fs.existsSync(sigPath)) {
                signature = await fsPromises.readFile(sigPath, 'utf-8');
                break;
              }
            }
          } else if (typeof signature === 'string') {
            if (signature.includes('\n') || signature.includes('BEGIN PGP')) {
              // Inline signature, keep as is
            } else {
              // If explicit path provided, try to resolve it
              let sigPath = signature;

              if (signature.startsWith('signatures/')) {
                // Legacy path handling
                sigPath = path.join(vaultDir, signature);
                if (!fs.existsSync(sigPath)) {
                  // Try new location
                  sigPath = path.join(vaultDir, 'assets', signature);
                }
              } else if (signature.startsWith('assets/signatures/')) {
                sigPath = path.join(vaultDir, signature);
              } else {
                const vaultRootPath = path.join(vaultDir, signature);
                if (fs.existsSync(vaultRootPath)) {
                  sigPath = vaultRootPath;
                } else {
                  sigPath = path.join(vaultDir, 'assets', 'signatures', signature);
                }
              }

              if (fs.existsSync(sigPath)) {
                signature = await fsPromises.readFile(sigPath, 'utf-8');
              } else {
                console.warn(`Signature file not found: ${signature} (resolved: ${sigPath})`);
              }
            }
          }

          const node: VaultNode = {
            id,
            title,
            type: type as VaultNode['type'],
            created:
              frontmatter.created !== undefined
                ? String(frontmatter.created || frontmatter.date)
                : undefined,
            updated: stats.mtime.toISOString().split('T')[0],
            description: frontmatter.description,
            aliases: frontmatter.aliases,
            keywords: hashtags,
            stack: frontmatter.stack,
            signature: typeof signature === 'string' ? signature.trim() : undefined,
            content: processedBody.trim(),
            icon: frontmatter.icon,
            github: frontmatter.github,
            published_in: frontmatter.published_in || frontmatter.publication,
            publication: frontmatter.published_in || frontmatter.publication,
            references: Array.isArray(frontmatter.references)
              ? frontmatter.references
              : frontmatter.references
                ? [frontmatter.references]
                : undefined,
            bibtex: frontmatter.bibtex,
            year: frontmatter.year,
            url: frontmatter.url || frontmatter.link,
            cover_image: coverImage,
            exclude_from_graph: frontmatter.exclude_from_graph,
            disable_toc: frontmatter.disable_toc,
            status: frontmatter.status,
            stars: frontmatter.stars,
            forks: frontmatter.forks,
            avatar: frontmatter.avatar,
            skills: frontmatter.skills,
            languages: frontmatter.languages,
            timeline: frontmatter.timeline,
            offensive: frontmatter.offensive,
            defensive: frontmatter.defensive,
            misc: frontmatter.misc,
          };
          // Drafts are work-in-progress: drop them entirely so they appear
          // nowhere — not in the graph, search index, or compiled content.
          if (typeof node.status === 'string' && node.status.toLowerCase() === 'draft') {
            return;
          }

          nodes.push(node);
        } catch (error) {
          console.error(`Error parsing ${filePath}:`, error);
        }
      }),
    );
  }

  return processRelationships(nodes);
}

async function main() {
  // Get vault path: CLI argument takes precedence, then env variable, then fallback
  const vaultPath = getVaultPathWithOverride(process.argv[2]);
  const outputPath = process.argv[3] || './public/vault.json';
  const assetsDir = path.resolve(__dirname, '../public/images');

  if (!fs.existsSync(vaultPath)) {
    // Don't fail the build on a missing vault — create an empty one so a fresh
    // clone (or a vault wiped for personal use) still produces a valid site.
    console.warn(`Vault directory not found: ${vaultPath} — creating an empty vault.`);
    console.warn('Set VAULT_PATH or pass a path to point at your own vault.');
    ensureDir(vaultPath);
  }

  const vaultAssetsDir = path.join(vaultPath, 'assets');
  ensureDir(vaultAssetsDir);
  ensureDir(assetsDir);

  console.log(`Parsing Obsidian vault from: ${vaultPath}`);
  const nodes = await parseVault(vaultPath, assetsDir);

  console.log(`Found ${nodes.length} nodes`);

  const outputDir = path.dirname(outputPath);
  ensureDir(outputDir);

  // Define path for full vault data (for server-side build)
  const dataDir = path.resolve(__dirname, '../data');
  ensureDir(dataDir);
  const fullVaultPath = path.join(dataDir, 'vault.json');

  // Write full vault data to internal data directory
  fs.writeFileSync(fullVaultPath, JSON.stringify(nodes, null, 2));
  console.log(`Full vault data written to: ${fullVaultPath}`);

  // Write lite vault data (metadata only) as public/vault.json for frontend use
  const liteNodes = nodes.map((node) => {
    const lite: Partial<VaultNode> = { ...node };
    delete lite.signature;
    delete lite.content;
    return lite;
  });
  fs.writeFileSync(outputPath, JSON.stringify(liteNodes, null, 2));
  console.log(`Lite vault data written to: ${outputPath}`);

  // Generate MiniSearch index from full nodes (content is needed for indexing)
  console.log('Generating search index...');
  const miniSearch = new MiniSearch({
    fields: ['title', 'content', 'description', 'keywords', 'stack'], // fields to index for full-text search
    storeFields: ['id', 'title', 'description', 'type', 'keywords'], // fields to return with search results
    searchOptions: {
      boost: { title: 2, keywords: 1.5, stack: 1.5, description: 1.2 },
      fuzzy: 0.2,
    },
  });

  // Add documents to the index
  // We need to make sure keywords/stack arrays are joined for indexing if MiniSearch expects strings,
  // but MiniSearch can handle arrays if configured or we can join them.
  // For simplicity and compatibility, let's join arrays.
  const searchDocs = nodes
    .filter((node) => node.type !== 'system' && node.id !== 'root' && node.id !== 'home')
    .map((node) => ({
      id: node.id,
      title: node.title,
      content: node.content,
      description: node.description || '',
      // short_desc removed from index
      type: node.type,
      keywords: (node.keywords || []).join(' '),
      stack: (node.stack || []).join(' '),
    }));

  miniSearch.addAll(searchDocs);

  const searchIndexPath = path.join(outputDir, 'search-index.json');
  fs.writeFileSync(searchIndexPath, JSON.stringify(miniSearch.toJSON()));
  console.log(`Search index written to: ${searchIndexPath}`);

  const nodesWithImages = nodes.filter((n) => n.cover_image).length;
  const nodesWithSignatures = nodes.filter((n) => n.signature).length;
  console.log(`\nSummary:`);
  console.log(`  - Total nodes: ${nodes.length}`);
  console.log(`  - Nodes with cover images: ${nodesWithImages}`);
  console.log(`  - Nodes with signatures: ${nodesWithSignatures}`);
  console.log(`  - Vault assets: ${vaultAssetsDir}`);
  console.log(`  - Public images: ${assetsDir}`);
}

main().catch(console.error);
