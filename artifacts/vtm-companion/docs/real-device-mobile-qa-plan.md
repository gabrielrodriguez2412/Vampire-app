# Real-Device Mobile QA Plan

A practical checklist for testing VTM Companion on real mobile hardware
before the next round of PWA / offline / Android packaging work. The plan
exists so anyone running QA hits the same surfaces in the same order and
files bugs the same way.

It is intentionally a manual checklist, not an automated suite — the
issues we want to catch (clipped buttons, file-picker quirks, scoped
storage surprises) are exactly the ones that hide from `jsdom` and a
desktop browser's responsive mode.

Companion docs to read alongside this one:
- [`mobile-app-readiness.md`](./mobile-app-readiness.md) — PWA status.
- [`android-packaging-plan.md`](./android-packaging-plan.md) — TWA /
  Capacitor decision tree.
- [`offline-data-safety-plan.md`](./offline-data-safety-plan.md) —
  service-worker strategy.
- [`privacy-legal-disclaimer-plan.md`](./privacy-legal-disclaimer-plan.md)
  — privacy posture + Play Store disclosures.

---

## 1. Why this exists (purpose)

Desktop responsive mode and Chrome DevTools' device emulation are
**not** a substitute for a real phone. They mis-represent at least:

- **Touch precision and target hit-areas.** A button that looks
  comfortable in a mouse test can be borderline-unreachable when a
  thumb is involved.
- **On-screen keyboard.** Emulators don't show the system IME
  appearing and covering inputs / shifting the layout.
- **Real viewport math.** Address-bar collapse / safe-area insets /
  notches behave differently in a real browser.
- **Scoped storage / file picker on Android.** Chrome / Android
  WebView return content URIs, may silently truncate large files, and
  sometimes refuse to re-select the same file.
- **Installed-PWA lifecycle.** Standalone launches use a different
  storage path on iOS and have their own update / eviction story.
- **System share sheet, Download notification, Files app.**
  Browser-only testing never reaches any of them.

Catching these on a real device early is much cheaper than catching
them after wrapping the app in a TWA or Capacitor shell.

## 2. Test devices / environments

At minimum:

- **Android phone, Chrome.** The realistic primary mobile browser.
- **Installed PWA** of the deployed app via Chrome's "Install app" /
  "Add to Home Screen". Test as a standalone launcher entry, not as a
  browser tab.

Strongly recommended if available:

- **Android tablet** (or Android tablet emulator if no hardware) — for
  the `md:` breakpoint paths that the phone never hits.
- **Low-end device** (≤ 4 GB RAM, slow Snapdragon / Helio) — exposes
  jank in animations and lag in long lists that high-end devices hide.
- **Portrait and landscape** on both phone and tablet for the screens
  that don't lock orientation.

Optional, useful for parity but not blocking:

- **iOS Safari** + iOS standalone-PWA. iOS has different storage
  durability and apple-touch-icon behavior; worth a smoke test even
  though the Play Store path is Android-only.

## 3. Pre-test setup

Once per QA session:

1. **Deploy latest `main`** to the staging / production URL (Railway
   frontend service).
2. **Open the deployed URL on the device** in Chrome. Confirm it
   loads, the icon appears in the tab, and the page is reachable from
   `Home`.
3. **Install as a PWA** via Chrome's three-dot menu → "Install app"
   (or "Add to Home Screen"). The shortcut should land on the device
   home screen with the gothic book icon.
4. **Seed sample data**. Either:
   - Use the app to create 1–2 characters, 1 chronicle, 1 session,
     1 location, 1 relationship, and at least one journal note; **or**
   - Import a known-good full backup JSON exported from desktop.
5. **Have a fresh backup file ready** for the backup/import section
   below. The simplest way: export it from desktop right before the
   test.

## 4. Core smoke test

Run on first launch after install and after any restart.

- [ ] App opens to Home without a crash or blank screen.
- [ ] Home tiles render (Recent characters, Recent chronicles, Quick
      actions, Compendium tiles).
- [ ] Bottom nav bar visible at the bottom; all five tabs respond.
- [ ] Sidebar / hamburger menu opens; all entries route correctly.
- [ ] Language switch (Settings → App Preferences) updates the UI
      everywhere on next render.
- [ ] Edition switch updates the UI (e.g. Rules list filters; Tools
      flips between V5 and Classic rollers).
- [ ] Settings page opens and scrolls cleanly.
- [ ] Address bar / browser chrome behaves: in PWA standalone it
      should be absent; in browser tab it should auto-hide on scroll.

## 5. Character workflow

- [ ] Create a new character (both V5 and a classic edition if time
      permits).
- [ ] Open the character sheet; every section renders without overflow.
- [ ] Switch into edit mode; on-screen keyboard appears for text
      inputs without covering the field being edited.
- [ ] Inventory: add an item, edit it, delete it. Confirm category
      pickers and quantity controls work with thumbs.
- [ ] Journal: add a note (title + body), switch category, edit it,
      delete it. Confirm the note shows up in Global Search.
- [ ] Print / PDF action (if surfaced on mobile): triggers the print
      dialog without breaking the layout.
- [ ] Character ↔ Chronicle link: assign the character to a chronicle
      from the character page; confirm the chronicle shows the
      character as linked.
- [ ] Global Search: search by character name and by journal note
      content; tapping a result opens the right screen.

## 6. Chronicle workflow

- [ ] Create a new chronicle.
- [ ] Link a character to it (from chronicle manage modal).
- [ ] Create a session; tag at least one character.
- [ ] Create a location; link at least one character.
- [ ] Create a relationship; pick a source character + target
      character + relationship type.
- [ ] Confirm tagged / linked character **names** render (no
      "Unknown character" chips).
- [ ] Open the chronicle from Favorites (if favorited) and from
      Global Search — both should land on the manage modal with the
      right tab.
- [ ] Open a session from Search — should land on the chronicle's
      Sessions tab.

## 7. Backup / import / export

This is the highest-risk surface on Android because of scoped storage.

- [ ] **Export Full Backup** from Settings → Local Data. The toast
      should display the suggested filename
      (`vtm-companion-backup-YYYY-MM-DD.json`).
- [ ] The browser should drop the file in the device's Downloads
      folder (or whatever the user's download target is).
- [ ] Open the Files / Downloads app and confirm the JSON exists and
      has non-zero size.
- [ ] **Import Full Backup**: pick the same file via the file picker.
      Confirm:
  - [ ] The success toast lists counts (characters, chronicles,
        sessions, locations, relationships, "X renamed" if any).
  - [ ] Import is additive — no existing records were deleted.
  - [ ] Imported characters reference the imported chronicle (open
        the chronicle's Characters tab and confirm).
  - [ ] Imported session **taggedCharacterIds** resolve to character
        names (no "Unknown character" chip).
  - [ ] Imported location **linkedCharacterIds** resolve to names.
  - [ ] Imported relationship source / target both resolve to names.
  - [ ] Imported journal notes are present on the character sheet
        and findable via Global Search.
- [ ] Try selecting the same file twice in a row — Android sometimes
      blocks re-selection. The picker should still open and the file
      should still parse.
- [ ] Try importing a deliberately invalid file (a random `.txt`).
      The failure toast should read "isn't a valid VTM Companion
      backup. Pick a .json file you exported from this app." — not a
      JSON parse stack trace.
- [ ] Try importing a v1 (character-only) backup if one exists in the
      archive — the legacy import path should still work.

## 8. Rules / Compendium / Tools

- [ ] Compendium hub loads; each tile routes correctly.
- [ ] Clans: list scrolls, clan detail opens; clan PNG art loads.
- [ ] Disciplines: list opens, discipline deep link via path
      (`/compendium/disciplinas/:id`) opens that discipline directly.
- [ ] Rules: list opens. On mobile the **category bar is sticky** at
      the top of the page under the app bar. Switching categories
      filters the list; tapping a rule expands it. Tapping a rule
      from Favorites or from Global Search opens it expanded and
      scrolled into view.
- [ ] Tools / Dice: edition matters here.
  - [ ] In **V5** mode, the V5 roller is shown — pool + Hunger +
        reason fields, with the Hunger Tracker inside the same card.
        A roll renders dice as red-bordered tiles and surfaces
        Critical / Messy Critical / Bestial Failure banners
        correctly.
  - [ ] In a **classic** edition, the Classic roller is shown — pool
        + Difficulty fields, with no Hunger control. A roll renders
        dice and the success / botch summary.
  - [ ] Switching language updates the dice labels.

## 9. PWA install

- [ ] **Install** via Chrome's "Install app" / "Add to Home Screen".
      The OS prompt shows the app name "VTM Companion" and the gothic
      book icon.
- [ ] Open the installed shortcut. It launches **standalone** (no
      browser address bar, no tab strip).
- [ ] The home-screen icon, app-switcher icon, and splash colors all
      use the dark + red identity.
- [ ] Close the app, reopen it: previously created characters and
      chronicles are still there.
- [ ] Backup export from inside the installed app still produces a
      downloadable file.
- [ ] Backup import from inside the installed app still resolves the
      file picker and imports.
- [ ] On Android, the system "Apps" → VTM Companion entry exists.
      Storage usage looks plausible (a few MB at most).

## 10. Mobile usability issues to watch

These are the qualitative things to keep an eye on while running
sections 4–9. File any of them as a bug per §13.

- **Clipped or off-screen buttons** at the bottom of cards or
  modals.
- **Bottom nav overlap.** Anything that's hidden behind the fixed
  bottom nav bar (especially toasts, FABs, page footers).
- **On-screen keyboard covering inputs.** When typing in a journal,
  the field being edited should remain visible.
- **Modals too tall** to scroll, or modals that scroll the page
  underneath instead of their own body.
- **Horizontal scrolling.** Any time the page bleeds wider than the
  viewport.
- **Tap targets too small.** Anything less than ~40 × 40 px is
  thumb-hostile.
- **Date picker usability** on session / chronicle date inputs.
  Native vs custom; both work?
- **File picker / download behavior** — covered in §7 but the
  qualitative feel matters too.
- **Long lists** (clan list with art, all rules, all favorites,
  chronicle session list) — scrolling smoothness on low-end
  devices.
- **Sticky elements** behaving when the address bar collapses /
  expands on scroll.

## 11. Offline / no-network manual observation

The app does **not** ship a service worker today; lack of full offline
support is **not** a bug in this checkpoint. The goal here is to
record what actually happens so the future offline-support checkpoint
has a baseline.

- [ ] After the app has loaded once, turn the device's network off
      (airplane mode is fine).
- [ ] Navigate between already-rendered routes — note which still
      render (Home, Compendium, Settings) and which fail (anything
      that triggers a network fetch we don't expect).
- [ ] Quit and reopen the installed PWA without network. Note
      whether it loads from cache, shows the browser offline page,
      or fails silently.
- [ ] Confirm that **localStorage-only data remains readable**
      regardless of network state — that's the floor.
- [ ] Re-enable network and reload. Note that everything returns to
      normal.

Record the observations in the bug-report template per §13, tagged as
**polish** rather than blocker.

## 12. Pass / fail criteria

Tag every reported issue with one of these:

- **Blocker.** The app, an installed PWA, a backup, or a workflow
  documented above cannot complete on a real device. Examples:
  app crashes, data lost on save, backup import silently drops
  records, Sessions show "Unknown character" for valid imported
  references.
- **Major issue.** A documented workflow works but is significantly
  degraded. Examples: keyboard covers the field being edited,
  bottom nav covers actionable content, file picker rejects valid
  files, dice roller produces visibly wrong totals.
- **Minor issue.** A workflow works but has rough edges. Examples:
  one badge wraps awkwardly on small screens, a button is slightly
  too small, an animation jitters on low-end devices.
- **Polish.** Cosmetic only. Examples: alignment off by a few px,
  a spacing inconsistency, a translation that reads slightly
  awkward but is technically correct.

Blockers must be fixed before the next mobile-readiness checkpoint
proceeds. Majors should be triaged within the same checkpoint.
Minors and polish can be batched into a beauty/stabilization pass.

## 13. Bug report template

Use one issue per bug; copy this block at the top.

```
**Device**:        e.g. Pixel 7 (Android 14)
**Browser / PWA**: e.g. Chrome 132 / Installed PWA
**Screen**:        e.g. Chronicle manage modal → Sessions tab
**Steps**:
  1. …
  2. …
  3. …
**Expected**:      …
**Actual**:        …
**Screenshot / video**: (attach)
**Severity**:      Blocker | Major | Minor | Polish
```

Optional fields if relevant:
- Orientation (portrait / landscape).
- Network state (online / offline / spotty).
- Reproducibility (every time / sometimes / once).
- Backup file involved (yes / no — and which version).

## 14. Recommended next steps after QA

In order:

1. **Fix blockers.** Every blocker found becomes its own surgical
   checkpoint. Do not start (2) while any blocker is open.
2. **Fix Android-specific file-handling issues**, if any
   (§7 surprises). These are the most likely class of bugs because
   of Android scoped storage; they tend to be specific to certain
   WebView / Chrome versions.
3. **Decide service-worker scope** based on the §11 observations and
   the strategy in `offline-data-safety-plan.md`. Spike on a side
   branch; do not merge until the update / rollback test there
   passes.
4. **TWA via Bubblewrap** or **Capacitor**, per
   `android-packaging-plan.md`. Only after (1)–(3) are settled.
5. **Re-run this checklist** end-to-end after each of (3) and (4) —
   each step changes the underlying runtime enough that previous
   passes don't carry over.

Until step 1 is empty, the next checkpoint is "fix blockers", not
"add new features".
