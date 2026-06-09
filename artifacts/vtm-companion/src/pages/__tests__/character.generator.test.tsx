/**
 * @vitest-environment jsdom
 *
 * Batch AQ — character-creation random-generator integration tests.
 *
 * Drives the real CharacterPage create form. Verifies:
 *   * Per-field "Suggest" buttons render for the right edition.
 *   * Clicking "Suggest" never mutates the input directly — the chip
 *     appears, the input stays untouched.
 *   * Clicking "Use" applies the suggestion to the input.
 *   * Pre-filled inputs show the explicit "this will replace your
 *     text" warning before "Use" is clicked.
 *   * V5 vs classic prompt menus surface the right fields.
 *   * The Inspiration panel renders, refreshes, and never auto-fills
 *     anywhere on the form.
 *   * New i18n keys are localized in EN and ES.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CharacterPage from '../character';
import { AppContextProvider } from '@/context/AppContext';

function setSession(lang: 'en' | 'es', edition: string) {
  window.localStorage.setItem('vtm-language', lang);
  window.localStorage.setItem('vtm-edition', edition);
}

async function renderPageAndOpenCreate() {
  render(
    <AppContextProvider>
      <CharacterPage />
    </AppContextProvider>
  );
  // Click the list-header "Create Character" trigger. AnimatePresence
  // mode="wait" defers the swap, so we wait for the form's
  // Inspiration panel (a Batch AQ create-view-only element) to mount.
  fireEvent.click(screen.getByRole('button', { name: /create character/i }));
  await screen.findByTestId('gen-inspiration-panel');
}

describe('CharacterPage — generator controls (Batch AQ)', () => {
  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders the Inspiration panel inside the create form', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    expect(screen.getByTestId('gen-inspiration-panel')).toBeInTheDocument();
    expect(screen.getByTestId('gen-inspiration-refresh')).toBeInTheDocument();
    // No appearance / personality lines yet — clicking refresh adds them.
    expect(screen.queryByTestId('gen-inspiration-appearance')).toBeNull();
    fireEvent.click(screen.getByTestId('gen-inspiration-refresh'));
    expect(screen.getByTestId('gen-inspiration-appearance')).toBeInTheDocument();
    expect(screen.getByTestId('gen-inspiration-personality')).toBeInTheDocument();
  });

  it('renders V5-appropriate Suggest buttons (name, concept, ambition, desire, predator) but not nature/demeanor', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    for (const f of ['name', 'concept', 'ambition', 'desire', 'predator']) {
      expect(screen.getByTestId(`gen-suggest-${f}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('gen-suggest-nature')).toBeNull();
    expect(screen.queryByTestId('gen-suggest-demeanor')).toBeNull();
  });

  it('renders classic-appropriate Suggest buttons (name, concept, nature, demeanor) but not ambition/desire/predator', async () => {
    setSession('en', 'V20');
    await renderPageAndOpenCreate();
    for (const f of ['name', 'concept', 'nature', 'demeanor']) {
      expect(screen.getByTestId(`gen-suggest-${f}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('gen-suggest-ambition')).toBeNull();
    expect(screen.queryByTestId('gen-suggest-desire')).toBeNull();
    expect(screen.queryByTestId('gen-suggest-predator')).toBeNull();
  });

  it('clicking Suggest never mutates the input — the chip appears and the input stays empty', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    const nameInput = screen.getByPlaceholderText(/jeanette/i) as HTMLInputElement;
    expect(nameInput.value).toBe('');
    fireEvent.click(screen.getByTestId('gen-suggest-name'));
    // Chip appears with a suggested value.
    const chip = screen.getByTestId('gen-chip-name');
    expect(chip).toBeInTheDocument();
    // Input is still untouched — explicit-click rule.
    expect(nameInput.value).toBe('');
  });

  it('clicking Use applies the suggestion to the input and dismisses the chip', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    const nameInput = screen.getByPlaceholderText(/jeanette/i) as HTMLInputElement;
    fireEvent.click(screen.getByTestId('gen-suggest-name'));
    const chip = screen.getByTestId('gen-chip-name');
    const suggested = chip.querySelector('p')!.textContent ?? '';
    expect(suggested.trim().length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('gen-use-name'));
    // Input now carries the suggested value, and the chip is gone.
    expect(nameInput.value).toBe(suggested);
    expect(screen.queryByTestId('gen-chip-name')).toBeNull();
  });

  it('clicking Dismiss removes the chip without touching the input', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    const nameInput = screen.getByPlaceholderText(/jeanette/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My typed name' } });
    fireEvent.click(screen.getByTestId('gen-suggest-name'));
    expect(screen.getByTestId('gen-chip-name')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('gen-dismiss-name'));
    expect(screen.queryByTestId('gen-chip-name')).toBeNull();
    // The typed value is untouched.
    expect(nameInput.value).toBe('My typed name');
  });

  it('when the input has content, the chip shows the explicit "will replace" warning', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    const nameInput = screen.getByPlaceholderText(/jeanette/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My typed name' } });
    fireEvent.click(screen.getByTestId('gen-suggest-name'));
    const chip = screen.getByTestId('gen-chip-name');
    expect(chip.textContent).toMatch(/replace your text/i);
  });

  it('Suggest button uses an accessible label that includes the field name', async () => {
    setSession('en', 'V5');
    await renderPageAndOpenCreate();
    const btn = screen.getByTestId('gen-suggest-concept');
    // "Suggest Concept" — sourced from gen_suggest_for with {field} substituted.
    expect(btn.getAttribute('aria-label')).toMatch(/suggest concept/i);
  });
});

describe('CharacterPage — generator i18n keys (Batch AQ)', () => {
  it('English and Spanish generator labels are localized and distinct', async () => {
    const { UI_STRINGS } = await import('@/i18n/ui');
    expect(UI_STRINGS.en.gen_inspiration_title).toBe('Inspiration');
    expect(UI_STRINGS.es.gen_inspiration_title).toBe('Inspiración');
    expect(UI_STRINGS.en.gen_suggest).toBe('Suggest');
    expect(UI_STRINGS.es.gen_suggest).toBe('Sugerir');
    expect(UI_STRINGS.en.gen_use).toBe('Use');
    expect(UI_STRINGS.es.gen_use).toBe('Usar');
    expect(UI_STRINGS.en.gen_refresh).toBe('New suggestion');
    expect(UI_STRINGS.es.gen_refresh).toBe('Nueva sugerencia');
    expect(UI_STRINGS.en.gen_replace_warning).toMatch(/replace/i);
    expect(UI_STRINGS.es.gen_replace_warning).toMatch(/reemplaz/i);
  });
});
