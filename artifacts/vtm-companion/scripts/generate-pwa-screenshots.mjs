// Generate the PWA manifest screenshots referenced by
// `public/manifest.webmanifest`.
//
// Why this exists:
//   Chrome DevTools → Application → Manifest warns when the `screenshots`
//   field is missing ("Richer PWA install UI screenshots are missing").
//   We produce two stylized branded mockups so the install card is rich
//   without committing real captured screenshots that could bake in
//   private data or copyrighted IP. The mockups echo the actual app's
//   visual identity (dark gothic background, red accents, the same book
//   icon mark used in `favicon.svg` and the PWA icons) so the install
//   prompt feels honest, not generic stock art.
//
// What it produces (all written into `public/`):
//   - screenshot-wide.png    1280×720   (desktop / landscape)
//   - screenshot-mobile.png   390×844   (mobile portrait)
//
// Like `generate-pwa-icons.mjs`, this script uses only Node's built-in
// `zlib` to assemble real PNGs from scratch — no binary image dependency.
//
// Run when the design or sizes change:
//   pnpm --dir artifacts/vtm-companion run screenshots

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// Minimal PNG encoder (stdlib zlib only). Same shape as generate-pwa-icons
// — duplicated intentionally so each script stays self-contained and runs
// with no shared module import.
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

/** Encode raw RGBA8 pixel data (w × h) into a PNG buffer. */
function encodePng(w, h, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); // width
  ihdr.writeUInt32BE(h, 4); // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowLen = 1 + w * 4;
  const raw = Buffer.alloc(rowLen * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * w * 4, (y + 1) * w * 4);
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
// Tiny canvas helpers — all coordinates are integers in pixel space, all
// colors are [R, G, B, A] in 0..255. The mockups are simple enough that
// rectangular fills and a single rounded-rect helper cover everything.
// ---------------------------------------------------------------------------

function makeCanvas(w, h, bg) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < out.length; i += 4) {
    out[i]     = bg[0];
    out[i + 1] = bg[1];
    out[i + 2] = bg[2];
    out[i + 3] = bg[3];
  }
  return { w, h, pixels: out };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) return;
  const off = (y * canvas.w + x) * 4;
  canvas.pixels[off]     = color[0];
  canvas.pixels[off + 1] = color[1];
  canvas.pixels[off + 2] = color[2];
  canvas.pixels[off + 3] = color[3];
}

function fillRect(canvas, x, y, w, h, color) {
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(canvas.w, x + w), y1 = Math.min(canvas.h, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      setPixel(canvas, xx, yy, color);
    }
  }
}

function fillRoundedRect(canvas, x, y, w, h, r, color) {
  // Straight bands (top/bottom strips of full width, middle strip of full
  // height) fill the bulk; four corner discs fill the rounded corners.
  fillRect(canvas, x + r, y,         w - 2 * r, h,         color); // middle vertical band
  fillRect(canvas, x,     y + r,     r,         h - 2 * r, color); // left band
  fillRect(canvas, x + w - r, y + r, r,         h - 2 * r, color); // right band
  // Corners
  for (let dy = 0; dy < r; dy++) {
    for (let dx = 0; dx < r; dx++) {
      const ddx = r - 0.5 - dx, ddy = r - 0.5 - dy;
      if (ddx * ddx + ddy * ddy <= r * r) {
        setPixel(canvas, x + dx,             y + dy,             color);
        setPixel(canvas, x + w - 1 - dx,     y + dy,             color);
        setPixel(canvas, x + dx,             y + h - 1 - dy,     color);
        setPixel(canvas, x + w - 1 - dx,     y + h - 1 - dy,     color);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// The same book icon mark as `favicon.svg` and the PWA PNGs, drawn at any
// requested size. Reused inside both screenshots so the screenshot mockups
// agree with the launcher icon.
// ---------------------------------------------------------------------------

function drawIconMark(canvas, x, y, size) {
  // 512-base constants — identical to generate-pwa-icons.mjs.
  const s = size / 512;
  const tileR    = 100 * s;
  const outerX = x + 92 * s, outerY = y + 48 * s, outerW = 328 * s, outerH = 416 * s, outerR = 22 * s;
  const coverX = x + 110 * s, coverY = y + 66 * s, coverW = 292 * s, coverH = 380 * s, coverR = 12 * s;
  const spineX = x + 110 * s, spineY = y + 78 * s, spineW = 36 * s, spineH = 356 * s;
  const dropCx = x + 274 * s, dropCyCenter = y + 280 * s, dropR = 50 * s, dropCyTip = y + 180 * s;

  const TILE   = [10,  10,  10,  255];
  const BORDER = [139, 0,   0,   255];
  const COVER  = [31,  31,  31,  255];
  const SPINE  = [107, 0,   0,   255];
  const DROP   = [185, 28,  28,  255];

  // Outer tile
  fillRoundedRect(canvas, Math.round(x), Math.round(y), Math.round(size), Math.round(size), Math.round(tileR), TILE);
  // Outer red book outline
  fillRoundedRect(canvas, Math.round(outerX), Math.round(outerY), Math.round(outerW), Math.round(outerH), Math.round(outerR), BORDER);
  // Inner dark cover
  fillRoundedRect(canvas, Math.round(coverX), Math.round(coverY), Math.round(coverW), Math.round(coverH), Math.round(coverR), COVER);
  // Spine
  fillRect(canvas, Math.round(spineX), Math.round(spineY), Math.round(spineW), Math.round(spineH), SPINE);
  // Drop: pixel-by-pixel via the same predicate the icon generator uses
  const h = dropCyCenter - dropCyTip;
  const sinT = dropR / h, cosT = Math.sqrt(1 - sinT * sinT);
  const Lx = dropCx - dropR * sinT, Ly = dropCyCenter - dropR * cosT;
  const Rx = dropCx + dropR * sinT, Ry = dropCyCenter - dropR * cosT;
  const Tx = dropCx,                Ty = dropCyTip;
  const sgn = (ax, ay, bx, by, qx, qy) => (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
  // Bounding box of the drop area
  const minX = Math.floor(dropCx - dropR);
  const maxX = Math.ceil (dropCx + dropR);
  const minY = Math.floor(dropCyTip);
  const maxY = Math.ceil (dropCyCenter + dropR);
  for (let yy = minY; yy <= maxY; yy++) {
    for (let xx = minX; xx <= maxX; xx++) {
      const px = xx + 0.5, py = yy + 0.5;
      const ddx = px - dropCx, ddy = py - dropCyCenter;
      const inCircle = ddx * ddx + ddy * ddy <= dropR * dropR;
      let inTri = false;
      if (!inCircle) {
        const s1 = sgn(Tx, Ty, Lx, Ly, px, py);
        const s2 = sgn(Lx, Ly, Rx, Ry, px, py);
        const s3 = sgn(Rx, Ry, Tx, Ty, px, py);
        inTri = (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
      }
      if (inCircle || inTri) setPixel(canvas, xx, yy, DROP);
    }
  }
}

// ---------------------------------------------------------------------------
// Tiny 5×7 bitmap font for the wordmark + a few section labels. Only the
// glyphs we actually need are defined; missing glyphs are silently treated
// as a space, which is fine for the small labels we emit.
//
// Each glyph is an array of 7 rows; each row is a string of 5 chars where
// `#` paints a pixel and `.` skips. Drawn with a configurable scale.
// ---------------------------------------------------------------------------

const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  '·': ['.....', '.....', '.....', '..#..', '.....', '.....', '.....'],
};

function drawText(canvas, text, x, y, scale, color) {
  const charW = 5 * scale;
  const charH = 7 * scale;
  const gap = scale; // horizontal gap between glyphs
  let cursor = x;
  for (const raw of text.toUpperCase()) {
    if (raw === ' ') {
      cursor += charW + gap;
      continue;
    }
    const glyph = FONT[raw];
    if (!glyph) {
      cursor += charW + gap;
      continue;
    }
    for (let gy = 0; gy < 7; gy++) {
      const row = glyph[gy];
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] === '#') {
          fillRect(canvas, cursor + gx * scale, y + gy * scale, scale, scale, color);
        }
      }
    }
    cursor += charW + gap;
  }
  return { width: cursor - x, height: charH };
}

// ---------------------------------------------------------------------------
// Mockup compositions. Each builds and returns a {w, h, pixels} canvas.
// ---------------------------------------------------------------------------

// Shared palette — matches manifest theme + the app's actual UI.
const BG_PAGE   = [10,  10,  10,  255]; // #0a0a0a
const BG_PANEL  = [23,  23,  23,  255]; // #171717 — header / sidebar / cards
const BG_PANEL2 = [31,  31,  31,  255]; // #1f1f1f — card surface
const MUTED     = [82,  82,  91,  255]; // zinc-600-ish — placeholder text glyphs
const FG        = [228, 228, 231, 255]; // zinc-200 — primary text
const RED       = [139, 0,   0,   255]; // #8b0000
const RED_HI    = [185, 28,  28,  255]; // #b91c1c — accent strip
const BORDER    = [39,  39,  42,  255]; // zinc-800 — card borders

function drawWordmark(canvas, x, y, scale) {
  // Two-color wordmark: "VTM" in red, " COMPANION" in light foreground.
  const after = drawText(canvas, 'VTM', x, y, scale, RED_HI);
  drawText(canvas, ' COMPANION', x + after.width, y, scale, FG);
}

function drawCard(canvas, x, y, w, h) {
  fillRoundedRect(canvas, x,     y,     w,     h,     12, BORDER);
  fillRoundedRect(canvas, x + 1, y + 1, w - 2, h - 2, 12, BG_PANEL2);
  // Red accent strip on the top edge of the card
  fillRect(canvas, x + 12, y + 1, w - 24, 3, RED);
  // Stripe placeholders that hint at title + body lines
  fillRect(canvas, x + 20, y + 22, Math.min(w - 60, 140), 8, FG);
  fillRect(canvas, x + 20, y + 42, w - 40, 4, MUTED);
  fillRect(canvas, x + 20, y + 52, w - 60, 4, MUTED);
  fillRect(canvas, x + 20, y + 62, w - 80, 4, MUTED);
}

function buildWideScreenshot() {
  const W = 1280, H = 720;
  const c = makeCanvas(W, H, BG_PAGE);

  // Header
  fillRect(c, 0, 0, W, 64, BG_PANEL);
  fillRect(c, 0, 63, W, 1, BORDER);
  drawIconMark(c, 16, 12, 40);
  drawWordmark(c, 72, 28, 3); // 5*3=15px tall glyphs → 21px chars

  // Sidebar (nav)
  fillRect(c, 0, 64, 240, H - 64, BG_PANEL);
  fillRect(c, 239, 64, 1, H - 64, BORDER);
  const navItems = ['HOME', 'CLANS', 'DISCIPLINES', 'RULES', 'TOOLS', 'CHARACTER', 'CHRONICLE'];
  for (let i = 0; i < navItems.length; i++) {
    const ny = 96 + i * 56;
    fillRect(c, 20, ny - 4, 8, 8, i === 0 ? RED_HI : MUTED); // tiny dot
    drawText(c, navItems[i], 40, ny - 2, 2, i === 0 ? FG : MUTED);
  }

  // Main content area
  const mainX = 264, mainY = 88, mainW = W - mainX - 24;
  // Page title
  drawText(c, 'COMPANION', mainX, mainY, 4, FG);
  drawText(c, 'DASHBOARD',  mainX + 224, mainY, 4, RED_HI);
  // Featured big card
  fillRoundedRect(c, mainX, mainY + 56, mainW, 200, 14, BORDER);
  fillRoundedRect(c, mainX + 1, mainY + 57, mainW - 2, 198, 14, BG_PANEL2);
  fillRect(c, mainX + 12, mainY + 57, mainW - 24, 4, RED);
  drawText(c, 'COMBAT SUMMARY', mainX + 24, mainY + 80, 3, FG);
  drawText(c, 'OPEN PROTOCOLS', mainX + 24, mainY + 220, 2, MUTED);
  // Centerpiece: small icon mark inside the featured card on the right
  drawIconMark(c, mainX + mainW - 168, mainY + 72, 144);

  // Three smaller cards beneath
  const cardY = mainY + 280;
  const cardH = 200;
  const cardGap = 20;
  const cardW = Math.floor((mainW - 2 * cardGap) / 3);
  for (let i = 0; i < 3; i++) {
    drawCard(c, mainX + i * (cardW + cardGap), cardY, cardW, cardH);
  }

  return c;
}

function buildMobileScreenshot() {
  const W = 390, H = 844;
  const c = makeCanvas(W, H, BG_PAGE);

  // Header
  fillRect(c, 0, 0, W, 56, BG_PANEL);
  fillRect(c, 0, 55, W, 1, BORDER);
  drawIconMark(c, 12, 8, 40);
  drawWordmark(c, 64, 22, 2); // smaller wordmark for phone width

  // Page title
  drawText(c, 'COMPANION', 16, 80, 3, FG);
  drawText(c, 'DASHBOARD',  16, 120, 3, RED_HI);

  // Stack of cards, full width with margin
  let cy = 168;
  const cards = 4;
  const cw = W - 32;
  const ch = 130;
  for (let i = 0; i < cards; i++) {
    drawCard(c, 16, cy, cw, ch);
    cy += ch + 16;
  }

  // Bottom nav bar
  const navY = H - 72;
  fillRect(c, 0, navY, W, 72, BG_PANEL);
  fillRect(c, 0, navY, W, 1, BORDER);
  const navCount = 5;
  const slot = W / navCount;
  for (let i = 0; i < navCount; i++) {
    const x = Math.round(i * slot + slot / 2 - 4);
    // 8x8 dot, red for active, muted for others
    fillRect(c, x, navY + 22, 8, 8, i === 0 ? RED_HI : MUTED);
    // little label stripe under each dot
    fillRect(c, x - 8, navY + 40, 24, 3, i === 0 ? FG : MUTED);
  }

  return c;
}

// ---------------------------------------------------------------------------
// Emit.
// ---------------------------------------------------------------------------

const outputs = [
  ['screenshot-wide.png',   buildWideScreenshot],
  ['screenshot-mobile.png', buildMobileScreenshot],
];

for (const [name, build] of outputs) {
  const canvas = build();
  const png = encodePng(canvas.w, canvas.h, canvas.pixels);
  writeFileSync(resolve(PUBLIC_DIR, name), png);
  console.log(`wrote public/${name} (${canvas.w}x${canvas.h}, ${png.length} bytes)`);
}
