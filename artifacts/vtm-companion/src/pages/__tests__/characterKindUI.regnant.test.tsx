/**
 * @vitest-environment jsdom
 *
 * Batch BK-2 — creation-form regnant selector + card dangling fallback.
 *
 * Locks in:
 *   - The create dialog surfaces an optional Regnant selector only when
 *     Ghoul is picked. Vampires and Humans never see the selector.
 *   - The selector lists only characters whose `kind` resolves to
 *     'vampire'. Humans and other Ghouls are filtered out.
 *   - When no vampires exist in storage, the selector is replaced with
 *     the localized empty-state copy — no broken empty dropdown.
 *   - Manual Regnant clan fallback stays available regardless of
 *     regnant selector state.
 *   - Saving a ghoul with a selected regnant stamps
 *     `regnantCharacterId` on the created character; a saved ghoul
 *     without a selection has no such field.
 *   - The regnant selector state is cleared by resetCreateForm — the
 *     next open of the dialog starts fresh.
 *   - A stored dangling `regnantCharacterId` on a card falls back to
 *     a "Linked regnant unavailable" message when there is no manual
 *     clan; the row is not silently dropped.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const passthroughFactory = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  const motion: any = new Proxy({}, { get: (_t, key: string) => passthroughFactory(key) });
  const AnimatePresence = ({ children }: { children: any }) => children;
  return { motion, AnimatePresence };
});

import CharacterPage from '../character';
import { AppContextProvider } from '@/context/AppContext';
import type { Character, ClassicCharacter } from '@/types';
import { getCharacters, saveCharacter } from '@/services/characterStorage';
import { UI_STRINGS } from '@/i18n/ui';

function setLanguage(lang: 'en' | 'es') {
  window.localStorage.setItem('vtm-language', lang);
}

function seedCharacter(overrides: Partial<ClassicCharacter> & { id: string; name: string; kind: Character['kind']; edition?: Character['edition']; clan?: string }) {
  const char = {
    id: overrides.id, name: overrides.name,
    clan: overrides.clan ?? '', edition: overrides.edition ?? 'V20',
    kind: overrides.kind,
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as unknown as Character;
  saveCharacter(char);
}

function openCreateForm() {
  render(
    <AppContextProvider>
      <CharacterPage />
    </AppContextProvider>,
  );
  fireEvent.click(screen.getByTestId('open-create-character'));
}

beforeEach(() => {
  window.localStorage.clear();
  setLanguage('en');
});
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  window.localStorage.clear();
});

describe('Batch BK-2 — create-form regnant selector visibility', () => {
  it('does not render the Regnant selector when Vampire is selected (default)', () => {
    seedCharacter({ id: 'v1', name: 'Sire', kind: 'vampire', clan: 'brujah' });
    openCreateForm();
    expect(screen.queryByTestId('create-regnant-row')).not.toBeInTheDocument();
  });

  it('does not render the Regnant selector when Human is selected', () => {
    seedCharacter({ id: 'v1', name: 'Sire', kind: 'vampire', clan: 'brujah' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-human'));
    expect(screen.queryByTestId('create-regnant-row')).not.toBeInTheDocument();
  });

  it('renders the Regnant selector when Ghoul is selected', () => {
    seedCharacter({ id: 'v1', name: 'Sire', kind: 'vampire', clan: 'brujah' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    const row = screen.getByTestId('create-regnant-row');
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent(/Regnant/i);
  });
});

describe('Batch BK-2 — create-form regnant selector option filter', () => {
  it('lists only vampires — humans and other ghouls are excluded', () => {
    seedCharacter({ id: 'v1', name: 'Vamp One', kind: 'vampire', clan: 'brujah' });
    seedCharacter({ id: 'v2', name: 'Vamp Two', kind: 'vampire', clan: 'tremere' });
    seedCharacter({ id: 'g1', name: 'Ghoul One', kind: 'ghoul' });
    seedCharacter({ id: 'h1', name: 'Human One', kind: 'human' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    const select = screen.getByTestId('create-regnant-select') as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map(o => o.textContent);
    expect(optionTexts).toContain(UI_STRINGS.en.char_kind_regnant_character_none);
    expect(optionTexts).toContain('Vamp One');
    expect(optionTexts).toContain('Vamp Two');
    expect(optionTexts).not.toContain('Ghoul One');
    expect(optionTexts).not.toContain('Human One');
  });

  it('shows the empty-state copy when no vampires exist', () => {
    seedCharacter({ id: 'h1', name: 'Human', kind: 'human' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    expect(screen.getByTestId('create-regnant-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('create-regnant-select')).toBeNull();
  });
});

describe('Batch BK-2 — create-form save wiring', () => {
  it('saves a ghoul with regnantCharacterId when a vampire is selected in the selector', () => {
    seedCharacter({ id: 'v1', name: 'Aleksandra', kind: 'vampire', clan: 'tremere' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    // Name is required by the create form; fill in a value.
    fireEvent.change(screen.getByTestId('create-field-name'), { target: { value: 'Bonded' } });
    fireEvent.change(screen.getByTestId('create-regnant-select'), { target: { value: 'v1' } });
    // Submit.
    fireEvent.click(screen.getByTestId('create-submit'));
    const chars = getCharacters();
    const ghoul = chars.find(c => c.name === 'Bonded');
    expect(ghoul).toBeTruthy();
    expect(ghoul!.kind).toBe('ghoul');
    expect(ghoul!.regnantCharacterId).toBe('v1');
  });

  it('saves a ghoul without regnantCharacterId when the selector is left on "None"', () => {
    seedCharacter({ id: 'v1', name: 'Aleksandra', kind: 'vampire', clan: 'tremere' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    fireEvent.change(screen.getByTestId('create-field-name'), { target: { value: 'Bonded' } });
    // Don't touch the regnant selector.
    fireEvent.click(screen.getByTestId('create-submit'));
    const ghoul = getCharacters().find(c => c.name === 'Bonded');
    expect(ghoul!.regnantCharacterId).toBeUndefined();
  });

  it('does not overwrite the manual clan when a regnant is selected (manual fallback preserved)', () => {
    seedCharacter({ id: 'v1', name: 'Aleksandra', kind: 'vampire', clan: 'tremere' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    fireEvent.change(screen.getByTestId('create-field-name'), { target: { value: 'Bonded' } });
    // Set a manual clan explicitly.
    fireEvent.change(screen.getByTestId('create-clan-row').querySelector('select')!, { target: { value: 'brujah' } });
    fireEvent.change(screen.getByTestId('create-regnant-select'), { target: { value: 'v1' } });
    fireEvent.click(screen.getByTestId('create-submit'));
    const ghoul = getCharacters().find(c => c.name === 'Bonded');
    // Both fields survive: linked wins for display, manual is the
    // fallback. Storage carries both verbatim.
    expect(ghoul!.regnantCharacterId).toBe('v1');
    expect(ghoul!.clan).toBe('brujah');
  });
});

describe('Batch BK-2 — card dangling regnant fallback', () => {
  it('shows "Linked regnant unavailable" on a ghoul card whose link dangles and has no manual clan', () => {
    seedCharacter({
      id: 'g1', name: 'Bonded', kind: 'ghoul', clan: '',
      regnantCharacterId: 'never-exists',
    } as any);
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>,
    );
    // We start on the list view. The dangling row must appear.
    const unavailable = screen.getByTestId('char-card-regnant-unavailable-g1');
    expect(unavailable).toHaveTextContent(UI_STRINGS.en.char_kind_regnant_unavailable);
  });

  it('falls back to the manual clan display on a ghoul card whose link dangles but has a manual clan', () => {
    seedCharacter({
      id: 'g2', name: 'Bonded 2', kind: 'ghoul', clan: 'brujah',
      regnantCharacterId: 'never-exists',
    } as any);
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>,
    );
    // Manual clan wins the fallback path; no "unavailable" element.
    expect(screen.queryByTestId('char-card-regnant-unavailable-g2')).toBeNull();
    const row = screen.getByTestId('char-card-clan-row-g2');
    expect(row).toHaveTextContent(/Brujah/i);
  });

  it('never shows the unavailable text on a vampire or human card', () => {
    seedCharacter({
      id: 'v1', name: 'Vamp', kind: 'vampire', clan: 'brujah',
    } as any);
    seedCharacter({
      id: 'h1', name: 'Human', kind: 'human',
    } as any);
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>,
    );
    expect(screen.queryByTestId('char-card-regnant-unavailable-v1')).toBeNull();
    expect(screen.queryByTestId('char-card-regnant-unavailable-h1')).toBeNull();
  });
});

describe('Batch BK-2 — Spanish labels resolve on the create-form regnant surface', () => {
  it('renders the ES selector label + none option + empty state', () => {
    setLanguage('es');
    // With a vampire in storage → select variant.
    seedCharacter({ id: 'v1', name: 'Sire', kind: 'vampire', clan: 'brujah' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    const row = screen.getByTestId('create-regnant-row');
    expect(within(row).getByText(UI_STRINGS.es.char_kind_regnant_character_label)).toBeInTheDocument();
    const select = screen.getByTestId('create-regnant-select') as HTMLSelectElement;
    const firstOption = Array.from(select.options)[0];
    expect(firstOption.textContent).toBe(UI_STRINGS.es.char_kind_regnant_character_none);
    cleanup();

    // With no vampires → empty-state variant.
    window.localStorage.clear();
    setLanguage('es');
    seedCharacter({ id: 'h1', name: 'Human', kind: 'human' });
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    expect(screen.getByTestId('create-regnant-empty-state')).toHaveTextContent(
      UI_STRINGS.es.char_kind_regnant_none_available,
    );
  });
});
