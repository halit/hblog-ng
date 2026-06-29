import './pipeline/load-env';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import crypto from 'crypto';
import { VaultNode } from '@/types/vault';
import { loadVaultData } from '@/lib/vault';
import { calculateSpectrum, SpectrumDistribution } from '@/utils';
import { wrapText, escapeXML, ensureDir } from './pipeline/utils';
import { config } from '@/config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type labels
const typeLabels: { [key: string]: string } = {
  blog: 'BLOG POST',
  research: 'RESEARCH',
  project: 'PROJECT',
  profile: 'PROFILE',
};

function generateSpectrumSVG(distribution: SpectrumDistribution): string {
  let svg = '';
  // New "Cyber Block" Design Specs
  const totalBlocks = 12;
  const gap = 4; // gap between blocks
  const totalWidth = 380; // Available width in OG template
  const blockWidth = (totalWidth - gap * (totalBlocks - 1)) / totalBlocks;
  const height = 20;
  const radius = 2;

  // Include misc so blocks reflect the full distribution (offense / defense / misc).
  const total = distribution.offensive + distribution.defensive + distribution.misc;
  const safeTotal = total === 0 ? 1 : total;
  const offCount = Math.round((distribution.offensive / safeTotal) * totalBlocks);
  let defCount = Math.round((distribution.defensive / safeTotal) * totalBlocks);

  // Clamp so offense + defense never exceed the available blocks; the remainder is misc.
  if (offCount + defCount > totalBlocks) {
    defCount = totalBlocks - offCount;
  }

  // Generate 12 blocks. Colors mirror components/SpectrumMeter.tsx.
  for (let i = 0; i < totalBlocks; i++) {
    const x = i * (blockWidth + gap);

    // misc fallback (gray-500), matching the gray used in SpectrumMeter
    let color = '#6b7280';
    let filter = 'url(#misc-glow)';

    if (i < offCount) {
      color = '#ff0055';
      filter = 'url(#offense-glow)'; // Defined in og-template.svg defs
    } else if (i < offCount + defCount) {
      color = '#00e5ff';
      filter = 'url(#defense-glow)';
    }

    svg += `<rect x="${x}" y="0" width="${blockWidth}" height="${height}" rx="${radius}" fill="${color}" filter="${filter}" opacity="0.9" />\n`;
  }
  return svg;
}

// --- Main Generation Logic ---

function generateOGImageSVG(
  node: VaultNode,
  template: string,
  opts?: { hideTypeLabel?: boolean },
): string {
  const title = node.title;
  const description = node.description || '';
  const type = node.type || 'blog';
  const typeLabel = typeLabels[type] || 'CONTENT';

  // Calculate spectrum from node content
  const contentSignal = `${title} ${description} ${node.content || ''}`;
  const spectrum = calculateSpectrum(contentSignal, node);
  const spectrumSVG = generateSpectrumSVG(spectrum);

  // Wrap title (max 2 lines, ~30-35 chars per line for font size 64)
  const titleLines = wrapText(title, 35, 2);
  const titleGroupSVG = titleLines
    .map(
      (line, idx) =>
        `<tspan x="${idx === 0 ? 0 : 0}" dy="${idx === 0 ? 0 : 75}">${escapeXML(line)}</tspan>`,
    )
    .join('');

  // Calculate max description lines based on title length to ensure visibility
  // Template was moved up to y=130, so we have more vertical space
  const maxDescLines = titleLines.length === 2 ? 4 : 6;

  // Wrap description (max lines dynamic, ~50-60 chars per line for font size 24)
  const descLines = description ? wrapText(description, 55, maxDescLines) : [];
  const descriptionGroupSVG = descLines
    .map(
      (line, idx) =>
        `<tspan x="${idx === 0 ? 0 : 0}" dy="${idx === 0 ? 0 : 35}">${escapeXML(line)}</tspan>`,
    )
    .join('');

  // Calculate adaptive Y for description group
  const titleHeight = titleLines.length === 2 ? 75 + 64 : 64; // Height for 2 lines or 1 line (64 is approx font size)
  const descriptionY = 110 + titleHeight + 20; // 110 (title base Y) + title height + 20px buffer

  // Generate particles (random positions)
  const particles: Array<{ x: number; y: number; size: number; color: string; opacity: number }> =
    [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * 1200,
      y: Math.random() * 630,
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.5 ? '#ff0055' : '#00e5ff',
      opacity: Math.random() * 0.4 + 0.2,
    });
  }

  const particlesSVG = particles
    .map(
      (p) =>
        `    <circle cx="${p.x}" cy="${p.y}" r="${p.size}" fill="${p.color}" opacity="${p.opacity}"/>`,
    )
    .join('\n');

  // Replace placeholders in template. Drop the whole "Type Label Pill" group
  // when hidden, so the card shows no empty pill (used for the default card).
  const base = opts?.hideTypeLabel
    ? template.replace(/\s*<!-- Type Label Pill -->[\s\S]*?<\/g>/, '')
    : template;
  const result = base
    .replace('{{PARTICLES}}', particlesSVG)
    .replace('{{TYPE_LABEL}}', typeLabel)
    .replace('{{SPECTRUM_BARS}}', spectrumSVG)
    .replace(/{{TITLE_GROUP}}/g, titleGroupSVG) // Global replace for all glitch layers
    .replace('{{DESCRIPTION_Y}}', descriptionY.toString())
    .replace('{{DESCRIPTION_GROUP}}', descriptionGroupSVG);

  return result;
}

async function generateOGImages() {
  const vaultData = loadVaultData();
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'og');
  const templatePath = path.join(__dirname, 'og-template.svg');
  const cachePath = path.join(outputDir, 'og-cache.json');

  // Read template SVG
  if (!fs.existsSync(templatePath)) {
    console.error(`✗ Template file not found: ${templatePath}`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Create output directory
  ensureDir(outputDir);

  // Load cache
  let cache: Record<string, string> = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    } catch {
      console.warn('Failed to load cache, starting fresh.');
    }
  }

  let generated = 0;
  let skipped = 0;

  for (const node of vaultData) {
    // Skip system nodes
    if (node.type === 'system' || node.id === 'root' || node.id === 'home') {
      continue;
    }

    // Generate filename based on node ID (PNG instead of SVG)
    const baseFilename = node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const pngFilename = `${baseFilename}.png`;
    const pngPath = path.join(outputDir, pngFilename);
    const tempSvgPath = path.join(outputDir, `${baseFilename}.svg.tmp`);

    // Calculate hash of content (title, description, type, content)
    // We don't include particles or spectrum calculation details here, just the input data
    const contentHash = crypto
      .createHash('md5')
      .update(node.title || '')
      .update(node.description || '')
      .update(node.type || '')
      .update(node.content || '')
      .digest('hex');

    // Check cache
    if (cache[node.id] === contentHash && fs.existsSync(pngPath)) {
      skipped++;
      continue;
    }

    try {
      // Generate SVG from template
      const svg = generateOGImageSVG(node, template);

      // Write temporary SVG file
      fs.writeFileSync(tempSvgPath, svg, 'utf-8');

      // Convert SVG to PNG using sharp (1200 × 630)
      await sharp(tempSvgPath)
        .resize(1200, 630)
        .png({
          compressionLevel: 9,
          quality: 100,
          palette: true,
        })
        .toFile(pngPath);

      // Remove temporary SVG file
      fs.unlinkSync(tempSvgPath);

      // Update cache
      cache[node.id] = contentHash;

      generated++;
      console.log(`  ✓ Generated OG image: ${pngFilename}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate OG image for ${node.id}:`, error);
      if (fs.existsSync(tempSvgPath)) {
        fs.unlinkSync(tempSvgPath);
      }
    }
  }

  // Default card: the social image for every non-content page (homepage,
  // the posts/projects/research listings, 404, etc.) that has no node of its
  // own. Built from the site identity so it regenerates with the pipeline.
  const defaultNode = {
    id: 'og-default',
    title: config.siteTitle,
    description: config.siteDescription,
    type: 'profile',
    content: '',
  } as VaultNode;
  const defaultPngPath = path.join(outputDir, 'default.png');
  const defaultHash = crypto
    .createHash('md5')
    .update(defaultNode.title || '')
    .update(defaultNode.description || '')
    .digest('hex');

  if (cache['og-default'] === defaultHash && fs.existsSync(defaultPngPath)) {
    skipped++;
  } else {
    const tempSvgPath = path.join(outputDir, 'default.svg.tmp');
    try {
      fs.writeFileSync(
        tempSvgPath,
        generateOGImageSVG(defaultNode, template, { hideTypeLabel: true }),
        'utf-8',
      );
      await sharp(tempSvgPath)
        .resize(1200, 630)
        .png({ compressionLevel: 9, quality: 100, palette: true })
        .toFile(defaultPngPath);
      fs.unlinkSync(tempSvgPath);
      cache['og-default'] = defaultHash;
      generated++;
      console.log('  ✓ Generated OG image: default.png');
    } catch (error) {
      console.error('  ✗ Failed to generate default OG image:', error);
      if (fs.existsSync(tempSvgPath)) fs.unlinkSync(tempSvgPath);
    }
  }

  // Save cache
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  console.log(`\n✓ Generated ${generated} OG images, skipped ${skipped} unchanged`);
  console.log(`  - Output: ${outputDir}`);
}

// Run generator
generateOGImages().catch(console.error);
