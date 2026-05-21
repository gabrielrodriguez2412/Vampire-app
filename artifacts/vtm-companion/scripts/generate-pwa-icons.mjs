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
// Design:
//   Near-black `#0a0a0a` rounded tile. A red-outlined gothic book sits
//   centered inside: a deep-red outer rounded rectangle (`#8b0000`) acts
//   as the visible border, a charcoal inner cover (`#1f1f1f`) gives the
//   book its dark silhouette, a slightly darker red spine band (`#6b0000`)
//   runs down the left of the cover, and a brighter red blood drop
//   (`#b91c1c`) sits on the cover. Red is used as an accent (border +
//   spine + drop), not as the bulk of the book — this is what makes the
//   book read as a book at small sizes rather than as a solid red panel.
//   Original geometry composed from primitives — no clan symbols, no
//   White Wolf / Paradox marks, no copyrighted artwork. Sized to fit
//   comfortably inside the maskable safe zone so launchers that apply a
//   circular / squircle / rounded mask never crop the artwork.
//
// Run after editing this script or after editing favicon.svg (the two
// should match visually):
//
//   pnpm --dir artifacts/vtm-companion run icons

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// Minimal PNG encoder (stdlib zlib only).
// ---------------------------------------------------------------------------

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

/** Encode raw RGBA8 pixel data (size × size) into a PNG buffer. */
function encodePng(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowLen = 1 + size * 4;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idatData = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Shape predicates. All inputs/outputs in pixel coords on a `size × size`
// canvas. Designed against a 512-base; callers scale every constant.
// ---------------------------------------------------------------------------

/** True when (px, py) is inside a rounded-corner square of `size` and corner
 *  radius `r`. Coordinates are pixel-center samples. */
function insideRoundedSquare(px, py, size, r) {
  if (px < r && py < r) {
    const dx = r - px, dy = r - py;
    return dx * dx + dy * dy <= r * r;
  }
  if (px >= size - r && py < r) {
    const dx = px - (size - r), dy = r - py;
    return dx * dx + dy * dy <= r * r;
  }
  if (px < r && py >= size - r) {
    const dx = r - px, dy = py - (size - r);
    return dx * dx + dy * dy <= r * r;
  }
  if (px >= size - r && py >= size - r) {
    const dx = px - (size - r), dy = py - (size - r);
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

/** True when (px, py) is inside an axis-aligned rounded rectangle defined by
 *  its top-left corner (rx, ry), width, height, and corner radius `r`. */
function insideRoundedRect(px, py, rx, ry, w, h, r) {
  if (px < rx || py < ry || px >= rx + w || py >= ry + h) return false;
  // Top-left corner
  if (px < rx + r && py < ry + r) {
    const dx = rx + r - px, dy = ry + r - py;
    return dx * dx + dy * dy <= r * r;
  }
  // Top-right
  if (px >= rx + w - r && py < ry + r) {
    const dx = px - (rx + w - r), dy = ry + r - py;
    return dx * dx + dy * dy <= r * r;
  }
  // Bottom-left
  if (px < rx + r && py >= ry + h - r) {
    const dx = rx + r - px, dy = py - (ry + h - r);
    return dx * dx + dy * dy <= r * r;
  }
  // Bottom-right
  if (px >= rx + w - r && py >= ry + h - r) {
    const dx = px - (rx + w - r), dy = py - (ry + h - r);
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

/** True when (px, py) is inside an axis-aligned rectangle. */
function insideRect(px, py, rx, ry, w, h) {
  return px >= rx && py >= ry && px < rx + w && py < ry + h;
}

/**
 * True when (px, py) is inside a teardrop pointing up:
 *   - lower half is a filled circle of radius `r` centered at (cx, cyCenter)
 *   - upper half is an isoceles triangle whose two edges are tangent to that
 *     circle and meet at the apex (cx, cyTip), with cyTip < cyCenter
 */
function insideDrop(px, py, cx, cyCenter, r, cyTip) {
  const ddx = px - cx, ddy = py - cyCenter;
  if (ddx * ddx + ddy * ddy <= r * r) return true;

  const h = cyCenter - cyTip;
  if (h <= r) return false;
  const sinT = r / h;
  const cosT = Math.sqrt(1 - sinT * sinT);
  const tangentDx = r * sinT;
  const tangentDy = r * cosT;
  const Lx = cx - tangentDx, Ly = cyCenter - tangentDy;
  const Rx = cx + tangentDx, Ry = cyCenter - tangentDy;
  const Tx = cx,             Ty = cyTip;

  const sgn = (ax, ay, bx, by, qx, qy) =>
    (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
  const s1 = sgn(Tx, Ty, Lx, Ly, px, py);
  const s2 = sgn(Lx, Ly, Rx, Ry, px, py);
  const s3 = sgn(Rx, Ry, Tx, Ty, px, py);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

// ---------------------------------------------------------------------------
// Compose pixels.
// ---------------------------------------------------------------------------

const BG     = [10,  10,  10,  255]; // #0a0a0a — outer tile
const BORDER = [139, 0,   0,   255]; // #8b0000 — outer red book outline
const COVER  = [31,  31,  31,  255]; // #1f1f1f — inner dark cover (charcoal)
const SPINE  = [107, 0,   0,   255]; // #6b0000 — red spine band
const DROP   = [185, 28,  28,  255]; // #b91c1c — drop accent
const CLEAR  = [0,   0,   0,   0  ];

/**
 * Build the icon pixels for a `size × size` canvas using the 512-base
 * constants that match `public/favicon.svg`.
 */
function buildIconPixels(size) {
  const s = size / 512;
  // Background tile
  const bgCornerR = 100 * s;
  // Outer red book outline (the visible border around the dark cover)
  const outerX = 92 * s, outerY = 48 * s, outerW = 328 * s, outerH = 416 * s, outerR = 22 * s;
  // Inner dark cover (charcoal so the book reads against the tile even
  // before the red border is resolvable at very small sizes)
  const coverX = 110 * s, coverY = 66 * s, coverW = 292 * s, coverH = 380 * s, coverR = 12 * s;
  // Spine band (kept inside the inner cover's corner radius)
  const spineX = 110 * s, spineY = 78 * s, spineW = 36 * s, spineH = 356 * s;
  // Drop sitting on the cover, right of the spine
  const dropCx = 274 * s, dropCyCenter = 280 * s, dropR = 50 * s, dropCyTip = 180 * s;

  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sample pixel centers for tighter edges than corner sampling.
      const px = x + 0.5;
      const py = y + 0.5;

      let color;
      if (!insideRoundedSquare(px, py, size, bgCornerR)) {
        color = CLEAR;
      } else {
        // Default to tile background; layer outer-red book → inner dark
        // cover → spine → drop on top.
        color = BG;
        if (insideRoundedRect(px, py, outerX, outerY, outerW, outerH, outerR)) {
          color = BORDER;
          if (insideRoundedRect(px, py, coverX, coverY, coverW, coverH, coverR)) {
            color = COVER;
            if (insideRect(px, py, spineX, spineY, spineW, spineH)) color = SPINE;
            if (insideDrop(px, py, dropCx, dropCyCenter, dropR, dropCyTip)) color = DROP;
          }
        }
      }

      const off = (y * size + x) * 4;
      out[off]     = color[0];
      out[off + 1] = color[1];
      out[off + 2] = color[2];
      out[off + 3] = color[3];
    }
  }
  return out;
}

const outputs = [
  ['icon-192.png',          192],
  ['icon-512.png',          512],
  ['icon-maskable-512.png', 512],
];

for (const [name, size] of outputs) {
  const pixels = buildIconPixels(size);
  const png = encodePng(size, pixels);
  writeFileSync(resolve(PUBLIC_DIR, name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
