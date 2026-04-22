import { ClanEntry } from "../types";

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const clans: ClanEntry[] = [
  {
    id: "brujah",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Brujah"),
    description: {
      es: "Rebeldes, idealistas y luchadores que defienden causas nobles y caóticas.",
      en: "Rebels, idealists, and fighters who champion causes both noble and chaotic.",
      pt: "", fr: "", de: "", it: ""
    },
    identity: {
      es: "La Chusma, Idealistas, Filósofos",
      en: "The Rabble, Idealists, Philosophers",
      pt: "", fr: "", de: "", it: ""
    },
    weakness: {
      es: "Temperamento violento: Su bestia es provocada fácilmente.",
      en: "Violent Temper: Their beast is easily provoked.",
      pt: "", fr: "", de: "", it: ""
    },
    disciplines: ["celerity", "potence", "presence"],
    playstyle: {
      es: "Agresivo, social e imponente físicamente.",
      en: "Aggressive, social, and physically imposing.",
      pt: "", fr: "", de: "", it: ""
    },
    roleplayIdeas: {
      es: ["Un rockero punk.", "Un excapitán de debate.", "Un veterano desilusionado."],
      en: ["A punk rocker.", "A former debate team captain.", "A disillusioned veteran."],
      pt: [], fr: [], de: [], it: []
    },
    relationships: {
      es: "Desconfían de los Ventrue, se relacionan con los Gangrel.",
      en: "Distrust Ventrue, relate to Gangrel.",
      pt: "", fr: "", de: "", it: ""
    },
    color: "#8B0000",
    icon: "🔥"
  },
  {
    id: "gangrel",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Gangrel"),
    description: fallbackStr("Feral survivors."),
    identity: fallbackStr("Outcasts, Wanderers"),
    weakness: fallbackStr("Animal Features."),
    disciplines: ["animalism", "fortitude", "protean"],
    playstyle: fallbackStr("Independent."),
    roleplayIdeas: fallbackArr(["Urban explorer."]),
    relationships: fallbackStr("Respect Brujah."),
    color: "#556B2F",
    icon: "🐺"
  },
  {
    id: "malkavian",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Malkavian"),
    description: fallbackStr("Seers and mad prophets."),
    identity: fallbackStr("Oracles, Lunatics"),
    weakness: fallbackStr("Affliction."),
    disciplines: ["auspex", "dominate", "obfuscate"],
    playstyle: fallbackStr("Mysterious."),
    roleplayIdeas: fallbackArr(["Conspiracy theorist."]),
    relationships: fallbackStr("Fascinate Toreador."),
    color: "#4B0082",
    icon: "👁️"
  },
  {
    id: "nosferatu",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Nosferatu"),
    description: fallbackStr("Horrifically deformed by the Embrace."),
    identity: fallbackStr("Sewer Rats, Information Brokers"),
    weakness: fallbackStr("Hideous Appearance."),
    disciplines: ["animalism", "obfuscate", "potence"],
    playstyle: fallbackStr("Stealthy, investigative."),
    roleplayIdeas: fallbackArr(["Hacker who operates from abandoned tunnels."]),
    relationships: fallbackStr("Trade with Tremere."),
    color: "#2F4F4F",
    icon: "🦇"
  },
  {
    id: "toreador",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Toreador"),
    description: fallbackStr("Aesthetes and social manipulators."),
    identity: fallbackStr("Degenerates, Artists, Divas"),
    weakness: fallbackStr("Aesthetic Fixation."),
    disciplines: ["auspex", "celerity", "presence"],
    playstyle: fallbackStr("Charming, perceptive."),
    roleplayIdeas: fallbackArr(["Struggling artist."]),
    relationships: fallbackStr("Adore Brujah's passion."),
    color: "#C71585",
    icon: "🌹"
  },
  {
    id: "tremere",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Tremere"),
    description: fallbackStr("Secretive blood sorcerers."),
    identity: fallbackStr("Warlocks, Usurpers"),
    weakness: fallbackStr("Deficient Blood."),
    disciplines: ["auspex", "blood_sorcery", "dominate"],
    playstyle: fallbackStr("Mystical, academic."),
    roleplayIdeas: fallbackArr(["Occult antiquarian."]),
    relationships: fallbackStr("Rival Ventrue."),
    color: "#800000",
    icon: "🩸"
  },
  {
    id: "ventrue",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Ventrue"),
    description: fallbackStr("The self-proclaimed rulers of the Kindred."),
    identity: fallbackStr("Blue Bloods, Tyrants"),
    weakness: fallbackStr("Rarefied Tastes."),
    disciplines: ["dominate", "fortitude", "presence"],
    playstyle: fallbackStr("Commanding, resilient."),
    roleplayIdeas: fallbackArr(["Ruthless corporate raider."]),
    relationships: fallbackStr("Command Tremere."),
    color: "#000080",
    icon: "👑"
  },
  {
    id: "banu_haqim",
    editions: ["v5"],
    type: "clan",
    name: fallbackStr("Banu Haqim"),
    description: fallbackStr("Assassins, judges, and scholars of the blood."),
    identity: fallbackStr("Assassins, Judges"),
    weakness: fallbackStr("Blood Addiction."),
    disciplines: ["blood_sorcery", "celerity", "obfuscate"],
    playstyle: fallbackStr("Lethal, disciplined."),
    roleplayIdeas: fallbackArr(["Street vigilante."]),
    relationships: fallbackStr("Judge Tremere."),
    color: "#2E2B5F",
    icon: "⚖️"
  },
  {
    id: "hecata",
    editions: ["v5"],
    type: "clan",
    name: fallbackStr("Hecata"),
    description: fallbackStr("A twisted family of necromancers."),
    identity: fallbackStr("Necromancers, The Clan of Death"),
    weakness: fallbackStr("Painful Kiss."),
    disciplines: ["auspex", "fortitude", "oblivion"],
    playstyle: fallbackStr("Morbid, wealthy."),
    roleplayIdeas: fallbackArr(["Mortician."]),
    relationships: fallbackStr("Isolate from Camarilla."),
    color: "#4A4A4A",
    icon: "💀"
  },
  {
    id: "lasombra",
    editions: ["v5"],
    type: "clan",
    name: fallbackStr("Lasombra"),
    description: fallbackStr("Ruthless social Darwinists."),
    identity: fallbackStr("Keepers, Shadow Manipulators"),
    weakness: fallbackStr("Defective Reflection."),
    disciplines: ["dominate", "oblivion", "potence"],
    playstyle: fallbackStr("Ambitious, manipulative."),
    roleplayIdeas: fallbackArr(["Corrupt priest."]),
    relationships: fallbackStr("Compete with Ventrue."),
    color: "#1A1A1A",
    icon: "🌑"
  },
  {
    id: "ministry",
    editions: ["v5"],
    type: "clan",
    name: fallbackStr("Ministry"),
    description: fallbackStr("Tempters, liberators, and cult leaders."),
    identity: fallbackStr("Followers of Set"),
    weakness: fallbackStr("Light Sensitivity."),
    disciplines: ["obfuscate", "presence", "protean"],
    playstyle: fallbackStr("Seductive, subversive."),
    roleplayIdeas: fallbackArr(["Charismatic self-help guru."]),
    relationships: fallbackStr("Tempt Toreador."),
    color: "#B8860B",
    icon: "🐍"
  },
  {
    id: "ravnos",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Ravnos"),
    description: fallbackStr("Doomed wanderers and masters of illusion."),
    identity: fallbackStr("Deceivers, Rogues"),
    weakness: fallbackStr("Doomed to Wander."),
    disciplines: ["animalism", "obfuscate", "presence"],
    playstyle: fallbackStr("Tricky, mobile."),
    roleplayIdeas: fallbackArr(["Grifter."]),
    relationships: fallbackStr("Evade Ventrue."),
    color: "#CD5C5C",
    icon: "🃏"
  },
  {
    id: "salubri",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Salubri"),
    description: fallbackStr("Hunted healers with three eyes."),
    identity: fallbackStr("Cyclops, Healers"),
    weakness: fallbackStr("Prey Exclusion."),
    disciplines: ["auspex", "fortitude", "valeren"],
    playstyle: fallbackStr("Altruistic."),
    roleplayIdeas: fallbackArr(["Hunted saint."]),
    relationships: fallbackStr("Hunted by Tremere."),
    color: "#F0E68C",
    icon: "👁️‍🗨️"
  }
];
