import { cn } from "@/lib/utils";

interface DamageTrackerProps {
  damage: number;
  aggravated: number;
  max: number;
  onChange?: (val: { damage: number, aggravated: number }) => void;
  className?: string;
  readonly?: boolean;
}

export function DamageTracker({ damage, aggravated, max, onChange, className, readonly = false }: DamageTrackerProps) {
  
  const handleBoxClick = (index: number) => {
    if (readonly || !onChange) return;
    
    // Cycle: empty -> superficial (/) -> aggravated (X) -> empty
    let boxState = 0; 
    if (index < aggravated) boxState = 2;
    else if (index < aggravated + damage) boxState = 1;

    let newAgg = aggravated;
    let newDam = damage;

    if (boxState === 0) {
      newDam += 1;
    } else if (boxState === 1) {
      newDam -= 1;
      newAgg += 1;
    } else if (boxState === 2) {
      newAgg -= 1;
    }

    // Constrain total
    if (newAgg + newDam > max) {
      if (newDam > 0) newDam -= 1;
      else newAgg -= 1;
    }

    onChange({ damage: newDam, aggravated: newAgg });
  };

  const boxes = [];
  for (let i = 0; i < max; i++) {
    let content = "";
    if (i < aggravated) content = "X";
    else if (i < aggravated + damage) content = "/";
    boxes.push(content);
  }

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {boxes.map((content, i) => (
        <div
          key={i}
          onClick={() => handleBoxClick(i)}
          className={cn(
            "w-5 h-5 border border-zinc-500 flex items-center justify-center text-xs font-bold text-primary transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:border-primary",
            content !== "" ? "bg-black" : "bg-transparent"
          )}
        >
          {content}
        </div>
      ))}
    </div>
  );
}
