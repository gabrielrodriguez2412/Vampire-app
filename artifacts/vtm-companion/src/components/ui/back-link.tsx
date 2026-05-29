import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  /** Destination route (e.g. "/compendium"). */
  to: string;
  /** Localized label (e.g. "Back to Compendium"). Also used as the aria-label. */
  label: string;
  className?: string;
}

/**
 * Small inline "back" navigation control. Visual style mirrors the clan
 * detail "Back to Clans" pill (ChevronLeft + uppercase tracked label in a
 * bordered chip) but laid out inline in a page header rather than overlaid on
 * a modal hero. Renders a real anchor via wouter's `Link` so it has an
 * `href` and works as expected across desktop and phone (portrait/landscape).
 */
export function BackLink({ to, label, className }: BackLinkProps) {
  return (
    <Link
      href={to}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 short-landscape:gap-1 h-8 short-landscape:h-7 px-2.5 short-landscape:px-2 rounded-md border border-zinc-700/60 bg-black/30 hover:bg-black/50 text-xs short-landscape:text-[10px] uppercase tracking-widest text-zinc-300 hover:text-on-surface transition-colors",
        className
      )}
    >
      <ChevronLeft className="w-4 h-4 short-landscape:w-3.5 short-landscape:h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
