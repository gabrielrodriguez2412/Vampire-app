import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";

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
  /** Action buttons (caller-provided). Disabled by the caller when count === 0. */
  children: ReactNode;
}

/**
 * Floating bulk-action toolbar shared by the Characters and Chronicles lists.
 *
 * Rendered through `ModalPortal` so it escapes the `<main>` `z-10` stacking
 * context, and pinned just above the bottom nav (`bottom-16`, or `bottom-11`
 * in short-landscape) so it is never hidden behind it. Action buttons wrap on
 * narrow viewports instead of overflowing, and the toolbar caps its own height
 * with an internal scroll as a last resort on very short screens.
 */
export function BulkActionBar({
  count,
  selectedLabel,
  onCancel,
  cancelLabel,
  onSelectAll,
  selectAllLabel,
  children,
}: BulkActionBarProps) {
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
            <span className="text-sm font-medium text-foreground tabular-nums" aria-live="polite">
              {selectedLabel}
            </span>
          </div>

          {onSelectAll && selectAllLabel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="h-8 text-xs"
            >
              {selectAllLabel}
            </Button>
          )}

          {/* Action buttons, pushed to the right where space allows. */}
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            {children}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
