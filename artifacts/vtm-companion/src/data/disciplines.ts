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
    clansWhoUse: ["gangrel", "nosferatu", "ravnos", "tzimisce"]
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
    clansWhoUse: ["malkavian", "toreador", "tremere", "giovanni", "salubri", "tzimisce"]
  },
  {
    id: "blood_sorcery",
    editions: ["V5"],
    name: "Blood Sorcery",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("The use of vitae for magical effects."),
    powers: [
      { name: "Corrosive Vitae", level: 1, description: fallbackStr("Acid blood."), tacticalUse: fallbackStr("Melt locks.") },
      { name: "Vitae Disruption (Level 2)", level: 2, description: fallbackStr("Disturb another vampire's vitae so it grows harder to use."), tacticalUse: fallbackStr("Drain an enemy's reserves before a fight.") },
      { name: "Blood Potency Surge (Level 3)", level: 3, description: fallbackStr("Briefly raise the power of your own vitae."), tacticalUse: fallbackStr("Punch above your blood potency for a single scene.") },
      { name: "Distant Vitae Theft (Level 4)", level: 4, description: fallbackStr("Pull blood out of a target's body at a distance."), tacticalUse: fallbackStr("Feed without ever touching the prey.") },
      { name: "Killing Touch (Level 5)", level: 5, description: fallbackStr("Turn vitae itself into a weapon by touch or short range."), tacticalUse: fallbackStr("Cripple or kill in a single contact.") }
    ],
    narrativeUses: fallbackArr(["Warding a haven."]),
    clansWhoUse: ["tremere", "assamite"],
    specialSystems: [
      {
        id: "blood-sorcery-rituals",
        kind: "rituals",
        title: fallbackStr("Rituals"),
        description: fallbackStr("Blood Sorcery rituals are learned and cast separately from dot powers. No canonical ritual list is included here yet."),
        needsReview: true,
        items: [
          { id: "blood-sorcery-ritual-1", name: "Ritual (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "blood-sorcery-ritual-2", name: "Ritual (Level 2) — Needs review", level: 2, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "blood-sorcery-ritual-3", name: "Ritual (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true }
        ]
      }
    ]
  },
  {
    id: "thaumaturgy",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Thaumaturgy",
    type: fallbackStr("Sorcery"),
    description: fallbackStr("Old blood magic."),
    powers: [],
    narrativeUses: fallbackArr(["Rituals."]),
    clansWhoUse: ["tremere"],
    specialSystems: [
      {
        id: "thaumaturgy-paths",
        kind: "paths",
        title: fallbackStr("Paths"),
        description: fallbackStr("Classic Thaumaturgy is organized into paths — each path is a separate progression of effects from level 1 to 5. Canonical path names are not listed here yet."),
        needsReview: true,
        items: [
          { id: "thaumaturgy-path-1", name: "Path (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-path-2", name: "Path (Level 2) — Needs review", level: 2, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-path-3", name: "Path (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-path-4", name: "Path (Level 4) — Needs review", level: 4, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-path-5", name: "Path (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true }
        ]
      },
      {
        id: "thaumaturgy-rituals",
        kind: "rituals",
        title: fallbackStr("Rituals"),
        description: fallbackStr("Thaumaturgy rituals are separate from paths and follow their own learning rules. No canonical ritual list is included here yet."),
        needsReview: true,
        items: [
          { id: "thaumaturgy-ritual-1", name: "Ritual (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-ritual-3", name: "Ritual (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "thaumaturgy-ritual-5", name: "Ritual (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true }
        ]
      }
    ]
  },
  {
    id: "obtenebration",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Obtenebration",
    type: fallbackStr("Shadow"),
    description: fallbackStr("Control over shadows."),
    powers: [
      { name: "Shadow Sight (Level 1)", level: 1, description: fallbackStr("See clearly into and through darkness."), tacticalUse: fallbackStr("Spot threats in unlit places.") },
      { name: "Shadow Grasp (Level 2)", level: 2, description: fallbackStr("Extend a tendril of shadow to grab, trip, or strike at short range."), tacticalUse: fallbackStr("Reach a target without exposing yourself.") },
      { name: "Shroud (Level 3)", level: 3, description: fallbackStr("Wrap an area in heavy unnatural darkness."), tacticalUse: fallbackStr("Blind opponents and panic mortals.") },
      { name: "Shadow Body (Level 4)", level: 4, description: fallbackStr("Reshape part of yourself into living darkness."), tacticalUse: fallbackStr("Resist mundane weapons by being only partially solid.") },
      { name: "Tenebrous Form (Level 5)", level: 5, description: fallbackStr("Become a body of darkness entirely."), tacticalUse: fallbackStr("Slip through light gaps and physical barriers.") }
    ],
    narrativeUses: fallbackArr(["Scaring mortals."]),
    clansWhoUse: ["lasombra"]
  },
  {
    id: "necromancy",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Necromancy",
    type: fallbackStr("Sorcery/Death"),
    description: fallbackStr("The magic of death and souls."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["giovanni"],
    specialSystems: [
      {
        id: "necromancy-paths",
        kind: "paths",
        title: fallbackStr("Paths"),
        description: fallbackStr("Classic Necromancy is organized into paths — each is a separate progression of death-themed effects from level 1 to 5. Canonical path names are not listed here yet."),
        needsReview: true,
        items: [
          { id: "necromancy-path-1", name: "Path (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "necromancy-path-2", name: "Path (Level 2) — Needs review", level: 2, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "necromancy-path-3", name: "Path (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "necromancy-path-4", name: "Path (Level 4) — Needs review", level: 4, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true },
          { id: "necromancy-path-5", name: "Path (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical path name and a short original summary."), needsReview: true }
        ]
      },
      {
        id: "necromancy-rituals",
        kind: "rituals",
        title: fallbackStr("Rituals"),
        description: fallbackStr("Necromancy rituals are separate from paths and follow their own learning rules. No canonical ritual list is included here yet."),
        needsReview: true,
        items: [
          { id: "necromancy-ritual-1", name: "Ritual (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "necromancy-ritual-3", name: "Ritual (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true },
          { id: "necromancy-ritual-5", name: "Ritual (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical ritual name and a short original summary."), needsReview: true }
        ]
      }
    ]
  },
  {
    id: "quietus",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Quietus",
    type: fallbackStr("Assassination"),
    description: fallbackStr("The silent magic of the blood."),
    powers: [
      { name: "Sound Silencing (Level 1)", level: 1, description: fallbackStr("Smother sound in a small area around you."), tacticalUse: fallbackStr("Move, fight, or feed without alerting anyone.") },
      { name: "Toxic Bite (Level 2)", level: 2, description: fallbackStr("Turn your saliva or vitae into a poison delivered by touch."), tacticalUse: fallbackStr("End a target after a single bite or contact.") },
      { name: "Precision Strike (Level 3)", level: 3, description: fallbackStr("Deliver a single attack of devastating accuracy."), tacticalUse: fallbackStr("Finish a critical target in one decisive motion.") },
      { name: "Distant Reach (Level 4)", level: 4, description: fallbackStr("Harm a target at a distance through veiled blood-borne means."), tacticalUse: fallbackStr("Hurt a foe you cannot physically approach.") },
      { name: "Final Verdict (Level 5)", level: 5, description: fallbackStr("Use blood and silence to kill at the cost of your own vitae."), tacticalUse: fallbackStr("Reserve for the most important target.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["assamite"]
  },
  {
    id: "serpentis",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Serpentis",
    type: fallbackStr("Transformation"),
    description: fallbackStr("The corrupting gifts of Set."),
    powers: [
      { name: "Serpent's Sight (Level 1)", level: 1, description: fallbackStr("Read hidden truths and surface deceptions in others."), tacticalUse: fallbackStr("Spot a lie or read intent during negotiation.") },
      { name: "Venomous Bite (Level 2)", level: 2, description: fallbackStr("Grow fangs that deliver an incapacitating venom on bite."), tacticalUse: fallbackStr("Quiet a struggle by poisoning the prey.") },
      { name: "Hypnotic Sway (Level 3)", level: 3, description: fallbackStr("Move with hypnotic grace that traps an observer's attention."), tacticalUse: fallbackStr("Hold a single viewer in place during a tense moment.") },
      { name: "Serpent Form (Level 4)", level: 4, description: fallbackStr("Transform into a great serpent."), tacticalUse: fallbackStr("Escape, hide, or attack in a serpent's body.") },
      { name: "Heart Concealment (Level 5)", level: 5, description: fallbackStr("Remove your own heart and hide it elsewhere for safekeeping."), tacticalUse: fallbackStr("Become nearly impossible to kill outright while the heart is hidden.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["followers_of_set"]
  },
  {
    id: "vicissitude",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Vicissitude",
    type: fallbackStr("Fleshcrafting"),
    description: fallbackStr("The alien art of shaping bone and flesh."),
    powers: [
      { name: "Self-Reshape (Level 1)", level: 1, description: fallbackStr("Reshape your own face and minor features by touch."), tacticalUse: fallbackStr("Wear another's look or hide a known one.") },
      { name: "Fleshcraft (Level 2)", level: 2, description: fallbackStr("Mold the flesh of a willing or restrained target."), tacticalUse: fallbackStr("Disguise allies or punish enemies.") },
      { name: "Bonecraft (Level 3)", level: 3, description: fallbackStr("Reshape bone in yourself or in others."), tacticalUse: fallbackStr("Add hidden claws, blades, or armor beneath skin.") },
      { name: "Battle Form (Level 4)", level: 4, description: fallbackStr("Take on a hulking, monstrous shape built for combat."), tacticalUse: fallbackStr("Become a frontline fighter no one wants to face.") },
      { name: "Bloodform (Level 5)", level: 5, description: fallbackStr("Reduce your body to a pool of vitae and reform elsewhere."), tacticalUse: fallbackStr("Escape capture or fit through any opening.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["tzimisce"]
  },
  {
    id: "chimerstry",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Chimerstry",
    type: fallbackStr("Illusion"),
    description: fallbackStr("The power to craft convincing illusions."),
    powers: [
      { name: "Small Illusion (Level 1)", level: 1, description: fallbackStr("Conjure a small, brief, convincing illusion of any sense."), tacticalUse: fallbackStr("Distract a guard or hide a tell.") },
      { name: "Shared Illusion (Level 2)", level: 2, description: fallbackStr("Project an illusion to multiple witnesses at once."), tacticalUse: fallbackStr("Misdirect a crowd or a search party.") },
      { name: "Solid Illusion (Level 3)", level: 3, description: fallbackStr("Give an illusion enough apparent substance that observers feel it."), tacticalUse: fallbackStr("Confuse opponents who reach for what is not there.") },
      { name: "Anchored Illusion (Level 4)", level: 4, description: fallbackStr("Anchor an illusion in a place so it persists without your attention."), tacticalUse: fallbackStr("Set a lasting decoy or false scene.") },
      { name: "Reality Veil (Level 5)", level: 5, description: fallbackStr("Layer illusion over the world so thickly that believers can be wounded by it."), tacticalUse: fallbackStr("Turn a battlefield into something opponents cannot trust.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ravnos"]
  },
  {
    id: "celerity",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Celerity",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural speed."),
    powers: [
      { name: "Rapid Reflexes", level: 1, description: fallbackStr("React faster than humanly possible."), tacticalUse: fallbackStr("Dodge bullets.") },
      { name: "Fleetness", level: 2, description: fallbackStr("Move with incredible speed."), tacticalUse: fallbackStr("Close the distance instantly.") },
      { name: "Speed Burst (Level 3)", level: 3, description: fallbackStr("Briefly move in a blur for a short repositioning."), tacticalUse: fallbackStr("Cross a room or escape a hold in a heartbeat.") },
      { name: "Quickened Action (Level 4)", level: 4, description: fallbackStr("Act multiple times in the span of one normal moment."), tacticalUse: fallbackStr("Strike again before the foe finishes turning.") },
      { name: "Untrackable Motion (Level 5)", level: 5, description: fallbackStr("Move so quickly that observers cannot follow you."), tacticalUse: fallbackStr("Cross a crowded space without being seen or hit.") }
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
      { name: "Mesmerize", level: 2, description: fallbackStr("Implant complex commands."), tacticalUse: fallbackStr("Force a guard to let you in.") },
      { name: "Memory Reshape (Level 3)", level: 3, description: fallbackStr("Rewrite a target's recent memories in lasting detail."), tacticalUse: fallbackStr("Cover any trace of a feeding or crime.") },
      { name: "Compelled Reasoning (Level 4)", level: 4, description: fallbackStr("Make a subject invent their own justification for obeying."), tacticalUse: fallbackStr("Plant orders that survive later scrutiny.") },
      { name: "Absolute Command (Level 5)", level: 5, description: fallbackStr("Issue a single command no target can resist."), tacticalUse: fallbackStr("Force a target to act against their own nature.") }
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
      { name: "Unseen Passage", level: 2, description: fallbackStr("Move while invisible."), tacticalUse: fallbackStr("Infiltrate heavily guarded areas.") },
      { name: "Hidden from Lenses (Level 3)", level: 3, description: fallbackStr("Conceal yourself even from cameras and recording devices."), tacticalUse: fallbackStr("Move through modern surveillance unseen.") },
      { name: "Sudden Vanish (Level 4)", level: 4, description: fallbackStr("Disappear from sight even while observers are looking at you."), tacticalUse: fallbackStr("Break pursuit by ceasing to be visible.") },
      { name: "False Face (Level 5)", level: 5, description: fallbackStr("Take on the appearance of someone else for a time."), tacticalUse: fallbackStr("Slip into restricted places wearing another identity.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["nosferatu", "malkavian", "assamite", "followers_of_set", "ravnos", "salubri"]
  },
  {
    id: "presence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Presence",
    type: fallbackStr("Social"),
    description: fallbackStr("Attract and terrify."),
    powers: [
      { name: "Awe", level: 1, description: fallbackStr("Fascination."), tacticalUse: fallbackStr("Distract crowds.") },
      { name: "Daunt", level: 2, description: fallbackStr("Instill fear."), tacticalUse: fallbackStr("Rout enemies.") },
      { name: "Devoted Heart (Level 3)", level: 3, description: fallbackStr("Bind a target's emotions to you so they want to please you."), tacticalUse: fallbackStr("Turn an opponent into a brief admirer.") },
      { name: "Distant Summons (Level 4)", level: 4, description: fallbackStr("Call a previously affected subject to come to your side."), tacticalUse: fallbackStr("Pull a known ally or victim to you from across the city.") },
      { name: "Crown of Awe (Level 5)", level: 5, description: fallbackStr("Project an aura so commanding that none nearby will oppose you."), tacticalUse: fallbackStr("Quiet a hostile room without violence.") }
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
      { name: "Feral Weapons", level: 2, description: fallbackStr("Grow claws."), tacticalUse: fallbackStr("Deal aggravated damage.") },
      { name: "Beast Form (Level 3)", level: 3, description: fallbackStr("Transform into an animal shape such as a wolf or bat."), tacticalUse: fallbackStr("Travel or scout without raising alarm.") },
      { name: "Earth Embrace (Level 4)", level: 4, description: fallbackStr("Sink into bare soil to rest hidden from the sun."), tacticalUse: fallbackStr("Improvise a safe daylight haven in an emergency.") },
      { name: "Mist Body (Level 5)", level: 5, description: fallbackStr("Dissolve your form into a drifting mist."), tacticalUse: fallbackStr("Slip through cracks, vents, and barred passages.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["gangrel", "followers_of_set", "tzimisce"]
  },
  {
    id: "fortitude",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Fortitude",
    type: fallbackStr("Physical"),
    description: fallbackStr("Unearthly toughness."),
    powers: [
      { name: "Resilience", level: 1, description: fallbackStr("Add rating to Health."), tacticalUse: fallbackStr("Survive longer.") },
      { name: "Toughness", level: 2, description: fallbackStr("Subtract damage."), tacticalUse: fallbackStr("Ignore minor hits.") },
      { name: "Steady Mind (Level 3)", level: 3, description: fallbackStr("Resist mental and social manipulation more easily."), tacticalUse: fallbackStr("Shrug off interrogation, dread, and supernatural sway.") },
      { name: "Defy the Bane (Level 4)", level: 4, description: fallbackStr("Endure damage that should be lethal to your kind."), tacticalUse: fallbackStr("Survive fire, sun exposure, or staking long enough to escape.") },
      { name: "Marble Flesh (Level 5)", level: 5, description: fallbackStr("Treat ordinary weapons as if they were nothing."), tacticalUse: fallbackStr("Walk straight through gunfire toward the target.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "gangrel", "giovanni", "salubri", "ravnos"]
  },
  {
    id: "potence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Potence",
    type: fallbackStr("Physical"),
    description: fallbackStr("Supernatural strength."),
    powers: [
      { name: "Lethal Body", level: 1, description: fallbackStr("Add damage to unarmed."), tacticalUse: fallbackStr("Brawl advantage.") },
      { name: "Prowess", level: 2, description: fallbackStr("Feats of strength."), tacticalUse: fallbackStr("Break doors.") },
      { name: "Crushing Feed (Level 3)", level: 3, description: fallbackStr("Drain a victim in one overwhelming attack of supernatural strength."), tacticalUse: fallbackStr("End a feeding silently in a single move.") },
      { name: "Smash Through (Level 4)", level: 4, description: fallbackStr("Shatter walls, doors, and barriers with raw force."), tacticalUse: fallbackStr("Make your own entrance instead of negotiating one.") },
      { name: "Quake Strike (Level 5)", level: 5, description: fallbackStr("Strike the ground hard enough to topple everything nearby."), tacticalUse: fallbackStr("Knock down opponents and shatter terrain.") }
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
    powers: [
      { name: "Shadow Step (Level 1)", level: 1, description: fallbackStr("Step from one shadow to a nearby spot."), tacticalUse: fallbackStr("Slip out of sight and reappear behind cover.") },
      { name: "Reach into Shadow (Level 2)", level: 2, description: fallbackStr("Extend a shadowy limb or grasp from your own shadow."), tacticalUse: fallbackStr("Pull, strike, or trip a foe from cover.") },
      { name: "Touch of Decay (Level 3)", level: 3, description: fallbackStr("Cause a target's body or vitae to wither at your touch."), tacticalUse: fallbackStr("Wound from contact alone, no weapon needed.") },
      { name: "Stygian Veil (Level 4)", level: 4, description: fallbackStr("Shroud an area in darkness mortals cannot see through."), tacticalUse: fallbackStr("Drop a fight into total obscurity.") },
      { name: "Tenebrous Body (Level 5)", level: 5, description: fallbackStr("Take on a body of living shadow."), tacticalUse: fallbackStr("Move where light cannot and matter cannot stop you.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["lasombra", "giovanni"],
    specialSystems: [
      {
        id: "oblivion-ceremonies",
        kind: "ceremonies",
        title: fallbackStr("Ceremonies"),
        description: fallbackStr("Oblivion ceremonies are death-touched rites learned and performed separately from dot powers. No canonical ceremony list is included here yet."),
        needsReview: true,
        items: [
          { id: "oblivion-ceremony-1", name: "Ceremony (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical ceremony name and a short original summary."), needsReview: true },
          { id: "oblivion-ceremony-3", name: "Ceremony (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical ceremony name and a short original summary."), needsReview: true },
          { id: "oblivion-ceremony-5", name: "Ceremony (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical ceremony name and a short original summary."), needsReview: true }
        ]
      }
    ]
  },
  {
    id: "valeren",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Valeren",
    type: fallbackStr("Healing/Combat"),
    description: fallbackStr("The discipline of the Salubri."),
    powers: [
      { name: "Sense Vitality (Level 1)", level: 1, description: fallbackStr("Read the health, injury, and life-force of those nearby."), tacticalUse: fallbackStr("Triage allies or pick out the weak link of a foe.") },
      { name: "Healing Touch (Level 2)", level: 2, description: fallbackStr("Heal injuries with a touch by drawing on your own vitae."), tacticalUse: fallbackStr("Stabilize a downed ally between fights.") },
      { name: "Burden the Suffering (Level 3)", level: 3, description: fallbackStr("Take another's pain and damage onto yourself."), tacticalUse: fallbackStr("Save a critical ally at personal cost.") },
      { name: "Stillness (Level 4)", level: 4, description: fallbackStr("Hold a target frozen in place by sheer will."), tacticalUse: fallbackStr("Stop a runner or pin a brawler for the group.") },
      { name: "Third Eye Strike (Level 5)", level: 5, description: fallbackStr("Open the third eye to channel raw force into a single decisive blow."), tacticalUse: fallbackStr("Reserve for diablerists, infernalists, and similar threats.") }
    ],
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
    clansWhoUse: ["thin_blood"],
    specialSystems: [
      {
        id: "thin-blood-alchemy-formulae",
        kind: "formulae",
        title: fallbackStr("Formulae"),
        description: fallbackStr("Thin-Blood Alchemy is built from formulae brewed by the alchemist, not flat dot powers. Each formula has a level and is learned individually. Canonical formula names are not listed here yet."),
        needsReview: true,
        items: [
          { id: "thin-blood-alchemy-formula-1", name: "Formula (Level 1) — Needs review", level: 1, summary: fallbackStr("Needs review: confirm a canonical formula name and a short original summary."), needsReview: true },
          { id: "thin-blood-alchemy-formula-2", name: "Formula (Level 2) — Needs review", level: 2, summary: fallbackStr("Needs review: confirm a canonical formula name and a short original summary."), needsReview: true },
          { id: "thin-blood-alchemy-formula-3", name: "Formula (Level 3) — Needs review", level: 3, summary: fallbackStr("Needs review: confirm a canonical formula name and a short original summary."), needsReview: true },
          { id: "thin-blood-alchemy-formula-4", name: "Formula (Level 4) — Needs review", level: 4, summary: fallbackStr("Needs review: confirm a canonical formula name and a short original summary."), needsReview: true },
          { id: "thin-blood-alchemy-formula-5", name: "Formula (Level 5) — Needs review", level: 5, summary: fallbackStr("Needs review: confirm a canonical formula name and a short original summary."), needsReview: true }
        ]
      }
    ]
  }
];
