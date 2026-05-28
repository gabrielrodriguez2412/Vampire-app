/**
 * @vitest-environment jsdom
 *
 * Batch Y — box-based health tracker for classic / WoD editions.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ClassicHealthTracker, CLASSIC_DAMAGE_MARKS } from '../ClassicHealthTracker';

afterEach(() => cleanup());

describe('ClassicHealthTracker', () => {
  it('renders one box per health level (max)', () => {
    const { container } = render(
      <ClassicHealthTracker bashing={0} lethal={0} aggravated={0} max={7} />
    );
    expect(container.querySelectorAll('.w-5.h-5').length).toBe(7);
  });

  it('renders damage marks most-severe-first (aggravated, lethal, bashing)', () => {
    const { container } = render(
      <ClassicHealthTracker bashing={1} lethal={1} aggravated={1} max={7} />
    );
    const boxes = Array.from(container.querySelectorAll('.w-5.h-5')).map(b => b.textContent);
    expect(boxes).toEqual([
      CLASSIC_DAMAGE_MARKS.aggravated,
      CLASSIC_DAMAGE_MARKS.lethal,
      CLASSIC_DAMAGE_MARKS.bashing,
      '', '', '', '',
    ]);
  });

  it('cycles an empty box to bashing on click', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClassicHealthTracker bashing={0} lethal={0} aggravated={0} max={7} onChange={onChange} />
    );
    fireEvent.click(container.querySelectorAll('.w-5.h-5')[0]);
    expect(onChange).toHaveBeenCalledWith({ bashing: 1, lethal: 0, aggravated: 0 });
  });

  it('cycles bashing -> lethal on click', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClassicHealthTracker bashing={1} lethal={0} aggravated={0} max={7} onChange={onChange} />
    );
    // The single bashing box is the first filled box.
    fireEvent.click(container.querySelectorAll('.w-5.h-5')[0]);
    expect(onChange).toHaveBeenCalledWith({ bashing: 0, lethal: 1, aggravated: 0 });
  });

  it('cycles lethal -> aggravated on click', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClassicHealthTracker bashing={0} lethal={1} aggravated={0} max={7} onChange={onChange} />
    );
    fireEvent.click(container.querySelectorAll('.w-5.h-5')[0]);
    expect(onChange).toHaveBeenCalledWith({ bashing: 0, lethal: 0, aggravated: 1 });
  });

  it('cycles aggravated -> empty on click', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClassicHealthTracker bashing={0} lethal={0} aggravated={1} max={7} onChange={onChange} />
    );
    fireEvent.click(container.querySelectorAll('.w-5.h-5')[0]);
    expect(onChange).toHaveBeenCalledWith({ bashing: 0, lethal: 0, aggravated: 0 });
  });

  it('does not call onChange when readonly', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClassicHealthTracker bashing={0} lethal={0} aggravated={0} max={7} onChange={onChange} readonly />
    );
    fireEvent.click(container.querySelectorAll('.w-5.h-5')[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies localized tooltips to filled boxes', () => {
    const { container } = render(
      <ClassicHealthTracker
        bashing={1}
        lethal={0}
        aggravated={0}
        max={7}
        labels={{ bashing: 'Contundente', lethal: 'Letal', aggravated: 'Agravado' }}
      />
    );
    const filled = container.querySelector('.w-5.h-5');
    expect(filled?.getAttribute('title')).toBe('Contundente');
  });
});
