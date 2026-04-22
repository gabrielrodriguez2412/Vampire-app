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
      es: "Los Brujah son rebeldes, idealistas y luchadores que defienden causas nobles y caóticas. Históricamente fueron reyes filósofos, pero en las noches modernas son más conocidos por su temperamento explosivo y su tendencia a la subversión de las estructuras de poder.",
      en: "The Brujah are rebels, idealists, and fighters who champion causes both noble and chaotic. Historically they were philosopher-kings, but in modern nights they are better known for their explosive temper and their tendency to subvert power structures.",
      pt: "", fr: "", de: "", it: ""
    },
    identity: {
      es: "La Chusma, Idealistas, Filósofos",
      en: "The Rabble, Idealists, Philosophers",
      pt: "", fr: "", de: "", it: ""
    },
    weakness: {
      es: "Temperamento violento: Su bestia es provocada fácilmente. Tienen mayor dificultad para resistir el frenesí en cualquier situación que provoque ira.",
      en: "Violent Temper: Their beast is easily provoked. They have a higher difficulty resisting frenzy in any situation that provokes anger.",
      pt: "", fr: "", de: "", it: ""
    },
    disciplines: ["celerity", "potence", "presence"],
    playstyle: {
      es: "Agresivo, social e imponente físicamente. Excelentes para liderar movimientos de masas o en combate directo.",
      en: "Aggressive, social, and physically imposing. Excellent at leading mass movements or in direct combat.",
      pt: "", fr: "", de: "", it: ""
    },
    roleplayIdeas: {
      es: ["Un rockero punk antiautoritario.", "Un excapitán de debate convertido en activista.", "Un veterano desilusionado de un conflicto reciente.", "Un sindicalista radical.", "Un líder estudiantil extremista."],
      en: ["An anti-authoritarian punk rocker.", "A former debate team captain turned activist.", "A disillusioned veteran of a recent conflict.", "A radical union leader.", "An extremist student leader."],
      pt: [], fr: [], de: [], it: []
    },
    relationships: {
      es: "Desconfían de los Ventrue, se relacionan con los Gangrel por su mentalidad de forasteros. Odian a los Tremere por rencores ancestrales.",
      en: "Distrust Ventrue, relate to Gangrel due to their outsider mentality. Hate Tremere due to ancient grudges.",
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
    description: {
      es: "Horriblemente deformados por el Abrazo, los Nosferatu se ven obligados a esconderse en las sombras y las cloacas. Se han convertido en los principales corredores de información y espías de la Estirpe, sabiendo más de los secretos de la ciudad que cualquier otro clan.",
      en: "Horrifically deformed by the Embrace, the Nosferatu are forced to hide in the shadows and sewers. They have become the premier information brokers and spies of the Kindred, knowing more of the city's secrets than any other clan.",
      pt: "", fr: "", de: "", it: ""
    },
    identity: {
      es: "Ratas de Alcantarilla, Corredores de Información",
      en: "Sewer Rats, Information Brokers",
      pt: "", fr: "", de: "", it: ""
    },
    weakness: {
      es: "Apariencia Hedionda: Su apariencia es repulsiva para los mortales y la Estirpe por igual. Automáticamente fallan las tiradas sociales que involucren apariencia o primeras impresiones.",
      en: "Hideous Appearance: Their appearance is repulsive to mortals and Kindred alike. They automatically fail social rolls involving appearance or first impressions.",
      pt: "", fr: "", de: "", it: ""
    },
    disciplines: ["animalism", "obfuscate", "potence"],
    playstyle: {
      es: "Sigiloso, investigativo, enfocado en recopilar y vender información. Fuertes aliados en las sombras.",
      en: "Stealthy, investigative, focused on gathering and selling information. Strong allies in the shadows.",
      pt: "", fr: "", de: "", it: ""
    },
    roleplayIdeas: {
      es: ["Un hacker que opera desde túneles abandonados.", "Un antiguo mendigo que ahora controla una red de espías.", "Un monstruo trágico que protege a los marginados.", "Un recolector de secretos corporativos."],
      en: ["A hacker who operates from abandoned tunnels.", "A former beggar who now controls a spy network.", "A tragic monster who protects the marginalized.", "A collector of corporate secrets."],
      pt: [], fr: [], de: [], it: []
    },
    relationships: {
      es: "Comercian con todos pero confían en pocos. Mantienen relaciones pragmáticas con los Tremere.",
      en: "Trade with all but trust few. Maintain pragmatic relationships with Tremere.",
      pt: "", fr: "", de: "", it: ""
    },
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
    description: {
      es: "Hechiceros de sangre secretos y usurpadores, los Tremere son un clan de eruditos y ocultistas. Robaron la inmortalidad a través de la magia y desde entonces han luchado por asegurar su posición en la Camarilla con sus poderes esotéricos inigualables.",
      en: "Secretive blood sorcerers and usurpers, the Tremere are a clan of scholars and occultists. They stole immortality through magic and have since fought to secure their position in the Camarilla with their unparalleled esoteric powers.",
      pt: "", fr: "", de: "", it: ""
    },
    identity: {
      es: "Brujos, Usurpadores",
      en: "Warlocks, Usurpers",
      pt: "", fr: "", de: "", it: ""
    },
    weakness: {
      es: "Sangre Deficiente / Vínculo Sanguíneo: En V5, su sangre ya no puede vincular a otros vástagos. En ediciones anteriores, estaban fácilmente vinculados a los ancianos de su clan.",
      en: "Deficient Blood / Blood Bond: In V5, their blood can no longer blood bond other Kindred. In earlier editions, they were easily bound to the elders of their clan.",
      pt: "", fr: "", de: "", it: ""
    },
    disciplines: ["auspex", "blood_sorcery", "dominate"],
    playstyle: {
      es: "Místico, académico, centrado en el control, el ocultismo y la magia ritual. Poderosos pero a menudo desconfiados.",
      en: "Mystical, academic, focused on control, the occult, and ritual magic. Powerful but often distrusted.",
      pt: "", fr: "", de: "", it: ""
    },
    roleplayIdeas: {
      es: ["Un anticuario ocultista.", "Un ex profesor universitario despedido por prácticas poco éticas.", "Un investigador corporativo sin escrúpulos.", "Un mago hermético obsesionado con el poder."],
      en: ["An occult antiquarian.", "A former university professor fired for unethical practices.", "An unscrupulous corporate researcher.", "An hermetic mage obsessed with power."],
      pt: [], fr: [], de: [], it: []
    },
    relationships: {
      es: "Rivales de los Ventrue por la influencia en la Camarilla. Odiados por los Salubri y los Gangrel.",
      en: "Rivals of the Ventrue for influence in the Camarilla. Hated by the Salubri and Gangrel.",
      pt: "", fr: "", de: "", it: ""
    },
    color: "#800000",
    icon: "🩸"
  },
  {
    id: "ventrue",
    editions: ["v1", "v2", "revised", "v20", "v5"],
    type: "clan",
    name: fallbackStr("Ventrue"),
    description: {
      es: "Los gobernantes autoproclamados de la Estirpe, los Ventrue han reclamado la cima de la jerarquía vampírica durante milenios. Se mueven en los círculos de la alta sociedad, las finanzas y el poder corporativo, exigiendo respeto y sumisión.",
      en: "The self-proclaimed rulers of the Kindred, the Ventrue have claimed the top of the vampiric hierarchy for millennia. They move in the circles of high society, finance, and corporate power, demanding respect and submission.",
      pt: "", fr: "", de: "", it: ""
    },
    identity: {
      es: "Sangres Azules, Tiranos",
      en: "Blue Bloods, Tyrants",
      pt: "", fr: "", de: "", it: ""
    },
    weakness: {
      es: "Gustos Exquisitos: Los Ventrue solo pueden alimentarse de un tipo específico de mortal (por ejemplo, sacerdotes, vírgenes, banqueros) y vomitarán cualquier otra sangre.",
      en: "Rarefied Tastes: Ventrue can only feed from a specific type of mortal (e.g., priests, virgins, bankers) and will vomit any other blood.",
      pt: "", fr: "", de: "", it: ""
    },
    disciplines: ["dominate", "fortitude", "presence"],
    playstyle: {
      es: "Líderes natos, imponentes, resistentes y centrados en controlar mentes e instituciones mortales.",
      en: "Born leaders, commanding, resilient, and focused on controlling mortal minds and institutions.",
      pt: "", fr: "", de: "", it: ""
    },
    roleplayIdeas: {
      es: ["Un implacable saqueador corporativo.", "Un político carismático con una agenda oculta.", "Un viejo aristócrata aferrado a su legado.", "Un jefe del crimen organizado con modales exquisitos."],
      en: ["A ruthless corporate raider.", "A charismatic politician with a hidden agenda.", "An old aristocrat clinging to their legacy.", "An organized crime boss with exquisite manners."],
      pt: [], fr: [], de: [], it: []
    },
    relationships: {
      es: "Gobiernan la Camarilla. Esperan obediencia de los Toreador y compiten con los Tremere.",
      en: "Rule the Camarilla. Expect obedience from the Toreador and compete with Tremere.",
      pt: "", fr: "", de: "", it: ""
    },
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
