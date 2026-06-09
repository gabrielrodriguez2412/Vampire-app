/**
 * Batch AY (Phase 2) — basic Ghoul character sheet schemas.
 *
 * Two flavors keep the same edition split the vampire schemas use:
 *   - `ghoulV5Schema`      → V5-flavored attribute/skill vocabulary.
 *   - `ghoulClassicSchema` → V20 / Revised / 2nd / 1st (Storyteller-system
 *                           attribute + ability vocabulary).
 *
 * Phase 2 invariants (from `docs/non-vampire-character-types-audit.md`):
 *   - NO vampire-only sections: no Hunger, Blood Potency, Predator Type,
 *     Generation, Sire, Disciplines, Resonance, Touchstones, Convictions.
 *   - DOES keep universal Storyteller fields: identity, attributes,
 *     abilities/skills, Health, Willpower, merits/flaws, inventory,
 *     character journal.
 *   - Phase 2 is intentionally identical to the human schema. Ghouls
 *     differ from humans in two existing places already (the kind pill on
 *     the card, and the regnant clan that lives in `character.clan` and
 *     drives the card's watermark) — sheet-level divergence is deferred
 *     to Phase 3 along with ghoul discipline mechanics, regnant linking,
 *     and Blood Pool rules.
 *
 * Re-exporting the human schemas keeps the two kinds in lockstep for
 * Phase 2 — Phase 3 can fork by replacing these re-exports with
 * dedicated schema literals.
 */
import { humanV5Schema, humanClassicSchema } from './human';

export const ghoulV5Schema = humanV5Schema;
export const ghoulClassicSchema = humanClassicSchema;
