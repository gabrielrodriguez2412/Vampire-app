/**
 * @vitest-environment jsdom
 *
 * Batch BI-1 — opt-in Powers section for classic-edition Ghoul sheets.
 *
 * Locks in:
 *   - The Powers card is visible only on classic-edition Ghouls. Vampires
 *     (any edition), Humans (any edition), and V5 Ghouls never see it.
 *   - Default state for new classic Ghouls is "off" — the card shows
 *     only the "Track powers" toggle, no DisciplineList, no dormant
 *     `disciplines` leakage.
 *   - Enabling the toggle reveals a `DisciplineList` instance bound to
 *     the existing `disciplines` map, labelled "Powers" / "Poderes"
 *     (NOT "Disciplines") so the section never reads as full vampire
 *     access.
 *   - Enabling does NOT seed any disciplines data; disabling does NOT
 *     erase it, so dormant pre-AX entries reappear on re-enable.
 *   - The ghoul-mode DisciplineList hides the "Add all suggested" bulk
 *     action that vampires get.
 *   - Regnant-clan suggestions still work via the existing
 *     `getSuggestedDisciplineIds(character.clan, ...)` helper — a
 *     Brujah-bound ghoul sees Celerity / Potence / Presence as
 *     suggestions; a regnant-less ghoul (clan === '') sees none.
 *   - The toggle is disabled in View Mode.
 *   - Vampire schema-driven Disciplines section is unchanged byte-for-
 *     byte (still renders, still has "Add all suggested" available).
 *   - The flag is independent of `trackMorality` and `trackVitae`.
 *   - Localization: EN ("Track powers" / "Powers") and ES
 *     ("Registrar poderes" / "Poderes") both resolve from the real
 *     i18n table.
 *   - Storage round-trip preserves the new flag through serialization.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet } from '../DynamicSheet';
import { AppContextProvider } from '@/context/AppContext';
import type { Character, V5Character, ClassicCharacter } from '@/types';
import { humanV5Schema, humanClassicSchema } from '@/data/characterSheets/human';
import { ghoulV5Schema, ghoulClassicSchema } from '@/data/characterSheets/ghoul';
import { v5Schema } from '@/data/characterSheets/v5';
import { classicSchema } from '@/data/characterSheets/classic';
import { UI_STRINGS } from '@/i18n/ui';

function makeV5Mortal(kind: 'human' | 'ghoul', overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: '1',
    name: 'Mortal V5',
    clan: '',
    edition: 'V5',
    kind,
    attributes: {},
    skills: {},
    disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    experience: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as V5Character;
}

function makeClassicMortal(kind: 'human' | 'ghoul', overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: '1',
    name: 'Mortal Classic',
    clan: '',
    edition: 'V20',
    kind,
    attributes: {},
    abilities: {},
    disciplines: {},
    backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function makeV5Vampire(overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: 'v',
    name: 'Vampire V5',
    clan: 'brujah',
    edition: 'V5',
    kind: 'vampire',
    attributes: {},
    skills: {},
    disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    bloodPotency: 1,
    hunger: 1,
    humanity: 7,
    experience: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as V5Character;
}

function makeClassicVampire(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'v',
    name: 'Vampire V20',
    clan: 'brujah',
    edition: 'V20',
    kind: 'vampire',
    attributes: {},
    abilities: {},
    disciplines: {},
    backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    bloodPool: { current: 10, max: 10 },
    generation: 13,
    humanity: 7,
    experience: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function renderWithContext(ui: React.ReactElement) {
  return render(<AppContextProvider>{ui}</AppContextProvider>);
}

const onChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe('Batch BI-1 — Track powers toggle visibility', () => {
  it('renders the Track powers toggle on a V20 Ghoul sheet', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-ghoul-powers-section')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-track-ghoul-powers-toggle')).toBeInTheDocument();
  });

  it('renders the Track powers toggle on a Revised Ghoul sheet', () => {
    const ghoul = makeClassicMortal('ghoul', { edition: 'REVISED' });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-ghoul-powers-section')).toBeInTheDocument();
  });

  it('does NOT render the Powers card on a V5 Ghoul sheet (deferred per BI audit §3)', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('ghoul')} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
    expect(screen.queryByTestId('sheet-track-ghoul-powers-toggle')).toBeNull();
  });

  it('does NOT render the Powers card on a Human sheet (any edition)', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();

    cleanup();

    renderWithContext(<DynamicSheet character={makeClassicMortal('human')} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
  });

  it('does NOT render the Powers card on a Vampire sheet (V5 + classic)', () => {
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();

    cleanup();

    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
  });

  it('ignores a stray trackGhoulPowers: true on a Human (gated by kind)', () => {
    const stray = makeClassicMortal('human', { trackGhoulPowers: true } as Partial<ClassicCharacter>);
    renderWithContext(<DynamicSheet character={stray} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
  });

  it('ignores a stray trackGhoulPowers: true on a Vampire (gated by kind)', () => {
    const stray = makeClassicVampire({ trackGhoulPowers: true } as Partial<ClassicCharacter>);
    renderWithContext(<DynamicSheet character={stray} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
  });

  it('ignores a stray trackGhoulPowers: true on a V5 Ghoul (gated by edition)', () => {
    const stray = makeV5Mortal('ghoul', { trackGhoulPowers: true } as Partial<V5Character>);
    renderWithContext(<DynamicSheet character={stray} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
  });
});

describe('Batch BI-1 — default off + dormant disciplines hidden', () => {
  it('does not render the Powers list on a brand-new V20 Ghoul', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-ghoul-powers-section')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-ghoul-powers-list')).toBeNull();
  });

  it('keeps dormant disciplines hidden when trackGhoulPowers is undefined', () => {
    // Simulates a pre-AX Ghoul whose stored JSON still carries vampire-
    // shaped discipline entries. The sheet must stay clean.
    const dormant = makeClassicMortal('ghoul', { disciplines: { celerity: 2 } as Record<string, number> });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-list')).toBeNull();
  });

  it('keeps dormant disciplines hidden when trackGhoulPowers is explicitly false', () => {
    const dormant = makeClassicMortal('ghoul', {
      disciplines: { potence: 1 } as Record<string, number>,
      trackGhoulPowers: false,
    });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-list')).toBeNull();
  });
});

describe('Batch BI-1 — enabling / disabling the Powers toggle', () => {
  it('shows the Powers list when trackGhoulPowers is true on a V20 Ghoul', () => {
    renderWithContext(
      <DynamicSheet
        character={makeClassicMortal('ghoul', { trackGhoulPowers: true, disciplines: { potence: 1 } as Record<string, number> })}
        schema={ghoulClassicSchema}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('sheet-ghoul-powers-list')).toBeInTheDocument();
  });

  it('enabling does NOT seed any disciplines data (audit §10)', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-ghoul-powers-toggle'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackGhoulPowers).toBe(true);
    // Empty seed is preserved verbatim — no Brujah-suggested entries
    // get auto-injected on opt-in.
    expect(next.disciplines).toEqual({});
  });

  it('enabling preserves dormant disciplines verbatim (does not overwrite)', () => {
    const dormant = makeClassicMortal('ghoul', { disciplines: { celerity: 2 } as Record<string, number> });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-ghoul-powers-toggle'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackGhoulPowers).toBe(true);
    expect(next.disciplines).toEqual({ celerity: 2 });
  });

  it('disabling hides the list but does NOT erase disciplines', () => {
    const enabled = makeClassicMortal('ghoul', {
      trackGhoulPowers: true,
      disciplines: { potence: 1 } as Record<string, number>,
    });
    renderWithContext(<DynamicSheet character={enabled} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-ghoul-powers-list')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sheet-track-ghoul-powers-toggle'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackGhoulPowers).toBe(false);
    expect(next.disciplines).toEqual({ potence: 1 });
  });
});

describe('Batch BI-1 — Powers label, not Disciplines', () => {
  it('renders the section label as "Powers" / "Poderes", not "Disciplines"', () => {
    renderWithContext(
      <DynamicSheet
        character={makeClassicMortal('ghoul', { trackGhoulPowers: true })}
        schema={ghoulClassicSchema}
        onChange={onChange}
      />,
    );
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    // The AppContext defaults to Spanish, so the localized label is
    // "Poderes". The vampire-side label `sheet_section_disciplines`
    // ("Disciplinas") must NOT appear inside this card.
    expect(within(list).getByText(UI_STRINGS.es.sheet_section_ghoul_powers)).toBeInTheDocument();
    expect(within(list).queryByText(UI_STRINGS.es.sheet_section_disciplines)).toBeNull();
  });
});

describe('Batch BI-1 — ghoul-mode DisciplineList constraint: no "Add all" bulk button', () => {
  it('does NOT render the "Add all suggested" button in the ghoul Powers card', () => {
    // Brujah-bound ghoul → suggestions list will have 3 entries
    // (Celerity / Potence / Presence) in V20. Vampire mode would show
    // the "Add all" button because suggestedIds.length > 1; ghoul mode
    // suppresses it.
    const ghoul = makeClassicMortal('ghoul', { clan: 'brujah', trackGhoulPowers: true });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    expect(within(list).queryByTestId('disciplines-add-all-suggested')).toBeNull();
  });

  it('vampire DisciplineList still renders the "Add all suggested" button (regression)', () => {
    // Brujah V20 vampire keeps the existing UI byte-for-byte: the
    // Brujah-suggested disciplines + the "Add all" button.
    renderWithContext(<DynamicSheet character={makeClassicVampire({ clan: 'brujah' })} schema={classicSchema} onChange={onChange} />);
    expect(screen.getByTestId('disciplines-add-all-suggested')).toBeInTheDocument();
  });
});

describe('Batch BI-1 — regnant-clan suggestion behaviour', () => {
  it('a regnant-bound Ghoul (clan = brujah) sees the regnant clan suggestions inside the Powers card', () => {
    const ghoul = makeClassicMortal('ghoul', { clan: 'brujah', trackGhoulPowers: true });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    // The localized "Sugerido" label appears whenever suggestedIds.length > 0.
    expect(within(list).getByText(/Sugeridas/i)).toBeInTheDocument();
  });

  it('a regnant-less Ghoul (clan === "") sees no suggestion list — manual dropdown only', () => {
    const ghoul = makeClassicMortal('ghoul', { clan: '', trackGhoulPowers: true });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    // No suggestion strip when suggestedIds is empty.
    expect(within(list).queryByText(/Sugeridas/i)).toBeNull();
  });
});

describe('Batch BI-1 — independence from trackMorality and trackVitae', () => {
  it('Powers on, Morality + Vitae off — Ghoul can opt into powers alone', () => {
    const ghoul = makeClassicMortal('ghoul', { trackGhoulPowers: true });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-ghoul-powers-list')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-morality-tracker')).toBeNull();
    expect(screen.queryByTestId('sheet-vitae-tracker')).toBeNull();
  });

  it('All three on — Ghoul sees morality + vitae + powers cards', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackMorality: true,
      humanity: 5,
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
      trackGhoulPowers: true,
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-morality-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-vitae-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-ghoul-powers-list')).toBeInTheDocument();
  });

  it('Toggling Powers does not affect Morality or Vitae state', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackMorality: true,
      humanity: 6,
      trackVitae: true,
      bloodPool: { current: 1, max: 3 },
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-ghoul-powers-toggle'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackGhoulPowers).toBe(true);
    expect(next.trackMorality).toBe(true);
    expect(next.humanity).toBe(6);
    expect(next.trackVitae).toBe(true);
    expect(next.bloodPool).toEqual({ current: 1, max: 3 });
  });
});

describe('Batch BI-1 — vampire Disciplines compatibility', () => {
  it('V20 vampire schema-driven Disciplines section still renders unchanged', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire({ disciplines: { dominate: 2 } as Record<string, number> })} schema={classicSchema} onChange={onChange} />);
    // No Ghoul Powers card.
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
    // The schema-driven section header for vampires is "Disciplinas"
    // in ES (default test language). At least one element in the DOM
    // carries that text — the schema section header.
    expect(screen.getAllByText(UI_STRINGS.es.sheet_section_disciplines).length).toBeGreaterThan(0);
  });

  it('V5 vampire schema-driven Disciplines section still renders unchanged', () => {
    renderWithContext(<DynamicSheet character={makeV5Vampire({ disciplines: { auspex: 2 } as Record<string, number> })} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
    expect(screen.getAllByText(UI_STRINGS.es.sheet_section_disciplines).length).toBeGreaterThan(0);
  });
});

describe('Batch BI-1 — View Mode locks the Powers toggle', () => {
  it('hides the entire Powers card in View Mode when tracking is off (BK-1 fix — was: disabled toggle)', () => {
    renderWithContext(
      <DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} readonly />,
    );
    expect(screen.queryByTestId('sheet-ghoul-powers-section')).toBeNull();
    expect(screen.queryByTestId('sheet-track-ghoul-powers-toggle')).toBeNull();
  });
});

describe('Batch BI-1 — i18n', () => {
  it('exposes EN + ES labels for the Powers toggle and section', () => {
    expect(UI_STRINGS.en.sheet_track_ghoul_powers).toBe('Track powers');
    expect(UI_STRINGS.en.sheet_section_ghoul_powers).toBe('Powers');
    expect(UI_STRINGS.es.sheet_track_ghoul_powers).toBe('Registrar poderes');
    expect(UI_STRINGS.es.sheet_section_ghoul_powers).toBe('Poderes');
  });
});

describe('Batch BI-1 — storage round-trip preserves the flag', () => {
  it('trackGhoulPowers survives JSON serialization', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackGhoulPowers: true,
      disciplines: { potence: 1 } as Record<string, number>,
    });
    const roundTripped = JSON.parse(JSON.stringify(ghoul)) as ClassicCharacter;
    expect(roundTripped.trackGhoulPowers).toBe(true);
    expect(roundTripped.disciplines).toEqual({ potence: 1 });
  });

  it('disciplines survives serialization even when trackGhoulPowers is false (dormant data)', () => {
    const dormant = makeClassicMortal('ghoul', {
      trackGhoulPowers: false,
      disciplines: { celerity: 2 } as Record<string, number>,
    });
    const roundTripped = JSON.parse(JSON.stringify(dormant)) as ClassicCharacter;
    expect(roundTripped.trackGhoulPowers).toBe(false);
    expect(roundTripped.disciplines).toEqual({ celerity: 2 });
  });
});

describe('Batch BK-3 — Ghoul Powers suggestions read the linked regnant clan', () => {
  // BK-1 wired resolveRegnantClan; BK-3 lets the Powers card consume
  // the resolved clan for the suggestions strip. The linked vampire's
  // clan wins over any manual `clan` field on the ghoul; a regnant-
  // less ghoul with a manual clan still falls back to the manual clan;
  // a fully regnant-less ghoul sees the fallback hint copy.

  function makeVampire(id: string, clan: string): ClassicCharacter {
    return {
      id, name: `V-${id}`, clan, edition: 'V20', kind: 'vampire',
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      bloodPool: { current: 10, max: 10 }, generation: 13, humanity: 7,
      experience: 0, createdAt: '', updatedAt: '',
    } as ClassicCharacter;
  }

  it('a ghoul linked to a Tremere vampire sees Tremere suggestions (link overrides manual clan)', () => {
    const vamp = makeVampire('v1', 'tremere');
    // Manual clan is Brujah, but the linked regnant is Tremere. The
    // resolver's precedence rule (linked wins) drives the suggestion.
    const ghoul = makeClassicMortal('ghoul', {
      clan: 'brujah',
      trackGhoulPowers: true,
      regnantCharacterId: 'v1',
    } as Partial<ClassicCharacter>);
    renderWithContext(
      <DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[ghoul, vamp]} />,
    );
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    // The suggestion strip renders each id as a <button>. The manual-
    // add dropdown ALSO lists every discipline as an <option>, so we
    // filter to buttons only when asserting inclusion / exclusion.
    const chipTexts = within(list).getAllByRole('button').map(b => (b.textContent ?? '').trim());
    // Tremere V20 disciplines include Auspex, Dominate, Thaumaturgy.
    // Expect at least one Tremere-flavoured localized chip; expect NO
    // Brujah-flavoured localized chip.
    expect(chipTexts.some(t => /Auspex|Dominar|Taumaturgia/i.test(t))).toBe(true);
    expect(chipTexts.some(t => /Celeridad|Potencia|Presencia/i.test(t))).toBe(false);
    // No fallback hint — a clan resolved.
    expect(within(list).queryByTestId('ghoul-powers-no-regnant-hint')).toBeNull();
  });

  it('a ghoul with no link but a manual clan still sees that clan\'s suggestions (fallback)', () => {
    const ghoul = makeClassicMortal('ghoul', {
      clan: 'brujah',
      trackGhoulPowers: true,
    } as Partial<ClassicCharacter>);
    renderWithContext(
      <DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[ghoul]} />,
    );
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    expect(within(list).getAllByText(/Celeridad|Potencia|Presencia/i).length).toBeGreaterThan(0);
    expect(within(list).queryByTestId('ghoul-powers-no-regnant-hint')).toBeNull();
  });

  it('a fully regnant-less ghoul shows the fallback hint copy in Edit Mode', () => {
    const ghoul = makeClassicMortal('ghoul', {
      clan: '',
      trackGhoulPowers: true,
    } as Partial<ClassicCharacter>);
    renderWithContext(
      <DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[ghoul]} />,
    );
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    const hint = within(list).getByTestId('ghoul-powers-no-regnant-hint');
    expect(hint).toHaveTextContent(UI_STRINGS.es.ghoul_powers_no_regnant_hint);
    // No suggestion strip either.
    expect(within(list).queryByText(/Sugeridas/i)).toBeNull();
  });

  it('the fallback hint does NOT appear in View Mode (View Mode has no toggle either)', () => {
    // Regnant-less + tracking on + readonly. In View Mode the toggle
    // row is hidden and the fallback hint is Edit-Mode-only, so no
    // hint appears — the tracker area is empty.
    const ghoul = makeClassicMortal('ghoul', {
      clan: '',
      trackGhoulPowers: true,
      disciplines: { potence: 1 } as any,
    } as Partial<ClassicCharacter>);
    renderWithContext(
      <DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[ghoul]} readonly />,
    );
    expect(screen.queryByTestId('ghoul-powers-no-regnant-hint')).toBeNull();
  });

  it('a dangling regnant link falls back to the manual clan for suggestions', () => {
    const ghoul = makeClassicMortal('ghoul', {
      clan: 'brujah',
      trackGhoulPowers: true,
      regnantCharacterId: 'never-exists',
    } as Partial<ClassicCharacter>);
    renderWithContext(
      <DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[ghoul]} />,
    );
    const list = screen.getByTestId('sheet-ghoul-powers-list');
    // Dangling link → resolver falls back to manual `clan` → Brujah
    // suggestions still appear (ES localized names).
    expect(within(list).getAllByText(/Celeridad|Potencia|Presencia/i).length).toBeGreaterThan(0);
    expect(within(list).queryByTestId('ghoul-powers-no-regnant-hint')).toBeNull();
  });

  it('vampire Disciplines suggestions are unchanged — no BK-3 hint, no BK-3 prop side effects', () => {
    const vamp: ClassicCharacter = {
      id: 'v', name: 'V', clan: 'brujah', edition: 'V20', kind: 'vampire',
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      bloodPool: { current: 10, max: 10 }, generation: 13, humanity: 7,
      experience: 0, createdAt: '', updatedAt: '',
    } as ClassicCharacter;
    renderWithContext(
      <DynamicSheet character={vamp} schema={classicSchema} onChange={onChange} allCharacters={[vamp]} />,
    );
    // Vampires do not get the ghoul hint, and they still see the "Add
    // all suggested" bulk button that ghouls do not.
    expect(screen.queryByTestId('ghoul-powers-no-regnant-hint')).toBeNull();
    expect(screen.getByTestId('disciplines-add-all-suggested')).toBeInTheDocument();
  });

  it('i18n: EN + ES hint labels resolve from UI_STRINGS', () => {
    expect(UI_STRINGS.en.ghoul_powers_no_regnant_hint).toBe('Select or link a regnant to tailor suggestions.');
    expect(UI_STRINGS.es.ghoul_powers_no_regnant_hint).toBe('Selecciona o vincula un regente para adaptar las sugerencias.');
  });
});
