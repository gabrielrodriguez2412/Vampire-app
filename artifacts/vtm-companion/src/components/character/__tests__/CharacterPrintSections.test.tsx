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
import { render, cleanup, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CharacterPrintModal, buildV5HealthBoxes, buildClassicHealthBoxes } from '../CharacterPrintView';
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
    willpower: { current: 5, max: 5 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 }, experience: 0,
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

describe('print/PDF classic health track (Batch Y)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders the structured summary with English abbreviations', () => {
    const char = makeClassic({ health: { bashing: 2, lethal: 2, aggravated: 1, max: 7 } });
    const text = renderPrint(char, 'en');
    expect(text).toContain('2 bash · 2 leth · 1 agg / 7');
  });

  it('localizes the summary abbreviations in Spanish', () => {
    const char = makeClassic({ health: { bashing: 2, lethal: 2, aggravated: 1, max: 7 } });
    const text = renderPrint(char, 'es');
    expect(text).toContain('2 cont. · 2 let. · 1 agr. / 7');
    expect(text).not.toContain('bash');
    expect(text).not.toContain('leth');
  });

  it('still renders a legacy numeric health value without crashing', () => {
    // Older saved characters may reach print before normalization with a plain number.
    const char = makeClassic({ health: 3 as unknown as ClassicCharacter['health'] });
    const text = renderPrint(char, 'en');
    expect(text).toContain('3 dmg');
  });

  it('leaves the V5 superficial/aggravated health summary unchanged', () => {
    const char = makeV5({ health: { damage: 1, aggravated: 2, max: 5 } });
    const text = renderPrint(char, 'en');
    expect(text).toContain('1 sup · 2 agg / 5');
  });
});

describe('print/PDF Health box helpers (Batch AO)', () => {
  it('buildV5HealthBoxes pads the row to max and marks aggravated first, then superficial', () => {
    const boxes = buildV5HealthBoxes({ damage: 2, aggravated: 1, max: 5 });
    expect(boxes.map(b => b.kind)).toEqual([
      'aggravated', 'superficial', 'superficial', 'empty', 'empty',
    ]);
    expect(boxes.map(b => b.symbol)).toEqual(['X', '/', '/', '', '']);
  });

  it('buildV5HealthBoxes returns an all-empty row when there is no damage', () => {
    const boxes = buildV5HealthBoxes({ damage: 0, aggravated: 0, max: 5 });
    expect(boxes).toHaveLength(5);
    expect(boxes.every(b => b.kind === 'empty')).toBe(true);
  });

  it('buildClassicHealthBoxes marks aggravated, then lethal, then bashing, then empty', () => {
    const boxes = buildClassicHealthBoxes({ bashing: 2, lethal: 2, aggravated: 1, max: 7 });
    expect(boxes.map(b => b.kind)).toEqual([
      'aggravated', 'lethal', 'lethal', 'bashing', 'bashing', 'empty', 'empty',
    ]);
    expect(boxes.map(b => b.symbol)).toEqual(['✱', 'X', 'X', '/', '/', '', '']);
  });

  it('buildClassicHealthBoxes returns an all-empty row when there is no damage', () => {
    const boxes = buildClassicHealthBoxes({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
    expect(boxes).toHaveLength(7);
    expect(boxes.every(b => b.kind === 'empty')).toBe(true);
  });

  it('build helpers tolerate missing / corrupted fields', () => {
    expect(buildV5HealthBoxes({})).toHaveLength(5);
    expect(buildClassicHealthBoxes({})).toHaveLength(7);
    // Negative numbers clamp to zero rather than producing a longer row.
    expect(buildClassicHealthBoxes({ bashing: -3, lethal: 0, aggravated: 0, max: 7 })
      .every(b => b.kind === 'empty')).toBe(true);
  });
});

describe('print/PDF Health capacity boxes — V5 (Batch AO)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders one box per Health slot, with empty boxes still visible', () => {
    const char = makeV5({ health: { damage: 0, aggravated: 0, max: 5 } });
    renderPrint(char);
    const group = screen.getByTestId('print-health-boxes');
    expect(group).toBeInTheDocument();
    // Five slots, all empty — empty boxes must still render in print.
    for (let i = 0; i < 5; i++) {
      const box = within(group).getByTestId(`print-health-box-${i}`);
      expect(box).toHaveAttribute('data-mark', 'empty');
      expect(box.textContent).toBe('');
    }
  });

  it('marks aggravated then superficial slots and leaves the rest empty', () => {
    const char = makeV5({ health: { damage: 2, aggravated: 1, max: 5 } });
    renderPrint(char);
    const group = screen.getByTestId('print-health-boxes');
    const marks = Array.from({ length: 5 }, (_, i) =>
      within(group).getByTestId(`print-health-box-${i}`).getAttribute('data-mark'),
    );
    expect(marks).toEqual(['aggravated', 'superficial', 'superficial', 'empty', 'empty']);
    // Mark glyphs render as text (print-safe — no icon fonts).
    expect(within(group).getByTestId('print-health-box-0').textContent).toBe('X');
    expect(within(group).getByTestId('print-health-box-1').textContent).toBe('/');
    // Existing one-line summary stays next to the boxes so the numeric
    // breakdown remains visible without needing to count boxes.
    expect(screen.getByTestId('print-health-summary').textContent).toBe('2 sup · 1 agg / 5');
  });

  it('exposes the total damaged count via an aria-label on the group', () => {
    const char = makeV5({ health: { damage: 1, aggravated: 2, max: 5 } });
    renderPrint(char);
    expect(
      screen.getByRole('group', { name: /health 3 of 5/i })
    ).toBeInTheDocument();
  });
});

describe('print/PDF Health capacity boxes — V20/classic (Batch AO)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders seven boxes by default with all-empty when no damage is recorded', () => {
    const char = makeClassic({ health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 } });
    renderPrint(char);
    const group = screen.getByTestId('print-health-boxes');
    for (let i = 0; i < 7; i++) {
      const box = within(group).getByTestId(`print-health-box-${i}`);
      expect(box).toHaveAttribute('data-mark', 'empty');
    }
  });

  it('marks aggravated first, then lethal, then bashing — preserving damage distinctions', () => {
    const char = makeClassic({ health: { bashing: 2, lethal: 2, aggravated: 1, max: 7 } });
    renderPrint(char);
    const group = screen.getByTestId('print-health-boxes');
    const marks = Array.from({ length: 7 }, (_, i) =>
      within(group).getByTestId(`print-health-box-${i}`).getAttribute('data-mark'),
    );
    expect(marks).toEqual([
      'aggravated', 'lethal', 'lethal', 'bashing', 'bashing', 'empty', 'empty',
    ]);
    // Print-safe glyphs (work in greyscale, no icon fonts).
    expect(within(group).getByTestId('print-health-box-0').textContent).toBe('✱');
    expect(within(group).getByTestId('print-health-box-1').textContent).toBe('X');
    expect(within(group).getByTestId('print-health-box-3').textContent).toBe('/');
    // Localized summary still shows the numeric breakdown.
    expect(screen.getByTestId('print-health-summary').textContent).toBe(
      '2 bash · 2 leth · 1 agg / 7',
    );
  });

  it('legacy bare-number health stays as the text fallback (no invented marks)', () => {
    const char = makeClassic({ health: 3 as unknown as ClassicCharacter['health'] });
    const text = renderPrint(char);
    // No box group rendered — we don't know which damage type to assign,
    // so the print sheet keeps the existing text fallback rather than
    // inventing marks.
    expect(screen.queryByTestId('print-health-boxes')).toBeNull();
    expect(text).toContain('3 dmg');
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
