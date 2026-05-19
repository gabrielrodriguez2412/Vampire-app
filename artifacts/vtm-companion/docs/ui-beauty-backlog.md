# Global UI / Beauty Backlog

Snapshot date: 2026-05-19

This is a developer-facing checklist of known visual and UX polish issues
that should be handled later in a dedicated **global UI / beauty pass**.
It is not a feature list and is not user-facing.

Everything in this document is **deferred work**. The app is currently
considered stable enough to ship — the items below are quality polish,
not blockers. Items should be tackled in their own focused pass(es)
rather than slipped into unrelated checkpoints.

---

## 1. Purpose

- Capture polish opportunities in one place so they are not lost between
  feature/stabilization checkpoints.
- Keep the day-to-day stabilization passes scope-tight: contributors
  should resist the urge to "just clean this up" mid-bugfix and instead
  add to this backlog.
- Give a future UI pass a ready-made, prioritized punch list so it can
  start without re-discovering everything.
- Make it explicit what is **out of scope** for a beauty pass, so we
  don't accidentally regress storage, data, or working flows in the
  name of "polish."

---

## 2. Priority levels

Each backlog item is tagged with one of three priorities:

- **P1 — High.** Most visible to first-time users, or the screen feels
  noticeably unfinished. Should be addressed in the first beauty pass.
- **P2 — Medium.** Noticeable on close inspection or in specific
  viewports. Should land in the same pass if scope allows, otherwise
  the next.
- **P3 — Low / nice-to-have.** Small refinements, micro-interactions,
  thematic flourishes. Safe to defer indefinitely.

Rule of thumb: a single beauty pass should pick **one or two P1
screens** and stop there. Bundling everything into one giant PR is how
polish passes turn into risky redesigns.

---

## 3. High-priority visual polish (P1)

These are the items that most visibly hold the app back from feeling
premium.

- **Home page overall feel.** Still reads as clunky in places. Sections
  don't share a consistent rhythm; the hero/continue area, quick
  actions, recents columns, clan strip, and bento grid each have their
  own padding and border treatment. Goal: a single visual language.
- **Home clan preview / carousel.** Functional but visually plain. The
  cards are uniform rectangles with the same image treatment; nothing
  signals "featured." Needs a more premium treatment (e.g. larger lead
  card, refined hover state, better gradient overlays, more deliberate
  spacing).
- **Clan card scrolling affordance.** The strip is horizontally
  scrollable but doesn't strongly indicate more clans exist past the
  edge. Current fades + desktop chevrons help but don't read clearly on
  touch viewports. Consider a peek/half-card on the right edge, a
  pagination/dot indicator, or a subtle "13 clans →" counter.
- **Chronicle Manage modal/card layout.** Works, but feels cramped and
  not premium. Tab strip, overview stats, and inner sections all use
  the same flat zinc-on-zinc treatment; nothing breathes. Goal: better
  spacing, clearer section hierarchy, calmer empty regions.
- **Character sheet visual treatment.** Usable but visually plain.
  Attribute/skill grids are dense and uniform; nothing draws the eye to
  what matters (clan, blood potency, health/willpower). Header is
  polished — body still feels like a form.

---

## 4. Medium-priority visual polish (P2)

- **Chronicle tabs/content responsiveness.** The Overview / Characters
  / Sessions / Locations / Relationships tabs work, but the inner
  layouts don't all reflow gracefully between mobile, tablet, and
  desktop. Some tab bodies have desktop-grid layouts that collapse to a
  long vertical list with no intermediate breakpoint.
- **Inventory View Mode.** The edit mode is specialized and polished.
  View mode is functional but flatter — grouping headers, item rows,
  and totals could use a more premium read-only treatment.
- **Clan detail pages.** Hero/title block is workable but not refined.
  The clan name, banner image, and discipline pills don't compose into
  a single confident header. Consider a taller hero, a layered image
  treatment, and a clearer breadcrumb back to the clan list.
- **Rules quick-reference pages.** Phase 1 works and is searchable, but
  visual density is high and category navigation could be more
  inviting. Edition-specific layout/copy review is also pending — some
  rules read identically across editions when they shouldn't, and
  vice-versa.
- **Global section headers.** `<h1>` / `<h2>` / section labels each
  appear in 2–3 different sizes, weights, and tracking treatments
  across pages. Standardize to a small set (e.g. page title, section
  title, subsection label) and apply consistently.
- **Bottom navigation polish.** Mobile bottom nav functions correctly
  but the active state, icon weights, and label tracking could be
  tightened. Active-item drop-shadow currently reads "glowy" rather
  than "considered."
- **Native scrollbars and horizontal carousels.** Some scrollers (e.g.
  the home clan strip) hide the native scrollbar via Tailwind
  utilities. Others (chronicle inner tabs, certain modal bodies) leave
  the native scrollbar visible. Pick one approach and apply it
  consistently — and where the scrollbar is hidden, ensure the
  affordance is preserved by other means (fades, chevrons, peeks).
- **Empty states.** Currently functional (italic gray "No characters
  yet.") but unatmospheric. The app's theme rewards a small flavor
  line + a clear next-step CTA. Standardize an `<EmptyState />`
  treatment.
- **Modal spacing and footer behavior.** Several modals (chronicle
  assign, delete confirms, session editor, location editor) each pad
  and align their footers slightly differently. Standardize header /
  body / footer regions and button alignment.
- **Button hierarchy.** Primary / secondary / destructive / ghost
  buttons are used inconsistently across pages — some destructive
  actions are styled as primary, some primaries are styled as ghost
  links. Pick a clear hierarchy and audit usage.

---

## 5. Low-priority / nice-to-have (P3)

- **Thematic quote / flavor lines** on major screens. Home already has
  one quote in the footer; consider tasteful additions on Chronicle,
  Character, and Compendium landings. Keep them short and original to
  avoid copyright concerns.
- **General background/texture treatment.** The app is uniformly flat
  near-black. A very subtle parchment/grit/noise texture or vignette
  could add atmosphere without hurting legibility. Must be opt-in via
  CSS, not via images that bloat the bundle.
- **Section spacing rhythm.** Some screens feel too airy in the top
  third and too cramped at the bottom (or vice-versa). A spacing audit
  using a consistent vertical scale would normalize this.
- **Hover/focus micro-interactions.** Most controls have a hover state;
  fewer have a considered focus-visible style. A small pass on
  `:focus-visible` outlines (keyboard users) would help accessibility
  and polish at once.
- **Loading / skeleton states.** Most lists load synchronously from
  localStorage, so this is not urgent, but if any view ever does async
  work it should show a skeleton, not a flash of empty state.
- **Iconography sweep.** Mix of `material-symbols-outlined` and
  `lucide-react`. Both look fine, but choosing one as primary and
  using the other only where it has a strictly better glyph would
  tighten the visual language.

---

## 6. Screen-by-screen backlog

### Home dashboard
- P1 Hero/continue card + quick actions feel like two unrelated
  components; align border, padding, and corner radius.
- P1 Clan strip — see "Home clan preview / carousel" above.
- P2 Recents columns are visually identical regardless of content; an
  empty column reads almost the same as a full one. Consider a clearer
  "nothing here yet" treatment.
- P2 Bento "Dark Protocols" grid — tiles are different heights/widths
  but the typography inside each tile doesn't acknowledge that. The
  large tile should have a more prominent title.
- P3 Footer quote could rotate from a small curated set instead of
  being a single fixed string.

### Compendium landing
- P2 Six category cards are uniform; consider a leading "featured"
  card (Clans, say) that's larger than the rest.
- P2 Card descriptions are short and uneven in length across
  languages, causing inconsistent card heights — pin to a min-height
  or truncate to N lines.

### Clan list (`/compendium/clanes`)
- P2 Edition `<select>` in the header looks like a stock browser
  control. Replace with the styled select used elsewhere in the app.
- P2 Grid is purely uniform 3-up — no rhythm. Could use occasional
  feature cards or section dividers ("Camarilla / Sabbat /
  Independent / Anarch" etc., if data supports it).
- P3 Banner-image opacity + grayscale is the same on every card;
  consider a hover treatment that restores color.

### Clan detail
- P1 Hero/title block — see P1 list.
- P2 Discipline pills could become a more meaningful row (icon +
  short tooltip) instead of plain badges.
- P2 Long body sections currently stack with no visual break;
  consider section dividers or numbered headers.

### Disciplines list / detail
- P2 Accordion items look identical regardless of clan / discipline
  type; a small color or icon cue per discipline family would help
  scanning.
- P2 Deep-link scroll behavior works (already audited) but the
  highlight on the opened card is subtle; a brief flash/glow on
  arrival would confirm to users that the right item was opened.

### Rules / quick-reference
- P2 Category sidebar (or top scroller on mobile) is plain. Consider
  per-category icons and a clearer active state.
- P2 Rule cards are dense; consider a more open, magazine-style
  layout for the long rules.

### Character list (`/personaje`)
- P2 Sort/filter controls are stacked plainly across the top.
  Consider a collapsible "Filters" group on mobile.
- P2 Character cards mix avatar/clan icon, clan name, edition pill,
  type badge — the visual hierarchy of these is unclear and varies
  card to card.

### Character sheet view + edit
- P1 Overall sheet aesthetic — see P1 list.
- P2 Tracker bars (health/willpower/hunger/humanity) and dot ratings
  share the page but use different visual languages; pick one and
  apply consistently.
- P2 Section headers ("Attributes", "Skills", "Disciplines"…) all
  look the same weight; the most-glanced sections deserve more
  prominence.
- P3 Subtle parchment/edge treatment around the sheet container
  would lean into the theme.

### Character inventory
- P2 View mode visual treatment — see P2 list.
- P3 Empty inventory state could show a faint "nothing carried"
  silhouette instead of plain text.

### Character print preview
- P2 Print is fixed and compact; on-screen preview controls
  (paper size, columns) could be tidier.

### Chronicle list
- P2 Cards are polished but the empty-state (no chronicles yet) is
  bare; consider a guided "create your first chronicle" treatment.

### Chronicle Manage modal
- P1 Overall cramped feel — see P1 list.
- P2 Tab strip is horizontally scrollable on narrow screens but the
  scroll affordance is weak.
- P2 Inside each tab, action buttons (Add session, Add location…) all
  sit in slightly different positions; align to a shared toolbar slot.

### Settings
- P3 Page is mostly form rows; could use small section icons and a
  calmer background.

### Search dialog + Search page
- P3 Search result rows are uniform regardless of result type
  (clan/discipline/rule/glossary); a more distinct type pill or color
  cue would help scanning.

### Favorites, Notes, Glossary, Roleplay, Tools
- P3 These pages are functional but plain; defer until the major
  screens above are addressed. Tools page in particular has visible
  hardcoded-Spanish strings noted during the last stabilization pass
  (logged separately — not a beauty issue, an i18n bug).

---

## 7. Mobile / tablet follow-ups

The dedicated mobile/tablet layout pass shipped and is stable. The
items below are **follow-up polish**, not regressions.

- **Bottom nav final pass.** Active state, icon weights, label
  tracking, and tap target padding could be tightened. Ensure the
  active-item drop-shadow doesn't bleed into adjacent items on small
  screens.
- **Bottom nav vs. modal footers.** Confirm long modal footers
  (chronicle session editor, character sheet save bar) never get
  obscured by the fixed bottom nav at narrow widths.
- **Tablet (768–1024 px) layouts.** Several screens jump straight from
  mobile-stack to desktop-grid; a tablet-specific 2-column intermediate
  would feel less abrupt.
- **Horizontal carousels on touch.** Home clan strip works, but other
  carousels (chronicle tabs, discipline accordions on narrow widths)
  could benefit from the same snap/peek treatment.
- **Top bar density on mobile.** The header is fine but the language /
  edition selectors are only revealed in the slide-down menu, which
  is fine — just confirm there's no easier-to-discover surface needed.

---

## 8. Do-not-fix-now notes (out of scope for the beauty pass)

When the beauty pass is scheduled, the following are explicitly **out
of scope**. Resist the urge to bundle them in.

- **No storage schema changes.** `localStorage` shapes for characters,
  chronicles, sessions, locations, relationships, and the v2 backup
  envelope are stable. Beauty work must not require migrations.
- **No feature creep.** "While I'm in here…" new features (new tabs,
  new flows, new data fields) belong in a feature checkpoint, not a
  polish checkpoint.
- **No backend / auth / database changes.** The app remains
  local-first. Don't introduce server calls in the name of polish.
- **No backup / import / export behavior changes.** The v2 envelope
  and ID remapping logic are stable. Beauty work touches presentation,
  not the data path.
- **No copyrighted text expansion.** Clan / discipline / rules content
  was deliberately written as short original paraphrases to avoid
  copying official book text. Visual polish must not become an excuse
  to import larger blocks of source material.
- **No risky redesigns of working flows.** Character create, character
  sheet editing, chronicle management, backup/restore, and print are
  all working. A polish pass refines the surface; it does not redo the
  flow.
- **No mass refactors.** Don't rename routes, restructure folders, or
  rewrite components from class to functional / styled to Tailwind
  during a polish pass.
- **No content rewrites.** Clan/discipline/rules copy was reviewed
  separately. The beauty pass refines layout and typography around
  that copy, not the copy itself.

---

## 9. Suggested future UI pass order

A single beauty pass should pick the next item from this ordered list,
finish it cleanly, ship it, then stop. Stack-ranked by visibility and
expected effort/payoff:

1. **Chronicle Manage modal polish.** Highest density of "looks
   cramped" feedback; well-scoped surface; no data risk.
2. **Home visual polish.** Most-seen screen; cohesion fixes between
   hero, recents, clan strip, and bento grid.
3. **Character sheet visual polish.** Highest-time-on-screen for
   active users; biggest perceived-quality lift.
4. **Clan detail and clan card polish.** Hero/title refinement plus
   carousel/list treatment together — they share the same components.
5. **Rules quick-reference polish.** Density and category nav; pair
   with an edition-specific copy review as a separate item.
6. **Bottom nav / global controls polish.** Smallest scope, highest
   reach — schedule last so it benefits from any new design tokens
   introduced in passes 1–5.

Each pass should:
- Be its own PR.
- Touch only the screens listed for that pass.
- Avoid changes to data, storage, routes, or shared services.
- Update this document — moving completed items to a "Completed"
  appendix at the bottom so the backlog stays honest.
