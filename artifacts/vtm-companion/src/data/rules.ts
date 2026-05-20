import { RuleEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const rules: RuleEntry[] = [
  {
    id: "dice-pools",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Reserva de Dados (Dice Pools)", en: "Dice Pools", pt: "", fr: "", de: "", it: "" },
    category: "Tiradas",
    categories: ["Tiradas"],
    shortExplanation: { es: "Tira d10s (Atributo + Habilidad).", en: "Roll d10s (Attribute + Skill).", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "El sistema principal usa D10. Formas tu reserva sumando un Atributo y una Habilidad y tiras esa cantidad de dados de diez caras. El umbral de éxito y cómo se cuentan los éxitos varían por edición; mira las entradas específicas (Dados de Hambre en V5, Dificultad y Éxitos para el desglose general).",
      en: "The main system uses D10s. Form your pool by adding an Attribute and a Skill, then roll that many ten-sided dice. The success threshold and how successes are counted vary by edition; see the edition-specific entries (Hunger Dice for V5, Difficulty & Successes for the general breakdown).",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Disparar: Destreza + Armas de Fuego.", "Intimidar a un matón: Fuerza + Intimidación."],
      en: ["Shooting: Dexterity + Firearms.", "Intimidating a thug: Strength + Intimidation."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["V5: 6+ es éxito", "Clásico: la dificultad fija el umbral", "Necesita revisión: detalles específicos por edición"],
      en: ["V5: 6+ is a success", "Classic: difficulty sets the threshold", "Needs review: specific per-edition details"],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["básico", "tiradas"]
  },
  {
    id: "hunger-dice",
    editions: ["V5"],
    title: { es: "Dados de Hambre", en: "Hunger Dice", pt: "", fr: "", de: "", it: "" },
    category: "Hambre",
    categories: ["Hambre", "Tiradas"],
    shortExplanation: { es: "Reemplaza dados normales por Dados de Hambre.", en: "Replace normal dice with Hunger Dice.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "El Hambre en V5 va del 0 al 5. Al realizar una tirada, sustituyes tus dados normales por Dados de Hambre (de diferente color) en una cantidad igual a tu nivel de Hambre actual, sin exceder el tamaño de la reserva.",
      en: "Hunger in V5 ranges from 0 to 5. When making a roll, substitute normal dice for Hunger Dice (of a different color) equal to your current Hunger level, up to the size of the pool.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Con reserva de 6 y Hambre 2, tiras 4 dados normales y 2 de hambre."],
      en: ["With pool of 6 and Hunger 2, roll 4 normal dice and 2 hunger dice."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Si un dado de Hambre saca 1 y fallas: Fallo Bestial.", "Si un dado de Hambre saca 10 en un crítico: Crítico Desastroso."],
      en: ["Hunger dice on 1 and failure: Bestial Failure.", "Hunger dice on 10 in a critical: Messy Critical."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["hambre", "bestia"]
  },
  {
    id: "rouse-check",
    editions: ["V5"],
    title: { es: "Chequeo de Enardecimiento", en: "Rouse Check", pt: "", fr: "", de: "", it: "" },
    category: "Hambre",
    categories: ["Hambre", "Mecánica"],
    shortExplanation: { es: "Tira 1 dado. 1-5 aumentas el hambre, 6-10 nada cambia.", en: "Roll 1 die. 1-5 hunger increases, 6-10 no change.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Para despertar la sangre (usar disciplinas, despertar cada noche, sanar), tiras un dado. Con éxito (6-10), no pasa nada. Con un fallo (1-5), tu Hambre aumenta en 1.",
      en: "To rouse the blood (use disciplines, wake each night, heal), roll one die. On a success (6-10), nothing happens. On a failure (1-5), your Hunger increases by 1.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Usas un poder de Presencia que requiere despertar la Sangre."],
      en: ["Using a Presence power that requires rousing the blood."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["No puedes tener más de 5 de Hambre.", "A Hambre 5, debes cazar o hacer un chequeo de frenesí por hambre."],
      en: ["Hunger cannot exceed 5.", "At Hunger 5, you must hunt or make a hunger frenzy check."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["hambre", "mecánica"]
  },
  {
    id: "frenzy",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Frenesí", en: "Frenzy", pt: "", fr: "", de: "", it: "" },
    category: "Bestia",
    categories: ["Bestia", "Combate"],
    shortExplanation: { es: "La pérdida de control ante ira, miedo o hambre.", en: "Loss of control to anger, fear, or hunger.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Cuando la Bestia toma el control. El personaje ignora el dolor y ataca la fuente de provocación, huye del peligro (Rötschreck), o ataca a la fuente de sangre más cercana.",
      en: "When the Beast takes control. The character ignores pain and attacks the source of provocation, flees danger (Rötschreck), or attacks the nearest blood source.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Recibir humillación extrema (Ira).", "Estar rodeado por fuego (Miedo)."],
      en: ["Extreme humiliation (Anger).", "Surrounded by fire (Fear)."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Resistir: Tirar Fuerza de Voluntad."],
      en: ["Resist: Roll Willpower."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["combate", "bestia", "autocontrol"]
  },
  {
    id: "aggravated-damage",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Daño Agravado", en: "Aggravated Damage", pt: "", fr: "", de: "", it: "" },
    category: "Combate",
    categories: ["Combate"],
    shortExplanation: { es: "Daño letal para vampiros (fuego, luz solar, disciplinas).", en: "Lethal damage for vampires (fire, sunlight, disciplines).", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "El daño Agravado es difícil de sanar para los Vástagos y proviene de fuentes inherentemente destructivas para ellos, como fuego, sol, garras de hombre lobo, o ciertas disciplinas. No se reduce a la mitad (en V5).",
      en: "Aggravated damage is difficult for Kindred to heal and comes from inherently destructive sources like fire, sunlight, werewolf claws, or certain disciplines. It is not halved (in V5).",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Exponerse al sol.", "Recibir un ataque con Garras de la Bestia."],
      en: ["Exposure to sunlight.", "Hit by Feral Weapons."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Requiere mucha vitae y sueño para curar.", "Lleva a la Muerte Definitiva rápidamente."],
      en: ["Requires much vitae and sleep to heal.", "Leads to Final Death quickly."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["salud", "combate"]
  },
  {
    id: "superficial-damage",
    editions: ["V5"],
    title: { es: "Daño Superficial", en: "Superficial Damage", pt: "", fr: "", de: "", it: "" },
    category: "Combate",
    categories: ["Combate"],
    shortExplanation: { es: "Daño contundente y cortante estándar (se divide a la mitad).", en: "Standard blunt/slashing damage (halved).", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Las armas de fuego, golpes, puñaladas (no apuntadas al corazón) provocan Daño Superficial a los vampiros, ya que son cadáveres. El daño total se divide entre 2 (redondeando hacia arriba).",
      en: "Firearms, punches, stabs (not to the heart) deal Superficial Damage to vampires, as they are walking corpses. Total damage is divided by 2 (rounded up).",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Recibir un disparo en el torso."],
      en: ["Getting shot in the torso."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Si el medidor de salud se llena de Superficial, empieza a convertirse en Agravado."],
      en: ["If health tracker is filled with Superficial, it starts converting to Aggravated."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["salud", "combate"]
  },
  {
    id: "willpower",
    editions: ["V5"],
    title: { es: "Fuerza de Voluntad (V5)", en: "Willpower (V5)", pt: "", fr: "", de: "", it: "" },
    category: "Mecánica",
    categories: ["Mecánica", "Tiradas"],
    shortExplanation: { es: "Marca daño en Voluntad para repetir dados o resistir.", en: "Mark Willpower damage to reroll dice or resist.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "En V5 marcas daño Superficial en tu medidor de Voluntad para repetir hasta tres dados regulares (no de Hambre) que hayan fallado, o para resistir compulsiones, ciertas Disciplinas y el frenesí.",
      en: "In V5 you mark Superficial damage to your Willpower tracker to reroll up to three regular (non-Hunger) failed dice, or to resist compulsions, certain Disciplines, and frenzy.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Gastar Voluntad para repetir un fallo en una tirada importante."],
      en: ["Spending Willpower to reroll a failure on an important check."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["No se pueden repetir dados de Hambre.", "Se recupera actuando según tu Deseo o Convicción."],
      en: ["Cannot reroll Hunger dice.", "Recovered by acting on Desire or Conviction."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["básico", "tiradas"]
  },
  {
    id: "willpower-classic",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    title: { es: "Fuerza de Voluntad (Clásico)", en: "Willpower (Classic)", pt: "", fr: "", de: "", it: "" },
    category: "Mecánica",
    categories: ["Mecánica", "Tiradas"],
    shortExplanation: { es: "Gasta puntos de Voluntad para un éxito asegurado o resistir.", en: "Spend Willpower points for a guaranteed success or to resist.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "En las ediciones clásicas tienes una reserva temporal de Voluntad. Gastar un punto suele permitir un éxito automático en una tirada o resistir efectos sobrenaturales como dominación o frenesí. Los detalles exactos (cuánto se gasta, qué resiste, cómo se recupera) varían por edición.",
      en: "In classic editions you have a temporary Willpower pool. Spending a point usually grants an automatic success on a roll, or resists supernatural effects like domination or frenzy. Exact details (how much spends, what it resists, how it refills) vary by edition.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Gastar Voluntad para asegurar un éxito.", "Resistir un intento de Dominar."],
      en: ["Spend Willpower to lock in a success.", "Resist a Dominate attempt."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Recuperación según escena/sesión a criterio del Narrador.", "Necesita revisión: reglas exactas por edición."],
      en: ["Refill is per scene/session at Storyteller discretion.", "Needs review: exact per-edition rules."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["básico", "tiradas", "clásico"]
  },
  {
    id: "humanity-loss",
    editions: ["V5"],
    title: { es: "Pérdida de Humanidad (V5)", en: "Humanity Loss (V5)", pt: "", fr: "", de: "", it: "" },
    category: "Moralidad",
    categories: ["Moralidad", "Bestia"],
    shortExplanation: { es: "Tirar Remordimiento tras violar dogmas.", en: "Roll Remorse after violating tenets.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "En V5, cuando violas los principios de la crónica o tus propias Convicciones sufres Máculas. Al final de la sesión, tiras Remordimiento: si fallas, tu Humanidad baja.",
      en: "In V5, when violating chronicle tenets or your Convictions you gain Stains. At the end of the session, roll Remorse: on a failure, your Humanity decreases.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Asesinar a un inocente a sangre fría.", "Abrazar a un mortal sin permiso."],
      en: ["Murdering an innocent in cold blood.", "Embracing a mortal without permission."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["A Humanidad 0, el personaje cae al control absoluto del Narrador como un Wight."],
      en: ["At Humanity 0, character falls to Storyteller control as a Wight."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["humanidad", "bestia"]
  },
  {
    id: "humanity-classic",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    title: { es: "Humanidad / Senda (Clásico)", en: "Humanity / Path (Classic)", pt: "", fr: "", de: "", it: "" },
    category: "Moralidad",
    categories: ["Moralidad", "Bestia"],
    shortExplanation: { es: "Actos contra tu Senda exigen tirada de degeneración.", en: "Acts against your Path force a degeneration roll.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "En las ediciones clásicas el personaje sigue una Senda (lo más común es la Senda de la Humanidad) con jerarquía de pecados. Cometer un acto por debajo de tu nivel desencadena una tirada de degeneración (Conciencia o equivalente); fallar baja la Senda. Las consecuencias exactas y los rasgos asociados (Conciencia, Autocontrol, Valor) varían por edición.",
      en: "In classic editions the character follows a Path (most often the Path of Humanity) with a hierarchy of sins. An act below your level triggers a degeneration roll (Conscience or equivalent); failing lowers the Path. Exact consequences and the traits involved (Conscience, Self-Control, Courage) vary by edition.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Robar a un inocente en una Senda de Humanidad media."],
      en: ["Stealing from an innocent on a mid Humanity Path."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["A Humanidad 0 el personaje suele caer al control del Narrador.", "Necesita revisión: jerarquía de pecados y rasgos exactos por edición."],
      en: ["At Humanity 0 the character usually falls to Storyteller control.", "Needs review: per-edition sin hierarchy and exact traits."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["humanidad", "senda", "clásico"]
  },
  {
    id: "resonance",
    editions: ["V5"],
    title: { es: "Resonancia y Discracia", en: "Resonance and Dyscrasia", pt: "", fr: "", de: "", it: "" },
    category: "Sangre",
    categories: ["Sangre", "Hambre"],
    shortExplanation: { es: "El estado emocional de la víctima altera la Sangre.", en: "Victim's emotional state alters the Blood.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "La sangre de los mortales tiene 'sabor' emocional. Colérica (enojo), Sanguínea (amor/pasión), Melancólica (tristeza), Flemática (calma). Beber sangre con fuerte resonancia otorga bonos a ciertas disciplinas.",
      en: "Mortal blood has emotional 'flavor'. Choleric (anger), Sanguine (love/passion), Melancholic (sadness), Phlegmatic (calm). Drinking strongly resonant blood grants bonuses to specific disciplines.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Beber de alguien furioso (Colérico) para un bono en Potencia."],
      en: ["Drinking from an angry person (Choleric) for a Potence bonus."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Discracia: Resonancia tan intensa que otorga habilidades especiales temporales."],
      en: ["Dyscrasia: Resonance so intense it grants temporary special abilities."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["hambre", "caza"]
  },
  {
    id: "blood-bond",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Vínculo de Sangre", en: "Blood Bond", pt: "", fr: "", de: "", it: "" },
    category: "Sangre",
    categories: ["Sangre", "Bestia"],
    shortExplanation: { es: "Beber la sangre de un vampiro crea lealtad artificial.", en: "Drinking vampire blood creates artificial loyalty.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Beber vitae vampírica en tres noches distintas genera un Vínculo de Sangre, una lealtad sobrenatural abrumadora hacia el donante (el Regente). El primer trago atrae, el segundo fascina, el tercero esclaviza.",
      en: "Drinking vampiric vitae on three different nights generates a Blood Bond, an overwhelming supernatural loyalty towards the donor (the Regent). First drink attracts, second fascinates, third enslaves.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Crear un Ghoul dándole tu sangre.", "Ser forzado a beber la sangre del Príncipe."],
      en: ["Creating a Ghoul by giving your blood.", "Being forced to drink the Prince's blood."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Dura mientras se siga consumiendo ocasionalmente.", "Es la base del control en la Camarilla."],
      en: ["Lasts as long as occasionally consumed.", "Is the basis of control in the Camarilla."],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["sangre", "sociedad"]
  },
  // -------------------------------------------------------------------------
  // Quick-reference expansion (Phase 1). Each new entry below uses short
  // original wording and explicit "Needs review" markers in quickNotes where
  // the exact canonical mechanics need manual confirmation before expanding.
  // -------------------------------------------------------------------------
  {
    id: "blood-potency",
    editions: ["V5"],
    title: { es: "Potencia de Sangre", en: "Blood Potency", pt: "", fr: "", de: "", it: "" },
    category: "Sangre",
    categories: ["Sangre"],
    shortExplanation: {
      es: "La fuerza intrínseca de tu vitae. Sube con los años; afecta lo que puedes hacer con la sangre.",
      en: "The intrinsic strength of your vitae. Rises with age; shapes what your blood can do.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "La Potencia de Sangre representa qué tan poderosa es tu vitae. Una potencia mayor potencia los efectos de las Disciplinas y la sanación, pero también dificulta alimentarte de presas humildes. Los detalles exactos por nivel deben confirmarse en la fuente antes de mostrarlos como tabla.",
      en: "Blood Potency represents how powerful your vitae is. Higher potency strengthens Discipline effects and healing, but also makes feeding from weak prey harder. Exact per-level values should be confirmed against the source before being shown as a table.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Un vampiro joven con Potencia 1 puede alimentarse cómodamente de mortales.", "Un anciano con Potencia alta no se sacia con sangre mundana."],
      en: ["A young vampire at Potency 1 can feed comfortably from mortals.", "An elder at high Potency is no longer satisfied by mundane blood."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Potencia más alta = efectos de Disciplina más fuertes",
        "Potencia más alta = presas humildes sacian menos",
        "Necesita revisión: tabla exacta por nivel",
      ],
      en: [
        "Higher potency = stronger Discipline effects",
        "Higher potency = weaker prey sates less hunger",
        "Needs review: exact per-level table",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["sangre", "potencia"],
  },
  {
    id: "combat-overview",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Resumen de Combate", en: "Combat Overview", pt: "", fr: "", de: "", it: "" },
    category: "Combate",
    categories: ["Combate"],
    shortExplanation: {
      es: "Flujo general de un turno: declarar acción, tirar dados, aplicar daño.",
      en: "General turn flow: declare action, roll dice, apply damage.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "El combate corre por turnos. Cada personaje declara una acción (atacar, defender, moverse, usar una Disciplina), tira la reserva apropiada contra una Dificultad y aplica el resultado: daño Superficial para golpes mundanos, Agravado para fuego, sol o garras sobrenaturales. Los detalles exactos de iniciativa, distancia y modificadores se deben verificar en el libro antes de presentarse como reglas firmes.",
      en: "Combat runs in turns. Each character declares an action (attack, defend, move, use a Discipline), rolls the appropriate pool against a Difficulty, and applies the result: Superficial damage for mundane hits, Aggravated for fire, sunlight, or supernatural claws. Exact initiative, range, and modifier details should be verified against the source before being presented as firm rules.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Pelea callejera: Fuerza + Pelea contra defensa del rival.", "Disparo a distancia: Destreza + Armas de Fuego."],
      en: ["Street brawl: Strength + Brawl versus the opponent's defense.", "Ranged shot: Dexterity + Firearms."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Daño Superficial: heridas mundanas",
        "Daño Agravado: fuego, sol, garras de criatura",
        "Necesita revisión: tabla detallada de iniciativa y modificadores",
      ],
      en: [
        "Superficial damage: mundane wounds",
        "Aggravated damage: fire, sun, supernatural claws",
        "Needs review: detailed initiative and modifier table",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["combate", "resumen"],
  },
  {
    id: "experience",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Experiencia y Avance", en: "Experience & Advancement", pt: "", fr: "", de: "", it: "" },
    category: "Mecánica",
    categories: ["Mecánica"],
    shortExplanation: {
      es: "Los personajes ganan experiencia por sesión y la gastan para mejorar atributos, habilidades y Disciplinas.",
      en: "Characters earn experience per session and spend it to improve attributes, skills, and Disciplines.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "Tras cada sesión el Narrador suele otorgar una pequeña cantidad de puntos de experiencia. Esos puntos se gastan entre sesiones para subir Atributos, Habilidades y Disciplinas, comprar nuevas ventajas o reducir defectos. El costo exacto por nivel y por categoría debe confirmarse en el libro antes de mostrarlo como tabla en la app.",
      en: "After each session the Storyteller typically awards a small amount of experience. Those points are spent between sessions to raise Attributes, Skills, and Disciplines, buy new Merits, or reduce Flaws. Exact per-rating, per-category costs should be confirmed against the source before being shown as a table in the app.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Subir Pelea de 2 a 3 entre sesiones.", "Comprar el primer punto de una nueva Disciplina."],
      en: ["Raising Brawl from 2 to 3 between sessions.", "Buying the first dot of a new Discipline."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Gastar entre sesiones, no en medio de una escena",
        "Mejoras pequeñas suelen ser más narrativas que enormes saltos",
        "Necesita revisión: costos exactos por categoría",
      ],
      en: [
        "Spend between sessions, not mid-scene",
        "Small bumps usually feel more narrative than giant jumps",
        "Needs review: exact costs by category",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["experiencia", "avance"],
  },
  {
    id: "conditions",
    editions: ["V5"],
    title: { es: "Estados Comunes", en: "Common Conditions", pt: "", fr: "", de: "", it: "" },
    category: "Mecánica",
    categories: ["Mecánica", "Bestia"],
    shortExplanation: {
      es: "Estados situacionales que afectan al personaje: frenesí, hambre alta, daño grave, miedo.",
      en: "Situational states that affect the character: frenzy, high hunger, severe damage, fear.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "Un personaje puede entrar en distintos estados durante una escena: frenesí (pérdida de control de la Bestia), hambre crítica, daño impedidor, miedo o compulsión. Cada estado modifica lo que el personaje puede intentar y suele tener una duración natural. Los efectos mecánicos exactos deben confirmarse en el libro antes de mostrarse como reglas firmes.",
      en: "A character can enter several states during a scene: frenzy (loss of control to the Beast), critical hunger, impairing damage, fear, or compulsion. Each state changes what the character can attempt and usually has a natural duration. Exact mechanical effects should be confirmed against the source before being presented as firm rules.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Frenesí de hambre tras una herida fea.", "Compulsión empuja al personaje a una acción específica."],
      en: ["Hunger frenzy after a nasty wound.", "Compulsion pushes the character toward a specific action."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "El Narrador decide la duración y los desencadenantes finos",
        "Algunos estados se resisten gastando Fuerza de Voluntad",
        "Necesita revisión: lista canónica de estados y sus efectos exactos",
      ],
      en: [
        "The Storyteller sets fine duration and triggers",
        "Some states can be resisted by spending Willpower",
        "Needs review: canonical state list and exact effects",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["estados", "mecánica"],
  },
  {
    id: "storyteller-notes",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Notas Rápidas para el Narrador", en: "Storyteller Quick Notes", pt: "", fr: "", de: "", it: "" },
    category: "Narrador",
    categories: ["Narrador"],
    shortExplanation: {
      es: "Recordatorios rápidos para correr una sesión sin frenar la mesa.",
      en: "Quick reminders for running a session without grinding the table to a halt.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "Estas son notas de oficio para el Narrador, no reglas oficiales. Apuntan a mantener el ritmo de la sesión, dar voz a los PNJs y cerrar escenas a tiempo. Sirven de apoyo durante la mesa; no reemplazan los procedimientos del libro.",
      en: "These are craft notes for the Storyteller, not official rules. They aim to keep session pacing brisk, give NPCs distinct voices, and close scenes on time. They support the table during play; they do not replace the book's procedures.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Cerrar una escena en cuanto la decisión clave se tomó.", "Dar a cada PNJ un solo rasgo memorable."],
      en: ["Close a scene as soon as the key decision is made.", "Give each NPC one memorable trait."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Una sola decisión por escena suele bastar",
        "Si la regla frena la mesa, narra y sigue",
        "PNJs memorables > PNJs detallados",
      ],
      en: [
        "One decision per scene is usually enough",
        "If a rule grinds the table, narrate and move on",
        "Memorable NPCs beat detailed NPCs",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["narrador", "consejos"],
  },
  // -------------------------------------------------------------------------
  // Quick-reference expansion (Phase 2). Compact, original summaries that
  // fill in practical at-table topics not covered above:
  //   - difficulty / counting successes
  //   - healing (split V5 vs classic so the wording stays edition-honest)
  //   - blood pool (classic editions only — V5 uses Hunger instead)
  // Each entry uses short original wording. "Needs review" markers appear on
  // any concrete number that varies by edition or table reading.
  // -------------------------------------------------------------------------
  {
    id: "difficulty-and-successes",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Dificultad y Éxitos", en: "Difficulty & Successes", pt: "", fr: "", de: "", it: "" },
    category: "Tiradas",
    categories: ["Tiradas"],
    shortExplanation: {
      es: "Cuenta cuántos dados superan el umbral de éxito; compara con la dificultad fijada.",
      en: "Count how many dice meet the success threshold; compare against the set difficulty.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "Cada tirada compara los éxitos obtenidos contra una dificultad fijada por el Narrador. En V5 cada dado de 6 o más es un éxito; los pares de 10 suelen otorgar éxitos extra y forman un crítico. En las ediciones clásicas la dificultad es el número objetivo del dado (típicamente 6), y los 1 pueden cancelar éxitos. Los detalles finos (críticos, cancelaciones, márgenes) varían por edición.",
      en: "Each roll compares the successes you get against a difficulty set by the Storyteller. In V5 each die 6 or higher is a success; pairs of 10s usually grant bonus successes and form a critical. In classic editions the difficulty is the die target number (typically 6), and 1s may cancel successes. Fine details (criticals, cancels, margins) vary by edition.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["V5: reserva de 5, salen 6, 7, 7, 4, 2 → 3 éxitos contra dificultad 2 → éxito con margen.", "Clásico: dificultad 6, salen 6, 7, 1, 2, 9 → 3 éxitos − 1 (uno) = 2 netos."],
      en: ["V5: pool of 5 rolls 6, 7, 7, 4, 2 → 3 successes vs difficulty 2 → success with margin.", "Classic: difficulty 6, rolls 6, 7, 1, 2, 9 → 3 successes − 1 (one) = 2 net."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "V5: 6+ es éxito; par de 10 suele dar 4 éxitos",
        "Clásico: 1 cancela éxito; pifia con 0 éxitos y un 1",
        "Necesita revisión: reglas exactas de críticos y márgenes por edición",
      ],
      en: [
        "V5: 6+ is a success; pair of 10s usually counts as 4",
        "Classic: 1 cancels a success; botch on 0 successes with any 1",
        "Needs review: exact critical and margin rules per edition",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["básico", "tiradas"],
  },
  {
    id: "healing-v5",
    editions: ["V5"],
    title: { es: "Curación (V5)", en: "Healing (V5)", pt: "", fr: "", de: "", it: "" },
    category: "Combate",
    categories: ["Combate", "Sangre"],
    shortExplanation: {
      es: "Cura daño Superficial pagando un Chequeo de Enardecimiento.",
      en: "Heal Superficial damage by paying a Rouse Check.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "En V5 puedes invocar la sangre para reparar heridas. Un Chequeo de Enardecimiento cura una cantidad de daño Superficial por escena; el daño Agravado requiere descanso y normalmente una sesión o más. La cantidad exacta y los detalles varían según las reglas en uso, así que confirma siempre el número antes de aplicarlo en mesa.",
      en: "In V5 you call on the Blood to mend wounds. A Rouse Check mends an amount of Superficial damage per scene; Aggravated damage requires rest and usually a session or more. The exact number and details vary with the rules in use, so confirm the number before applying it at the table.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Cerrar moretones tras una pelea pagando un Enardecimiento.", "Convertir una herida grave en cicatriz requiere descanso."],
      en: ["Closing bruises after a fight by paying a Rouse Check.", "Turning a deep wound into a scar requires rest."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Daño Superficial: rápido con un Enardecimiento",
        "Daño Agravado: necesita descanso y tiempo de juego",
        "Necesita revisión: cantidad exacta curada por Enardecimiento",
      ],
      en: [
        "Superficial damage: quick with a Rouse Check",
        "Aggravated damage: needs rest and downtime",
        "Needs review: exact amount mended per Rouse Check",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["salud", "sangre"],
  },
  {
    id: "healing-classic",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    title: { es: "Curación (Clásico)", en: "Healing (Classic)", pt: "", fr: "", de: "", it: "" },
    category: "Combate",
    categories: ["Combate", "Sangre"],
    shortExplanation: {
      es: "Gastas puntos de tu Reserva de Sangre para sanar daño.",
      en: "Spend points from your Blood Pool to heal damage.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "En las ediciones clásicas la curación se paga con sangre. Gastas puntos de Reserva de Sangre para sanar heridas mundanas (golpes, balas, cortes). El daño Agravado (fuego, sol, garras sobrenaturales) tarda mucho más y suele requerir tiempo de juego, no solo sangre. Los costes exactos por nivel de herida y el límite por turno varían por edición.",
      en: "In classic editions, healing is paid for in blood. Spend Blood Pool points to mend mundane wounds (punches, bullets, cuts). Aggravated damage (fire, sunlight, supernatural claws) takes much longer and usually needs downtime, not just blood. Exact per-wound costs and per-turn limits vary by edition.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Pagar 1 sangre tras encajar un golpe duro.", "Una garra agravada no se cierra con un único trago."],
      en: ["Pay 1 blood after taking a hard hit.", "An aggravated claw won't close from a single sip."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Heridas mundanas: gasto de sangre",
        "Heridas agravadas: tiempo de juego, no solo sangre",
        "Necesita revisión: coste exacto por nivel y límite por turno",
      ],
      en: [
        "Mundane wounds: spend blood",
        "Aggravated wounds: downtime, not just blood",
        "Needs review: exact cost per level and per-turn limit",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["salud", "sangre"],
  },
  {
    id: "blood-pool",
    editions: ["1ST", "2ND", "REVISED", "V20"],
    title: { es: "Reserva de Sangre", en: "Blood Pool", pt: "", fr: "", de: "", it: "" },
    category: "Sangre",
    categories: ["Sangre", "Mecánica"],
    shortExplanation: {
      es: "Tu vitae almacenada. La gastas para sanar, potenciar atributos o alimentar Disciplinas.",
      en: "Your stored vitae. Spend it to heal, boost attributes, or power Disciplines.",
      pt: "", fr: "", de: "", it: "",
    },
    fullExplanation: {
      es: "En las ediciones clásicas tu personaje tiene una Reserva de Sangre (Blood Pool) que representa la vitae que ha bebido. Se consume para curarse, potenciar Atributos físicos, fuel para algunas Disciplinas y para sobrevivir cada noche. Su tamaño máximo y cuánto puedes gastar por turno dependen de tu Generación.",
      en: "In classic editions your character has a Blood Pool that represents the vitae they have drunk. It is spent to heal, boost physical Attributes, fuel some Disciplines, and survive each night. Its maximum size and per-turn spend depend on your Generation.",
      pt: "", fr: "", de: "", it: "",
    },
    examples: {
      es: ["Gastar 1 sangre para subir Fuerza durante un turno.", "Recargar la reserva alimentándote en escena."],
      en: ["Spend 1 blood to boost Strength for one turn.", "Refill the pool by feeding during a scene."],
      pt: [], fr: [], de: [], it: [],
    },
    quickNotes: {
      es: [
        "Tamaño máximo y gasto por turno escalan con la Generación",
        "Cazar al inicio de la noche evita quedarte vacío en escena",
        "Necesita revisión: tabla exacta de máximos y gasto por Generación",
      ],
      en: [
        "Max size and per-turn spend scale with Generation",
        "Hunting early in the night prevents going dry mid-scene",
        "Needs review: exact per-Generation max and per-turn table",
      ],
      pt: [], fr: [], de: [], it: [],
    },
    tags: ["sangre", "clásico"],
  },
];
