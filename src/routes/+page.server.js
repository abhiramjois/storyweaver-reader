import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { spawn } from 'child_process';

const BOOKS_DIR = 'books';
const METADATA_FILE = path.join(BOOKS_DIR, 'metadata.yaml');

function cleanTitle(folderName) {
  return folderName
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractAttributionNote(content) {
  const lines = content.split('\n');
  const line = lines.find(line => line.toLowerCase().includes('attribution text'));
  const match = line?.match(/Attribution Text:\s*(.*)/i);
  return match?.[1]?.trim() || content.trim();
}

function parseAttribution(content) {
  const attributionNote = extractAttributionNote(content);
  const metadata = {
    title: '',
    author: '',
    'translated by': '',
    'illustrated by': '',
    'published by': '',
    license: '',
    'attribution note': attributionNote
  };

  const titleLine = content.split('\n').find(line => line.toLowerCase().startsWith('title:'));
  if (titleLine) metadata.title = titleLine.split(':').slice(1).join(':').trim();

  const authorMatch = content.match(/written by ([\s\S]*?)(?:illustrated by|published by|under|license|$)/i);
  if (authorMatch) {
    metadata.author = authorMatch[1].split(',').map(s => s.trim()).filter(Boolean).join(', ');
  }

  const translatedByMatch = content.match(/translated by ([^,]+)/i);
  if (translatedByMatch) metadata['translated by'] = translatedByMatch[1].trim();

  const illustratedByMatch = content.match(/illustrated by ([^,]+)/i);
  if (illustratedByMatch) metadata['illustrated by'] = illustratedByMatch[1].trim();

  const publishedByMatch = content.match(/published by ([^(]+)/i);
  if (publishedByMatch) metadata['published by'] = publishedByMatch[1].trim();

  const licenseRegex = /Pratham Books \(© Pratham Books,\s*\d{4}\) under a CC BY 4\.0 license on StoryWeaver\. Read, create and translate stories for free on www\.storyweaver\.org\.in/;
  const licenseMatch = content.match(licenseRegex);
  metadata.license = licenseMatch ? licenseMatch[0] : '';

  return metadata;
}

async function checkImageMagick() {
  return new Promise((resolve) => {
    const convert = spawn('convert', ['-version']);
    convert.on('close', (code) => resolve(code === 0));
    convert.on('error', () => resolve(false));
  });
}

async function generateThumbnailWithImageMagick(pdfPath, outputPath) {
  console.log(`Attempting ImageMagick conversion (PNG output):`);
  console.log(`  Input: ${pdfPath}`);
  console.log(`  Output: ${outputPath}`);

  return new Promise((resolve, reject) => {
    const convert = spawn('convert', [
      '-density', '300',
      `${pdfPath}[0]`,
      '-colorspace', 'sRGB',
      '-resize', '400x533>',
      '-sharpen', '0x1.0',
      '-background', 'white',
      '-alpha', 'remove',
      '-strip',
      outputPath
    ]);

    let stderr = '';
    convert.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    convert.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log(`✅ Thumbnail created successfully: ${outputPath}`);
        resolve(true);
      } else {
        console.log(`❌ ImageMagick failed: ${stderr}`);
        reject(new Error(`ImageMagick error: ${stderr}`));
      }
    });

    convert.on('error', (err) => reject(err));
  });
}

async function generatePlaceholderThumbnail(outputPath, title) {
  console.log(`Creating placeholder thumbnail: ${outputPath}`);
  try {
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(300, 400);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 300, 400);

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 298, 398);

    ctx.fillStyle = '#6b7280';
    ctx.fillRect(75, 100, 150, 200);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(75, 100, 150, 20);

    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const words = title.split(' ');
    let line = '';
    let y = 340;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > 280 && i > 0) {
        ctx.fillText(line, 150, y);
        line = words[i] + ' ';
        y += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 150, y);

    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    return fs.existsSync(outputPath);
  } catch (error) {
    console.error(`❌ Placeholder error: ${error.message}`);
    return false;
  }
}

async function generateThumbnail(pdfPath, outputPath, title) {
  console.log(`\n=== Generating thumbnail ===`);
  if (!fs.existsSync(pdfPath)) {
    console.log(`❌ PDF does not exist: ${pdfPath}`);
    return false;
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const hasImageMagick = await checkImageMagick();
  if (hasImageMagick) {
    try {
      await generateThumbnailWithImageMagick(pdfPath, outputPath);
      return true;
    } catch (err) {
      console.log(`ImageMagick failed: ${err.message}`);
    }
  }

  return await generatePlaceholderThumbnail(outputPath, title);
}

export async function load() {
  console.log('Loading books...');
  const metadata = await updateMetadata();
  const books = Object.entries(metadata).map(([id, meta]) => ({
    id,
    title: meta.title,
    epubPath: meta.pdf,
    thumbnailPath: `/api/thumbnails/${id}`,
    metadata: meta
  }));

  return { books };
}

async function updateMetadata() {
  if (!fs.existsSync(BOOKS_DIR)) return {};

  let existingMetadata = {};
  if (fs.existsSync(METADATA_FILE)) {
    try {
      existingMetadata = yaml.load(fs.readFileSync(METADATA_FILE, 'utf8')) || {};
    } catch (err) {
      console.error('Error loading metadata.yaml:', err);
    }
  }

  const folders = fs.readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name);

  let updated = false;

  for (const folder of folders) {
    const folderPath = path.join(BOOKS_DIR, folder);
    const files = fs.readdirSync(folderPath);
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    const attributionFile = files.find(f => f.startsWith('StoryWeaverAttribution_'));
    const thumbnailPath = path.join(folderPath, 'thumbnail.png');
    const relativeThumbnail = `/api/thumbnails/${folder}`;

    if (!pdfFile) continue;
    const fullPdfPath = path.join(folderPath, pdfFile);
    const relativePdfPath = `/${BOOKS_DIR}/${folder}/${pdfFile}`;

    if (!existingMetadata[folder]) {
      try {
        const content = attributionFile
          ? fs.readFileSync(path.join(folderPath, attributionFile), 'utf8')
          : '';
        const meta = parseAttribution(content);
        meta.title ||= cleanTitle(folder);
        existingMetadata[folder] = meta;
        updated = true;
      } catch {
        existingMetadata[folder] = { title: cleanTitle(folder) };
        updated = true;
      }
    }

    if (!fs.existsSync(thumbnailPath)) {
      const success = await generateThumbnail(
        fullPdfPath,
        thumbnailPath,
        existingMetadata[folder].title
      );
      if (success) updated = true;
    }

    existingMetadata[folder].thumbnail = relativeThumbnail;
    existingMetadata[folder].pdf = relativePdfPath;
  }

  if (updated) {
    try {
      fs.writeFileSync(METADATA_FILE, yaml.dump(existingMetadata), 'utf8');
    } catch (err) {
      console.error('❌ Could not save metadata:', err);
    }
  }

  return existingMetadata;
}
