import { cn } from "@/lib/utils";

interface DotRatingProps {
  value: number;
  max?: number;
  min?: number;
  onChange?: (val: number) => void;
  className?: string;
  readonly?: boolean;
}

export function DotRating({ value, max = 5, min = 0, onChange, className, readonly = false }: DotRatingProps) {
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

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {dots.map(i => (
        <div
          key={i}
          onClick={() => handleClick(i)}
          className={cn(
            "w-3 h-3 rounded-full border transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:border-primary",
            i <= value ? "bg-primary border-primary" : "bg-transparent border-zinc-600"
          )}
        />
      ))}
    </div>
  );
}
