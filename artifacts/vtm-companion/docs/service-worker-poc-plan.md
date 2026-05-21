# Service Worker Proof-of-Concept Plan

A conservative plan for a future proof-of-concept (PoC) branch that
exercises a service worker (SW) in this app **without** committing to
shipping one to `main` yet. The goal of this document is to make the
decisions, scope, and rollback up front so the eventual SW spike does
not surprise users or break already-working offline-adjacent behavior.

This is a planning document. **No service worker code, tooling, or
configuration is added in this checkpoint.**

Companion documents — read these first if you are picking up the PoC:

- [`offline-data-safety-plan.md`](./offline-data-safety-plan.md) — the
  source of truth for the caching strategy summarized below.
- [`mobile-app-readiness.md`](./mobile-app-readiness.md) — current PWA
  install status and asset checklist.
- [`deployment-readiness.md`](./deployment-readiness.md) — production
  build pipeline, Railway static-host specifics, SPA fallback details.
- [`real-device-mobile-qa-plan.md`](./real-device-mobile-qa-plan.md) —
  the QA pass the PoC must survive before merge consideration.
- [`android-packaging-plan.md`](./android-packaging-plan.md) — Android
  wrapper work that should *follow* a clean offline pass, not precede
  it.

---

## 1. Purpose

A service worker is a piece of code that sits between the app and the
network. Once installed, it can intercept every request the page makes,
serve responses from a local cache, and continue working when the
network is unavailable. That power is exactly why it needs to be tested
carefully before reaching real users.

Reasons to treat the SW as a high-risk addition:

- A misconfigured SW can pin users to a **stale `index.html`** for
  days, locking them out of new releases until they manually clear
  site data.
- A SW that caches "everything" can silently break dynamic behavior
  (file pickers, blob downloads, future backend calls).
- Browsers cache SW behavior aggressively; rolling back a bad SW is
  significantly harder than rolling back a normal frontend deploy.
- The app's user data lives in `localStorage` and is not duplicated
  anywhere; a SW bug that makes the app fail to load can feel — to a
  user — like data loss, even though the data is still on the device.
- Debugging a SW on mobile is painful: DevTools access is limited,
  and reproducing user state from a phone is non-trivial.

A PoC branch lets us validate the strategy in `offline-data-safety-plan.md`
against this specific Vite build, this specific Railway deploy, and this
specific PWA install surface, before any of it reaches `main`.

---

## 2. Current state

What the app looks like at the time this plan is written:

- **Stack.** React + Vite SPA (`artifacts/vtm-companion`), built to
  static files in `dist/public/`.
- **PWA assets.** `public/manifest.webmanifest`, favicon, icon set,
  and screenshots are all in place. The install prompt fires on
  supported platforms.
- **App data.** Stored only in `localStorage`: characters,
  chronicles, sessions, locations, relationships, linked characters,
  journal notes, favorites, settings.
- **Backup / import / export.** Works today, fully in-browser. Backup
  envelope is `_vtmAppBackup` with `backupVersion: 2`. Round-trip
  tested.
- **Service worker.** **None.** No registration code, no Workbox, no
  `vite-plugin-pwa`, no `public/sw.js`.
- **Offline caching.** **None.** Every page load goes to the network;
  the app cannot start without an initial network response for the
  shell.
- **Deployment.** Static Vite build served by a Railway frontend.
  SPA fallback is configured at the host so deep links resolve to
  `index.html`.
- **Cloud / backend.** None. No accounts, no analytics, no sync.

This baseline is the contract the PoC must not break.

---

## 3. Recommended future service worker strategy

This is a summary of the strategy in `offline-data-safety-plan.md` §4,
restated so this document is readable on its own. **`offline-data-safety-plan.md`
is the source of truth** — if the two ever diverge, the offline plan wins
and this doc gets updated to match.

### Caching rules by request type

| Request                                     | Strategy                           | Why |
|---------------------------------------------|------------------------------------|-----|
| `index.html` / app shell entry              | **network-first**                  | Always try the network so new deploys reach users on next load; fall back to cache only when offline. |
| Hashed JS / CSS in `/assets`                | **cache-first (immutable)**        | Filenames carry a content hash, so cached entries are correct forever. New builds get new filenames. |
| Manifest, favicon, icon PNGs                | **stale-while-revalidate** *or* cache-first | Fast load from cache, background refresh. |
| Screenshots                                 | **stale-while-revalidate** *or* cache-first | Same as icons. |
| Bundled static images (e.g. clan PNGs)      | **cache-first (versioned)**        | Baked into the build; safe to cache aggressively. |
| User-generated backup JSON downloads        | **never cache**                    | This is user output, not app input. Let the browser handle it. |
| File-input / `FileReader` traffic           | **never intercept**                | Backup import must not go through the SW. |
| Any future API call                         | **explicit decision required**     | Default to network-only until a backend exists with a documented strategy. No speculative API caching. |
| Cloud sync                                  | **not applicable**                 | There is no cloud sync. The SW must not pretend there is. |

### Update / version behavior

- **Versioned cache name** (e.g. `vtm-companion-v1`, bumped each
  release). Old caches are deleted on activation.
- **`skipWaiting()` + `clients.claim()`** are acceptable only *after*
  an in-app "Update available — reload" prompt is shown, so users
  don't lose unsaved edits.
- **Never serve `index.html` from cache without trying the network
  first** (except when truly offline). Cache-first HTML is the classic
  foot-gun.

### Anti-patterns to refuse in the PoC

- Blanket `fetch` handler that intercepts requests it doesn't
  understand.
- Caching JSON backup files.
- Caching responses keyed by cookies / `Authorization` the SW does
  not vary on.
- Aggressive auto-update that swaps the SW out from under an
  in-progress edit.

---

## 4. Proof-of-concept branch scope

Exactly what the PoC branch is allowed to touch, and what it is not.

**In scope for the PoC branch:**

- A service worker registration path (either via `vite-plugin-pwa`
  or a tiny hand-written `public/sw.js` registered from
  `src/main.tsx` in production only).
- Static asset caching following §3:
  - cache-first for hashed `/assets/*.js`, `/assets/*.css`.
  - stale-while-revalidate or cache-first for manifest, icons,
    favicon, screenshots, bundled images.
- Route fallback validation: deep links (e.g. `/chronicles/<id>`,
  `/characters/<id>`, `/tools/dice`) must still resolve to the SPA
  shell when offline.
- Update-available flow if it can be implemented cheaply: detect a
  waiting SW and surface a non-blocking toast / banner with a
  "Reload" action. If a clean implementation is not possible in one
  pass, document the gap and ship the PoC with `registerType: "prompt"`
  and **no auto-skip-waiting**.
- A clear rollback path (see §9), proven by actually exercising it
  on a preview deploy.

**Explicitly out of scope for the PoC:**

- Any change to localStorage schemas
  (`characterStorage.ts`, `chronicleStorage.ts`, journal/notes,
  favorites, settings).
- Any change to the backup format (`appBackup.ts`).
- Any change to app features, navigation, routing, or visible UI
  outside of the optional "update available" affordance.
- API caching (there is no API).
- Cloud sync, accounts, or anything that ships user data off-device.
- Capacitor, TWA, Android Studio, Gradle, or Play Store work.
- Bundle splitting / lazy-loading changes; the PoC works against the
  current single-bundle output.

The PoC branch should be a thin, reviewable layer on top of `main`.
If the diff grows past "add SW + register it + handle update", that
is a signal the scope crept.

---

## 5. What must be tested in the PoC

A go / no-go checklist. Every item must be exercised on the PoC
branch before any merge discussion.

- [ ] **Fresh install.** First visit on a clean profile: SW
      installs, cache populates, app loads normally.
- [ ] **Reload after deploy.** With the PoC deployed to a preview
      environment, push a follow-up build; verify users on the prior
      build get the new build on next reload (network-first HTML
      working).
- [ ] **App update behavior.** A waiting SW is detected; either a
      manual reload picks up the new version cleanly, or the
      "Update available" toast (if implemented) does. No silent
      mid-edit swap.
- [ ] **Direct routes still load.** With the SW active, visiting
      `/chronicles`, `/characters/<id>`, `/tools/dice`, `/rules`,
      `/settings` etc. as deep links resolves correctly both online
      and offline.
- [ ] **Manifest / icons / screenshots still work.** Install prompt
      still fires, icons render in the installed PWA, screenshots
      appear in the install dialog where applicable.
- [ ] **App opens when offline after a prior successful load.**
      Airplane-mode reload on an installed PWA still renders the
      shell and loads existing localStorage data.
- [ ] **localStorage data still appears.** Characters, chronicles,
      journal notes, favorites — all readable with the SW active,
      online and offline.
- [ ] **Backup export works.** Settings → Export downloads the
      `vtm-companion-backup-YYYY-MM-DD.json` file. SW does **not**
      intercept the download.
- [ ] **Backup import works.** File picker opens, `FileReader` reads
      a known-good backup, import is additive, linked references are
      preserved. SW does not interfere.
- [ ] **Invalid backup handling still works.** Importing a
      malformed JSON file produces the same friendly error as before
      the PoC; the app does not get into a broken state.
- [ ] **Android Chrome behavior.** End-to-end pass on at least one
      real Android device: install, open offline, edit a character,
      export and re-import a backup, follow a deep link.
- [ ] **Installed PWA behavior.** Same flows from the standalone
      launcher icon, not just the browser tab.

Any failure is a stop-the-line. Document it in the PoC branch and do
not merge until it is resolved or the strategy is explicitly revised.

---

## 6. Risks

The specific ways the PoC can go wrong, called out so reviewers know
what to look for.

- **Stale `index.html`.** Cache-first HTML pins users to a previous
  bundle. Network-first HTML is the only acceptable default.
- **Users stuck on old JS bundle.** If hashed-asset caching is set
  up but `index.html` keeps referencing the old hash, the user
  loads new HTML against missing assets and fails. Mitigation:
  network-first HTML *and* delete old caches on activation.
- **Broken route fallback.** A SW that swallows unknown requests
  can break the SPA fallback that currently works at the Railway
  layer. Mitigation: explicit `navigationPreload` / shell-only
  fallback for navigation requests; do not let the SW return
  arbitrary cached HTML for arbitrary URLs.
- **Broken backup import/export after install.** A `fetch`
  interceptor that touches blob or file-input traffic can break
  download or upload. Mitigation: the SW only handles GETs for
  same-origin asset paths; everything else passes through.
- **localStorage misunderstanding.** Users may believe an installed
  PWA backs their data up to the cloud. It does not. Mitigation:
  the data-safety UX work in `offline-data-safety-plan.md` §5 lands
  *with or before* the SW, never after.
- **Service worker cache not clearing.** A bad SW that is already
  installed can outlive several deploys. Mitigation: ship a kill
  switch (see §9) and keep the rollback path tested.
- **Railway / static deploy path mismatch.** The SW must register
  under the same scope the app is served from. Railway's static
  fallback must continue serving `index.html` for unknown routes;
  if the SW also tries to serve a navigation fallback, the two can
  fight. Mitigation: pick one source of truth for the navigation
  fallback (the SW, behind a network-first HTML strategy) and
  confirm the host's fallback is still in place as a safety net.
- **Debugging difficulty on mobile.** When something goes wrong on
  a phone, you cannot easily attach DevTools. Mitigation: validate
  on desktop Chrome with **DevTools → Application → Service
  Workers → Offline** *first*, then move to Android with USB
  remote debugging, and only then to "installed PWA on the user's
  device."
- **iOS Safari quirks.** Standalone-mode storage eviction is real.
  This is a pre-existing risk surfaced in `offline-data-safety-plan.md`
  §6; the SW does not make it worse, but it does not fix it either.

---

## 7. Recommended tooling options

Three reasonable paths. Each has trade-offs; the PoC should pick one
and stick with it for the duration of the branch.

### Option A — `vite-plugin-pwa`

A Vite plugin that wires up Workbox under the hood and emits a SW at
build time.

- **Pros:**
  - Fits the existing Vite build with minimal config.
  - Sensible defaults for hashed-asset caching.
  - Configurable manifest source; can reuse the existing
    `public/manifest.webmanifest`.
  - First-class `registerType: "prompt"` flow for update toasts.
  - Battle-tested in many other Vite SPAs.
- **Cons:**
  - Pulls in Workbox as a dependency tree.
  - Hides some of the SW behavior behind plugin config, which can
    make debugging harder when the issue is at the Workbox layer.
  - Plugin defaults can be *too* aggressive (e.g. precaching every
    bundled file) if not narrowed.
- **When it makes sense:** when you want a working SW quickly and
  are happy to constrain the plugin's defaults rather than write
  everything from scratch.
- **Fit for this app:** **good first choice** if the PoC explicitly
  uses `registerType: "prompt"` and configures `runtimeCaching`
  to match §3 instead of relying on full precaching.

### Option B — Workbox directly (without the Vite plugin)

Use the `workbox-*` packages to assemble a SW manually and register
it ourselves.

- **Pros:**
  - More control over what gets cached and how.
  - Easier to read the SW in isolation; nothing is generated.
  - Still benefits from Workbox's well-tested strategies.
- **Cons:**
  - More boilerplate for asset manifest generation; you have to
    enumerate hashed assets yourself or import a generated list.
  - Larger surface area to maintain than option A or C.
- **When it makes sense:** when the plugin's defaults are *almost*
  right but you keep fighting them, and you want the SW to be a
  first-class part of the repo rather than a generated artifact.
- **Fit for this app:** acceptable, but probably overkill for the
  PoC. Consider only if option A's generated SW becomes a
  debugging obstacle.

### Option C — Hand-written service worker

A small `public/sw.js` (or `src/sw.ts` compiled out) that implements
just the strategy in §3 — no Workbox, no plugin.

- **Pros:**
  - Smallest possible footprint; nothing to misconfigure.
  - Easiest to reason about for reviewers.
  - No new dependencies.
  - Trivial to delete during rollback.
- **Cons:**
  - You write the cache versioning, cleanup, and update logic
    yourself, with all the foot-guns that implies.
  - No precaching helpers — you have to know which assets to cache
    or rely on runtime cache-on-fetch.
  - Easy to subtly mishandle range requests, opaque responses,
    `clients.claim()` timing, etc.
- **When it makes sense:** when the app is genuinely simple, the
  caching surface is small, and you want zero plugin lock-in.
- **Fit for this app:** acceptable as a *very* small PoC focused
  only on app-shell + hashed-asset caching, with explicit
  comments. Less acceptable once you also need icon caching,
  update prompts, etc.

### Recommendation for this app

For the first PoC branch, **start with option A (`vite-plugin-pwa`)
in `registerType: "prompt"` mode**, with `runtimeCaching` tuned to
match §3 and `workbox.navigateFallback` set so that `index.html`
stays network-first. Reasons:

- Fits Vite naturally; minimum new code in this repo.
- The "update available" UX is half-built-in.
- It is the easiest option to delete cleanly during rollback.
- If the plugin proves to be a poor fit during the PoC, falling
  back to option C is straightforward; falling back from C to A
  would mean redoing the work.

Option B is reserved for a second iteration if the plugin gets in
the way.

---

## 8. Recommended approach

In short, for the PoC:

- **Branch.** Create a separate experimental branch (e.g.
  `service-worker-poc`). Do **not** work on `main`.
- **Tooling.** Start with `vite-plugin-pwa` as in §7.
- **Caching.** Conservative — match §3 exactly. No catch-all
  handler. No HTML cache-first. No backup-file caching. No API
  caching.
- **Update behavior.** `registerType: "prompt"`. Do **not** enable
  `skipWaiting` automatically. Either ship an in-app toast or
  require the user to reload manually.
- **Testing surface.**
  1. `pnpm --dir artifacts/vtm-companion run build`
  2. `pnpm --dir artifacts/vtm-companion run preview`
     (production preview locally; check DevTools → Application →
     Service Workers).
  3. Deploy to a **preview** Railway environment, not production.
  4. Real Android Chrome pass before any merge discussion. See
     `real-device-mobile-qa-plan.md` for the script.
- **What not to do during the PoC:**
  - Do not enable aggressive auto-updates.
  - Do not introduce IndexedDB, even if it seems tempting.
  - Do not change any schema, store, or backup code.
  - Do not delete the host-level SPA fallback at Railway "because
    the SW handles it" — keep belt and suspenders.

---

## 9. Rollback plan

A SW that misbehaves can persist in the user's browser long after
the bad deploy is replaced. Plan for that explicitly.

If the SW causes issues during the PoC (or after, if it ever ships
to `main`):

1. **Disable registration.** Stop calling `register()` from
   `src/main.tsx` (or remove the plugin block from
   `vite.config.ts`). Ship a build with no SW registration. New
   users will not pick up the SW; existing users still have the
   old one.
2. **Ship a "kill switch" SW.** Replace the SW source with a
   minimal `sw.js` that calls `self.registration.unregister()`
   and `caches.keys().then(...).delete()` on activation. Deploy
   it under the same scope/URL as the original SW. This forces
   existing clients to unregister on next load.
3. **Bump the cache version.** If the SW must stay but a cache
   layer is corrupt, change the cache name (e.g.
   `vtm-companion-v1` → `vtm-companion-v2`). The activate handler
   should delete unknown caches.
4. **Clear caches deliberately.** In the kill switch handler,
   iterate `caches.keys()` and delete every entry the app owns.
5. **Remove the registration code entirely from `main`.** Once
   the kill switch has been live long enough for most clients to
   pick it up (a deploy cycle or two), land a clean build with
   no SW code at all.
6. **Deploy the no-SW build.** Restore the pre-PoC behavior:
   network-only, no offline, but no risk of stale caches either.
7. **User troubleshooting notes.** For any user still stuck on a
   bad SW, document the manual recovery steps:
   - Browser tab: DevTools → Application → Service Workers →
     **Unregister**, then Application → Storage → **Clear site
     data**, then reload.
   - Installed PWA: uninstall the PWA, clear site data in the
     browser settings, reinstall.
   - Mobile: long-press the app icon (Android) and clear app
     data; or remove and reinstall the PWA.
   - **Warn users that "Clear site data" deletes localStorage.**
     They should export a backup first if they can still open
     the app.

Whoever lands the PoC owns making sure the kill-switch SW is
ready *before* the first PoC deploy, not after.

---

## 10. Do **not** do yet

Explicit guardrails for this checkpoint and the immediate next one:

- **Do not implement a service worker in this checkpoint.** This
  document is the deliverable.
- **Do not install `vite-plugin-pwa`, Workbox, or any SW tooling**
  in this checkpoint. Those go into the PoC branch only.
- **Do not cache everything.** Default to network-only for
  anything not explicitly listed in §3.
- **Do not add offline data sync.** There is no second source of
  truth to sync against.
- **Do not add cloud sync, accounts, or analytics.** The app is
  on-device only; that posture is intentional.
- **Do not change the backup format** (`AppBackup`,
  `_vtmAppBackup`, `backupVersion: 2`). Schema/format work needs
  its own checkpoint and a migration path in `appBackup.ts`.
- **Do not change any localStorage store** as part of SW work.
- **Do not package for Android (Capacitor / TWA / Play Store)
  before offline behavior is tested.** Wrapping an app whose
  offline story has not been validated multiplies the failure
  modes.
- **Do not enable automatic, aggressive SW updates** until the
  in-app "Update available" UX exists.

---

## 11. Future implementation checklist

Step-by-step order for the future PoC checkpoint. Each step has a
clear stopping point so the work can be paused without leaving the
tree in a broken state.

1. **Create an experimental branch** (e.g. `service-worker-poc`)
   off the latest `main`. Do not work on `main` directly.
2. **Add service worker tooling.** Install `vite-plugin-pwa` as
   a dev dependency in `artifacts/vtm-companion`. Commit only
   that dependency change first so it is easy to revert.
3. **Configure conservative caching.** In `vite.config.ts`,
   register the plugin with `registerType: "prompt"`, point it
   at `public/manifest.webmanifest`, and define `runtimeCaching`
   to match §3. Do **not** precache the entire build output by
   default — be explicit about what enters the cache.
4. **Test the production build locally.**
   `pnpm --dir artifacts/vtm-companion run build` — confirm the
   SW is emitted, asset hashes are intact, the `dist/public/`
   output still includes the manifest, icons, and screenshots.
5. **Test the production preview locally.**
   `pnpm --dir artifacts/vtm-companion run preview` — open in
   Chrome, confirm SW registers in DevTools → Application →
   Service Workers, confirm Cache Storage matches §3.
6. **Test the deployed Railway preview app.** Deploy the PoC
   branch to a preview environment (not production). Confirm
   the SW scopes correctly under the deployed path, deep links
   still work, and a follow-up deploy reaches users on next
   reload (network-first HTML works).
7. **Test on real Android Chrome.** Follow
   `real-device-mobile-qa-plan.md`: install, offline reload,
   edit data, export and re-import a backup, follow deep
   links. Note any platform-specific issues in the PoC PR.
8. **Test the installed PWA.** Same flows again, but from the
   standalone launcher icon, not the browser tab.
9. **Test backup import / export under the SW.** Both happy
   path and malformed-input path. Linked references must
   survive a round-trip.
10. **Document the results** in the PoC branch — what passed,
    what failed, what the SW source ended up looking like,
    what the kill switch looks like. Update this document and
    `offline-data-safety-plan.md` with any deviations from
    plan.
11. **Only then consider merge.** Merge to `main` requires:
    every box in §5 ticked; the kill switch deployed and
    proven; the data-safety UX from
    `offline-data-safety-plan.md` §5 already shipped; this
    document and `offline-data-safety-plan.md` updated to
    reflect what actually shipped.

Until all eleven steps are done, the app stays online-only and
this document is the most we owe a future contributor.
