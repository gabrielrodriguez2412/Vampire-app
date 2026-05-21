# Android Packaging Plan

A practical, staged plan for eventually shipping VTM Companion as an Android
app. **No native Android project is being added in this checkpoint.** This
document exists so a future contributor can pick up the work without having
to redo the trade-off analysis. Update it whenever a checkpoint changes the
answer to any item below.

Companion docs to read alongside this one:
- [`mobile-app-readiness.md`](./mobile-app-readiness.md) — current PWA /
  installability status and the asset checklist.
- [`deployment-readiness.md`](./deployment-readiness.md) — production build
  and Railway deployment specifics.

---

## 1. Current app status

| Item                                    | State                                                     |
|-----------------------------------------|-----------------------------------------------------------|
| App stack                               | React + Vite + TypeScript single-page app                 |
| Backend / accounts                      | **None.** Pure frontend.                                  |
| Persistence                             | `localStorage` only (characters, chronicles, sessions, locations, relationships, journal notes, favorites, settings). |
| Backup / import / export                | JSON file via the in-app Settings flow; tested.            |
| PWA manifest                            | Present (`public/manifest.webmanifest`, `id: "/"`).        |
| App icons                               | First-pass PNGs (192 / 512 / maskable 512) + matching SVG. |
| `theme-color` / `apple-touch-icon`      | Wired in `index.html`.                                    |
| Screenshots field on manifest           | **Not present yet** — listed as deferred work.            |
| Service worker / offline cache          | **None yet** — intentionally deferred.                    |
| Deployment                              | Railway via `nixpacks.frontend.toml` → `vite preview`; SPA history fallback verified for all client routes. |
| Native Android wrapper                  | **None.** No Capacitor, no TWA, no Gradle.                |

---

## 2. Packaging options

Three realistic paths from "static web app" to "thing on a user's phone".
For each: what it is, pros, cons, technical requirements, when it makes
sense for this specific app.

### 2.1 PWA install (Add to Home Screen)

**What it is.** The user opens the deployed URL in Chrome (Android) or
Safari (iOS), then chooses "Install app" / "Add to Home Screen". The
browser places a launcher icon that opens the site in standalone mode
(no browser chrome), using the existing manifest + service worker (if
any).

**Pros.**
- Zero new infrastructure: nothing to build, sign, or upload.
- One codebase, one deploy pipeline; users always get the latest version.
- No app-store review, no developer account fee, no privacy policy
  requirement just for distribution.
- Works on Android, iOS, and desktop Chrome/Edge.

**Cons.**
- Discoverability is poor — users have to find the URL themselves; there
  is no Play Store listing.
- iOS standalone mode has historically lost localStorage occasionally in
  obscure low-storage / privacy-mode scenarios; not common but worth
  flagging.
- No native APIs — only what the browser exposes.

**Technical requirements.**
- Valid manifest with square PNG icons (✅ have).
- HTTPS (Railway provides).
- For a fully clean install audit, a service worker is recommended (Chrome
  no longer blocks install without one, but Lighthouse still calls it
  out).

**When it makes sense.** First option to ship to real users. We are
effectively here already — anyone who knows the URL can install today.

### 2.2 Trusted Web Activity (TWA)

**What it is.** A thin Android app shell (a special Chrome Custom Tab)
that loads the deployed PWA full-screen as if it were a native app. The
app is installable from Play Store. Built via Google's **Bubblewrap** CLI
from the existing manifest.

**Pros.**
- Same web codebase, no JS changes needed.
- Real Play Store presence: discoverable, ratings, installs counter.
- Installs / updates behave like a normal Android app for the user; the
  underlying web content is still updated by deploying the website.
- Smallest possible APK / AAB (a few hundred KB).

**Cons.**
- Requires a Google Play developer account ($25 one-time) and a privacy
  policy URL.
- Requires **Digital Asset Links** verification (`assetlinks.json`
  served from the website's `.well-known/` proving the app and the
  origin are paired). If this breaks, the TWA falls back to showing a
  URL bar — bad UX.
- The user's browser is Chrome on Android; if Chrome is disabled or
  uninstalled, the TWA will not launch.
- Still no native APIs beyond what the browser already exposes.
- Apple does **not** support TWA on iOS; this is Android-only.

**Technical requirements.**
- Designed icons + screenshots (the Play Store listing won't accept the
  current placeholder PNGs as-is).
- Digital Asset Links file accessible at
  `https://<deployed-host>/.well-known/assetlinks.json`.
- Bubblewrap CLI (`npm i -g @bubblewrap/cli`).
- JDK + Android SDK locally (or use Bubblewrap's bundled JDK + the
  cloud signing flow).
- A signing key (kept out of the repo) for the release APK / AAB.

**When it makes sense.** Once the PWA is otherwise feature-complete,
this is the lightest-weight path onto Play Store.

### 2.3 Capacitor Android wrapper

**What it is.** A full native Android project (Gradle, AndroidManifest,
Java/Kotlin glue) that hosts the web app inside a WebView and exposes
native APIs (filesystem, share sheet, biometrics, secure storage, etc.)
via a JavaScript bridge.

**Pros.**
- Real access to native APIs we may want later (proper file picker for
  backups, share-to-app, system share sheet, background tasks, push
  notifications, biometric unlock for "secret" chronicle notes, etc.).
- Not coupled to whether Chrome is installed (uses the System WebView).
- Can ship to **both** Play Store and App Store from one codebase.
- We can still update the web content separately if we set up a
  hot-reload bundle update pattern.

**Cons.**
- Now we maintain two projects: the web app and the Capacitor shell. The
  shell needs occasional Capacitor / Android SDK upgrades that have
  nothing to do with the web app.
- Larger APK / AAB (~10–20 MB minimum because of the WebView shell and
  the bundled JS / CSS).
- Local Android SDK + JDK required to build; CI cost goes up.
- Capacitor plugins for the native APIs add their own dependency churn.

**Technical requirements.**
- `@capacitor/core` + `@capacitor/android` + relevant plugins.
- Local Android Studio / Android SDK for building.
- Same signing key + Digital Asset Links requirement as TWA if we want
  PWA-style verified links.
- Same designed icons + screenshots as TWA.

**When it makes sense.** When (and only when) we hit a feature wall the
browser can't cross — for example, importing a backup file through a
real native file picker that survives Android storage scoping rules, or
sharing a character sheet to another app via the system share sheet.
**Not before** that wall actually appears.

---

## 3. Recommended path

A pragmatic staged plan. Each stage is a separate checkpoint and can be
stopped at without breaking the previous one.

1. **Stay on PWA install for the immediate term.** It works today; the
   manifest, icons, and Railway deploy are all in place.
2. **Polish PWA install signals.** Add the missing manifest entries:
   - `screenshots` (at least one portrait + one landscape PNG of a
     representative screen).
   - Replace first-pass placeholder PNG icons with designer-reviewed
     artwork.
3. **Decide offline behavior.** Pick a service-worker strategy that
   matches our deploy cadence (network-first for HTML, cache-first for
   hashed assets is the safe default). Implement only after the icon set
   is final.
4. **Write the legal / privacy documents.** Even before going to Play
   Store we should have an in-app "About" / disclaimer that the app is
   an unofficial fan-made tool and that data is stored only on-device.
5. **Run a mobile / tablet QA pass.** End-to-end exercise of character
   creation, chronicle management, dice tools, backup, import, and the
   global search — on real Android and iOS browsers.
6. **Verify backup / import on Android.** The Settings backup writes /
   reads a JSON file. Confirm Android's scoped-storage download flow
   actually returns the file to Settings without a content-URI surprise.
7. **Spike Capacitor or TWA on a side branch.** Do **not** merge to
   `main` until the spike answers a specific question (e.g. "does the
   file picker work for import?", "does Asset Links verification
   succeed?").
8. **Produce APK / AAB + Play Store listing.** Once the spike answers
   the question, ship via TWA first (cheaper) unless we have a concrete
   native-API need that pushes us to Capacitor.

---

## 4. Risks and blockers

These are the things most likely to bite when packaging actually
starts. Each one is a small problem on the web today; some become bigger
on Android.

- **localStorage durability.**
  - The browser may evict storage under low-disk conditions. Android
    WebView usually keeps storage attached to the app's data partition
    (so a Capacitor wrapper is actually safer here), but a TWA shares
    Chrome's storage and can be cleared independently of the app.
  - **Mitigation.** Treat backup export as the source of truth and
    encourage regular backups in-app. Already partly done via the
    Settings "Export Full Backup" action.
- **File import / export on Android.**
  - Web file picker on Android returns a content URI rather than a real
    path; some Chrome / WebView versions silently truncate large files
    or break re-selection of the same file.
  - **Mitigation.** Manual QA on actual Android during the mobile pass;
    consider a Capacitor `Filesystem` / `Share` plugin only if the
    web API path proves unreliable.
- **Offline mode without an explicit strategy.**
  - Adding a service worker carelessly can pin users on a stale build
    that we cannot remotely invalidate. Cache-first for HTML is the
    classic foot-gun.
  - **Mitigation.** Use network-first for `index.html` + cache-first
    for hashed assets, and version the SW so a deploy reliably
    refreshes clients.
- **Play Store: privacy policy.**
  - Play requires a public privacy policy URL even for apps that don't
    collect data. The policy still has to state that explicitly.
  - **Mitigation.** Draft a short policy that says "all data is stored
    locally on your device; the app makes no network calls beyond
    fetching the page; no analytics, no accounts" before the first
    Play Store submission.
- **Play Store: unofficial / IP disclaimer.**
  - The app is an unofficial fan-made companion. Play Store reviewers
    occasionally reject apps that look adjacent to a major IP without
    a clear "unofficial" / "fan-made" statement.
  - **Mitigation.** Surface the same disclaimer that's in
    `Settings → About` on the store listing description and inside the
    app metadata.
- **App icon + screenshots.**
  - Current PWA icons are first-pass placeholders generated from
    primitives. They satisfy the install validator but **will not**
    satisfy a designer or a Play Store reviewer at submission.
  - **Mitigation.** A designer pass on `icon-*.png` + a set of
    captured screenshots from the deployed app before submission.
- **Testing surface.**
  - The app currently has automated coverage for storage and dice
    helpers; UI testing is mostly manual. An Android wrapper adds yet
    another surface (the wrapper itself, plus signing).
  - **Mitigation.** Treat the wrapper as a thin shell — test the web
    app through its own pipeline, test the shell end-to-end manually
    on at least two Android API levels.

---

## 5. Required future checkpoints before Android packaging

Recommended order. Earlier items are smaller and unblock later items.

1. **PWA screenshots.** Add a `screenshots` field with 1–2 portraits +
   1 landscape PNG to the manifest. Captures from `/personaje` (sheet)
   and `/compendium/herramientas` (dice) are good candidates.
2. **Service-worker decision.** Land a small network-first-for-HTML /
   cache-first-for-hashed-assets SW. Ship with a versioned cache so
   deploys cleanly invalidate.
3. **Privacy & data policy.** Short text in `Settings → About` and a
   public-URL version (e.g. a Markdown file rendered from the docs
   site, or a Notion page) so Play Store can link to it.
4. **Legal disclaimer surfacing.** The Settings "About" card already
   carries a fan-made disclaimer; confirm it survives translation in
   EN / ES and add it to the Play Store description template.
5. **Mobile / tablet manual QA.** A 30-minute exercise covering every
   primary route on at least one Android Chrome and one iOS Safari.
   Note any flaky behavior in the existing UI beauty / stabilization
   backlogs.
6. **Backup / import / export Android file-handling test.** Specifically
   exercise the Settings export + import flow on Android Chrome and
   verify the JSON round-trips. Document any content-URI surprises.
7. **Android wrapper spike (TWA first, Capacitor as fallback).** On a
   throwaway branch, run Bubblewrap against the deployed PWA. Verify
   that `assetlinks.json` works and the app installs.
8. **APK / AAB generation.** Once the spike is clean, generate a
   signed bundle. Keep the signing key out of the repo; document
   where it lives.
9. **Play Store listing assets.** Feature graphic, short description,
   long description, screenshots, content rating questionnaire,
   privacy policy URL.

Only after step 9 do we have a thing to actually upload.

---

## 6. Do **not** do yet

The next contributor will be tempted to skip ahead. They should not.

- **Do not add Capacitor.** No `@capacitor/*` packages, no `android/`
  directory, no Gradle wrapper, no Kotlin code in the repo.
- **Do not add a Trusted Web Activity project.** No Bubblewrap output,
  no `twa-manifest.json`, no `.well-known/assetlinks.json` in the
  repo until we know which deployed host serves it.
- **Do not add Play Store metadata files.** No fastlane lane configs,
  no listing copy.
- **Do not add a service worker blindly.** A cache-first SW without a
  reliable invalidation story is worse than no SW.
- **Do not generate or commit a signing key.** Keys belong in a
  password manager and a CI secret store, not git.
- **Do not package before** the mobile QA pass and the backup /
  import test on Android both succeed. Shipping an app that can lose
  user data is much worse than not shipping one.

---

## 7. Suggested future technical path

High-level commands a future contributor will likely run. **Not** to be
run today — they are a roadmap, not instructions.

```sh
# (After the PWA polish + service worker checkpoints are merged.)

# 1. PWA install audit — confirm no warnings.
#    (Manual: Chrome DevTools → Application → Manifest, then Lighthouse → PWA.)

# 2. TWA spike via Bubblewrap (preferred lightweight path).
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://<deployed-host>/manifest.webmanifest
bubblewrap build
# → produces an unsigned AAB and the assetlinks.json snippet to upload
#   to the website's /.well-known/.

# 3. Capacitor spike (only if TWA is insufficient).
pnpm --dir artifacts/vtm-companion add -D @capacitor/cli @capacitor/core @capacitor/android
pnpm --dir artifacts/vtm-companion exec cap init "VTM Companion" "app.vtm.companion"
pnpm --dir artifacts/vtm-companion run build
pnpm --dir artifacts/vtm-companion exec cap add android
pnpm --dir artifacts/vtm-companion exec cap copy android
pnpm --dir artifacts/vtm-companion exec cap open android   # opens Android Studio
# → from Android Studio, Build → Generate Signed Bundle / APK.

# 4. Play Store upload.
#    Manual via Play Console: upload AAB, fill listing copy, attach
#    screenshots + feature graphic, link the privacy policy URL,
#    submit for review.
```

All four commands above assume that the prerequisites in §3 and §5 are
done. Don't run them in isolation.
