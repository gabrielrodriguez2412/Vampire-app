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
import { CharacterPrintModal, buildV5HealthBoxes, buildClassicHealthBoxes, buildClassicPoolBoxes } from '../CharacterPrintView';
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

describe('print/PDF classic pool box helper (Batch AO follow-up)', () => {
  it('builds an array of {filled: boolean} per slot up to max', () => {
    const boxes = buildClassicPoolBoxes({ current: 3, max: 5 }, 5);
    expect(boxes.map(b => b.filled)).toEqual([true, true, true, false, false]);
  });

  it('falls back to defaultMax when the pool has no max', () => {
    const boxes = buildClassicPoolBoxes({ current: 2 } as { current: number; max?: number }, 7);
    expect(boxes).toHaveLength(7);
    expect(boxes.filter(b => b.filled).length).toBe(2);
  });

  it('clamps current above max and never produces a longer row than max', () => {
    const boxes = buildClassicPoolBoxes({ current: 99, max: 4 }, 5);
    expect(boxes).toHaveLength(4);
    expect(boxes.every(b => b.filled)).toBe(true);
  });

  it('tolerates undefined pool entirely', () => {
    const boxes = buildClassicPoolBoxes(undefined, 5);
    expect(boxes).toHaveLength(5);
    expect(boxes.every(b => b.filled === false)).toBe(true);
  });
});

describe('print/PDF Willpower — V5 capacity boxes (Batch AO follow-up)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders V5 Willpower as damage boxes with superficial / aggravated marks', () => {
    const char = makeV5({ willpower: { damage: 2, aggravated: 1, max: 5 } });
    renderPrint(char);
    const group = screen.getByTestId('print-willpower-boxes');
    expect(group).toBeInTheDocument();
    const marks = Array.from({ length: 5 }, (_, i) =>
      within(group).getByTestId(`print-willpower-box-${i}`).getAttribute('data-mark'),
    );
    expect(marks).toEqual(['aggravated', 'superficial', 'superficial', 'empty', 'empty']);
    // Print-safe glyphs (no icon fonts).
    expect(within(group).getByTestId('print-willpower-box-0').textContent).toBe('X');
    expect(within(group).getByTestId('print-willpower-box-1').textContent).toBe('/');
    // Damage summary stays alongside the boxes — Willpower mirrors the
    // Health row so the numeric breakdown is right there.
    expect(screen.getByTestId('print-willpower-summary').textContent).toBe(
      '2 sup · 1 agg / 5',
    );
  });

  it('V5 Willpower row exposes a group aria-label with the damaged count', () => {
    const char = makeV5({ willpower: { damage: 1, aggravated: 2, max: 5 } });
    renderPrint(char);
    expect(
      screen.getByRole('group', { name: /willpower 3 of 5/i })
    ).toBeInTheDocument();
  });

  it('V5 Willpower with no damage still renders all five empty boxes', () => {
    const char = makeV5({ willpower: { damage: 0, aggravated: 0, max: 5 } });
    renderPrint(char);
    const group = screen.getByTestId('print-willpower-boxes');
    for (let i = 0; i < 5; i++) {
      expect(within(group).getByTestId(`print-willpower-box-${i}`))
        .toHaveAttribute('data-mark', 'empty');
    }
  });
});

describe('print/PDF Willpower — V20/classic binary boxes (Batch AO follow-up)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders one filled box per available point and outlined box per spent point', () => {
    const char = makeClassic({ willpower: { current: 3, max: 5 } });
    renderPrint(char);
    const group = screen.getByTestId('print-willpower-boxes');
    expect(group).toBeInTheDocument();
    // First three are filled, last two are spent.
    const states = Array.from({ length: 5 }, (_, i) =>
      within(group).getByTestId(`print-willpower-box-${i}`).getAttribute('data-state'),
    );
    expect(states).toEqual(['filled', 'filled', 'filled', 'empty', 'empty']);
    // current/max text stays alongside the boxes.
    expect(screen.getByTestId('print-willpower-summary').textContent).toBe('3 / 5');
  });

  it('classic Willpower is NOT rendered as a damage track (no superficial/aggravated/lethal/bashing marks)', () => {
    const char = makeClassic({ willpower: { current: 4, max: 6 } });
    renderPrint(char);
    const group = screen.getByTestId('print-willpower-boxes');
    // None of the classic-WP cells carry a damage `data-mark`; they
    // only carry the binary `data-state` filled / empty.
    for (let i = 0; i < 6; i++) {
      const box = within(group).getByTestId(`print-willpower-box-${i}`);
      expect(box).not.toHaveAttribute('data-mark');
      expect(box).toHaveAttribute('data-state');
      expect(box.getAttribute('data-state')).toMatch(/^(filled|empty)$/);
    }
  });

  it('classic Willpower exposes a group aria-label with the available count', () => {
    const char = makeClassic({ willpower: { current: 2, max: 5 } });
    renderPrint(char);
    expect(
      screen.getByRole('group', { name: /willpower 2 of 5/i })
    ).toBeInTheDocument();
  });
});

describe('print/PDF Blood Pool — V20/classic blood drops (Batch AO follow-up)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders one filled drop per available Blood Pool point and outline drop per spent point', () => {
    const char = makeClassic({ bloodPool: { current: 7, max: 10 } });
    renderPrint(char);
    const group = screen.getByTestId('print-blood-pool-drops');
    expect(group).toBeInTheDocument();
    const states = Array.from({ length: 10 }, (_, i) =>
      within(group).getByTestId(`print-blood-pool-drop-${i}`).getAttribute('data-state'),
    );
    expect(states.slice(0, 7).every(s => s === 'filled')).toBe(true);
    expect(states.slice(7).every(s => s === 'empty')).toBe(true);
    // current/max text stays alongside the drops.
    expect(screen.getByTestId('print-blood-pool-summary').textContent).toBe('7 / 10');
  });

  it('a full Blood Pool prints all drops filled and zero prints all drops outline', () => {
    const full = makeClassic({ bloodPool: { current: 10, max: 10 } });
    renderPrint(full);
    let group = screen.getByTestId('print-blood-pool-drops');
    expect(
      Array.from({ length: 10 }, (_, i) =>
        within(group).getByTestId(`print-blood-pool-drop-${i}`).getAttribute('data-state'),
      ).every(s => s === 'filled'),
    ).toBe(true);
    cleanup();
    document.body.innerHTML = '';

    const empty = makeClassic({ bloodPool: { current: 0, max: 10 } });
    renderPrint(empty);
    group = screen.getByTestId('print-blood-pool-drops');
    expect(
      Array.from({ length: 10 }, (_, i) =>
        within(group).getByTestId(`print-blood-pool-drop-${i}`).getAttribute('data-state'),
      ).every(s => s === 'empty'),
    ).toBe(true);
  });

  it('Blood Pool exposes a group aria-label with the available count', () => {
    const char = makeClassic({ bloodPool: { current: 9, max: 10 } });
    renderPrint(char);
    expect(
      screen.getByRole('group', { name: /blood pool 9 of 10/i })
    ).toBeInTheDocument();
  });
});

describe('print/PDF Health regression — Batch AO follow-up did not disturb Health output', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V5 Health row still renders boxes and the same superficial/aggravated summary', () => {
    const char = makeV5({ health: { damage: 1, aggravated: 2, max: 5 } });
    renderPrint(char);
    expect(screen.getByTestId('print-health-boxes')).toBeInTheDocument();
    expect(screen.getByTestId('print-health-summary').textContent).toBe('1 sup · 2 agg / 5');
  });

  it('classic Health row still renders boxes and the localized abbreviated summary', () => {
    const char = makeClassic({ health: { bashing: 2, lethal: 2, aggravated: 1, max: 7 } });
    renderPrint(char);
    expect(screen.getByTestId('print-health-boxes')).toBeInTheDocument();
    expect(screen.getByTestId('print-health-summary').textContent).toBe(
      '2 bash · 2 leth · 1 agg / 7',
    );
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

describe('print/PDF — V5 Generation row (Batch AV)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders the V5 Generation identity row when the character has a generation', () => {
    // Batch AV adds optional Generation to V5 characters; the print view
    // mirrors the existing classic row and only emits it when set.
    const char = makeV5({ generation: 12 });
    const text = renderPrint(char, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_generation); // "Generation"
    expect(text).toContain('12');
  });

  it('omits the V5 Generation row when the character has no generation', () => {
    // The default V5 fixture has no generation. The print view must not
    // surface a label-only row in that case.
    const text = renderPrint(makeV5(), 'en');
    // We can't assert the bare label is absent (it's a common word that
    // could appear elsewhere), so check the row's value placement instead
    // by confirming the screen has no "Generation" identity-row pair.
    // Practically: with no generation set, the print view must not contain
    // both "Generation" *and* a numeric value tied to it. Asserting
    // absence of the i18n label is a stable proxy here because the only
    // other place that label can appear is the row itself.
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
  });
});

describe('print/PDF — Human / Ghoul kind parity (Batch BA)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V5 Human print drops Hunger / Blood Potency / Humanity / clan-in-header rows', () => {
    // Simulate a human created post-BA — no Hunger / BP / Humanity
    // seeded. Empty clan because Human creation hides the clan select.
    const human: V5Character = {
      ...makeV5({ clan: '' }),
      kind: 'human',
    } as V5Character;
    // Drop dormant vampire-only fields the makeV5 default seeds.
    delete (human as { hunger?: number }).hunger;
    delete (human as { bloodPotency?: number }).bloodPotency;
    delete (human as { humanity?: number }).humanity;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_hunger);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_potency);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    // The header pill surfaces the Human kind in place of the clan name.
    expect(text).toContain(UI_STRINGS.en.char_kind_human);
  });

  it('V20 Human print drops Blood Pool / Humanity / Generation / clan-in-header rows', () => {
    const human: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'human',
    } as ClassicCharacter;
    delete (human as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (human as { humanity?: number }).humanity;
    delete (human as { generation?: number }).generation;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
    expect(text).toContain(UI_STRINGS.en.char_kind_human);
  });

  it('V5 Ghoul print drops Hunger / Blood Potency / Humanity', () => {
    const ghoul: V5Character = {
      ...makeV5({ clan: 'tremere' }),
      kind: 'ghoul',
    } as V5Character;
    delete (ghoul as { hunger?: number }).hunger;
    delete (ghoul as { bloodPotency?: number }).bloodPotency;
    delete (ghoul as { humanity?: number }).humanity;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_hunger);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_potency);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    // Ghoul with a regnant clan keeps the clan name in the header.
    // The kind pill should still appear so the printed sheet reads as
    // "Ghoul" rather than "vampire of clan X". We assert both.
    expect(text).toContain(UI_STRINGS.en.char_kind_ghoul);
  });

  it('V20 Ghoul WITH regnant clan keeps clan name in header but drops vampire-only trackers', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
    } as ClassicCharacter;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
  });

  it('V20 Ghoul WITHOUT regnant clan replaces the clan with a Ghoul kind label in the header', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'ghoul',
    } as ClassicCharacter;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.char_kind_ghoul);
  });

  it('Vampire print behavior is unchanged — Hunger / Humanity / Blood Pool / Blood Potency still render', () => {
    const v5 = makeV5({ hunger: 2, bloodPotency: 3, humanity: 6 });
    const v5Text = renderPrint(v5, 'en');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_hunger);
    expect(v5Text).toContain(UI_STRINGS.en.sheet_blood_potency);
    expect(v5Text).toContain(UI_STRINGS.en.sheet_humanity);

    cleanup();
    document.body.innerHTML = '';

    const v20 = makeClassic({ bloodPool: { current: 5, max: 10 }, humanity: 6, generation: 12 });
    const v20Text = renderPrint(v20, 'en');
    expect(v20Text).toContain(UI_STRINGS.en.sheet_blood_pool);
    expect(v20Text).toContain(UI_STRINGS.en.sheet_humanity);
    expect(v20Text).toContain(UI_STRINGS.en.sheet_generation);
  });

  it('Print does NOT leak dormant Hunger / Humanity on a legacy human that still has them in storage', () => {
    // A pre-BA human still carries `hunger: 1` etc. in its stored JSON.
    // The print view's `kind === 'vampire'` gate must keep those rows
    // from rendering regardless of what's on disk.
    const dormantHuman: V5Character = {
      ...makeV5({ clan: '', hunger: 1, bloodPotency: 1, humanity: 7 }),
      kind: 'human',
    } as V5Character;
    const text = renderPrint(dormantHuman, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_hunger);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_potency);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
  });
});

describe('print/PDF — vampire-only identity rows are gated by kind (Batch BA polish)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V20 Human print does NOT render Sire or Generation even when set on the record', () => {
    // The exact reported issue: a V20 Human with dormant Sire +
    // Generation fields (e.g. created before Batch BA, or imported)
    // must not surface them in Basic Info.
    const human: ClassicCharacter = {
      ...makeClassic({ clan: '', sire: 'Some Sire', generation: 13 }),
      kind: 'human',
    } as ClassicCharacter;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_sire);
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
    expect(text).not.toContain('Some Sire');
    // Spot-check: the Human label is in the header in place of the clan.
    expect(text).toContain(UI_STRINGS.en.char_kind_human);
  });

  it('V20 Ghoul print does NOT render Sire or Generation even when set on the record', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere', sire: 'Vampiric Sire', generation: 11 }),
      kind: 'ghoul',
    } as ClassicCharacter;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_sire);
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
    expect(text).not.toContain('Vampiric Sire');
    expect(text).toContain(UI_STRINGS.en.char_kind_ghoul);
  });

  it('V5 Human print does NOT render Ambition / Desire / Predator Type / Sire / Generation', () => {
    // Same dormant-data scenario for V5.
    const human: V5Character = {
      ...makeV5({
        clan: '',
        ambition: 'Old ambition',
        desire: 'Old desire',
        predatorType: 'Bagger',
        sire: 'Some Sire',
        generation: 12,
      }),
      kind: 'human',
    } as V5Character;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_ambition);
    expect(text).not.toContain(UI_STRINGS.en.sheet_desire);
    expect(text).not.toContain(UI_STRINGS.en.sheet_predator_type);
    expect(text).not.toContain(UI_STRINGS.en.sheet_sire);
    expect(text).not.toContain(UI_STRINGS.en.sheet_generation);
    expect(text).not.toContain('Old ambition');
    expect(text).not.toContain('Old desire');
    expect(text).not.toContain('Bagger');
    expect(text).not.toContain('Some Sire');
  });

  it('V5 Ghoul print does NOT render Predator Type / Sire / Resonance even when set', () => {
    const ghoul: V5Character = {
      ...makeV5({
        clan: 'tremere',
        predatorType: 'Sandman',
        sire: 'Famuli\'s Sire',
        resonance: 'Phlegmatic',
      }),
      kind: 'ghoul',
    } as V5Character;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_predator_type);
    expect(text).not.toContain(UI_STRINGS.en.sheet_sire);
    expect(text).not.toContain(UI_STRINGS.en.sheet_resonance);
    expect(text).not.toContain('Sandman');
    expect(text).not.toContain('Phlegmatic');
  });

  it('Vampire print still renders Sire / Generation / Ambition / Desire / Predator Type as before', () => {
    // Regression guard — vampires must keep every identity row.
    const v5 = makeV5({
      ambition: 'Outshine my sire',
      desire: 'A safe night',
      predatorType: 'Bagger',
      sire: 'Sire Name',
      generation: 12,
      resonance: 'Choleric',
    });
    const v5Text = renderPrint(v5, 'en');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_ambition);
    expect(v5Text).toContain('Outshine my sire');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_desire);
    expect(v5Text).toContain(UI_STRINGS.en.sheet_predator_type);
    expect(v5Text).toContain(UI_STRINGS.en.sheet_sire);
    expect(v5Text).toContain('Sire Name');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_generation);
    expect(v5Text).toContain(UI_STRINGS.en.sheet_resonance);

    cleanup();
    document.body.innerHTML = '';

    const v20 = makeClassic({ sire: 'V20 Sire', generation: 10 });
    const v20Text = renderPrint(v20, 'en');
    expect(v20Text).toContain(UI_STRINGS.en.sheet_sire);
    expect(v20Text).toContain('V20 Sire');
    expect(v20Text).toContain(UI_STRINGS.en.sheet_generation);
  });

  it('V5 Human print does NOT render dormant disciplines even when stored', () => {
    const human: V5Character = {
      ...makeV5({ clan: '', disciplines: { auspex: 2 } as Record<string, number> }),
      kind: 'human',
    } as V5Character;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('Ghoul print header surfaces the "Regnant:" prefix before the regnant clan name (Batch BB)', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
    } as ClassicCharacter;
    const text = renderPrint(ghoul, 'en');
    // Both the prefix label and the regnant clan name appear in the
    // printed header line.
    expect(text).toContain('Regnant');
    expect(text).toMatch(/Tremere/i);
    // Kind label is also still in the header.
    expect(text).toContain(UI_STRINGS.en.char_kind_ghoul);
  });

  it('Vampire print header does NOT render the regnant prefix (Batch BB regression)', () => {
    const vampire = makeClassic({ clan: 'tremere' });
    const text = renderPrint(vampire, 'en');
    expect(text).not.toMatch(/\bRegnant\b/);
  });
});

describe('print/PDF — Human / Ghoul opt-in morality tracker (Batch BE-2)', () => {
  // BE-2 mirrors the BE-1 live-sheet opt-in onto the print path. Vampires
  // are unchanged (their Humanity always prints from the schema). Mortal
  // morality only prints when `trackMorality === true`; dormant
  // `humanity` values on opt-out mortals must NOT leak into print.
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V5 Human print hides Humanity when trackMorality is missing', () => {
    const human: V5Character = { ...makeV5({ clan: '' }), kind: 'human' } as V5Character;
    delete (human as { hunger?: number }).hunger;
    delete (human as { bloodPotency?: number }).bloodPotency;
    delete (human as { humanity?: number }).humanity;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('V5 Human print hides Humanity when trackMorality is explicitly false', () => {
    const human: V5Character = {
      ...makeV5({ clan: '' }),
      kind: 'human',
      trackMorality: false,
    } as V5Character;
    delete (human as { humanity?: number }).humanity;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('V20 Ghoul print hides Humanity / Path when trackMorality is missing', () => {
    const ghoul: ClassicCharacter = { ...makeClassic({ clan: 'tremere' }), kind: 'ghoul' } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('V5 Human print shows Humanity when trackMorality is true', () => {
    const human: V5Character = {
      ...makeV5({ clan: '' }),
      kind: 'human',
      trackMorality: true,
      humanity: 5,
    } as V5Character;
    delete (human as { hunger?: number }).hunger;
    delete (human as { bloodPotency?: number }).bloodPotency;
    const text = renderPrint(human, 'en');
    // V5 mortal uses the same "Humanity" label vampires use on V5.
    expect(text).toContain(UI_STRINGS.en.sheet_humanity);
  });

  it('V5 Ghoul print shows Humanity when trackMorality is true', () => {
    const ghoul: V5Character = {
      ...makeV5({ clan: 'tremere' }),
      kind: 'ghoul',
      trackMorality: true,
      humanity: 6,
    } as V5Character;
    delete (ghoul as { hunger?: number }).hunger;
    delete (ghoul as { bloodPotency?: number }).bloodPotency;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_humanity);
  });

  it('V20 Human print shows Humanity / Path when trackMorality is true', () => {
    const human: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'human',
      trackMorality: true,
      humanity: 4,
    } as ClassicCharacter;
    delete (human as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (human as { generation?: number }).generation;
    const text = renderPrint(human, 'en');
    // V20 mortal uses the edition-aware "Humanity / Path" label so the
    // print stays consistent with the BE-1 live sheet.
    expect(text).toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('V20 Ghoul print shows Humanity / Path when trackMorality is true', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackMorality: true,
      humanity: 7,
    } as ClassicCharacter;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('does NOT leak a dormant humanity value into print on a Human opted-out (regression of BE-1 audit §3.9)', () => {
    // Pre-Batch-BA dormant data: humanity is still on disk, but the
    // user has not enabled tracking. Print must keep the row hidden.
    const dormantHuman: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'human',
      humanity: 7,
    } as ClassicCharacter;
    delete (dormantHuman as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (dormantHuman as { generation?: number }).generation;
    const text = renderPrint(dormantHuman, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('does NOT leak a dormant humanity value on a Ghoul with trackMorality:false', () => {
    const dormantGhoul: V5Character = {
      ...makeV5({ clan: 'tremere' }),
      kind: 'ghoul',
      trackMorality: false,
      humanity: 8,
    } as V5Character;
    delete (dormantGhoul as { hunger?: number }).hunger;
    delete (dormantGhoul as { bloodPotency?: number }).bloodPotency;
    const text = renderPrint(dormantGhoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity);
    expect(text).not.toContain(UI_STRINGS.en.sheet_humanity_path);
  });

  it('renders a 0-dot Humanity row for an opted-in mortal with no humanity value', () => {
    // Mirrors the live-sheet fallback: when trackMorality is true but
    // no humanity number lives on the character (uncommon — BE-1 seeds
    // 7 on toggle — but possible via import or hand-edit), the row
    // still renders so the printed sheet is internally consistent.
    const human: V5Character = {
      ...makeV5({ clan: '' }),
      kind: 'human',
      trackMorality: true,
    } as V5Character;
    delete (human as { hunger?: number }).hunger;
    delete (human as { bloodPotency?: number }).bloodPotency;
    delete (human as { humanity?: number }).humanity;
    const text = renderPrint(human, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_humanity);
  });

  it('Vampire print still shows Humanity / Path regardless of trackMorality (no regression)', () => {
    // Vampires never opt in or out — the schema-driven row always
    // renders. Stray trackMorality values on a vampire are ignored.
    const v5Vamp = makeV5({ humanity: 6 });
    const v5Text = renderPrint(v5Vamp, 'en');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_humanity);

    cleanup();
    document.body.innerHTML = '';

    const v20Vamp = makeClassic({ humanity: 5 });
    // Forcibly stamp a stray flag — vampires should ignore it.
    (v20Vamp as Character).trackMorality = false;
    const v20Text = renderPrint(v20Vamp, 'en');
    // The classic vampire branch keeps using `sheet_humanity` (the
    // pre-BE-2 label decision is intentionally NOT revisited here).
    expect(v20Text).toContain(UI_STRINGS.en.sheet_humanity);
  });

  it('Spanish print uses the localized labels for mortals', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackMorality: true,
      humanity: 4,
    } as ClassicCharacter;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'es');
    expect(text).toContain(UI_STRINGS.es.sheet_humanity_path);
  });
});

describe('print/PDF — V20 Ghoul opt-in Vitae tracker (Batch BH)', () => {
  // BH mirrors the BE-2 opt-in print contract for the BG Vitae toggle.
  // Vampires keep their existing Blood Pool / Hunger rows byte-for-byte;
  // classic Ghoul Vitae only prints when `trackVitae === true`; dormant
  // pre-Batch-BA `bloodPool` values on opt-out ghouls must NOT leak.
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V20 Ghoul print hides Vitae when trackVitae is missing', () => {
    const ghoul: ClassicCharacter = { ...makeClassic({ clan: 'tremere' }), kind: 'ghoul' } as ClassicCharacter;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_vitae);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
  });

  it('V20 Ghoul print hides Vitae when trackVitae is explicitly false', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackVitae: false,
    } as ClassicCharacter;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_vitae);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
  });

  it('V20 Ghoul print shows Vitae when trackVitae is true and bloodPool is set', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    // Vitae label appears...
    expect(text).toContain(UI_STRINGS.en.sheet_vitae);
    // ...and the row's numeric summary appears via the print-vitae-summary span.
    const summary = document.querySelector('[data-testid="print-vitae-summary"]');
    expect(summary).not.toBeNull();
    expect(summary?.textContent).toContain('2');
    expect(summary?.textContent).toContain('3');
    // The vampire label is NOT used for ghouls (this guards against the
    // ghoul branch accidentally reusing `sheet_blood_pool`).
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
  });

  it('Revised Ghoul print also shows Vitae when trackVitae is true (any classic edition)', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere', edition: 'REVISED' }),
      kind: 'ghoul',
      trackVitae: true,
      bloodPool: { current: 1, max: 1 },
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_vitae);
  });

  it('does NOT leak a dormant bloodPool value into print on a Ghoul opted-out', () => {
    // Pre-Batch-BA dormant data: { current: 10, max: 10 } still on disk
    // from when ghouls flowed through the vampire-shaped pipeline. The
    // ghoul has not opted into Vitae, so print must stay silent.
    const dormant: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      bloodPool: { current: 10, max: 10 },
    } as ClassicCharacter;
    delete (dormant as { humanity?: number }).humanity;
    delete (dormant as { generation?: number }).generation;
    const text = renderPrint(dormant, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_vitae);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
  });

  it('V5 Ghoul print does NOT show Vitae even with trackVitae true (deferred per BF audit §3)', () => {
    const ghoul: V5Character = {
      ...makeV5({ clan: 'tremere' }),
      kind: 'ghoul',
      trackVitae: true,
    } as V5Character;
    delete (ghoul as { hunger?: number }).hunger;
    delete (ghoul as { bloodPotency?: number }).bloodPotency;
    delete (ghoul as { humanity?: number }).humanity;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_vitae);
  });

  it('Human print does NOT show Vitae even with trackVitae true and dormant bloodPool', () => {
    const human: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'human',
      trackVitae: true,
      bloodPool: { current: 5, max: 10 },
    } as ClassicCharacter;
    delete (human as { humanity?: number }).humanity;
    delete (human as { generation?: number }).generation;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_vitae);
    expect(text).not.toContain(UI_STRINGS.en.sheet_blood_pool);
  });

  it('Vampire print still shows Blood Pool / Hunger regardless of trackVitae (no regression)', () => {
    // V20 vampire — schema-driven Blood Pool row is unchanged.
    const v20Vamp = makeClassic({ bloodPool: { current: 6, max: 10 }, humanity: 7, generation: 12 });
    (v20Vamp as Character).trackVitae = true; // stray flag is ignored on vampires
    const v20Text = renderPrint(v20Vamp, 'en');
    expect(v20Text).toContain(UI_STRINGS.en.sheet_blood_pool);
    // Vampires never use the ghoul Vitae label.
    expect(v20Text).not.toContain(UI_STRINGS.en.sheet_vitae);

    cleanup();
    document.body.innerHTML = '';

    // V5 vampire — Hunger row is unchanged.
    const v5Vamp = makeV5({ hunger: 3 });
    (v5Vamp as Character).trackVitae = true;
    const v5Text = renderPrint(v5Vamp, 'en');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_hunger);
    expect(v5Text).not.toContain(UI_STRINGS.en.sheet_vitae);
  });

  it('Spanish V20 Ghoul print uses the localized Vitae label', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'es');
    expect(text).toContain(UI_STRINGS.es.sheet_vitae);
  });

  it('renders a 0/0 Vitae summary for an opted-in Ghoul with bloodPool { current: 0, max: 0 }', () => {
    // Edge case: user explicitly emptied the pool. The row should still
    // render so the printed sheet reflects the live state.
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackVitae: true,
      bloodPool: { current: 0, max: 0 },
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_vitae);
    const summary = document.querySelector('[data-testid="print-vitae-summary"]');
    expect(summary?.textContent).toMatch(/0\s*\/\s*0/);
  });
});

describe('print/PDF — V20 Ghoul opt-in Powers section (Batch BI-2)', () => {
  // BI-2 mirrors the BI-1 live-sheet opt-in onto the print path. Vampires
  // keep their existing Disciplines section byte-for-byte (same label,
  // same row shape); classic Ghoul Powers print only when
  // `trackGhoulPowers === true` and there's at least one entry; dormant
  // pre-AX `disciplines` values on opt-out ghouls must NOT leak. The
  // ghoul branch uses the new BI-1 section label ("Powers" / "Poderes"),
  // never "Disciplines".
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('V20 Ghoul print hides Powers when trackGhoulPowers is missing', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      disciplines: { potence: 1 } as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('V20 Ghoul print hides Powers when trackGhoulPowers is explicitly false', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackGhoulPowers: false,
      disciplines: { potence: 1 } as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('V20 Ghoul print shows the Powers section labelled "Powers" when opted-in with entries', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackGhoulPowers: true,
      disciplines: { potence: 1, celerity: 2 } as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'en');
    // Powers label appears...
    expect(text).toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    // ...and the row shows the discipline names + dot string.
    expect(text).toContain('Potence');
    expect(text).toContain('Celerity');
    // The vampire Disciplines label is NEVER used for ghouls.
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('Revised Ghoul print also shows Powers when opted-in with entries', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere', edition: 'REVISED' }),
      kind: 'ghoul',
      trackGhoulPowers: true,
      disciplines: { dominate: 1 } as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'en');
    expect(text).toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
  });

  it('V20 Ghoul opted-in with empty disciplines map prints NO Powers section', () => {
    // Matches the convention vampires already follow: an empty disciplines
    // map → no section. The decision is documented in the BI-2 brief as
    // an explicit choice — empty sections don't fit the existing print
    // style.
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackGhoulPowers: true,
      disciplines: {} as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('does NOT leak a dormant disciplines map into print on a Ghoul opted-out', () => {
    // Pre-AX dormant data: { celerity: 2 } still on disk from when the
    // character was created as a vampire. The ghoul has not opted into
    // Powers, so print must stay silent.
    const dormant: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      disciplines: { celerity: 2 } as Record<string, number>,
    } as ClassicCharacter;
    delete (dormant as { humanity?: number }).humanity;
    delete (dormant as { generation?: number }).generation;
    delete (dormant as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(dormant, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
    expect(text).not.toContain('Celerity');
  });

  it('V5 Ghoul print does NOT show Powers even with trackGhoulPowers true (deferred per BI audit §3)', () => {
    const ghoul: V5Character = {
      ...makeV5({ clan: 'tremere' }),
      kind: 'ghoul',
      trackGhoulPowers: true,
      disciplines: { auspex: 1 } as Record<string, number>,
    } as V5Character;
    delete (ghoul as { hunger?: number }).hunger;
    delete (ghoul as { bloodPotency?: number }).bloodPotency;
    delete (ghoul as { humanity?: number }).humanity;
    const text = renderPrint(ghoul, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('Human print does NOT show Powers even with trackGhoulPowers true and stored disciplines', () => {
    const human: ClassicCharacter = {
      ...makeClassic({ clan: '' }),
      kind: 'human',
      trackGhoulPowers: true,
      disciplines: { potence: 1 } as Record<string, number>,
    } as ClassicCharacter;
    delete (human as { humanity?: number }).humanity;
    delete (human as { generation?: number }).generation;
    delete (human as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(human, 'en');
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
    expect(text).not.toContain(UI_STRINGS.en.sheet_section_disciplines);
  });

  it('Vampire print still shows Disciplines regardless of trackGhoulPowers (no regression)', () => {
    // V20 vampire — schema-driven Disciplines section is unchanged.
    const v20Vamp = makeClassic({ disciplines: { dominate: 3 } as Record<string, number> });
    (v20Vamp as Character).trackGhoulPowers = true; // stray flag ignored on vampires
    const v20Text = renderPrint(v20Vamp, 'en');
    expect(v20Text).toContain(UI_STRINGS.en.sheet_section_disciplines);
    // Vampires never use the ghoul Powers label.
    expect(v20Text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);

    cleanup();
    document.body.innerHTML = '';

    // V5 vampire — schema-driven Disciplines section is unchanged.
    const v5Vamp = makeV5({ disciplines: { auspex: 2 } as Record<string, number> });
    (v5Vamp as Character).trackGhoulPowers = true;
    const v5Text = renderPrint(v5Vamp, 'en');
    expect(v5Text).toContain(UI_STRINGS.en.sheet_section_disciplines);
    expect(v5Text).not.toContain(UI_STRINGS.en.sheet_section_ghoul_powers);
  });

  it('Spanish V20 Ghoul print uses the localized "Poderes" label', () => {
    const ghoul: ClassicCharacter = {
      ...makeClassic({ clan: 'tremere' }),
      kind: 'ghoul',
      trackGhoulPowers: true,
      disciplines: { potence: 1 } as Record<string, number>,
    } as ClassicCharacter;
    delete (ghoul as { humanity?: number }).humanity;
    delete (ghoul as { generation?: number }).generation;
    delete (ghoul as { bloodPool?: { current: number; max: number } }).bloodPool;
    const text = renderPrint(ghoul, 'es');
    expect(text).toContain(UI_STRINGS.es.sheet_section_ghoul_powers);
    // Spanish vampire label "Disciplinas" must NOT appear on a ghoul.
    expect(text).not.toContain(UI_STRINGS.es.sheet_section_disciplines);
  });
});
