/**
 * @vitest-environment jsdom
 *
 * Batch BJ — inline dormant-data prompts on the Morality / Vitae / Powers
 * opt-in cards.
 *
 * Locks in:
 *   - A pre-Batch-BA mortal with dormant Humanity sees the Morality
 *     prompt inside the Morality card in Edit Mode. Brand-new mortals
 *     do not.
 *   - A pre-Batch-BA classic Ghoul with dormant Blood Pool sees the
 *     Vitae prompt inside the Vitae card in Edit Mode. V5 Ghouls,
 *     Humans, and Vampires never do.
 *   - A pre-AX classic Ghoul with a non-empty disciplines map sees the
 *     Powers prompt inside the Powers card in Edit Mode. Brand-new
 *     ghouls (empty disciplines seed) do not. V5 Ghouls, Humans, and
 *     Vampires never do.
 *   - Click "Enable" → flips the matching track flag on; the dormant
 *     value is preserved and the tracker renders with it.
 *   - Click "Dismiss" → flips the matching dismissed flag on; the
 *     dormant value is preserved on disk; the prompt disappears.
 *   - View Mode suppresses all prompts even when the predicates would
 *     match.
 *   - The three prompts are independent of each other.
 *   - Vampires render no prompts even with a stray flag combination.
 *   - The three dismissed flags round-trip through JSON serialization.
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
    id: '1', name: 'M', clan: '', edition: 'V5', kind,
    attributes: {}, skills: {}, disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as V5Character;
}

function makeClassicMortal(kind: 'human' | 'ghoul', overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: '1', name: 'M', clan: '', edition: 'V20', kind,
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function makeV5Vampire(): V5Character {
  return {
    id: 'v', name: 'V', clan: 'brujah', edition: 'V5', kind: 'vampire',
    attributes: {}, skills: {}, disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    bloodPotency: 1, hunger: 1, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
  } as V5Character;
}

function makeClassicVampire(): ClassicCharacter {
  return {
    id: 'v', name: 'V', clan: 'brujah', edition: 'V20', kind: 'vampire',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    bloodPool: { current: 10, max: 10 },
    generation: 13, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
  } as ClassicCharacter;
}

function renderWithContext(ui: React.ReactElement) {
  return render(<AppContextProvider>{ui}</AppContextProvider>);
}

const onChange = vi.fn();
beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => cleanup());

describe('Batch BJ — dormant Morality prompt', () => {
  it('appears inside the Morality card for a Human with dormant humanity', () => {
    const human = makeClassicMortal('human', { humanity: 7 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    const card = screen.getByTestId('sheet-morality-section');
    expect(within(card).getByTestId('sheet-dormant-morality-prompt')).toBeInTheDocument();
  });

  it('appears inside the Morality card for a V20 Ghoul with dormant humanity', () => {
    const ghoul = makeClassicMortal('ghoul', { humanity: 5 } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(within(screen.getByTestId('sheet-morality-section')).getByTestId('sheet-dormant-morality-prompt')).toBeInTheDocument();
  });

  it('does NOT appear for a brand-new mortal with no humanity', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('human')} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();
  });

  it('does NOT appear when trackMorality is already on', () => {
    const human = makeClassicMortal('human', { humanity: 7, trackMorality: true } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();
  });

  it('does NOT appear when previously dismissed for this character', () => {
    const human = makeClassicMortal('human', { humanity: 7, dismissedDormantMoralityPrompt: true } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();
  });

  it('Enable flips trackMorality and preserves the dormant humanity', () => {
    const human = makeClassicMortal('human', { humanity: 7 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-morality-prompt-enable'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackMorality).toBe(true);
    // The 7 the user had on disk survives; the toggle handler only seeds
    // 7 when no value exists, so the existing 7 passes through.
    expect(next.humanity).toBe(7);
  });

  it('Dismiss sets the dismissal flag and does NOT touch humanity', () => {
    const human = makeClassicMortal('human', { humanity: 5 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-morality-prompt-dismiss'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.dismissedDormantMoralityPrompt).toBe(true);
    expect(next.trackMorality).toBeUndefined();
    expect(next.humanity).toBe(5);
  });

  it('does NOT appear on vampire sheets even with humanity > 0', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();

    cleanup();
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();
  });

  it('does NOT appear in View Mode', () => {
    const human = makeClassicMortal('human', { humanity: 7 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} readonly />);
    expect(screen.queryByTestId('sheet-dormant-morality-prompt')).toBeNull();
  });
});

describe('Batch BJ — dormant Vitae prompt', () => {
  it('appears inside the Vitae card for a V20 Ghoul with dormant bloodPool', () => {
    const ghoul = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(within(screen.getByTestId('sheet-vitae-section')).getByTestId('sheet-dormant-vitae-prompt')).toBeInTheDocument();
  });

  it('does NOT appear for a brand-new V20 Ghoul', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('does NOT appear on a V5 Ghoul (no Vitae card exists)', () => {
    const ghoul = makeV5Mortal('ghoul', { bloodPool: { current: 5, max: 5 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('does NOT appear on a Human even with stored bloodPool', () => {
    const human = makeClassicMortal('human', { bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('does NOT appear on a vampire (V20 or V5)', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();

    cleanup();
    renderWithContext(<DynamicSheet character={makeV5Vampire()} schema={v5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('does NOT appear when trackVitae is already on', () => {
    const ghoul = makeClassicMortal('ghoul', { trackVitae: true, bloodPool: { current: 2, max: 3 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('does NOT appear when previously dismissed', () => {
    const ghoul = makeClassicMortal('ghoul', { dismissedDormantVitaePrompt: true, bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });

  it('Enable flips trackVitae and preserves the dormant bloodPool verbatim', () => {
    const ghoul = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-vitae-prompt-enable'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackVitae).toBe(true);
    // The toggle handler's seed-only-when-absent rule preserves the 10/10.
    expect(next.bloodPool).toEqual({ current: 10, max: 10 });
  });

  it('Dismiss sets the dismissal flag and does NOT touch bloodPool', () => {
    const ghoul = makeClassicMortal('ghoul', { bloodPool: { current: 7, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-vitae-prompt-dismiss'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.dismissedDormantVitaePrompt).toBe(true);
    expect(next.trackVitae).toBeUndefined();
    expect(next.bloodPool).toEqual({ current: 7, max: 10 });
  });

  it('does NOT appear in View Mode', () => {
    const ghoul = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} readonly />);
    expect(screen.queryByTestId('sheet-dormant-vitae-prompt')).toBeNull();
  });
});

describe('Batch BJ — dormant Powers prompt', () => {
  it('appears inside the Powers card for a V20 Ghoul with non-empty disciplines', () => {
    const ghoul = makeClassicMortal('ghoul', { disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(within(screen.getByTestId('sheet-ghoul-powers-section')).getByTestId('sheet-dormant-powers-prompt')).toBeInTheDocument();
  });

  it('does NOT appear for a brand-new V20 Ghoul (empty disciplines seed)', () => {
    renderWithContext(<DynamicSheet character={makeClassicMortal('ghoul')} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('does NOT appear on a V5 Ghoul', () => {
    const ghoul = makeV5Mortal('ghoul', { disciplines: { auspex: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulV5Schema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('does NOT appear on a Human even with disciplines on disk', () => {
    const human = makeClassicMortal('human', { disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('does NOT appear on a vampire', () => {
    renderWithContext(<DynamicSheet character={makeClassicVampire()} schema={classicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('does NOT appear when trackGhoulPowers is already on', () => {
    const ghoul = makeClassicMortal('ghoul', { trackGhoulPowers: true, disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('does NOT appear when previously dismissed', () => {
    const ghoul = makeClassicMortal('ghoul', { dismissedDormantPowersPrompt: true, disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });

  it('Enable flips trackGhoulPowers and preserves the dormant disciplines map verbatim', () => {
    const ghoul = makeClassicMortal('ghoul', { disciplines: { celerity: 2 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-powers-prompt-enable'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.trackGhoulPowers).toBe(true);
    expect(next.disciplines).toEqual({ celerity: 2 });
  });

  it('Dismiss sets the dismissal flag and does NOT touch disciplines', () => {
    const ghoul = makeClassicMortal('ghoul', { disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-powers-prompt-dismiss'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.dismissedDormantPowersPrompt).toBe(true);
    expect(next.trackGhoulPowers).toBeUndefined();
    expect(next.disciplines).toEqual({ potence: 1 });
  });

  it('does NOT appear in View Mode', () => {
    const ghoul = makeClassicMortal('ghoul', { disciplines: { potence: 1 } as any });
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} readonly />);
    expect(screen.queryByTestId('sheet-dormant-powers-prompt')).toBeNull();
  });
});

describe('Batch BJ — independence + i18n + round-trip', () => {
  it('a V20 Ghoul with dormant humanity, bloodPool, and disciplines sees all three prompts simultaneously', () => {
    const ghoul = makeClassicMortal('ghoul', {
      humanity: 7,
      bloodPool: { current: 10, max: 10 },
      disciplines: { potence: 1 } as any,
    } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    expect(screen.getByTestId('sheet-dormant-morality-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-dormant-vitae-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-dormant-powers-prompt')).toBeInTheDocument();
  });

  it('dismissing one prompt does not dismiss the others', () => {
    const ghoul = makeClassicMortal('ghoul', {
      humanity: 7,
      bloodPool: { current: 10, max: 10 },
      disciplines: { potence: 1 } as any,
    } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sheet-dormant-vitae-prompt-dismiss'));
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.dismissedDormantVitaePrompt).toBe(true);
    expect(next.dismissedDormantMoralityPrompt).toBeUndefined();
    expect(next.dismissedDormantPowersPrompt).toBeUndefined();
  });

  it('exposes EN + ES labels for the dormant prompt copy and action verbs', () => {
    expect(UI_STRINGS.en.dormant_enable).toBe('Enable');
    expect(UI_STRINGS.en.dormant_dismiss).toBe('Dismiss');
    expect(UI_STRINGS.en.dormant_morality_body).toContain('Humanity');
    expect(UI_STRINGS.en.dormant_vitae_body).toContain('Vitae');
    expect(UI_STRINGS.en.dormant_powers_body).toContain('Powers');
    expect(UI_STRINGS.es.dormant_enable).toBe('Activar');
    expect(UI_STRINGS.es.dormant_dismiss).toBe('Descartar');
    expect(UI_STRINGS.es.dormant_morality_body).toContain('Humanidad');
    expect(UI_STRINGS.es.dormant_vitae_body).toContain('Vitae');
    expect(UI_STRINGS.es.dormant_powers_body).toContain('Poderes');
  });

  it('does NOT call onChange while rendering a dormant-data character (no auto-enable, no auto-delete on mount)', () => {
    const ghoul = makeClassicMortal('ghoul', {
      humanity: 7,
      bloodPool: { current: 10, max: 10 },
      disciplines: { potence: 1 } as any,
    } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    // The brief's "no auto-enable, no auto-delete" requirements imply
    // that simply opening a sheet with dormant data must not trigger
    // any storage write. The mount-phase onChange counter must be zero.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the localized EN body copy and action labels inside the banner', () => {
    window.localStorage.setItem('vtm-language', 'en');
    const human = makeClassicMortal('human', { humanity: 7 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    const banner = screen.getByTestId('sheet-dormant-morality-prompt');
    expect(within(banner).getByText(UI_STRINGS.en.dormant_morality_body)).toBeInTheDocument();
    expect(within(banner).getByTestId('sheet-dormant-morality-prompt-enable')).toHaveTextContent(UI_STRINGS.en.dormant_enable);
    expect(within(banner).getByTestId('sheet-dormant-morality-prompt-dismiss')).toHaveTextContent(UI_STRINGS.en.dormant_dismiss);
    window.localStorage.removeItem('vtm-language');
  });

  it('renders the localized ES body copy and action labels inside the banner', () => {
    // ES is the AppContextProvider default; no localStorage stamp needed.
    const ghoul = makeClassicMortal('ghoul', { bloodPool: { current: 10, max: 10 } } as any);
    renderWithContext(<DynamicSheet character={ghoul} schema={ghoulClassicSchema} onChange={onChange} />);
    const banner = screen.getByTestId('sheet-dormant-vitae-prompt');
    expect(within(banner).getByText(UI_STRINGS.es.dormant_vitae_body)).toBeInTheDocument();
    expect(within(banner).getByTestId('sheet-dormant-vitae-prompt-enable')).toHaveTextContent(UI_STRINGS.es.dormant_enable);
    expect(within(banner).getByTestId('sheet-dormant-vitae-prompt-dismiss')).toHaveTextContent(UI_STRINGS.es.dormant_dismiss);
  });

  it('the banner is a plain inline div inside its section — not a modal / portal / overlay', () => {
    // The brief explicitly rules out modals or blocking popups. Verify
    // structurally: the banner must be a descendant of its section
    // wrapper (no portal escape), and it must not carry the
    // `position: fixed` / `position: absolute` semantics a modal would
    // typically use.
    const human = makeClassicMortal('human', { humanity: 7 } as any);
    renderWithContext(<DynamicSheet character={human} schema={humanClassicSchema} onChange={onChange} />);
    const section = screen.getByTestId('sheet-morality-section');
    const banner = screen.getByTestId('sheet-dormant-morality-prompt');
    expect(section).toContainElement(banner);
    // jsdom doesn't run CSS, but we can sanity-check the className.
    expect(banner.className).not.toMatch(/fixed|absolute|sticky/);
    // And the banner is not portaled into document.body directly.
    expect(document.body.firstElementChild).not.toBe(banner);
  });

  it('the three dismissed flags survive a JSON round-trip', () => {
    const ghoul = makeClassicMortal('ghoul', {
      dismissedDormantMoralityPrompt: true,
      dismissedDormantVitaePrompt: true,
      dismissedDormantPowersPrompt: true,
      humanity: 7,
      bloodPool: { current: 10, max: 10 },
      disciplines: { potence: 1 } as any,
    } as any);
    const round = JSON.parse(JSON.stringify(ghoul)) as ClassicCharacter;
    expect(round.dismissedDormantMoralityPrompt).toBe(true);
    expect(round.dismissedDormantVitaePrompt).toBe(true);
    expect(round.dismissedDormantPowersPrompt).toBe(true);
    expect(round.humanity).toBe(7);
    expect(round.bloodPool).toEqual({ current: 10, max: 10 });
    expect(round.disciplines).toEqual({ potence: 1 });
  });
});
