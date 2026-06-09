/**
 * @vitest-environment jsdom
 *
 * Batch AV polish — optional V5 Generation number-input rendering.
 *
 * Confirms the UX fix that followed the Batch AV review:
 *   1. A V5 character without `generation` set renders the input BLANK
 *      (not "0"), with a "—" placeholder.
 *   2. The underlying character object remains free of a numeric
 *      `generation` value until the user actually types one.
 *   3. Typing a numeric value calls `onChange` with that number on the
 *      character.
 *   4. Clearing the input calls `onChange` with `generation` set to
 *      `undefined` (not 0).
 *   5. Classic generation continues to render its stored default (13)
 *      and is unaffected by the optional flag.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet } from '../DynamicSheet';
import { v5Schema } from '@/data/characterSheets/v5';
import { classicSchema } from '@/data/characterSheets/classic';
import { AppContextProvider } from '@/context/AppContext';
import type { V5Character, ClassicCharacter, Character } from '@/types';

function baseV5(overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: 'v5', name: 'Test V5', clan: 'brujah', edition: 'V5',
    attributes: {}, skills: {}, disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    bloodPotency: 1, hunger: 1, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  };
}

function baseClassic(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'c20', name: 'Test V20', clan: 'tremere', edition: 'V20',
    generation: 13,
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    humanity: 7,
    bloodPool: { current: 10, max: 10 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  };
}

function renderSheet(character: Character, schema = v5Schema) {
  const onChange = vi.fn();
  const utils = render(
    <AppContextProvider>
      <DynamicSheet character={character} schema={schema} onChange={onChange} />
    </AppContextProvider>
  );
  return { onChange, ...utils };
}

describe('Batch AV polish — V5 Generation optional number input', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders a BLANK input (no "0") when V5 generation is unset', () => {
    renderSheet(baseV5()); // no generation
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('—');
  });

  it('renders the stored numeric value when V5 generation is set', () => {
    renderSheet(baseV5({ generation: 12 }));
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    expect(input.value).toBe('12');
  });

  it('writes the parsed number through onChange when the user types', () => {
    const { onChange } = renderSheet(baseV5());
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as V5Character;
    expect(updated.generation).toBe(10);
  });

  it('clears generation to undefined when the user empties the input', () => {
    const { onChange } = renderSheet(baseV5({ generation: 8 }));
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as V5Character;
    expect(updated.generation).toBeUndefined();
  });

  it('does NOT fire onChange merely from rendering an unset V5 generation', () => {
    // Critical: the previous (coerce-to-0) renderer also didn't auto-fire,
    // but this guards the new optional path against an accidental
    // controlled-input reset that would silently write back 0 or NaN.
    const { onChange } = renderSheet(baseV5());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('classic V20 generation still renders its stored default (13) — unaffected by the optional path', () => {
    renderSheet(baseClassic(), classicSchema);
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    expect(input.value).toBe('13');
    // No placeholder is set on non-optional number fields.
    expect(input.placeholder).toBe('');
  });

  it('classic V20 generation field does not blank when cleared — preserves legacy coerce-to-0 behavior', () => {
    const { onChange } = renderSheet(baseClassic(), classicSchema);
    const input = screen.getByTestId('sheet-number-generation') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    // Legacy non-optional path returns 0 for an empty input. We must NOT
    // accidentally start writing `undefined` here — classic generation is
    // a required field on ClassicCharacter.
    const updated = onChange.mock.calls[0][0] as ClassicCharacter;
    expect(updated.generation).toBe(0);
  });
});
