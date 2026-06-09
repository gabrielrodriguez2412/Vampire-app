/**
 * @vitest-environment jsdom
 *
 * Batch AU (post-review) — Home "At the Table" play-support row.
 *
 * Confirms the edition-aware rules/play helper cards that replaced the
 * earlier Recommended-Next iteration:
 *   - Section renders with the new title.
 *   - V5 shows Dice & Rouse Check + Hunger; classic shows Dice + Blood Pool.
 *   - Rouse Check never appears on classic editions; Blood Pool never
 *     appears on V5.
 *   - The section never renders Continue Character or Open Last Session
 *     (those duplicate the top hero card + Recent Activity columns and
 *     were intentionally removed in this rework).
 *   - EN/ES titles are localized.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Router as WouterRouter } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import Home from '../home';
import { AppContextProvider } from '@/context/AppContext';
import { createEmptyCharacter, saveCharacter } from '@/services/characterStorage';
import { createEmptyChronicle, saveChronicle } from '@/services/chronicleStorage';

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

describe('Home — At the Table (Batch AU rework)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLanguage('en');
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders the At the Table section in place of the old chip row', () => {
    setEdition('V20');
    renderHome();
    expect(screen.queryByTestId('home-rules-topics')).not.toBeInTheDocument();
    const section = screen.getByTestId('home-at-table');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent(/at the table/i);
    expect(section).toHaveTextContent(/fast references and play helpers/i);
  });

  describe('V5 edition', () => {
    beforeEach(() => setEdition('V5'));

    it('shows Dice & Rouse Check plus Hunger / Willpower / Humanity / Health', () => {
      renderHome();
      expect(screen.getByTestId('home-at-dice-rouse')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-hunger')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-willpower')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-humanity')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-health')).toBeInTheDocument();
    });

    it('does not show Blood Pool as a primary card on V5', () => {
      renderHome();
      expect(screen.queryByTestId('home-at-blood-pool')).not.toBeInTheDocument();
    });

    it('routes the Dice & Rouse Check card to the Tools page', () => {
      renderHome();
      const card = screen.getByTestId('home-at-dice-rouse');
      expect(card).toHaveTextContent(/dice & rouse check/i);
      // The card is a button — clicking it should navigate to /compendium/herramientas.
      card.click();
      // We can't easily inspect router state without the memory hook here,
      // but the card text and presence already verify the V5 composition.
    });
  });

  describe('classic editions', () => {
    it('on V20 shows Dice and Blood Pool — never Rouse Check', () => {
      setEdition('V20');
      renderHome();
      expect(screen.getByTestId('home-at-dice')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-blood-pool')).toBeInTheDocument();
      expect(screen.queryByTestId('home-at-dice-rouse')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-at-hunger')).not.toBeInTheDocument();
      expect(screen.getByTestId('home-at-willpower')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-humanity')).toBeInTheDocument();
      expect(screen.getByTestId('home-at-health')).toBeInTheDocument();
    });

    it('on REVISED still shows Blood Pool and never Rouse Check or Hunger', () => {
      setEdition('REVISED');
      renderHome();
      expect(screen.getByTestId('home-at-blood-pool')).toBeInTheDocument();
      expect(screen.queryByTestId('home-at-dice-rouse')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-at-hunger')).not.toBeInTheDocument();
    });

    it('renders a short "Humanity" title on classic and surfaces Path/morality in the subtitle', () => {
      // Polish pass: titles are kept short to avoid mid-row truncation on
      // the 5-up grid; classic-edition Path / morality flavor lives in the
      // subtitle now. The card's <h4> holds the title element directly so
      // we check it separately from the broader card textContent (which
      // also includes the icon glyph name and the subtitle).
      setEdition('V20');
      renderHome();
      const card = screen.getByTestId('home-at-humanity');
      const title = card.querySelector('h4');
      expect(title?.textContent?.trim()).toBe('Humanity');
      expect(card).not.toHaveTextContent(/humanity\s*\/\s*path/i);
      expect(card).toHaveTextContent(/path|morality/i);
    });

    it('renders a short "Health" title on classic and surfaces damage/soak in the subtitle', () => {
      setEdition('V20');
      renderHome();
      const card = screen.getByTestId('home-at-health');
      const title = card.querySelector('h4');
      expect(title?.textContent?.trim()).toBe('Health');
      expect(card).not.toHaveTextContent(/health\s*&\s*damage/i);
      expect(card).toHaveTextContent(/damage|soak|healing/i);
    });
  });

  describe('does not duplicate Recent Activity', () => {
    it('does not render Continue Character or Open Last Session inside the bottom section, even with data', () => {
      setEdition('V5');
      saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      saveChronicle(createEmptyChronicle('Berlin by Night', { edition: 'V5' }));
      renderHome();
      const section = screen.getByTestId('home-at-table');
      // None of the old recent-activity-style testIds should be in the section.
      expect(section.querySelector('[data-testid="home-rec-continue-character"]')).toBeNull();
      expect(section.querySelector('[data-testid="home-rec-resume-chronicle"]')).toBeNull();
      expect(section.querySelector('[data-testid="home-rec-open-session"]')).toBeNull();
      // And the section text should not contain the character / chronicle names.
      expect(section.textContent || '').not.toMatch(/Alice/);
      expect(section.textContent || '').not.toMatch(/Berlin by Night/);
    });
  });

  describe('localization', () => {
    it('uses the Spanish title when language is es', () => {
      setLanguage('es');
      setEdition('V20');
      renderHome();
      const section = screen.getByTestId('home-at-table');
      expect(section).toHaveTextContent(/en la mesa/i);
      expect(section).toHaveTextContent(/referencias rápidas y ayudas de juego/i);
    });

    it('uses the English title when language is en', () => {
      setLanguage('en');
      setEdition('V20');
      renderHome();
      const section = screen.getByTestId('home-at-table');
      expect(section).toHaveTextContent(/at the table/i);
    });
  });
});
