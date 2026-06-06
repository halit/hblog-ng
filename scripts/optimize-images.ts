import sharp from 'sharp';
import fs, { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { getVaultPath } from './lib/vault-path';

interface OptimizeOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Optimize a single image to WebP format
 */
async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions = {},
): Promise<void> {
  const { quality = 85, maxWidth = 1920, maxHeight = 1920 } = options;

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Calculate dimensions if resizing is needed
    let width = metadata.width;
    let height = metadata.height;

    if (width && height) {
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
    }

    // Convert to WebP with optimization
    await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 6, // Higher effort = better compression but slower
      })
      .toFile(outputPath);

    console.log(`✓ Optimized: ${basename(inputPath)} → ${basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error);
    throw error;
  }
}

/**
 * Process all images in a directory
 */
async function processDirectory(
  inputDir: string,
  outputDir: string,
  options: OptimizeOptions = {},
): Promise<{ processed: number; skipped: number; converted: Map<string, string> }> {
  if (!existsSync(inputDir)) {
    console.warn(`Directory not found: ${inputDir}`);
    return { processed: 0, skipped: 0, converted: new Map() };
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const files = readdirSync(inputDir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  const converted = new Map<string, string>(); // original -> webp mapping

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = join(inputDir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Cover images live at vault/assets/covers but are served under /images/covers,
      // so mirror them into the images subtree rather than a top-level public/covers.
      const subOutputDir =
        file === 'covers' && basename(inputDir) === 'assets'
          ? join(outputDir, 'images', 'covers')
          : join(outputDir, file);

      // Recursively process subdirectories
      const subResult = await processDirectory(filePath, subOutputDir, options);
      processed += subResult.processed;
      skipped += subResult.skipped;
      subResult.converted.forEach((webp, orig) => converted.set(orig, webp));
      continue;
    }

    const ext = extname(file).toLowerCase();

    // If not an image to optimize, just copy it
    if (!imageExtensions.includes(ext)) {
      const outputPath = join(outputDir, file);

      // Only copy if destination doesn't exist or source is newer
      if (!existsSync(outputPath) || stat.mtimeMs > statSync(outputPath).mtimeMs) {
        fs.copyFileSync(filePath, outputPath);
      }

      skipped++;
      continue;
    }

    // Generate output filename (always replace extension with .webp)
    const baseName = basename(file, ext);
    const outputPath = join(outputDir, `${baseName}.webp`);

    // Check if we're processing a file that is already webp
    const isWebP = ext === '.webp';

    // If it's already WebP, just copy it (unless we want to re-optimize it, but simple copy is safer for now)
    if (isWebP) {
      // Even if it is WebP, check if we need to copy it to output
      if (!existsSync(outputPath) || stat.mtimeMs > statSync(outputPath).mtimeMs) {
        fs.copyFileSync(filePath, outputPath);
      }
      // We still count it as "converted" for the mapping purpose so references get updated to .webp extension
      // (though if it was already .webp, the mapping key==value)
      converted.set(file, `${baseName}.webp`);
      skipped++; // Count as skipped for optimization logic
      continue;
    }

    // Check if output file exists and is newer than input file
    if (existsSync(outputPath)) {
      const outputStat = statSync(outputPath);
      if (outputStat.mtimeMs > stat.mtimeMs) {
        skipped++;
        // Add to converted map anyway so references are updated
        converted.set(file, `${baseName}.webp`);
        continue;
      }
    }

    try {
      await optimizeImage(filePath, outputPath, options);
      converted.set(file, `${baseName}.webp`);
      processed++;

      // Delete original file from output directory if it exists (e.g., example1.jpeg after creating example1.webp)
      // But DO NOT delete it from vault/assets source!
      const originalInOutput = join(outputDir, file);
      if (existsSync(originalInOutput) && originalInOutput !== filePath) {
        fs.unlinkSync(originalInOutput);
        console.log(`  → Deleted original from output: ${basename(originalInOutput)}`);
      }
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  return { processed, skipped, converted };
}

/**
 * Update image references in vault.json to use WebP
 */
async function updateVaultJsonReferences(converted: Map<string, string>) {
  const vaultJsonPath = join(process.cwd(), 'public', 'vault.json');
  if (!existsSync(vaultJsonPath)) {
    return;
  }

  const vaultData = JSON.parse(fs.readFileSync(vaultJsonPath, 'utf-8'));
  let updated = false;

  for (const node of vaultData) {
    // Update cover_image
    if (node.cover_image) {
      for (const [original, webp] of converted.entries()) {
        if (node.cover_image.includes(original)) {
          node.cover_image = node.cover_image.replace(original, webp);
          updated = true;
        }
      }
    }

    // Update image references in content
    if (node.content) {
      for (const [original, webp] of converted.entries()) {
        const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (regex.test(node.content)) {
          node.content = node.content.replace(regex, webp);
          updated = true;
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(vaultJsonPath, JSON.stringify(vaultData, null, 2));
    console.log('✓ Updated image references in vault.json');
  }
}

/**
 * Main function
 */
async function main() {
  const vaultPath = getVaultPath();
  const vaultAssetsDir = join(vaultPath, 'assets');
  const publicDir = join(process.cwd(), 'public');

  if (!existsSync(vaultPath)) {
    console.error(`Error: Vault directory not found: ${vaultPath}`);
    console.error('Please set VAULT_PATH environment variable');
    console.error('Example: VAULT_PATH=/path/to/vault npm run optimize-images');
    process.exit(1);
  }

  console.log('🖼️  Starting asset optimization and sync...\n');
  console.log(`Input: ${vaultAssetsDir}`);
  console.log(`Output: ${publicDir}\n`);

  try {
    const result = await processDirectory(vaultAssetsDir, publicDir, {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1920,
    });

    console.log(`\nProcessed ${result.processed} images, skipped ${result.skipped} files`);

    // Clean up original files from output directory that have webp versions
    const cleanupOriginalFiles = (dir: string) => {
      if (!existsSync(dir)) return;

      const files = readdirSync(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          cleanupOriginalFiles(filePath);
          continue;
        }

        const ext = extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
          const baseName = basename(file, ext);
          const webpPath = join(dir, `${baseName}.webp`);

          // If webp version exists, delete the original
          if (existsSync(webpPath)) {
            fs.unlinkSync(filePath);
            console.log(`  → Cleaned up original: ${basename(filePath)}`);
          }
        }
      }
    };

    cleanupOriginalFiles(publicDir);

    // Cleanup legacy images/images folder if it exists
    const legacyImagesDir = join(publicDir, 'images', 'images');
    if (existsSync(legacyImagesDir)) {
      fs.rmSync(legacyImagesDir, { recursive: true, force: true });
      console.log('  → Cleaned up legacy images/images directory');
    }

    // Update vault.json references if any images were converted
    if (result.converted.size > 0) {
      await updateVaultJsonReferences(result.converted);
    }

    console.log('\n✅ Image optimization complete!');
  } catch (error) {
    console.error('\n❌ Image optimization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { optimizeImage, processDirectory };
