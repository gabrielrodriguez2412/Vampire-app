/**
 * @vitest-environment jsdom
 *
 * Batch AB — reusable bulk-selection state hook.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from '../useBulkSelection';

describe('useBulkSelection', () => {
  it('starts inactive and empty', () => {
    const { result } = renderHook(() => useBulkSelection());
    expect(result.current.active).toBe(false);
    expect(result.current.count).toBe(0);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('enter() activates selection mode with an empty set', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.enter());
    expect(result.current.active).toBe(true);
    expect(result.current.count).toBe(0);
  });

  it('toggle() adds then removes an id and updates the count', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.enter());
    act(() => result.current.toggle('a'));
    act(() => result.current.toggle('b'));
    expect(result.current.count).toBe(2);
    expect(result.current.isSelected('a')).toBe(true);
    act(() => result.current.toggle('a'));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('setSelection() replaces the selection (used by Select all)', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.enter());
    act(() => result.current.toggle('x'));
    act(() => result.current.setSelection(['a', 'b', 'c']));
    expect(result.current.count).toBe(3);
    expect(result.current.isSelected('x')).toBe(false);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('exit() leaves selection mode and clears the set', () => {
    const { result } = renderHook(() => useBulkSelection());
    act(() => result.current.enter());
    act(() => result.current.setSelection(['a', 'b']));
    act(() => result.current.exit());
    expect(result.current.active).toBe(false);
    expect(result.current.count).toBe(0);
  });
});
