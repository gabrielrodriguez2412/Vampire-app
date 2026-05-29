/**
 * @vitest-environment jsdom
 *
 * Batch AC — "Back to Compendium" navigation on compendium section pages.
 *
 * Confirms the back link renders on the detail-capable section pages
 * (Disciplines, Rules), links to `/compendium`, and is localized EN/ES.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Disciplines from '../disciplines';
import Rules from '../rules';
import { AppContextProvider } from '@/context/AppContext';

function renderPage(ui: React.ReactElement, lang: 'en' | 'es' = 'en') {
  window.localStorage.setItem('vtm-language', lang);
  return render(<AppContextProvider>{ui}</AppContextProvider>);
}

describe('Compendium back navigation (Batch AC)', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => { cleanup(); window.localStorage.clear(); });

  it('Disciplines page shows a "Back to Compendium" link to /compendium (EN)', () => {
    renderPage(<Disciplines />, 'en');
    const link = screen.getByRole('link', { name: 'Back to Compendium' });
    expect(link.getAttribute('href')).toBe('/compendium');
  });

  it('Disciplines page shows the localized link in Spanish', () => {
    renderPage(<Disciplines />, 'es');
    const link = screen.getByRole('link', { name: 'Volver al Compendio' });
    expect(link.getAttribute('href')).toBe('/compendium');
  });

  it('Rules page shows a "Back to Compendium" link to /compendium (EN)', () => {
    renderPage(<Rules />, 'en');
    const link = screen.getByRole('link', { name: 'Back to Compendium' });
    expect(link.getAttribute('href')).toBe('/compendium');
  });
});
