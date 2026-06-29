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
  } else if (coverImage.startsWith('assets/covers/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (coverImage.startsWith('assets/images/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (coverImage.startsWith('assets/')) {
    imagePath = path.join(vaultDir, coverImage);
  } else if (!coverImage.includes('/') && !coverImage.includes('\\')) {
    const coverPath = path.join(vaultDir, 'assets', 'covers', coverImage);
    if (fs.existsSync(coverPath)) {
      imagePath = coverPath;
    } else {
      imagePath = path.resolve(path.dirname(filePath), coverImage);
    }
  } else {
    imagePath = path.resolve(path.dirname(filePath), coverImage);
  }

  if (fs.existsSync(imagePath)) {
    const imageName = path.basename(imagePath);
    const fileExt = path.extname(imageName).toLowerCase();
    const vaultCoversDir = path.join(vaultDir, 'assets', 'covers');

    const isCover = imagePath.startsWith(vaultCoversDir) || coverImage.includes('covers/');

    // Directories setup
    const vaultImagesDir = path.join(vaultDir, 'assets', 'images');
    const destDir = isCover ? vaultCoversDir : vaultImagesDir;

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, imageName);
    if (imagePath !== destPath && !fs.existsSync(destPath)) {
      fs.copyFileSync(imagePath, destPath);
    }

    // Public Copy
    const publicDestDir = isCover ? path.join(publicImagesDir, 'covers') : publicImagesDir;
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

    return isCover ? `/images/covers/${finalName}` : `/images/${finalName}`;
  }

  return undefined;
}
