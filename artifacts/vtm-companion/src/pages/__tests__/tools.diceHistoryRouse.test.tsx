/**
 * @vitest-environment jsdom
 *
 * Batch AL — Tools page: rouse check + recent roll history.
 *
 * Drives the real Tools page so the V5 rouse check button, the
 * non-V5 explanatory hint, and the rolling history list are exercised
 * end-to-end without stubbing internal components.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Tools from '../tools';
import { AppContextProvider } from '@/context/AppContext';

function setSession(lang: 'en' | 'es', edition: string) {
  window.localStorage.setItem('vtm-language', lang);
  window.localStorage.setItem('vtm-edition', edition);
}

function renderTools() {
  return render(
    <AppContextProvider>
      <Tools />
    </AppContextProvider>
  );
}

describe('Tools — V5 rouse check (Batch AL)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the rouse check action when the active edition is V5', () => {
    setSession('en', 'V5');
    renderTools();
    expect(screen.getByTestId('rouse-check-roll')).toBeInTheDocument();
  });

  it('uses the clearer Batch AL review wording for the help line', () => {
    setSession('en', 'V5');
    renderTools();
    // Match the polished wording — Roll one die ... 6+ no Hunger increase
    // ... 1-5 Hunger increases by 1. Hyphen tolerance for the dash.
    expect(
      screen.getByText(/Roll one die.*6\+.*no Hunger increase.*1[–-]5.*Hunger increases by 1/i)
    ).toBeInTheDocument();
  });

  it('clicking the rouse button surfaces a result with success / failure label', () => {
    setSession('en', 'V5');
    // Force a guaranteed success: Math.random() = 0.7 -> die = 8 (>= 6).
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    const result = screen.getByTestId('rouse-check-result');
    expect(result).toBeInTheDocument();
    // The success copy makes the rules consequence obvious — Hunger stays.
    expect(result.textContent).toMatch(/Hunger does not increase/i);
  });

  it('clicking the rouse button on a failure shows the +1 Hunger consequence clearly', () => {
    setSession('en', 'V5');
    // Force a guaranteed failure: Math.random() = 0.1 -> die = 2 (< 6).
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    renderTools();

    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    const result = screen.getByTestId('rouse-check-result');
    expect(result.textContent).toMatch(/Hunger increases by 1/i);
  });

  it('does NOT render the rouse card at all on classic / non-V5 editions', () => {
    setSession('en', 'V20');
    renderTools();
    // The whole card is removed — neither the button nor any explanatory
    // hint is present. Mirrors the Hunger-tracker UX (V5-only).
    expect(screen.queryByTestId('rouse-check-roll')).toBeNull();
    expect(screen.queryByText(/Rouse check/i)).toBeNull();
    expect(screen.queryByText(/V5 only/i)).toBeNull();
  });

  it('also hides the rouse card on Revised / 2nd / 1st', () => {
    for (const ed of ['REVISED', '2ND', '1ST'] as const) {
      window.localStorage.clear();
      setSession('en', ed);
      const { unmount } = renderTools();
      expect(screen.queryByTestId('rouse-check-roll')).toBeNull();
      unmount();
    }
  });
});

describe('Tools — recent roll history (Batch AL)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with the empty-state message and no entries', () => {
    setSession('en', 'V5');
    renderTools();
    expect(screen.getByTestId('dice-history-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('dice-history-list')).toBeNull();
    // The Clear button only appears once there is something to clear.
    expect(screen.queryByTestId('dice-history-clear')).toBeNull();
  });

  it('records each V5 dice roll as a history entry and surfaces the Clear button', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    // Roll once with the regular V5 dice roller (the "Roll" button).
    const rollButton = screen.getByRole('button', { name: /^Roll$/i });
    fireEvent.click(rollButton);

    expect(screen.queryByTestId('dice-history-empty')).toBeNull();
    expect(screen.getByTestId('dice-history-entry-0')).toBeInTheDocument();
    expect(screen.getByTestId('dice-history-clear')).toBeInTheDocument();
  });

  it('records rouse checks alongside dice rolls in the same history list', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    const first = screen.getByTestId('dice-history-entry-0');
    expect(first.textContent).toMatch(/Rouse check/i);
  });

  it('caps the history list at 10 entries even after many rolls (when expanded)', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    // 15 rouse checks → the cap (10) discards the oldest 5.
    const rouse = screen.getByTestId('rouse-check-roll');
    for (let i = 0; i < 15; i++) fireEvent.click(rouse);

    // Collapsed by default: just the latest entry is visible.
    expect(screen.getAllByTestId(/dice-history-entry-/).length).toBe(1);

    // Expand to see the full history — capped at 10.
    fireEvent.click(screen.getByTestId('dice-history-toggle'));
    const entries = screen.getAllByTestId(/dice-history-entry-/);
    expect(entries.length).toBe(10);
  });

  it('collapses by default — only the latest entry is shown until "Show all" is clicked', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();
    const rouse = screen.getByTestId('rouse-check-roll');
    fireEvent.click(rouse);
    fireEvent.click(rouse);
    fireEvent.click(rouse);

    // Three rolls happened, but only the most recent renders in the list.
    expect(screen.getAllByTestId(/dice-history-entry-/).length).toBe(1);
    const toggle = screen.getByTestId('dice-history-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.textContent).toMatch(/Show all/i);

    fireEvent.click(toggle);
    expect(screen.getAllByTestId(/dice-history-entry-/).length).toBe(3);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.textContent).toMatch(/Show less/i);
  });

  it('does not show the expand toggle when there is only one entry', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();
    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    expect(screen.queryByTestId('dice-history-toggle')).toBeNull();
  });

  it('the Clear button empties the history list', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();
    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    expect(screen.getByTestId('dice-history-entry-0')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dice-history-clear'));
    expect(screen.getByTestId('dice-history-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('dice-history-entry-0')).toBeNull();
  });
});

describe('Tools — Batch AL i18n labels', () => {
  it('Spanish and English rouse / history labels are present and distinct', async () => {
    const { UI_STRINGS } = await import('@/i18n/ui');
    expect(UI_STRINGS.en.dice_rouse_check).toBe('Rouse check');
    expect(UI_STRINGS.es.dice_rouse_check).toBe('Tirada de Hambre');
    expect(UI_STRINGS.en.dice_history_title).toBe('Recent rolls');
    expect(UI_STRINGS.es.dice_history_title).toBe('Tiradas recientes');
    // Polished review wording for the rouse help line.
    expect(UI_STRINGS.en.dice_rouse_help).toBe(
      'Roll one die — 6+ no Hunger increase, 1–5 Hunger increases by 1.'
    );
    expect(UI_STRINGS.es.dice_rouse_help).toBe(
      'Tira un dado — 6+ el Hambre no sube, 1–5 el Hambre sube en 1.'
    );
    // Show all / Show less labels exist for the collapsed-by-default toggle.
    expect(UI_STRINGS.en.dice_history_show_all).toBe('Show all');
    expect(UI_STRINGS.es.dice_history_show_all).toBe('Ver todo');
    expect(UI_STRINGS.en.dice_history_show_less).toBe('Show less');
    expect(UI_STRINGS.es.dice_history_show_less).toBe('Ver menos');
    // The "V5 only" fallback hint key was intentionally removed in the
    // review polish — the card is just absent on non-V5 editions.
    expect((UI_STRINGS.en as Record<string, string>).dice_rouse_v5_only).toBeUndefined();
    expect((UI_STRINGS.es as Record<string, string>).dice_rouse_v5_only).toBeUndefined();
  });
});
