import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const sourceFile = 'resources/icon.png';
const outputDir = 'public/icons';
const sizes = [48, 72, 96, 128, 192, 256, 512];

async function generate() {
  try {
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source file ${sourceFile} not found!`);
      process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Loading source image: ${sourceFile}...`);
    const image = await Jimp.read(sourceFile);

    for (const size of sizes) {
      const outputName = `icon-${size}x${size}.png`;
      const outputPath = path.join(outputDir, outputName);
      
      const resized = image.clone();
      resized.resize({ w: size, h: size });
      await resized.write(outputPath);
      console.log(`Generated: ${outputPath}`);
    }

    console.log('All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating PWA icons:', error);
    process.exit(1);
  }
}

generate();
