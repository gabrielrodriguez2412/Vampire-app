# Ghoul Disciplines / Powers — audit & planning doc

**Batch BI · audit only · no runtime change**

Follows up on:

- [Batch AW — non-vampire character types audit](./non-vampire-character-types-audit.md)
- [Batch AZ — Human/Ghoul sheet refinement audit](./human-ghoul-sheet-refinement-audit.md)
- [Batch BE — Human/Ghoul morality tracking audit](./human-ghoul-morality-tracking-audit.md)
- [Batch BF — Ghoul vitae tracking audit](./ghoul-vitae-tracking-audit.md)

after AX (kind discriminator + creation), AY (basic mortal schemas),
BA (print/storage cleanup + Kind filter), BB (sheet identity
refinement), BC (kind-aware generator content), BD (ghoul regnant
identity / ES terminology), BE-1 (opt-in morality toggle), BE-2
(opt-in morality print parity), BG (opt-in Ghoul Vitae toggle), and —
in-flight — BH (V20 Ghoul Vitae print parity) shipped.

This batch answers a single product question: **should Ghouls (and,
defensively, Humans) carry a Disciplines / Powers section, and if so
how?** No runtime files are touched.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current behavior (post-Batch BG; orthogonal to BH)

### Storage (`src/services/characterStorage.ts`)

- `createEmptyCharacter` always seeds `disciplines: {}` on the base
  character ([:404](src/services/characterStorage.ts:404)),
  regardless of `kind` or `edition`. So every brand-new character —
  vampire, human, or ghoul — starts with an empty Discipline map on
  disk.
- `getCharacters` normalization preserves any existing `disciplines`
  object verbatim for both V5 and classic
  ([:271 / :310](src/services/characterStorage.ts:271)). Missing /
  malformed values fall back to `{}`. **No kind-aware gate** — a
  dormant `{ celerity: 2 }` on a pre-AX ghoul would survive untouched.

### Types (`src/types/index.ts`)

- Both `V5Character` and `ClassicCharacter` declare
  `disciplines: Record<string, DisciplineValue>` as **required**
  ([:389 / :429](src/types/index.ts:389)). Every character carries
  the map by construction; the runtime can rely on the field always
  existing.
- `DisciplineValue` is the union `number | { rating, powers? }`
  with `DisciplineSpecialKind = 'paths' | 'rituals' | …` for clan
  flavors that have multiple sections.

### Sheet (`src/data/characterSheets/`)

- `v5.ts` vampire schema exposes the Disciplines section via
  `{ id: 'disciplines', labelKey: 'sheet_section_disciplines', type: 'special-disciplines' }`
  ([:799](src/data/characterSheets/v5.ts:799)).
- `classic.ts` vampire schema exposes the same field
  ([:727](src/data/characterSheets/classic.ts:727)).
- `humanV5Schema`, `humanClassicSchema`, `ghoulV5Schema`,
  `ghoulClassicSchema` all **omit** the disciplines field — neither
  `human.ts` nor `ghoul.ts` (which re-exports human) contains the
  string "disciplines" anywhere. Mortal sheets are clean.
- `DynamicSheet` routes `'special-disciplines'` to the `DisciplineList`
  component ([DynamicSheet.tsx:1403-1405](src/components/character/DynamicSheet.tsx:1403)).

### `DisciplineList` ([DynamicSheet.tsx:224-…](src/components/character/DynamicSheet.tsx:224))

Reads `character.clan` and `character.edition` to:

- Compute `availableDisciplines = disciplines.filter(d => d.editions.includes(character.edition))`
  — the full edition-appropriate catalog.
- Compute `suggestedIds = getSuggestedDisciplineIds(character.clan, character.edition, currentMap)`
  — clan-flavoured suggestions (e.g. Brujah V5 →
  Celerity / Potence / Presence;
  [DynamicSheet.tsx:86-105](src/components/character/DynamicSheet.tsx:86)).
- Render an "Add" form (dropdown of all available + custom name) and
  an "Add suggested" affordance per id and an "Add all suggested"
  bulk action.
- Each row renders a 0–5 dot rating, per-power list (V5-style power
  authoring), a navigation link to the compendium page for known
  ids, and edit/remove controls.
- **Important kind-blindness:** the component does not inspect
  `character.kind`. If a mortal schema ever surfaced this field type,
  the full vampire UI would render unchanged — including clan-based
  suggestions reading from a (likely empty) mortal `clan` field.

### Print (`src/components/character/CharacterPrintView.tsx`)

- `disciplineEntries = Object.entries(character.disciplines || {})`
  is computed once for every print
  ([:361](src/components/character/CharacterPrintView.tsx:361)).
- The Disciplines section renders only when
  `isVampire && disciplineEntries.length > 0`
  ([:672](src/components/character/CharacterPrintView.tsx:672)). So
  **non-vampire prints never emit a Disciplines section** — even if
  a ghoul somehow accumulated discipline data on disk. This was a
  Batch BA polish.

### Export / import (`src/services/characterStorage.ts`)

- Validators check `name`, `edition`, `clan`. Nothing about
  `disciplines`. Round-trip is lossless via
  `JSON.parse(JSON.stringify(char))` in `buildCharacterBackup`
  ([:666](src/services/characterStorage.ts:666)).
- No version bump would be required for any option in §5 below.

### i18n (`src/i18n/ui.ts`)

- `sheet_section_disciplines` is already EN+ES localized.
- Individual discipline names live in `src/data/disciplines.ts` with
  per-edition variants and full i18n coverage; the live-sheet
  renderer reads them through `getDisciplineDisplayName` (Batch U).

### Net result

- Vampires: full Discipline UX on sheet and print.
- Humans / Ghouls: no Discipline UX anywhere. Storage carries an
  empty `disciplines: {}` map seeded at creation, but no schema
  exposes the field, no print branch reads it for non-vampires, and
  no toggle currently surfaces it.

**This is the cleanest starting point we can ask for.** The audit's
job is to decide whether to give ghouls a *limited, ghoul-flavoured*
Powers UI — not to surface the existing vampire UX on a ghoul sheet.

---

## 2 · V20 / classic considerations

In V20 / Revised / 2ND / 1ST, ghouls typically get a very small
amount of supernatural access derived from the regnant's bloodline:
roughly one or two disciplines, usually at level 1, almost always
limited to the regnant's clan disciplines. Old-and-powerful ghouls
sometimes carry more; war ghouls and Sabbat-bonded ghouls have
table-specific variations. The number, the cap, and the bond
mechanics are **rules-text surface area we should not encode**.

What the app *can* model safely:

- **A "Powers" section** (different label from Disciplines) that
  holds a small map of `{ disciplineId: rating, powers? }` shaped
  identically to the vampire map but rendered with stricter limits
  and a different section name.
- **A soft per-discipline cap of 1 dot** by default (editable by the
  Storyteller — never hard-clamped, just defaulted). This reads as
  "ghouls start at level 1" without claiming rules authority.
- **No "Add all suggested"** bulk affordance — a ghoul should pick
  powers deliberately. The single "Add suggested" affordance per id
  is fine.
- **Suggestions drawn from the regnant's clan** when one is on the
  ghoul's `clan` field. Falls back to the full available list when
  the clan field is empty (no regnant set).

Practical implication: V20 ghouls SHOULD get a tracker. The shape is
nearly identical to the existing `DisciplineList` — the differences
are surface (label, default cap, optional UI restraints) rather than
data.

---

## 3 · V5 considerations

V5 reframes ghouls as "thin-blooded-adjacent mortals with very
limited access to discipline powers". A V5 ghoul typically learns
**one specific power** rather than acquiring a whole discipline at a
dot rating — the V5 ghoul rules treat the power as the atomic unit.

Two product positions:

### Position 3a — No V5 Ghoul Powers section for BI-1 (recommended)

Same reasoning as BF's V5 vitae deferral. The V5 ghoul-powers model
diverges enough from the vampire `{ disciplineId: rating, powers? }`
shape that surfacing the vampire data model on a V5 ghoul would
either:
- Force the player to author a rating they don't really have
  (vampire-style rating), or
- Require us to invent a different data shape (a flat `powers: string[]`
  on V5 ghouls), which then needs its own UI, its own print branch,
  its own export validator notes.

Defer until a separate audit specifically scopes V5 ghoul powers.
The single-power-textarea workaround that already lives in journal /
inventory covers the long tail.

### Position 3b — Reuse the same UI as classic ghouls

Treat V5 ghouls and classic ghouls identically for BI-1. Reduces
edition-special-casing. Accept that V5 ghouls may have a "phantom
rating" they don't strictly need.

### Recommendation: **3a for BI-1; revisit later**

V5 ghouls get **no** powers section in the first ghoul-powers batch.
Same path BF/BG took for V5 vitae. We can graduate to 3b (or a
purpose-built V5 design) via the same toggle pattern.

---

## 4 · Human characters

No powers section. Ever — for the same reasons §4 of the BF audit
laid out. A V20 human carrying a discipline implies a mechanic the
rules don't grant them and is a Dark Pack tripwire. Existing tests
at [CharacterPrintSections.test.tsx](src/components/character/__tests__/CharacterPrintSections.test.tsx)
already lock the print side (no human prints disciplines because
`isVampire` gates the section); BI-1 should mirror that on the
live-sheet side and add a regression test if one is missing.

If a future batch ever wants a "ghoul-like mortal" sheet (e.g. a
hunter who can spend vitae from a tap-source), model it as a new
`kind`, not by relaxing humans.

---

## 5 · Audit answers — direct responses to the brief

1. **Should Ghouls support Disciplines / Powers in V20 / classic?**
   **Yes — opt-in via a `trackGhoulPowers?: boolean` flag.** Ship the
   toggle in BI-1; render a dedicated "Powers" section
   (not "Disciplines") only when the flag is on. Section is hidden
   by default for new and legacy ghouls.
2. **Should Ghouls support Disciplines / Powers in V5?**
   **No, for BI-1.** Defer per §3. Revisit if real users ask.
3. **Should Humans ever support Disciplines / Powers?**
   **No, ever** (with the brief's "except special future edge cases"
   carve-out interpreted as "model as a new kind, not as a human").
   BI-1 must add a regression that humans never see the section, even
   with a hand-stamped `trackGhoulPowers: true`.
4. **Visibility model.**
   - **Opt-in** via a `trackGhoulPowers?: boolean` toggle. Default
     off. Same pattern as BE-1's `trackMorality` and BG's
     `trackVitae`.
   - **Tied to regnant clan for suggestions, not enforcement.** When
     `character.clan` is set on a ghoul, the suggested-disciplines
     list draws from that clan. When `clan` is empty, suggestions
     fall back to the full edition-available list (so a ghoul
     without a known regnant can still author powers manually).
   - **Manually selected.** No "Add all suggested" bulk action on
     ghouls. Each addition is a deliberate, individual choice.
   - **Edition-specific.** Classic ghouls only; V5 ghouls deferred.
5. **Same Discipline display as vampires, or a separate Ghoul Powers
   section?**
   **Separate "Powers" section**, distinct label, smaller default
   cap. New section labelled by a new i18n key
   `sheet_section_ghoul_powers` ("Powers" EN, "Poderes" ES). The
   *data shape* is the same `disciplines` map — but the UI surfaces
   it under a different name. This avoids "ghouls are reading the
   same Disciplines header vampires use", which would imply the
   wrong thing.
6. **V5 Ghouls — limited Discipline / power section, or wait?**
   **Wait** per §3. Defer until a separate audit specifically scopes
   V5 ghoul powers.
7. **Suggest Disciplines based on Regnant clan?**
   **Yes, as soft suggestions only.** Reuse the existing
   `getSuggestedDisciplineIds(clan, edition, currentMap)` helper —
   it already returns the regnant clan's disciplines when `clan` is
   the ghoul's regnant. Surface the suggestions in the ghoul Powers
   UI as a non-bulk "Add suggested" affordance per id, identical to
   the vampire UI minus "Add all suggested". When no regnant clan
   is set on the ghoul, the suggestions list is empty and the
   manual dropdown covers everything.
8. **Tracker interacts with V20 Ghoul Vitae?**
   **No coupling in BI-1.** Adding a power should not auto-decrement
   `bloodPool`. Vitae spend is a play-time choice that the player
   makes by editing the Vitae tracker manually. Future batches may
   add Rouse-Check-style affordances; BI-1 is purely a "list and
   rate the powers you have" surface.
9. **Should it print?**
   **Yes when the toggle is on.** Mirror the BE-2 / BH contract:
   only print the section when `trackGhoulPowers === true`, never
   expose the toggle in print, use the new
   `sheet_section_ghoul_powers` label. **Defer print parity to
   BI-2** to keep BI-1's diff minimal.
10. **Export / import?**
    **Yes, with zero validator changes.** Both `disciplines` and
    `trackGhoulPowers` ride through the existing JSON envelope. No
    `EXPORT_VERSION` / `BACKUP_VERSION` bump. Pre-BI clients ignore
    the new flag; BI clients treat absent flag as `false`.
11. **New field or reuse existing `disciplines`?**
    **Reuse `disciplines`.** Both `V5Character` and `ClassicCharacter`
    already carry the map; storage normalization already preserves
    arbitrary contents. The new `trackGhoulPowers?: boolean` flag on
    `BaseCharacter` controls visibility — exactly mirroring the
    `trackMorality` / `humanity` and `trackVitae` / `bloodPool`
    splits.
12. **What should be deferred until regnant character linking exists?**
    - Auto-syncing the ghoul's allowed disciplines with the linked
      regnant's `disciplines` map. BI-1 reads `character.clan` only;
      a future batch can swap that for the regnant's clan when a
      `regnantId` field is added.
    - "Receive vitae from regnant" actions, Bond rating, vinculum
      mechanics — all explicitly deferred.

---

## 6 · Regnant clan implications

The ghoul's `character.clan` field has been the "regnant clan"
since Batch AY (per AZ §1's terminology refinement and BB / BD's
sheet identity refinement). That means:

- The existing `getSuggestedDisciplineIds(clan, edition, map)`
  already returns the regnant clan's edition-appropriate
  disciplines when called with the ghoul's `clan`. **Zero new
  helper needed** for clan-based suggestion in BI-1.
- When the ghoul has no regnant set (`clan === ''`), the helper
  returns `[]` and the UI shows only the manual dropdown. That's the
  right behavior — the ghoul can author powers freely without us
  inventing a synthetic clan.

Future "regnant character linking" (a separate audit / batch) may
introduce a `regnantId` that points at another character record. At
that point the ghoul Powers UI can swap from `character.clan` to
`resolveRegnantClan(character)`. BI-1 does not need this to ship.

---

## 7 · Vitae interaction implications

- BI-1 must **not** wire power activation to Vitae spend. Storyteller
  pacing varies wildly and an automatic decrement would be wrong on
  most tables.
- BI-1's Powers section coexists with BG's Vitae card without any
  shared state: the Vitae card lives in the BE-1-pattern section
  area, the Powers section lives in the schema-driven sheet flow.
  Both are independent toggles, both gated on
  `kind === 'ghoul'` (and classic edition).
- A future "Spend vitae" affordance on the Powers UI would belong to
  a follow-up batch with its own audit.

---

## 8 · Print / PDF implications

Mirror the BE-2 / BH pattern. The Disciplines print branch today is
gated on `isVampire && disciplineEntries.length > 0`
([CharacterPrintView.tsx:672](src/components/character/CharacterPrintView.tsx:672)).
**BI-1 ships no print changes.** BI-2 widens the guard to also
cover opt-in ghouls:

```tsx
- {isVampire && disciplineEntries.length > 0 && (
+ {(isVampire || (kind === 'ghoul' && character.trackGhoulPowers === true)) &&
+  disciplineEntries.length > 0 && (
    <section>
-     <SectionHeading>{strings.sheet_section_disciplines || "Disciplines"}</SectionHeading>
+     <SectionHeading>
+       {isVampire
+         ? (strings.sheet_section_disciplines || "Disciplines")
+         : (strings.sheet_section_ghoul_powers || "Powers")}
+     </SectionHeading>
      ...
```

Key invariants for BI-2:

- Vampire path is byte-for-byte unchanged: same label, same
  rendering, same dotsString output.
- Ghoul opt-in path uses the new ghoul-Powers label, not the
  vampire Disciplines label.
- Humans, V5 ghouls, and opt-out ghouls with dormant `disciplines`
  data NEVER print the section.
- Per-row rendering (dots + powers list) is reused from the existing
  vampire branch — no new visual.

---

## 9 · Export / import implications

- **No `EXPORT_VERSION` bump, no `BACKUP_VERSION` bump.** Adding an
  optional boolean and continuing to round-trip the existing
  `disciplines` map is purely additive.
- **No validator changes.** `validateCharacterExport` /
  `validateCharacterBackup` keep checking name / edition / clan
  ([characterStorage.ts:594-617](src/services/characterStorage.ts:594)).
- Cross-version compat:
  - Pre-BI client reads a BI export of a ghoul with
    `trackGhoulPowers: true` and `disciplines: { potence: 1 }`:
    `disciplines` survives the round trip in the JSON envelope; the
    pre-BI client doesn't surface the `disciplines` map on a ghoul
    because no mortal schema exposes it. The unknown
    `trackGhoulPowers` is ignored. Lossless round trip.
  - BI client reads a pre-BI backup of a ghoul with dormant
    `disciplines: { celerity: 2 }`: see §10.

---

## 10 · Backward compatibility — dormant `disciplines` data

Pre-Batch-AX "ghouls" (i.e., characters who were created as vampires
back when ghouls didn't exist, then re-classified) may carry
arbitrary discipline maps on disk. Plus every brand-new character —
including AY-and-later ghouls — gets `disciplines: {}` from
`createEmptyCharacter`, which is empty but extant. BI-1 must
continue to ignore both cases unless the user opts in.

Contract:

| Stored shape | Toggle | Sheet | Print (BI-2) |
|---|---|---|---|
| `disciplines: {}`, no toggle | `undefined` | no Powers section | no section |
| `disciplines: {}`, toggle `false` | `false` | no Powers section | no section |
| `disciplines: {}`, toggle `true` | `true` | empty section UI with "Add" affordance | no section (gate is `entries.length > 0`) |
| `disciplines: { celerity: 2 }`, no toggle | `undefined` | no Powers section | no section |
| `disciplines: { celerity: 2 }`, toggle `false` | `false` | no Powers section | no section |
| `disciplines: { celerity: 2 }`, toggle `true` | `true` | Powers section shows the entry verbatim | section prints |
| `disciplines: { potence: 1 }`, toggle `true` | `true` | Powers section shows entry | section prints |

The opt-in path **does NOT modify** the dormant `disciplines` map —
it just makes the existing data visible. Disabling the toggle hides
the section but preserves the map verbatim, so a future re-enable
restores the same data. No seed-on-enable behavior is needed
(unlike Vitae's 3/3 seed): an empty Powers section is a valid,
useful state — the user adds entries via the standard UI.

A one-time inline dormant-data prompt is out of scope for BI-1.
Defer to a future polish batch, possibly co-shipping with the BE-1
humanity prompt and the BF audit's deferred dormant vitae prompt as
a single unified prompt experience.

---

## 11 · Testing strategy

### Schema / data invariants

- `humanV5Schema`, `humanClassicSchema`, `ghoulV5Schema`,
  `ghoulClassicSchema` continue to **not** contain a `disciplines`
  field (the toggle layer lives above the schema). Lock in via the
  existing `getSchemaForCharacter.test.ts` audit pattern.
- `createEmptyCharacter` continues to seed `disciplines: {}` for all
  kinds (unchanged from today). BI-1 does NOT touch this seed.
- `getCharacters` normalization preserves dormant `disciplines` on a
  ghoul; does NOT auto-set `trackGhoulPowers`.

### Sheet rendering

- **Vampires (V5 + V20)** render their existing schema-driven
  Disciplines section unchanged.
- **Humans (any edition)** render no Powers section. Even with a
  hand-stamped `trackGhoulPowers: true`, the section stays hidden
  (visibility is gated on `kind === 'ghoul'`).
- **V5 ghouls** render no Powers section per §3.
- **V20 ghouls** with no toggle → no Powers section.
- **V20 ghouls** with `trackGhoulPowers: true` and dormant
  `disciplines: { celerity: 2 }` → Powers section shows Celerity 2.
- **V20 ghouls** with `trackGhoulPowers: true` and empty
  `disciplines: {}` → Powers section shows the "Add" affordance with
  no rows.
- Toggling off preserves `disciplines`; toggling on a second time
  reuses the preserved map.
- Toggle is disabled in View Mode (mirrors BE-1 / BG).
- Suggested-disciplines list reflects the ghoul's `clan` (regnant
  clan); empty clan → no suggestions, only the manual dropdown.

### Print (BI-2)

- V5 ghouls never print Powers.
- V20 ghouls with no toggle never print Powers, even with dormant
  data.
- V20 ghouls with toggle true and non-empty entries print the section
  using `sheet_section_ghoul_powers`, not the vampire
  `sheet_section_disciplines`.
- Humans never print Powers.
- Vampires print the existing Disciplines section — byte-for-byte
  identical to pre-BI.

### i18n

- `sheet_section_ghoul_powers` and `sheet_track_ghoul_powers` EN +
  ES present.

### Storage round-trip

- A ghoul with `trackGhoulPowers: true` and
  `disciplines: { celerity: 2 }` survives a JSON envelope round-trip.

---

## 12 · Recommended implementation phases

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **BI-1 — Toggle data + V20 ghoul Powers card on sheet** (next batch — see §13) | Add `trackGhoulPowers?: boolean` to `BaseCharacter`. Render a classic-ghoul-only Powers card after the Vitae card. Reuses a constrained variant of `DisciplineList`. Adds `sheet_section_ghoul_powers` + `sheet_track_ghoul_powers` i18n strings (EN + ES). | Medium — adds new UI surface (constrained DisciplineList variant), needs careful testing for the suggestions path. | ~6–8 |
| **BI-2 — Print parity** | Widen the existing Disciplines print guard to cover opt-in classic ghouls, using the new section label. Same pattern as BE-2 and BH. | Low | ~2–3 |
| **BI-3 — Dormant data prompt (optional, batched with BE/BF dormant prompts)** | One-time inline prompt for ghouls with dormant `disciplines` entries. Possibly co-shipping with the BE-1 humanity and BF vitae prompts as one unified UX. | Low | ~2–3 |
| **Future — Regnant character linking** | Swap the `character.clan` lookup for a resolved regnant-character lookup. Not BI's concern. | Medium — separate audit. | not scoped here |

Phases BI-1 and BI-2 are independently shippable; BI-2 depends on
BI-1's flag. BI-3 is optional polish.

---

## 13 · Recommended next implementation batch

**Batch BI-1 — opt-in Powers tracker for classic ghouls (data + sheet only).**

Scope it explicitly to:

1. **Type:** add `trackGhoulPowers?: boolean` to `BaseCharacter` in
   [types/index.ts](src/types/index.ts). Document that it has no
   effect on vampires (their Disciplines is schema-driven), no
   effect on humans (no powers, ever), and no effect on V5 ghouls
   (deferred per §3).
2. **Storage:** no normalization changes in `getCharacters`. No
   defaults injected. The flag rides through `JSON.parse(JSON.stringify(char))`
   in backup / export.
3. **Sheet card:** add a mortal-only card that renders right after
   the BG Vitae card. The card:
   - Shows only the toggle when `trackGhoulPowers !== true`.
   - Shows toggle + a constrained `DisciplineList`-shaped UI when
     `trackGhoulPowers === true`.
   - Only renders when `kind === 'ghoul'` AND `edition !== 'V5'`.
4. **Constrained UI:** add a small wrapper (or a `mode: 'ghoul'`
   prop on `DisciplineList`) that:
   - Hides the "Add all suggested" bulk action.
   - Defaults newly-added discipline ratings to 1 instead of relying
     on the existing default (which already is 1, but lock it).
   - Removes the "edition-paths/rituals" affordances if any — ghouls
     should not author paths or rituals in BI-1.
5. **Suggestions:** pass `character.clan` (the regnant clan) and
   `character.edition` into `getSuggestedDisciplineIds` unchanged.
   Empty `clan` → no suggestions; the manual dropdown handles
   authoring.
6. **i18n:** add `sheet_section_ghoul_powers` (EN "Powers", ES
   "Poderes") and `sheet_track_ghoul_powers` (EN "Track powers", ES
   "Registrar poderes") in `ui.ts`.
7. **Tests:** the test groups in §11 — schema invariants, default-off,
   dormant-data, enable/disable, vampire compatibility, human
   exclusion, V5 ghoul exclusion, View-Mode lock, regnant-clan
   suggestions, EN/ES, JSON round-trip.
8. **Out of scope for BI-1:** print view (BI-2), dormant-data inline
   prompt (BI-3), regnant character linking, Vitae spend wiring,
   power-description text, V5 ghoul powers.

Acceptance gates for BI-1:

- Every existing test still passes.
- Creating a V20 ghoul → no `trackGhoulPowers`, no Powers section.
- Toggling on a V20 ghoul → "Powers" section appears with an empty
  Add affordance and the regnant-clan-derived suggestion list.
- Adding "Potence" to a Brujah-bound ghoul → entry shows up at
  rating 1, editable, deletable. Edit, save, reload — entry
  persists.
- Toggling off → section hidden, `disciplines` map preserved on
  storage, re-enabling restores the same entries.
- V5 ghoul, V5 human, V20 human, V5 vampire, V20 vampire — no Powers
  section, no behavior change.
- Vampire Disciplines section on V5 and V20 sheets continues to
  render byte-for-byte identical to pre-BI-1.

Once BI-1 is verified, BI-2 wires up print parity (mirroring BE-2 /
BH) and BI-3 wraps up the dormant-data prompt.

---

## 14 · Risks and decisions needed before implementation

1. **Section label.** "Powers" vs "Ghoul Powers" vs "Bonded Powers".
   Recommendation: **"Powers"** (EN) / **"Poderes"** (ES). Simplest,
   unambiguous in context (the ghoul Kind pill is right there),
   doesn't require new translations beyond the bare word.
2. **Constrained UI scope.** Whether to add a `mode: 'ghoul'` prop
   to the existing `DisciplineList` or build a small wrapper. The
   wrapper is purer (no risk of breaking the vampire path) but
   duplicates ~50 lines. The mode prop is leaner but couples the
   two paths. Recommendation: **mode prop**, with a one-line guard
   at the top of the bulk-add and rituals/paths code paths.
3. **Default rating on add.** Currently 1 ([DynamicSheet.tsx:248 / :254 / :262](src/components/character/DynamicSheet.tsx:248)).
   Recommendation: **keep 1**. Don't restrict the user to 1, just
   default to it.
4. **Suggestions when `clan === ''`.** Recommendation: **empty list**
   — never invent suggestions, never auto-pick a clan.
5. **Whether to ship the dormant-data prompt with BI-1.**
   Recommendation: **defer to BI-3**.
6. **Future regnant-character linking integration.** Designed-out
   for BI-1.
7. **Power descriptions in BI-1?**
   **No.** Don't add description text. The compendium navigation
   link already on existing rows ([DynamicSheet.tsx:242](src/components/character/DynamicSheet.tsx:242))
   covers the "where do I read what this does?" need.

None of these block the audit. All seven can be settled when BI-1
starts.

---

## 15 · Dark Pack / copyright safety notes

- BI-1 introduces **no rules text, no tables, no power descriptions,
  no licensed lists.** Surfaces a list of disciplines and a 0–5
  rating per discipline (same as the vampire UI), but with a
  ghoul-specific label, a ghoul-specific section, and a manual-add
  workflow that does not imply the rules grant ghouls automatic
  power access.
- The new i18n strings are short noun phrases:
  - `sheet_section_ghoul_powers` — EN "Powers", ES "Poderes"
  - `sheet_track_ghoul_powers` — EN "Track powers", ES "Registrar poderes"
  No rulebook prose, no per-power text. The single word "Powers" is
  generic enough to ship without copyright concern.
- Reuses the existing discipline catalog (`src/data/disciplines.ts`)
  which has already been audited for Dark Pack compliance. No new
  data files, no new image assets, no new clan symbols, no new
  licensed artwork.
- The ghoul Powers section never describes *what* a discipline does
  — it just stores the level and an optional list of named powers
  (which the user authors themselves, exactly as the V5 vampire UI
  does today).

---

*End of audit. No runtime files were modified in this batch. See §13
for the next-batch entry point.*
