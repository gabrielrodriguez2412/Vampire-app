import { DisciplineEntry } from '../types';

/**
 * `fallbackStr` populates every language slot with the same English
 * string, which is a polite lie — it tells `getLocalizedText` that
 * Spanish content exists when it does not. We keep the helper for
 * fields where the English value is intentionally language-neutral
 * (e.g. power names, type labels we have not yet translated) so the
 * existing rendering keeps working, but **description** fields now
 * use the honest `enOnly` helper below. That lets the Batch G
 * fallback-aware UI on the disciplines page surface a subtle "EN"
 * indicator instead of silently rendering English text under a
 * Spanish heading.
 *
 * TODO(batch-h-disciplines): migrate `type` and power `name` slots to
 * honest per-locale records in a future content batch. Doing it here
 * would mean translating every type/name string in one go, which is
 * out of scope for the discipline-name pass.
 */
const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

/**
 * Honest EN-only string record. Fills only the `en` slot so the
 * generic `getLocalizedText` fallback chain correctly reports
 * `usingFallback: true` for any non-EN locale, which lets the
 * disciplines page render a quiet EN chip instead of pretending the
 * Spanish translation already landed.
 */
const enOnly = (val: string) => ({ es: '', en: val, pt: '', fr: '', de: '', it: '' });

/**
 * EN + ES populated, pt/fr/de/it left empty (route through fallback).
 * Same pattern used for clan body translations in Batch G2. Use this
 * for power `description` and `tacticalUse` fields when translating
 * the priority disciplines.
 */
const enEs = (enStr: string, esStr: string) => ({
  en: enStr,
  es: esStr,
  pt: '',
  fr: '',
  de: '',
  it: '',
});

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
    description: enOnly("The use of vitae for magical effects."),
    powers: [
      { name: "Corrosive Vitae", level: 1, description: enEs("Acid blood.", "Sangre ácida."), tacticalUse: enEs("Melt locks.", "Derretir cerraduras.") },
      { name: "Vitae Disruption (Level 2)", level: 2, description: enEs("Disturb another vampire's vitae so it grows harder to use.", "Perturba la vitae de otro vampiro para que le cueste usarla."), tacticalUse: enEs("Drain an enemy's reserves before a fight.", "Drenar las reservas del enemigo antes de un combate.") },
      { name: "Blood Potency Surge (Level 3)", level: 3, description: enEs("Briefly raise the power of your own vitae.", "Eleva brevemente la potencia de tu propia vitae."), tacticalUse: enEs("Punch above your blood potency for a single scene.", "Golpear por encima de tu potencia de sangre durante una escena.") },
      { name: "Distant Vitae Theft (Level 4)", level: 4, description: enEs("Pull blood out of a target's body at a distance.", "Extrae sangre del cuerpo de un objetivo a distancia."), tacticalUse: enEs("Feed without ever touching the prey.", "Alimentarte sin tocar a la presa.") },
      { name: "Killing Touch (Level 5)", level: 5, description: enEs("Turn vitae itself into a weapon by touch or short range.", "Convierte la propia vitae en arma por contacto o corta distancia."), tacticalUse: enEs("Cripple or kill in a single contact.", "Mutilar o matar con un solo toque.") }
    ],
    narrativeUses: fallbackArr(["Warding a haven."]),
    clansWhoUse: ["tremere", "assamite"],
    // Special-systems pending-state copy (Batch K).
    //
    // Previously every system below carried fake placeholder items
    // like `"Ritual (Level 1) — Needs review"` so the accordion would
    // not look empty. Those entries were ugly and confused users who
    // could not tell the placeholder from real content. The new
    // pattern keeps the accordion section (so the structure on the
    // disciplines page is consistent across editions) but ships an
    // empty `items: []` list and lets the localized `description`
    // explain that a canon-review pass is still pending.
    //
    // TODO(batch-k-disciplines): when an app-safe short summary list
    // for any of these systems is ready, append items to the matching
    // section. The page already renders items above the description,
    // and the `needsReview` badge can be dropped once the section is
    // fully populated.
    specialSystems: [
      {
        id: "blood-sorcery-rituals",
        kind: "rituals",
        title: enEs("Rituals", "Rituales"),
        description: enEs(
          "Rituals are learned and cast separately from dot powers. An app-safe summary list is pending review and will be added in a future content batch.",
          "Los rituales se aprenden y se lanzan de forma separada de los poderes principales. La lista de resúmenes seguros está pendiente de revisión y se añadirá en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
    ],
  },
  {
    id: "thaumaturgy",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Thaumaturgy",
    type: fallbackStr("Sorcery"),
    description: enOnly("Old blood magic."),
    powers: [],
    narrativeUses: fallbackArr(["Rituals."]),
    clansWhoUse: ["tremere"],
    specialSystems: [
      {
        id: "thaumaturgy-paths",
        kind: "paths",
        title: enEs("Paths", "Sendas"),
        description: enEs(
          "Classic Thaumaturgy splits into separate paths of effects. The path list is pending review and will be expanded with app-safe summaries in a future content batch.",
          "La Taumaturgia clásica se divide en sendas separadas de efectos. La lista de sendas está pendiente de revisión y se ampliará con resúmenes seguros en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
      {
        id: "thaumaturgy-rituals",
        kind: "rituals",
        title: enEs("Rituals", "Rituales"),
        description: enEs(
          "Thaumaturgy rituals follow their own learning rules apart from paths. The ritual list is pending review and will be added in a future content batch.",
          "Los rituales de Taumaturgia siguen sus propias reglas de aprendizaje aparte de las sendas. La lista de rituales está pendiente de revisión y se añadirá en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
    ],
  },
  {
    id: "obtenebration",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Obtenebration",
    type: fallbackStr("Shadow"),
    description: enOnly("Control over shadows."),
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
    description: enOnly("The magic of death and souls."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["giovanni"],
    specialSystems: [
      {
        id: "necromancy-paths",
        kind: "paths",
        title: enEs("Paths", "Sendas"),
        description: enEs(
          "Classic Necromancy organizes into death-themed paths. The path list is pending review and will be expanded with app-safe summaries in a future content batch.",
          "La Nigromancia clásica se organiza en sendas con temática de muerte. La lista de sendas está pendiente de revisión y se ampliará con resúmenes seguros en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
      {
        id: "necromancy-rituals",
        kind: "rituals",
        title: enEs("Rituals", "Rituales"),
        description: enEs(
          "Necromancy rituals are separate from paths and follow their own learning rules. The ritual list is pending review and will be added in a future content batch.",
          "Los rituales de Nigromancia son independientes de las sendas y siguen sus propias reglas de aprendizaje. La lista de rituales está pendiente de revisión y se añadirá en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
    ],
  },
  {
    id: "quietus",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Quietus",
    type: fallbackStr("Assassination"),
    description: enOnly("The silent magic of the blood."),
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
    description: enOnly("The corrupting gifts of Set."),
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
    description: enOnly("The alien art of shaping bone and flesh."),
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
    description: enOnly("The power to craft convincing illusions."),
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
    description: enOnly("Supernatural speed."),
    powers: [
      { name: "Rapid Reflexes", level: 1, description: enEs("React faster than humanly possible.", "Reacciona más rápido de lo humanamente posible."), tacticalUse: enEs("Dodge bullets.", "Esquivar balas.") },
      { name: "Fleetness", level: 2, description: enEs("Move with incredible speed.", "Muévete con velocidad increíble."), tacticalUse: enEs("Close the distance instantly.", "Cerrar la distancia al instante.") },
      { name: "Speed Burst (Level 3)", level: 3, description: enEs("Briefly move in a blur for a short repositioning.", "Te desplazas brevemente en un borrón para reposicionarte."), tacticalUse: enEs("Cross a room or escape a hold in a heartbeat.", "Cruzar una sala o zafarte de un agarre en un latido.") },
      { name: "Quickened Action (Level 4)", level: 4, description: enEs("Act multiple times in the span of one normal moment.", "Actúa varias veces en el lapso de un instante."), tacticalUse: enEs("Strike again before the foe finishes turning.", "Golpear de nuevo antes de que el enemigo termine de girarse.") },
      { name: "Untrackable Motion (Level 5)", level: 5, description: enEs("Move so quickly that observers cannot follow you.", "Te mueves tan rápido que los observadores no pueden seguirte."), tacticalUse: enEs("Cross a crowded space without being seen or hit.", "Cruzar un espacio concurrido sin ser visto ni alcanzado.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "toreador", "assamite"]
  },
  {
    id: "dominate",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Dominate",
    type: fallbackStr("Mental"),
    description: enOnly("Crush another's mind."),
    powers: [
      { name: "Cloud Memory", level: 1, description: enEs("Erase short term memory.", "Borra la memoria reciente."), tacticalUse: enEs("Cover up a feeding.", "Encubrir una alimentación.") },
      { name: "Mesmerize", level: 2, description: enEs("Implant complex commands.", "Implanta órdenes complejas."), tacticalUse: enEs("Force a guard to let you in.", "Forzar a un guardia a dejarte pasar.") },
      { name: "Memory Reshape (Level 3)", level: 3, description: enEs("Rewrite a target's recent memories in lasting detail.", "Reescribe los recuerdos recientes de un objetivo con detalle duradero."), tacticalUse: enEs("Cover any trace of a feeding or crime.", "Cubrir cualquier rastro de una alimentación o un crimen.") },
      { name: "Compelled Reasoning (Level 4)", level: 4, description: enEs("Make a subject invent their own justification for obeying.", "Haz que la víctima invente su propia justificación para obedecer."), tacticalUse: enEs("Plant orders that survive later scrutiny.", "Plantar órdenes que sobreviven al escrutinio posterior.") },
      { name: "Absolute Command (Level 5)", level: 5, description: enEs("Issue a single command no target can resist.", "Emite una orden única que ningún objetivo puede resistir."), tacticalUse: enEs("Force a target to act against their own nature.", "Forzar a un objetivo a actuar contra su propia naturaleza.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "tremere", "lasombra", "malkavian"]
  },
  {
    id: "obfuscate",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Obfuscate",
    type: fallbackStr("Stealth"),
    description: enOnly("Vanish from minds."),
    powers: [
      { name: "Cloak of Shadows", level: 1, description: enEs("Hide in the shadows.", "Ocúltate en las sombras."), tacticalUse: enEs("Eavesdrop.", "Escuchar a escondidas.") },
      { name: "Unseen Passage", level: 2, description: enEs("Move while invisible.", "Muévete mientras eres invisible."), tacticalUse: enEs("Infiltrate heavily guarded areas.", "Infiltrarte en zonas muy vigiladas.") },
      { name: "Hidden from Lenses (Level 3)", level: 3, description: enEs("Conceal yourself even from cameras and recording devices.", "Ocúltate incluso a cámaras y dispositivos de grabación."), tacticalUse: enEs("Move through modern surveillance unseen.", "Moverte por la vigilancia moderna sin ser visto.") },
      { name: "Sudden Vanish (Level 4)", level: 4, description: enEs("Disappear from sight even while observers are looking at you.", "Desaparece de la vista incluso mientras te están mirando."), tacticalUse: enEs("Break pursuit by ceasing to be visible.", "Romper una persecución al dejar de ser visible.") },
      { name: "False Face (Level 5)", level: 5, description: enEs("Take on the appearance of someone else for a time.", "Adopta el aspecto de otra persona durante un tiempo."), tacticalUse: enEs("Slip into restricted places wearing another identity.", "Colarte en lugares restringidos con otra identidad.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["nosferatu", "malkavian", "assamite", "followers_of_set", "ravnos", "salubri"]
  },
  {
    id: "presence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Presence",
    type: fallbackStr("Social"),
    description: enOnly("Attract and terrify."),
    powers: [
      { name: "Awe", level: 1, description: enEs("Fascination.", "Fascinación."), tacticalUse: enEs("Distract crowds.", "Distraer multitudes.") },
      { name: "Daunt", level: 2, description: enEs("Instill fear.", "Infunde miedo."), tacticalUse: enEs("Rout enemies.", "Hacer huir a los enemigos.") },
      { name: "Devoted Heart (Level 3)", level: 3, description: enEs("Bind a target's emotions to you so they want to please you.", "Vincula las emociones de un objetivo a ti para que desee complacerte."), tacticalUse: enEs("Turn an opponent into a brief admirer.", "Convertir a un oponente en un admirador efímero.") },
      { name: "Distant Summons (Level 4)", level: 4, description: enEs("Call a previously affected subject to come to your side.", "Llama a un sujeto previamente afectado para que acuda a tu lado."), tacticalUse: enEs("Pull a known ally or victim to you from across the city.", "Atraer a un aliado o víctima conocido desde el otro lado de la ciudad.") },
      { name: "Crown of Awe (Level 5)", level: 5, description: enEs("Project an aura so commanding that none nearby will oppose you.", "Proyecta un aura tan imponente que nadie cercano se atreve a oponerse a ti."), tacticalUse: enEs("Quiet a hostile room without violence.", "Calmar una sala hostil sin violencia.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["toreador", "brujah", "ventrue", "followers_of_set", "ravnos"]
  },
  {
    id: "protean",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Protean",
    type: fallbackStr("Transformation"),
    description: enOnly("Alter physical form."),
    powers: [
      { name: "Eyes of the Beast", level: 1, description: enEs("See perfectly in darkness.", "Ve perfectamente en la oscuridad."), tacticalUse: enEs("Night combat.", "Combate nocturno.") },
      { name: "Feral Weapons", level: 2, description: enEs("Grow claws.", "Te crecen garras."), tacticalUse: enEs("Deal aggravated damage.", "Infligir daño agravado.") },
      { name: "Beast Form (Level 3)", level: 3, description: enEs("Transform into an animal shape such as a wolf or bat.", "Transfórmate en una forma animal como lobo o murciélago."), tacticalUse: enEs("Travel or scout without raising alarm.", "Viajar o explorar sin levantar alarma.") },
      { name: "Earth Embrace (Level 4)", level: 4, description: enEs("Sink into bare soil to rest hidden from the sun.", "Húndete en la tierra desnuda para descansar oculto del sol."), tacticalUse: enEs("Improvise a safe daylight haven in an emergency.", "Improvisar un refugio diurno seguro en una emergencia.") },
      { name: "Mist Body (Level 5)", level: 5, description: enEs("Dissolve your form into a drifting mist.", "Disuelve tu forma en una niebla flotante."), tacticalUse: enEs("Slip through cracks, vents, and barred passages.", "Colarte por grietas, rejillas y pasajes cerrados.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["gangrel", "followers_of_set", "tzimisce"]
  },
  {
    id: "fortitude",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Fortitude",
    type: fallbackStr("Physical"),
    description: enOnly("Unearthly toughness."),
    powers: [
      { name: "Resilience", level: 1, description: enEs("Add rating to Health.", "Suma tu puntuación a Salud."), tacticalUse: enEs("Survive longer.", "Sobrevive más tiempo.") },
      { name: "Toughness", level: 2, description: enEs("Subtract damage.", "Reduce el daño recibido."), tacticalUse: enEs("Ignore minor hits.", "Ignorar golpes menores.") },
      { name: "Steady Mind (Level 3)", level: 3, description: enEs("Resist mental and social manipulation more easily.", "Resiste con mayor facilidad la manipulación mental y social."), tacticalUse: enEs("Shrug off interrogation, dread, and supernatural sway.", "Aguantar interrogatorios, pavor y manipulación sobrenatural.") },
      { name: "Defy the Bane (Level 4)", level: 4, description: enEs("Endure damage that should be lethal to your kind.", "Soporta daño que debería ser letal para los de tu especie."), tacticalUse: enEs("Survive fire, sun exposure, or staking long enough to escape.", "Sobrevivir al fuego, al sol o a un estacazo el tiempo suficiente para escapar.") },
      { name: "Marble Flesh (Level 5)", level: 5, description: enEs("Treat ordinary weapons as if they were nothing.", "Trata las armas ordinarias como si no fueran nada."), tacticalUse: enEs("Walk straight through gunfire toward the target.", "Caminar directo a través de una ráfaga hacia el objetivo.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["ventrue", "gangrel", "giovanni", "salubri", "ravnos"]
  },
  {
    id: "potence",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    name: "Potence",
    type: fallbackStr("Physical"),
    description: enOnly("Supernatural strength."),
    powers: [
      { name: "Lethal Body", level: 1, description: enEs("Add damage to unarmed.", "Añade daño a los ataques desarmados."), tacticalUse: enEs("Brawl advantage.", "Ventaja en pelea.") },
      { name: "Prowess", level: 2, description: enEs("Feats of strength.", "Hazañas de fuerza."), tacticalUse: enEs("Break doors.", "Romper puertas.") },
      { name: "Crushing Feed (Level 3)", level: 3, description: enEs("Drain a victim in one overwhelming attack of supernatural strength.", "Drena a una víctima en un único ataque de fuerza sobrenatural."), tacticalUse: enEs("End a feeding silently in a single move.", "Terminar una alimentación en silencio en un solo movimiento.") },
      { name: "Smash Through (Level 4)", level: 4, description: enEs("Shatter walls, doors, and barriers with raw force.", "Destroza muros, puertas y barreras con fuerza bruta."), tacticalUse: enEs("Make your own entrance instead of negotiating one.", "Abrir tu propia entrada en vez de negociarla.") },
      { name: "Quake Strike (Level 5)", level: 5, description: enEs("Strike the ground hard enough to topple everything nearby.", "Golpea el suelo con fuerza suficiente para derribar todo a tu alrededor."), tacticalUse: enEs("Knock down opponents and shatter terrain.", "Derribar a los oponentes y romper el terreno.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["brujah", "nosferatu", "lasombra"]
  },
  {
    id: "oblivion",
    editions: ["V5"],
    name: "Oblivion",
    type: fallbackStr("Shadow/Death"),
    description: enOnly("Shadows and necromancy merged in V5."),
    powers: [
      { name: "Shadow Step (Level 1)", level: 1, description: enEs("Step from one shadow to a nearby spot.", "Pasa de una sombra a otra cercana."), tacticalUse: enEs("Slip out of sight and reappear behind cover.", "Salir de la vista y reaparecer tras un cubierto.") },
      { name: "Reach into Shadow (Level 2)", level: 2, description: enEs("Extend a shadowy limb or grasp from your own shadow.", "Extiende una extremidad o agarre de sombra desde tu propia sombra."), tacticalUse: enEs("Pull, strike, or trip a foe from cover.", "Tirar, golpear o derribar a un enemigo desde el cubierto.") },
      { name: "Touch of Decay (Level 3)", level: 3, description: enEs("Cause a target's body or vitae to wither at your touch.", "Haz que el cuerpo o la vitae del objetivo se marchiten con tu toque."), tacticalUse: enEs("Wound from contact alone, no weapon needed.", "Herir solo con el contacto, sin arma.") },
      { name: "Stygian Veil (Level 4)", level: 4, description: enEs("Shroud an area in darkness mortals cannot see through.", "Envuelve un área en oscuridad que los mortales no pueden atravesar."), tacticalUse: enEs("Drop a fight into total obscurity.", "Sumergir un combate en oscuridad total.") },
      { name: "Tenebrous Body (Level 5)", level: 5, description: enEs("Take on a body of living shadow.", "Adopta un cuerpo de sombra viviente."), tacticalUse: enEs("Move where light cannot and matter cannot stop you.", "Moverte donde la luz no llega y la materia no detiene.") }
    ],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["lasombra", "giovanni"],
    specialSystems: [
      {
        id: "oblivion-ceremonies",
        kind: "ceremonies",
        title: enEs("Ceremonies", "Ceremonias"),
        description: enEs(
          "Oblivion ceremonies are death-touched rites learned and performed separately from dot powers. The ceremony list is pending review and will be added in a future content batch.",
          "Las ceremonias de Olvido son ritos tocados por la muerte que se aprenden y ejecutan aparte de los poderes principales. La lista de ceremonias está pendiente de revisión y se añadirá en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
    ],
  },
  {
    id: "valeren",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    name: "Valeren",
    type: fallbackStr("Healing/Combat"),
    description: enOnly("The discipline of the Salubri."),
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
    description: enOnly("Counterfeit disciplines via alchemy."),
    powers: [],
    narrativeUses: fallbackArr([]),
    clansWhoUse: ["thin_blood"],
    specialSystems: [
      {
        id: "thin-blood-alchemy-formulae",
        kind: "formulae",
        title: enEs("Formulae", "Fórmulas"),
        description: enEs(
          "Thin-Blood Alchemy is built from formulae brewed by the alchemist rather than flat dot powers. Each formula has a level and is learned individually. The formula list is pending review and will be added in a future content batch.",
          "La Alquimia de Sangre Débil se construye a partir de fórmulas que el propio alquimista prepara, en lugar de poderes principales. Cada fórmula tiene un nivel y se aprende de forma individual. La lista de fórmulas está pendiente de revisión y se añadirá en una próxima actualización de contenido.",
        ),
        needsReview: true,
        items: [],
      },
    ],
  },
];
