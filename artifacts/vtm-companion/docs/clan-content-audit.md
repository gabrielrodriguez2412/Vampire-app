# Clan Content Audit

Snapshot date: 2026-05-19

This is a developer-facing audit of the clan data in `src/data/clans.ts`
and how those clans are referenced from the Home preview and the
dedicated Clan pages. It is not user-facing copy. Any rewritten clan
summary in this pass is an original short paraphrase — no official book
text was copied.

## Clan inventory (16)

| ID                | Image source                      | Editions                       | Disciplines                                   |
|-------------------|-----------------------------------|--------------------------------|-----------------------------------------------|
| brujah            | `/images/brujah.png`              | 1ST, 2ND, REVISED, V20, V5     | celerity, potence, presence                   |
| gangrel           | `/images/gangrel.png`             | 1ST, 2ND, REVISED, V20, V5     | animalism, fortitude, protean                 |
| malkavian         | `/images/malkavian.png`           | 1ST, 2ND, REVISED, V20, V5     | auspex, dominate, obfuscate                   |
| nosferatu         | `/images/nosferatu.png`           | 1ST, 2ND, REVISED, V20, V5     | animalism, obfuscate, potence                 |
| toreador          | `/images/toreador.png`            | 1ST, 2ND, REVISED, V20, V5     | auspex, celerity, presence                    |
| tremere           | `/images/tremere.png`             | 1ST, 2ND, REVISED, V20, V5     | auspex, blood_sorcery, dominate, thaumaturgy  |
| ventrue           | `/images/ventrue.png`             | 1ST, 2ND, REVISED, V20, V5     | dominate, fortitude, presence                 |
| **lasombra**      | `/images/lasombra.png` *(was opengraph.jpg)*    | 1ST, 2ND, REVISED, V20, V5     | dominate, oblivion, potence, obtenebration    |
| tzimisce          | `/opengraph.jpg` *(was /images/opengraph.jpg — never existed)* | 1ST, 2ND, REVISED, V20, V5     | animalism, auspex, protean, vicissitude       |
| **assamite**      | `/images/banu-haquim.png` *(was opengraph.jpg)* | 1ST, 2ND, REVISED, V20, V5     | blood_sorcery, celerity, obfuscate, quietus   |
| **followers_of_set** | `/images/ministry.png` *(was opengraph.jpg)*  | 1ST, 2ND, REVISED, V20, V5     | obfuscate, presence, protean, serpentis       |
| **giovanni**      | `/images/hecata.png` *(was opengraph.jpg)*      | 1ST, 2ND, REVISED, V20, V5     | auspex, fortitude, oblivion, necromancy       |
| **ravnos**        | `/images/ravnos.png` *(was opengraph.jpg)*      | 1ST, 2ND, REVISED, V20, V5     | animalism, obfuscate, presence, chimerstry, fortitude |
| **salubri**       | `/images/salubri.png` *(was opengraph.jpg)*     | 1ST, 2ND, REVISED, V20, V5     | auspex, fortitude, obfuscate                  |
| caitiff           | `/opengraph.jpg` *(was /images/opengraph.jpg — never existed)* | 1ST, 2ND, REVISED, V20, V5     | *(none — by design)*                          |
| thin_blood        | `/opengraph.jpg` *(was /images/opengraph.jpg — never existed)* | REVISED, V20, V5               | thin_blood_alchemy                            |

**Bold** rows changed in this audit pass.

## Findings

### Image issues found

1. **Six clans had dedicated PNGs available under `public/images/` but
   were still pointing at the `opengraph.jpg` fallback** in
   `clans.ts`: `lasombra`, `assamite`, `followers_of_set`, `giovanni`,
   `ravnos`, `salubri`. The V5-named variants (`banu-haquim.png`,
   `hecata.png`, `ministry.png`) were already present on disk but never
   wired in.
2. **The Home page's `clanImages` override map used V5 alt-name slugs
   as keys** — `banu_haqim`, `hecata`, `ministry` — none of which match
   the canonical clan ids in `clans.ts` (`assamite`, `giovanni`,
   `followers_of_set`). As a result the Home preview cards for those
   three clans silently fell back to `opengraph.jpg`.
3. **Three clans have no dedicated image**: `tzimisce`, `caitiff`,
   `thin_blood`. The shared `opengraph.jpg` fallback is the intentional
   placeholder for these — flagged below under Needs Review.

### Image issues fixed

- `clans.ts` `bannerImage` updated on the six clans listed above to
  point at their respective PNGs.
- `home.tsx` `clanImages` override map rekeyed by canonical clan ids
  (`assamite`, `giovanni`, `followers_of_set`) with inline comments
  noting the V5 rename. Added a clarifying jsdoc explaining the map's
  role.
- Home preview render now falls through to `clan.bannerImage` when the
  override map has no entry, and only uses `/images/opengraph.jpg` as a
  last resort. This means future clan additions in `clans.ts` light up
  on the Home preview automatically as long as their `bannerImage` is
  set.
- **Stale `/images/opengraph.jpg` path fixed in three clans.**
  `tzimisce`, `caitiff`, and `thin_blood` declared
  `bannerImage: "/images/opengraph.jpg"`, but the actual asset lives
  at `public/opengraph.jpg`, not `public/images/opengraph.jpg`. Those
  three references were corrected to `/opengraph.jpg` so the image
  resolves in production. The Home preview's last-resort fallback was
  aligned to the same canonical path.

### Discipline links

- Every clan's `disciplines[]` entries still resolve to a known
  discipline id, and every discipline still lists the clan in
  `clansWhoUse` — locked in by the existing
  `src/data/__tests__/disciplines.test.ts` regression test, which still
  passes after this audit. No discipline data was touched.

### Summary / lore wording

The existing `summary` and `lore` strings on each clan are short,
original-feeling paraphrases of well-known clan flavor (e.g., Brujah as
"rebels and idealists", Nosferatu as "deformed information brokers").
None of them are direct excerpts from copyrighted books. They were not
modified in this pass.

If a future copyright-conscious rewrite is needed, the wording
guideline is: 1–2 short original sentences describing the clan's
*functional* role in play, no book prose.

## Needs Review (not fixed in this pass)

1. **Tzimisce, Caitiff, and Thin-Blood do not have dedicated images.**
   They share the `opengraph.jpg` fallback. If brand-safe original or
   royalty-free art is added later, drop the file in
   `artifacts/vtm-companion/public/images/` and update
   `bannerImage` in `clans.ts` plus (optionally) the `clanImages`
   override in `home.tsx`. The new regression test enforces that any
   `bannerImage` PNG path actually exists on disk.
2. **Salubri's third discipline and Ravnos's combined list** remain the
   open content questions from the Phase 1 discipline audit. Out of
   scope here.

## Schema / routing

- No storage schemas changed.
- No routes changed; clan deep links (`/compendium/clanes/:id`) and
  clan→discipline deep links continue to work via the existing
  `pages/clans.tsx` and `pages/disciplines.tsx` flows.
- No new i18n labels were needed for the original audit pass. Batch C
  later added the new browse-control strings under the `clans_*`
  i18n key family (see `i18n/ui.ts`).

---

## Batch C — Mobile browsing + sect labels (later pass)

### What landed

- `ClanEntry` gained an optional `sectByEdition` field
  (`Partial<Record<EditionId, Record<LangCode, string>>>`). The
  universal `sect` field stays as the classic-era default; the new
  field carries V5 overrides where a clan's affiliation shifted
  meaningfully between editions. Resolved by `getClanSect()` in
  `utils/content.ts`.
- Explicit V5 overrides are applied to:
  - **Brujah** — Anarch-first label.
  - **Lasombra** — Camarilla (post-defection).
  - **Tzimisce** — Anarch / Independent (post-Sabbat).
  - **Banu Haqim** (`assamite`) — Camarilla.
  - **The Ministry** (`followers_of_set`) — Anarch.
  - **Caitiff** — Unaligned.
  - **Thin-Blood** — Unaligned.
- All universal `sect` strings now carry a real Spanish value
  ("Anarch" → "Anarquista", "Independent" → "Independiente",
  "Unaligned" → "Sin facción"). Spanish mode no longer falls back to
  English for the sect chip.
- The Clans page renders the resolved label on both the card and the
  detail header.

### Still needs review (deferred from Batch C)

1. **Per-classic-edition nuance on a few clans.** The current
   `sect` field treats 1ST / 2ND / REVISED / V20 as one bucket. A
   few clans were not in the same place across that whole span:
   - **Gangrel** were Camarilla in 1ST and 2ND, then formally left
     the sect mid-REVISED. The shipping label leans modern
     ("Independent / Anarch"), which is correct for REVISED / V20
     but slightly modern-leaning for 1ST / 2ND. Acceptable for a
     quick-reference card; a future pass could add
     `sectByEdition["1ST"]` and `sectByEdition["2ND"]` entries.
   - **Lasombra** were unambiguously Sabbat until late V20; the
     current "Sabbat / Camarilla" composite is forward-leaning for
     1ST / 2ND. A future pass could add a Sabbat-only label for the
     older editions.
   - **Banu Haqim / Assamite** sat differently across the classic
     run too; the composite label is acceptable but not granular.
   - **Tremere** also shifted post-Modern-Nights events; a future
     pass could surface "Camarilla / Independent" for V5
     specifically.
2. **Bloodlines vs. full clans.** The data file currently treats
   every entry uniformly as `ClanEntry`. The Companion has no UI
   distinction yet between full clans (Brujah, Ventrue, …),
   officially-recognized bloodlines, Caitiff, and Thin-Bloods.
   Adding a `type: 'clan' | 'bloodline' | 'caitiff' | 'thin-blood'`
   field would unlock a clean clan-type filter chip. Deferred so the
   shipping browse UI stays small.
3. **PT / FR / DE / IT sect translations.** The sect labels fall
   back to English in those locales. Mechanical translation pass
   when a translator gets to them.
4. **Clan summary / lore localization beyond EN.** Many clans only
   have English `summary` / `lore`. The page already surfaces the
   "[content not available in this language]" badge for the missing
   ones; the gap is content, not UI.

### Tests pinning the contract

- `src/utils/__tests__/clanFilter.test.ts` exercises
  `applyClanFilters` (edition + search + sect filter + sort) and
  `getActiveSectTokens`, including:
  - V5 Banu Haqim resolution from a "banu" search,
  - cross-locale sect search (ES session, EN query),
  - alpha vs. default sort order,
  - the explicit V5 sect overrides for Lasombra, Banu Haqim, the
    Ministry, Caitiff, and Thin-Bloods.

### Missing localized clan content — pre-release blocker

Several clans only ship English `summary` / `lore` (and in some cases
English `weakness` / `sect`). The detail page currently surfaces an
amber "contenido no disponible en este idioma" notice for the missing
ones, which is acceptable as an interim state but **must not remain in
the final release build**. Priorities:

1. **English** — must be 100% complete on every clan, every
   edition-availability row, for every visible field
   (`name`, `summary`, `weakness`, `lore`, `sect`,
   `sectByEdition` where present).
2. **Spanish** — the project's second first-class locale. Same
   completeness bar as English.
3. **pt / fr / de / it** — fall back to English at render time via
   `getText`. Not blocking for the first release but should not
   block players who happen to read those languages either; pick
   them up in a follow-up pass.

The "[content not available in this language]" badge and the
`isAvailableInLang` check in `pages/clans.tsx` are intentional
guardrails for the transitional state; do not remove them, just fill
the data underneath until the badge stops appearing for ES and EN.

### Batch C follow-up — Clan detail hero responsive fix

Phone-landscape (e.g. 844×389) showed the back button and the
sect/clan-name block colliding inside the previous `short-landscape:h-24`
hero. Brujah and Ventrue under Spanish (longer "Volver a clanes"
button + multi-word sect) were the most visible offenders. The fix is
layout-only — `pages/clans.tsx` now:

- gives the hero `short-landscape:h-32` so the chip and title block
  each have their own vertical band,
- shrinks the back chip in landscape (`h-7`, `px-2`, `text-[10px]`,
  smaller chevron) and clamps it to `max-w-[40%]` with truncation so
  the Spanish label can shorten gracefully,
- reduces the title row in landscape (`text-xl` h2, smaller icon and
  gap, `flex-nowrap` so the favourite button never drops to a second
  row), and
- shrinks the favourite chip (`h-7 w-7`) in landscape.

No data change; no other surface changed.
