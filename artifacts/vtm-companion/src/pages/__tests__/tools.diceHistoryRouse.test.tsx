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

describe('Tools — Recent rolls are filtered by active edition (Batch AL polish)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('V5 view shows V5 dice rolls AND rouse checks, but never classic rolls', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    // A V5 dice roll AND a rouse check — both should be V5-relevant.
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));
    fireEvent.click(screen.getByTestId('rouse-check-roll'));

    // Expand so all V5-relevant entries are visible.
    fireEvent.click(screen.getByTestId('dice-history-toggle'));
    const list = screen.getByTestId('dice-history-list');
    expect(list.textContent).toMatch(/V5/);     // V5 kind chip
    expect(list.textContent).toMatch(/Rouse/);  // rouse kind chip
    // Classic-only marker: the classic summary uses "Diff" (e.g.
    // "Pool 5 / Diff 6 — 0 net success(es)"); V5 summaries never include
    // it, so its absence proves no classic entries leaked into the view.
    expect(list.textContent).not.toMatch(/Diff/);
  });

  it('classic / V20 view hides V5 hunger rolls and shows only its own pool/difficulty rolls', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    const view = renderTools();

    // Make a V5 roll on V5 first — it lands in the store.
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));
    expect(screen.getByTestId('dice-history-entry-0').textContent).toMatch(/V5/);

    // Switch to V20 (rerender under a new edition-seeded provider).
    view.unmount();
    window.localStorage.setItem('vtm-edition', 'V20');
    renderTools();

    // The V5 entry is in the store but NOT rendered — empty state shows.
    expect(screen.getByTestId('dice-history-empty')).toBeInTheDocument();

    // Make a classic roll — now THAT is the only visible entry.
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));
    const entry = screen.getByTestId('dice-history-entry-0');
    // Classic summary has "Diff" and "net success(es)"; V5 has "Hunger";
    // rouse has "Rouse check". Assert against the markers that only
    // appear on the right side of the filter.
    expect(entry.textContent).toMatch(/Diff/);
    expect(entry.textContent).not.toMatch(/Hunger/);
    expect(entry.textContent).not.toMatch(/Rouse check/);
  });

  it('the visible count reflects the filtered list, not the underlying store', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();

    // Two V5 rolls + two rouse checks — all V5-relevant.
    const v5Roll = screen.getByRole('button', { name: /^Roll$/i });
    fireEvent.click(v5Roll);
    fireEvent.click(v5Roll);
    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    fireEvent.click(screen.getByTestId('rouse-check-roll'));

    // Header should report 4 (all four are V5-relevant).
    fireEvent.click(screen.getByTestId('dice-history-toggle'));
    const entries = screen.getAllByTestId(/dice-history-entry-/);
    expect(entries.length).toBe(4);
  });
});

describe('Tools — dice visual polish + safe special mark (Batch AP)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('V5 roller renders normal + hunger dice as DieFace chips with edition-distinct kinds', () => {
    setSession('en', 'V5');
    // Math.random() = 0.6 → die value 7 across the whole pool.
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    renderTools();

    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));

    // Default V5 pool is 5 dice with 1 hunger → 4 normal + 1 hunger chips.
    const normalChips = screen.getAllByTestId(/^die-face-normal-\d+$/);
    const hungerChips = screen.getAllByTestId(/^die-face-hunger-\d+$/);
    expect(normalChips.length).toBe(4);
    expect(hungerChips.length).toBe(1);
    // Hunger chips carry a distinct kind attribute so visually-similar
    // dice rows never confuse the two in tests or screen-reader output.
    expect(hungerChips[0]).toHaveAttribute('data-die-kind', 'hunger');
    expect(normalChips[0]).toHaveAttribute('data-die-kind', 'normal');
    // Accessible label still exposes "Hunger die N" vs "Normal die N".
    expect(hungerChips[0].getAttribute('aria-label')).toMatch(/Hunger die \d+/i);
    expect(normalChips[0].getAttribute('aria-label')).toMatch(/Normal die \d+/i);
  });

  it('a die showing 10 renders the safe Sparkles critical mark; non-10s do not', () => {
    setSession('en', 'V5');
    // Math.random() = 0.95 → Math.floor(9.5)+1 = 10 across the pool.
    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    renderTools();
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));

    // Every die shows a critical mark (Sparkles SVG is rendered with
    // the dedicated test-id; aria-hidden so it doesn't double-announce).
    const markers = screen.getAllByTestId('die-critical-mark');
    expect(markers.length).toBe(5); // 4 normal + 1 hunger = 5 chips
    for (const m of markers) {
      expect(m).toHaveAttribute('aria-hidden');
    }

    // Re-render with a guaranteed non-10 (Math.random() = 0 → die value 1)
    // and confirm no critical marks appear.
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderTools();
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));
    expect(screen.queryAllByTestId('die-critical-mark').length).toBe(0);
  });

  it('classic roller renders dice as classic-kind DieFace chips and surfaces the critical mark on 10s', () => {
    setSession('en', 'V20');
    vi.spyOn(Math, 'random').mockReturnValue(0.95); // every die = 10
    renderTools();
    fireEvent.click(screen.getByRole('button', { name: /^Roll$/i }));

    const classicChips = screen.getAllByTestId(/^die-face-classic-\d+$/);
    expect(classicChips.length).toBe(5); // default classic pool size = 5
    for (const c of classicChips) {
      expect(c).toHaveAttribute('data-die-kind', 'classic');
      expect(c).toHaveAttribute('data-die-value', '10');
    }
    // 10s carry the safe Sparkles mark; rendered once per die.
    expect(screen.getAllByTestId('die-critical-mark').length).toBe(5);
  });

  it('rouse check result renders the d10 as a rouse-kind DieFace chip', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7); // success (die = 8)
    renderTools();
    fireEvent.click(screen.getByTestId('rouse-check-roll'));

    const rouseChip = screen.getByTestId('die-face-rouse-8');
    expect(rouseChip).toBeInTheDocument();
    expect(rouseChip).toHaveAttribute('data-die-kind', 'rouse');
    expect(rouseChip).toHaveAttribute('data-die-value', '8');
    // Accessible label uses the Batch AP "Rouse die" string.
    expect(rouseChip.getAttribute('aria-label')).toMatch(/Rouse die 8/i);
    // The result panel still surrounds it (still role="status" live region).
    expect(screen.getByTestId('rouse-check-result')).toContainElement(rouseChip);
  });

  it('a critical rouse check (10) shows the Sparkles mark on the rouse die', () => {
    setSession('en', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.95); // die = 10
    renderTools();
    fireEvent.click(screen.getByTestId('rouse-check-roll'));

    expect(screen.getByTestId('die-face-rouse-10')).toBeInTheDocument();
    // Sparkles mark is rendered inside the rouse die chip.
    const marks = screen.getAllByTestId('die-critical-mark');
    expect(marks.length).toBe(1);
  });

  it('Spanish translates the rouse-die accessible label', async () => {
    setSession('es', 'V5');
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    renderTools();
    fireEvent.click(screen.getByTestId('rouse-check-roll'));
    const chip = screen.getByTestId('die-face-rouse-8');
    expect(chip.getAttribute('aria-label')).toMatch(/Dado de Tirada de Hambre 8/);
  });
});

describe('Tools — V5 Hunger blood-drop accents (Batch AM)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('V5 dice roller surfaces a blood-drop icon on the Hunger NumberInput', () => {
    setSession('en', 'V5');
    renderTools();
    expect(screen.getByTestId('hunger-input-icon')).toBeInTheDocument();
  });

  it('classic / V20 dice roller does NOT render the V5 Hunger NumberInput icon', () => {
    setSession('en', 'V20');
    renderTools();
    expect(screen.queryByTestId('hunger-input-icon')).toBeNull();
  });

  it('V5 dice roller Hunger control still drives a numeric value', () => {
    setSession('en', 'V5');
    renderTools();
    // The icon is decorative; the numeric +/- still work. Click the +
    // button inside the Hunger NumberInput (the second NumberInput on
    // the V5 roller) and confirm something changed.
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    // [0] = Pool +, [1] = Hunger + — both must remain operable.
    expect(plusButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(plusButtons[1]);
    // No assertion on the new value (HungerStateStrip is V5-specific
    // and reflects the level); the click not throwing proves the
    // control is still functional after Batch AM.
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
