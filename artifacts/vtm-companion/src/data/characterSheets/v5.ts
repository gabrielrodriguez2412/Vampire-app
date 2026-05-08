import { SheetSchema } from './schemas';

export const v5Schema: SheetSchema = {
  sections: [
    {
      id: 'basic_info',
      labelKey: 'sheet_section_basic',
      fields: [
        { id: 'name', labelKey: 'sheet_name', type: 'text' },
        { id: 'playerName', labelKey: 'sheet_player', type: 'text' },
        { id: 'chronicle', labelKey: 'sheet_chronicle', type: 'text' },
        { id: 'concept', labelKey: 'sheet_concept', type: 'text' },
        { id: 'ambition', labelKey: 'sheet_ambition', type: 'text' },
        { id: 'desire', labelKey: 'sheet_desire', type: 'text' },
        { id: 'predatorType', labelKey: 'sheet_predator_type', type: 'text' },
        { id: 'sire', labelKey: 'sheet_sire', type: 'text' },
      ]
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
      ]
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
      ]
    },
    {
      id: 'vampire_traits',
      labelKey: 'sheet_section_vampire_traits',
      fields: [
        { id: 'bloodPotency', labelKey: 'sheet_blood_potency', type: 'dots-10', min: 1 },
        { id: 'hunger', labelKey: 'sheet_hunger', type: 'dots-5', special: 'hunger' },
        { id: 'humanity', labelKey: 'sheet_humanity', type: 'dots-10' },
        { id: 'resonance', labelKey: 'sheet_resonance', type: 'text' },
      ]
    },
    {
      id: 'trackers',
      labelKey: 'sheet_section_trackers',
      fields: [
        { id: 'health', labelKey: 'sheet_health', type: 'special-health' },
        { id: 'willpower', labelKey: 'sheet_willpower', type: 'special-willpower' },
        { id: 'experience', labelKey: 'sheet_experience', type: 'number' },
      ]
    },
    {
      id: 'social_moral',
      labelKey: 'sheet_section_social_moral',
      fields: [
        { id: 'touchstones', labelKey: 'sheet_touchstones', type: 'textarea' },
        { id: 'convictions', labelKey: 'sheet_convictions', type: 'textarea' },
        { id: 'advantages', labelKey: 'sheet_advantages', type: 'textarea' },
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
