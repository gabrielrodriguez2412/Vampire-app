import { RuleEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });
const fallbackArr = (val: string[]) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const rules: RuleEntry[] = [
  {
    id: "dice-pools",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Reserva de Dados (Dice Pools)", en: "Dice Pools", pt: "", fr: "", de: "", it: "" },
    category: "Tiradas",
    shortExplanation: { es: "Tira d10s (Atributo + Habilidad).", en: "Roll d10s (Attribute + Skill).", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "El sistema principal utiliza D10. Formas tu reserva de dados sumando un Atributo y una Habilidad. Tiras esa cantidad de dados de diez caras. En V5, los 6 o más son éxitos, y necesitas igualar la Dificultad para tener éxito.",
      en: "The main system uses D10s. You form your dice pool by adding an Attribute and a Skill. You roll that many ten-sided dice. In V5, 6 or higher are successes, and you need to meet the Difficulty to succeed.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Disparar: Destreza + Armas de Fuego.", "Intimidar a un matón: Fuerza + Intimidación."],
      en: ["Shooting: Dexterity + Firearms.", "Intimidating a thug: Strength + Intimidation."],
      pt: [], fr: [], de: [], it: []
    },
    quickNotes: {
      es: ["Éxito: 6+", "Doble 10: Crítico (cuenta como 4 éxitos en V5)"],
      en: ["Success: 6+", "Double 10s: Critical (counts as 4 successes in V5)"],
      pt: [], fr: [], de: [], it: []
    },
    tags: ["básico", "tiradas"]
  },
  {
    id: "hunger-dice",
    editions: ["V5"],
    title: { es: "Dados de Hambre", en: "Hunger Dice", pt: "", fr: "", de: "", it: "" },
    category: "Hambre",
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
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Fuerza de Voluntad", en: "Willpower", pt: "", fr: "", de: "", it: "" },
    category: "Mecánica",
    shortExplanation: { es: "Repetir tiradas u oponerse a dominación.", en: "Reroll dice or oppose domination.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Puedes gastar Puntos de Fuerza de Voluntad superficiales para repetir hasta 3 dados regulares (no de Hambre) que hayan fallado, o para resistir compulsiones, disciplinas o frenesí.",
      en: "You can spend superficial Willpower damage to reroll up to 3 regular (non-Hunger) failed dice, or to resist compulsions, disciplines, or frenzy.",
      pt: "", fr: "", de: "", it: ""
    },
    examples: {
      es: ["Gastar voluntad para repetir un fallo en una tirada importante."],
      en: ["Spending willpower to reroll a failure on an important check."],
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
    id: "humanity-loss",
    editions: ["1ST", "2ND", "REVISED", "V20", "V5"],
    title: { es: "Pérdida de Humanidad", en: "Humanity Loss", pt: "", fr: "", de: "", it: "" },
    category: "Moralidad",
    shortExplanation: { es: "Tirar Remordimiento tras violar dogmas.", en: "Roll Remorse after violating tenets.", pt: "", fr: "", de: "", it: "" },
    fullExplanation: {
      es: "Cuando violas los principios de la crónica o tus propias Convicciones, sufres Máculas. Al final de la sesión, tiras Remordimiento: si fallas, tu Humanidad baja.",
      en: "When violating chronicle tenets or your Convictions, you gain Stains. At the end of the session, roll Remorse: on a failure, your Humanity decreases.",
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
    id: "resonance",
    editions: ["V5"],
    title: { es: "Resonancia y Discracia", en: "Resonance and Dyscrasia", pt: "", fr: "", de: "", it: "" },
    category: "Sangre",
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
];
