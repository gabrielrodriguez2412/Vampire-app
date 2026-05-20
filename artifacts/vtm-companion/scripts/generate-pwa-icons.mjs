// Generate the PWA PNG icons referenced by `public/manifest.webmanifest`.
//
// Why this exists:
//   The web manifest needs at least one square PNG icon (Chrome warns
//   "Most operating systems require square icons" and Play Store / TWA
//   tooling will not accept an SVG-only icon set). Producing those PNGs
//   without pulling in a binary image dependency keeps the dev setup
//   minimal — this script uses only Node's built-in `zlib` to assemble
//   real PNGs from scratch.
//
// What it produces (all written into `public/`):
//   - icon-192.png             (any-purpose, 192x192)
//   - icon-512.png             (any-purpose, 512x512)
//   - icon-maskable-512.png    (maskable,    512x512)
//
// The current artwork is intentionally a flat solid color in the app's
// theme red (#8b0000). It is a generic placeholder so an install today
// produces a visible icon on the home screen — no official Vampire: The
// Masquerade artwork is used, no copyrighted logos.
//
// Run once after editing:
//   node scripts/generate-pwa-icons.mjs
// (or from the repo root: pnpm --dir artifacts/vtm-companion run icons)
//
// Final designed PNGs should eventually replace these — see
// docs/mobile-app-readiness.md.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Build a square PNG filled with a single RGBA color. `size` is the side
 * length in pixels; `rgba` is a 4-tuple in 0..255. Returns a Buffer.
 */
function solidPng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8;  // bit depth: 8
  ihdr[9] = 6;  // color type: truecolor + alpha (RGBA)
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter: standard
  ihdr[12] = 0; // interlace: none

  // Raw image: for each row, a leading filter byte (0 = none) followed by
  // size*4 RGBA bytes. Deflate the whole thing into a single IDAT chunk.
  const rowLen = 1 + size * 4;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    const offset = y * rowLen;
    raw[offset] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const p = offset + 1 + x * 4;
      raw[p]     = rgba[0];
      raw[p + 1] = rgba[1];
      raw[p + 2] = rgba[2];
      raw[p + 3] = rgba[3];
    }
  }
  const idatData = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const themeRed = [139, 0, 0, 255]; // #8b0000 — matches manifest theme_color

const outputs = [
  ['icon-192.png',          192],
  ['icon-512.png',          512],
  ['icon-maskable-512.png', 512],
];

for (const [name, size] of outputs) {
  const png = solidPng(size, themeRed);
  writeFileSync(resolve(PUBLIC_DIR, name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
