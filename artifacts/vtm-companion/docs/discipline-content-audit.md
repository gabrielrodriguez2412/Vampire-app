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

## Power data gaps (NOT filled)

These disciplines have empty or stub `powers[]` arrays. The Disciplines
page already gracefully omits the Powers accordion when the array is
empty, so the UI is safe — but every power list below is incomplete and
should be filled with **short original summaries**. Do not copy book text.

| Discipline           | Have | Expected | Notes                                       |
|----------------------|-----:|---------:|---------------------------------------------|
| thaumaturgy          | 0    | 5+ paths | Classic Tremere; many sub-paths/rituals     |
| obtenebration        | 0    | 5        | Classic Lasombra                            |
| necromancy           | 0    | 5+ paths | Classic Giovanni; many sub-paths            |
| quietus              | 0    | 5        | Classic Assamite                            |
| serpentis            | 0    | 5        | Classic Followers of Set                    |
| vicissitude          | 0    | 5        | Classic Tzimisce                            |
| chimerstry           | 0    | 5        | Classic Ravnos                              |
| oblivion             | 0    | 5 (+ceremonies) | V5 Lasombra/Hecata                  |
| valeren              | 0    | 5 (3 paths in some editions) | Classic Salubri          |
| thin_blood_alchemy   | 0    | 5+ formulae | V5 Thin-Bloods                           |
| blood_sorcery        | 1    | 5 (+rituals) | V5 Tremere/Banu Haqim                   |
| celerity             | 2    | 5        | All editions                                |
| dominate             | 2    | 5        | All editions                                |
| obfuscate            | 2    | 5        | All editions                                |
| presence             | 2    | 5        | All editions                                |
| protean              | 2    | 5        | All editions                                |
| fortitude            | 2    | 5        | All editions                                |
| potence              | 2    | 5        | All editions                                |

### Wording guidance for whoever fills these in

- Discipline summary: 1–2 original sentences. Functional description only.
- Power summary: 1 short original sentence.
- Tactical note: optional, 1 short original sentence, practical.
- If a power’s effect cannot be safely paraphrased: use the placeholder
  `"Needs review: confirm name and effect for this edition."` and leave a
  TODO in the data so the audit doc can track it.

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
