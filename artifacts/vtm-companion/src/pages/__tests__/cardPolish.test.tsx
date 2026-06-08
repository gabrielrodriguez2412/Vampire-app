/**
 * @vitest-environment jsdom
 *
 * Batch AK — character/chronicle preview-card polish:
 *   1. A visible "favorited" pip on each card mirrors the More-menu state
 *      so users can scan the list without opening the menu.
 *   2. Cards that are NOT favorited must NOT render the pip.
 *   3. Opening (or creating) a character sheet must scroll the window to
 *      the top — without the Batch AK effect the new sheet inherited the
 *      list's scroll position and opened mid-page.
 *
 * The scroll behaviour is checked by spying on window.scrollTo; jsdom does
 * not implement scrolling itself, but the React effect still fires and we
 * can assert the call.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CharacterPage from '../character';
import ChroniclePage from '../chronicle';
import { AppContextProvider } from '@/context/AppContext';
import { createEmptyCharacter, saveCharacter } from '@/services/characterStorage';
import { createEmptyChronicle, saveChronicle } from '@/services/chronicleStorage';
import { makeFavoriteKey } from '@/utils/favorites';

function setLanguage(lang: 'en' | 'es') {
  window.localStorage.setItem('vtm-language', lang);
}

function favorite(type: 'character' | 'chronicle', id: string) {
  const key = makeFavoriteKey(type, id);
  const raw = window.localStorage.getItem('vtm-favorites');
  const map = raw ? JSON.parse(raw) : {};
  map[key] = true;
  window.localStorage.setItem('vtm-favorites', JSON.stringify(map));
}

describe('Character card — favorite indicator (Batch AK)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders a visible favorite pip on favorited character cards', () => {
    const alice = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob')); // not favorited
    favorite('character', alice.id);
    setLanguage('en');

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    // Alice's card carries the pip; Bob's does not.
    expect(
      screen.getByTestId(`card-fav-indicator-character-${alice.id}`)
    ).toBeInTheDocument();
    // The pip carries a meaningful accessible label so screen readers
    // can announce favorited state on the card.
    expect(
      screen.getByLabelText('Favorite')
    ).toBeInTheDocument();
  });

  it('does NOT render the favorite pip on non-favorited character cards', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
    setLanguage('en');

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    // No favorited characters → no card pip anywhere on the page.
    expect(
      screen.queryByLabelText('Favorite')
    ).toBeNull();
  });
});

describe('Chronicle card — favorite indicator (Batch AK)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders a visible favorite pip on favorited chronicle cards', () => {
    const chr = saveChronicle(createEmptyChronicle('Chicago by Night'));
    saveChronicle(createEmptyChronicle('Berlin by Night')); // not favorited
    favorite('chronicle', chr.id);
    setLanguage('en');

    render(
      <AppContextProvider>
        <ChroniclePage />
      </AppContextProvider>
    );

    expect(
      screen.getByTestId(`card-fav-indicator-chronicle-${chr.id}`)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Favorite')).toBeInTheDocument();
  });

  it('does NOT render the favorite pip on non-favorited chronicle cards', () => {
    saveChronicle(createEmptyChronicle('Chicago by Night'));
    saveChronicle(createEmptyChronicle('Berlin by Night'));
    setLanguage('en');

    render(
      <AppContextProvider>
        <ChroniclePage />
      </AppContextProvider>
    );

    expect(screen.queryByLabelText('Favorite')).toBeNull();
  });
});

describe('Character sheet — scroll-to-top on open / create (Batch AK)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('scrolls the window to top when an existing character sheet is opened', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    setLanguage('en');
    // jsdom does not implement scrollTo; install a spy so we can assert
    // the React effect fires the call.
    const scrollSpy = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollSpy, writable: true });

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    // Click Alice's card to open the sheet view.
    fireEvent.click(screen.getByText('Alice'));

    // The Batch AK effect must have scrolled the window to the top with
    // immediate behavior (no smooth scroll, so it isn't visually noisy).
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, behavior: 'auto' })
    );
  });

  it('scrolls the window to top when opening a different character sheet from the list', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
    setLanguage('en');
    const scrollSpy = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollSpy, writable: true });

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    // Open Alice — the effect fires once when the sheet view mounts.
    fireEvent.click(screen.getByText('Alice'));
    const initialCalls = scrollSpy.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);
    // Go back to the list (the back button) and open Bob; the effect fires
    // again because activeChar?.id changes and activeView re-enters 'sheet'.
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    fireEvent.click(screen.getByText('Bob'));
    expect(scrollSpy.mock.calls.length).toBeGreaterThan(initialCalls);
    // Each call must reset the scroll position to the top with the auto
    // (immediate, non-smooth) behaviour, so the new sheet opens at top.
    for (const call of scrollSpy.mock.calls) {
      expect(call[0]).toEqual(expect.objectContaining({ top: 0, behavior: 'auto' }));
    }
  });
});

describe('favorite indicator label is localized (Batch AK)', () => {
  it('Spanish "Favorito" / English "Favorite"', async () => {
    const { UI_STRINGS } = await import('@/i18n/ui');
    expect(UI_STRINGS.en.favorite_indicator).toBe('Favorite');
    expect(UI_STRINGS.es.favorite_indicator).toBe('Favorito');
  });
});
