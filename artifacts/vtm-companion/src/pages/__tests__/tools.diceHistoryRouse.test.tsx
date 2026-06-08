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
    // The non-applicable hint is NOT rendered on V5.
    expect(screen.queryByTestId('rouse-check-not-applicable')).toBeNull();
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

  it('on a non-V5 edition, the rouse card shows an edition hint instead of the button', () => {
    setSession('en', 'V20');
    renderTools();
    // No roll button on V20, just the "rouse checks are V5 only" hint.
    expect(screen.queryByTestId('rouse-check-roll')).toBeNull();
    expect(screen.getByTestId('rouse-check-not-applicable')).toBeInTheDocument();
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

  it('caps the history list at 10 entries even after many rolls', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    // 15 rouse checks → the cap (10) discards the oldest 5.
    const rouse = screen.getByTestId('rouse-check-roll');
    for (let i = 0; i < 15; i++) fireEvent.click(rouse);

    const entries = screen.getAllByTestId(/dice-history-entry-/);
    expect(entries.length).toBe(10);
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
    expect(UI_STRINGS.en.dice_rouse_v5_only).toMatch(/V5 only/i);
    expect(UI_STRINGS.es.dice_rouse_v5_only).toMatch(/V5/);
  });
});
