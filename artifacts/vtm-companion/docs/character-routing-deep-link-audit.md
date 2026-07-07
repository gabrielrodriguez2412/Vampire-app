# Character deep-link / routing — audit & planning doc

**Batch BK-4 · audit only · no runtime change**

Follows up on:

- [Batch BK — Ghoul regnant/domitor linking audit](./ghoul-regnant-linking-audit.md)

after BK-1 (regnant field + resolver + sheet selector), BK-2
(create-form selector + dangling fallback) and BK-3 (Ghoul Powers
suggestions read the resolved regnant clan) shipped.

This batch answers one engineering question: **what does character
deep-link routing look like today, why did the BK-1 click-through
404, and what is the safe way for BK-5 to add URL-based character
routes?** No runtime files are touched.

Audience: the BK-5 batch author. Every finding cites a file and a
symbol so BK-5 can act without re-running the survey.

---

## 1 · Current routing architecture

- **Library:** [wouter v3.3.5](../package.json) — not React Router.
- **Mode:** browser-history (path) routing, **not** hash routing.
  There is no `useHashLocation` anywhere in the app.
- **Route table:** a single `<Switch>` in
  [App.tsx:30-74](../src/App.tsx) with Spanish-named section routes
  (`/personaje`, `/cronica`, `/ajustes`, `/buscar`, `/compendium/*`,
  legacy `/clanes/:id` aliases) and a catch-all
  `<Route component={NotFound} />` at [App.tsx:69](../src/App.tsx).
- **Base path aware:** the tree is wrapped in
  `<WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>`
  ([App.tsx:90](../src/App.tsx)); `BASE_PATH` is an env-driven Vite
  `base` ([vite.config.ts:7](../vite.config.ts)). Any new route must
  be declared relative (it already is under the wouter base wrapper).
- **Param routes exist and work today:** `/compendium/clanes/:id`,
  `/compendium/disciplinas/:id`, `/compendium/reglas/:id` — read via
  wouter's `useParams()` (e.g. [clans.tsx:57](../src/pages/clans.tsx),
  consumed at [clans.tsx:95-99](../src/pages/clans.tsx)). This is the
  established in-repo pattern BK-5 should copy.
- **Nav active-state already tolerates nested paths:** the layout
  computes `location === href || location.startsWith(`${href}/`)`
  ([layout.tsx:28-29](../src/components/layout.tsx)), so a future
  `/personaje/<id>` keeps the Character tab highlighted with zero
  layout changes.
- **No service worker is registered** (only planned — see
  [service-worker-poc-plan.md](./service-worker-poc-plan.md)), so
  deep-link URL serving is purely a host concern (§8).

## 2 · Current character opening flow

`/personaje` is **one route with internal state**. `CharacterPage`
holds `activeView: 'list' | 'create' | 'sheet'` plus an
`activeChar: Character | null`
([character.tsx:187-188](../src/pages/character.tsx)).

- **Same-page open:** clicking a list card calls `handleOpenSheet`
  ([character.tsx:755-759](../src/pages/character.tsx)) — pure
  `setState`, the URL never changes.
- **Cross-page open (the pseudo-deep-link):** every other surface
  uses a **sessionStorage handshake**: write the target id to the
  `vtm-open-character-id` key, then `setLocation('/personaje')`.
  Producers:
  - Chronicle page — `openCharacterSheet`
    ([chronicle.tsx:332-339](../src/pages/chronicle.tsx))
  - Home dashboard — `openCharacter`
    ([home.tsx:72-75](../src/pages/home.tsx))
  - Favorites — `openCharacter`
    ([favorites.tsx:45-48](../src/pages/favorites.tsx))
  - Global search — entries carry
    `deepLink.sessionKeys` ([search.ts:317](../src/utils/search.ts));
    the dialog writes the keys then navigates
    ([search-dialog.tsx:20-30](../src/components/search-dialog.tsx)).

  The consumer is a **consume-once mount effect** on the character
  page ([character.tsx:525-539](../src/pages/character.tsx)): read
  the key, remove it, `getCharacterById`, and if found switch
  straight into sheet view.
- Several test suites drive the page through this handshake (e.g.
  [characterKindUI.test.tsx:287](../src/pages/__tests__/characterKindUI.test.tsx)),
  so BK-5 must keep it working (or migrate the tests deliberately).

## 3 · Do character sheets have URL routes today?

**No.** There is no `/personaje/:id` (nor `/character/:id`) in the
route table. The URL stays `/personaje` across list ⇄ create ⇄ sheet
transitions. Consequences today:

- Refreshing while a sheet is open lands back on the list (the
  handshake key was already consumed).
- The browser Back button exits the page entirely instead of going
  sheet → list.
- Sheets cannot be bookmarked and other surfaces cannot render an
  `<a href>` to a character — hence the sessionStorage handshake.

## 4 · Root cause of the 404

BK-1 (commit `9057060`) added click-through buttons on the ghoul
sheet's Regnant card that called
`setLocation('/character/${linkedRegnant.id}')`. **No such route was
ever registered** — the prior audit
([ghoul-regnant-linking-audit.md §2.6 / U1](./ghoul-regnant-linking-audit.md))
sketched `/character/<vampireId>` as the target, but adding the route
was never in any batch's scope, and the app's route namespace is
Spanish (`/personaje`) anyway. Navigation therefore fell through the
`<Switch>` to the catch-all `NotFound` route
([App.tsx:69](../src/App.tsx)) — a **client-side 404**, not a server
error. Commit `8c8a108` ("Fix regnant 404 link") removed the buttons
and rendered the linked regnant name as a plain
`<span data-testid="sheet-regnant-name">`
([DynamicSheet.tsx:1721-1735](../src/components/character/DynamicSheet.tsx)),
explicitly deferring deep-link support — to this batch and BK-5.

## 5 · Character IDs — generation, storage, stability

- **Generated:** `crypto.randomUUID()` in `createEmptyCharacter`
  ([characterStorage.ts:392](../src/services/characterStorage.ts)).
- **Stored:** in the character record itself, in a JSON array under
  one localStorage key; `getCharacters()` normalization preserves any
  existing string id and only backfills a fresh UUID when the id is
  missing/malformed
  ([characterStorage.ts:222](../src/services/characterStorage.ts)).
  Within one installation, ids are **stable across sessions** — safe
  to put in a URL for local navigation.
- **Imports deliberately do NOT retain ids** — every import path
  assigns a fresh UUID so existing records can never be overwritten:
  - single-character import —
    [characterStorage.ts:629](../src/services/characterStorage.ts)
  - character-library backup import —
    [characterStorage.ts:742](../src/services/characterStorage.ts)
  - bulk-selection export import —
    [characterBulkExport.ts:173](../src/services/characterBulkExport.ts)
  - full app backup (v2) —
    [appBackup.ts:192](../src/services/appBackup.ts)
- **Known reference gap:** the v2 full-backup import remaps the old
  id → new id for `chronicleId`, session `taggedCharacterIds`,
  location `linkedCharacterIds`, and relationship
  `sourceCharacterId`/`targetCharacterId`
  ([appBackup.ts:210-305](../src/services/appBackup.ts)) — but
  **`regnantCharacterId` is spread through unchanged**, so a ghoul's
  regnant link dangles after every backup → restore round-trip. The
  BK-1 resolver degrades gracefully (falls back to manual clan), so
  nothing crashes, but this contradicts the BK audit's §6 round-trip
  intent. Fixing the remap is a small, self-contained change that
  BK-5 can carry (or a standalone patch can land first). Deep-link
  URLs saved before a restore will similarly point at dead ids —
  another reason BK-5's unresolved-id behavior must be graceful (§7).

## 6 · Chronicle & regnant references — ids, not names

- **Chronicle ⇄ character:** by id in both directions.
  `character.chronicleId` points at a chronicle
  ([characterStorage.ts:213-217](../src/services/characterStorage.ts));
  the chronicle page groups characters by that field and treats
  dangling ids as "unassigned"
  ([chronicle.tsx:264-272](../src/pages/chronicle.tsx)). Sessions /
  locations / relationships store character-id arrays. Names are
  display-only, never keys.
- **Regnant/domitor:** `regnantCharacterId?: string` on
  `BaseCharacter` ([types/index.ts](../src/types/index.ts)), written
  by the create form
  ([character.tsx:591-596](../src/pages/character.tsx)) and the
  sheet's Regnant selector
  ([DynamicSheet.tsx:1302-1311](../src/components/character/DynamicSheet.tsx)),
  resolved read-time by `resolveRegnantClan`
  ([regnant.ts](../src/utils/regnant.ts)). Currently rendered as
  plain text (§4). Everything BK-5 needs to make it clickable is an
  href target.

## 7 · Recommended BK-5 implementation plan

### Route shape (recommended): `/personaje/:id?`

One route, optional param, registered as
`<Route path="/personaje/:id?" component={Character} />` replacing
the current `/personaje` entry (wouter's regexparam matcher supports
optional params; single Route means the page does **not** remount
when moving between `/personaje` and `/personaje/<id>`).

Why this shape:

- Matches the existing param-route pattern
  (`/compendium/clanes/:id`) and the Spanish route namespace. Do NOT
  resurrect `/character/:id` — that is the exact URL that 404'd, and
  it breaks the naming convention.
- UUIDs are opaque and URL-safe; names would leak PII into shareable
  URLs, collide, and break on rename.
- Layout nav highlighting works unchanged (§1).
- Base-path safe under the existing `WouterRouter base` wrapper.

### Steps

1. **App.tsx** — change `/personaje` to `/personaje/:id?`.
2. **character.tsx** — read `useParams().id`:
   - On mount / param change, if `id` is present: `getCharacterById`;
     found → `setActiveChar` + `activeView = 'sheet'`; **not found →
     fall back to the list view with a soft toast** ("Character not
     found"), NOT the 404 page. Character data is per-device
     localStorage — a URL shared to another device, or saved before a
     backup restore (§5), will legitimately not resolve; a hard 404
     would read as breakage.
   - Precedence: **URL param wins over the sessionStorage
     handshake**; consume-and-ignore the handshake key when a param
     is present so the two mechanisms can't fight.
   - Keep the handshake path fully working when no param is present
     (search, tests, and any stale producers keep functioning).
3. **URL sync on in-page navigation** — `handleOpenSheet` also calls
   `setLocation('/personaje/' + char.id)`; back-to-list sets
   `/personaje`; delete/reset of the open character navigates to
   `/personaje` (replace, not push, to avoid a dead history entry).
   This makes browser Back do sheet → list for free.
4. **Migrate producers (optional, low-risk):** chronicle / home /
   favorites / search can switch from the handshake to
   `setLocation('/personaje/' + id)`. Recommend doing home +
   chronicle + favorites in BK-5 and leaving the search
   `deepLink.sessionKeys` mechanism as-is (it is generic and also
   serves chronicles).
5. **Re-enable the regnant click-through** — restore the BK-1 button
   in the Regnant card, now targeting `/personaje/<id>` (both the
   readonly display at
   [DynamicSheet.tsx:1729-1732](../src/components/character/DynamicSheet.tsx)
   and the edit-mode chip at
   [DynamicSheet.tsx:1773-1780](../src/components/character/DynamicSheet.tsx)).
   If BK-5 is kept minimal, this can be split into BK-6, but it is
   ~10 lines once the route exists.
6. **(Carried fix)** remap `regnantCharacterId` through
   `characterIdMap` in `importAppBackup` (§5). Needs a second pass
   (or post-pass) because a ghoul can precede its regnant in the
   backup array.

### Files likely to change

| File | Change |
|---|---|
| `src/App.tsx` | `/personaje` → `/personaje/:id?` |
| `src/pages/character.tsx` | param consumption, precedence over handshake, URL sync on open/close/delete |
| `src/components/character/DynamicSheet.tsx` | restore regnant click-through (BK-5 or BK-6) |
| `src/pages/chronicle.tsx`, `home.tsx`, `favorites.tsx` | optional producer migration to real hrefs |
| `src/services/appBackup.ts` | `regnantCharacterId` remap (carried fix) |
| `src/i18n/ui.ts` | one key: "Character not found" toast (EN/ES) |
| tests | see §8 |

## 8 · Test plan for BK-5

- **Route resolution:** render the router at `/personaje/<valid-id>`
  → sheet view for that character; `/personaje/<unknown-id>` → list
  view + toast, no 404; `/personaje` → list view (unchanged).
- **Precedence:** URL param + a pending `vtm-open-character-id` key →
  param wins, key is cleared.
- **Handshake regression:** the existing handshake-driven suites
  (e.g. `characterKindUI.test.tsx`, `DynamicSheet.regnant.test.tsx`)
  keep passing unmodified.
- **URL sync:** opening a sheet from the list updates the location to
  `/personaje/<id>`; back-to-list restores `/personaje`; deleting the
  open character lands on `/personaje` (replace).
- **Regnant click-through:** linked regnant navigates to the
  vampire's sheet; dangling link renders the existing fallback text
  and no link.
- **Backup remap:** ghoul + regnant exported in a v2 backup, restored
  → the ghoul's `regnantCharacterId` equals the vampire's NEW id.
- **Manual QA:** dev-server hard refresh on `/personaje/<id>` (Vite
  serves the SPA fallback); Back/Forward through list ⇄ sheet.

## 9 · Risks and edge cases

| Risk | Notes / mitigation |
|---|---|
| Hard refresh / direct load on static hosting | Vite dev & `vite preview` serve an SPA fallback, so `/personaje/<id>` works there. A static host without history-fallback rewrites would return a **server** 404 for any deep URL (this affects `/compendium/clanes/:id` today too, so it is not a new class of risk). If such a deployment appears, add a rewrite rule or a `404.html` redirect shim — out of BK-5's scope but worth stating in the PR. |
| URL ids are device-local | localStorage is per-device; shared links won't resolve elsewhere. Mitigated by the soft-fallback-to-list rule (§7 step 2). |
| Imports regenerate ids | Old URLs/bookmarks dangle after restore (§5). Soft fallback covers it. |
| Two open mechanisms fighting | Handshake vs. param — solved by the explicit precedence rule (§7 step 2). |
| Page remount between list and sheet | Avoided by the single `:id?` optional-param route instead of two `<Route>` entries. |
| Archived characters | `getCharacterById` doesn't filter by status — deep links to archived characters open normally (desired; mirrors the regnant resolver's rule). |
| History pollution | Delete / not-found redirects should use `replace` navigation. |
| Scroll reset | Already keyed on `activeChar?.id` ([character.tsx:517-521](../src/pages/character.tsx)) — no change needed. |
| PWA `start_url` | `manifest.webmanifest` points at the root; unaffected by adding a param route. |

## 10 · Dark Pack / copyright safety notes

Routing is pure UX plumbing: no rules text, no setting prose, no
licensed names or artwork are introduced by BK-5. The only new
user-facing string is a neutral "Character not found" toast (EN/ES).

---

*End of audit. No runtime files were modified in this batch. See §7
for the BK-5 entry point.*
