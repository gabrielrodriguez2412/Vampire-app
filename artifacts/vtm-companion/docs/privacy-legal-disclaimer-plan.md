# Privacy, Data & Legal Disclaimer Plan

This document is the source of truth for two related questions:

1. **What does the app do with user data?**
2. **What is the legal posture of an unofficial fan-made tool that exists
   alongside a major IP?**

It also captures the suggested public privacy policy wording, the suggested
fan-made disclaimer wording, and where each note should appear in the app
when the right surfaces exist. Update it whenever a checkpoint changes the
answer to any item below.

Companion docs to read alongside this one:
- [`offline-data-safety-plan.md`](./offline-data-safety-plan.md) — full
  offline + localStorage durability strategy.
- [`android-packaging-plan.md`](./android-packaging-plan.md) — Play Store
  privacy-disclosure requirements.
- [`mobile-app-readiness.md`](./mobile-app-readiness.md) — install /
  packaging status.

---

## 1. Current data model (today)

- **Frontend only.** React + Vite SPA. No backend, no server-side
  persistence, no APIs called by the running app.
- **Storage**: every user-owned record lives in `window.localStorage` on
  the user's device:
  - `vtm-characters`, `vtm-chronicles`, `vtm-chronicle-sessions`,
    `vtm-chronicle-locations`, `vtm-chronicle-relationships`,
    `vtm-favorites`, `vtm-language`, `vtm-edition`.
  - Inventory and journal notes live inside the character records.
- **No account / login**. The app never asks for credentials.
- **No cloud sync**. Phone A and Phone B are completely separate stores.
- **Backup / export / import**: an in-app JSON file via Settings → Local
  Data. Round-trip is tested against id remapping and link preservation
  in `services/__tests__/appBackup.test.ts`.

## 2. User-created data that may exist locally

The user may generate any of the following on their device. None of it
leaves the browser unless the user explicitly exports a backup.

- Characters (V5 and classic).
- Character inventory items.
- Character journal / notes (free-text body + category).
- Chronicles, sessions, locations, relationships, link references.
- Favorites (clans, disciplines, rules, characters, chronicles).
- Settings: active language, active edition, cleared-favorites flag.
- Backup JSON files the user downloads or imports (those live in the OS
  file system, outside the app's reach).

## 3. What the app does **not** collect today

Stated as a positive list so the Play Store Data Safety form is trivial
to fill in and the in-app notice is honest:

- **No analytics.** No `gtag`, no Plausible, no GA4, no first-party
  beacons.
- **No tracking / fingerprinting.** No cookies set by app code.
- **No third-party scripts at runtime** beyond the Google Fonts
  stylesheet links in `index.html` (which the browser fetches
  directly, not the app). When we add a service worker, we can decide
  whether to inline those fonts to remove even that single call.
- **No user database**, server-side or otherwise.
- **No login / OAuth / SSO.**
- **No push notifications**, no background sync.
- **No microphone / camera / geolocation / contacts / clipboard
  reads** unless an explicit feature is added behind a permission
  prompt. None today.

## 4. Backup / export / import expectations

- **Export** writes a single JSON file named
  `vtm-companion-backup-YYYY-MM-DD.json` containing every persisted
  record (envelope `_vtmAppBackup: true`, `backupVersion: 2`).
- **Import** is **additive**: it never overwrites or deletes existing
  records. Character IDs and chronicle IDs are remapped on import so a
  user can safely import the same backup multiple times without losing
  data; links between sessions/locations/relationships and their
  characters are re-resolved against the new IDs.
- **Where the file lives** is the OS file system the user chose
  (Downloads on most browsers). The app never touches it after the
  download / upload event.

The in-app messaging should make all three of these statements obvious to
the user without surfacing implementation detail.

## 5. Risks (what can lose user data)

In rough order of likelihood:

- The user clears the site's storage from the browser settings.
- The user uninstalls the PWA (browsers usually clear storage with the
  app).
- The user loses the device.
- The user reaches the localStorage quota (~5–10 MB depending on
  browser) and the next write fails.
- The user is on a **shared device** with multiple browser profiles
  and uses the "wrong" one.
- iOS Safari evicts the standalone PWA's storage after long inactivity
  (~7 days under low-storage conditions).
- The user imports a stale backup expecting it to merge cleanly (it
  does, but they may not realize duplicates can result).

The mitigation in every case is the same: **export a backup regularly**.
The in-app notice exists to keep that habit visible.

## 6. Play Store / public release: privacy policy needs

Google Play's Data Safety form requires a public URL stating what data
is collected and how it is used, even when the answer is "none". Apple
App Store has similar requirements. The shortest honest version of the
form for this app is:

- **Data types collected**: None.
- **Data shared with third parties**: None.
- **Data deleted on request**: All data lives on the user's device. The
  user can delete it any time via the browser's "Clear site data" or by
  uninstalling the app.
- **Security practices**: All data is stored locally; nothing is
  transmitted to a server controlled by us.
- **Children's data**: None collected.

A public privacy policy URL must back this up. Until we have a hosted
URL, drafting the wording (§7 below) is the meaningful step.

## 7. Suggested public privacy policy wording (draft, for later)

Not committed in this checkpoint. Hold for when there is a public URL
to host it at (a docs site, a Notion page, a GitHub Pages site, etc.).

> **VTM Companion — Privacy Policy**
>
> VTM Companion is an unofficial fan-made companion for tabletop play.
> It is a static web app with no backend.
>
> **What we collect.** Nothing. The app does not collect any personal
> information, does not require an account, does not log analytics, and
> does not contact any server we control. The browser may fetch a few
> static resources (the app's JavaScript, CSS, fonts, and icons) from
> the hosting provider when the page loads; this is normal web traffic
> and is not used to identify or track users.
>
> **What you store locally.** Characters, chronicles, sessions,
> locations, relationships, journal notes, favorites, and your
> language / edition preferences are saved only in your browser's
> local storage on the device where you use the app. They are not
> transmitted off the device.
>
> **Backups.** You can export and import a JSON backup file at any time
> from Settings → Local Data. The file lives wherever your browser
> downloaded it; only you decide what happens to it.
>
> **Deleting your data.** You can delete everything by clearing site
> data in your browser's settings or by uninstalling the installed
> app. There is no remote copy.
>
> **Children's data.** We do not knowingly collect data from anyone,
> including children.
>
> **Changes.** If this policy changes, the updated version will appear
> at this URL.
>
> **Contact.** [maintainer contact placeholder]

## 8. Suggested fan-made legal disclaimer wording (draft, for later)

Already in use in-app under `strings.settings_about_disclaimer`. The
canonical phrasing:

> **VTM Companion is an unofficial fan-made tool and is not affiliated
> with, endorsed by, or sponsored by the rights holders.**
>
> Rights to Vampire: The Masquerade and related trademarks belong to
> their respective owners (currently Paradox Interactive / World of
> Darkness).

For the Play Store listing description we should add this same line near
the top so reviewers see it before installing.

## 9. Where notices should appear in the app

| Surface                                              | What it carries                                                              | Status today              |
|------------------------------------------------------|------------------------------------------------------------------------------|---------------------------|
| Settings → Data & Legal card                         | "Data is stored locally…" + fan-made disclaimer                              | **Added this checkpoint** |
| Settings → About card                                | App name; the previous disclaimer line is kept here too for continuity        | Already present           |
| Play Store listing description (when listed)         | Fan-made disclaimer near the top + link to privacy policy                    | Future                    |
| Public privacy policy URL                            | Full text from §7                                                            | Future                    |
| First-install toast inside the installed PWA         | "Your data lives on this device — export a backup regularly"                  | Future (see §11)           |
| Pre-destructive-action confirmation modals           | "Export a backup first?" suggestion                                          | Future                    |

We keep the **About** disclaimer as the IP-attribution surface, and the
new **Data & Legal** card as the user-action surface (data-storage
reminder + the IP disclaimer restated for context).

## 10. What we must **not** claim

The notices must not, today or later, imply any of the following:

- Official affiliation, endorsement, or sponsorship by the rights
  holders.
- Cloud backup, cross-device sync, or guaranteed data recovery.
- Server-side storage of any kind.
- The app reading or writing data the user did not explicitly enter.
- Account / login / "sign in to save" semantics.
- Any claim that backup files are encrypted or password-protected
  unless we actually implement that (they are not today).

If a future checkpoint adds cloud sync, every one of these statements
must be revisited at the same time.

## 11. Recommended future checkpoints

In order; each is small enough to stand alone:

1. **Public privacy policy URL.** Pick a host (docs site / Notion /
   GitHub Pages) and publish §7. Link it from Settings → Data & Legal.
2. **Play Store description text.** Draft the listing copy with the
   §8 disclaimer near the top + link to §7 + a one-line summary of
   §3 (zero data collected).
3. **First-install data-safety toast.** When the app detects a PWA
   standalone launch for the first time, show a one-time toast
   summarizing §1.
4. **Backup reminder banner.** Compute "days since last export";
   surface a soft nudge above the dashboard when above a threshold.
5. **Pre-destructive-action prompts.** Wrap "Reset", "Delete all
   data", and similar actions in a "Export a backup first?" dialog.
6. **About → link to privacy policy** once §1 is live.

None of these change storage behavior — they all change *what the
user sees* about it.

## 12. Do **not** do yet

- **Do not add analytics or telemetry** "just to know how the app is
  used". The whole privacy posture rests on the negative claim in §3.
- **Do not add accounts or cloud sync** under any wording. If a backed
  account is ever added, every notice in this document changes.
- **Do not move the disclaimer to a less visible place** to fit a new
  layout. The Settings surfaces are the floor, not the ceiling.
- **Do not promise encrypted backups** unless we actually implement
  encrypted backups.
- **Do not skip the public privacy URL** before submitting to any
  store. Play Store rejects apps without one.
