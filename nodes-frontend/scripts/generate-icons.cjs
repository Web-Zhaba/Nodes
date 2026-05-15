const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

const BG_COLOR = '#030303';
const TEXT_COLOR = '#ffffff';

async function generateIcon() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, 1024, 1024);

  // Text
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 200px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Nodes', 512, 512);

  // Decorative circle
  ctx.strokeStyle = TEXT_COLOR;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(512, 512, 400, 0, Math.PI * 2);
  ctx.stroke();

  const buffer = await canvas.encode('png');
  fs.writeFileSync('resources/icon.png', buffer);
  console.log('Generated resources/icon.png (1024x1024)');
}

async function generateSplash() {
  const canvas = createCanvas(2732, 2732);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, 2732, 2732);

  // Text
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 280px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Nodes', 1366, 1366);

  // Subtitle
  ctx.font = '80px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('Новый взгляд на формирование привычек', 1366, 1500);

  const buffer = await canvas.encode('png');
  fs.writeFileSync('resources/splash.png', buffer);
  console.log('Generated resources/splash.png (2732x2732)');
}

(async () => {
  await generateIcon();
  await generateSplash();
})();
