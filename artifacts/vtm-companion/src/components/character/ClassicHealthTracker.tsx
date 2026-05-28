import { cn } from "@/lib/utils";

/** Box glyphs for each classic (WoD) damage type. */
export const CLASSIC_DAMAGE_MARKS = {
  bashing: "/",
  lethal: "X",
  aggravated: "✱",
} as const;

interface ClassicHealthTrackerProps {
  bashing: number;
  lethal: number;
  aggravated: number;
  max: number;
  onChange?: (val: { bashing: number; lethal: number; aggravated: number }) => void;
  className?: string;
  readonly?: boolean;
  /** Optional localized tooltips, keyed by damage type. */
  labels?: { bashing?: string; lethal?: string; aggravated?: string };
}

/**
 * Box-based health tracker for classic / World-of-Darkness editions.
 *
 * Mirrors the V5 `DamageTracker` visual style but models the three classic
 * damage types. Boxes are filled most-severe-first (aggravated, then lethal,
 * then bashing) and each click advances a box through the edition-appropriate
 * cycle: empty → bashing (/) → lethal (X) → aggravated (✱) → empty.
 */
export function ClassicHealthTracker({
  bashing,
  lethal,
  aggravated,
  max,
  onChange,
  className,
  readonly = false,
  labels,
}: ClassicHealthTrackerProps) {
  const handleBoxClick = (index: number) => {
    if (readonly || !onChange) return;

    // Determine the box's current state from its position in the
    // severity-ordered fill (aggravated first, then lethal, then bashing).
    let state = 0; // 0 empty, 1 bashing, 2 lethal, 3 aggravated
    if (index < aggravated) state = 3;
    else if (index < aggravated + lethal) state = 2;
    else if (index < aggravated + lethal + bashing) state = 1;

    let b = bashing;
    let l = lethal;
    let a = aggravated;

    if (state === 0) b += 1;            // empty -> bashing
    else if (state === 1) { b -= 1; l += 1; } // bashing -> lethal
    else if (state === 2) { l -= 1; a += 1; } // lethal -> aggravated
    else if (state === 3) a -= 1;       // aggravated -> empty

    // Never exceed the track length; trim least-severe first.
    if (b + l + a > max) {
      if (b > 0) b -= 1;
      else if (l > 0) l -= 1;
      else a -= 1;
    }

    onChange({ bashing: b, lethal: l, aggravated: a });
  };

  const boxes: { content: string; title?: string }[] = [];
  for (let i = 0; i < max; i++) {
    if (i < aggravated) {
      boxes.push({ content: CLASSIC_DAMAGE_MARKS.aggravated, title: labels?.aggravated });
    } else if (i < aggravated + lethal) {
      boxes.push({ content: CLASSIC_DAMAGE_MARKS.lethal, title: labels?.lethal });
    } else if (i < aggravated + lethal + bashing) {
      boxes.push({ content: CLASSIC_DAMAGE_MARKS.bashing, title: labels?.bashing });
    } else {
      boxes.push({ content: "" });
    }
  }

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {boxes.map((box, i) => (
        <div
          key={i}
          onClick={() => handleBoxClick(i)}
          title={box.title}
          className={cn(
            "w-5 h-5 border border-zinc-500 flex items-center justify-center text-xs font-bold text-primary transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:border-primary",
            box.content !== "" ? "bg-black" : "bg-transparent"
          )}
        >
          {box.content}
        </div>
      ))}
    </div>
  );
}
