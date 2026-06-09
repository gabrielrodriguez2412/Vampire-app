/**
 * Batch AQ — random character-creation inspiration helpers, phase 1.
 *
 * Non-mechanical inspiration only: names, one-line concepts, sensory
 * appearance notes, behavioural hooks, and short edition-flavoured
 * prompts for the V5 Ambition / Desire / Predator-style and the
 * classic Nature / Demeanor-style identity fields.
 *
 * Batch AQ review polish:
 *
 *   1. Localised pools. Every field carries its own EN / ES list of
 *      original short content, picked by the active app language.
 *      Other languages (pt / fr / de / it) currently fall back to
 *      the English pool. The fallback is intentional — phase 1 only
 *      needs EN/ES to cover the active UI translations.
 *
 *   2. Bigger pools — the initial drop felt repetitive in normal use,
 *      especially for names. Pools now hold many more entries and
 *      `generateSuggestion` accepts an optional `lastValue` so the
 *      create form can avoid handing the user the exact same string
 *      twice in a row.
 *
 *   3. No rulebook content. All prompts are original short content
 *      authored for this app — no Archetype, Predator Type, Concept
 *      table, or rulebook narrative text. Pinned by a regression
 *      test that scans every pool (both languages) for characteristic
 *      rulebook phrases.
 *
 * The module is pure — every helper accepts an optional `rng` so tests
 * can drive the picker deterministically without touching Math.random.
 */
import { EditionId, LangCode } from "../types";

export type GeneratorField =
  | 'name'
  | 'concept'
  | 'appearance'
  | 'personality'
  | 'ambition'
  | 'desire'
  | 'predator'
  | 'nature'
  | 'demeanor';

/** Languages with fully-authored pools. Other LangCodes fall back to 'en'. */
export type GeneratorLang = 'en' | 'es';

function resolveLang(lang: LangCode | undefined): GeneratorLang {
  return lang === 'es' ? 'es' : 'en';
}

// ===========================================================================
// English pools.
// ===========================================================================

const NAMES_EN: readonly string[] = [
  "Adela Voss", "Aiden Caro", "Alma Briske", "Amaru Costa", "Beatrice Hennig",
  "Cassian Reyes", "Catalina Ruiz", "Damir Kraneck", "Diego Lemos", "Eliska Marek",
  "Elliott Bran", "Evren Demir", "Halil Kaya", "Helena Sorić", "Inez Rovilescu",
  "Isadora Quinn", "Ivor Aaltonen", "Jonas Aldred", "Joaquín Saavedra", "Kira Solberg",
  "Kostas Vasilakis", "Lara Henriques", "Lucien Aubertin", "Magnus Eriksen",
  "Mateusz Stark", "Mira Hadjieva", "Naomi Kirschbaum", "Nils Borgström",
  "Otto Vance", "Pilar Mendéz", "Petra Halász", "Quincy Whitfield",
  "Rafael Ortiz", "Renata Halász", "Ruth Goldfarb", "Sergei Vlachos",
  "Silvia Iancu", "Sorin Andrade", "Tomas Berga", "Tobias Ekstrand",
  "Verena Kohl", "Viktor Lipa", "Wren Halloran", "Xenia Aaltonen",
  "Yara Constanin", "Yusuf Aydın", "Zofia Wendel", "Zola Marsh",
  "Aurelio Banta", "Brigid O'Shea", "Casimir Roux", "Delphine Carrière",
  "Edda Mårtensson", "Faisal Tabari", "Greta Vischer", "Henrik Aas",
  "Isobel Lang", "Júlio Branco", "Klaus Eberhardt", "Linnea Stenberg",
];

const CONCEPTS_EN: readonly string[] = [
  "Disgraced surgeon", "Cold-eyed librarian", "Burned-out crime reporter",
  "Late-shift paramedic", "Bartender with a long memory",
  "Anonymous gallery curator", "Night-court translator", "Defrocked seminarian",
  "Mortuary photographer", "Subway-line conductor", "Estate-sale appraiser",
  "Retired stage magician", "Punk-club bouncer",
  "Public-defender investigator", "Reluctant fixer",
  "Junior funeral director", "Cold-storage technician",
  "Auction-house authenticator", "Tattoo artist who never sleeps",
  "Off-hours locksmith", "Mid-list crime novelist",
  "Night-shift hotel concierge", "Independent forensic accountant",
  "Off-grid radio host", "Coffee-roaster with old money",
  "Resident DJ in a bad neighbourhood", "Late-night taxi medallion owner",
  "Lapsed art restorer", "Forgotten child star",
  "Ex-private investigator", "Hospice volunteer with a notebook",
  "Disbarred lawyer turned mediator", "Roofer with a perfect alibi",
  "Antique-clock repairer", "Wedding photographer for awful weddings",
  "Bookbinder who knows the buyers", "Foreclosure auctioneer",
  "Underground dance teacher", "Independent journalist nobody publishes",
  "Off-duty paramedic with a side hustle",
];

const APPEARANCES_EN: readonly string[] = [
  "Always slightly underdressed for the weather",
  "Pale knuckles, perpetually clenched",
  "An old burn scar across the jaw",
  "Eyes too steady, like still water",
  "Hair pulled tight enough to ache",
  "Hands that smell faintly of antiseptic",
  "A single piece of expensive jewellery that doesn't match anything else",
  "Threadbare collar on an otherwise immaculate coat",
  "Walks with a deliberate, measured stride",
  "Never quite warm to the touch",
  "Wears a watch that doesn't run",
  "Looks fed even when they aren't",
  "Smile that arrives a half-second late",
  "Small scar bisecting one eyebrow",
  "Knuckles tattooed with letters nobody asks about",
  "Lips chewed raw under the lipstick",
  "Stands with their weight on the back foot",
  "Eyes that flick toward exits without turning their head",
  "Hair always damp at the nape, like they just stepped out of the rain",
  "Lashes longer than they ought to be",
  "Fingers stained at the tips, source unclear",
  "Reads as taller than they actually are",
  "Voice rough at first, then surprisingly soft",
  "Always carries a folded handkerchief, never visibly uses it",
  "A cologne too faint to identify, that lingers anyway",
  "Posture of someone who used to dance and stopped",
  "An iron ring on the wrong finger",
  "Shoes too clean for the rest of the outfit",
  "Glasses they don't actually need",
  "A small bruise that never quite finishes healing",
  "Habit of touching their throat when listening",
  "A single grey streak in dark hair, dyed-looking but real",
];

const PERSONALITIES_EN: readonly string[] = [
  "Counts every doorway they pass",
  "Refuses to look in mirrors after midnight",
  "Answers questions with another question",
  "Apologises to inanimate objects",
  "Remembers names but pretends not to",
  "Pockets small things that aren't theirs",
  "Catalogues exits without thinking",
  "Trusts dogs faster than people",
  "Speaks softer when angry",
  "Keeps a list of debts in a worn notebook",
  "Always knows what time it is, never carries a phone",
  "Laughs a half-beat too late",
  "Rephrases other people's points and credits them anyway",
  "Cannot stand to throw away a perfectly good envelope",
  "Will not eat in front of strangers",
  "Names every car they own",
  "Keeps the last text from someone they've lost",
  "Lies about minor things, owns up to major ones",
  "Hums when concentrating, hates being told",
  "Always returns calls, never answers them live",
  "Writes letters they don't send",
  "Tips heavily for bad service to feel even",
  "Keeps a single houseplant that they refuse to name",
  "Recites license plates back hours later",
  "Stops the car for stray animals; the kind no-one would stop for",
  "Reads the closing credits of every movie",
  "Apologises before saying no",
  "Memorises menus they don't intend to order from",
  "Never breaks a promise. Refuses to make most of them",
  "Folds receipts into perfect squares",
  "Re-reads old emails before bed",
  "Closes every door they pass through, gently",
];

const V5_AMBITIONS_EN: readonly string[] = [
  "Buy back the family estate, brick by brick",
  "Identify the sire who turned me, and decide what to do about it",
  "Outlive every living relative without their notice",
  "Earn a seat at a table I was never invited to",
  "Find the one person I left behind, intact",
  "Build a small empire of small favours",
  "Make the city remember a name nobody knows",
  "Burn down what I used to belong to",
  "Convince a single mortal to forgive me, in writing",
  "Recover the painting that was stolen the night I died",
  "Replace someone who never noticed I was gone",
  "Open a clean inn in a dirty city",
  "Translate the diary I wasn't supposed to keep",
  "Outlast the elder who underestimated me",
  "Be remembered as the person who fixed it, not broke it",
  "Build the route home for someone who'll never use it",
  "Find a way to feed without lying about it",
  "Be the last one standing at my own funeral",
];

const V5_DESIRES_EN: readonly string[] = [
  "A safe place to feed tonight",
  "An answer from someone who refuses to reply",
  "Five undisturbed minutes alone",
  "A clean exit from a conversation that's already gone wrong",
  "A favour I can call in by dawn",
  "An old habit, just for tonight",
  "A single honest sentence from anyone",
  "Proof that someone is still looking",
  "A name I haven't said in years, out loud",
  "The right to walk past my old apartment",
  "A meal I don't have to apologise for",
  "Permission to leave, even if I don't take it",
  "A reason to keep the appointment I was about to break",
  "Some small mercy I can carry until sunrise",
  "A reason not to call",
  "Quiet enough to think without lying to myself",
  "An hour with someone who still believes me",
  "Sleep, even one hour of it",
];

const V5_PREDATOR_PROMPTS_EN: readonly string[] = [
  "Hunts in late-night clinics",
  "Skims tourists at the train station",
  "Trades favours for veins",
  "Prefers willing companions",
  "Walks the long way home with a steady pulse beside them",
  "Knows which bartenders pour the heaviest after midnight",
  "Returns to the same alley twice a week, never three times",
  "Keeps a contact list of the unmissable",
  "Drives a private car for the kind of people who don't ask names",
  "Volunteers at a shelter that doesn't ask names back",
  "Sits on hospital boards, never on the patient side",
  "Keeps a discreet salon with regular guests",
  "Picks fights they intend to lose",
  "Charms a single bouncer at every door that matters",
  "Runs an after-hours pop-up that always loses money on paper",
  "Frequents a 24-hour gym for the regulars, not the equipment",
  "Hires recently fired bartenders for off-the-books shifts",
  "Spends an hour a night on dating apps without ever meeting in person",
];

const CLASSIC_NATURES_EN: readonly string[] = [
  "Quietly observant",
  "Hungry for approval",
  "Restless under praise",
  "Patient until cornered",
  "Loyal in private, prickly in public",
  "Calmer the worse things get",
  "Stubborn about small things",
  "Forgiving but never forgetful",
  "Reluctantly principled",
  "Generous to a fault, then resentful about it",
  "Quietly competitive",
  "Methodical out of fear, not discipline",
  "Quietly merciful",
  "Restless when not needed",
  "Even-tempered until insulted",
  "Patient with strangers, brisk with family",
  "Sentimental about objects, not people",
  "Reserved unless trusted, then unguarded",
];

const CLASSIC_DEMEANORS_EN: readonly string[] = [
  "Flippant under pressure",
  "Polished and unreadable",
  "Warm at a distance, distant up close",
  "Brisk, with an undertone of kindness",
  "Tired but unfailingly polite",
  "Watchful, smiling on purpose",
  "Earnest enough to be disarming",
  "Casually elegant, casually rude",
  "Speaks with the patience of someone who used to teach",
  "Polite to a worrying degree",
  "Conversational the way a hostage negotiator is",
  "Wears authority like a borrowed coat",
  "Smiles with their eyes shut",
  "Flirts only with the staff",
  "Compliments come out as half-questions",
  "Never small-talks; always sounds like they meant it",
  "Listens longer than is comfortable",
  "Disagrees by going quiet",
];

// ===========================================================================
// Spanish pools — original short content authored for the app, NOT
// translations of any rulebook table or copyrighted text.
// ===========================================================================

const NAMES_ES: readonly string[] = [
  "Adela Vega", "Alba Carrasco", "Alejo Solís", "Amalia Reyes",
  "Andrés Mendívil", "Beatriz Tovar", "Bruno Olarte", "Camila Salaverry",
  "Carmen Olarte", "Cecilia Naranjo", "Damián Quevedo", "Diego Aramburu",
  "Elena Cienfuegos", "Elías Bermejo", "Emilia Sandoval", "Enrique Olmedo",
  "Esteban Ruiz", "Eulalia Briones", "Federico Lanza", "Fernanda Olarte",
  "Francisca Aspe", "Gael Tagle", "Galia Mendívil", "Genoveva Aspe",
  "Gisela Salaverry", "Gregorio Salazar", "Helena Pacheco", "Hugo Tagle",
  "Ignacio Carrera", "Inés Maluenda", "Iván Saavedra", "Jacinto Aldama",
  "Joaquín Saavedra", "Jorge Pacheco", "Josefa Mier", "Juana Briones",
  "Julián Briones", "Laura Tagle", "Leonor Aldama", "Lina Carrasco",
  "Lourdes Mier", "Luciana Olarte", "Lucio Salaverry", "Mariana Aspe",
  "Mateo Bermejo", "Matías Aldama", "Mauro Cienfuegos", "Mercedes Naranjo",
  "Miguel Olarte", "Mireia Ferré", "Olivia Naranjo", "Pablo Maluenda",
  "Pilar Quevedo", "Quintín Naranjo", "Rafael Bermejo", "Raquel Olarte",
  "Rita Maluenda", "Rocío Aspe", "Rodrigo Salazar", "Rosario Naranjo",
];

const CONCEPTS_ES: readonly string[] = [
  "Cirujano caído en desgracia",
  "Bibliotecaria de mirada fría",
  "Periodista de crónica negra agotado",
  "Paramédico del turno de noche",
  "Camarera con buena memoria",
  "Curadora anónima de una galería",
  "Traductora del juzgado nocturno",
  "Seminarista expulsado",
  "Fotógrafo de tanatorio",
  "Conductor de la línea de metro",
  "Tasador de subastas testamentarias",
  "Ilusionista retirado",
  "Portero de un local punk",
  "Investigador del turno de oficio",
  "Contacto a regañadientes",
  "Director junior de funeraria",
  "Técnico de cámara frigorífica",
  "Autenticadora de casa de subastas",
  "Tatuadora que nunca duerme",
  "Cerrajera fuera de horas",
  "Novelista de policíaco menor",
  "Conserje nocturno de hotel",
  "Contable forense por libre",
  "Locutor de radio sin licencia",
  "Tostador de café con dinero viejo",
  "DJ residente en un barrio malo",
  "Dueño de licencia de taxi nocturno",
  "Restauradora de arte caída",
  "Antigua estrella infantil olvidada",
  "Ex detective privado",
  "Voluntaria en hospicio con libreta",
  "Abogado inhabilitado, hoy mediador",
  "Techador con coartada perfecta",
  "Reparador de relojes antiguos",
  "Fotógrafa de bodas que terminan mal",
  "Encuadernadora que conoce a los compradores",
  "Subastador de embargos",
  "Profesor clandestino de baile",
  "Periodista independiente al que nadie publica",
  "Paramédica fuera de servicio con un trato aparte",
];

const APPEARANCES_ES: readonly string[] = [
  "Siempre vestida un poco mal para el tiempo que hace",
  "Nudillos pálidos, siempre cerrados",
  "Una vieja quemadura en la mandíbula",
  "Ojos demasiado quietos, como un pozo",
  "Cabello recogido tan tirante que duele",
  "Manos con un leve olor a antiséptico",
  "Una sola joya cara que no pega con el resto",
  "Cuello del abrigo gastado, lo demás impecable",
  "Camina con paso medido y deliberado",
  "Nunca termina de estar caliente al tacto",
  "Lleva un reloj que no funciona",
  "Parece bien comida aunque no lo esté",
  "Sonrisa que llega medio segundo tarde",
  "Una cicatriz pequeña que parte una ceja",
  "Nudillos tatuados con letras que nadie pregunta",
  "Labios mordidos bajo el carmín",
  "Apoya el peso en la pierna de atrás",
  "Mira las salidas sin girar la cabeza",
  "Pelo húmedo en la nuca, como si acabara de llover",
  "Pestañas más largas de lo que tocaría",
  "Dedos manchados en las puntas, sin razón clara",
  "Da impresión de ser más alta de lo que es",
  "Voz áspera al principio, luego sorprendentemente suave",
  "Lleva siempre un pañuelo doblado y nunca se lo ve usar",
  "Un perfume tan tenue que no se identifica, pero queda",
  "Postura de quien bailaba antes y lo dejó",
  "Un anillo de hierro en el dedo equivocado",
  "Zapatos demasiado limpios para el resto del conjunto",
  "Gafas que en realidad no necesita",
  "Un cardenal pequeño que nunca termina de irse",
  "Se toca el cuello cuando escucha",
  "Una sola cana en pelo oscuro, parece teñida pero es real",
];

const PERSONALITIES_ES: readonly string[] = [
  "Cuenta cada puerta por la que pasa",
  "No se mira al espejo después de medianoche",
  "Responde con otra pregunta",
  "Pide perdón a los objetos",
  "Recuerda los nombres y finge que no",
  "Se guarda cosas pequeñas que no son suyas",
  "Cataloga las salidas sin darse cuenta",
  "Confía antes en los perros que en la gente",
  "Habla más bajo cuando está enfadada",
  "Lleva una lista de deudas en una libreta vieja",
  "Sabe siempre qué hora es y no lleva teléfono",
  "Se ríe medio segundo tarde",
  "Reformula lo que dijiste y te lo atribuye igual",
  "No es capaz de tirar un sobre que aún sirva",
  "No come delante de desconocidos",
  "Le pone nombre a cada coche que tiene",
  "Guarda el último mensaje de alguien que perdió",
  "Miente en lo pequeño, asume lo grande",
  "Tararea al concentrarse y odia que se lo digan",
  "Devuelve siempre las llamadas, nunca contesta en directo",
  "Escribe cartas que no manda",
  "Da propinas enormes por mal servicio para sentirse en paz",
  "Tiene una sola planta y se niega a ponerle nombre",
  "Recita matrículas horas después",
  "Para el coche por animales que nadie pararía",
  "Lee los créditos finales de todas las películas",
  "Pide perdón antes de decir que no",
  "Memoriza cartas de menús que no piensa pedir",
  "No rompe una promesa. Se niega a hacer la mayoría",
  "Dobla los tickets en cuadrados perfectos",
  "Relee correos viejos antes de dormir",
  "Cierra suavemente cada puerta por la que pasa",
];

const V5_AMBITIONS_ES: readonly string[] = [
  "Recuperar la casa familiar, ladrillo a ladrillo",
  "Identificar al sire que me convirtió y decidir qué hacer con él",
  "Sobrevivir a todos mis parientes vivos sin que se enteren",
  "Ganar un asiento en una mesa a la que no me invitaron",
  "Encontrar entera a la persona que dejé atrás",
  "Construir un pequeño imperio de favores pequeños",
  "Hacer que la ciudad recuerde un nombre que nadie conoce",
  "Quemar el lugar al que pertenecía",
  "Convencer a un mortal de que me perdone, por escrito",
  "Recuperar el cuadro que se llevaron la noche en que morí",
  "Reemplazar a alguien que nunca notó que no estaba",
  "Abrir una posada limpia en una ciudad sucia",
  "Traducir el diario que no debía haber escrito",
  "Sobrevivir al elder que me subestimó",
  "Ser recordado como quien arregló esto, no quien lo rompió",
  "Trazar el camino a casa de alguien que no lo usará",
  "Encontrar una forma de alimentarme sin mentir sobre ello",
  "Ser el último en pie en mi propio funeral",
];

const V5_DESIRES_ES: readonly string[] = [
  "Un sitio seguro para alimentarse esta noche",
  "Una respuesta de quien se niega a contestar",
  "Cinco minutos a solas sin que me interrumpan",
  "Salir limpiamente de una conversación que ya va mal",
  "Un favor que pueda cobrar antes del amanecer",
  "Una vieja costumbre, solo por esta noche",
  "Una sola frase honesta de quien sea",
  "Pruebas de que alguien todavía me busca",
  "Un nombre que llevo años sin decir, en voz alta",
  "Pasar por mi antiguo portal sin que me pase nada",
  "Una comida por la que no tenga que pedir perdón",
  "Permiso para irme, aunque no lo use",
  "Un motivo para no cancelar la cita que iba a anular",
  "Algún pequeño gesto de piedad que llevarme hasta el alba",
  "Una razón para no llamar",
  "Silencio suficiente para pensar sin mentirme",
  "Una hora con alguien que todavía me crea",
  "Dormir, aunque sea una hora",
];

const V5_PREDATOR_PROMPTS_ES: readonly string[] = [
  "Caza en clínicas de guardia",
  "Aprovecha a turistas en la estación",
  "Cambia favores por venas",
  "Prefiere acompañantes voluntarios",
  "Vuelve a casa por el camino largo, con un pulso al lado",
  "Sabe qué camareros sirven más fuerte después de medianoche",
  "Vuelve al mismo callejón dos veces por semana, nunca tres",
  "Lleva una lista de personas a las que nadie va a echar de menos",
  "Conduce un coche privado para gente que no pregunta nombres",
  "Es voluntaria en un albergue que tampoco los pregunta",
  "Está en consejos de hospital, nunca del lado del paciente",
  "Lleva un salón discreto con invitados habituales",
  "Provoca peleas que piensa perder",
  "Encandila al portero clave en cada puerta importante",
  "Lleva un local efímero a deshora que sobre el papel pierde dinero",
  "Frecuenta un gimnasio 24 horas por los habituales, no por las máquinas",
  "Contrata camareros recién despedidos para turnos sin contrato",
  "Pasa una hora por noche en aplicaciones sin quedar nunca en persona",
];

const CLASSIC_NATURES_ES: readonly string[] = [
  "Observadora callada",
  "Hambriento de aprobación",
  "Inquieto cuando lo elogian",
  "Paciente hasta que lo arrinconan",
  "Leal en privado, áspero en público",
  "Más calmado cuanto peor van las cosas",
  "Cabezota con las cosas pequeñas",
  "Perdona, pero no olvida",
  "Con principios a regañadientes",
  "Generoso hasta hacerse daño y luego rencoroso",
  "Competitivo en silencio",
  "Metódico por miedo, no por disciplina",
  "Misericordioso sin presumirlo",
  "Inquieto cuando no le necesitan",
  "De temperamento estable hasta que lo insultan",
  "Paciente con extraños, cortante con la familia",
  "Sentimental con los objetos, no con las personas",
  "Reservado a menos que confíe, entonces sin filtros",
];

const CLASSIC_DEMEANORS_ES: readonly string[] = [
  "Frívola bajo presión",
  "Pulido e ilegible",
  "Cálida a distancia, distante de cerca",
  "Seca con un fondo amable",
  "Cansado pero impecablemente educado",
  "Atenta, sonríe a propósito",
  "Sincero hasta desarmarte",
  "Elegante por casualidad, grosera por casualidad",
  "Habla con la paciencia de quien daba clases",
  "Educada hasta resultar inquietante",
  "Conversa como quien negocia rehenes",
  "Lleva la autoridad como un abrigo prestado",
  "Sonríe con los ojos cerrados",
  "Solo coquetea con el personal",
  "Sus cumplidos suenan a media pregunta",
  "Nunca da palique; siempre parece sincero",
  "Escucha más tiempo del cómodo",
  "Cuando no está de acuerdo, calla",
];

// ===========================================================================
// Pool selection.
// ===========================================================================

type PoolMap = Record<GeneratorField, readonly string[]>;

const POOLS_EN_V5: PoolMap = {
  name: NAMES_EN, concept: CONCEPTS_EN, appearance: APPEARANCES_EN,
  personality: PERSONALITIES_EN, ambition: V5_AMBITIONS_EN,
  desire: V5_DESIRES_EN, predator: V5_PREDATOR_PROMPTS_EN,
  nature: [], demeanor: [],
};
const POOLS_EN_CLASSIC: PoolMap = {
  name: NAMES_EN, concept: CONCEPTS_EN, appearance: APPEARANCES_EN,
  personality: PERSONALITIES_EN, ambition: [], desire: [], predator: [],
  nature: CLASSIC_NATURES_EN, demeanor: CLASSIC_DEMEANORS_EN,
};
const POOLS_ES_V5: PoolMap = {
  name: NAMES_ES, concept: CONCEPTS_ES, appearance: APPEARANCES_ES,
  personality: PERSONALITIES_ES, ambition: V5_AMBITIONS_ES,
  desire: V5_DESIRES_ES, predator: V5_PREDATOR_PROMPTS_ES,
  nature: [], demeanor: [],
};
const POOLS_ES_CLASSIC: PoolMap = {
  name: NAMES_ES, concept: CONCEPTS_ES, appearance: APPEARANCES_ES,
  personality: PERSONALITIES_ES, ambition: [], desire: [], predator: [],
  nature: CLASSIC_NATURES_ES, demeanor: CLASSIC_DEMEANORS_ES,
};

/**
 * Pool that backs each field for the active edition + language. The
 * `lang` parameter is optional for backwards compatibility — callers
 * that don't pass it get the English pools, matching pre-review
 * behaviour.
 */
export function poolFor(
  field: GeneratorField,
  edition: EditionId,
  lang: LangCode = 'en',
): readonly string[] {
  const isV5 = edition === 'V5';
  const eff = resolveLang(lang);
  const pools = eff === 'es'
    ? (isV5 ? POOLS_ES_V5 : POOLS_ES_CLASSIC)
    : (isV5 ? POOLS_EN_V5 : POOLS_EN_CLASSIC);
  return pools[field];
}

// ===========================================================================
// Public picker helpers.
// ===========================================================================

/** Pick one entry from `pool` using `rng`. Optionally avoids `lastValue`
 *  to prevent immediate repeats during the same session. */
export function pickRandom<T>(
  pool: readonly T[],
  rng: () => number = Math.random,
  lastValue?: T,
): T {
  if (pool.length === 0) {
    throw new Error('pickRandom: pool is empty');
  }
  // Build the candidate pool: drop `lastValue` if it would be possible
  // to pick something else. With a pool of size 1, repetition is the
  // only option and we accept it.
  const candidates = lastValue !== undefined && pool.length > 1
    ? pool.filter(entry => entry !== lastValue)
    : pool;
  const idx = Math.floor(rng() * candidates.length) % candidates.length;
  return candidates[idx];
}

/** Whether a field is available for the given edition / language. */
export function isFieldAvailable(
  field: GeneratorField,
  edition: EditionId,
  lang: LangCode = 'en',
): boolean {
  return poolFor(field, edition, lang).length > 0;
}

/**
 * Generate a single suggestion for the given field, edition and
 * language. `lastValue` (when supplied) is excluded from the candidate
 * pool so the same entry never repeats twice in a row for that field.
 */
export function generateSuggestion(
  field: GeneratorField,
  edition: EditionId,
  lang: LangCode = 'en',
  rng: () => number = Math.random,
  lastValue?: string,
): string {
  const pool = poolFor(field, edition, lang);
  if (pool.length === 0) return '';
  return pickRandom(pool, rng, lastValue);
}

export interface InspirationBundle {
  appearance: string;
  personality: string;
}

/**
 * Generate the Inspiration-panel pair. `lastBundle` (when supplied) is
 * excluded line-by-line so the user never sees the exact same prompt
 * twice in a row.
 */
export function generateInspirationBundle(
  lang: LangCode = 'en',
  rng: () => number = Math.random,
  lastBundle?: InspirationBundle,
): InspirationBundle {
  const eff = resolveLang(lang);
  const appearancePool = eff === 'es' ? APPEARANCES_ES : APPEARANCES_EN;
  const personalityPool = eff === 'es' ? PERSONALITIES_ES : PERSONALITIES_EN;
  return {
    appearance: pickRandom(appearancePool, rng, lastBundle?.appearance),
    personality: pickRandom(personalityPool, rng, lastBundle?.personality),
  };
}
