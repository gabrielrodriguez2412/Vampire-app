/**
 * Batch AY (Phase 2) — basic Human character sheet schemas.
 *
 * Two flavors keep the same edition split the vampire schemas use:
 *   - `humanV5Schema`      → V5-flavored attribute/skill vocabulary.
 *   - `humanClassicSchema` → V20 / Revised / 2nd / 1st (Storyteller-system
 *                           attribute + ability vocabulary).
 *
 * Phase 2 invariants (from `docs/non-vampire-character-types-audit.md`):
 *   - NO vampire-only sections: no Hunger, Blood Potency, Blood Pool,
 *     Generation, Predator Type, Disciplines, Resonance, Touchstones,
 *     Convictions, Sire.
 *   - DOES keep universal Storyteller fields: identity, attributes,
 *     abilities/skills, Health, Willpower, merits/flaws, inventory,
 *     character journal.
 *   - Classic humans still get the Virtues section (Conscience /
 *     Self-Control / Courage) — those are general Storyteller-system
 *     traits in classic editions, not vampire-exclusive.
 *   - Humanity is intentionally omitted in Phase 2 (see audit §9 — this
 *     is a per-table decision; Phase 3 may surface it as an optional
 *     section).
 *
 * No ghoul-specific mechanics in this file — see `ghoul.ts`.
 */
import { SheetSchema } from './schemas';

export const humanV5Schema: SheetSchema = {
  sections: [
    {
      id: 'basic_info',
      labelKey: 'sheet_section_basic',
      fields: [
        { id: 'name', labelKey: 'sheet_name', type: 'text' },
        { id: 'playerName', labelKey: 'sheet_player', type: 'text' },
        { id: 'chronicle', labelKey: 'sheet_chronicle', type: 'text' },
        { id: 'concept', labelKey: 'sheet_concept', type: 'text' },
      ],
    },
    {
      id: 'attributes',
      labelKey: 'sheet_section_attributes',
      fields: [
        { id: 'attributes.strength', labelKey: 'attr_strength', type: 'dots-5' },
        { id: 'attributes.dexterity', labelKey: 'attr_dexterity', type: 'dots-5' },
        { id: 'attributes.stamina', labelKey: 'attr_stamina', type: 'dots-5' },
        { id: 'attributes.charisma', labelKey: 'attr_charisma', type: 'dots-5' },
        { id: 'attributes.manipulation', labelKey: 'attr_manipulation', type: 'dots-5' },
        { id: 'attributes.composure', labelKey: 'attr_composure', type: 'dots-5' },
        { id: 'attributes.intelligence', labelKey: 'attr_intelligence', type: 'dots-5' },
        { id: 'attributes.wits', labelKey: 'attr_wits', type: 'dots-5' },
        { id: 'attributes.resolve', labelKey: 'attr_resolve', type: 'dots-5' },
      ],
    },
    {
      id: 'skills',
      labelKey: 'sheet_section_skills',
      fields: [
        { id: 'skills.athletics', labelKey: 'skill_athletics', type: 'dots-5' },
        { id: 'skills.brawl', labelKey: 'skill_brawl', type: 'dots-5' },
        { id: 'skills.craft', labelKey: 'skill_craft', type: 'dots-5' },
        { id: 'skills.drive', labelKey: 'skill_drive', type: 'dots-5' },
        { id: 'skills.firearms', labelKey: 'skill_firearms', type: 'dots-5' },
        { id: 'skills.melee', labelKey: 'skill_melee', type: 'dots-5' },
        { id: 'skills.larceny', labelKey: 'skill_larceny', type: 'dots-5' },
        { id: 'skills.stealth', labelKey: 'skill_stealth', type: 'dots-5' },
        { id: 'skills.survival', labelKey: 'skill_survival', type: 'dots-5' },
        { id: 'skills.animalKen', labelKey: 'skill_animal_ken', type: 'dots-5' },
        { id: 'skills.etiquette', labelKey: 'skill_etiquette', type: 'dots-5' },
        { id: 'skills.insight', labelKey: 'skill_insight', type: 'dots-5' },
        { id: 'skills.intimidation', labelKey: 'skill_intimidation', type: 'dots-5' },
        { id: 'skills.leadership', labelKey: 'skill_leadership', type: 'dots-5' },
        { id: 'skills.performance', labelKey: 'skill_performance', type: 'dots-5' },
        { id: 'skills.persuasion', labelKey: 'skill_persuasion', type: 'dots-5' },
        { id: 'skills.streetwise', labelKey: 'skill_streetwise', type: 'dots-5' },
        { id: 'skills.subterfuge', labelKey: 'skill_subterfuge', type: 'dots-5' },
        { id: 'skills.academics', labelKey: 'skill_academics', type: 'dots-5' },
        { id: 'skills.awareness', labelKey: 'skill_awareness', type: 'dots-5' },
        { id: 'skills.finance', labelKey: 'skill_finance', type: 'dots-5' },
        { id: 'skills.investigation', labelKey: 'skill_investigation', type: 'dots-5' },
        { id: 'skills.medicine', labelKey: 'skill_medicine', type: 'dots-5' },
        { id: 'skills.occult', labelKey: 'skill_occult', type: 'dots-5' },
        { id: 'skills.politics', labelKey: 'skill_politics', type: 'dots-5' },
        { id: 'skills.science', labelKey: 'skill_science', type: 'dots-5' },
        { id: 'skills.technology', labelKey: 'skill_technology', type: 'dots-5' },
      ],
    },
    {
      id: 'trackers',
      labelKey: 'sheet_section_trackers',
      fields: [
        { id: 'health', labelKey: 'sheet_health', type: 'special-health', gameplay: true },
        { id: 'willpower', labelKey: 'sheet_willpower', type: 'special-willpower', gameplay: true },
        { id: 'experience', labelKey: 'sheet_experience', type: 'number' },
      ],
    },
    {
      id: 'merits_flaws',
      labelKey: 'sheet_section_merits_flaws',
      fields: [
        { id: 'advantages', labelKey: 'sheet_advantages', type: 'textarea' },
        { id: 'flaws', labelKey: 'sheet_flaws', type: 'textarea' },
      ],
    },
    {
      id: 'inventory',
      labelKey: 'sheet_section_inventory',
      fields: [
        { id: 'inventory', labelKey: 'sheet_section_inventory', type: 'inventory' },
      ],
    },
    {
      id: 'journal',
      labelKey: 'sheet_section_journal',
      fields: [
        { id: 'characterNotes', labelKey: 'sheet_section_journal', type: 'journal' },
      ],
    },
  ],
};

export const humanClassicSchema: SheetSchema = {
  sections: [
    {
      id: 'basic_info',
      labelKey: 'sheet_section_basic',
      fields: [
        { id: 'name', labelKey: 'sheet_name', type: 'text' },
        { id: 'playerName', labelKey: 'sheet_player', type: 'text' },
        { id: 'chronicle', labelKey: 'sheet_chronicle', type: 'text' },
        { id: 'nature', labelKey: 'sheet_nature', type: 'text' },
        { id: 'demeanor', labelKey: 'sheet_demeanor', type: 'text' },
        { id: 'concept', labelKey: 'sheet_concept', type: 'text' },
      ],
    },
    {
      id: 'attributes',
      labelKey: 'sheet_section_attributes',
      fields: [
        { id: 'attributes.strength', labelKey: 'attr_strength', type: 'dots-5' },
        { id: 'attributes.dexterity', labelKey: 'attr_dexterity', type: 'dots-5' },
        { id: 'attributes.stamina', labelKey: 'attr_stamina', type: 'dots-5' },
        { id: 'attributes.charisma', labelKey: 'attr_charisma', type: 'dots-5' },
        { id: 'attributes.manipulation', labelKey: 'attr_manipulation', type: 'dots-5' },
        { id: 'attributes.appearance', labelKey: 'attr_appearance', type: 'dots-5' },
        { id: 'attributes.perception', labelKey: 'attr_perception', type: 'dots-5' },
        { id: 'attributes.intelligence', labelKey: 'attr_intelligence', type: 'dots-5' },
        { id: 'attributes.wits', labelKey: 'attr_wits', type: 'dots-5' },
      ],
    },
    {
      id: 'abilities',
      labelKey: 'sheet_section_abilities',
      fields: [
        { id: 'abilities.alertness', labelKey: 'ability_alertness', type: 'dots-5' },
        { id: 'abilities.athletics', labelKey: 'ability_athletics', type: 'dots-5' },
        { id: 'abilities.awareness', labelKey: 'ability_awareness', type: 'dots-5' },
        { id: 'abilities.brawl', labelKey: 'ability_brawl', type: 'dots-5' },
        { id: 'abilities.empathy', labelKey: 'ability_empathy', type: 'dots-5' },
        { id: 'abilities.expression', labelKey: 'ability_expression', type: 'dots-5' },
        { id: 'abilities.intimidation', labelKey: 'ability_intimidation', type: 'dots-5' },
        { id: 'abilities.leadership', labelKey: 'ability_leadership', type: 'dots-5' },
        { id: 'abilities.streetwise', labelKey: 'ability_streetwise', type: 'dots-5' },
        { id: 'abilities.subterfuge', labelKey: 'ability_subterfuge', type: 'dots-5' },
        { id: 'abilities.animalKen', labelKey: 'ability_animal_ken', type: 'dots-5' },
        { id: 'abilities.crafts', labelKey: 'ability_crafts', type: 'dots-5' },
        { id: 'abilities.drive', labelKey: 'ability_drive', type: 'dots-5' },
        { id: 'abilities.etiquette', labelKey: 'ability_etiquette', type: 'dots-5' },
        { id: 'abilities.firearms', labelKey: 'ability_firearms', type: 'dots-5' },
        { id: 'abilities.larceny', labelKey: 'ability_larceny', type: 'dots-5' },
        { id: 'abilities.melee', labelKey: 'ability_melee', type: 'dots-5' },
        { id: 'abilities.performance', labelKey: 'ability_performance', type: 'dots-5' },
        { id: 'abilities.stealth', labelKey: 'ability_stealth', type: 'dots-5' },
        { id: 'abilities.survival', labelKey: 'ability_survival', type: 'dots-5' },
        { id: 'abilities.academics', labelKey: 'ability_academics', type: 'dots-5' },
        { id: 'abilities.computer', labelKey: 'ability_computer', type: 'dots-5' },
        { id: 'abilities.finance', labelKey: 'ability_finance', type: 'dots-5' },
        { id: 'abilities.investigation', labelKey: 'ability_investigation', type: 'dots-5' },
        { id: 'abilities.law', labelKey: 'ability_law', type: 'dots-5' },
        { id: 'abilities.medicine', labelKey: 'ability_medicine', type: 'dots-5' },
        { id: 'abilities.occult', labelKey: 'ability_occult', type: 'dots-5' },
        { id: 'abilities.politics', labelKey: 'ability_politics', type: 'dots-5' },
        { id: 'abilities.science', labelKey: 'ability_science', type: 'dots-5' },
        { id: 'abilities.technology', labelKey: 'ability_technology', type: 'dots-5' },
      ],
    },
    {
      id: 'advantages',
      labelKey: 'sheet_section_advantages',
      fields: [
        // Virtues are general Storyteller-system traits in classic
        // editions (Conscience / Self-Control / Courage); humans keep
        // them. They are NOT vampire-only.
        { id: 'virtues.conscience', labelKey: 'virtue_conscience', type: 'dots-5', min: 1 },
        { id: 'virtues.selfControl', labelKey: 'virtue_self_control', type: 'dots-5', min: 1 },
        { id: 'virtues.courage', labelKey: 'virtue_courage', type: 'dots-5', min: 1 },
      ],
    },
    {
      id: 'trackers',
      labelKey: 'sheet_section_trackers',
      fields: [
        // Willpower uses the classic current/max shape (same renderer V20
        // vampires use). Health uses the classic damage track. Both
        // re-use the existing `special-*` field renderers in DynamicSheet.
        { id: 'willpower', labelKey: 'sheet_willpower', type: 'special-willpower', gameplay: true },
        { id: 'health', labelKey: 'sheet_health', type: 'special-health', special: 'health', gameplay: true },
      ],
    },
    {
      id: 'merits_flaws',
      labelKey: 'sheet_section_merits_flaws',
      fields: [
        { id: 'merits', labelKey: 'sheet_merits', type: 'textarea' },
        { id: 'flaws', labelKey: 'sheet_flaws', type: 'textarea' },
      ],
    },
    {
      id: 'inventory',
      labelKey: 'sheet_section_inventory',
      fields: [
        { id: 'inventory', labelKey: 'sheet_section_inventory', type: 'inventory' },
      ],
    },
    {
      id: 'journal',
      labelKey: 'sheet_section_journal',
      fields: [
        { id: 'characterNotes', labelKey: 'sheet_section_journal', type: 'journal' },
      ],
    },
  ],
};
