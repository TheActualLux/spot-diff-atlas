// Between Tides entry packager. Validate the supplied cover states first, then assemble the
// browser game and its screenshots into the make.fun dossier directory.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = dirname(fileURLToPath(import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const shotFiles = ['1-start.jpg', '2-play.jpg', '3-end.jpg'];
const maximumShotBytes = 256 * 1024;
const expectedWidth = 1280;
const expectedHeight = 800;

function report(message) {
  console.log(`[Between Tides] ${message}`);
}

function fail(message) {
  throw new Error(`[Between Tides] ${message}`);
}

function isStartOfFrame(marker) {
  return [
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ].includes(marker);
}

function readJpegSize(bytes, filename) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    fail(`${filename} is not a JPEG file (missing SOI marker).`);
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      fail(`${filename} has an invalid JPEG marker at byte ${offset}.`);
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) break;

    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      fail(`${filename} contains a truncated JPEG segment.`);
    }
    if (isStartOfFrame(marker)) {
      if (segmentLength < 7) fail(`${filename} has a malformed JPEG frame header.`);
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }

  fail(`${filename} has no readable JPEG frame header.`);
}

function validateScreenshotSet() {
  const folder = join(repository, 'screenshots');
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    fail('The screenshots/ directory is missing.');
  }

  report(`Checking ${shotFiles.length} required screenshot files.`);
  for (const filename of shotFiles) {
    const fullPath = join(folder, filename);
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
      fail(`Required screenshot is missing: screenshots/${filename}`);
    }

    const bytes = readFileSync(fullPath);
    if (bytes.length >= maximumShotBytes) {
      fail(`screenshots/${filename} is ${bytes.length} bytes; each JPEG must be under ${maximumShotBytes} bytes.`);
    }

    const { width, height } = readJpegSize(bytes, `screenshots/${filename}`);
    if (width !== expectedWidth || height !== expectedHeight) {
      fail(`screenshots/${filename} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}.`);
    }
    report(`  ✓ ${filename} — ${width}x${height}, ${bytes.length} bytes`);
  }
}

function copyGameFiles() {
  const source = join(repository, 'game');
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    fail('The game/ directory is missing; nothing can be packaged.');
  }
  report('Copying game/ into the entry directory.');
  cpSync(source, join(destination, 'game'), { recursive: true });
}

function copyScreenshotFiles() {
  const source = join(repository, 'screenshots');
  report('Copying validated screenshots/ into the entry directory.');
  cpSync(source, join(destination, 'screenshots'), { recursive: true });
}

function writeEntryDossier() {
  const dossierPath = join(destination, 'dossier.json');
  const dossier = buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: maximumShotBytes },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(dossierPath, dossier);
  report(`Wrote dossier.json to ${dossierPath}.`);
}

function packageEntry() {
  report(`Preparing output at ${destination}.`);
  validateScreenshotSet();
  mkdirSync(destination, { recursive: true });
  copyGameFiles();
  copyScreenshotFiles();
  writeEntryDossier();
  report('Entry packaging finished successfully.');
}

packageEntry();
