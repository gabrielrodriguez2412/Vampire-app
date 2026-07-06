/**
 * @vitest-environment jsdom
 *
 * Batch BK-1 — sheet-level tests for the ghoul Regnant card.
 *
 * Locks in:
 *   - The card renders only on Ghoul sheets. Humans and Vampires never
 *     see it.
 *   - The selector lists only vampire characters from `allCharacters`,
 *     never self, never other ghouls / humans.
 *   - Selecting a vampire calls `onChange` with the vampire's id in
 *     `regnantCharacterId`; the manual `clan` field is never touched.
 *   - Clearing (choosing "None") removes the id and preserves the manual
 *     clan value byte-for-byte.
 *   - A linked ghoul shows the vampire's name; clicking the name button
 *     navigates via wouter's setLocation to `/character/<vampireId>`.
 *   - A dangling link (id points at a missing / non-vampire) shows the
 *     "Linked regnant unavailable" copy in the select's disabled option;
 *     the stored id is preserved.
 *   - An empty character list on a ghoul with no link shows the
 *     "No vampires available" state.
 *   - View Mode hides the selector and shows a read-only display,
 *     including the click-through button when linked.
 *   - Localized EN + ES labels resolve.
 *   - JSON round-trip preserves `regnantCharacterId`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Router } from 'wouter';
import { DynamicSheet } from '../DynamicSheet';
import { AppContextProvider } from '@/context/AppContext';
import type { Character, V5Character, ClassicCharacter } from '@/types';
import { ghoulV5Schema, ghoulClassicSchema } from '@/data/characterSheets/ghoul';
import { humanClassicSchema } from '@/data/characterSheets/human';
import { v5Schema } from '@/data/characterSheets/v5';
import { classicSchema } from '@/data/characterSheets/classic';
import { UI_STRINGS } from '@/i18n/ui';

function makeVampire(id: string, name: string, clan: string, edition: Character['edition'] = 'V20'): Character {
  if (edition === 'V5') {
    return {
      id, name, clan, edition: 'V5', kind: 'vampire',
      attributes: {}, skills: {}, disciplines: {},
      health: { damage: 0, aggravated: 0, max: 5 },
      willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7,
      experience: 0, createdAt: '', updatedAt: '',
    } as V5Character;
  }
  return {
    id, name, clan, edition, kind: 'vampire',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    bloodPool: { current: 10, max: 10 },
    generation: 13, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
  } as ClassicCharacter;
}

function makeGhoul(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'g1', name: 'Bonded', clan: '', edition: 'V20', kind: 'ghoul',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function makeHuman(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return { ...makeGhoul(overrides), kind: 'human' } as ClassicCharacter;
}

function renderWithContext(ui: React.ReactElement) {
  return render(
    <AppContextProvider>
      <Router>{ui}</Router>
    </AppContextProvider>,
  );
}

const onChange = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, '', '/character/g1');
});
afterEach(() => cleanup());

describe('Batch BK-1 — Regnant card visibility', () => {
  it('renders the Regnant card on a V20 Ghoul sheet', () => {
    const g = makeGhoul();
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} />);
    expect(screen.getByTestId('sheet-regnant-section')).toBeInTheDocument();
  });

  it('renders the Regnant card on a V5 Ghoul sheet (linking allowed regardless of edition)', () => {
    const g = { ...makeGhoul(), edition: 'V5' } as unknown as V5Character;
    renderWithContext(<DynamicSheet character={g as unknown as Character} schema={ghoulV5Schema} onChange={onChange} allCharacters={[g as unknown as Character]} />);
    expect(screen.getByTestId('sheet-regnant-section')).toBeInTheDocument();
  });

  it('does NOT render the Regnant card on a Human sheet', () => {
    const h = makeHuman();
    renderWithContext(<DynamicSheet character={h} schema={humanClassicSchema} onChange={onChange} allCharacters={[h]} />);
    expect(screen.queryByTestId('sheet-regnant-section')).toBeNull();
  });

  it('does NOT render the Regnant card on a Vampire sheet (V5 + classic)', () => {
    const v20 = makeVampire('v20', 'Sire', 'brujah');
    renderWithContext(<DynamicSheet character={v20} schema={classicSchema} onChange={onChange} allCharacters={[v20]} />);
    expect(screen.queryByTestId('sheet-regnant-section')).toBeNull();

    cleanup();

    const v5 = makeVampire('v5', 'Sire', 'brujah', 'V5');
    renderWithContext(<DynamicSheet character={v5} schema={v5Schema} onChange={onChange} allCharacters={[v5]} />);
    expect(screen.queryByTestId('sheet-regnant-section')).toBeNull();
  });
});

describe('Batch BK-1 — Selector behavior in Edit Mode', () => {
  it('lists only vampires — no self, no ghouls, no humans', () => {
    const g = makeGhoul();
    const v1 = makeVampire('v1', 'Vamp One', 'brujah');
    const v2 = makeVampire('v2', 'Vamp Two', 'tremere');
    const otherGhoul = makeGhoul({ id: 'g2', name: 'Other Ghoul' } as any);
    const otherHuman = makeHuman({ id: 'h1', name: 'Other Human' } as any);
    renderWithContext(
      <DynamicSheet
        character={g}
        schema={ghoulClassicSchema}
        onChange={onChange}
        allCharacters={[g, v1, v2, otherGhoul, otherHuman]}
      />,
    );
    const select = screen.getByTestId('sheet-regnant-select') as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map(o => o.textContent);
    // "None" + the two vampires. No self / other ghoul / other human.
    expect(optionTexts).toContain(UI_STRINGS.es.char_kind_regnant_character_none);
    expect(optionTexts).toContain('Vamp One');
    expect(optionTexts).toContain('Vamp Two');
    expect(optionTexts).not.toContain('Bonded');
    expect(optionTexts).not.toContain('Other Ghoul');
    expect(optionTexts).not.toContain('Other Human');
  });

  it('shows the empty-state copy when no vampires exist and no link is set', () => {
    const g = makeGhoul();
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} />);
    expect(screen.getByTestId('sheet-regnant-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-regnant-select')).toBeNull();
  });

  it('selecting a vampire calls onChange with the vampire id — manual clan is untouched', () => {
    const g = makeGhoul({ clan: 'brujah' } as any);
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g, v]} />);
    fireEvent.change(screen.getByTestId('sheet-regnant-select'), { target: { value: 'v1' } });
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.regnantCharacterId).toBe('v1');
    // Manual clan preserved verbatim.
    expect(next.clan).toBe('brujah');
  });

  it('choosing "None" clears the link and preserves the manual clan', () => {
    const g = makeGhoul({ regnantCharacterId: 'v1', clan: 'brujah' } as any);
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g, v]} />);
    fireEvent.change(screen.getByTestId('sheet-regnant-select'), { target: { value: '' } });
    const next = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(next.regnantCharacterId).toBeUndefined();
    expect(next.clan).toBe('brujah');
  });
});

describe('Batch BK-1 — Linked regnant display', () => {
  it('shows the linked vampire`s name as a click-through button on the sheet card', () => {
    const g = makeGhoul({ regnantCharacterId: 'v1' } as any);
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g, v]} />);
    const openBtn = screen.getByTestId('sheet-regnant-open-link');
    expect(openBtn).toHaveTextContent('Aleksandra');
    fireEvent.click(openBtn);
    // wouter's setLocation should route to /character/v1.
    expect(window.location.pathname).toBe('/character/v1');
  });

  it('shows the "Linked regnant unavailable" copy on a dangling link and preserves the stored id', () => {
    const g = makeGhoul({ regnantCharacterId: 'never-exists' } as any);
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} />);
    const select = screen.getByTestId('sheet-regnant-select') as HTMLSelectElement;
    // The disabled fallback option preserves the id so re-render never
    // silently drops the stored value.
    const options = Array.from(select.options);
    const dangling = options.find(o => o.value === 'never-exists');
    expect(dangling).toBeTruthy();
    expect(dangling?.disabled).toBe(true);
    expect(dangling?.textContent).toBe(UI_STRINGS.es.char_kind_regnant_unavailable);
  });

  it('View Mode hides the selector, shows the read-only name button, and still routes on click', () => {
    const g = makeGhoul({ regnantCharacterId: 'v1' } as any);
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    renderWithContext(
      <DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g, v]} readonly />,
    );
    expect(screen.queryByTestId('sheet-regnant-select')).toBeNull();
    const display = screen.getByTestId('sheet-regnant-display');
    const openBtn = within(display).getByTestId('sheet-regnant-open-link');
    expect(openBtn).toHaveTextContent('Aleksandra');
    fireEvent.click(openBtn);
    expect(window.location.pathname).toBe('/character/v1');
  });

  it('View Mode renders an em-dash placeholder for a regnant-less ghoul', () => {
    const g = makeGhoul();
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} readonly />);
    const display = screen.getByTestId('sheet-regnant-display');
    expect(display).toHaveTextContent('—');
  });

  it('a linked ghoul does not trigger onChange on mount (no auto-write)', () => {
    const g = makeGhoul({ regnantCharacterId: 'v1' } as any);
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g, v]} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Batch BK-1 — Manual clan fallback', () => {
  it('an unlinked ghoul with a manual clan renders no linked-name button', () => {
    const g = makeGhoul({ clan: 'brujah' } as any);
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} />);
    expect(screen.queryByTestId('sheet-regnant-open-link')).toBeNull();
  });

  it('an unlinked ghoul with a manual clan is unchanged if you never touch the selector', () => {
    const g = makeGhoul({ clan: 'brujah' } as any);
    renderWithContext(<DynamicSheet character={g} schema={ghoulClassicSchema} onChange={onChange} allCharacters={[g]} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Batch BK-1 — i18n + JSON round-trip', () => {
  it('exposes EN + ES labels for the Regnant surface', () => {
    expect(UI_STRINGS.en.char_kind_regnant_character_label).toBe('Regnant');
    expect(UI_STRINGS.en.char_kind_regnant_character_none).toBe('None');
    expect(UI_STRINGS.en.char_kind_regnant_unavailable).toBe('Linked regnant unavailable');
    expect(UI_STRINGS.en.char_kind_regnant_none_available).toBe('No vampires available');
    expect(UI_STRINGS.es.char_kind_regnant_character_label).toBe('Regente');
    expect(UI_STRINGS.es.char_kind_regnant_character_none).toBe('Ninguno');
    expect(UI_STRINGS.es.char_kind_regnant_unavailable).toBe('Regente vinculado no disponible');
    expect(UI_STRINGS.es.char_kind_regnant_none_available).toBe('No hay Vampiros disponibles');
  });

  it('regnantCharacterId survives JSON serialization', () => {
    const g = makeGhoul({ regnantCharacterId: 'v1', clan: 'brujah' } as any);
    const round = JSON.parse(JSON.stringify(g)) as ClassicCharacter;
    expect(round.regnantCharacterId).toBe('v1');
    expect(round.clan).toBe('brujah');
  });
});
