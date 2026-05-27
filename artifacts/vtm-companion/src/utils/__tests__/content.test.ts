import { describe, it, expect } from 'vitest';
import {
  getLocalizedText,
  getText,
  isAvailableInLang,
  getClanDisplayName,
  getClanDisplayNameById,
} from '../content';
import { clans } from '../../data/clans';
import type { ClanEntry, EditionId, LangCode } from '../../types';

/**
 * `getLocalizedText` is the source of truth for "what should we show
 * the user, and was a fallback involved?" Centralizing this in one
 * helper lets every consumer (clan card, clan detail, future
 * disciplines / rules pages) make the same decision about whether to
 * paint a loud "[no translation]" placeholder, a quiet "EN" pill, or
 * nothing at all. The Batch G clan audit found three subtly-different
 * inline conditionals that all disagreed; these tests pin the
 * unified contract.
 */

const ALL: Record<LangCode, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
};

const EN_ONLY: Record<LangCode, string> = {
  en: 'English only',
  es: '',
  pt: '',
  fr: '',
  de: '',
  it: '',
};

const EMPTY: Record<LangCode, string> = {
  en: '',
  es: '',
  pt: '',
  fr: '',
  de: '',
  it: '',
};

describe('getLocalizedText', () => {
  it('returns native text without flagging fallback when the requested lang is populated', () => {
    const result = getLocalizedText(ALL, 'es');
    expect(result.text).toBe('Español');
    expect(result.usingFallback).toBe(false);
    expect(result.missing).toBe(false);
  });

  it('returns EN fallback and flags it when the requested lang is empty', () => {
    const result = getLocalizedText(EN_ONLY, 'es');
    expect(result.text).toBe('English only');
    // The whole point of this helper: tell the caller it had to fall
    // back so the UI can render a subtle "EN" indicator instead of a
    // loud "[no translation]" placeholder.
    expect(result.usingFallback).toBe(true);
    expect(result.missing).toBe(false);
  });

  it('does NOT flag fallback when the requested lang IS English', () => {
    // Falling back from 'en' to 'en' is a no-op — the user is already
    // reading the native string. We should not paint an EN chip on
    // English UI.
    const result = getLocalizedText(EN_ONLY, 'en');
    expect(result.text).toBe('English only');
    expect(result.usingFallback).toBe(false);
    expect(result.missing).toBe(false);
  });

  it('reports `missing` when neither the requested lang nor EN is populated', () => {
    const result = getLocalizedText(EMPTY, 'es');
    expect(result.text).toBeNull();
    expect(result.usingFallback).toBe(false);
    expect(result.missing).toBe(true);
  });

  it('handles an undefined record without throwing', () => {
    const result = getLocalizedText(undefined, 'es');
    expect(result.text).toBeNull();
    expect(result.usingFallback).toBe(false);
    expect(result.missing).toBe(true);
  });

  it('treats whitespace-only strings as empty', () => {
    const padded: Record<LangCode, string> = { ...EN_ONLY, es: '   ' };
    const result = getLocalizedText(padded, 'es');
    expect(result.text).toBe('English only');
    expect(result.usingFallback).toBe(true);
  });

  it('agrees with `getText` on the resolved text', () => {
    // `getText` predates this helper and is still the right shorthand
    // when callers only need the rendered string. Keep them in lockstep
    // so a future refactor doesn't accidentally diverge.
    for (const lang of ['en', 'es', 'pt', 'fr', 'de', 'it'] as LangCode[]) {
      expect(getLocalizedText(ALL, lang).text).toBe(getText(ALL, lang));
      expect(getLocalizedText(EN_ONLY, lang).text).toBe(getText(EN_ONLY, lang));
      expect(getLocalizedText(EMPTY, lang).text).toBe(getText(EMPTY, lang));
    }
  });

  it('agrees with `isAvailableInLang` on whether the native lang was used', () => {
    // `isAvailableInLang` answers the narrow "is this present in the
    // requested locale" question — i.e. the inverse of `usingFallback`
    // when the field is not entirely missing.
    expect(getLocalizedText(ALL, 'es').usingFallback).toBe(!isAvailableInLang(ALL, 'es'));
    expect(getLocalizedText(EN_ONLY, 'es').usingFallback).toBe(!isAvailableInLang(EN_ONLY, 'es'));
  });
});

/**
 * Edition + language clan display-name matrix (Batch P).
 *
 * The disciplines page's "Clans that use it" chips call
 * `getClanDisplayNameById(clanId, edition, lang)`. Before Batch P,
 * `assamite.name` was `en("Assamite")` (English slot only), so the
 * classic-edition Spanish UI silently rendered the English form
 * "Assamite" via `getText`'s EN fallback chain. Batch P populates the
 * Spanish slot with the canonical "Assamita" without affecting V5
 * (still routed through `alternateNames.V5` → "Banu Haqim").
 *
 * The cases below pin the user's manual-QA expectations for the
 * affected clans across V5/V20 × EN/ES so a future content edit can't
 * silently regress the disciplines-page chips. Proper-noun clan names
 * that are identical in EN and ES (Brujah, Tremere, Lasombra, etc.)
 * are not included — there's nothing for a fallback to change.
 */
describe('getClanDisplayName — edition × language matrix (Batch P)', () => {
  const cases: Array<{
    clanId: string;
    edition: EditionId;
    lang: LangCode;
    expected: string;
    note: string;
  }> = [
    // V5 + EN — V5 alternateNames are populated for the renamed clans.
    { clanId: 'assamite',         edition: 'V5',  lang: 'en', expected: 'Banu Haqim',     note: 'V5 alternate' },
    { clanId: 'followers_of_set', edition: 'V5',  lang: 'en', expected: 'The Ministry',   note: 'V5 alternate' },
    { clanId: 'giovanni',         edition: 'V5',  lang: 'en', expected: 'Hecata',         note: 'V5 alternate' },
    { clanId: 'thin_blood',       edition: 'V5',  lang: 'en', expected: 'Thin-Blood',     note: 'V5 alternate' },
    { clanId: 'lasombra',         edition: 'V5',  lang: 'en', expected: 'Lasombra',       note: 'no rename' },

    // V5 + ES — alternateNames + helper ES fallback.
    { clanId: 'assamite',         edition: 'V5',  lang: 'es', expected: 'Banu Haqim',     note: 'V5 alternate (proper noun, no ES form)' },
    { clanId: 'followers_of_set', edition: 'V5',  lang: 'es', expected: 'El Ministerio',  note: 'V5 alternate ES' },
    { clanId: 'giovanni',         edition: 'V5',  lang: 'es', expected: 'Hecata',         note: 'V5 alternate (proper noun)' },
    { clanId: 'thin_blood',       edition: 'V5',  lang: 'es', expected: 'Sangre Débil',   note: 'V5 alternate ES' },
    { clanId: 'lasombra',         edition: 'V5',  lang: 'es', expected: 'Lasombra',       note: 'no rename, proper noun' },

    // V20 + EN — fall back to base name (alternateNames.V5 must not leak).
    { clanId: 'assamite',         edition: 'V20', lang: 'en', expected: 'Assamite',       note: 'classic name' },
    { clanId: 'followers_of_set', edition: 'V20', lang: 'en', expected: 'Followers of Set', note: 'classic name (NOT The Ministry)' },
    { clanId: 'giovanni',         edition: 'V20', lang: 'en', expected: 'Giovanni',       note: 'classic name (NOT Hecata)' },
    { clanId: 'lasombra',         edition: 'V20', lang: 'en', expected: 'Lasombra',       note: 'no rename' },

    // V20 + ES — Batch P fix: assamite must read as "Assamita" (not "Assamite").
    { clanId: 'assamite',         edition: 'V20', lang: 'es', expected: 'Assamita',       note: 'Batch P: ES slot populated' },
    { clanId: 'followers_of_set', edition: 'V20', lang: 'es', expected: 'Seguidores de Set', note: 'classic ES name (NOT El Ministerio)' },
    { clanId: 'giovanni',         edition: 'V20', lang: 'es', expected: 'Giovanni',       note: 'classic name; proper noun (NOT Hecata)' },
    { clanId: 'lasombra',         edition: 'V20', lang: 'es', expected: 'Lasombra',       note: 'no rename, proper noun' },
  ];

  for (const c of cases) {
    it(`${c.clanId} @ ${c.edition} + ${c.lang} → "${c.expected}"  (${c.note})`, () => {
      expect(getClanDisplayNameById(c.clanId, c.edition, c.lang)).toBe(c.expected);
    });
  }

  it('classic-edition Spanish never falls back to English "Assamite" (regression guard for Batch P fix)', () => {
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const ed of classicEditions) {
      expect(
        getClanDisplayNameById('assamite', ed, 'es'),
        `Assamite in ${ed} ES should be "Assamita", not the EN fallback`,
      ).toBe('Assamita');
    }
  });

  it('V5 alternate names do NOT leak into classic editions', () => {
    // alternateNames.V5 must only fire for V5; classic editions
    // resolve via the base `name` field. Catches the inverse of the
    // Batch P fix — a future edit that flips an alternate into the
    // base name slot would still leave classic editions reading the
    // V5 rename here.
    const v5Renames: Array<[string, string[]]> = [
      ['assamite',         ['Banu Haqim']],
      ['followers_of_set', ['The Ministry', 'El Ministerio']],
      ['giovanni',         ['Hecata']],
    ];
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const [clanId, v5Forms] of v5Renames) {
      for (const ed of classicEditions) {
        for (const lang of ['en', 'es'] as LangCode[]) {
          const name = getClanDisplayNameById(clanId, ed, lang);
          for (const v5Form of v5Forms) {
            expect(
              name,
              `${clanId} @ ${ed} + ${lang} should not return the V5 rename "${v5Form}"`,
            ).not.toBe(v5Form);
          }
        }
      }
    }
  });

  it('falls back to the clan id for an unknown clan id', () => {
    expect(getClanDisplayNameById('not_a_clan', 'V5', 'en')).toBe('not_a_clan');
    expect(getClanDisplayNameById('not_a_clan', 'V20', 'es')).toBe('not_a_clan');
  });

  it('the object-form helper agrees with the by-id form for every clan in the bundled data', () => {
    // `getClanDisplayName(clan, ...)` is the underlying primitive;
    // `getClanDisplayNameById` is a thin wrapper. Keep them in lockstep
    // — a divergence here would let one rendering site disagree with
    // another about what to call the same clan.
    const editions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20', 'V5'];
    const langs: LangCode[] = ['en', 'es', 'pt', 'fr', 'de', 'it'];
    for (const clan of clans as ClanEntry[]) {
      for (const ed of editions) {
        for (const lang of langs) {
          expect(getClanDisplayName(clan, ed, lang)).toBe(
            getClanDisplayNameById(clan.id, ed, lang),
          );
        }
      }
    }
  });
});
