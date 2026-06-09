/**
 * @vitest-environment jsdom
 *
 * Batch AR — character-sheet inspiration-generator integration.
 *
 * Reuses the Batch AQ generator helpers behind a Suggest pip on each
 * eligible Basic Info text field. We render the real DynamicSheet
 * under the real AppContextProvider so localization, edition gating,
 * and the chip → Use / Dismiss flow are exercised end-to-end. The
 * underlying RollHistory / dice / favorite / discipline systems stay
 * outside the test's scope.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet } from '../DynamicSheet';
import { AppContextProvider } from '@/context/AppContext';
import { v5Schema } from '@/data/characterSheets/v5';
import { classicSchema } from '@/data/characterSheets/classic';
import type { V5Character, ClassicCharacter, Character } from '@/types';

const onChange = vi.fn();

function makeV5(overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: 'v5', name: '', clan: 'tremere', edition: 'V5',
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    attributes: {}, skills: {}, disciplines: {} as Record<string, number>,
    bloodPotency: 1, hunger: 1, humanity: 7,
    createdAt: '', updatedAt: '', experience: 0,
    ...overrides,
  };
}

function makeClassic(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'c20', name: '', clan: 'ventrue', edition: 'V20',
    generation: 12,
    attributes: {}, abilities: {}, disciplines: {} as Record<string, number>,
    backgrounds: {}, virtues: { conscience: 3, selfControl: 3, courage: 4 },
    humanity: 7, bloodPool: { current: 10, max: 10 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  };
}

function renderSheet(character: Character, opts: { lang?: 'en' | 'es'; readonly?: boolean } = {}) {
  const { lang = 'en', readonly = false } = opts;
  window.localStorage.setItem('vtm-language', lang);
  const schema = character.edition === 'V5' ? v5Schema : classicSchema;
  return render(
    <AppContextProvider>
      <DynamicSheet character={character} schema={schema} onChange={onChange} readonly={readonly} />
    </AppContextProvider>
  );
}

describe('DynamicSheet — Basic Info generator (Batch AR)', () => {
  beforeEach(() => { window.localStorage.clear(); onChange.mockReset(); });
  afterEach(() => { cleanup(); document.body.innerHTML = ''; window.localStorage.clear(); });

  it('renders Suggest pips on the V5 Basic Info text fields the generator supports', () => {
    renderSheet(makeV5());
    // Eligible fields for V5: name, concept, ambition, desire, predatorType.
    for (const fieldId of ['name', 'concept', 'ambition', 'desire', 'predatorType']) {
      expect(screen.getByTestId(`sheet-gen-suggest-${fieldId}`)).toBeInTheDocument();
    }
    // V5 doesn't expose Nature / Demeanor at all — no pip needed.
    expect(screen.queryByTestId('sheet-gen-suggest-nature')).toBeNull();
    expect(screen.queryByTestId('sheet-gen-suggest-demeanor')).toBeNull();
  });

  it('renders Suggest pips on the V20 Basic Info text fields the generator supports', () => {
    renderSheet(makeClassic());
    for (const fieldId of ['name', 'concept', 'nature', 'demeanor']) {
      expect(screen.getByTestId(`sheet-gen-suggest-${fieldId}`)).toBeInTheDocument();
    }
    // No V5-only fields on a classic sheet, no pip for them.
    expect(screen.queryByTestId('sheet-gen-suggest-ambition')).toBeNull();
    expect(screen.queryByTestId('sheet-gen-suggest-desire')).toBeNull();
    expect(screen.queryByTestId('sheet-gen-suggest-predatorType')).toBeNull();
  });

  it('does NOT render Suggest pips on non-mapped basic-info text fields (playerName, chronicle, sire)', () => {
    renderSheet(makeV5());
    expect(screen.queryByTestId('sheet-gen-suggest-playerName')).toBeNull();
    expect(screen.queryByTestId('sheet-gen-suggest-chronicle')).toBeNull();
    expect(screen.queryByTestId('sheet-gen-suggest-sire')).toBeNull();
  });

  it('does NOT render Suggest pips when the sheet is in View Mode (readonly)', () => {
    renderSheet(makeV5(), { readonly: true });
    // None of the eligible field pips render — Basic Info text fields
    // are build-time fields, not gameplay trackers, so they stay
    // locked in View Mode and no Suggest pip surfaces.
    for (const fieldId of ['name', 'concept', 'ambition', 'desire', 'predatorType']) {
      expect(screen.queryByTestId(`sheet-gen-suggest-${fieldId}`)).toBeNull();
    }
  });

  it('clicking Suggest opens a chip but does NOT mutate the character or call onChange', () => {
    renderSheet(makeV5());
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-concept'));
    expect(screen.getByTestId('sheet-gen-chip-concept')).toBeInTheDocument();
    // The auto-mutation rule: opening the chip never writes to the
    // character. onChange must stay un-called.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking Use applies the suggestion to the field via onChange and dismisses the chip', () => {
    renderSheet(makeV5());
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-concept'));
    const chip = screen.getByTestId('sheet-gen-chip-concept');
    const suggested = chip.querySelector('p')!.textContent ?? '';
    expect(suggested.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('sheet-gen-use-concept'));
    // onChange is called once with the suggested value written into
    // character.concept — the storage shape is preserved.
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as V5Character;
    expect(updated.concept).toBe(suggested);
    // Chip is gone.
    expect(screen.queryByTestId('sheet-gen-chip-concept')).toBeNull();
  });

  it('clicking Dismiss removes the chip without touching the character or calling onChange', () => {
    renderSheet(makeV5({ concept: 'Late-night detective' }));
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-concept'));
    expect(screen.getByTestId('sheet-gen-chip-concept')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sheet-gen-dismiss-concept'));
    expect(screen.queryByTestId('sheet-gen-chip-concept')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('chip shows the explicit "will replace your text" warning when the field already has content', () => {
    renderSheet(makeV5({ concept: 'Existing concept' }));
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-concept'));
    const chip = screen.getByTestId('sheet-gen-chip-concept');
    expect(chip.textContent).toMatch(/replace your text/i);
  });

  it('Spanish UI surfaces ES-pool concept suggestions (not English ones)', async () => {
    renderSheet(makeV5(), { lang: 'es' });
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-concept'));
    const suggested = screen.getByTestId('sheet-gen-chip-concept').querySelector('p')!.textContent ?? '';
    const data = await import('@/data/characterGenerator');
    expect(data.poolFor('concept', 'V5', 'es')).toContain(suggested);
    expect(data.poolFor('concept', 'V5', 'en')).not.toContain(suggested);
  });

  it('V20 sheet routes nature suggestions through the classic pool, not the V5-only pools', async () => {
    renderSheet(makeClassic());
    fireEvent.click(screen.getByTestId('sheet-gen-suggest-nature'));
    const suggested = screen.getByTestId('sheet-gen-chip-nature').querySelector('p')!.textContent ?? '';
    const data = await import('@/data/characterGenerator');
    // The suggested phrase must come from the V20/classic nature pool.
    expect(data.poolFor('nature', 'V20', 'en')).toContain(suggested);
  });
});
