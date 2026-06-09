/**
 * @vitest-environment jsdom
 *
 * Batch AT — Home "Rules Quick Access" gateway.
 *
 * Confirms the reworked Rules section on Home:
 *   1. Section header + subtitle render.
 *   2. The primary "Core Rules" card exists and links to /compendium/reglas.
 *   3. Secondary nav cards for Disciplines / Clans / Tools exist and route
 *      to their respective compendium sections.
 *   4. Quick-topic chips render and link into the rules deep-link routes.
 *   5. Section avoids long rulebook-like text — Core Rules description stays
 *      compact and original (no copied passages).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Router as WouterRouter } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import Home from '../home';
import { AppContextProvider } from '@/context/AppContext';

function setLanguage(lang: 'en' | 'es') {
  window.localStorage.setItem('vtm-language', lang);
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

describe('Home — Rules Quick Access (Batch AT)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLanguage('en');
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('renders the section header and subtitle', () => {
    renderHome();
    const section = screen.getByTestId('home-rules-quick-access');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent(/rules quick access/i);
    expect(section).toHaveTextContent(/find the most used rules/i);
  });

  it('renders the primary Core Rules card and routes to /compendium/reglas', () => {
    const { memory } = renderHome();
    const core = screen.getByTestId('home-rules-core');
    expect(core).toBeInTheDocument();
    expect(core).toHaveTextContent(/core rules/i);
    fireEvent.click(core);
    expect(memory.history[memory.history.length - 1]).toBe('/compendium/reglas');
  });

  it('renders Disciplines, Clans, and Tools secondary cards with correct routes', () => {
    const { memory } = renderHome();

    const disciplines = screen.getByTestId('home-rules-disciplines');
    const clans = screen.getByTestId('home-rules-clans');
    const tools = screen.getByTestId('home-rules-tools');

    expect(disciplines).toBeInTheDocument();
    expect(clans).toBeInTheDocument();
    expect(tools).toBeInTheDocument();

    fireEvent.click(disciplines);
    expect(memory.history[memory.history.length - 1]).toBe('/compendium/disciplinas');

    fireEvent.click(clans);
    expect(memory.history[memory.history.length - 1]).toBe('/compendium/clanes');

    fireEvent.click(tools);
    expect(memory.history[memory.history.length - 1]).toBe('/compendium/herramientas');
  });

  it('replaces the prior static quick-topic chip row with the Recommended Next section', () => {
    // Batch AU rework: the static Combat / Dice / Health / Hunger / Willpower
    // / Humanity / Blood Pool chip row was removed in favor of dynamic
    // "Recommended Next" cards. The recommendations section must render in
    // its place; the old `home-rules-topics` container must be gone.
    renderHome();
    expect(screen.queryByTestId('home-rules-topics')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-recommended')).toBeInTheDocument();
  });

  it('keeps the Core Rules description short and original (no long rulebook prose)', () => {
    renderHome();
    const core = screen.getByTestId('home-rules-core');
    // The description paragraph follows the card title. Whatever sits inside
    // the card should stay short — this is a navigation gateway, not a
    // rulebook excerpt. Cap at ~280 chars to lock the budget without being
    // brittle to wording tweaks.
    expect(core.textContent?.length ?? 0).toBeLessThan(280);
  });
});
