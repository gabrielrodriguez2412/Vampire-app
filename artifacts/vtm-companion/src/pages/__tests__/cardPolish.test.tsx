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

describe('Batch AK review polish — corner-aligned char pip and "Open" text removed', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('character card pip sits in the top-right action cluster, NOT in the badge row', () => {
    const alice = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    favorite('character', alice.id);
    setLanguage('en');

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    const pip = screen.getByTestId(`card-fav-indicator-character-${alice.id}`);
    // The cluster wraps the pip and the ⋯ More-menu trigger as siblings —
    // ensures the pip is positioned with the top-right actions, not buried
    // inline beneath the character name with the edition / PC tags.
    const cluster = pip.parentElement!;
    expect(cluster).toBeTruthy();
    const moreTrigger = cluster.querySelector('button[aria-label="More actions"]');
    expect(moreTrigger).not.toBeNull();
  });

  it('character preview cards no longer render the "Open →" hint text', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    setLanguage('en');

    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    // The character page itself doesn't otherwise display the literal string
    // "Open sheet" (or the bare "Open" call-to-action) in list view, so we
    // can safely assert it's absent from the document.
    expect(screen.queryByText('Open sheet')).toBeNull();
    expect(screen.queryByText('Open')).toBeNull();
    // The card click handler is still wired up — the title acts as the
    // click surface.
    const card = screen.getByText('Alice').closest('[class*="cursor-pointer"]');
    expect(card).not.toBeNull();
  });

  it('chronicle preview cards no longer render the "Open →" hint text', () => {
    saveChronicle(createEmptyChronicle('Berlin by Night'));
    setLanguage('en');

    render(
      <AppContextProvider>
        <ChroniclePage />
      </AppContextProvider>
    );

    // No bare "Open" CTA inside any list-card footer.
    expect(screen.queryByText('Open')).toBeNull();
    // Card itself remains clickable.
    const card = screen.getByText('Berlin by Night').closest('[class*="cursor-pointer"]');
    expect(card).not.toBeNull();
  });
});

describe('Character card — decorative clan watermark (Batch AS)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders an aria-hidden watermark span on every character card', () => {
    const alice = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    const bob = saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
    setLanguage('en');
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    const aliceMark = screen.getByTestId(`char-card-watermark-${alice.id}`);
    const bobMark = screen.getByTestId(`char-card-watermark-${bob.id}`);
    // Decorative-only contract: screen readers skip it and clicks
    // never land on the watermark itself.
    expect(aliceMark).toHaveAttribute('aria-hidden');
    expect(bobMark).toHaveAttribute('aria-hidden');
    expect(aliceMark.className).toMatch(/pointer-events-none/);
    expect(bobMark.className).toMatch(/pointer-events-none/);
    // Absolute positioning in the bottom-right corner.
    expect(aliceMark.className).toMatch(/absolute/);
    expect(aliceMark.className).toMatch(/right-/);
    expect(aliceMark.className).toMatch(/bottom-/);
    // Always faded — never reaches full opacity.
    expect(aliceMark.className).toMatch(/opacity-\[0\.0\d+\]/);
  });

  it('watermark is clan-aware: data-clan attribute matches the character clan and the glyph matches the safe clan.icon', async () => {
    const alice = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    const bob = saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
    setLanguage('en');
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    const aliceMark = screen.getByTestId(`char-card-watermark-${alice.id}`);
    const bobMark = screen.getByTestId(`char-card-watermark-${bob.id}`);
    expect(aliceMark).toHaveAttribute('data-clan', 'brujah');
    expect(bobMark).toHaveAttribute('data-clan', 'tremere');

    // The rendered glyph matches the existing safe Unicode clan.icon
    // metadata (no new asset, no official VTM artwork).
    const { clans } = await import('@/data/clans');
    const brujah = clans.find(c => c.id === 'brujah');
    const tremere = clans.find(c => c.id === 'tremere');
    expect(aliceMark.textContent?.trim()).toBe(brujah?.icon);
    expect(bobMark.textContent?.trim()).toBe(tremere?.icon);
  });

  it('watermark does not block the card click — opening the sheet still works', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    setLanguage('en');
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    // Clicking anywhere on the card opens the sheet (the watermark is
    // pointer-events-none, so the click hits the underlying Card).
    fireEvent.click(screen.getByText('Alice'));
    // Sheet view opens: the "Back" button appears.
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('watermark coexists with the Batch AK favorite indicator (does not displace or hide it)', () => {
    const alice = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
    favorite('character', alice.id);
    setLanguage('en');
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );

    // Both the favorite pip AND the watermark render on the same card,
    // and they don't collide because the pip lives in the top-right
    // action cluster while the watermark hugs the bottom-right.
    expect(screen.getByTestId(`card-fav-indicator-character-${alice.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`char-card-watermark-${alice.id}`)).toBeInTheDocument();
  });
});

describe('favorite indicator label is localized (Batch AK)', () => {
  it('Spanish "Favorito" / English "Favorite"', async () => {
    const { UI_STRINGS } = await import('@/i18n/ui');
    expect(UI_STRINGS.en.favorite_indicator).toBe('Favorite');
    expect(UI_STRINGS.es.favorite_indicator).toBe('Favorito');
  });
});
