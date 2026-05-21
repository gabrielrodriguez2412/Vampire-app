# Offline Strategy & Data Safety Plan

A careful, opinionated plan for two related questions:

1. **When and how do we add offline support?**
2. **What do we owe users about the safety of their data?**

Both are deliberately answered with "not yet" today — this document exists
so a future contributor doesn't reinvent the trade-offs. Update it whenever
a checkpoint changes the answer to any item below.

Companion docs to read alongside this one:
- [`mobile-app-readiness.md`](./mobile-app-readiness.md) — PWA install
  status and asset checklist.
- [`deployment-readiness.md`](./deployment-readiness.md) — production
  build and deploy specifics.
- [`android-packaging-plan.md`](./android-packaging-plan.md) — staged
  Android wrapper plan.

---

## 1. Current offline / data state

| Item                                  | State                                                |
|---------------------------------------|------------------------------------------------------|
| App stack                             | React + Vite SPA, served as static files             |
| PWA manifest                          | Present (`public/manifest.webmanifest`)              |
| Service worker                        | **None.** No `registerServiceWorker`, no Workbox, no PWA plugin. |
| Offline cache                         | None — every load goes to the network                |
| User data                             | `localStorage` only (characters, chronicles, sessions, locations, relationships, journal notes, favorites, settings) |
| Backup / import / export              | In-app JSON file via Settings; tested round-trip      |
| Cloud sync / accounts                 | **None.** Pure frontend; no backend.                 |
| Server-side persistence               | None                                                 |
| Cross-device sync                     | None (manual: export → transfer file → import)        |

In short: the app works only while online and persists only on the device's
browser profile.

---

## 2. What should work offline later

Once we choose to add a service worker, the goal is for an installed PWA to
keep functioning when the network is unavailable. Specifically:

- **App shell** (`index.html`, the hashed JS / CSS bundle, fonts, icon
  assets, manifest, screenshots) — must load from cache.
- **Static content** baked into the bundle: clans, disciplines, rules,
  glossary, editions, languages, dice helpers, search index — all already
  ship inside the JS bundle, so caching the bundle is enough.
- **User-owned data**: characters, chronicles, sessions, locations,
  relationships, journal notes, favorites, settings — these live in
  `localStorage` and already do not require the network. Adding a service
  worker does not change how they are read or written; it only ensures the
  shell can render them.
- **Backup export** — the JSON-blob download already runs entirely in the
  browser; should work offline today and continue to work behind a service
  worker.
- **Backup import** — file picker + `FileReader` already runs in the
  browser. Works offline. Service worker should leave file-input traffic
  alone.

---

## 3. What should not be assumed

These are common mis-expectations users have about "offline apps". State
them explicitly so the in-app messaging matches reality (see §5).

- **No cloud backup.** Nothing is uploaded anywhere.
- **No cross-device sync.** Data on Phone A is invisible to Phone B until
  the user exports, transfers, and imports the JSON backup.
- **No guaranteed durability.** Browser storage is best-effort:
  - Clearing site data, uninstalling the PWA, low-disk eviction, private /
    incognito mode, or a different browser profile all delete the data.
  - iOS Safari is especially aggressive about evicting `localStorage` for
    sites the user hasn't visited recently in standalone mode.
- **No server-side save.** We have no API for character storage. Adding one
  is out of scope unless the project's stance on accounts/cloud changes
  later.

---

## 4. Recommended future service worker strategy

This is the strategy we *plan* to land — **not** what is implemented today.

### Caching rules by request type

| Request                              | Strategy                  | Notes |
|--------------------------------------|---------------------------|-------|
| `index.html`                         | network-first             | Always tries the network so a new deploy reaches users on next load. Falls back to cached shell if offline. |
| Hashed JS / CSS / fonts in `/assets` | cache-first (immutable)   | Filenames carry a content hash, so a cache hit is always correct. New deploys produce new filenames. |
| Manifest + icon PNGs + favicon       | stale-while-revalidate    | Loads fast from cache, refreshes in background. |
| Screenshots                          | stale-while-revalidate    | Same as icons. |
| `images/` clan PNGs                  | cache-first (versioned)   | Bundled at build time; safe to cache aggressively. |
| Any future API call                  | **explicit decision required** before adding. Default to network-only until a backend exists with a clear strategy. |
| Backup file downloads/uploads        | **never cache**           | These are user-generated and unique per session. |

### Update / version behavior

- **Version the cache** (`vtm-companion-vN`) so a new SW deletes old caches
  on activation. Bump on every release.
- **`skipWaiting()` + `clients.claim()`** — apply after surfacing an
  in-app "Update available — reload" prompt so users don't lose unsaved
  work mid-edit.
- **Never serve `index.html` from cache without trying the network first
  unless offline.** Cache-first on HTML is the classic foot-gun that
  pins users to a stale build.

### Anti-patterns to avoid

- A blanket "cache everything" handler that intercepts requests it
  doesn't understand and silently breaks them.
- Caching backup JSON files (they are user output, not app input).
- Lazy SW updates that never reach the user on long-lived tabs.
- Caching responses with `Authorization` / cookie variations the SW
  doesn't key on (only relevant once a backend is added).

---

## 5. Data safety UX recommendations

Independent of when we add the service worker, these UX additions make the
"localStorage only" reality honest for the user. They are recommendations
for future checkpoints, not work to do here.

- **Settings → About panel: storage-location notice.** A line like:
  > "Your characters and chronicles are saved only on this device's
  > browser. Clearing site data or uninstalling the app will delete
  > them."
- **Backup reminder.** First pass already shipped: a soft amber band in
  Settings → Local Data with a "Recommended: export a backup before…"
  list (major changes, clearing browser data, uninstalling / changing
  device). A smarter future variant could surface only when:
  - The user has > N characters or chronicles, AND
  - It has been > N days since the last backup export.
  - Track "last export at" timestamp in localStorage (yes, ironic — but
    the goal is a nudge, not a guarantee).
- **Pre-destructive-action prompts.** Before any "Reset", "Delete all
  data", or "Clear favorites" action, suggest an export first ("Export
  a backup before you continue?").
- **Backup filename guidance.** Default the export filename to
  `vtm-companion-backup-YYYY-MM-DD.json` and surface that filename to
  the user immediately after export. **Done:** `downloadAppBackup()`
  returns the filename and the Settings post-export toast now shows it
  on a second line ("Saved as: vtm-companion-backup-2025-…json").
- **Import safety messaging.** The import button should state that
  importing is **additive** and never deletes existing data — this is
  already true in code; users need to be told.
- **In-app uninstall warning.** If we detect a PWA standalone launch, a
  one-time toast on first install: "Your data lives in this app. Export
  a backup regularly."

---

## 6. Risks and blockers

The problems most likely to bite once offline support actually lands.

- **localStorage quota and eviction.**
  - Limit is typically ~5–10 MB. A power user with hundreds of journal
    notes plus inventory could approach it.
  - Browsers may evict storage under disk pressure or in incognito mode.
  - **Mitigation.** Backup export remains the source of truth; consider
    a `navigator.storage.persist()` request when the user installs the
    PWA so the browser is less likely to evict.
- **Android file picker / export behavior.**
  - Android Chrome / WebView returns content URIs, not file paths, and
    older versions silently truncate large files or refuse re-selection
    of the same file.
  - **Mitigation.** Explicit Android QA pass (see §7); only switch to a
    native plugin if browser APIs prove unreliable.
- **iOS / PWA quirks.**
  - iOS Safari in standalone mode can lose `localStorage` if the user
    hasn't opened the PWA in ~7 days under low-storage conditions.
  - **Mitigation.** The data-safety UX nudges in §5; consider an
    IndexedDB mirror later if iOS eviction proves to be a real
    problem in practice.
- **Stale service worker.**
  - A SW with cache-first HTML can pin users to last week's build.
  - **Mitigation.** Network-first for HTML, versioned cache, and an
    in-app update toast (see §4).
- **Backup compatibility across app versions.**
  - The backup format (`AppBackup` envelope in `appBackup.ts`) is
    already `_vtmAppBackup` + `backupVersion: 2`. Future changes need
    a forward-compatible import path or a migration step. Tests
    already lock in remap behavior — extend them whenever the format
    changes.
- **User confusion between installed PWA and "cloud app".**
  - Many users assume any installed app syncs. The UX work in §5 is
    the only thing that disabuses them.
- **Play Store privacy disclosure.**
  - Even though we collect zero data, Play's Data Safety form requires
    we *state* that explicitly. Misstating "collected" data is grounds
    for app removal.
  - **Mitigation.** Draft and link a privacy policy URL (see
    `android-packaging-plan.md`).

---

## 7. Required future checkpoints before enabling offline

Recommended order. Each is a discrete checkpoint and can be stopped at
without breaking the previous one.

1. **Real-device mobile QA.** End-to-end pass on at least one Android
   Chrome and one iOS Safari — character flow, dice tools, backup,
   import, search.
2. **Backup / import file-handling test on Android.** Explicitly
   exercise the JSON export + import via Android's Files / Downloads;
   confirm round-trip works and document any content-URI surprises.
3. **localStorage stress test.** Seed a profile with ~50 characters and
   ~500 journal notes, exercise search and backup, watch for
   quota warnings.
4. **Service worker spike on a side branch.** Implement the strategy
   from §4 behind a feature flag; deploy to a preview environment.
   **Do not merge to `main`.**
5. **Update / rollback test.** Deploy build N, then deploy build N+1,
   confirm the install prompt fires and the SW activates on next load.
   Confirm that rolling back the deploy doesn't permanently break
   cached clients.
6. **Production build / preview verification with SW enabled.** Re-run
   the route + asset probes from `deployment-readiness.md` with the SW
   active to confirm SPA fallback still works.
7. **Privacy / data policy text.** Short policy stating: data lives on
   the user's device, no analytics, no accounts, no third-party calls.
   Link from the in-app About card and from the deploy.
8. **In-app backup warning UX.** Land the messaging from §5 alongside
   the SW so users understand what they're trusting to the device.

Only after step 8 should the service worker reach `main`.

---

## 8. Do **not** do yet

The next contributor will be tempted to skip ahead. They should not.

- **Do not add a service worker blindly.** Without a versioned cache and
  network-first HTML, an SW makes things worse, not better.
- **Do not cache "everything"** in a default `fetch` handler. Be
  explicit about what each request type does.
- **Do not imply cloud sync** in UI strings, tooltips, or marketing
  copy. The app is on-device only.
- **Do not package for Play Store** before the privacy / data policy
  text and the in-app data-safety messaging exist.
- **Do not change the localStorage schema only to enable offline.** If a
  schema change is genuinely needed later, write a migration in
  `characterStorage.ts` / `chronicleStorage.ts` *and* extend the
  `appBackup.ts` import path the same checkpoint. Never silently drop
  fields the user backed up under the old schema.
- **Do not pre-cache user-generated backup files.** They are output, not
  input; let them stay outside the SW.

---

## 9. Suggested future technical path

High-level commands a future contributor will likely run. **Not** to be
run today.

```sh
# Option A — Vite PWA plugin (most batteries-included)
pnpm --dir artifacts/vtm-companion add -D vite-plugin-pwa
# Then in vite.config.ts: import VitePWA, configure manifest source +
# Workbox runtimeCaching to match §4. Keep `registerType: "prompt"`
# so we control the update timing.

# Option B — hand-written service worker (most control)
# 1. Add `public/sw.js` implementing the §4 strategy with a versioned
#    cache name and `skipWaiting()` triggered by a postMessage from the
#    app.
# 2. Register it from `src/main.tsx` only in production builds.
# 3. Show an in-app "Update available" toast when a waiting SW exists.

# Either way, deploy to a preview branch, then run:
#   pnpm --dir artifacts/vtm-companion run build
#   pnpm --dir artifacts/vtm-companion run serve
# Verify in Chrome DevTools → Application → Service Workers:
#   - Source visible, status "activated and running"
#   - Cache Storage shows expected version + entries
#   - Network panel shows hashed assets served "from ServiceWorker"
#   - index.html shows "from network" on cold load, "from ServiceWorker"
#     when offline (DevTools → Application → Service Workers → Offline)
```

When the spike is clean, fold it into a real checkpoint with the §7 work
done in order. Until then, the app stays online-only and the data-safety
work in §5 is the right place to invest first.
