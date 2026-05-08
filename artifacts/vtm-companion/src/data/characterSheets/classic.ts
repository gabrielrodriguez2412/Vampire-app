import { SheetSchema } from './schemas';

export const classicSchema: SheetSchema = {
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
        { id: 'generation', labelKey: 'sheet_generation', type: 'number' },
        { id: 'sire', labelKey: 'sheet_sire', type: 'text' },
      ]
    },
    {
      id: 'attributes',
      labelKey: 'sheet_section_attributes',
      fields: [
        // Physical
        { id: 'attributes.strength', labelKey: 'attr_strength', type: 'dots-5' },
        { id: 'attributes.dexterity', labelKey: 'attr_dexterity', type: 'dots-5' },
        { id: 'attributes.stamina', labelKey: 'attr_stamina', type: 'dots-5' },
        // Social
        { id: 'attributes.charisma', labelKey: 'attr_charisma', type: 'dots-5' },
        { id: 'attributes.manipulation', labelKey: 'attr_manipulation', type: 'dots-5' },
        { id: 'attributes.appearance', labelKey: 'attr_appearance', type: 'dots-5' },
        // Mental
        { id: 'attributes.perception', labelKey: 'attr_perception', type: 'dots-5' },
        { id: 'attributes.intelligence', labelKey: 'attr_intelligence', type: 'dots-5' },
        { id: 'attributes.wits', labelKey: 'attr_wits', type: 'dots-5' },
      ]
    },
    {
      id: 'abilities',
      labelKey: 'sheet_section_abilities',
      fields: [
        // Talents
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
        
        // Skills
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
        
        // Knowledges
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
      ]
    },
    {
      id: 'advantages',
      labelKey: 'sheet_section_advantages',
      fields: [
        { id: 'virtues.conscience', labelKey: 'virtue_conscience', type: 'dots-5', min: 1 },
        { id: 'virtues.selfControl', labelKey: 'virtue_self_control', type: 'dots-5', min: 1 },
        { id: 'virtues.courage', labelKey: 'virtue_courage', type: 'dots-5', min: 1 },
      ]
    },
    {
      id: 'other_traits',
      labelKey: 'sheet_section_other_traits',
      fields: [
        { id: 'humanity', labelKey: 'sheet_humanity_path', type: 'dots-10' },
        { id: 'willpower', labelKey: 'sheet_willpower', type: 'special-willpower' },
        { id: 'bloodPool', labelKey: 'sheet_blood_pool', type: 'special-health', special: 'bloodPool' },
      ]
    },
    {
      id: 'merits_flaws',
      labelKey: 'sheet_section_merits_flaws',
      fields: [
        { id: 'merits', labelKey: 'sheet_merits', type: 'textarea' },
        { id: 'flaws', labelKey: 'sheet_flaws', type: 'textarea' },
      ]
    },
    {
      id: 'notes',
      labelKey: 'sheet_section_notes',
      fields: [
        { id: 'notes', labelKey: 'sheet_notes', type: 'textarea' },
      ]
    }
  ]
};
