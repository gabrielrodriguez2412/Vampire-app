import { useCallback, useMemo, useState } from 'react';

/**
 * Reusable bulk-selection state for list pages (Characters, Chronicles).
 *
 * Holds a "selection mode" flag plus the set of selected item ids. Pure UI
 * state — it never touches storage. Callers wire the returned helpers to a
 * "Select" toggle, per-card checkboxes, and a bulk action bar.
 *
 * `exit()` both leaves selection mode and clears the set, so it doubles as
 * the "Cancel" handler and the post-action cleanup ("Selection should clear
 * after completing a bulk action").
 */
export interface BulkSelection {
  /** Whether selection mode is active (cards show checkboxes, cards select on click). */
  active: boolean;
  /** Ids currently selected. */
  selectedIds: ReadonlySet<string>;
  /** Number of selected ids. */
  count: number;
  isSelected: (id: string) => boolean;
  /** Toggle a single id's membership (no-op when not in selection mode is NOT enforced here). */
  toggle: (id: string) => void;
  /** Replace the selection with exactly these ids (used by "Select all" over the filtered list). */
  setSelection: (ids: string[]) => void;
  /** Enter selection mode (selection starts empty). */
  enter: () => void;
  /** Leave selection mode and clear the selection. */
  exit: () => void;
}

export function useBulkSelection(): BulkSelection {
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const enter = useCallback(() => {
    setActive(true);
    setSelectedIds(new Set());
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return useMemo(
    () => ({
      active,
      selectedIds,
      count: selectedIds.size,
      isSelected,
      toggle,
      setSelection,
      enter,
      exit,
    }),
    [active, selectedIds, isSelected, toggle, setSelection, enter, exit]
  );
}
