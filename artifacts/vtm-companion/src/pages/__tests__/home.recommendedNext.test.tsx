/**
 * @vitest-environment jsdom
 *
 * Batch AU — Home "Recommended Next" dynamic recommendations.
 *
 * Confirms the new section replaces the static quick-topic chips with
 * contextual recommendations driven by:
 *   1. Whether characters / chronicles / sessions exist (empty vs populated).
 *   2. The active edition (V5 vs classic).
 *
 * The previous `home-rules-topics` chip row must be gone.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Router as WouterRouter } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import Home from '../home';
import { AppContextProvider } from '@/context/AppContext';
import {
  createEmptyCharacter,
  saveCharacter,
} from '@/services/characterStorage';
import {
  createEmptyChronicle,
  saveChronicle,
} from '@/services/chronicleStorage';

function setLanguage(lang: 'en' | 'es') {
  window.localStorage.setItem('vtm-language', lang);
}

function setEdition(edition: 'V5' | 'V20' | 'REVISED' | '2ND' | '1ST') {
  window.localStorage.setItem('vtm-edition', edition);
}

function renderHome() {
  const memory = memoryLocation({ path: '/', record: true });
  const ui = render(
    <AppContextProvider>
      <WouterRouter hook={memory.hook}>
        <Home />
      </WouterRouter>
    </AppContextProvider>
  );
  return { ...ui, memory };
}

describe('Home — Recommended Next (Batch AU)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLanguage('en');
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders the Recommended Next section in place of the old quick-topic chip row', () => {
    renderHome();
    expect(screen.queryByTestId('home-rules-topics')).not.toBeInTheDocument();
    const section = screen.getByTestId('home-recommended');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent(/recommended next/i);
  });

  describe('empty state — no characters and no chronicles', () => {
    beforeEach(() => {
      setEdition('V20');
    });

    it('shows create-character and create-chronicle empty-state cards plus Explore clans', () => {
      renderHome();
      expect(screen.getByTestId('home-rec-create-character')).toBeInTheDocument();
      expect(screen.getByTestId('home-rec-create-chronicle')).toBeInTheDocument();
      expect(screen.getByTestId('home-rec-explore-clans')).toBeInTheDocument();
      // Dice/tools is always present.
      expect(screen.getByTestId('home-rec-dice-tools')).toBeInTheDocument();
      // No continue/resume cards when there is no data.
      expect(screen.queryByTestId('home-rec-continue-character')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-resume-chronicle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-open-session')).not.toBeInTheDocument();
    });
  });

  describe('populated state — characters and chronicles exist', () => {
    beforeEach(() => {
      setEdition('V5');
      saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      saveChronicle(createEmptyChronicle('Berlin by Night', { edition: 'V5' }));
    });

    it('shows continue-character and resume-chronicle, not the empty-state cards', () => {
      renderHome();
      expect(screen.getByTestId('home-rec-continue-character')).toBeInTheDocument();
      // No sessions seeded → falls back to resume-chronicle (not open-session).
      expect(screen.getByTestId('home-rec-resume-chronicle')).toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-open-session')).not.toBeInTheDocument();
      // Empty-state cards must be gone.
      expect(screen.queryByTestId('home-rec-create-character')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-create-chronicle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-explore-clans')).not.toBeInTheDocument();
    });

    it('continue-character subtitle uses the recent character name', () => {
      renderHome();
      const card = screen.getByTestId('home-rec-continue-character');
      expect(card).toHaveTextContent('Alice');
    });
  });

  describe('edition awareness', () => {
    it('shows Rouse Check on V5 and not Blood Pool', () => {
      setEdition('V5');
      renderHome();
      expect(screen.getByTestId('home-rec-rouse-check')).toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-blood-pool')).not.toBeInTheDocument();
    });

    it('shows Blood Pool on V20 and not Rouse Check', () => {
      setEdition('V20');
      renderHome();
      expect(screen.getByTestId('home-rec-blood-pool')).toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-rouse-check')).not.toBeInTheDocument();
    });

    it('shows Blood Pool on REVISED and never Rouse Check', () => {
      setEdition('REVISED');
      renderHome();
      expect(screen.getByTestId('home-rec-blood-pool')).toBeInTheDocument();
      expect(screen.queryByTestId('home-rec-rouse-check')).not.toBeInTheDocument();
    });
  });

  describe('localization', () => {
    it('uses the Spanish section title when language is es', () => {
      setLanguage('es');
      setEdition('V20');
      renderHome();
      const section = screen.getByTestId('home-recommended');
      expect(section).toHaveTextContent(/recomendado ahora/i);
    });

    it('uses the English section title when language is en', () => {
      setLanguage('en');
      setEdition('V20');
      renderHome();
      const section = screen.getByTestId('home-recommended');
      expect(section).toHaveTextContent(/recommended next/i);
    });
  });
});
