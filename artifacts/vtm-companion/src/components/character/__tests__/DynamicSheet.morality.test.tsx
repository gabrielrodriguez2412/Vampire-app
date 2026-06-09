/**
 * @vitest-environment jsdom
 *
 * Batch BE-1 — opt-in morality tracker for Human / Ghoul sheets.
 *
 * Locks in:
 *   - The toggle is visible only when `kind` is 'human' or 'ghoul'. Vampires
 *     never see it, and the existing vampire Humanity field stays untouched.
 *   - Default state for new mortals is "off" — no Humanity / Path row appears.
 *   - Enabling the toggle synthesizes a Humanity / Path row in the Trackers
 *     section, using the existing `sheet_humanity` (V5) or
 *     `sheet_humanity_path` (classic) label.
 *   - A dormant `humanity` value on a mortal (from pre-Batch-BA imports)
 *     stays hidden when the toggle is off and is preserved verbatim when
 *     the toggle is turned on.
 *   - Enabling on a mortal with no `humanity` value seeds a safe default
 *     (7) instead of leaving the field as 0.
 *   - Disabling the toggle hides the row but does NOT erase the stored
 *     `humanity` value, so the user can re-enable without losing it.
 *   - The toggle is disabled in View Mode (mirroring how Predator Type /
 *     Concept become read-only there).
 *   - Localization: EN ("Track morality") and ES ("Registrar moralidad")
 *     both resolve from the real i18n table.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet } from '../DynamicSheet';
import { AppContextProvider } from '@/context/AppContext';
import type { Character, V5Character, ClassicCharacter } from '@/types';
import type { SheetSchema } from '@/data/characterSheets/schemas';
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

// Real schemas (not stubs) so we exercise the same field shape mortals get
// in the app. The trackers section is where the toggle injects the row.

const onChange = vi.fn();

// AppContextProvider defaults to Spanish, so labels resolve to the ES
// strings during these tests. Pull from UI_STRINGS directly so the test
// stays correct even if we later tweak the copy.
const HUMANITY_LABEL = UI_STRINGS.es.sheet_humanity;
const HUMANITY_PATH_LABEL = UI_STRINGS.es.sheet_humanity_path;

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe('Batch BE-1 — opt-in morality toggle visibility', () => {

  it('is rendered on a V5 human sheet', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-track-morality-toggle')).toBeInTheDocument();
  });

  it('is rendered on a V20 ghoul sheet', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-track-morality-toggle')).toBeInTheDocument();
  });

  it('is NOT rendered on a V5 vampire sheet', () => {
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-track-morality-toggle')).toBeNull();
  });

  it('is NOT rendered on a V20 vampire sheet', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-track-morality-toggle')).toBeNull();
  });
});

describe('Batch BE-1 — default off + dormant data hidden', () => {
  it('does not show the Humanity row on a brand-new V5 human (no trackMorality, no humanity)', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} />);
    expect(screen.queryByText(HUMANITY_LABEL)).toBeNull();
    expect(screen.queryByText(HUMANITY_PATH_LABEL)).toBeNull();
  });

  it('does not show the Humanity row on a brand-new V20 ghoul', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByText(HUMANITY_LABEL)).toBeNull();
    expect(screen.queryByText(HUMANITY_PATH_LABEL)).toBeNull();
  });

  it('keeps a dormant humanity value hidden when trackMorality is undefined', () => {
    // Simulates an AX/AY-era human whose pre-Batch-BA storage still carries
    // a dormant humanity number on disk. The sheet must stay clean.
    const dormant = makeV5Mortal('human', { humanity: 4 });
    renderWithContext(<DynamicSheet character={dormant} schema={humanV5Schema} onChange={onChange} />);
    expect(screen.queryByText(HUMANITY_LABEL)).toBeNull();
  });

  it('keeps a dormant humanity value hidden when trackMorality is explicitly false', () => {
    const dormant = makeClassicMortal('ghoul', { humanity: 6, trackMorality: false });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByText(HUMANITY_PATH_LABEL)).toBeNull();
  });
});

describe('Batch BE-1 — enabling the toggle', () => {
  it('shows the V5 Humanity row when trackMorality is true on a V5 human', () => {
    renderWithContext(
      <DynamicSheet character={makeV5Mortal('human', { trackMorality: true, humanity: 5 })} schema={humanV5Schema} onChange={onChange} />,
    );
    expect(screen.getByText(HUMANITY_LABEL)).toBeInTheDocument();
  });

  it('shows the V20 Humanity / Path row when trackMorality is true on a V20 ghoul', () => {
    renderWithContext(
      <DynamicSheet character={makeClassicMortal('ghoul', { trackMorality: true, humanity: 3 })} schema={ghoulClassicSchema} onChange={onChange} />,
    );
    expect(screen.getByText(HUMANITY_PATH_LABEL)).toBeInTheDocument();
  });

  it('seeds humanity to 7 when enabling on a mortal that has no dormant value', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-morality-toggle'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0] as Character;
    expect(next.trackMorality).toBe(true);
    expect((next as V5Character).humanity).toBe(7);
  });

  it('preserves an existing dormant humanity value when enabling (does not overwrite)', () => {
    const dormant = makeClassicMortal('human', { humanity: 4 });
    renderWithContext(<DynamicSheet character={dormant} schema={humanClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-morality-toggle'));
    const next = onChange.mock.calls[0][0] as Character;
    expect(next.trackMorality).toBe(true);
    expect((next as ClassicCharacter).humanity).toBe(4);
  });
});

describe('Batch BE-1 — disabling the toggle', () => {
  it('hides the row but does NOT erase the humanity value', () => {
    const enabled = makeV5Mortal('ghoul', { trackMorality: true, humanity: 6 });
    renderWithContext(<DynamicSheet character={enabled} schema={ghoulV5Schema} onChange={onChange} />);
    // Row visible before disabling.
    expect(screen.getByText(HUMANITY_LABEL)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sheet-track-morality-toggle'));
    const next = onChange.mock.calls[0][0] as V5Character;
    expect(next.trackMorality).toBe(false);
    // Value preserved verbatim — the user can re-enable later without
    // having to retype.
    expect(next.humanity).toBe(6);
  });
});

describe('Batch BE-1 — vampire compatibility', () => {
  it('renders Humanity on a V5 vampire from the schema, regardless of trackMorality', () => {
    // The vampire schema includes Humanity via a `sheet_humanity` field
    // entry — it should appear without any toggle interaction, and the
    // toggle should not be in the DOM at all.
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-track-morality-toggle')).toBeNull();
    expect(screen.getAllByText(HUMANITY_LABEL).length).toBeGreaterThan(0);
  });

  it('renders Humanity / Path on a V20 vampire from the schema', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-track-morality-toggle')).toBeNull();
    expect(screen.getAllByText(HUMANITY_PATH_LABEL).length).toBeGreaterThan(0);
  });

  it('ignores a stray trackMorality value if it somehow lands on a vampire', () => {
    const vamp = makeV5Vampire({ trackMorality: true });
    renderWithContext(<DynamicSheet character={vamp} schema={v5Schema} onChange={onChange} />);
    // Still no toggle, still no injected mortal-side row beyond the
    // schema's own humanity field. The schema renders the field once;
    // the conditional injection only fires for `kind ∈ {human, ghoul}`.
    expect(screen.queryByTestId('sheet-track-morality-toggle')).toBeNull();
    expect(screen.getAllByText(HUMANITY_LABEL).length).toBe(1);
  });
});

describe('Batch BE-1 — View Mode locks the toggle', () => {
  it('disables the toggle when the sheet is readonly', () => {
    renderWithContext(
      <DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} readonly />,
    );
    const toggle = screen.getByTestId('sheet-track-morality-toggle');
    expect(toggle).toBeDisabled();
  });
});

describe('Batch BE-1 — i18n', () => {
  it('exposes EN + ES labels for the toggle', () => {
    expect(UI_STRINGS.en.sheet_track_morality).toBe('Track morality');
    expect(UI_STRINGS.es.sheet_track_morality).toBe('Registrar moralidad');
  });
});

describe('Batch BE-1 — storage round-trip preserves the flag', () => {
  it('the trackMorality flag survives serialization (JSON envelope round-trip)', () => {
    const mortal = makeV5Mortal('human', { trackMorality: true, humanity: 5 });
    const roundTripped = JSON.parse(JSON.stringify(mortal)) as V5Character;
    expect(roundTripped.trackMorality).toBe(true);
    expect(roundTripped.humanity).toBe(5);
  });

  it('the humanity value survives serialization even when trackMorality is false (dormant data)', () => {
    const dormant = makeClassicMortal('ghoul', { trackMorality: false, humanity: 3 });
    const roundTripped = JSON.parse(JSON.stringify(dormant)) as ClassicCharacter;
    expect(roundTripped.trackMorality).toBe(false);
    expect(roundTripped.humanity).toBe(3);
  });
});

describe('Batch BE-1 — schemas remain free of a hard-coded Humanity field on mortals', () => {
  // The audit explicitly says: the toggle layer lives above the schema,
  // not inside it. If a future change accidentally adds humanity into the
  // mortal schema, the toggle becomes redundant and the dormant-data
  // discipline breaks. Lock that in.
  function ids(schema: SheetSchema): string[] {
    return schema.sections.flatMap(s => s.fields.map(f => f.id));
  }

  it('humanV5Schema does not include a hard-coded humanity field', () => {
    expect(ids(humanV5Schema)).not.toContain('humanity');
  });

  it('humanClassicSchema does not include a hard-coded humanity field', () => {
    expect(ids(humanClassicSchema)).not.toContain('humanity');
  });

  it('ghoulV5Schema does not include a hard-coded humanity field', () => {
    expect(ids(ghoulV5Schema)).not.toContain('humanity');
  });

  it('ghoulClassicSchema does not include a hard-coded humanity field', () => {
    expect(ids(ghoulClassicSchema)).not.toContain('humanity');
  });
});
