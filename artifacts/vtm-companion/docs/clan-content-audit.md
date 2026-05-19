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
- No new i18n labels were needed.
