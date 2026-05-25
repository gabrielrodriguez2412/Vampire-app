import { describe, it, expect } from 'vitest';
import {
  getToolsEditionShortName,
  shouldShowClassicLegacyReviewHint,
} from '../toolsEdition';
import { EDITION_LIST } from '../../data/editions';
import type { EditionId } from '../../types';

/**
 * Unit tests for the helpers behind the Tools page's edition policy.
 * These pin the contract the page relies on so a refactor of
 * `EDITION_LIST` (or accidental removal of an edition id) does not
 * silently regress what the user sees in Tools chips / hints.
 */

const ALL_EDITIONS: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20', 'V5'];

describe('getToolsEditionShortName', () => {
  it.each(ALL_EDITIONS)(
    'returns the shortName from EDITION_LIST for %s',
    (id) => {
      const expected = EDITION_LIST.find(e => e.id === id)?.shortName;
      expect(expected, `EDITION_LIST is missing ${id}`).toBeDefined();
      expect(getToolsEditionShortName(id)).toBe(expected);
    },
  );

  it('falls back to the raw EditionId if EDITION_LIST drops an entry', () => {
    // This guards the defensive branch in the helper. We can't easily
    // mutate EDITION_LIST without leaking into other tests, so we use
    // a cast to simulate a future id that doesn't exist yet.
    const phantom = 'V6_FUTURE' as unknown as EditionId;
    expect(getToolsEditionShortName(phantom)).toBe('V6_FUTURE');
  });
});

describe('shouldShowClassicLegacyReviewHint', () => {
  it('returns true only for 1st and 2nd Edition', () => {
    expect(shouldShowClassicLegacyReviewHint('1ST')).toBe(true);
    expect(shouldShowClassicLegacyReviewHint('2ND')).toBe(true);
  });

  it('returns false for the editions that match the shared classic copy', () => {
    // V20 and Revised are the editions the shared classic copy is
    // genuinely correct for — they must NOT get the abstraction hint.
    expect(shouldShowClassicLegacyReviewHint('REVISED')).toBe(false);
    expect(shouldShowClassicLegacyReviewHint('V20')).toBe(false);
  });

  it('returns false for V5', () => {
    // V5 renders its own dedicated copy block; the classic-only hint
    // must never appear under V5 even though the call site already
    // gates on `!isV5`. Belt + suspenders.
    expect(shouldShowClassicLegacyReviewHint('V5')).toBe(false);
  });
});
