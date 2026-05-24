import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Render children at <body> via a React portal.
 *
 * # Why this exists
 *
 * The Layout's `<main>` element has `relative z-10`. That `z-10` is
 * required so the page content paints over the `body::before` noise
 * overlay (which uses `z-index: 0` on a `position: fixed` pseudo-
 * element). The side effect is that `<main>` forms its own stacking
 * context at z=10.
 *
 * Any modal nested *inside* `<main>` — for instance the chronicle
 * manage / session / location / relationship editors, or the
 * character assign-chronicle dialog — is therefore trapped inside that
 * z=10 context. Even if the modal sets `z-[70]` on itself, it is
 * compared against the Layout's sticky header (z=60) and the bottom
 * nav (z=50) at the *root* stacking context. main's z=10 loses to the
 * header's z=60, so the header paints on top of the modal — clipping
 * the title row and the close button. The bottom nav clips the
 * footer/action bar in the same way.
 *
 * On portrait mobile this never showed up because the modal overlays
 * already reserved `pt-20 pb-28` of empty space around the modal, so
 * the modal box itself sat inside the safe zone between header and
 * nav. In short-landscape (orientation: landscape AND max-height:
 * 500px) we collapsed that padding so the modal could use the full
 * viewport — at which point the stacking-context trap became visible.
 *
 * # The fix
 *
 * `createPortal(children, document.body)` renders the modal at the
 * body level, *outside* main entirely. Now the modal's `z-[70]` is
 * compared at the html root stacking context, where it correctly sits
 * above the header (z=60) and the bottom nav (z=50). No CSS hack on
 * `<main>` and no change to the noise overlay required.
 *
 * # Caveats
 *
 * - This is a thin pass-through. The caller is still responsible for
 *   `position: fixed`, the backdrop, z-index, and animations.
 * - We delay the portal until the component has mounted on the client.
 *   In a Vite SPA this is effectively a single extra render, never
 *   visible to the user. Without the guard, `document.body` would not
 *   exist during a server render and the build would crash; the
 *   guard keeps the component safe to use anywhere.
 * - Place this *inside* an `<AnimatePresence>` (next to the
 *   conditional flag) rather than wrapping the AnimatePresence with
 *   it — we want AnimatePresence to detect mount/unmount of the
 *   keyed portal child so route changes still tear modals down
 *   cleanly. Exit animations defined on a `motion.div` *inside* the
 *   portal may not play, because AnimatePresence only sees the
 *   ModalPortal element as its direct child; this is an acceptable
 *   trade-off compared to the clipping bug we're fixing.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}
