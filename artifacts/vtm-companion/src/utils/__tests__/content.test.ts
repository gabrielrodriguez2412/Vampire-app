import { describe, it, expect } from 'vitest';
import { getLocalizedText, getText, isAvailableInLang } from '../content';
import type { LangCode } from '../../types';

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
