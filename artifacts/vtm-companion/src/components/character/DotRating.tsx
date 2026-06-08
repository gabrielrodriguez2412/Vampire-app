import { cn } from "@/lib/utils";
import { Droplet } from "lucide-react";

interface DotRatingProps {
  value: number;
  max?: number;
  min?: number;
  onChange?: (val: number) => void;
  className?: string;
  readonly?: boolean;
  /**
   * Batch AM — visual shape per slot.
   *   * 'dot'  (default) → the original round-pip dot used by every
   *                       attribute, skill, virtue, discipline, etc.
   *   * 'drop' → a blood-drop SVG used by V5 Hunger. Filled drops use
   *                       the red Hunger tint and outlined drops use the
   *                       same muted zinc the dot variant uses for empty
   *                       slots, so the row's information density stays
   *                       identical — only the silhouette changes.
   * Defaults to 'dot' so every existing caller is byte-identical.
   */
  shape?: 'dot' | 'drop';
  /**
   * Batch AM — accessible-only label describing what this rating measures
   * (e.g. "Hunger"). When supplied, the rating element becomes a labelled
   * group with `role="group"` and `aria-label="${ariaLabel} ${value} of
   * ${max}"`, so screen readers still hear the underlying numeric value
   * even though the visible silhouette is now a drop.
   */
  ariaLabel?: string;
}

export function DotRating({
  value,
  max = 5,
  min = 0,
  onChange,
  className,
  readonly = false,
  shape = 'dot',
  ariaLabel,
}: DotRatingProps) {
  const dots = [];
  for (let i = 1; i <= max; i++) {
    dots.push(i);
  }

  const handleClick = (i: number) => {
    if (readonly || !onChange) return;
    // If clicking the current value, and min allows it, toggle it off (like going from 1 to 0)
    if (value === i && min < i) {
      onChange(i - 1);
    } else if (i >= min) {
      onChange(i);
    }
  };

  // Batch AM — accessibility: when an ariaLabel is provided, group the
  // slots and announce the current value alongside the max so the rating
  // is reachable to screen readers no matter which shape is rendered.
  const groupProps = ariaLabel
    ? { role: 'group' as const, 'aria-label': `${ariaLabel} ${value} of ${max}` }
    : {};

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      {...groupProps}
    >
      {dots.map(i => {
        const active = i <= value;
        if (shape === 'drop') {
          // V5 Hunger blood-drop slot. Uses lucide's `Droplet` SVG so the
          // shape stays crisp on every viewport without bundling a custom
          // asset. Filled drops carry the same red tint the dot variant
          // already used via the `text-red-500` className override, so the
          // existing color customisation in DynamicSheet still applies.
          return (
            <span
              key={i}
              onClick={() => handleClick(i)}
              role={onChange && !readonly ? 'button' : undefined}
              tabIndex={onChange && !readonly ? 0 : undefined}
              onKeyDown={e => {
                if (readonly || !onChange) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(i);
                }
              }}
              aria-pressed={onChange && !readonly ? active : undefined}
              aria-label={ariaLabel ? `${ariaLabel} ${i}` : `${i}`}
              data-testid={`hunger-drop-${i}`}
              data-state={active ? 'filled' : 'empty'}
              className={cn(
                "inline-flex items-center justify-center w-4 h-4 transition-colors",
                readonly ? "cursor-default" : "cursor-pointer hover:text-primary",
                active ? "text-current" : "text-zinc-600",
              )}
            >
              <Droplet
                aria-hidden
                className={cn(
                  "w-3.5 h-3.5",
                  active ? "fill-current" : "fill-transparent",
                )}
              />
            </span>
          );
        }
        // Default 'dot' variant — unchanged from the original component so
        // every existing caller (attributes, skills, virtues, disciplines)
        // renders byte-identically.
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "w-3 h-3 rounded-full border transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:border-primary",
              active ? "bg-primary border-primary" : "bg-transparent border-zinc-600"
            )}
          />
        );
      })}
    </div>
  );
}
