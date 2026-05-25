import { LangCode } from '../types';
import type { EditionScope } from '../types';

/**
 * Roleplay tips, kept fully localized and split cleanly across edition
 * scopes.
 *
 * # Edition scoping
 *
 * `edition === null` ........... universal; shows on every edition.
 * `edition === 'v5'` ........... V5-only; hidden when V20 / Revised /
 *                                 2nd / 1st is selected.
 * `edition === 'classic'` ...... classic-only; hidden when V5 is
 *                                 selected.
 *
 * The page applies this via `isEditionInScope` in `utils/content.ts`,
 * so the same scoping logic is shared with Glossary and any future
 * scoped surface. The QA finding that triggered this design was a V5
 * card appearing while V20 was selected — every tip below is now
 * either truly universal (no edition-specific mechanic names in the
 * bullets) or scoped to the edition family it actually belongs to.
 *
 * # Localization
 *
 * Each `title` and `content` field is a `Record<LangCode, ...>`. EN +
 * ES are filled; pt / fr / de / it fall back to EN at render time via
 * `getText` / `getLocalizedArray`. This matches the existing Glossary
 * pattern and lets a translator pick up partial work without touching
 * the type or the page.
 *
 * # Content
 *
 * Original phrasing, table-practical, no quotation or paraphrase of
 * protected rulebook prose. Mechanic and clan names are used as
 * terminology only.
 */
export interface RoleplayTip {
  id: string;
  edition: EditionScope;
  title: Record<LangCode, string>;
  content: Record<LangCode, string[]>;
}

const EMPTY_LANGS = { pt: '', fr: '', de: '', it: '' };
const EMPTY_LANG_ARRAYS: { pt: string[]; fr: string[]; de: string[]; it: string[] } = {
  pt: [], fr: [], de: [], it: [],
};

export const roleplay: RoleplayTip[] = [
  // -- Universal: shows in every edition ------------------------------------
  {
    id: 'portraying-the-undead',
    edition: null,
    title: {
      en: 'Portraying the Undead',
      es: 'Interpretar al No-Muerto',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "You are a corpse that thinks. Speak deliberately. Let pauses stretch a beat longer than a living person would tolerate.",
        "You don't breathe unless you choose to. Skip sighs, gasps, and the small involuntary noises a living body makes.",
        "Your skin is cold. Acknowledge the moment a mortal touches you and recoils — that flinch is a free piece of characterization.",
        "Time hits differently. A week of grief, a debt that ruins a mortal life — these read as small to you. Show that distance without snapping out of character.",
        "Pick one physical signature your character defaults to under pressure: a clenched jaw, an absent stare, half a smile. It anchors every scene.",
      ],
      es: [
        "Eres un cadáver que piensa. Habla con calma. Permite que las pausas duren un instante más de lo que toleraría una persona viva.",
        "No respiras a menos que decidas hacerlo. Salta los suspiros, los jadeos y los pequeños ruidos involuntarios del cuerpo vivo.",
        "Tu piel está fría. Reconoce el momento en que un mortal te toca y se aparta sin querer; ese estremecimiento es caracterización gratis.",
        "El tiempo te golpea distinto. Una semana de duelo, una deuda que arruina una vida mortal: para ti son cosas pequeñas. Muestra esa distancia sin salir del personaje.",
        "Elige un gesto físico al que tu personaje recurre bajo presión: una mandíbula tensa, una mirada ausente, media sonrisa. Te ancla en cada escena.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'clan-as-behavior',
    edition: null,
    title: {
      en: 'Clan as Behavior',
      es: 'El Clan como Comportamiento',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Clan is not just a stat block. It's the shape your hunger takes. Decide what your clan's curse looks like for your character specifically, not the textbook version.",
        "Brujah: the temper is the easy read; the harder one is the cause behind it. What injustice can your character not let slide?",
        "Ventrue: the prestige plays cleanly only if you also play the picky feeding. Make the limitation cost you something at the table.",
        "Toreador: pick the aesthetic you can't look away from. Ask the Storyteller to use it against you at least once.",
        "Nosferatu: choose a single mortal-world detail your character mourns losing — a mirror, a job, a particular friendship. Reference it once a session.",
        "Malkavian: notice things others don't, but pick a consistent perceptual quirk. Random nonsense is not insight; pattern is.",
        "For every other clan, pick the one tradition or sin you'll lean into and let it color how you greet, how you refuse, and how you apologize.",
      ],
      es: [
        "El clan no es solo una hoja de personaje. Es la forma que toma tu hambre. Decide qué aspecto tiene la maldición del clan en tu personaje, no la versión del manual.",
        "Brujah: lo fácil es jugar el temperamento; lo difícil es jugar la causa detrás. ¿Qué injusticia no puede tolerar tu personaje en silencio?",
        "Ventrue: el prestigio funciona si también juegas la alimentación selectiva. Que la limitación te cueste algo a la mesa.",
        "Toreador: elige la estética por la que tu personaje no puede pasar. Pide al Narrador que la use en tu contra al menos una vez.",
        "Nosferatu: escoge un detalle del mundo mortal que tu personaje extraña haber perdido: un espejo, un trabajo, una amistad concreta. Referénciala una vez por sesión.",
        "Malkavian: percibe cosas que los demás no ven, pero elige una rareza consistente. El sinsentido aleatorio no es visión; el patrón sí.",
        "Para cualquier otro clan, escoge la tradición o el pecado al que vas a inclinarte y deja que coloree cómo saludas, cómo niegas y cómo te disculpas.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'the-beast',
    edition: null,
    title: {
      en: 'The Beast as Voice',
      es: 'La Bestia como Voz',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "The Beast is not 'when you get angry.' It's a separate voice that wants different things than the personality you put on. Let it argue silently with the character you're playing.",
        "Pick the physical signature of your Beast at the edge of control: shorter sentences, an absent stare, a glance at the nearest pulse. Lean into it as your character's stress rises.",
        "Describe the act of holding back: clenched fists, biting the inside of your mouth, looking away from a vein. The table sees the cost.",
        "Frenzy is not a free pass to play wild. It's a loss. Narrate what your character would have done if they had won the roll, then play what the Beast actually did.",
        "The Beast and the persona are co-authors. Decide which one wins each small choice before the big choice arrives.",
      ],
      es: [
        "La Bestia no es 'cuando te enfadas'. Es una voz separada que quiere cosas distintas a las del personaje que interpretas. Deja que discuta en silencio con tu personaje.",
        "Elige el gesto físico de tu Bestia al borde del control: frases más cortas, mirada ausente, un vistazo al pulso más cercano. Recurre a él cuando el estrés de tu personaje suba.",
        "Describe el acto de contenerte: puños apretados, mordiéndote por dentro, apartando la vista de una vena. La mesa ve el coste.",
        "El frenesí no es licencia para jugar salvaje. Es una pérdida. Narra lo que tu personaje habría hecho si hubiese ganado la tirada, y luego juega lo que la Bestia hizo realmente.",
        "La Bestia y la persona son coautores. Decide cuál gana cada pequeña elección antes de que llegue la grande.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'humanity-and-tension',
    edition: null,
    title: {
      en: 'Humanity and Moral Tension',
      es: 'Humanidad y Tensión Moral',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Treat Humanity loss like a scar. After a stain or a degeneration, decide what your character no longer notices. The new detachment is the play, not the number.",
        "A character who never loses Humanity is a character who never made a hard call on screen. Pick the choices that should cost you.",
        "A character who never gains Humanity is a story without remorse. Look for small redemptions: not big speeches, small steadinesses.",
        "Before any morally ambiguous scene, ask yourself: what does my character convince themselves they're doing here?",
        "Cruelty is easy at the table; consequences are the writing. Build at least one moment per session your character will regret.",
      ],
      es: [
        "Trata la pérdida de Humanidad como una cicatriz. Tras una mancha o degeneración, decide qué deja de notar tu personaje. El nuevo desapego es la interpretación, no el número.",
        "Un personaje que nunca pierde Humanidad nunca tomó en pantalla una decisión difícil. Elige las jugadas que deben costarte.",
        "Un personaje que nunca recupera Humanidad es una historia sin remordimiento. Busca redenciones pequeñas: no discursos, sino gestos firmes.",
        "Antes de cualquier escena moralmente ambigua, pregúntate: ¿de qué se convence mi personaje a sí mismo para hacer esto?",
        "La crueldad es fácil en la mesa; las consecuencias son lo que se escribe. Genera al menos un momento por sesión del que tu personaje vaya a arrepentirse.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'court-and-boons',
    edition: null,
    title: {
      en: 'Court, Etiquette, and Boons',
      es: 'Corte, Etiqueta y Favores',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Elysium is theater. Pick the persona your character wears in court and how it differs from the usual self. The gap is the character.",
        "Boons outrank money. Owing one is heavier than owing a debt. Accept favors carefully and offer them like contracts.",
        "Address people by title until they invite informality, then notice exactly who does and who doesn't.",
        "Threats in court are made by silence, not raised voices. Volume is for the desperate.",
        "Always know which Kindred in the room could end your night. Move around them, never through them.",
        "When the Prince looks at you, return the look briefly, then defer. Eye contact held too long reads as a challenge; broken too fast reads as guilt.",
      ],
      es: [
        "El Elíseo es teatro. Elige la persona que tu personaje viste en la corte y en qué se diferencia de la habitual. Esa distancia es el personaje.",
        "Los favores pesan más que el dinero. Deber uno es más grave que deber una deuda. Acepta favores con cuidado y ofrécelos como contratos.",
        "Dirígete a los demás por su título hasta que te inviten a tutearlos, y entonces fíjate en quién lo hace y quién no.",
        "Las amenazas en la corte se hacen por silencio, no por gritos. El volumen es para los desesperados.",
        "Sé siempre consciente de qué Cainita en la sala podría acabar contigo esa noche. Muévete a su alrededor, no a través de ellos.",
        "Cuando el Príncipe te mire, devuelve la mirada un instante y luego baja la vista. Sostenerla demasiado se lee como un desafío; romperla demasiado pronto se lee como culpa.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'tone-and-safety',
    edition: null,
    title: {
      en: 'Tone and Table Safety',
      es: 'Tono y Seguridad en la Mesa',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Talk about lines and veils at session zero. What we don't want on screen is more useful than what we want.",
        "Use the table's safety tools (X-card, lines and veils, open door, whatever your group adopted) without apology. Stopping a scene is part of playing well.",
        "Match the tone of the chronicle. A street-level Anarch story and a high-court Camarilla story tolerate different intensities of cruelty.",
        "When in doubt about whether to escalate a scene, ask the Storyteller off-screen first.",
        "It's a fan-made game about monsters in a real city. Treat real-world groups, places, and traumas with the same care you'd want for your own.",
      ],
      es: [
        "Hablad de líneas y velos en la sesión cero. Lo que no queremos ver suele ser más útil que lo que sí queremos.",
        "Usa las herramientas de seguridad de la mesa (X-card, líneas y velos, puerta abierta, lo que vuestro grupo haya adoptado) sin disculparte. Detener una escena es parte de jugar bien.",
        "Ajusta el tono al de la crónica. Una historia anarquista de calle y una de alta corte de la Camarilla toleran intensidades distintas de crueldad.",
        "Si tienes dudas sobre escalar una escena, consulta al Narrador fuera de cámara primero.",
        "Es un juego fanmade sobre monstruos en una ciudad real. Trata a grupos, lugares y traumas reales con el mismo cuidado que querrías para los tuyos.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'new-player-tips',
    edition: null,
    title: {
      en: 'Tips for New Players',
      es: 'Consejos para Jugadores Nuevos',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Pick a single concept sentence (\"an ex-paramedic who can't stop trying to save people\") and let everything else build off it.",
        "Spend your first session listening. Vampires are old; your character is allowed to be the one who shuts up and watches.",
        "Ask the Storyteller before assuming an action would work. 'Could I…?' before 'I do…' is your friend.",
        "Don't over-optimize. A character with one obvious weakness is more fun to play than a perfectly built one.",
        "If a scene loses you, signal early. 'I'm not sure what my character would do' is a great prompt, not a failure.",
      ],
      es: [
        "Elige una sola frase de concepto (\"ex-paramédico que no puede dejar de intentar salvar gente\") y construye el resto a partir de ahí.",
        "Pasa tu primera sesión escuchando. Los vampiros son viejos; tu personaje puede ser el que calla y observa.",
        "Pregunta al Narrador antes de asumir que algo funcionaría. '¿Podría…?' antes de 'lo hago…' es tu mejor herramienta.",
        "No sobreoptimices. Un personaje con una debilidad obvia se juega mejor que uno construido a la perfección.",
        "Si pierdes el hilo de una escena, dilo pronto. 'No sé qué haría mi personaje aquí' es un buen punto de partida, no un fallo.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'storyteller-tips',
    edition: null,
    title: {
      en: 'Storyteller Tips',
      es: 'Consejos para el Narrador',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Hand each player a hook in the first session. A debt, a rumor, a missing friend. Specific beats general.",
        "Plan the night, not the chronicle. Three crisp sessions land harder than one ambitious one that never finishes.",
        "When the players surprise you, let them. The Storyteller's plan is a draft; the table writes the published version.",
        "Let consequences hit on a one- or two-session delay. Immediate retaliation is a thriller; delayed retaliation is a vampire game.",
        "Sketch antagonists by what they want, not by their stat block. The stat block fills in once the want is real.",
      ],
      es: [
        "Dale a cada jugador un gancho en la primera sesión. Una deuda, un rumor, una amistad desaparecida. Lo concreto vale más que lo general.",
        "Planifica la noche, no la crónica entera. Tres sesiones limpias golpean más que una ambiciosa que nunca termina.",
        "Cuando los jugadores te sorprendan, déjalos. El plan del Narrador es un borrador; la mesa escribe la versión final.",
        "Deja que las consecuencias caigan con una o dos sesiones de retraso. La represalia inmediata es un thriller; la represalia diferida es un juego de vampiros.",
        "Esboza a los antagonistas por lo que quieren, no por su ficha. La ficha se rellena cuando el deseo es real.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },

  // -- V5-only --------------------------------------------------------------
  {
    id: 'the-beast-and-hunger-v5',
    edition: 'v5',
    title: {
      en: 'The Beast and Hunger',
      es: 'La Bestia y el Hambre',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Hunger is not just a number on the sheet. Higher Hunger thins your manners, your patience, your peripheral vision. Show it in scene.",
        "At Hunger 3+, the waitress's pulse becomes interesting in a way it wasn't a minute ago. Mention it once; don't lecture.",
        "Messy Criticals and Bestial Failures are story prompts, not punishments. Let the consequence land within the same scene if you can.",
        "A Compulsion is the Beast asking for something. Name the want when it triggers — out loud — and let the table watch you yield.",
        "Feeding is part of the night, not a between-session chore. Spend at least a beat on it when Hunger is high.",
      ],
      es: [
        "El Hambre no es solo un número en la hoja. A más Hambre, peor trato a los modales, a la paciencia, a la visión periférica. Muéstralo en escena.",
        "A Hambre 3+, el pulso de la camarera vuelve a importarte como hace un minuto no importaba. Menciónalo una vez; no lo conviertas en sermón.",
        "Los Críticos Desastrosos y los Fallos Bestiales son ganchos narrativos, no castigos. Deja que la consecuencia caiga dentro de la misma escena si puedes.",
        "Una Compulsión es la Bestia pidiendo algo. Nombra ese deseo cuando se dispare — en voz alta — y deja que la mesa vea cómo cedes.",
        "Alimentarse es parte de la noche, no una tarea entre sesiones. Dedícale al menos un latido cuando el Hambre esté alta.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'touchstones-v5',
    edition: 'v5',
    title: {
      en: 'Touchstones and Convictions',
      es: 'Anclas y Convicciones',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Keep one short sentence on hand for each Touchstone describing what they represent and what would shake the connection. Bring it into a scene before the Storyteller has to ask.",
        "Touchstones drift. Update yours when the chronicle changes their context — a friend who moves away, a place that closes, a conviction that frays.",
        "Losing a Touchstone is the kind of beat the table should witness. Don't quietly cross it off; let the loss happen on screen.",
        "Convictions outlast Touchstones, but they need a Touchstone to anchor them. A Conviction without a person tied to it is a slogan.",
        "When the Storyteller offers a chance to deepen a Touchstone, take it. It's free roleplay fuel and a brake on slow Humanity loss.",
      ],
      es: [
        "Ten una frase corta lista para cada Ancla que describa lo que representa y qué la sacudiría. Llévala a una escena antes de que el Narrador tenga que preguntar.",
        "Las Anclas se desplazan. Actualízalas cuando la crónica cambia su contexto: una amistad que se muda, un lugar que cierra, una Convicción que se desgasta.",
        "Perder un Ancla es el tipo de momento que la mesa debería presenciar. No lo taches en silencio; deja que la pérdida ocurra en pantalla.",
        "Las Convicciones duran más que las Anclas, pero necesitan un Ancla que las sostenga. Una Convicción sin una persona detrás es solo un lema.",
        "Cuando el Narrador te ofrezca profundizar un Ancla, acepta. Es combustible narrativo gratis y un freno a la caída lenta de Humanidad.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'compulsions-v5',
    edition: 'v5',
    title: {
      en: 'Compulsions and the Hunger Die',
      es: 'Compulsiones y el Dado de Hambre',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Compulsions are cues, not punishments. When you trigger one, the storytelling beat comes first; the mechanical check comes second.",
        "A Compulsion satisfied early in a scene is more interesting than one fought for an hour. Lean in and let the table watch the wreckage.",
        "Hunger-tinted rolls that go wrong aren't bad luck — they're an invitation. Take the consequence and find a way to make it your character's problem.",
        "Spend Willpower to resist some of the time. Resisting always is dishonest; never resisting is a tantrum.",
        "A clan bane / Compulsion that never comes up at the table means you're playing a different character. Bring it forward yourself if the Storyteller doesn't.",
      ],
      es: [
        "Las Compulsiones son señales, no castigos. Cuando se dispare una, primero llega el momento narrativo; la comprobación mecánica viene después.",
        "Una Compulsión satisfecha al principio de una escena es más interesante que una que peleas durante una hora. Cede y deja que la mesa observe los daños.",
        "Las tiradas teñidas de Hambre que salen mal no son mala suerte: son una invitación. Acepta la consecuencia y conviértela en un problema de tu personaje.",
        "Gasta Fuerza de Voluntad para resistir algunas veces. Resistir siempre es deshonesto; nunca resistir es una rabieta.",
        "Una marca de clan o Compulsión que nunca aparece a la mesa significa que estás jugando a otro personaje. Tráela tú al frente si el Narrador no lo hace.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },

  // -- Classic (V20 / Revised / 2nd / 1st) ---------------------------------
  {
    id: 'the-beast-classic',
    edition: 'classic',
    title: {
      en: 'Blood Pool, Frenzy, and Rötschreck',
      es: 'Reserva de Sangre, Frenesí y Rötschreck',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Treat each Blood Pool spend as a narrative beat: when you blush, heal, or boost an attribute, name out loud which night's victim you're burning to do it.",
        "Rötschreck is real. Decide ahead of time what kinds of fire or sudden light spook your character; bring those visuals into the scene the Storyteller paints.",
        "Hunting is its own scene, not a tally. Describe the choice of district, the choice of target, and the way you leave the body when you're done.",
        "Willpower spent to override a Frenzy check is not just a mechanic — narrate the gritted teeth, the deferred violence, the small price your character paid to keep face.",
        "Older blood is colder blood. If your character is mid-Generation or lower, lean into the indifference; if higher-Generation, lean into the rawer hungers.",
      ],
      es: [
        "Trata cada gasto de Reserva de Sangre como un latido narrativo: cuando te sonrojas, sanas o impulsas un atributo, di en voz alta a qué víctima de esta noche le estás quemando.",
        "El Rötschreck es real. Decide de antemano qué clases de fuego o luz repentina asustan a tu personaje; lleva esas imágenes a la escena que pinta el Narrador.",
        "Cazar es una escena en sí, no un recuento. Describe la elección del distrito, la elección del objetivo y la forma en que dejas el cuerpo cuando terminas.",
        "La Fuerza de Voluntad gastada para anular una tirada de Frenesí no es solo una mecánica: narra los dientes apretados, la violencia pospuesta, el pequeño precio que tu personaje pagó por guardar las formas.",
        "Sangre más vieja, sangre más fría. Si tu personaje es de Generación media o baja, inclínate hacia la indiferencia; si es de Generación alta, inclínate hacia los hambres más crudos.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'paths-classic',
    edition: 'classic',
    title: {
      en: 'Paths of Enlightenment',
      es: 'Sendas de Iluminación',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "A Path of Enlightenment is a different moral operating system, not a worse one. Read your hierarchy of sins literally and play it without apology.",
        "Conscience and Self-Control are not Humanity's siblings — they replace it. Decide what each virtue looks like at your current rating and play that, not a generic vampire.",
        "Stake out one or two anchors your character defends ferociously, even if the Path tells them not to. The contradiction is the character.",
        "A degeneration check on a Path is just as scary as on Humanity. Frame it that way at the table; don't treat it as a paperwork stop.",
        "If you carry a character across editions, write the in-character reason for any Path shift before the session, not during.",
      ],
      es: [
        "Una Senda de Iluminación es otro sistema operativo moral, no uno peor. Lee tu jerarquía de pecados al pie de la letra y juégala sin disculparte.",
        "Conciencia y Autocontrol no son hermanas de la Humanidad: la sustituyen. Decide cómo se ve cada virtud a tu valor actual y juégala, no un vampiro genérico.",
        "Marca uno o dos anclajes que tu personaje defenderá con uñas y dientes, incluso si la Senda le dice que no. La contradicción es el personaje.",
        "Una tirada de degeneración en una Senda es tan seria como en Humanidad. Enmárcala así en la mesa; no la trates como una parada burocrática.",
        "Si trasladas un personaje entre ediciones, escribe el motivo en-personaje del cambio de Senda antes de la sesión, no durante.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
  {
    id: 'flaws-and-frenzy-classic',
    edition: 'classic',
    title: {
      en: 'Flaws, Frenzy, and Conscience',
      es: 'Defectos, Frenesí y Conciencia',
      ...EMPTY_LANGS,
    },
    content: {
      en: [
        "Frenzy and Rötschreck checks are character beats, not paperwork. Narrate what your character almost did, then what they actually did.",
        "Conscience (or the Path's equivalent) checks for degeneration are the soul of classic vampire play. Tell the table what your character is wrestling with before you reach for the dice.",
        "Spend Willpower to override a virtue check sometimes — not every time. Resisting always is dishonest; never resisting is a tantrum.",
        "Flaws and clan banes are character debt that pays interest. If your clan curse never surfaces, you're playing a different character.",
        "Consequences should land within one or two scenes. Don't let your worst moments become someone else's homework.",
      ],
      es: [
        "Las tiradas de Frenesí y Rötschreck son momentos de personaje, no papeleo. Narra lo que tu personaje casi hizo y luego lo que hizo realmente.",
        "Las tiradas de Conciencia (o el equivalente de la Senda) para degeneración son el alma del juego clásico de vampiros. Cuéntale a la mesa con qué lucha tu personaje antes de coger los dados.",
        "Gasta Fuerza de Voluntad para anular una tirada de virtud a veces — no siempre. Resistir siempre es deshonesto; nunca resistir es una rabieta.",
        "Defectos y estigmas de clan son deuda de personaje que paga intereses. Si la maldición de tu clan nunca aparece, estás jugando a otro personaje.",
        "Las consecuencias deberían caer en una o dos escenas. No conviertas tus peores momentos en tarea para los demás.",
      ],
      ...EMPTY_LANG_ARRAYS,
    },
  },
];
