import type { ClanEntry } from '@/types';

/**
 * Centralized clan banner-image resolution (Batch M).
 *
 * Before this helper, three consumer sites (`pages/clans.tsx` card,
 * `pages/clans.tsx` detail dialog, `pages/home.tsx` featured strip)
 * each rendered `clan.bannerImage || "/opengraph.jpg"` inline. The
 * home page additionally carried a private `clanImages` map that
 * duplicated the same paths under canonical clan ids, originally
 * added to fix a separate bug but kept as a parallel source of
 * truth.
 *
 * The helper unifies all of that into one resolver. Consumer sites
 * call `getClanImageSrc(clan)` and get the right path back. The
 * legacy PNG paths in `data/clans.ts` still flow through unchanged
 * — no current image is moved or renamed in Batch M.
 *
 * Future final-image switch:
 *   1. Drop high-resolution WebP files at the canonical paths under
 *      `public/images/clans/final/` using the slugs in
 *      `CLAN_IMAGE_SLUGS` below (e.g. `brujah.webp`, `banu-haqim.webp`,
 *      `caitiff.webp`).
 *   2. Flip `USE_FINAL_CLAN_WEBP_IMAGES` to `true`.
 *   3. The helper starts returning `getClanFinalImagePath(clan.id)`
 *      for any clan whose slug is registered. Clans without a
 *      registered slug continue to fall back through `bannerImage`
 *      to `/opengraph.jpg` so the app never shows a broken image.
 *
 * Asset specs for the final WebP files live in
 * `docs/asset-integration-plan.md` under "Final clan image
 * requirements".
 */

/**
 * Canonical clan-id → image-filename-slug mapping.
 *
 * The slug is the *filename* (without extension) we expect a future
 * developer-supplied final WebP to use. Most clans map to their own
 * id; the exceptions are alt-named clans where the V5 name reads
 * better as a file slug than the historical data id:
 *
 *   - `assamite` → `banu-haqim`  (V5 rename, also normalized spelling)
 *   - `giovanni` → `hecata`      (V5 rename)
 *   - `followers_of_set` → `ministry` (V5 rename + simpler slug)
 *   - `thin_blood` → `thin-blood` (slug is hyphen-cased, id is snake)
 *
 * Adding a new clan: add its id here with its preferred slug. The
 * drift-guard test in `__tests__/clanImage.test.ts` fails if any clan
 * in `data/clans.ts` lacks a slug entry.
 */
export const CLAN_IMAGE_SLUGS: Record<string, string> = {
  brujah: 'brujah',
  gangrel: 'gangrel',
  malkavian: 'malkavian',
  nosferatu: 'nosferatu',
  toreador: 'toreador',
  tremere: 'tremere',
  ventrue: 'ventrue',
  lasombra: 'lasombra',
  tzimisce: 'tzimisce',
  assamite: 'banu-haqim',
  followers_of_set: 'ministry',
  giovanni: 'hecata',
  ravnos: 'ravnos',
  salubri: 'salubri',
  caitiff: 'caitiff',
  thin_blood: 'thin-blood',
};

/**
 * Filesystem-canonical path where a future final WebP image for the
 * given clan id is expected. Used by the resolver below when the
 * final-image switch is enabled. Returns `null` for clans without a
 * registered slug, so callers can fall through to the data-side
 * `bannerImage` / opengraph fallback.
 */
export function getClanFinalImagePath(clanId: string): string | null {
  const slug = CLAN_IMAGE_SLUGS[clanId];
  if (!slug) return null;
  return `/images/clans/final/${slug}.webp`;
}

/**
 * Per-clan `object-position` overrides for hero/banner imagery.
 *
 * The final WebPs (Batch N) are all smart-center-cropped to 16:9 with
 * the subject inside a centered 70 % safe area, so the default value
 * of `'50% 50%'` works for every clan. If, after a visual pass, a
 * specific banner ends up with its subject clipped at the top or
 * bottom in `object-cover` containers (most likely on tall portrait
 * thumbnails or short landscape strips), add an override here.
 *
 * Format: standard CSS `object-position` value (e.g. `'50% 30%'` to
 * bias toward the top, `'50% 70%'` to bias toward the bottom). The
 * map intentionally ships empty so we don't apply unverified shifts;
 * fill it in as actual presentation problems are spotted.
 *
 * Keyed by `ClanEntry.id` (the same id used everywhere else), not by
 * filename slug — that way callers don't need to translate between
 * the two before looking up.
 */
export const CLAN_HERO_OBJECT_POSITION: Record<string, string> = {
  // Examples (left commented until a visual pass confirms they help):
  //   nosferatu: '50% 35%',
  //   gangrel:   '50% 40%',
};

/**
 * Resolve the CSS `object-position` value to apply to a clan banner
 * image. Defaults to `'50% 50%'` (centered) for any clan not listed
 * in `CLAN_HERO_OBJECT_POSITION`. Safe to spread directly into a
 * React `style` prop:
 *
 *     <img
 *       src={getClanImageSrc(clan)}
 *       style={{ objectPosition: getClanHeroObjectPosition(clan.id) }}
 *     />
 */
export function getClanHeroObjectPosition(clanId: string): string {
  return CLAN_HERO_OBJECT_POSITION[clanId] ?? '50% 50%';
}

/**
 * Master switch for the planned image migration.
 *
 * Set this to `true` once the final WebP files have been dropped at
 * `public/images/clans/final/<slug>.webp` (see
 * `docs/asset-integration-plan.md`). Until then the helper returns
 * the legacy PNG/jpg paths from `data/clans.ts`, preserving exactly
 * the current rendering.
 *
 * Kept here (rather than as an environment variable or `localStorage`
 * flag) because clan banner art is part of the static asset bundle
 * and a runtime toggle would only add complexity. Future developer
 * flipping this also needs to commit the final image files.
 */
const USE_FINAL_CLAN_WEBP_IMAGES = true;

/**
 * Final placeholder fallback. The OpenGraph share image lives at
 * `public/opengraph.jpg` and doubles as the universal "we have
 * nothing better right now" placeholder for clans without a banner
 * — currently used by Tzimisce, Caitiff, and Thin-Blood in
 * `data/clans.ts`.
 */
const PLACEHOLDER_FALLBACK = '/opengraph.jpg';

/**
 * Resolve the `<img src>` for a clan banner.
 *
 * Resolution order:
 *   1. If `USE_FINAL_CLAN_WEBP_IMAGES` is true AND the clan has a
 *      registered slug → return `/images/clans/final/<slug>.webp`.
 *   2. Otherwise return the data-side `bannerImage` value
 *      (current behaviour, including the legacy PNGs).
 *   3. If everything else is empty → return the OpenGraph
 *      placeholder so the `<img>` element still renders something.
 */
export function getClanImageSrc(clan: Pick<ClanEntry, 'id' | 'bannerImage'>): string {
  if (USE_FINAL_CLAN_WEBP_IMAGES) {
    const finalPath = getClanFinalImagePath(clan.id);
    if (finalPath) return finalPath;
  }
  if (clan.bannerImage && clan.bannerImage.trim() !== '') {
    return clan.bannerImage;
  }
  return PLACEHOLDER_FALLBACK;
}
