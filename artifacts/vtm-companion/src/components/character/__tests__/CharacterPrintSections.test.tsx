/**
 * @vitest-environment jsdom
 *
 * Batch W — print/PDF section parity.
 *
 * Manual QA found that several free-text character-sheet sections were
 * editable on the normal sheet but silently dropped from the Print/PDF
 * output:
 *   - V20 / classic: Merits, Flaws.
 *   - V5: the Social & Moral block (Touchstones, Convictions, Advantages,
 *     Flaws) and the V5 Resonance trait.
 *
 * These tests render the real `CharacterPrintModal` (which portals into
 * <body>) inside the real `AppContextProvider` and assert that the
 * previously-missing sections now appear when populated, that existing
 * sections still render, and that empty sections stay hidden.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CharacterPrintModal } from '../CharacterPrintView';
import { AppContextProvider } from '@/context/AppContext';
import { UI_STRINGS } from '@/i18n/ui';
import type { Character, V5Character, ClassicCharacter } from '@/types';

function renderPrint(character: Character, lang: 'en' | 'es' = 'en') {
  window.localStorage.setItem('vtm-language', lang);
  render(
    <AppContextProvider>
      <CharacterPrintModal character={character} onClose={() => {}} />
    </AppContextProvider>
  );
  return document.body.textContent ?? '';
}

function makeV5(overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: 'v5', name: 'Nadia', clan: 'tremere', edition: 'V5',
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    attributes: {}, skills: {},
    disciplines: { auspex: 2 } as Record<string, number>,
    bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
    ...overrides,
  };
}

function makeClassic(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'c20', name: 'Marcus', clan: 'ventrue', edition: 'V20',
    generation: 12,
    attributes: {}, abilities: {}, disciplines: { dominate: 2 } as Record<string, number>,
    backgrounds: {}, virtues: { conscience: 3, selfControl: 3, courage: 4 },
    humanity: 7, bloodPool: { current: 10, max: 10 },
    willpower: { current: 5, max: 5 }, health: 0, experience: 0,
    createdAt: '', updatedAt: '',
    ...overrides,
  };
}

describe('print/PDF includes classic Merits & Flaws (Batch W)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V20 character with merits and flaws prints both values and the section heading', () => {
    const char = makeClassic({
      merits: 'Eidetic Memory (2pt), Iron Will (3pt)',
      flaws: 'Hunted (4pt), Nightmares (1pt)',
    });
    const text = renderPrint(char, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_section_merits_flaws); // "Merits & Flaws"
    expect(text).toContain('Eidetic Memory (2pt), Iron Will (3pt)');
    expect(text).toContain('Hunted (4pt), Nightmares (1pt)');
    // Existing sections still render.
    expect(text).toContain(UI_STRINGS.en.sheet_section_disciplines);
    expect(text).toContain('Dominate');
  });

  it('V20 character with NO merits/flaws does not render the Merits & Flaws heading', () => {
    const text = renderPrint(makeClassic(), 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_merits_flaws);
  });

  it('Spanish V20 print shows the localized Merits & Flaws heading', () => {
    const char = makeClassic({ merits: 'Memoria Eidética' });
    const text = renderPrint(char, 'es');
    expect(text).toContain(UI_STRINGS.es.sheet_section_merits_flaws); // "Méritos y Defectos"
    expect(text).toContain('Memoria Eidética');
  });
});

describe('print/PDF includes V5 Social & Moral (Batch W)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V5 character with touchstones and convictions prints both values and the section heading', () => {
    const char = makeV5({
      touchstones: 'Elena, my mortal sister',
      convictions: 'Never feed on children',
    });
    const text = renderPrint(char, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_section_social_moral); // "Social & Moral"
    expect(text).toContain('Elena, my mortal sister');
    expect(text).toContain('Never feed on children');
  });

  it('V5 character prints Advantages (merits) and Flaws when present', () => {
    const char = makeV5({
      advantages: 'Status: Camarilla (2)',
      flaws: 'Prey Exclusion: Children',
    });
    const text = renderPrint(char, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_section_social_moral);
    expect(text).toContain('Status: Camarilla (2)');
    expect(text).toContain('Prey Exclusion: Children');
  });

  it('V5 character prints Resonance when present', () => {
    const char = makeV5({ resonance: 'Choleric' });
    const text = renderPrint(char, 'en');
    expect(text).toContain('Choleric');
  });

  it('V5 character with NO social/moral fields does not render the section heading', () => {
    const text = renderPrint(makeV5(), 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_social_moral);
  });

  it('Spanish V5 print shows the localized Social & Moral heading', () => {
    const char = makeV5({ convictions: 'No matar inocentes' });
    const text = renderPrint(char, 'es');
    expect(text).toContain(UI_STRINGS.es.sheet_section_social_moral); // "Social y Moral"
    expect(text).toContain('No matar inocentes');
  });
});

describe('print/PDF existing sections remain intact (Batch W regression guard)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('still renders trackers, disciplines, and the localized toolbar', () => {
    const char = makeV5({
      attributes: { strength: 3 } as Record<string, number>,
      touchstones: 'A touchstone',
    });
    const text = renderPrint(char, 'en');
    // Toolbar (Batch V) still present.
    expect(text).toContain(UI_STRINGS.en.print_preview);
    // Core sections.
    expect(text).toContain(UI_STRINGS.en.sheet_section_trackers);
    expect(text).toContain(UI_STRINGS.en.sheet_section_attributes);
    expect(text).toContain(UI_STRINGS.en.sheet_section_disciplines);
    // New Batch W section also present.
    expect(text).toContain(UI_STRINGS.en.sheet_section_social_moral);
  });
});
