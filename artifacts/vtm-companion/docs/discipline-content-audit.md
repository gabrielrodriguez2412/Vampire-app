# Discipline & Power Content Audit — Phase 1

Snapshot date: 2026-05-18

This is a developer-facing audit of the data in `src/data/disciplines.ts`
vs `src/data/clans.ts`. It is **not** user-facing copy. Anything described
here that involves official power names or rules text is to be filled in
manually by the maintainer using original wording — no copy-paste from
official Vampire: The Masquerade books.

## Discipline inventory (21)

Power count = number of entries in `powers[]`. A full discipline normally
has 5 (levels 1–5; classic editions can have more across splatbooks).

| ID                   | Editions                       | Powers | clansWhoUse                                                |
|----------------------|--------------------------------|-------:|------------------------------------------------------------|
| animalism            | 1ST, 2ND, REVISED, V20, V5     | 6      | gangrel, nosferatu, ravnos, **tzimisce**                   |
| auspex               | 1ST, 2ND, REVISED, V20, V5     | 6      | malkavian, toreador, tremere, giovanni, salubri, **tzimisce** |
| blood_sorcery        | V5                             | 1      | tremere, assamite                                          |
| thaumaturgy          | 1ST, 2ND, REVISED, V20         | 0      | tremere                                                    |
| obtenebration        | 1ST, 2ND, REVISED, V20         | 0      | lasombra                                                   |
| necromancy           | 1ST, 2ND, REVISED, V20         | 0      | giovanni                                                   |
| quietus              | 1ST, 2ND, REVISED, V20         | 0      | assamite                                                   |
| serpentis            | 1ST, 2ND, REVISED, V20         | 0      | followers_of_set                                           |
| vicissitude          | 1ST, 2ND, REVISED, V20         | 0      | tzimisce                                                   |
| chimerstry           | 1ST, 2ND, REVISED, V20         | 0      | ravnos                                                     |
| celerity             | 1ST, 2ND, REVISED, V20, V5     | 2      | brujah, toreador, assamite                                 |
| dominate             | 1ST, 2ND, REVISED, V20, V5     | 2      | ventrue, tremere, lasombra, malkavian                      |
| obfuscate            | 1ST, 2ND, REVISED, V20, V5     | 2      | nosferatu, malkavian, assamite, followers_of_set, ravnos, **salubri** |
| presence             | 1ST, 2ND, REVISED, V20, V5     | 2      | toreador, brujah, ventrue, followers_of_set, ravnos        |
| protean              | 1ST, 2ND, REVISED, V20, V5     | 2      | gangrel, followers_of_set, **tzimisce**                    |
| fortitude            | 1ST, 2ND, REVISED, V20, V5     | 2      | ventrue, gangrel, giovanni, salubri, **ravnos**            |
| potence              | 1ST, 2ND, REVISED, V20, V5     | 2      | brujah, nosferatu, lasombra                                |
| oblivion             | V5                             | 0      | lasombra, giovanni                                         |
| valeren              | 1ST, 2ND, REVISED, V20         | 0      | salubri                                                    |
| thin_blood_alchemy   | V5                             | 0      | **thin_blood**                                             |

**Bold** entries are the additions made in this audit pass.

## Phase 1 fixes (applied)

### Bidirectional clan ↔ discipline sync

`clans.ts` is authoritative for which disciplines a clan can take. Every
discipline that a clan claims must list the clan in its `clansWhoUse` so
that the disciplines page and any cross-reference UI is consistent.
The following were missing and have been added:

- `animalism.clansWhoUse` ← `tzimisce`
- `auspex.clansWhoUse` ← `tzimisce`
- `protean.clansWhoUse` ← `tzimisce`
- `fortitude.clansWhoUse` ← `ravnos`
- `obfuscate.clansWhoUse` ← `salubri`
- `thin_blood_alchemy.clansWhoUse` ← `thin_blood`

A regression test in `src/data/__tests__/disciplines.test.ts` now enforces
the forward direction (clan → discipline) so this drift can’t reappear
silently.

### Edition fix

- `valeren.editions` had `V5`, but Valeren is not a V5 discipline and no
  V5 clan in this data lists it. `V5` removed.

## Needs-review (NOT changed)

These are content questions, not structural fixes. They are listed here
so the maintainer can confirm with their preferred source material and
apply changes deliberately.

1. **Salubri `obfuscate` vs `valeren`** — `clans.ts` lists Salubri’s
   third discipline as `obfuscate`, but `disciplines.ts` only lists
   Salubri under `valeren` (and now also `obfuscate`, to keep the
   bidirectional test passing). In classic editions Salubri canonically
   used Valeren as their unique 3rd discipline. Action: confirm intended
   in-app mapping. If Valeren is intended, swap `salubri.disciplines`
   entry `obfuscate` → `valeren` and remove `salubri` from
   `obfuscate.clansWhoUse`.

2. **Ravnos `fortitude`** — `clans.ts` lists Ravnos with five
   disciplines (`animalism, obfuscate, presence, chimerstry, fortitude`).
   Ravnos historically had three in any single edition; this combined
   list appears to merge classic (Animalism / Chimerstry / Fortitude)
   and V5 (Animalism / Obfuscate / Presence). Action: confirm whether
   the merged list is intentional cross-edition coverage. If not, split
   per edition or trim.

3. **`blood_sorcery.clansWhoUse`** includes `assamite` — correct for V5
   (Banu Haqim cast Blood Sorcery). No action needed; flagged for the
   reader.

4. **`auspex.clansWhoUse`** includes `giovanni`. Correct for classic
   Giovanni; in V5 the clan is Hecata (handled via clan
   `alternateNames`). No action needed.

## Power data gaps

### Phase 2 update (applied)

Every discipline now ships with **five power entries** (one per level
1–5). All summaries are short, original, functional descriptions written
in our own words — no book prose was copied. A regression test in
`src/data/__tests__/disciplines.test.ts` enforces:

- no discipline has an empty `powers[]` array
- every discipline covers all five levels at least once
- every power has a non-empty English description

The fills fall into two buckets:

**Filled with original short summaries (15 disciplines):**
animalism, auspex, celerity, dominate, obfuscate, presence, protean,
fortitude, potence, blood_sorcery, oblivion, obtenebration, quietus,
serpentis, vicissitude, chimerstry, valeren.

Names use a generic descriptive style (e.g., `"Memory Reshape (Level 3)"`,
`"Stygian Veil (Level 4)"`) so the entries are clearly app-authored
flavor rather than transcriptions of any specific edition's canonical
power list. Each carries a one-sentence original functional summary and
a short tactical note.

**Filled with `Needs review` placeholders (3 disciplines):**
thaumaturgy, necromancy, thin_blood_alchemy.

These three disciplines do not fit the flat one-power-per-level model
the current data shape uses:

- **thaumaturgy** (classic Tremere) is organized by paths and rituals.
- **necromancy** (classic Giovanni) is also organized by paths and
  rituals.
- **thin_blood_alchemy** (V5 thin-bloods) is organized by formulae, not
  fixed dot powers.

Each carries five entries named `"Path Power (Level N) — Needs review"`
or `"Alchemy Formula (Level N) — Needs review"` with a description that
explicitly tells the reader (and any future contributor) the
representation gap, e.g.:

> Needs review: classic Thaumaturgy is organized by paths and rituals,
> not flat dot powers. Confirm canonical representation before expanding.

This avoids the prior silent-empty-array problem (the test would also
fail now if anyone removed them) while marking the entries unambiguously
as needs-review rather than canonical content.

### Wording guidance (still applies)

- Discipline summary: 1–2 original sentences. Functional description only.
- Power summary: 1 short original sentence.
- Tactical note: optional, 1 short original sentence, practical.
- If a power's effect cannot be safely summarized: use the placeholder
  `"Needs review: confirm name and effect for this edition."` and leave a
  TODO in the data so the audit doc can track it.

## Still needs follow-up (Phase 3+)

1. **Path / ritual / formula data model.** The current
   `DisciplineEntry.powers` shape is a flat list. Modeling Thaumaturgy
   paths, Necromancy paths, Blood Sorcery rituals, Oblivion ceremonies,
   and Thin-Blood Alchemy formulae correctly likely needs a parallel
   sub-array (e.g., `paths: { name, levels: [...] }[]` or
   `rituals: { name, level }[]`). Out of scope for Phase 2.

2. **Per-edition power divergence.** Several core disciplines (Protean,
   Fortitude, Potence, etc.) have different power lineups between
   classic editions and V5. The current shape is a single shared list.
   Tagging powers with an `editions?: EditionId[]` field is one way to
   handle this; defer to a future phase.

3. **Translations.** Power descriptions still use the `fallbackStr`
   helper, which fills non-English fields with the English text. This
   keeps the UI from showing the `[ No translation ]` badge but is not
   real localization. Phase 4 candidate.

4. **Salubri's third discipline and Ravnos's combined list** remain the
   unresolved content questions from Phase 1 (see "Needs-review" section
   above). Phase 2 did not touch the clan-side data.

## Translations

Every Discipline entry uses the `fallbackStr` / `fallbackArr` helper for
most languages, which means non-EN/ES strings are populated with the
English fallback. This keeps the UI from rendering "[ No translation ]"
red badges, but it is technically incorrect language data. Not in scope
for this phase; flagged for a translation pass.

## Routing / deep-link impact

The discipline deep-link routes (`/compendium/disciplinas/:id`) are
unchanged. Power-list completeness has no effect on routing; the Powers
accordion only renders when `powers.length > 0`, so empty discipline
detail pages still show the header card and (now-correct) clan tags.
