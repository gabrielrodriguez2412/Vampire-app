import { DisciplineEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const disciplines: DisciplineEntry[] = [
  {
    id: "animalism",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Animalism",
    type: fallbackStr("Mental"),
    description: {
      es: "La afinidad sobrenatural y control sobre la bestia.",
      en: "The supernatural affinity with and control over the beast.",
      pt: "", fr: "", de: "", it: ""
    },
    powers: [
      { name: "Bond Famulus", level: 1, description: fallbackStr("Bind an animal to you."), tacticalUse: fallbackStr("Create a spy.") },
      { name: "Sense the Beast", level: 1, description: fallbackStr("Sense emotional state."), tacticalUse: fallbackStr("Determine frenzy.") },
      { name: "Feral Whispers", level: 2, description: fallbackStr("Communicate with animals."), tacticalUse: fallbackStr("Gather info.") }
    ],
    narrativeUses: fallbackArr(["Using rats as spies."]),
    clansWhoUse: ["gangrel", "nosferatu", "ravnos"]
  },
  {
    id: "auspex",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Auspex",
    type: fallbackStr("Sensory"),
    description: fallbackStr("Extrasensory perception."),
    powers: [
      { name: "Heightened Senses", level: 1, description: fallbackStr("Improve senses."), tacticalUse: fallbackStr("Hear whispers.") }
    ],
    narrativeUses: fallbackArr(["Solving murders."]),
    clansWhoUse: ["malkavian", "toreador", "tremere", "hecata", "salubri"]
  },
  {
    id: "blood_sorcery",
    editions: ["v5"],
    name: "Blood Sorcery",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("The use of vitae for magical effects."),
    powers: [
      { name: "Corrosive Vitae", level: 1, description: fallbackStr("Acid blood."), tacticalUse: fallbackStr("Melt locks.") }
    ],
    narrativeUses: fallbackArr(["Warding a haven."]),
    clansWhoUse: ["tremere", "banu_haqim"]
  },
  {
    id: "thaumaturgy",
    editions: ["v1", "v2", "revised", "v20"],
    name: "Thaumaturgy",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("Old blood magic."),
    powers: [],
    narrativeUses: fallbackArr(["Rituals."]),
    clansWhoUse: ["tremere"]
  },
  {
    id: "obtenebration",
    editions: ["v1", "v2", "revised", "v20"],
    name: "Obtenebration",
    type: fallbackStr("Shadow"),
    description: fallbackStr("Control over shadows."),
    powers: [],
    narrativeUses: fallbackArr(["Scaring mortals."]),
    clansWhoUse: ["lasombra"]
  },
  {
    id: "celerity",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Celerity",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural speed."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "toreador", "banu_haqim"]
  },
  {
    id: "dominate",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Dominate",
    type: fallbackStr("Mental"),
    description: fallbackStr("Crush another's mind."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "tremere", "lasombra", "malkavian"]
  },
  {
    id: "obfuscate",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Obfuscate",
    type: fallbackStr("Stealth"),
    description: fallbackStr("Vanish from minds."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["nosferatu", "malkavian", "banu_haqim", "ministry", "ravnos"]
  },
  {
    id: "presence",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Presence",
    type: fallbackStr("Social"),
    description: fallbackStr("Attract and terrify."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["toreador", "brujah", "ventrue", "ministry", "ravnos"]
  },
  {
    id: "protean",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Protean",
    type: fallbackStr("Transformation"),
    description: fallbackStr("Alter physical form."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["gangrel", "ministry"]
  },
  {
    id: "fortitude",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Fortitude",
    type: fallbackStr("Physical"),
    description: fallbackStr("Unearthly toughness."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "gangrel", "hecata", "salubri"]
  },
  {
    id: "potence",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Potence",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural strength."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "nosferatu", "lasombra"]
  },
  {
    id: "oblivion",
    editions: ["v5"],
    name: "Oblivion",
    type: fallbackStr("Shadow/Death"),
    description: fallbackStr("Shadows and necromancy merged in V5."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["lasombra", "hecata"]
  },
  {
    id: "valeren",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    name: "Valeren",
    type: fallbackStr("Healing/Combat"),
    description: fallbackStr("The discipline of the Salubri."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["salubri"]
  },
  {
    id: "thin_blood_alchemy",
    editions: ["v5"],
    name: "Thin-Blood Alchemy",
    type: fallbackStr("Alchemy"),
    description: fallbackStr("Counterfeit disciplines via alchemy."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: []
  }
];