import { describe, it, expect } from 'vitest';
import {
  CLAN_IMAGE_SLUGS,
  getClanFinalImagePath,
  getClanImageSrc,
} from '../clanImage';
import { clans } from '../../data/clans';
import type { ClanEntry } from '../../types';

/**
 * Batch M — clan image helper tests.
 *
 * Pins:
 *   1. Every clan in `data/clans.ts` has a registered slug, so a future
 *      developer-supplied final WebP at
 *      `public/images/clans/final/<slug>.webp` is automatically picked
 *      up by `getClanImageSrc` once `USE_FINAL_CLAN_WEBP_IMAGES` flips.
 *   2. Slugs are unique across clans (no two clans claim the same
 *      filename, which would shadow each other once the final WebP
 *      switch is enabled).
 *   3. `getClanImageSrc` preserves the current behaviour: it returns
 *      `clan.bannerImage` when present, the OpenGraph placeholder
 *      otherwise, and never an empty string.
 */

describe('CLAN_IMAGE_SLUGS — coverage and uniqueness', () => {
  it('every clan in data/clans.ts has a registered slug', () => {
    for (const clan of clans) {
      expect(
        CLAN_IMAGE_SLUGS[clan.id],
        `${clan.id} is missing from CLAN_IMAGE_SLUGS — add an entry so the future final WebP can be picked up automatically`,
      ).toBeTruthy();
    }
  });

  it('slugs are non-empty and slug-formatted (lowercase, hyphens only)', () => {
    for (const [id, slug] of Object.entries(CLAN_IMAGE_SLUGS)) {
      expect(slug.trim().length, `${id} slug is empty`).toBeGreaterThan(0);
      expect(
        /^[a-z0-9-]+$/.test(slug),
        `${id} slug "${slug}" must be lowercase letters / digits / hyphens only`,
      ).toBe(true);
    }
  });

  it('every slug is unique across all clans', () => {
    const slugs = Object.values(CLAN_IMAGE_SLUGS);
    expect(
      new Set(slugs).size,
      'two clans claim the same slug — final WebP files would shadow each other',
    ).toBe(slugs.length);
  });
});

describe('getClanFinalImagePath', () => {
  it('returns the canonical path for a known clan', () => {
    expect(getClanFinalImagePath('brujah')).toBe('/images/clans/final/brujah.webp');
    expect(getClanFinalImagePath('assamite')).toBe('/images/clans/final/banu-haqim.webp');
    expect(getClanFinalImagePath('giovanni')).toBe('/images/clans/final/hecata.webp');
    expect(getClanFinalImagePath('followers_of_set')).toBe('/images/clans/final/ministry.webp');
    expect(getClanFinalImagePath('thin_blood')).toBe('/images/clans/final/thin-blood.webp');
  });

  it('returns null for an unknown clan id', () => {
    expect(getClanFinalImagePath('not_a_clan')).toBeNull();
    expect(getClanFinalImagePath('')).toBeNull();
  });
});

describe('getClanImageSrc — preserves current behaviour', () => {
  const fakeClan = (id: string, bannerImage: string): Pick<ClanEntry, 'id' | 'bannerImage'> =>
    ({ id, bannerImage });

  it('returns the clan bannerImage when present', () => {
    expect(getClanImageSrc(fakeClan('brujah', '/images/brujah.png')))
      .toBe('/images/brujah.png');
    expect(getClanImageSrc(fakeClan('lasombra', '/images/lasombra.png')))
      .toBe('/images/lasombra.png');
  });

  it('falls back to the OpenGraph placeholder when bannerImage is missing or empty', () => {
    expect(getClanImageSrc(fakeClan('caitiff', '')))
      .toBe('/opengraph.jpg');
    expect(getClanImageSrc(fakeClan('thin_blood', '   ')))
      .toBe('/opengraph.jpg');
  });

  it('matches the rendering all three consumer sites used before Batch M', () => {
    // The clan list card, the clan detail dialog, and the home
    // featured strip all rendered
    //   `clan.bannerImage || "/opengraph.jpg"`
    // before this helper landed. Lock that contract so the
    // current PNGs continue to load until the final WebP switch
    // is flipped.
    for (const clan of clans) {
      const expected = clan.bannerImage && clan.bannerImage.trim() !== ''
        ? clan.bannerImage
        : '/opengraph.jpg';
      expect(getClanImageSrc(clan), `${clan.id} src changed unexpectedly`)
        .toBe(expected);
    }
  });
});
