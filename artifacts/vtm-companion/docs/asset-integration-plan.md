# Asset Integration Plan

Snapshot date: 2026-05-24
Status: planning / preparation. No final assets added yet.

This document describes how the app should integrate **developer-controlled
static visual assets** in a safe, performance-aware way. It covers:

1. A final **global / app background image**.
2. A final **clan image** per clan / bloodline.
3. Possibly, in the future, default visual thumbnails for
   characters and chronicles (developer-supplied, not user-uploaded).

This is a checkpoint plan. No final images are committed yet. No file
moves, no schema changes, no backup/export changes, and no upload
feature land in this pass.

---

## 1. Purpose

Final art changes the feel of the app dramatically, but it is also the
single fastest way to regress mobile load time, PWA install size, and
visual consistency. The app is meant to:

- run as a PWA (manifest + icons already shipped),
- be wrapped later as an Android app (see `android-packaging-plan.md`),
- stay usable on a phone in portrait and landscape,
- remain visually coherent across clans, sects, and editions.

Heavy or inconsistent assets break all of the above:

- A 1.5 MB PNG per clan multiplies into ~20 MB of art being shipped on
  first load, even though the user is usually only looking at one or
  two clan pages at a time.
- A single non-tiling background loaded at desktop resolution wastes
  bandwidth on phones and pixelates on 4K.
- Art baked with text or hard light/dark hotspots fights the dark UI
  shell, the gradient overlays, and the localization layer.
- Anything that uses copyrighted official book art puts the project
  outside its current "fan-made disclaimer" footing (see
  `privacy-legal-disclaimer-plan.md`).

This plan exists so a future asset drop can be applied in one focused
pass without re-discovering all of the above.

---

## 2. Current asset state

### 2.1 Public asset folder

All static assets live in `artifacts/vtm-companion/public/`:

- `favicon.svg`
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — PWA icons.
- `manifest.webmanifest` — PWA manifest.
- `opengraph.jpg` — OpenGraph share image, **also** reused as the
  generic clan fallback banner.
- `screenshot-mobile.png`, `screenshot-wide.png` — PWA screenshots.
- `images/` — clan banner art. Currently 13 PNGs:
  `banu-haquim.png`, `brujah.png`, `gangrel.png`, `hecata.png`,
  `lasombra.png`, `malkavian.png`, `ministry.png`, `nosferatu.png`,
  `ravnos.png`, `salubri.png`, `toreador.png`, `tremere.png`,
  `ventrue.png`.

There is no `backgrounds/` folder yet, no `chronicles/` folder, no
`characters/` folder.

### 2.2 Current background handling

The app does **not** load a raster background image. Instead:

- The body uses `bg-background` (`#0a0a0a`, declared in
  `src/index.css`).
- `body::before` paints a subtle SVG noise pattern as a data URL at
  `opacity: 0.05`, fixed-position, behind app content.

There is no hero or backdrop image anywhere in the shell. A future
background replacement only needs to touch `body::before` (or a sibling
layer) without changing the page chrome.

### 2.3 Current clan image handling

Two places reference clan banner art:

- **`src/data/clans.ts`** — every clan declares a `bannerImage` string,
  typed as `bannerImage: string` in `src/types/index.ts`. Most clans
  point at a `/images/<slug>.png` under `public/`. Three clans
  (Caitiff, Thin-Blood, and the Tzimisce stub) currently point at the
  shared `/opengraph.jpg` as a placeholder.
- **`src/pages/home.tsx`** — declares a local `clanImages` map that
  overrides `bannerImage` for the featured "Clan strip" on the home
  page. The fallback chain is
  `clanImages[clan.id] || clan.bannerImage || "/opengraph.jpg"`. The
  in-file comment already notes that `clans.ts` is the source of truth;
  this override map is a leftover from when home wanted larger crops.

Consumers:

- `src/pages/clans.tsx` reads `clan.bannerImage` directly in both the
  grid card and the detail dialog hero, with the same
  `|| "/opengraph.jpg"` fallback.
- `src/pages/home.tsx` (featured strip) uses the override map above.

There are no React imports of the PNGs — they are referenced as
absolute public-path strings, so swapping a file on disk is a no-code
change for any banner that already has a registered path.

### 2.4 Fallback behavior

Today the only fallback is `|| "/opengraph.jpg"` at each consumer site.
If a referenced `/images/*.png` returns 404 the browser renders the
broken-image glyph — there is no `<img onError>` recovery layer. The
drift-guard test (`src/data/__tests__/clans.test.ts`,
"every bannerImage path resolves to a real file on disk") catches
missing-file regressions at build time, which is why the current state
is acceptable.

### 2.5 Placeholder images currently in use

- `public/opengraph.jpg` — doubles as the OpenGraph share card and as
  the placeholder banner for Caitiff, Thin-Blood, and Tzimisce.

### 2.6 Performance concerns observed

The 13 clan PNGs are all large (780 KB – 1.7 MB each, ~17 MB total).
They are referenced as public paths, so the bundler does not optimize
them. Even though only one is visible at a time, the home page's
featured strip can request several within a single viewport scroll.

This is the single biggest asset-related win available right now and
should be addressed during the asset replacement pass (see §3 / §7).

---

## 3. Final background image requirements

Goal: a single, atmospheric backdrop that reads as Vampire-flavoured
without competing with content. Used behind the entire app shell, with
the existing UI sitting on top.

### 3.1 Dimensions and aspect ratios

- **Master file:** export at **2560 × 1440** (16:9) so it survives
  desktop monitors up to ~1440p without upscaling. Larger than that we
  scale up at the cost of slight softness — acceptable trade-off.
- **Aspect ratio:** 16:9 master, but the image must look acceptable
  when cropped to:
  - 21:9 (ultrawide desktop) — center should not contain critical
    detail.
  - 9:16 (mobile portrait) — vertical center crop must not feel empty;
    avoid important detail on far left/right.
  - 4:3 / 3:4 (tablet) — same; safe area is the centred ~70% of the
    frame.

### 3.2 Viewport behavior

- **Desktop:** `background-size: cover; background-position: center;`
  on the existing `body::before` layer (or a new sibling layer).
- **Mobile portrait:** same `cover / center`. Because portrait crops a
  16:9 master vertically, the subject should sit near the centre.
- **Mobile landscape:** same. The `short-landscape:` breakpoint already
  shortens chrome — the background does not need a special variant.
- **Fixed attachment:** avoid `background-attachment: fixed` on mobile
  (causes scroll jank on iOS Safari). Use `fixed` only on
  `@media (min-width: 1024px)` or rely on CSS `position: fixed` on the
  background layer.

### 3.3 File format and size

- **Preferred format:** `.webp` at ~quality 75. Falls back to `.jpg` at
  ~quality 80 if the rest of the asset set is `.jpg`.
- **Hard ceiling:** **200 KB** for the final shipped file. The
  background loads on every page, so it directly impacts cold load.
- **Target:** ~120–150 KB at 2560 × 1440 WebP is comfortably
  achievable for a dark gothic photo / painting.

### 3.4 Contrast and readability

The shell currently relies on near-black for text contrast. Any
background must not push readable text below WCAG AA.

- Bake a **dark vignette / overall darkening** into the asset itself,
  OR
- Keep the asset slightly brighter and apply a CSS overlay
  (`background-color: rgba(10, 10, 10, 0.7);` on a wrapping layer, or
  `linear-gradient(rgba(10,10,10,0.7), rgba(10,10,10,0.85))` mixed
  with `background-image`).

Prefer the CSS overlay approach — it lets the asset be reused later
behind lighter surfaces without having to re-export.

### 3.5 Fallback behavior

- The existing `body::before` SVG-noise layer should remain as the
  **base** background. The new image layers **on top** of `#0a0a0a` +
  noise, so if the image fails to load the app degrades to the current
  look.
- Define the background path as a CSS custom property
  (e.g. `--app-bg-image: url("/images/backgrounds/app-background.webp");`)
  declared at `:root`. Failure to load does not break layout because
  the underlying `#0a0a0a` remains.

---

## 4. Final clan image requirements

Goal: a single banner per playable clan / bloodline, consistent in
mood, used in the clan grid card and the clan detail dialog hero.

### 4.1 Coverage

One image per clan id in `src/data/clans.ts` where art exists:

- Camarilla classics: `brujah`, `gangrel`, `malkavian`, `nosferatu`,
  `toreador`, `tremere`, `ventrue`.
- Sabbat / Anarch / Independent (current data set): `lasombra`,
  `assamite` (Banu Haqim), `giovanni` (Hecata), `followers_of_set`
  (Ministry), `ravnos`, `salubri`, `tzimisce`.
- Caitiff and Thin-Blood are *not* clans in the traditional sense and
  should keep a deliberate placeholder treatment — see §4.7.

### 4.2 Naming convention

- File names use the **canonical clan id** from `clans.ts`, lowercase,
  hyphen-separated.
- Format suffix matches the file:
  `clan-brujah.webp`, `clan-ventrue.webp`, `clan-malkavian.webp`,
  `clan-banu-haqim.webp` (use the V5 slug for the file even if the
  data id is still `assamite`), `clan-hecata.webp` (data id
  `giovanni`), `clan-ministry.webp` (data id `followers_of_set`).
- The mapping from data id → file is handled in
  `src/data/clans.ts` via `bannerImage`. The file naming convention
  exists so an unattached `.webp` in `public/images/clans/final/` is
  obviously a clan banner without grepping.
- The existing `images/<slug>.png` files keep their current names while
  they remain in use. Final art lands under
  `public/images/clans/final/` (see §5) so the old and new files do
  not collide during the transition.

### 4.3 Dimensions and aspect ratio

- **Aspect ratio:** **3:2** master (e.g. 1500 × 1000). The current
  grid card crops at roughly 1.5–2:1 and the detail dialog hero crops
  at roughly 16:9. A 3:2 master survives both with center crop.
- **Safe area:** the centred 70% of the frame must contain the subject
  and any silhouette detail. The outer 15% on each side will be cropped
  on the detail hero and obscured by the bottom gradient on the grid
  card.
- **Detail hero crop:** the bottom ~35% of every banner sits under a
  `bg-gradient-to-t from-zinc-950` overlay carrying the clan name,
  icon, and sect label. Detail in the bottom third is largely wasted.

### 4.4 File format and size

- **Preferred format:** `.webp` at quality ~75.
- **Hard ceiling:** **150 KB** per clan banner.
- **Soft target:** ~80–110 KB. With 14 clans this keeps the total
  banner payload under ~1.5 MB compared to today's ~17 MB.

### 4.5 Style consistency

- Dark, gothic, painterly. Mostly low-key lighting, single accent
  light tied to the clan colour where natural.
- Subject silhouette should be readable at thumbnail size (the home
  featured strip renders at ~256 × 288 CSS pixels).
- Mood should feel like one set, not 14 unrelated paintings.
- No baked text, logos, or clan names — names are rendered in the UI
  via `getClanDisplayName`, which is localization / edition aware.
- No clan symbols rendered as flat heraldry inside the art (we already
  carry the symbol slot via the `icon` emoji and the title row).

### 4.6 Edition-specific art

Out of scope for the first asset drop. The data layer already supports
edition awareness via `editionAvailability` and the edition selector,
so a future edition-specific banner can be added without a schema
change by:

- Switching `bannerImage` from `string` to
  `string | Partial<Record<EditionId, string>>` in
  `src/types/index.ts`,
- Adding a resolver helper (e.g. `getClanBannerForEdition`) and
  pointing the two consumer sites at it,
- Updating the drift-guard test in `src/data/__tests__/clans.test.ts`
  to walk the per-edition variants.

Do not do this in this pass. Single string per clan is enough until
there is actually distinct V20 vs V5 art to show.

### 4.7 Caitiff, Thin-Blood, bloodlines

- **Caitiff** (no clan) and **Thin-Blood** (V5 weakened lineage) should
  keep a deliberate placeholder banner. A neutral gothic backdrop with
  no clan-defining iconography is more honest than fake art. The
  shared `/opengraph.jpg` works, or a single
  `clan-no-clan.webp` background can be added under the same
  conventions as §4.4.
- Future bloodlines (Tzimisce variants, Salubri variants, etc.) follow
  the same naming convention. If no art exists, point at
  `/opengraph.jpg` (or the no-clan placeholder) and the drift-guard
  test will keep the path honest.

### 4.8 Fallback behavior

- Continue to support `|| "/opengraph.jpg"` at the consumer sites.
- Future improvement: add an `onError` handler on the `<img>` in
  `src/pages/clans.tsx` and `src/pages/home.tsx` that swaps `src` to
  `/opengraph.jpg`. Low priority — the drift-guard test already
  prevents the broken-file case in CI.

---

## 5. Proposed folder structure

Recommended layout under `artifacts/vtm-companion/public/`:

```
public/
  images/
    backgrounds/
      app-background.webp           # final global backdrop
    clans/
      final/
        clan-brujah.webp
        clan-ventrue.webp
        ...
      fallback/
        clan-no-clan.webp           # optional shared placeholder
    chronicles/
      defaults/                     # optional, future
    characters/
      defaults/                     # optional, future
    opengraph.jpg                   # OG share card stays where it is
```

Rationale:

- A dedicated `backgrounds/` folder keeps the global backdrop from
  being confused with clan art. The PWA icons stay at the public root
  because `manifest.webmanifest` references them there — do **not**
  move icons just to tidy the tree.
- `clans/final/` versus `clans/fallback/` makes it obvious what is
  load-bearing versus what is a stub.
- `chronicles/defaults/` and `characters/defaults/` are reserved
  placeholders for when developer-supplied default thumbnails are
  introduced. **Do not create these folders empty in this pass** —
  empty folders do not commit cleanly across git platforms, and the
  current code does not reference them.

Migration policy (when final art lands):

- Drop the new files at the new paths.
- Update `bannerImage` strings in `src/data/clans.ts` to point at
  `/images/clans/final/clan-<slug>.webp`.
- Delete the old `/images/<slug>.png` files **only after** confirming
  every reference is gone (`grep '/images/[a-z-]\\+\\.png'` across
  `src/`).
- The drift-guard test will fail loudly if a path is wrong.

---

## 6. Naming convention summary

- Backgrounds: `app-background.webp`, plus optional themed variants
  (`app-background-night.webp`, etc.) using the same prefix.
- Clans: `clan-<canonical-id-or-v5-slug>.webp`. Use the V5 slug for
  the filename when it is clearer to the developer
  (`clan-banu-haqim.webp`, `clan-hecata.webp`, `clan-ministry.webp`),
  but always keep the data id stable in `clans.ts`.
- Chronicles defaults (future): `chronicle-default-<n>.webp` or
  themed: `chronicle-default-city.webp`, `chronicle-default-haven.webp`.
- Characters defaults (future): `character-default-<n>.webp`.

All lowercase, hyphen-separated, single trailing extension. No spaces,
no parentheses, no language suffixes — the names should not need to
change as content is translated.

---

## 7. Performance rules

Non-negotiable rules for every asset that lands:

- **Compress before committing.** Use `cwebp` (libwebp) or an
  equivalent at quality 70–80. Verify size with `du -sh`.
- **Hard ceilings:** 200 KB for the background, 150 KB per clan
  banner, 100 KB per future default thumbnail.
- **Format choice:**
  - WebP for photographic / painted art.
  - JPG only if WebP is unavailable for the source tool.
  - PNG **only** for icons and assets that need transparency.
  - SVG for vector icons (favicon already uses SVG).
- **Do not bake darkening into every image.** Prefer a CSS overlay on
  the consumer (`bg-gradient-to-t from-zinc-950 ...` already exists on
  both clan banner sites). Re-darkened images get muddy when overlaid
  again.
- **Build size budget.** Run
  `pnpm --dir artifacts/vtm-companion run build` after the asset drop
  and compare `dist/public/` total size against the pre-drop baseline.
  Acceptable delta: ≤ 2 MB of net new public assets across all clan
  banners + background combined.
- **Mobile load time check.** Real-device QA pass (see
  `real-device-mobile-qa-plan.md`) should explicitly include first
  paint and home-page clan strip render on a throttled mobile
  connection.

---

## 8. Future integration checklist

When the final art is ready, the asset replacement pass should:

1. Drop the new files at the paths in §5 / §6.
2. Verify file names match the canonical slugs.
3. Update `bannerImage` strings in `src/data/clans.ts` (or, if the
   centralization in §11 has been done by then, update the helper).
4. Remove `clanImages` overrides in `src/pages/home.tsx` whose entries
   match the new `bannerImage` exactly — duplication is only justified
   when the override actually differs.
5. Add the background path as a CSS custom property and wire it into
   `body::before` (or a sibling layer) in `src/index.css`.
6. Run `pnpm --dir artifacts/vtm-companion run test`. The clan
   drift-guard test will fail if a `bannerImage` points at a
   non-existent file.
7. Manually test:
   - Desktop home page — featured clan strip art looks right.
   - Desktop clan grid page — cards render, hover treatment still
     reads.
   - Desktop clan detail dialog — hero crop is acceptable.
   - Mobile portrait — same three views.
   - Mobile landscape (`short-landscape:` breakpoint) — same.
   - PWA install — installed shell still renders, icons unchanged.
8. Run `pnpm --dir artifacts/vtm-companion run build`. Check
   `dist/public/` total size delta against the baseline noted in §2.
9. Visually verify no broken-image glyphs anywhere by browsing every
   clan in the grid.
10. Update `ui-beauty-backlog.md` to mark the relevant pending items
    as resolved.

---

## 9. Design guidance for generated images

For whatever tool the developer uses to generate or commission art:

- **Mood:** dark gothic, cinematic, late-night, oil-painting-adjacent.
  Think "World of Darkness sourcebook splash" without copying anything
  specific.
- **Composition:** single subject (a figure, an artifact, an
  environment), centred in the 70% safe area. Avoid wide group shots —
  they get cropped badly on the grid card.
- **Silhouette legibility:** the subject should be recognizable at
  ~250 px width.
- **Negative space:** leave the bottom third darker / quieter so the
  gradient overlay + title row sit cleanly. Leave room near the top
  for the favourite-button chip (it lands at `top-4 right-4`).
- **No text inside the image.** Names are rendered by the UI and are
  localized / edition-aware.
- **No clan symbols as heraldry.** The `icon` emoji slot in `clans.ts`
  already carries the symbolic shorthand.
- **Consistent palette mood across clans.** Per-clan accents should be
  subtle and tied to `colorTheme` in `clans.ts` rather than dominating
  the frame.
- **Originality / IP.** Do not use, trace, or otherwise reproduce
  official White Wolf / Paradox / Renegade Game Studios art, book
  covers, or in-game character likenesses. This app ships with a
  fan-made / unofficial legal disclaimer; importing official art would
  break the footing that disclaimer assumes.

---

## 10. No user-upload image system

This plan covers **developer-controlled static assets only**. It does
**not** introduce a user-facing image upload feature.

Explicitly out of scope for this pass and every future asset pass
unless separately approved:

- No image upload UI anywhere in the app.
- No image storage in `localStorage`, `IndexedDB`, OPFS, or any
  client-side store.
- No image fields on `Character`, `Chronicle`, `ChronicleSession`,
  `Location`, or `Relationship` records.
- No changes to backup format, export, or import in
  `src/services/characterStorage.ts`, `chronicleStorage.ts`, or
  related modules.
- No backend, no auth, no remote storage.
- No drag-and-drop hooks, no `<input type="file" accept="image/*">`.

A user-uploaded portrait or chronicle cover feature is a possible
**future, separate feature** that would require its own design pass
(storage strategy, quota, backup behaviour, privacy notice updates,
moderation policy). It is not part of any asset integration pass.

---

## 11. Optional code prep (deferred)

The following small refactors are *available* but not required for
this pass. None of them ships in this batch — they are listed so the
asset replacement pass has a known shape to slot into.

- **Centralize clan banner resolution.** Add a tiny helper
  (e.g. `getClanBanner(clan, { fallback?: string })` in
  `src/data/clans.ts` or `src/utils/clanBanner.ts`) and have both
  `src/pages/clans.tsx` and `src/pages/home.tsx` call it. Removes the
  `clanImages` override map in `home.tsx` when its entries exactly
  match `bannerImage`.
- **Background path as CSS variable.** Declare `--app-bg-image` on
  `:root` in `src/index.css` so the final background can be swapped by
  editing one selector.
- **Image error fallback hook.** A trivial `<img onError>` swap to
  `/opengraph.jpg` for clan banners — defensive only.

If any of these is touched at the same time as the asset drop, ship
them as a single small PR with the asset replacement, not separately.

---

## 12. Do-not-do-yet

- **Do not** commit uncompressed PNGs over the size budgets in §7.
- **Do not** replace every clan banner in one pass without running the
  drift-guard test (`src/data/__tests__/clans.test.ts`) and a manual
  desktop + mobile spot check.
- **Do not** use copyrighted official book / sourcebook / video-game
  art.
- **Do not** bake clan names, sect names, or any text into clan
  images.
- **Do not** remove the `|| "/opengraph.jpg"` fallback at consumer
  sites until a guaranteed-present alternative exists.
- **Do not** add a user-uploaded image feature (see §10).
- **Do not** add an image upload UI.
- **Do not** change backup / export / import format for images.
- **Do not** move PWA icons out of `public/` — `manifest.webmanifest`
  references them there.
- **Do not** modify `manifest.webmanifest`, the favicon, or the PWA
  screenshots as part of an asset pass unless those specific files
  are the subject of the pass.
- **Do not** introduce a service worker / offline caching as part of
  the asset pass — that is tracked separately in
  `service-worker-poc-plan.md`.
