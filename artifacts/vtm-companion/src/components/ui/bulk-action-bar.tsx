import { ReactNode, useEffect, useState } from "react";
import { X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/*
 * Batch AB intentionally-deferred bulk follow-ups (kept out of scope here to
 * stay safe and reviewable; tracked for a later batch):
 *   1. Add a single-chronicle export.
 *   2. Add bulk character export.
 *   3. Add bulk chronicle export (once single-chronicle export exists and can
 *      be reused).
 *   4. Add bulk "Assign Chronicle" with a safe picker-modal flow.
 * Duplicate is also single-item only: a bulk duplicate would spawn many
 * "<name> Copy" items at once — cluttered and hard to predict — so it stays
 * out of the bulk bar.
 */

/**
 * Viewports that get the compact (single "Actions" dropdown) layout:
 *   - phone widths (below the md / tablet breakpoint), portrait or landscape
 *   - any short-landscape viewport (covers wide-but-short landscape phones)
 * Everything taller/wider (tablet, desktop) keeps the full button row.
 */
const COMPACT_QUERY = "(max-width: 767.98px), (orientation: landscape) and (max-height: 500px)";

/** True when the viewport should use the compact bulk layout. SSR/jsdom-safe:
 *  falls back to `false` (full layout) when `matchMedia` is unavailable. */
function useCompactLayout(): boolean {
  const getMatch = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(COMPACT_QUERY).matches
      : false;

  const [compact, setCompact] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(COMPACT_QUERY);
    const handler = () => setCompact(mql.matches);
    handler();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  return compact;
}

/** A single bulk action, rendered as a button (full bar) or menu item (compact). */
export interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Red styling for destructive actions (e.g. Delete). */
  destructive?: boolean;
}

interface BulkActionBarProps {
  /** Number of selected items (shown in the count label). */
  count: number;
  /** Localized "N selected" label (already interpolated by the caller). */
  selectedLabel: string;
  /** Cancel / exit selection mode. */
  onCancel: () => void;
  cancelLabel: string;
  /** Select-all (over the current filtered list). Optional. */
  onSelectAll?: () => void;
  selectAllLabel?: string;
  /** Bulk actions. Rendered as a wrapping button row on tablet/desktop and
   *  collapsed into a single "Actions" dropdown on phone-width / short
   *  viewports. */
  actions: BulkAction[];
  /** Localized label for the compact "Actions" dropdown trigger. */
  actionsMenuLabel: string;
}

/**
 * Floating bulk-action toolbar shared by the Characters and Chronicles lists.
 *
 * Rendered through `ModalPortal` so it escapes the `<main>` `z-10` stacking
 * context, and pinned just above the bottom nav (`bottom-16`, or `bottom-11`
 * in short-landscape) so it is never hidden behind it.
 *
 * Responsive behavior (driven by a media query, not CSS class precedence, so
 * width + height conditions compose predictably):
 *   - Tablet / desktop: actions render as a wrapping row of buttons.
 *   - Phone width OR short-landscape: the actions collapse into a single
 *     compact "Actions" dropdown, keeping the bar a single short line so it
 *     never covers the list. The dropdown opens upward (`side="top"`) and
 *     Radix caps it to the available height with scrolling, so it is never
 *     clipped by the nav or pushed off-screen.
 */
export function BulkActionBar({
  count,
  selectedLabel,
  onCancel,
  cancelLabel,
  onSelectAll,
  selectAllLabel,
  actions,
  actionsMenuLabel,
}: BulkActionBarProps) {
  const compact = useCompactLayout();
  const anyEnabled = actions.some(a => !a.disabled);

  return (
    <ModalPortal>
      <div
        role="toolbar"
        aria-label={selectedLabel}
        className="fixed inset-x-0 bottom-16 short-landscape:bottom-11 z-40 border-t border-zinc-700 bg-neutral-950/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
      >
        <div className="mx-auto max-w-5xl w-full px-4 short-landscape:px-3 py-2.5 short-landscape:py-1.5 max-h-[40vh] overflow-y-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              aria-label={cancelLabel}
              title={cancelLabel}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap" aria-live="polite">
              {selectedLabel}
            </span>
          </div>

          {onSelectAll && selectAllLabel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="h-8 text-xs shrink-0"
            >
              {selectAllLabel}
            </Button>
          )}

          {compact ? (
            /* Compact: a single "Actions" dropdown (phone / short viewports). */
            <div className="ml-auto shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!anyEnabled}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    {actionsMenuLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={8}
                  collisionPadding={8}
                  className="w-56 max-h-[60vh] overflow-y-auto overscroll-contain"
                >
                  {actions.map(action => (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onClick={action.onClick}
                      className={`gap-2 cursor-pointer ${action.destructive ? "text-red-400 focus:text-red-400 focus:bg-red-950/30" : ""}`}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Full: a wrapping row of action buttons (tablet / desktop). */
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {actions.map(action => (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={`h-8 gap-1.5 text-xs ${action.destructive ? "text-red-400 hover:text-red-300 border-red-900/40" : ""}`}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
