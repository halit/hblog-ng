import fs from 'fs';
import path from 'path';

export function processCoverImage(
  coverImage: string | undefined,
  filePath: string,
  vaultDir: string,
  publicImagesDir: string,
): string | undefined {
  if (!coverImage) return undefined;

  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    console.warn(`External image URL detected: ${coverImage}`);
    return coverImage;
  }

  let imagePath: string;
  if (path.isAbsolute(coverImage)) {
    imagePath = coverImage;
  } else if (coverImage.startsWith('assets/images/headers/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (coverImage.startsWith('assets/headers/')) {
    imagePath = path.join(vaultDir, 'assets', 'images', 'headers', path.basename(coverImage));
  } else if (coverImage.startsWith('assets/images/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (coverImage.startsWith('assets/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (!coverImage.includes('/') && !coverImage.includes('\\')) {
    const headerPath = path.join(vaultDir, 'assets', 'images', 'headers', coverImage);
    if (fs.existsSync(headerPath)) {
      imagePath = headerPath;
    } else {
      imagePath = path.resolve(path.dirname(filePath), coverImage);
    }
  } else {
    imagePath = path.resolve(path.dirname(filePath), coverImage);
  }

  if (fs.existsSync(imagePath)) {
    const imageName = path.basename(imagePath);
    const fileExt = path.extname(imageName).toLowerCase();
    const vaultHeadersDir = path.join(vaultDir, 'assets', 'images', 'headers');

    const isHeader = imagePath.startsWith(vaultHeadersDir) || coverImage.includes('headers/');

    // Directories setup
    const vaultImagesDir = path.join(vaultDir, 'assets', 'images');
    const destDir = isHeader ? vaultHeadersDir : vaultImagesDir;

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, imageName);
    if (imagePath !== destPath && !fs.existsSync(destPath)) {
      fs.copyFileSync(imagePath, destPath);
    }

    // Public Copy
    const publicDestDir = isHeader ? path.join(publicImagesDir, 'headers') : publicImagesDir;
    if (!fs.existsSync(publicDestDir)) fs.mkdirSync(publicDestDir, { recursive: true });

    const publicPath = path.join(publicDestDir, imageName);
    if (!fs.existsSync(publicPath)) {
      fs.copyFileSync(destPath, publicPath);
    }

    // WebP conversion logic check (mocked string replacement as per original)
    const convertibleExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
    let finalName = imageName;
    if (convertibleExts.includes(fileExt)) {
      finalName = `${path.basename(imageName, fileExt)}.webp`;
    }

    return isHeader ? `/images/headers/${finalName}` : `/images/${finalName}`;
  }

  return undefined;
}
