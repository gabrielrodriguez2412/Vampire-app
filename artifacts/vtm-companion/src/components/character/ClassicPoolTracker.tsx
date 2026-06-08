/**
 * Batch AN — visual pool tracker for V20 / classic Blood Pool and
 * Willpower.
 *
 * The classic character sheet stores both of these as a `{ current, max }`
 * object shape. They change a lot during play (spending Blood for
 * Disciplines / healing; spending Willpower for re-rolls), so they're
 * marked `gameplay: true` and stay editable in View Mode just like the
 * V5 Hunger drops and the classic Health tracker.
 *
 * This component swaps the plain `<input type="number">` for a row of
 * clickable cells:
 *   * Blood Pool   → filled red blood-drop SVGs (lucide Droplet).
 *   * Willpower    → square amber boxes that read as a check-off track,
 *                    matching the look of the pen-and-paper V20 sheet
 *                    Willpower row.
 *
 * Storage shape is preserved exactly: the parent reads `current` and
 * `max` and writes back `{ current: next, max }`. No schema change, no
 * migration.
 */
import { cn } from "@/lib/utils";
import { Droplet } from "lucide-react";

export type ClassicPoolKind = 'blood' | 'willpower';

export interface ClassicPoolTrackerProps {
  current: number;
  max: number;
  kind: ClassicPoolKind;
  /** When true, the cells render with no click / keyboard affordances.
   *  In practice both Blood Pool and Willpower are flagged `gameplay`
   *  in the schema, so DynamicSheet passes false for both edit and
   *  view modes — but the prop stays for symmetry with the other
   *  tracker components. */
  readonly?: boolean;
  onChange?: (next: number) => void;
  /** Accessible label (the row's title) — used to compose the
   *  group-level aria-label so screen readers read the numeric value
   *  even though the visible glyphs are cells. */
  label: string;
}

export function ClassicPoolTracker({
  current,
  max,
  kind,
  readonly = false,
  onChange,
  label,
}: ClassicPoolTrackerProps) {
  const safeMax = Math.max(0, Math.floor(max));
  const safeCurrent = Math.max(0, Math.min(safeMax, Math.floor(current)));
  const interactive = Boolean(onChange) && !readonly;

  // Click pattern matches DotRating + the Hunger blood drops: clicking
  // slot `i` sets the value to `i`, except clicking the slot that is
  // currently the active edge toggles it back down to `i - 1`. This is
  // what the rest of the sheet's clickable pool UIs already do, so
  // muscle memory carries over.
  const handleSet = (i: number) => {
    if (!interactive || !onChange) return;
    onChange(safeCurrent === i ? i - 1 : i);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSet(i);
    }
  };

  const groupTestId = kind === 'blood' ? 'blood-pool-tracker' : 'willpower-tracker';
  const cellTestIdPrefix = kind === 'blood' ? 'blood-pool-cell' : 'willpower-cell';

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="group"
      aria-label={`${label} ${safeCurrent} of ${safeMax}`}
      data-testid={groupTestId}
    >
      {Array.from({ length: safeMax }, (_, idx) => {
        const i = idx + 1;
        const filled = i <= safeCurrent;
        const commonProps = {
          onClick: () => handleSet(i),
          onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(i, e),
          role: interactive ? ('button' as const) : undefined,
          tabIndex: interactive ? 0 : undefined,
          'aria-pressed': interactive ? filled : undefined,
          'aria-label': `${label} ${i}`,
          'data-testid': `${cellTestIdPrefix}-${i}`,
          'data-state': filled ? ('filled' as const) : ('empty' as const),
        };
        if (kind === 'blood') {
          // Red blood-drop slot. Filled = a point of Blood Pool still
          // available; empty = a point already spent.
          return (
            <span
              key={i}
              {...commonProps}
              className={cn(
                "inline-flex items-center justify-center w-4 h-4 transition-colors",
                interactive ? "cursor-pointer hover:text-red-400" : "cursor-default",
                filled ? "text-red-500" : "text-zinc-700",
              )}
            >
              <Droplet
                aria-hidden
                className={cn("w-3.5 h-3.5", filled ? "fill-current" : "fill-transparent")}
              />
            </span>
          );
        }
        // Willpower square — classic V20 sheets draw these as small boxes
        // you check off as you spend a point. Filled = current temporary
        // Willpower available; outlined = spent.
        return (
          <span
            key={i}
            {...commonProps}
            className={cn(
              "inline-block w-4 h-4 rounded-sm border-2 transition-colors",
              interactive ? "cursor-pointer hover:border-primary" : "cursor-default",
              filled
                ? "bg-amber-400/70 border-amber-300"
                : "bg-transparent border-zinc-600",
            )}
          />
        );
      })}
      {/* Numeric "X / Y" readout keeps the exact value visible alongside
          the cells — the cells convey the shape at a glance, the readout
          covers the case where the user wants the precise number. */}
      <span
        className="ml-2 text-xs text-muted-foreground tabular-nums whitespace-nowrap"
        data-testid={`${groupTestId}-readout`}
      >
        {safeCurrent} / {safeMax}
      </span>
    </div>
  );
}
