/**
 * @vitest-environment jsdom
 *
 * Batch AX Phase 1 — character `kind` UI hooks.
 *
 * Covers the two surfaces the data-model batch exposes to users today:
 *   1. The create-character form has a Kind selector (Vampire / Human /
 *      Ghoul) with Vampire as the default; switching to Human hides the
 *      clan row entirely; switching to Ghoul keeps the row but uses the
 *      "Regnant clan" label.
 *   2. Cards in the character list surface a non-vampire kind badge —
 *      vampires get no badge (it would be redundant on every existing
 *      card) so this is a non-intrusive change for the dominant case.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// CharacterPage uses `<AnimatePresence mode="wait">` to swap between the
// list / create / sheet views. In jsdom, `mode="wait"` never gets the
// exit-animation completion callback that lets the next view mount,
// which would leave the page stuck on the list. Replace framer-motion
// with synchronous passthroughs for these tests so view transitions
// complete in a single render.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const passthroughFactory = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  const motion: any = new Proxy(
    {},
    {
      get: (_t, key: string) => passthroughFactory(key),
    }
  );
  const AnimatePresence = ({ children }: { children: any }) => children;
  return { motion, AnimatePresence };
});

import CharacterPage from '../character';
import { AppContextProvider } from '@/context/AppContext';
import {
  createEmptyCharacter,
  saveCharacter,
} from '@/services/characterStorage';

function setLanguage(lang: 'en' | 'es') {
  window.localStorage.setItem('vtm-language', lang);
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

function openCreateForm() {
  render(
    <AppContextProvider>
      <CharacterPage />
    </AppContextProvider>
  );
  // The page lands on the list view. The header carries a stable
  // `data-testid` on the Create-character button so we don't depend
  // on accessible-name resolution (which can be flaky when icon
  // libraries inject decorative SVGs into the button content).
  fireEvent.click(screen.getByTestId('open-create-character'));
}

describe('Create dialog — Kind selector (Batch AX)', () => {
  it('renders the three kind options with vampire selected by default', () => {
    openCreateForm();
    const group = screen.getByTestId('create-kind-group');
    expect(group).toBeInTheDocument();
    expect(screen.getByTestId('create-kind-vampire')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('create-kind-human')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('create-kind-ghoul')).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps the clan row visible when Vampire is selected', () => {
    openCreateForm();
    expect(screen.getByTestId('create-clan-row')).toBeInTheDocument();
  });

  it('hides the clan row entirely when Human is selected', () => {
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-human'));
    expect(screen.queryByTestId('create-clan-row')).not.toBeInTheDocument();
  });

  it('keeps the clan row visible when Ghoul is selected but relabels it "Regnant clan"', () => {
    openCreateForm();
    fireEvent.click(screen.getByTestId('create-kind-ghoul'));
    const row = screen.getByTestId('create-clan-row');
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent(/regnant clan/i);
  });
});

describe('Character cards — non-vampire kind pill (Batch AX)', () => {
  it('renders a Human pill on a human character card', () => {
    const human = saveCharacter(createEmptyCharacter('V5', '', 'Mortal', 'human'));
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    const pill = screen.getByTestId(`card-kind-${human.id}`);
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent(/human/i);
  });

  it('renders a Ghoul pill on a ghoul character card', () => {
    const ghoul = saveCharacter(createEmptyCharacter('V20', 'tremere', 'Famulus', 'ghoul'));
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    const pill = screen.getByTestId(`card-kind-${ghoul.id}`);
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent(/ghoul/i);
  });

  it('does NOT render a kind pill on vampire cards (keeps the dominant case clean)', () => {
    const vampire = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    expect(screen.queryByTestId(`card-kind-${vampire.id}`)).not.toBeInTheDocument();
  });
});
