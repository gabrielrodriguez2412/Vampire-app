export interface Term {
  id: string;
  term: string;
  definition: string;
  related: string[];
}

export const glossary: Term[] = [
  {
    id: "masquerade",
    term: "La Mascarada (The Masquerade)",
    definition: "La Tradición más importante de la Camarilla y la regla de supervivencia fundamental de los vampiros en la época moderna. Es la conspiración para esconder la existencia de lo sobrenatural de la humanidad.",
    related: ["Camarilla", "Príncipe", "Segunda Inquisición"]
  },
  {
    id: "vitae",
    term: "Vitae",
    definition: "La sangre vampírica. Es la fuente de su poder, lo que les permite despertar cada noche, sanar sus heridas y usar Disciplinas. Tiene propiedades adictivas para los mortales.",
    related: ["Ghoul", "Vinculum", "Hambre"]
  },
  {
    id: "sire",
    term: "Sire",
    definition: "El vampiro que engendró a otro, dándole el Abrazo. Es la figura paterna/materna en la sociedad vampírica y es responsable de los actos de su chiquillo hasta que este sea liberado.",
    related: ["Chiquillo", "Generación", "Abrazo"]
  },
  {
    id: "childer",
    term: "Chiquillo (Childer)",
    definition: "El término utilizado para un vampiro recién creado por su Sire.",
    related: ["Sire", "Abrazo"]
  },
  {
    id: "ghoul",
    term: "Ghoul",
    definition: "Un sirviente mortal a quien se le ha dado de beber Vitae vampírica. Dejan de envejecer, ganan fuerza sobrenatural y acceso a disciplinas menores, pero se vuelven adictos a la sangre de su amo.",
    related: ["Vitae", "Vinculum"]
  },
  {
    id: "coterie",
    term: "Coterie",
    definition: "Un grupo de vampiros unidos por necesidad, amistad o directivas políticas. Es el equivalente a la 'party' o grupo de jugadores en el juego.",
    related: ["Dominio"]
  },
  {
    id: "beast",
    term: "La Bestia (The Beast)",
    definition: "El instinto primario, depredador e irracional que reside dentro de cada vampiro. Busca solo alimentarse, destruir amenazas y sobrevivir, y es la fuente del Frenesí.",
    related: ["Frenesí", "Humanidad"]
  },
  {
    id: "prince",
    term: "Príncipe",
    definition: "El título que ostenta el gobernante de la Camarilla en una ciudad o Dominio. Tiene el poder de otorgar territorios, convocar la Caza de Sangre y permitir o prohibir la creación de nuevos chiquillos.",
    related: ["Camarilla", "Elíseo", "Dominio"]
  },
  {
    id: "elysium",
    term: "Elíseo (Elysium)",
    definition: "Un lugar neutral y santuario declarado por el Príncipe donde la violencia, el uso de disciplinas evidentes y las armas están estrictamente prohibidos. Suele ser un museo, ópera o lugar cultural de alta sociedad.",
    related: ["Príncipe", "Camarilla"]
  },
  {
    id: "camarilla",
    term: "La Camarilla",
    definition: "La secta vampírica más grande, elitista y organizada. Se considera la sociedad global de los Vástagos y se dedica casi exclusivamente a mantener La Mascarada y el orden jerárquico.",
    related: ["Mascarada", "Príncipe", "Anarcas"]
  },
  {
    id: "anarchs",
    term: "Movimiento Anarca (Anarchs)",
    definition: "La secta rebelde que rechaza el control absolutista y feudal de la Camarilla, buscando un autogobierno más libre, aunque reconocen la necesidad de mantener la Mascarada.",
    related: ["Camarilla", "Barón"]
  },
  {
    id: "generation",
    term: "Generación",
    definition: "La distancia genealógica entre un vampiro y Caín (el mítico primer vampiro). A menor generación (más cerca a Caín), más potente y densa es la sangre del vampiro.",
    related: ["Potencia de Sangre", "Antediluviano", "Diablerie"]
  },
  {
    id: "diablerie",
    term: "Diablerie (Amaranth)",
    definition: "El acto supremo de canibalismo vampírico: drenar completamente de sangre a otro vampiro y consumir su alma. Quien la comete puede bajar su Generación y robar disciplinas, pero es considerado el mayor crimen en la sociedad vampírica.",
    related: ["Generación", "Humanidad"]
  },
  {
    id: "blood_bond",
    term: "Vínculo de Sangre (Vinculum)",
    definition: "La dependencia emocional antinatural y obsesión que se crea al beber la sangre de otro vampiro en tres ocasiones separadas. Es la herramienta principal de control de la Camarilla.",
    related: ["Vitae", "Ghoul", "Regente"]
  },
  {
    id: "resonance",
    term: "Resonancia (Resonance)",
    definition: "El sabor o matiz emocional de la sangre humana. Beber sangre de alguien furioso (Colérica) proporciona impulsos distintos a beber de alguien aterrorizado (Melancólica). Fortalece temporalmente ciertas Disciplinas.",
    related: ["Cacería", "Disfraz"]
  }
];