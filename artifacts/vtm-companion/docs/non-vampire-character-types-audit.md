# Non-vampire character types — audit & implementation plan

**Batch AW · audit only · no runtime change**

This document captures the work needed to extend the VTM Companion to
non-vampire character types — humans and ghouls first, with room for
future kinds (mortals tied to a coterie, hunters, etc.) — without
degrading the existing vampire experience. **No code or schema
changes are made in this batch.** Phase numbers in this doc map to
future implementation batches.

Audience: future batch authors. Where possible each finding cites a
file path and a symbol so the next batch can act without re-running
the survey.

---

## 1 · Current assumptions that imply "character == vampire"

The app today treats every character as a vampire. The strongest
signals were verified at the symbol level:

| # | Assumption | Evidence | Severity |
|---|---|---|---|
| 1 | A character must have a clan to be created | `src/pages/character.tsx` — the new-character form's `handleCreate` gate is `if (!newName.trim() || !newClan) return;`. The clan `<select>` carries `<option value="" disabled>` and there is no path to skip it. | **Hard** — blocks creation flow. |
| 2 | Storage normalization defaults a missing clan to `'brujah'` | `src/services/characterStorage.ts` `getCharacters` — `clan: typeof c?.clan === 'string' ? c.clan : 'brujah'`. Note: an *empty string* clan survives normalization (it is a string); only `undefined` / non-string is replaced. | **Soft** — preserves any explicit "no clan" sentinel, but a legacy character truly missing the field becomes a Brujah. |
| 3 | Export/import requires `clan: string` | `validateCharacterExport` and `validateCharacterBackup` both fail with `'Invalid file: character has no clan.'` when `typeof char.clan !== 'string'`. An empty string passes; an omitted key fails. | **Soft** — easy to relax once a non-string sentinel is needed. |
| 4 | The V5 / classic union doesn't have a "kind" discriminator beyond PC/NPC | `src/types/index.ts` — `Character = V5Character \| ClassicCharacter`. The only character-shape switch in code is `edition`. `CharacterType = 'player' \| 'npc'` exists but only labels the row in the list UI. | **Architectural** — adding humans/ghouls needs a new discriminator, separate from edition and from PC/NPC. |
| 5 | Sheet schemas bake in vampire-only fields | `src/data/characterSheets/v5.ts` includes `bloodPotency`, `hunger`, `humanity`, `predatorType`, `resonance`, `disciplines`. `classic.ts` includes `bloodPool`, `virtues`, `generation`, `humanity`, `disciplines`. There is no schema variant that omits these. | **Soft** — `getSchemaForEdition(edition)` is the seam; a parallel `getSchemaForKind(kind, edition)` would slot in cleanly. |
| 6 | Humanity defaults to 7 for both editions on creation and on load | `createEmptyCharacter` and `getCharacters` both seed `humanity: 7`. The sheet & print view render it unconditionally. | **Soft** — a human/ghoul schema can omit Humanity; the underlying value can stay in storage harmlessly. |
| 7 | The discipline system is clan-driven | `DynamicSheet.getSuggestedDisciplineIds(clan, edition, …)` and `src/data/clanDisciplines.ts`. Suggested-discipline tooling assumes a clan; a blank clan returns `[]` (safe) but the UI offers no "no powers" affordance. | **Soft** — extension point. |
| 8 | Trackers are schema-driven (good news) | `DynamicSheet`'s `special-health`, `special-willpower`, `special-disciplines`, `special-hunger` branches only render when the schema lists them. | **Extension point** — already pluggable per schema. |
| 9 | Character cards lean on clan visuals | `src/pages/character.tsx` row identity (`data-clan={char.clan}`, clan icon, clan display name) and `home.tsx` clan icon helper fall back to 🦇 / the raw id, so a blank clan reads as sparse rather than broken. | **Cosmetic** — looks reasonable as-is; ideally non-vampires get a different glyph (mortal silhouette, etc.). |
| 10 | The clan filter dropdown lists only clans that appear on saved characters | `character.tsx` `uniqueClans` is derived from data. Humans (`clan: ''`) would never appear as a filter chip, so filtering "show humans only" is not natively expressible. | **Soft** — UI gap, not a data gap. |
| 11 | Random generator pools are edition-segregated but not kind-aware | `src/data/characterGenerator.ts` — `GeneratorField` and pools split by V5 vs classic. `isFieldAvailable` gates Suggest buttons by pool size, so removing/adding pools for humans would gate the UI automatically. | **Extension point** — add pools, no form refactor required. |
| 12 | Chronicle linking, favorites, search, glossary, roleplay, tools — all character-agnostic | `setCharacterChronicle`, favorites by typed id, full-text search, glossary entries, etc. None inspect vampire-only fields. | **No work needed.** |

### What is NOT hardwired (encouraging seams)

- `getSchemaForEdition` in `editions.ts` already abstracts schema
  selection.
- `DynamicSheet` reads everything through `field.type` + `field.id`;
  the V5/classic split is data-driven.
- `CharacterPrintView` emits identity rows conditionally
  (`if (character.concept) push…`), so non-vampire characters with a
  thinner identity block automatically render fewer rows.
- Export/import preserves any extra fields because the envelope is a
  `JSON.parse(JSON.stringify(char))` blob.
- The `characterType: 'player' \| 'npc'` discriminator already exists
  in the type system, in storage, and in the UI — even though its
  current vocabulary doesn't cover humans/ghouls, the **pattern** of
  branching on a character-shape discriminator is already established
  and tested.

---

## 2 · Files & modules likely to change

Grouped by phase. Paths are relative to `artifacts/vtm-companion/`.

### Phase 1 — data model + creation option (minimum viable change)

- `src/types/index.ts` — add a `kind` (or `characterKind`) discriminator.
- `src/services/characterStorage.ts` — `createEmptyCharacter`,
  `getCharacters` normalization, `validateCharacterExport`,
  `validateCharacterBackup`. Relax the clan-required default; preserve
  saved characters that legitimately have no clan.
- `src/pages/character.tsx` — character-type selector in the
  create/edit dialog; gate the clan dropdown by kind.
- New: `src/services/__tests__/characterKind.test.ts` and a small
  paired test in `character.tsx` for the new selector.

### Phase 2 — basic human / ghoul sheets

- `src/data/characterSheets/human.ts` — new schema.
- `src/data/characterSheets/ghoul.ts` — new schema (vampire-adjacent;
  see §4 for which fields it inherits).
- `src/data/characterSheets/editions.ts` — extend the selector to
  `getSchemaFor(kind, edition)`.
- `src/components/character/DynamicSheet.tsx` — already schema-driven;
  expected to need only minor branching for "no clan" headers.
- New: schema-presence tests like the existing
  `CharacterSheetI18n.test.tsx` "carries the canonical fields" suite.

### Phase 3 — ghoul-specific traits / powers

- `src/utils/clanDisciplines.ts` (or a sibling helper) — wire the
  ghoul's reduced discipline access to the regnant vampire's clan, if
  in scope.
- `src/components/character/DynamicSheet.tsx` — extend the suggested-
  discipline path to handle a "borrowed-clan" mode where applicable.

### Phase 4 — print / export / import polish

- `src/components/character/CharacterPrintView.tsx` — already
  schema-aware; expected adjustments are limited to identity rows for
  non-vampires (e.g., "Regnant" instead of "Sire" for ghouls).
- `src/services/characterStorage.ts` — bump
  `EXPORT_VERSION` / `BACKUP_VERSION` only if the on-disk shape
  becomes incompatible; otherwise leave unchanged so old backups still
  import.
- Update Card filters (`character.tsx`) so non-vampires can be sorted /
  filtered as a first-class group.

### Out of scope for this audit

- Home / favorites / search / chronicle / glossary / roleplay /
  tools / service-worker / manifest / image assets.
- Dice mechanics, Rouse Check, Blood Pool tracker components — these
  stay gated by edition / schema as they already are.

---

## 3 · Recommended data model approach

### Option A — a `kind` discriminator on the existing union (recommended)

```
type CharacterKind = 'vampire' | 'human' | 'ghoul';

interface BaseCharacter {
  …existing fields…
  /** Defaults to 'vampire' on read when absent. New characters can
      choose any kind; legacy characters keep loading as vampires
      with no data migration. */
  kind?: CharacterKind;
}
```

Why:

- Mirrors the **shape** of the existing `characterType: 'player' | 'npc'`
  pattern: a small string union that lives on every character and is
  normalized on load.
- Avoids splintering `Character` into a four-way union with five
  interfaces. The discriminator stays orthogonal to `edition`, so a
  classic-V20 human and a V5 human share the same `kind === 'human'`
  branch while each picking up edition-appropriate trackers (Health,
  Willpower).
- Default-on-load to `'vampire'` makes every existing saved character
  load identically. No migration needed.
- Validation can soften gradually: relax `clan: string` to `clan?: string`
  only when `kind !== 'vampire'`.

### Option B — separate `HumanCharacter`, `GhoulCharacter` interfaces

Cleaner type guarantees, but doubles the surface area in
`characterStorage.ts` (every read/write site needs a switch over the
new union arms) and forces every consumer to handle the union
exhaustively. **Not recommended** — the friction outweighs the type
safety win, and the existing `DynamicSheet` is already a runtime
schema engine that doesn't need typed access.

### Option C — keep one interface, drop required fields to optional

Simplest, but loses the discriminator entirely. Code that decides
"render Hunger" would have to infer kind from "does this V5 character
have a hunger value > 0", which is brittle. **Not recommended.**

### Schema selection

Replace `getSchemaForEdition(edition)` with a routing helper such as
`getSchemaForCharacter(character)` that consults both `kind` and
`edition`. Each kind has at most two schemas (V5 and classic). Today
this is 2 schemas; with humans and ghouls it would grow to ~6 — still
flat, still data-driven.

### Storage normalization

- On read, if `kind` is absent → default to `'vampire'` (existing
  characters keep their current shape).
- If `kind === 'vampire'` → keep all current defaults (Hunger,
  Humanity 7, Blood Pool, Blood Potency, etc.) untouched.
- If `kind === 'human'` → do not seed clan; do not seed
  Hunger/Generation/Blood Pool/Blood Potency. Keep Humanity optional
  (some Storytellers track it for mortals, some don't).
- If `kind === 'ghoul'` → seed a small Blood Pool (1–3 dots is the
  common shape but exact numbers stay out of code; the schema can
  ship a tracker with an editable max).

### Export / import compatibility

- Bumping `EXPORT_VERSION` is **not** required because adding an
  optional discriminator field is additive. An older client importing
  a newer file would silently drop `kind` and treat the character as
  a vampire — which means a ghoul exported from a newer build would
  look like a "Brujah ghoul with no Hunger" on an old client. That's
  acceptable read-degradation, not data loss.
- Loosen the clan-required validation in
  `validateCharacterExport` / `validateCharacterBackup` to require
  clan **only** when `kind` is `'vampire'` (or absent). Once relaxed,
  files with `clan: undefined` import cleanly.

---

## 4 · Recommended UX approach

### Creation flow

- The first step of the new-character dialog gains a single new
  control: **"What are you playing?"** with three choices —
  *Vampire* (default, current behavior), *Ghoul*, *Human*.
- Selecting Vampire → existing form, unchanged.
- Selecting Ghoul → keeps the edition selector, keeps a clan
  selector (the regnant's clan), drops Hunger / Generation; shows
  a small Blood Pool tracker.
- Selecting Human → keeps the edition selector (the edition still
  drives the Attribute/Ability vocabulary), removes the clan
  selector entirely, removes all vampire-only fields.
- The PC/NPC toggle is orthogonal and survives all three modes.

### Sheet UX

- Identity block uses the same field grid; non-vampires simply have
  fewer rows.
- A discreet pill ("Human", "Ghoul") near the character name on the
  sheet header and on the character card makes the kind scannable in
  the list.
- Card identity row: if `clan` is empty, fall back to the kind label
  ("Human", "Ghoul · Brujah-bound") rather than the bare bat
  watermark.

### Filtering

- The character list's existing edition / clan filters gain a new
  *Kind* facet (Vampire / Ghoul / Human / All). The default stays
  *All* so the experience for existing users is identical.

### Generator

- Add a small set of human-flavored pools (concepts like
  "investigative journalist", "ER nurse on the night shift",
  appearance/personality lines that don't reference fangs or thirst).
- `isFieldAvailable` already gates Suggest buttons by pool size, so
  vampire-only fields (Predator Type, Generation, Ambition/Desire as
  V5 specifics) naturally vanish for humans without any conditional
  in the form.

### Print

- Print view continues to be schema-driven. Adjust two identity-row
  labels for ghouls ("Sire" → "Regnant"). No other print changes
  needed in Phase 1.

---

## 5 · Edition-specific considerations

- **V5.** Hunger, Blood Potency, Predator Type, Resonance,
  Touchstones, Convictions — all vampire-only. Humans on V5 lose
  every one of these. Ghouls on V5 lose Hunger + Predator Type but
  may keep a small Blood Pool and a single discipline at level 1.
- **V20 / Revised / 2nd / 1st (classic).** Blood Pool, Generation,
  Virtues, Disciplines, Path/Humanity — vampire-defining. Classic
  ghouls keep a small Blood Pool and one discipline at level 1.
  Classic humans lose all of the above.
- **Health & Willpower** behave the same across editions and across
  kinds. Mortals and ghouls keep the same edition-appropriate
  trackers as vampires, just with smaller defaults.
- **Humanity / Path.** Vampires use the existing field. Ghouls
  typically keep a Humanity track. Humans may or may not — make it
  optional via schema. Do **not** copy any rulebook prose into the
  app explaining the difference.

---

## 6 · Export / import compatibility risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Old client opens a backup containing humans/ghouls | High | They will load as vampires with default clan/hunger/humanity. The data round-trips losslessly because the unknown `kind` field is preserved through `JSON.parse(JSON.stringify(char))` — only the *interpretation* degrades. Acceptable. |
| New client opens an old backup | Always | `getCharacters` defaults missing `kind` to `'vampire'` → every existing character keeps its current shape. **Zero migration.** |
| Clan validation rejects new human exports | Medium if missed | Relax `validateCharacterExport` and `validateCharacterBackup` to require `clan` only when `kind` is `'vampire'` or absent. |
| `EXPORT_VERSION` confusion | Low | Adding optional fields never requires a version bump in this codebase's convention. Leave the constant alone. |
| Full-app backup mixes kinds | Low | `buildCharacterBackup` already serializes the whole array; it doesn't filter by edition or clan, so mixed-kind libraries backup and restore correctly with the relaxed validators. |

---

## 7 · Testing strategy

Per phase, ship these test groups:

### Phase 1

- `kind` defaults to `'vampire'` on read for legacy saved characters
  (storage normalization).
- A character created with `kind: 'human'` survives a save → load →
  export → import round trip with `kind` intact.
- A character with `kind: 'human'` and `clan: undefined` passes both
  export and backup validators.
- The create-character dialog renders the new kind selector and
  removes the clan select when *Human* is chosen.

### Phase 2

- `getSchemaFor(character)` returns the human schema for
  `{ kind: 'human', edition: 'V5' }` and the ghoul schema for
  `{ kind: 'ghoul', edition: 'V20' }`.
- `human.ts` and `ghoul.ts` audit-style tests in the same shape as
  the existing `CharacterSheetI18n.test.tsx` ("V5 schema carries
  Hunger, Blood Potency, …") so each kind locks its required
  fields and **forbids** the cross-kind ones.
- A V5 human renders without a Hunger tracker; a classic ghoul
  renders Blood Pool with a small default max.

### Phase 3

- Suggested disciplines for a ghoul use the regnant's clan, if that
  link is added.
- Discipline UI never lists more than one discipline for ghouls.

### Phase 4

- `CharacterPrintView` for a human emits an identity block with no
  Hunger / Blood Pool / Generation rows.
- Backup containing one of each kind round-trips through `validate*`
  + `importCharacter` losslessly.
- Card filter chips include a Kind facet; selecting "Human" filters
  out vampires and ghouls.

The existing 1,153 tests should pass at every phase boundary — any
regression on a vampire-only test is the canary that a Phase 1 default
slipped.

---

## 8 · Implementation phases

| Phase | Scope | Risk | Approx. files touched |
|---|---|---|---|
| **1 — Data model & creation option** | Add `kind` discriminator (default `'vampire'`), expose a kind selector in the create dialog, relax clan validation when `kind !== 'vampire'`. No new schemas. Humans/ghouls land as vampire-shaped characters with an extra label. | Low — additive. | 5–7 files, ~200 lines. |
| **2 — Basic human/ghoul sheets** | Add `human.ts` and `ghoul.ts` schemas, route them via `getSchemaFor`, ensure DynamicSheet renders cleanly with the smaller field sets. | Medium — needs careful audit tests so nothing on the vampire path regresses. | 4–6 files, ~400 lines. |
| **3 — Ghoul-specific traits/powers** | Wire ghoul discipline access (single power at level 1, optionally tied to regnant clan). Optional: a small "regnant" identity row. | Medium — touches the suggested-discipline path. | 2–3 files, ~150 lines. |
| **4 — Print / export polish + filters** | Add the Kind filter facet to the character list, polish print labels, ensure backup round-trip tests cover mixed-kind libraries. | Low — mostly UI + tests. | 3–4 files, ~250 lines. |

Phases 1 and 2 are independently shippable. Phase 3 depends on Phase 2.
Phase 4 can ship after Phase 1 (Kind filter) and after Phase 2 (print
labels) independently.

---

## 9 · Risks and decisions needed before implementation

1. **Discriminator name.** `kind` vs `characterKind` vs an extension
   of the existing `characterType: 'player' \| 'npc'`. The cleanest
   shape keeps `characterType` for PC/NPC and adds a separate
   discriminator (recommendation: `kind`).
2. **Ghoul discipline coupling.** Should a ghoul carry a free-text
   "regnant" reference and pull suggested disciplines from that
   regnant's clan, or just expose the full discipline list and let
   the player pick one? The former is more useful but couples
   character records.
3. **Humanity for mortals.** Render-by-default, schema-omitted, or
   schema-optional? Different tables expect different things.
4. **Whether Ghoul retains a clan in the data model.** Two valid
   shapes: ghouls keep `clan` (their regnant's), or ghouls store
   nothing and a sibling `regnantClanId` carries the link. The
   former is simpler; the latter clarifies intent on the card.
5. **Card iconography for non-vampires.** Bat watermark needs a
   sibling glyph. Out of scope for this audit; pick during Phase 2.
6. **Generator pool scope.** How much human-flavored content to
   ship in the initial Phase 2. Suggestion: a minimal English seed
   (4–6 concepts, 4–6 appearance lines, 4–6 personality lines) +
   Spanish, leaving expansion for a content batch.
7. **Localization.** New kind labels need EN + ES at minimum. The
   `home_*` keys already use the same partial-EN/ES pattern that
   would apply here.

None of these block the audit. All seven decisions can be made when
Phase 1 starts.

---

## 10 · Recommended first implementation batch

**Phase 1 — Data model & creation option. ~5–7 files, ~200 lines.**
Scope it explicitly to:

- Add `CharacterKind = 'vampire' \| 'human' \| 'ghoul'` to
  `src/types/index.ts`.
- Add `kind?: CharacterKind` to `BaseCharacter`.
- Normalize on read: if absent → `'vampire'` (so the entire existing
  test suite remains green).
- Add a *Kind* select to the create dialog. When *Human* is chosen,
  hide the clan dropdown and skip `createEmptyCharacter`'s clan
  requirement. When *Ghoul* is chosen, keep the clan dropdown
  labelled as "Regnant clan" but otherwise unchanged.
- Relax clan validation in `validateCharacterExport` and
  `validateCharacterBackup` to require `clan: string` only when
  `kind` is `'vampire'` or absent.
- **Do not change** sheet schemas, sheet rendering, print output, or
  filters yet. A Phase 1 human/ghoul renders exactly like a vampire
  with a label — that is intentional and lets us prove the data
  layer is sound before touching UI surface area.

Acceptance gates for Phase 1:

- Every existing vampire test passes unchanged.
- Loading a saved vampire backup yields characters with
  `kind: 'vampire'` (after normalization).
- Creating a human → saving → loading round-trips with `kind: 'human'`
  and no spurious clan.
- Importing a Phase 1 human into a pre-Phase-1 build degrades
  gracefully (the user sees a vampire-shaped character — no crash,
  no data loss).

After Phase 1 lands and is verified on real data, Phase 2 adds the
two new schemas. That keeps the riskiest UI changes behind a flag of
"there's a data shape that can carry them" so we never have to roll
back schemas after they ship.

---

*End of audit. No runtime files were modified in this batch. See
§10 for the next-batch entry point.*
