import { DisciplineEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const disciplines: DisciplineEntry[] = [
  {
    id: "animalism",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Animalism",
    type: { es: "Mental", en: "Mental", pt: "Mental", fr: "Mental", de: "Geistig", it: "Mentale" },
    description: {
      es: "La afinidad sobrenatural y control sobre la bestia. Permite a los vampiros comunicarse con animales, comandarlos, o incluso manipular a la Bestia de otros vampiros.",
      en: "The supernatural affinity with and control over the beast. Allows vampires to communicate with animals, command them, or even manipulate the Beast of other vampires.",
      pt: "", fr: "", de: "", it: ""
    },
    powers: [
      { name: "Bond Famulus", level: 1, description: {es: "Crea un vínculo especial con un animal.", en: "Create a special bond with an animal.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Crear un espía o guardián leal.", en: "Create a loyal spy or guardian.", pt: "", fr: "", de: "", it: ""} },
      { name: "Sense the Beast", level: 1, description: {es: "Percibe el estado emocional y la presencia de otras bestias.", en: "Sense the emotional state and presence of other beasts.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Detectar intenciones hostiles o vampiros ocultos.", en: "Detect hostile intentions or hidden vampires.", pt: "", fr: "", de: "", it: ""} },
      { name: "Feral Whispers", level: 2, description: {es: "Comunícate claramente con los animales.", en: "Communicate clearly with animals.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Reunir información o pedir favores simples.", en: "Gather information or ask for simple favors.", pt: "", fr: "", de: "", it: ""} },
      { name: "Animal Succulence", level: 3, description: {es: "Sacia más hambre alimentándose de animales.", en: "Slake more hunger feeding on animals.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Sobrevivir sin cazar humanos.", en: "Survive without hunting humans.", pt: "", fr: "", de: "", it: ""} },
      { name: "Quell the Beast", level: 4, description: {es: "Apacigua a la Bestia de otro vampiro.", en: "Calm another vampire's Beast.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Detener un frenesí o desmoralizar al enemigo.", en: "Stop a frenzy or demoralize an enemy.", pt: "", fr: "", de: "", it: ""} },
      { name: "Drawing Out the Beast", level: 5, description: {es: "Transfiere tu frenesí a otra persona.", en: "Transfer your frenzy to another person.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Evitar perder el control mientras causas caos.", en: "Avoid losing control while causing chaos.", pt: "", fr: "", de: "", it: ""} }
    ],
    narrativeUses: {es: ["Usar ratas como red de espías.", "Controlar lobos como guardianes del refugio."], en: ["Using rats as a spy network.", "Controlling wolves as haven guardians."], pt: [], fr: [], de: [], it: []},
    clansWhoUse: ["gangrel", "nosferatu", "ravnos"]
  },
  {
    id: "auspex",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Auspex",
    type: { es: "Sensorial", en: "Sensory", pt: "Sensorial", fr: "Sensoriel", de: "Sensorisch", it: "Sensoriale" },
    description: {
      es: "Percepción extrasensorial que permite a los vampiros ver más allá de los sentidos mundanos, leer auras, revelar ilusiones e incluso proyectarse astralmente.",
      en: "Extrasensory perception that allows vampires to see beyond mundane senses, read auras, reveal illusions, and even project themselves astrally.",
      pt: "", fr: "", de: "", it: ""
    },
    powers: [
      { name: "Heightened Senses", level: 1, description: {es: "Mejora dramáticamente los cinco sentidos.", en: "Dramatically improves all five senses.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Escuchar susurros lejanos o ver en la oscuridad absoluta.", en: "Hear distant whispers or see in absolute darkness.", pt: "", fr: "", de: "", it: ""} },
      { name: "Sense the Unseen", level: 1, description: {es: "Detectar presencias ocultas o ilusiones sobrenaturales.", en: "Detect hidden presences or supernatural illusions.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Descubrir a vampiros ofuscados.", en: "Discover obfuscated vampires.", pt: "", fr: "", de: "", it: ""} },
      { name: "Premonition", level: 2, description: {es: "Tener destellos súbitos de peligro o revelaciones.", en: "Experience sudden flashes of danger or revelations.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Evitar emboscadas o recibir pistas del Narrador.", en: "Avoid ambushes or receive clues from the Storyteller.", pt: "", fr: "", de: "", it: ""} },
      { name: "Scry the Soul", level: 3, description: {es: "Leer el aura de un ser para conocer su estado emocional o sobrenatural.", en: "Read a being's aura to know their emotional or supernatural state.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Saber si alguien miente, es vampiro, mago o está frenético.", en: "Know if someone is lying, a vampire, mage, or frenzied.", pt: "", fr: "", de: "", it: ""} },
      { name: "Telepathy", level: 4, description: {es: "Leer los pensamientos superficiales o comunicarse mentalmente.", en: "Read surface thoughts or communicate mentally.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Interrogar sin abrir la boca, coordinar en silencio.", en: "Interrogate silently, coordinate quietly.", pt: "", fr: "", de: "", it: ""} },
      { name: "Clairvoyance", level: 5, description: {es: "Proyectar los sentidos a lugares remotos.", en: "Project senses to remote locations.", pt: "", fr: "", de: "", it: ""}, tacticalUse: {es: "Espiar reuniones secretas sin estar físicamente presente.", en: "Spy on secret meetings without being physically present.", pt: "", fr: "", de: "", it: ""} }
    ],
    narrativeUses: {es: ["Resolver asesinatos.", "Encontrar objetos malditos."], en: ["Solving murders.", "Finding cursed objects."], pt: [], fr: [], de: [], it: []},
    clansWhoUse: ["malkavian", "toreador", "tremere", "giovanni", "salubri"]
  },
  {
    id: "blood_sorcery",
    editions: ["V5"],
    name: "Blood Sorcery",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("The use of vitae for magical effects."),
    powers: [
      { name: "Corrosive Vitae", level: 1, description: fallbackStr("Acid blood."), tacticalUse: fallbackStr("Melt locks.") }
    ],
    narrativeUses: fallbackArr(["Warding a haven."]),
    clansWhoUse: ["tremere", "assamite"]
  },
  {
    id: "thaumaturgy",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Thaumaturgy",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("Old blood magic."),
    powers: [],
    narrativeUses: fallbackArr(["Rituals."]),
    clansWhoUse: ["tremere"]
  },
  {
    id: "obtenebration",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Obtenebration",
    type: fallbackStr("Shadow"),
    description: fallbackStr("Control over shadows."),
    powers: [],
    narrativeUses: fallbackArr(["Scaring mortals."]),
    clansWhoUse: ["lasombra"]
  },
  {
    id: "celerity",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Celerity",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural speed."),
    powers: [
      { name: "Rapid Reflexes", level: 1, description: fallbackStr("React faster than humanly possible."), tacticalUse: fallbackStr("Dodge bullets.") },
      { name: "Fleetness", level: 2, description: fallbackStr("Move with incredible speed."), tacticalUse: fallbackStr("Close the distance instantly.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "toreador", "assamite"]
  },
  {
    id: "dominate",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Dominate",
    type: fallbackStr("Mental"),
    description: fallbackStr("Crush another's mind."),
    powers: [
      { name: "Cloud Memory", level: 1, description: fallbackStr("Erase short term memory."), tacticalUse: fallbackStr("Cover up a feeding.") },
      { name: "Mesmerize", level: 2, description: fallbackStr("Implant complex commands."), tacticalUse: fallbackStr("Force a guard to let you in.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "tremere", "lasombra", "malkavian"]
  },
  {
    id: "obfuscate",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Obfuscate",
    type: fallbackStr("Stealth"),
    description: fallbackStr("Vanish from minds."),
    powers: [
      { name: "Cloak of Shadows", level: 1, description: fallbackStr("Hide in the shadows."), tacticalUse: fallbackStr("Eavesdrop.") },
      { name: "Unseen Passage", level: 2, description: fallbackStr("Move while invisible."), tacticalUse: fallbackStr("Infiltrate heavily guarded areas.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["nosferatu", "malkavian", "assamite", "followers_of_set", "ravnos"]
  },
  {
    id: "presence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Presence",
    type: fallbackStr("Social"),
    description: fallbackStr("Attract and terrify."),
    powers: [
      { name: "Awe", level: 1, description: fallbackStr("Fascination."), tacticalUse: fallbackStr("Distract crowds.") },
      { name: "Daunt", level: 2, description: fallbackStr("Instill fear."), tacticalUse: fallbackStr("Rout enemies.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["toreador", "brujah", "ventrue", "followers_of_set", "ravnos"]
  },
  {
    id: "protean",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Protean",
    type: fallbackStr("Transformation"),
    description: fallbackStr("Alter physical form."),
    powers: [
      { name: "Eyes of the Beast", level: 1, description: fallbackStr("See perfectly in darkness."), tacticalUse: fallbackStr("Night combat.") },
      { name: "Feral Weapons", level: 2, description: fallbackStr("Grow claws."), tacticalUse: fallbackStr("Deal aggravated damage.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["gangrel", "followers_of_set"]
  },
  {
    id: "fortitude",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Fortitude",
    type: fallbackStr("Physical"),
    description: fallbackStr("Unearthly toughness."),
    powers: [
      { name: "Resilience", level: 1, description: fallbackStr("Add rating to Health."), tacticalUse: fallbackStr("Survive longer.") },
      { name: "Toughness", level: 2, description: fallbackStr("Subtract damage."), tacticalUse: fallbackStr("Ignore minor hits.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "gangrel", "giovanni", "salubri"]
  },
  {
    id: "potence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Potence",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural strength."),
    powers: [
      { name: "Lethal Body", level: 1, description: fallbackStr("Add damage to unarmed."), tacticalUse: fallbackStr("Brawl advantage.") },
      { name: "Prowess", level: 2, description: fallbackStr("Feats of strength."), tacticalUse: fallbackStr("Break doors.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "nosferatu", "lasombra"]
  },
  {
    id: "oblivion",
    editions: ["V5"],
    name: "Oblivion",
    type: fallbackStr("Shadow/Death"),
    description: fallbackStr("Shadows and necromancy merged in V5."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["lasombra", "giovanni"]
  },
  {
    id: "valeren",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Valeren",
    type: fallbackStr("Healing/Combat"),
    description: fallbackStr("The discipline of the Salubri."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["salubri"]
  },
  {
    id: "thin_blood_alchemy",
    editions: ["V5"],
    name: "Thin-Blood Alchemy",
    type: fallbackStr("Alchemy"),
    description: fallbackStr("Counterfeit disciplines via alchemy."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: []
  }
];
