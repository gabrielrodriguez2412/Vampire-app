import { GlossaryEntry } from '../types';

/**
 * Glossary entries.
 *
 * Conventions:
 * - `term` and `definition` are multilingual records. EN + ES are
 *   filled; pt / fr / de / it intentionally fall back to EN via
 *   `getText` until a translator picks them up. We do provide the
 *   term spelling in those locales when it differs meaningfully,
 *   so the page header reads naturally even before the definition
 *   is localized.
 * - `edition` tags a term as V5- or classic-specific. Most concepts
 *   are universal (`null` / omitted). The page surfaces this as a
 *   small badge — useful because the Companion supports five
 *   editions and a few terms (Hunger as a die mechanic, Touchstones,
 *   Predator Type, Blood Potency, Resonance) really do not mean the
 *   same thing in V20 / Revised / 2nd / 1st.
 * - Definitions are deliberately original phrasing. They use the
 *   shared genre terminology (clan names, sect names, mechanic
 *   labels) without reproducing or paraphrasing protected rulebook
 *   prose.
 * - `related` references the ids of other glossary entries; the
 *   page renders them as inert badges today but search and a
 *   future cross-link could use them.
 *
 * If you add an entry, keep the id stable. Search indexing in
 * `utils/search.ts` and any future deep-link UI rely on ids being
 * durable across releases.
 */

/** Helper for terms whose spelling is identical across the languages we ship. */
const sameInAll = (val: string): Record<string, string> => ({
  es: val, en: val, pt: val, fr: val, de: val, it: val,
});

export const glossary: GlossaryEntry[] = [
  // -- Sects & political bodies ---------------------------------------------
  {
    id: 'camarilla',
    term: { es: 'La Camarilla', en: 'The Camarilla', pt: 'A Camarilla', fr: 'La Camarilla', de: 'Die Camarilla', it: 'La Camarilla' },
    definition: {
      es: 'La secta dominante de ancianos: aplica la Mascarada y las Tradiciones y se organiza como una pirámide neofeudal coronada por Príncipes.',
      en: "The dominant sect of elders: enforces the Masquerade and the Traditions and organizes itself as a neo-feudal pyramid topped by Princes.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['masquerade', 'prince', 'elysium'],
    edition: null,
  },
  {
    id: 'anarchs',
    term: { es: 'Los Anarquistas', en: 'The Anarchs', pt: 'Os Anarquistas', fr: 'Les Anarchs', de: 'Die Anarchen', it: 'Gli Anarchici' },
    definition: {
      es: 'Coalición laxa de Cainitas jóvenes y disidentes que rechaza la pirámide de la Camarilla e improvisa sus propias respuestas a la Mascarada y al territorio.',
      en: 'A loose coalition of younger and dissenting Kindred that rejects the Camarilla pyramid and improvises its own answers to Masquerade and territory.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['camarilla', 'masquerade'],
    edition: null,
  },
  {
    id: 'sabbat',
    term: { es: 'El Sabbat', en: 'The Sabbat', pt: 'O Sabá', fr: 'Le Sabbat', de: 'Der Sabbat', it: 'Il Sabbat' },
    definition: {
      es: 'Secta apocalíptica que trata a la Bestia como parentela y a la Mascarada como servidumbre. La mayoría de crónicas la usa como amenaza fuera de cámara o como invasor.',
      en: 'An apocalyptic sect that treats the Beast as kin and the Masquerade as servitude. Most chronicles use them as off-screen threat or invader.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['gehenna', 'beast'],
    edition: null,
  },
  {
    id: 'sect',
    term: { es: 'Secta', en: 'Sect', pt: 'Seita', fr: 'Secte', de: 'Sekte', it: 'Setta' },
    definition: {
      es: 'Alineación política que cruza líneas de clan — Camarilla, Anarquistas, Sabbat y facciones menores. Un personaje pertenece a un clan; elige una secta.',
      en: 'A political alignment that crosses clan lines — Camarilla, Anarchs, Sabbat, and smaller factions. A character is born to a clan; they choose a sect.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['camarilla', 'anarchs', 'sabbat', 'clan'],
    edition: null,
  },

  // -- Identity & lineage ----------------------------------------------------
  {
    id: 'clan',
    term: { es: 'Clan', en: 'Clan', pt: 'Clã', fr: 'Clan', de: 'Klan', it: 'Clan' },
    definition: {
      es: 'Linaje de vampiros que comparte un fundador común. Cada clan trae un conjunto de Disciplinas, una maldición y una reputación heredada.',
      en: 'A vampire lineage sharing a common founder. Each clan brings a Discipline set, a curse, and an inherited reputation.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['discipline', 'sire'],
    edition: null,
  },
  {
    id: 'sire',
    term: { es: 'Sire', en: 'Sire', pt: 'Senhor', fr: 'Sire', de: 'Erzeuger', it: 'Sire' },
    definition: {
      es: 'El vampiro que creó a otro mediante el Abrazo. La relación es desigual con frecuencia y rara vez es casual.',
      en: 'The vampire who created another vampire by Embracing them. The relationship is often unequal and rarely casual.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['childer', 'clan'],
    edition: null,
  },
  {
    id: 'childer',
    term: { es: 'Chiquillo (Childe)', en: 'Childe', pt: 'Cria', fr: 'Infant', de: 'Kind', it: 'Infante' },
    definition: {
      es: 'Un vampiro recién creado, definido en relación con su Sire. Plural anticuado: Chiquillos / Childer.',
      en: 'A newly created vampire, defined in relation to their sire. Archaic plural: childer.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['sire'],
    edition: null,
  },
  {
    id: 'caitiff',
    term: sameInAll('Caitiff'),
    definition: {
      es: 'Vampiro sin clan reconocido — abrazado por un Sire desconocido, rechazado por su línea o escondido de la sociedad cortés. Suele ser tratado con desconfianza.',
      en: 'A vampire without a recognized clan — embraced by an unknown sire, refused by their parent line, or hidden from polite Kindred society. Usually treated with suspicion.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['clan', 'thin-blood'],
    edition: null,
  },
  {
    id: 'thin-blood',
    term: { es: 'Sangre Diluida', en: 'Thin-Blood', pt: 'Sangue Fraco', fr: 'Sang-Faible', de: 'Dünnblut', it: 'Sangue Diluito' },
    definition: {
      es: 'Vampiro de Generación muy alta cuya sangre es tenue. A menudo marginal, a veces capaz de pasar por humano; rara vez bienvenido en la corte.',
      en: 'A vampire of very high Generation whose blood is faint. Often outsiders, sometimes able to pass for human; rarely welcome at court.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['generation', 'caitiff'],
    edition: null,
  },
  {
    id: 'generation',
    term: { es: 'Generación', en: 'Generation', pt: 'Geração', fr: 'Génération', de: 'Generation', it: 'Generazione' },
    definition: {
      es: 'Distancia entre un vampiro y el primero. Generaciones menores significan sangre más concentrada y mayor poder. V5 expresa el mismo concepto principalmente a través de la Potencia de Sangre.',
      en: "The number of steps between a vampire and the First. Lower Generation means more concentrated blood and greater power. V5 expresses the same idea mostly through Blood Potency.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['diablerie', 'methuselah', 'blood-potency'],
    edition: null,
  },
  {
    id: 'methuselah',
    term: { es: 'Matusalén', en: 'Methuselah', pt: 'Matusalém', fr: 'Mathusalem', de: 'Methusalem', it: 'Matusalemme' },
    definition: {
      es: 'Vampiro que ha sobrevivido cerca de mil años. Sus motivos son ajenos; sus manos suelen estar metidas en tu historia aunque no lo veas.',
      en: 'A vampire who has survived for around a thousand years. Their motives are alien; their hands are usually somewhere in your story even when you cannot see them.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['generation'],
    edition: null,
  },

  // -- Court, law, geography -------------------------------------------------
  {
    id: 'masquerade',
    term: { es: 'La Mascarada', en: 'The Masquerade', pt: 'A Mascarada', fr: 'La Mascarade', de: 'Die Maskerade', it: 'Il Masquerade' },
    definition: {
      es: 'El pacto no escrito entre los no-muertos: los mortales nunca deben confirmar que los vampiros existen. Romperlo invita represalias del Príncipe y los ancianos.',
      en: "The unwritten pact among the undead that mortals must never confirm vampires exist. Breaches invite reprisal from the Prince and the elders.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['camarilla', 'prince'],
    edition: null,
  },
  {
    id: 'prince',
    term: { es: 'Príncipe', en: 'Prince', pt: 'Príncipe', fr: 'Prince', de: 'Prinz', it: 'Principe' },
    definition: {
      es: 'Cainita reconocido como gobernante de un dominio de la Camarilla. Concede dominio, declara la Caza de Sangre y responde de la Mascarada local.',
      en: 'The recognized ruler of a Camarilla domain. Grants dominion, calls Blood Hunts, and is responsible for enforcing the Masquerade locally.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['camarilla', 'domain', 'elysium'],
    edition: null,
  },
  {
    id: 'elysium',
    term: { es: 'Elíseo', en: 'Elysium', pt: 'Elísio', fr: 'Élysée', de: 'Elysium', it: 'Elysium' },
    definition: {
      es: 'Terreno neutral declarado por el Príncipe. La violencia, el uso evidente de Disciplinas y la caza están prohibidos dentro de sus muros.',
      en: 'Neutral ground claimed by the Prince. Violence, overt Discipline use, and hunting are forbidden inside its walls.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['prince', 'boon'],
    edition: null,
  },
  {
    id: 'domain',
    term: { es: 'Dominio', en: 'Domain', pt: 'Domínio', fr: 'Domaine', de: 'Domäne', it: 'Dominio' },
    definition: {
      es: 'El territorio que un Príncipe o una coterie reclama y defiende. Cruzarlo sin permiso es el comienzo lento de un conflicto rápido.',
      en: 'The territory a Prince or a coterie claims and enforces. Crossing one uninvited is a slow start to a fast conflict.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['prince', 'rack'],
    edition: null,
  },
  {
    id: 'rack',
    term: { es: 'El Coto (The Rack)', en: 'The Rack', pt: 'O Campo', fr: 'Le Parc', de: 'Die Jagdgründe', it: 'La Riserva' },
    definition: {
      es: 'Zona urbana rica en blancos mortales — bares, clubes, intercambiadores de transporte — donde la caza es fácil. Suele estar reclamada y disputada al mismo tiempo.',
      en: 'An urban area rich in mortal targets — bars, clubs, transit hubs — where hunting is easy. Usually claimed and just as often disputed.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['domain'],
    edition: null,
  },
  {
    id: 'boon',
    term: { es: 'Favor (Boon)', en: 'Boon', pt: 'Favor', fr: 'Faveur', de: 'Gunst', it: 'Favore' },
    definition: {
      es: 'Promesa formal de ayuda futura, recordada por la mesa y rastreada por las Arpías. Los favores adeudados pesan más que el dinero y pueden durar siglos.',
      en: 'A formal promise of future help, remembered by the table and tracked by the Harpies. Owed boons outrank money and can last for centuries.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['prestation', 'elysium'],
    edition: null,
  },
  {
    id: 'prestation',
    term: { es: 'Prestation', en: 'Prestation', pt: 'Prestação', fr: 'Prestation', de: 'Prestation', it: 'Prestation' },
    definition: {
      es: 'El sistema de favores en sí — la etiqueta por la que los Cainitas piden, deben, pagan y perdonan. La moneda de la corte.',
      en: 'The system of boons itself — the etiquette by which Kindred ask, owe, repay, and forgive. The currency of court.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['boon'],
    edition: null,
  },

  // -- The Beast, hunger, and the cost of unlife ----------------------------
  {
    id: 'beast',
    term: { es: 'La Bestia', en: 'The Beast', pt: 'A Besta', fr: 'La Bête', de: 'Das Tier', it: 'La Bestia' },
    definition: {
      es: 'El yo depredador interior que todo vampiro carga: hambriento, defensivo, dominante. Su voz crece con el hambre, el miedo y la rabia.',
      en: 'The predatory inner self every vampire carries — hungry, defensive, dominant. Its voice rises with hunger, fear, and rage.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['frenzy', 'humanity', 'hunger'],
    edition: null,
  },
  {
    id: 'frenzy',
    term: { es: 'Frenesí', en: 'Frenzy', pt: 'Frenesi', fr: 'Frénésie', de: 'Raserei', it: 'Frenesia' },
    definition: {
      es: 'Pérdida de control a manos de la Bestia. El hambre, el terror (Rötschreck) y la furia pueden desencadenarlo; el personaje actúa por instinto hasta que pase la oleada.',
      en: 'A loss of control to the Beast. Hunger, terror (rötschreck), or fury can each trigger it; the character acts on instinct until the wave passes.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['beast'],
    edition: null,
  },
  {
    id: 'hunger',
    term: { es: 'Hambre', en: 'Hunger', pt: 'Fome', fr: 'Faim', de: 'Hunger', it: 'Fame' },
    definition: {
      es: 'En V5, el rastreador de Hambre y los dados de Hambre que se cuelan en la reserva. A más Hambre, más probable que la Bestia colore el resultado de la tirada.',
      en: 'In V5, the Hunger tracker and the Hunger dice that slip into your dice pool. The higher the Hunger, the more likely the Beast colors the outcome of a roll.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['beast', 'compulsion'],
    edition: 'v5',
  },
  {
    id: 'humanity',
    term: { es: 'Humanidad', en: 'Humanity', pt: 'Humanidade', fr: 'Humanité', de: 'Menschlichkeit', it: 'Umanità' },
    definition: {
      es: 'Medida de cuán cerca queda un vampiro de la vida moral mortal. Cae con la crueldad, el descuido o el exceso al alimentarse; una Humanidad alta es la diferencia entre alguien que se alimenta y un monstruo que devora.',
      en: 'A measure of how close a vampire remains to mortal moral life. It falls with cruelty, neglect, or excess feeding; high Humanity is the difference between someone who feeds and a monster who eats.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['beast', 'touchstone', 'path-of-enlightenment'],
    edition: null,
  },
  {
    id: 'path-of-enlightenment',
    term: { es: 'Senda de Iluminación', en: 'Path of Enlightenment', pt: 'Caminho da Iluminação', fr: 'Voie de l\'Illumination', de: 'Pfad der Erleuchtung', it: 'Sentiero dell\'Illuminazione' },
    definition: {
      es: 'En las ediciones clásicas, sistema moral alternativo a la Humanidad. Sustituye la jerarquía mortal por la lógica interna de la Senda — su propio orden de pecados y de virtudes. Suele jugarse junto a Conciencia y Autocontrol específicas de cada Senda.',
      en: "In the classic editions, an alternative morality system that replaces Humanity. The mortal hierarchy is swapped for the Path's own internal logic — its own ordering of sins and its own virtues. Usually paired with Path-specific replacements for Conscience and Self-Control.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['humanity', 'beast'],
    edition: 'classic',
  },
  {
    id: 'compulsion',
    term: { es: 'Compulsión', en: 'Compulsion', pt: 'Compulsão', fr: 'Compulsion', de: 'Zwang', it: 'Compulsione' },
    definition: {
      es: 'En V5, un impulso conductual desencadenado por ciertas tiradas teñidas de Hambre. No es un castigo: es un gancho narrativo que la mesa puede aprovechar.',
      en: 'In V5, a behavioral push triggered by certain Hunger-tinted rolls. Not a punishment — a narrative cue the table can lean into.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['hunger', 'beast'],
    edition: 'v5',
  },
  {
    id: 'touchstone',
    term: { es: 'Ancla (Touchstone)', en: 'Touchstone', pt: 'Pedra de Toque', fr: 'Pierre de Touche', de: 'Anker', it: 'Ancora' },
    definition: {
      es: 'En V5, un mortal concreto cuya importancia para tu personaje lo mantiene anclado a la humanidad. Perder Anclas con frecuencia acelera la caída moral.',
      en: 'In V5, a specific mortal whose continued importance to your character anchors them to humanity. Losing touchstones too often accelerates the slide.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['humanity'],
    edition: 'v5',
  },

  // -- Mechanics & feeding ---------------------------------------------------
  {
    id: 'vitae',
    term: sameInAll('Vitae'),
    definition: {
      es: 'Sangre vampírica. El combustible que un vampiro gasta para usar Disciplinas, curarse y vincular a ghouls o rivales a su voluntad.',
      en: 'Vampiric blood. The fuel a vampire spends to use Disciplines, heal injuries, and bind ghouls or rivals to their will.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['ghoul', 'blood-bond', 'discipline'],
    edition: null,
  },
  {
    id: 'discipline',
    term: { es: 'Disciplina', en: 'Discipline', pt: 'Disciplina', fr: 'Discipline', de: 'Disziplin', it: 'Disciplina' },
    definition: {
      es: 'Capacidad sobrenatural alimentada por Vitae — Auspex, Dominar, Celeridad y el resto. Cada clan tiene Disciplinas propias; otras pueden aprenderse a mayor coste.',
      en: 'A supernatural capability fueled by Vitae — Auspex, Dominate, Celerity, and the rest. Each clan has signature Disciplines; others can be learned at higher cost.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['clan', 'vitae'],
    edition: null,
  },
  {
    id: 'blood-potency',
    term: { es: 'Potencia de Sangre', en: 'Blood Potency', pt: 'Potência do Sangue', fr: 'Puissance du Sang', de: 'Blutkraft', it: 'Potenza del Sangue' },
    definition: {
      es: 'Métrica de V5 que reemplaza muchos efectos de Generación clásicos: cuán fuerte y concentrada es la vitae del vampiro, con qué facilidad la gasta y con qué fuerza empuja su Bestia.',
      en: "The V5 metric that replaces many classic Generation effects: how strong and concentrated a vampire's vitae is, how easily they spend it, and how hard their Beast pushes.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['generation', 'vitae'],
    edition: 'v5',
  },
  {
    id: 'resonance',
    term: { es: 'Resonancia', en: 'Resonance', pt: 'Ressonância', fr: 'Résonance', de: 'Resonanz', it: 'Risonanza' },
    definition: {
      es: 'En V5, el matiz emocional que impregna la sangre mortal en el momento de beberla. Resonancias colérica, melancólica, flemática y sanguínea apoyan Disciplinas distintas.',
      en: "In V5, the emotional flavor of mortal blood at the moment it is drunk. Choleric, melancholic, phlegmatic, and sanguine resonances each lean different Disciplines.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['vitae'],
    edition: 'v5',
  },
  {
    id: 'predator-type',
    term: { es: 'Tipo de Depredador', en: 'Predator Type', pt: 'Tipo de Predador', fr: 'Type de Prédateur', de: 'Beutetyp', it: 'Tipo di Predatore' },
    definition: {
      es: 'Opción de personaje de V5 que describe cómo caza tu vampiro. La elección moldea Disciplinas iniciales, contactos y el tipo de problemas que la alimentación atrae.',
      en: 'A V5 character option describing how your vampire hunts. The choice shapes starting Disciplines, contacts, and the kind of trouble feeding tends to invite.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['hunger', 'rack'],
    edition: 'v5',
  },
  {
    id: 'ghoul',
    term: { es: 'Ghoul', en: 'Ghoul', pt: 'Carniçal', fr: 'Goule', de: 'Ghul', it: 'Ghoul' },
    definition: {
      es: 'Mortal alimentado repetidamente con vitae vampírica. Deja de envejecer mientras dure el vínculo, gana algo de fuerza sobrenatural y se hace dependiente de su regente.',
      en: 'A mortal repeatedly fed vampiric vitae. Stops aging while the bond holds, gains a sliver of supernatural strength, and grows dependent on their regnant.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['vitae', 'blood-bond'],
    edition: null,
  },
  {
    id: 'blood-bond',
    term: { es: 'Vínculo de Sangre', en: 'Blood Bond', pt: 'Vínculo de Sangue', fr: 'Lien du Sang', de: 'Blutsband', it: 'Vincolo di Sangue' },
    definition: {
      es: 'Dependencia emocional compulsiva que surge cuando un vampiro bebe de otro tres noches distintas. Difícil de romper; fácil de convertir en arma.',
      en: 'The compulsive emotional dependence that grows when one vampire drinks from another on three separate nights. Hard to break; easy to weaponize.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['vitae', 'ghoul'],
    edition: null,
  },

  // -- Chronicle, party, and play --------------------------------------------
  {
    id: 'coterie',
    term: sameInAll('Coterie'),
    definition: {
      es: 'Grupo pequeño de vampiros unidos por necesidad, ambición o confianza. La unidad social básica del juego.',
      en: 'A small group of vampires bound together by need, ambition, or trust. The basic social unit of play.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['chronicle'],
    edition: null,
  },
  {
    id: 'chronicle',
    term: { es: 'Crónica', en: 'Chronicle', pt: 'Crônica', fr: 'Chronique', de: 'Chronik', it: 'Cronaca' },
    definition: {
      es: 'Campaña de sesiones conectadas que comparten personajes, temas y una ciudad. La unidad que planifica un Narrador; la unidad que habita una coterie.',
      en: 'A campaign of connected sessions sharing characters, themes, and a city. The unit a Storyteller plans; the unit a coterie inhabits.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['coterie'],
    edition: null,
  },

  // -- Endings, prophecies, and crimes ---------------------------------------
  {
    id: 'diablerie',
    term: { es: 'Diablerie (Amaranto)', en: 'Diablerie (Amaranth)', pt: 'Diablerie', fr: 'Diablerie', de: 'Diablerie', it: 'Diablerie' },
    definition: {
      es: 'Consumir el alma de otro vampiro junto con la última de su sangre. Reduce la Generación del asesino y es el crimen más castigado del derecho vampírico.',
      en: "Consuming another vampire's soul along with the last of its blood. Lowers the killer's Generation and is the single most punishable crime in vampire law.",
      pt: '', fr: '', de: '', it: '',
    },
    related: ['generation', 'final-death'],
    edition: null,
  },
  {
    id: 'final-death',
    term: { es: 'Muerte Definitiva', en: 'Final Death', pt: 'Morte Final', fr: 'Mort Ultime', de: 'Endgültiger Tod', it: 'Morte Ultima' },
    definition: {
      es: 'El verdadero final de un vampiro: estacado y expuesto al sol, incinerado, drenado sin retorno o víctima de diablerie. Ningún Abrazo regresa de ahí.',
      en: 'The true end of a vampire — staked and exposed to sun, burned, drained beyond recovery, or diablerized. No Embrace returns from it.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['diablerie'],
    edition: null,
  },
  {
    id: 'gehenna',
    term: { es: 'La Gehena', en: 'Gehenna', pt: 'A Gehenna', fr: 'La Géhenne', de: 'Gehenna', it: 'La Gehenna' },
    definition: {
      es: 'El final profetizado del mundo vampírico, cuando los más antiguos despierten y reclamen a su progenie. Algunas crónicas la usan como sabor; otras como reloj que avanza.',
      en: 'The prophesied end of the vampire world, when the eldest stir and demand their progeny back. Some chronicles use it as flavor; others as a ticking clock.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['sabbat', 'methuselah'],
    edition: null,
  },
  {
    id: 'golconda',
    term: sameInAll('Golconda'),
    definition: {
      es: 'Estado legendario de equilibrio interior en el cual un vampiro reconcilia su Bestia. Rara vez se muestra alcanzado en pantalla.',
      en: 'A legendary state of inner balance in which a vampire reconciles with the Beast. Rarely depicted as reached on-screen.',
      pt: '', fr: '', de: '', it: '',
    },
    related: ['humanity', 'beast'],
    edition: null,
  },
];
