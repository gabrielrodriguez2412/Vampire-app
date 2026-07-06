/**
 * @vitest-environment jsdom
 *
 * Batch BG — opt-in Vitae tracker for classic-edition Ghoul sheets.
 *
 * Locks in:
 *   - The Vitae card is visible only on classic-edition Ghouls. Vampires
 *     (any edition), Humans (any edition), and V5 Ghouls never see it.
 *   - Default state for new classic Ghouls is "off" — the card shows
 *     only the "Track vitae" toggle, no tracker, no dormant `bloodPool`
 *     leakage.
 *   - Enabling the toggle synthesizes a `bloodPool` field row inside
 *     the same card, using the existing classic pool tracker visual
 *     and the new `sheet_vitae` label.
 *   - Enabling on a Ghoul with no `bloodPool` seeds `{ current: 3, max: 3 }`.
 *   - Enabling on a Ghoul with a dormant `bloodPool` (e.g. pre-Batch-BA
 *     10/10) preserves the stored value verbatim.
 *   - Disabling the toggle hides the tracker but does NOT erase the
 *     stored `bloodPool` value, so the choice is reversible.
 *   - `trackVitae` and `trackMorality` are independent: a ghoul can opt
 *     into either, both, or neither without interaction.
 *   - The toggle is disabled in View Mode (mirrors the Morality toggle).
 *   - Localization: EN ("Track vitae" / "Vitae") and ES
 *     ("Registrar vitae" / "Vitae") both resolve from the real i18n
 *     table.
 *   - Storage round-trip preserves the new flag through serialization.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

describe('Batch BG — Vitae toggle visibility', () => {
  it('renders the Track vitae toggle on a V20 Ghoul sheet', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-vitae-section')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-track-vitae-toggle')).toBeInTheDocument();
  });

  it('renders the Track vitae toggle on a Revised Ghoul sheet', () => {
    const ghoul = makeClassicMortal('ghoul', { edition: 'REVISED' });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-vitae-section')).toBeInTheDocument();
  });

  it('does NOT render the Vitae card on a V5 Ghoul sheet (deferred per BF audit §3)', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('ghoul')} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
    expect(screen.queryByTestId('sheet-track-vitae-toggle')).toBeNull();
  });

  it('does NOT render the Vitae card on a Human sheet (any edition)', () => {
    renderWithContext(<DynamicSheet character={makeV5Mortal('human')} schema={humanV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();

    cleanup();

    renderWithContext(<DynamicSheet character={makeClassicMortal('human')} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
  });

  it('does NOT render the Vitae card on a Vampire sheet (V5 + classic)', () => {
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();

    cleanup();

    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
  });

  it('ignores a stray trackVitae: true on a Human (gated by kind)', () => {
    const stray = makeClassicMortal('human', { trackVitae: true } as Partial<ClassicCharacter>);
    renderWithContext(<DynamicSheet character={stray} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
  });

  it('ignores a stray trackVitae: true on a Vampire (gated by kind)', () => {
    const stray = makeClassicVampire({ trackVitae: true } as Partial<ClassicCharacter>);
    renderWithContext(<DynamicSheet character={stray} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
  });

  it('ignores a stray trackVitae: true on a V5 Ghoul (gated by edition)', () => {
    const stray = makeV5Mortal('ghoul', { trackVitae: true } as Partial<V5Character>);
    renderWithContext(<DynamicSheet character={stray} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
  });
});

describe('Batch BG — default off + dormant bloodPool hidden', () => {
  it('does not render the Vitae tracker on a brand-new V20 Ghoul', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-vitae-section')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-vitae-tracker')).toBeNull();
  });

  it('keeps dormant bloodPool hidden when trackVitae is undefined', () => {
    // Simulates a pre-Batch-BA Ghoul whose stored JSON still carries a
    // vampire-shaped { current: 10, max: 10 }. The sheet must stay clean.
    const dormant = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-tracker')).toBeNull();
  });

  it('keeps dormant bloodPool hidden when trackVitae is explicitly false', () => {
    const dormant = makeClassicMortal('ghoul', {
      bloodPool: { current: 8, max: 10 },
      trackVitae: false,
    });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-tracker')).toBeNull();
  });
});

describe('Batch BG — enabling the Vitae toggle', () => {
  it('shows the Vitae tracker when trackVitae is true on a V20 Ghoul', () => {
    renderWithContext(
      <DynamicSheet
        character={makeClassicMortal('ghoul', { trackVitae: true, bloodPool: { current: 2, max: 3 } })}
        schema={ghoulClassicSchema}
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('sheet-vitae-tracker')).toBeInTheDocument();
  });

  it('seeds bloodPool to { current: 3, max: 3 } when enabling on a Ghoul with no value', () => {
    renderWithContext(
      <DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('sheet-track-vitae-toggle'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0] as Character;
    expect(next.trackVitae).toBe(true);
    expect((next as ClassicCharacter).bloodPool).toEqual({ current: 3, max: 3 });
  });

  it('preserves a dormant bloodPool when enabling (does not overwrite 10/10 with 3/3)', () => {
    const dormant = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } });
    renderWithContext(<DynamicSheet character={dormant} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-vitae-toggle'));
    const next = onChange.mock.calls[0][0] as Character;
    expect(next.trackVitae).toBe(true);
    expect((next as ClassicCharacter).bloodPool).toEqual({ current: 10, max: 10 });
  });
});

describe('Batch BG — disabling the Vitae toggle', () => {
  it('hides the tracker but does NOT erase the bloodPool value', () => {
    const enabled = makeClassicMortal('ghoul', {
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
    });
    renderWithContext(<DynamicSheet character={enabled} schema={ghoulClassicSchema} onChange={onChange} />);
    // Tracker visible before disabling.
    expect(screen.getByTestId('sheet-vitae-tracker')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sheet-track-vitae-toggle'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackVitae).toBe(false);
    // Value preserved verbatim — the user can re-enable later without
    // having to retype.
    expect(next.bloodPool).toEqual({ current: 2, max: 3 });
  });
});

describe('Batch BG — independence from trackMorality', () => {
  it('Vitae on, Morality off — Ghoul can opt into vitae alone', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-vitae-tracker')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-morality-tracker')).toBeNull();
  });

  it('Morality on, Vitae off — Ghoul can opt into morality alone', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackMorality: true,
      humanity: 5,
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-morality-tracker')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-vitae-tracker')).toBeNull();
  });

  it('Both on — Ghoul sees both trackers in their own cards', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackMorality: true,
      humanity: 5,
      trackVitae: true,
      bloodPool: { current: 2, max: 3 },
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-morality-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-vitae-tracker')).toBeInTheDocument();
  });

  it('Toggling Vitae does not affect Morality state', () => {
    const ghoul = makeClassicMortal('ghoul', {
      trackMorality: true,
      humanity: 6,
    });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-track-vitae-toggle'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackVitae).toBe(true);
    expect(next.trackMorality).toBe(true);
    expect(next.humanity).toBe(6);
  });
});

describe('Batch BG — vampire compatibility', () => {
  it('V20 vampire Blood Pool still renders from the schema; no Vitae card appears', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
    // Vampire's blood-pool tracker stays in its existing schema slot.
    expect(screen.getByTestId('blood-pool-tracker')).toBeInTheDocument();
  });

  it('V5 vampire Hunger drops still render unchanged', () => {
    renderWithContext(<DynamicSheet character={makeV5Vampire({ hunger: 2 })} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
    expect(screen.getByTestId('hunger-drop-2')).toHaveAttribute('data-state', 'filled');
  });
});

describe('Batch BG — View Mode locks the Vitae toggle', () => {
  it('hides the entire Vitae card in View Mode when tracking is off (BK-1 fix — was: disabled toggle)', () => {
    renderWithContext(
      <DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} readonly />,
    );
    expect(screen.queryByTestId('sheet-vitae-section')).toBeNull();
    expect(screen.queryByTestId('sheet-track-vitae-toggle')).toBeNull();
  });
});

describe('Batch BG — i18n', () => {
  it('exposes EN + ES labels for the Vitae toggle and tracker', () => {
    expect(UI_STRINGS.en.sheet_track_vitae).toBe('Track vitae');
    expect(UI_STRINGS.en.sheet_vitae).toBe('Vitae');
    expect(UI_STRINGS.es.sheet_track_vitae).toBe('Registrar vitae');
    expect(UI_STRINGS.es.sheet_vitae).toBe('Vitae');
  });
});

describe('Batch BG — storage round-trip preserves the flag', () => {
  it('trackVitae survives JSON serialization', () => {
    const ghoul = makeClassicMortal('ghoul', { trackVitae: true, bloodPool: { current: 2, max: 3 } });
    const roundTripped = JSON.parse(JSON.stringify(ghoul)) as ClassicCharacter;
    expect(roundTripped.trackVitae).toBe(true);
    expect(roundTripped.bloodPool).toEqual({ current: 2, max: 3 });
  });

  it('bloodPool survives serialization even when trackVitae is false (dormant data)', () => {
    const dormant = makeClassicMortal('ghoul', { trackVitae: false, bloodPool: { current: 8, max: 10 } });
    const roundTripped = JSON.parse(JSON.stringify(dormant)) as ClassicCharacter;
    expect(roundTripped.trackVitae).toBe(false);
    expect(roundTripped.bloodPool).toEqual({ current: 8, max: 10 });
  });
});
