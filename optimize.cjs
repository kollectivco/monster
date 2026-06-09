const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PHOTOS_DIR = path.join(__dirname, 'src/styles/photos');
const IMPORTS_DIR = path.join(__dirname, 'src/imports');

async function processImage(inputPath, outputPath, maxSize) {
  try {
    await sharp(inputPath)
      .resize({
        width: maxSize,
        height: maxSize,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`Optimized: ${path.basename(outputPath)}`);
  } catch (err) {
    console.error(`Failed to process ${inputPath}:`, err);
  }
}

async function main() {
  const photos = fs.readdirSync(PHOTOS_DIR);
  for (const file of photos) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      if (file.startsWith('249A')) continue;
      
      const inputPath = path.join(PHOTOS_DIR, file);
      const parsed = path.parse(file);
      const outputPath = path.join(PHOTOS_DIR, `${parsed.name}.webp`);
      
      await processImage(inputPath, outputPath, 1000);
    }
  }

  const logoPath = path.join(IMPORTS_DIR, 'Monster_Beast_Beats_To_Ehab_Fahem-1_copy.png');
  const logoOutPath = path.join(IMPORTS_DIR, 'logo.webp');
  if (fs.existsSync(logoPath)) {
    await processImage(logoPath, logoOutPath, 1000);
  }
}

main();
