import { ClanEntry, LangCode } from "../types";

const en = (text: string): Record<LangCode, string> => ({
  en: text,
  es: "",
  pt: "",
  fr: "",
  de: "",
  it: ""
});

const trans = (enStr: string, esStr: string, ptStr: string, frStr: string, deStr: string, itStr: string): Record<LangCode, string> => ({
  en: enStr,
  es: esStr,
  pt: ptStr,
  fr: frStr,
  de: deStr,
  it: itStr
});

/**
 * Compact helper for short sect/affiliation labels. EN + ES are filled;
 * pt / fr / de / it fall back to EN via `getText` — same pattern used
 * for glossary terms. Sect labels are short enough that the parts that
 * actually translate ("Anarch" → "Anarquista", "Independent" →
 * "Independiente", "Unaligned" → "Sin facción") are written out here;
 * names that don't translate ("Camarilla", "Sabbat") are repeated
 * verbatim so the ES column is never empty (otherwise the i18n parity
 * tests we added in Batch B would not catch a future leak here).
 */
const sectLabel = (enStr: string, esStr: string): Record<LangCode, string> => ({
  en: enStr,
  es: esStr,
  pt: "",
  fr: "",
  de: "",
  it: ""
});

/**
 * Compact helper for clan body fields (summary, weakness, lore) where
 * EN and ES translations are both available but pt / fr / de / it are
 * still pending. The empty strings deliberately route those locales
 * through the `getLocalizedText` fallback chain so the UI shows the
 * EN content under a subtle "EN" pill rather than a placeholder.
 *
 * Batch G2 added Spanish translations for the seven most-viewed clans
 * (Brujah, Gangrel, Malkavian, Nosferatu, Ventrue, Tzimisce, Lasombra)
 * across summary / weakness / lore. All Spanish copy here is a short
 * app-safe paraphrase — no large rulebook excerpts.
 */
const enEs = (enStr: string, esStr: string): Record<LangCode, string> => ({
  en: enStr,
  es: esStr,
  pt: "",
  fr: "",
  de: "",
  it: ""
});

export const clans: ClanEntry[] = [
  {
    id: "brujah",
    name: en("Brujah"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    // Brujah sect by edition:
    //   - 1st / 2nd: Camarilla clan (Anarch Movement existed but was
    //     not yet a recognized sect-style faction).
    //   - Revised / V20: Camarilla with a strong Anarch presence.
    //   - V5: tilts Anarch-first with a Camarilla minority.
    // TODO(batch-g-clans): consider a 1ST/2ND override to drop the
    // "/ Anarch" half for those editions. Left as-is for now because
    // the Anarch Movement existed in those editions as an
    // intra-Camarilla faction, so the label is defensible.
    sect: sectLabel("Camarilla / Anarch", "Camarilla / Anarquista"),
    sectByEdition: {
      V5: sectLabel("Anarch / Camarilla", "Anarquista / Camarilla"),
    },
    summary: enEs(
      "Rebels, idealists, and fighters who champion causes both noble and chaotic. Historically they were philosopher-kings, but in modern nights they are known for their explosive temper.",
      "Rebeldes, idealistas y luchadores que defienden causas tanto nobles como caóticas. Antaño fueron reyes filósofos; en las noches modernas se les conoce por su temperamento explosivo.",
    ),
    weakness: enEs(
      "Violent Temper: Their beast is easily provoked. They have a higher difficulty resisting frenzy in any situation that provokes anger.",
      "Temperamento Violento: Su Bestia se enciende con facilidad. Sufren mayor dificultad para resistir el frenesí en situaciones que provoquen ira.",
    ),
    disciplines: ["celerity", "potence", "presence"],
    icon: "🔥",
    bannerImage: "/images/brujah.png",
    colorTheme: "#8B0000",
    lore: enEs(
      "The Brujah are a clan of passionate idealists and fierce rebels. In nights past, they were the philosopher-kings of Carthage, ruling openly alongside humanity. However, their utopia was destroyed by the Ventrue, a betrayal they have never forgotten or forgiven. Today, they are the most prominent supporters of the Anarch Movement, constantly fighting against the oppressive structure of the Camarilla and the elders who seek to control them.",
      "Los Brujah son un clan de idealistas apasionados y rebeldes feroces. En noches pasadas fueron los reyes filósofos de Cartago, gobernando abiertamente junto a la humanidad. Su utopía fue destruida por los Ventrue, una traición que jamás han olvidado ni perdonado. Hoy son los principales sostenedores del Movimiento Anarca, en lucha constante contra la estructura opresora de la Camarilla y los ancianos que buscan controlarlos.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "gangrel",
    name: en("Gangrel"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    // Per-edition sect (Batch G):
    //   - 1st / 2nd Edition: Gangrel were a Camarilla clan, period. The
    //     Independent / Anarch leaning didn't exist for them yet.
    //   - Revised onward: clan formally left the Camarilla; the modern
    //     "Independent / Anarch" label is correct.
    // The default below covers Revised / V20 / V5; the 1ST and 2ND
    // overrides restore the historically accurate Camarilla affiliation.
    sect: sectLabel("Independent / Anarch", "Independiente / Anarquista"),
    sectByEdition: {
      "1ST": sectLabel("Camarilla", "Camarilla"),
      "2ND": sectLabel("Camarilla", "Camarilla"),
    },
    summary: enEs(
      "Feral wanderers and shapeshifters who are closer to the Beast than any other clan.",
      "Errantes salvajes y cambiaformas, más cercanos a la Bestia que ningún otro clan.",
    ),
    weakness: enEs(
      "Animal Features: Every time a Gangrel frenzies, they gain an animalistic feature, which permanently reduces their Social attributes.",
      "Rasgos Animales: Cada vez que un Gangrel entra en frenesí adquiere un rasgo animal que reduce permanentemente sus atributos Sociales.",
    ),
    disciplines: ["animalism", "fortitude", "protean"],
    icon: "🐺",
    bannerImage: "/images/gangrel.png",
    colorTheme: "#556B2F",
    lore: enEs(
      "The Gangrel are wanderers, outcasts, and survivors who rarely stay in one domain for long. Unlike other vampires who cling to mortal society, the Gangrel embrace their monstrous nature, often dwelling in the wilderness where they commune with animals and the earth itself. They formally left the Camarilla shortly before the modern nights, choosing to forge their own paths independent of the sect's politics.",
      "Los Gangrel son errantes, parias y supervivientes que rara vez permanecen mucho tiempo en un mismo dominio. A diferencia de otros vampiros que se aferran a la sociedad mortal, abrazan su naturaleza monstruosa y suelen habitar los páramos salvajes, donde comulgan con los animales y la tierra. Abandonaron formalmente la Camarilla poco antes de las noches modernas para forjar su propio camino, ajenos a la política de la secta.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "malkavian",
    name: en("Malkavian"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: enEs(
      "Oracles, seers, and lunatics blessed (and cursed) with uncontrollable insights.",
      "Oráculos, videntes y lunáticos bendecidos —y maldecidos— con percepciones incontrolables.",
    ),
    weakness: enEs(
      "Affliction: Every Malkavian suffers from an incurable derangement or psychological condition that permanently alters their perception of reality.",
      "Aflicción: Todo Malkavian sufre un trastorno o condición psicológica incurable que altera de forma permanente su percepción de la realidad.",
    ),
    disciplines: ["auspex", "dominate", "obfuscate"],
    icon: "👁️",
    bannerImage: "/images/malkavian.png",
    colorTheme: "#4B0082",
    lore: enEs(
      "The Malkavians are a deeply fractured clan, bound together by the Madness Network (the Cobweb) that constantly feeds them whispers, visions, and shared hallucinations. Other Kindred view them as unpredictable lunatics or dangerous wildcards, but the Malkavians possess an undeniable connection to truth and prophecy that others cannot see. Their insights make them valuable to the Camarilla, even as their madness terrifies their allies.",
      "Los Malkavian son un clan profundamente fracturado, unido por la Red de la Locura (la Telaraña) que les susurra sin cesar visiones y alucinaciones compartidas. El resto de los Cainitas los tachan de locos impredecibles o comodines peligrosos, pero los Malkavian poseen una conexión innegable con la verdad y la profecía que los demás no pueden ver. Sus revelaciones los hacen valiosos para la Camarilla, aun cuando su locura aterre a sus propios aliados.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "nosferatu",
    name: en("Nosferatu"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: enEs(
      "Hideously deformed information brokers who rule the underground and the shadows.",
      "Intermediarios de información, deformes y monstruosos, que reinan en el subsuelo y las sombras.",
    ),
    weakness: enEs(
      "Hideous Appearance: The Embrace twists their bodies into monstrous forms. They automatically fail social rolls involving appearance or first impressions, and their existence is a walking masquerade breach.",
      "Apariencia Horrenda: El Abrazo deforma sus cuerpos hasta volverlos monstruosos. Fallan automáticamente las tiradas sociales que dependan de la apariencia o las primeras impresiones, y su sola presencia es una brecha andante de la Mascarada.",
    ),
    disciplines: ["animalism", "obfuscate", "potence"],
    icon: "🦇",
    bannerImage: "/images/nosferatu.png",
    colorTheme: "#2F4F4F",
    lore: enEs(
      "Forced to hide from mortal society due to their horrific visages, the Nosferatu dwell in sewers, crypts, and abandoned tunnels. They compensate for their inability to move openly by becoming the premier spies and information brokers of the Kindred world. What a Nosferatu knows can topple princes. Despite their monstrous appearance, they often display more humanity and camaraderie than the so-called 'beautiful' clans.",
      "Forzados a ocultarse de la sociedad mortal por su aspecto horrendo, los Nosferatu habitan alcantarillas, criptas y túneles abandonados. Compensan su incapacidad de moverse a la vista convirtiéndose en los principales espías y traficantes de información del mundo Cainita. Lo que sabe un Nosferatu puede derribar a un príncipe. Pese a su apariencia monstruosa, suelen mostrar más humanidad y camaradería que los clanes considerados «hermosos».",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "toreador",
    name: en("Toreador"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: en("Aesthetes, artists, and social manipulators addicted to beauty and sensation."),
    weakness: en("Aesthetic Fixation: When confronted with true beauty, they can become completely enraptured and incapacitated for hours, oblivious to their surroundings."),
    disciplines: ["auspex", "celerity", "presence"],
    icon: "🌹",
    bannerImage: "/images/toreador.png",
    colorTheme: "#C71585",
    lore: en("The Toreador consider themselves the connoisseurs of human passion, art, and beauty. They effortlessly navigate mortal high society, pulling the strings of cultural icons, politicians, and socialites. To a Toreador, unlife is a performance, and boredom is the true enemy. Their deep connection to human emotion allows them to feign life better than most, but their obsession with beauty can easily become a deadly distraction."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "tremere",
    name: en("Tremere"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: en("Secretive warlocks and scholars who stole immortality through dark blood magic."),
    weakness: en("Blood Defect: In earlier editions, they were easily bound to clan elders. In V5, their blood is too weak to blood bond other Kindred."),
    disciplines: ["auspex", "blood_sorcery", "dominate", "thaumaturgy"],
    icon: "🩸",
    bannerImage: "/images/tremere.png",
    colorTheme: "#800000",
    lore: en("Originally a cabal of mortal hermetic mages, the Tremere stole the Embrace in the Dark Ages to escape their fading magic. They quickly adapted, developing Blood Sorcery (Thaumaturgy) to defend themselves against enraged clans like the Tzimisce and Salubri. For centuries, the Tremere operated under a rigid, pyramidal hierarchy from Vienna. However, the destruction of the Prime Chantry in modern nights shattered the pyramid, leaving the clan fractured but fiercely independent."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "ventrue",
    name: en("Ventrue"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: enEs(
      "The self-proclaimed kings and aristocratic rulers of the vampiric hierarchy.",
      "Los autoproclamados reyes y gobernantes aristocráticos de la jerarquía vampírica.",
    ),
    weakness: enEs(
      "Rarefied Tastes: A Ventrue can only feed from a highly specific type of mortal (e.g., priests, virgins, bankers). They will vomit any other blood.",
      "Gustos Refinados: Un Ventrue solo puede alimentarse de un tipo muy concreto de mortal (sacerdotes, vírgenes, banqueros, etc.). Cualquier otra sangre la vomitará.",
    ),
    disciplines: ["dominate", "fortitude", "presence"],
    icon: "👑",
    bannerImage: "/images/ventrue.png",
    colorTheme: "#000080",
    lore: enEs(
      "The Ventrue believe they are destined to rule. Since the days of Rome and the formation of the Camarilla, they have been the undisputed leaders of Kindred society, shaping policy and enforcing the Masquerade. They embrace politicians, CEOs, military leaders, and aristocrats. While their arrogance makes them many enemies, their unparalleled discipline and power base make them difficult to overthrow. A Ventrue's word is law.",
      "Los Ventrue se creen destinados a gobernar. Desde los días de Roma y la fundación de la Camarilla han sido los líderes indiscutibles de la sociedad Cainita, dictando la política y haciendo cumplir la Mascarada. Abrazan a políticos, ejecutivos, líderes militares y aristócratas. Su arrogancia les granjea muchos enemigos, pero su disciplina sin par y su base de poder los hacen difíciles de derribar. La palabra de un Ventrue es ley.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "lasombra",
    name: en("Lasombra"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    // Per-edition sect (Batch G correction):
    //   - 1st / 2nd / Revised / V20: Lasombra are Sabbat. The mass
    //     defection into the Camarilla is a V5-era storyline.
    //   - V5: official Camarilla clan (with Sabbat holdouts in lore).
    // Previous default was "Sabbat / Camarilla" which read incorrectly
    // for every classic edition — Camarilla affiliation was V5-only.
    sect: sectLabel("Sabbat", "Sabbat"),
    sectByEdition: {
      V5: sectLabel("Camarilla", "Camarilla"),
    },
    summary: enEs(
      "Ruthless social Darwinists who manipulate shadows and dominate the church and state.",
      "Implacables darwinistas sociales que manipulan las sombras y dominan la iglesia y el estado.",
    ),
    weakness: enEs(
      "Defective Reflection: They cast no reflection in mirrors or modern recording devices, and modern technology actively glitches in their presence.",
      "Reflejo Defectuoso: No proyectan reflejo en espejos ni en dispositivos modernos de grabación, y la tecnología falla activamente en su presencia.",
    ),
    disciplines: ["dominate", "oblivion", "potence", "obtenebration"],
    icon: "🌑",
    bannerImage: "/images/lasombra.png",
    colorTheme: "#1A1A1A",
    lore: enEs(
      "Once the proud leaders of the Sabbat, the Lasombra are masters of manipulation who see the world purely in terms of power and control. They have historically controlled religious institutions and noble families, shaping them from the shadows. Following the Beckoning and internal schisms, a large portion of the clan defected to the Camarilla, seeking stability over the increasingly fanatical crusade of the Sabbat.",
      "Antiguos líderes orgullosos del Sabbat, los Lasombra son maestros de la manipulación que entienden el mundo solo en términos de poder y control. Históricamente han controlado instituciones religiosas y familias nobles, moldeándolas desde las sombras. Tras el Llamado y los cismas internos, una gran parte del clan desertó a la Camarilla, prefiriendo la estabilidad a la cruzada cada vez más fanática del Sabbat.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "tzimisce",
    name: en("Tzimisce"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    // Tzimisce sect history per edition:
    //   - 1st/2nd: Sabbat clan with Old Clan independents in Eastern
    //     Europe; "Sabbat / Independent" is the standard summary.
    //   - Revised/V20: same picture; the mixed label remains accurate.
    //   - V5: post-Sabbat dissolution they read as Independent/Anarch
    //     in many domains — captured in the override below.
    // TODO(batch-g-clans): if a future content pass wants to call out
    // the 1st-Edition Old Clan independents explicitly, add a 1ST
    // override here. Current label is broadly accurate.
    sect: sectLabel("Sabbat / Independent", "Sabbat / Independiente"),
    sectByEdition: {
      // V5: after the dissolution of the Sabbat in the official line, the
      // clan reads as an independent power that overlaps with the
      // Anarch Movement in many domains.
      V5: sectLabel("Anarch / Independent", "Anarquista / Independiente"),
    },
    summary: enEs(
      "Inhuman fleshcrafters and territorial tyrants who have forsaken their humanity.",
      "Modeladores de carne inhumanos y tiranos territoriales que han renunciado a su humanidad.",
    ),
    weakness: enEs(
      "Territorial Dependance: A Tzimisce must rest near earth from their birthplace or their domain. Failing to do so halves their dice pools.",
      "Dependencia Territorial: Un Tzimisce debe descansar cerca de tierra de su lugar de nacimiento o de su dominio. De no hacerlo, sus reservas de dados se reducen a la mitad.",
    ),
    disciplines: ["animalism", "auspex", "protean", "vicissitude"],
    icon: "🐉",
    bannerImage: "/opengraph.jpg",
    colorTheme: "#3E000F",
    lore: enEs(
      "The Fiends of Eastern Europe are perhaps the most terrifying of all clans. Masters of fleshcrafting (Vicissitude), they mold bone and muscle like clay, creating horrific war ghouls and modifying their own bodies into alien forms. As the spiritual heart of the Sabbat, they view the concept of humanity as a weakness to be purged, striving instead for spiritual and physical metamorphosis.",
      "Los Demonios de Europa del Este son quizá el clan más aterrador de todos. Maestros del moldeado de carne (Vicisitud), trabajan hueso y músculo como si fueran arcilla, creando espantosos ghouls de guerra y transformando sus propios cuerpos en formas ajenas a lo humano. Como corazón espiritual del Sabbat, ven la humanidad como una debilidad que purgar, persiguiendo en su lugar la metamorfosis espiritual y física.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "assamite",
    name: en("Assamite"),
    alternateNames: {
      "V5": en("Banu Haqim")
    },
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    // Per-edition sect (Batch G correction):
    //   - 1st / 2nd / Revised / V20: Independent clan (Alamut-aligned).
    //     Joining the Camarilla is a V5-era ("Banu Haqim") storyline.
    //   - V5: formally Camarilla.
    // Previous default was "Independent / Camarilla", which read
    // incorrectly for classic editions where the Camarilla half didn't
    // apply.
    sect: sectLabel("Independent", "Independiente"),
    sectByEdition: {
      V5: sectLabel("Camarilla", "Camarilla"),
    },
    summary: en("Assassins, judges, and scholars of the blood from the Middle East."),
    weakness: en("Blood Curse/Addiction: In earlier editions, they were cursed to take damage from Kindred blood. In V5, they have a terrible addiction to vampiric vitae."),
    disciplines: ["blood_sorcery", "celerity", "obfuscate", "quietus"],
    icon: "⚖️",
    bannerImage: "/images/banu-haquim.png",
    colorTheme: "#2E2B5F",
    lore: en("Historically an independent clan of assassins and viziers from Alamut, the Assamites exacted their own form of justice on the Kindred world. Known as the Banu Haqim in modern nights, a massive schism has split the clan. While the traditionalist warriors remain independent or join the Ashirra, a significant sect of judges and scholars have officially joined the Camarilla, offering their services as sheriffs and enforcers."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "followers_of_set",
    name: trans("Followers of Set", "Seguidores de Set", "Seguidores de Set", "Disciples de Seth", "Jünger des Set", "Seguaci di Set"),
    alternateNames: {
      "V5": trans("The Ministry", "El Ministerio", "O Ministério", "Le Ministère", "Das Ministerium", "Il Ministero")
    },
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent / Anarch", "Independiente / Anarquista"),
    sectByEdition: {
      // The Ministry, in V5, formally aligns with the Anarch Movement
      // after rejection by the Camarilla.
      V5: sectLabel("Anarch", "Anarquista"),
    },
    summary: en("Tempters, liberators, and religious zealots who seek to corrupt through vice."),
    weakness: en("Light Sensitivity: They suffer far greater damage from sunlight than other vampires, and bright lights cause physical pain and subtract from dice pools."),
    disciplines: ["obfuscate", "presence", "protean", "serpentis"],
    icon: "🐍",
    bannerImage: "/images/ministry.png",
    colorTheme: "#B8860B",
    lore: en("Traditionally an independent cult worshipping the dark god Set, they offer forbidden knowledge and earthly pleasures to ensnare mortals and Kindred alike. To them, corruption is a tool of spiritual liberation. Rebranding themselves as 'The Ministry' in modern nights, they have shifted their focus to a broader message of freedom and self-actualization, recently allying with the Anarch Movement after being rejected by the Camarilla."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "giovanni",
    name: en("Giovanni"),
    alternateNames: {
      "V5": en("Hecata")
    },
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent", "Independiente"),
    summary: en("A twisted, incestuous Venetian family of necromancers and merchants."),
    weakness: en("Painful Kiss: Their bite is excruciatingly painful, causing damage rather than the ecstatic pleasure associated with the vampiric Kiss."),
    disciplines: ["auspex", "fortitude", "oblivion", "necromancy"],
    icon: "💀",
    bannerImage: "/images/hecata.png",
    colorTheme: "#4A4A4A",
    lore: en("The Giovanni were unique among clans for exclusively Embracing within their mortal family, a wealthy Venetian merchant dynasty. They stole the power of Necromancy from the Cappadocians during the Renaissance. In recent times, devastating losses forced the Giovanni to merge with the remnants of the Cappadocians, Samedi, and other death-cults to form the Hecata—the united Clan of Death."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "ravnos",
    name: en("Ravnos"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent", "Independiente"),
    summary: en("Doomed wanderers, rogues, and masters of illusion from the East."),
    weakness: en("Doomed to Wander / Vice: If they sleep in the same place more than once, they risk burning. They also suffer from a specific criminal vice they must indulge."),
    disciplines: ["animalism", "obfuscate", "presence", "chimerstry", "fortitude"],
    icon: "🃏",
    bannerImage: "/images/ravnos.png",
    colorTheme: "#CD5C5C",
    lore: en("The Ravnos were a sprawling clan of wanderers, thieves, and tricksters with deep ties to the East and mastery over illusions (Chimerstry). Their numbers were absolutely decimated during the Week of Nightmares when their Antediluvian awakened in India and frenzied before being destroyed. Today, the Ravnos are a nearly extinct, tragic bloodline fleeing a constant, supernatural doom that hunts them if they ever stop running."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "salubri",
    name: en("Salubri"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent", "Independiente"),
    summary: en("A nearly extinct, three-eyed bloodline of hunted healers and soul-gazers."),
    weakness: en("Prey Exclusion: They can only feed from mortals who offer their blood willingly. Forcing the Kiss causes severe spiritual and physical backlash."),
    disciplines: ["auspex", "fortitude", "obfuscate"],
    icon: "👁️‍🗨️",
    bannerImage: "/images/salubri.png",
    colorTheme: "#F0E68C",
    lore: en("Once a respected clan of healers and holy warriors, the Salubri were driven to the brink of extinction by the Tremere, who usurped their Antediluvian and systematically branded them as soul-stealing infernalists. The few Salubri who remain exist in complete secrecy. Their most striking feature is a third eye that opens on their forehead whenever they use their unique disciplines."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "caitiff",
    name: en("Caitiff"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Anarch", "Anarquista"),
    sectByEdition: {
      // Caitiff have no fixed allegiance — they end up wherever a sect
      // is willing to overlook the lack of clan. The V5 default reads
      // as Unaligned; the classic-era default leans Anarch because the
      // Movement historically absorbed most Caitiff.
      V5: sectLabel("Unaligned", "Sin facción"),
    },
    summary: en("Clanless vampires abandoned by their sires, lacking the specific traits of any lineage."),
    weakness: en("Clanless: They have no clan weakness, but they also have no clan disciplines. They learn all disciplines at a higher experience cost and face severe social prejudice."),
    disciplines: [],
    icon: "🗑️",
    bannerImage: "/opengraph.jpg",
    colorTheme: "#888888",
    lore: en("Caitiff are the clanless trash of Kindred society. Whether they were abandoned by their sires before learning their heritage, or whether the Blood simply failed to transmit a clan's curse and gifts, the Caitiff belong nowhere. The Camarilla treats them as second-class citizens or immediate Masquerade threats, pushing the vast majority of Caitiff into the welcoming arms of the Anarchs."),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "thin_blood",
    name: trans("Thin-Blood", "Sangre Débil", "Sangue-Fraco", "Sang-Clair", "Dünnblütige", "Sangue Debole"),
    alternateNames: {
      "V5": trans("Thin-Blood", "Sangre Débil", "Sangue-Fraco", "Sang-Clair", "Dünnblütige", "Sangue Debole")
    },
    editionAvailability: ["REVISED", "V20", "V5"],
    sect: sectLabel("Anarch / Independent", "Anarquista / Independiente"),
    sectByEdition: {
      // Thin-Bloods rarely sit cleanly inside any sect. In V5 the most
      // honest answer at the card level is Unaligned; the classic
      // default keeps the previous lean.
      V5: sectLabel("Unaligned", "Sin facción"),
    },
    summary: en("Vampires of the 14th, 15th, and 16th generations whose blood is too weak to sustain full undeath."),
    weakness: en("Duskborn: They cannot blood bond, sire childer easily, or heal like normal vampires. However, they can walk in the daylight and consume human food."),
    disciplines: ["thin_blood_alchemy"],
    icon: "🩸💧",
    bannerImage: "/opengraph.jpg",
    colorTheme: "#5C5C5C",
    lore: en("The Thin-Bloods are the ultimate heralds of Gehenna. Born of generations so far removed from Caine that they are barely vampires, they exist in a twilight state between life and undeath. They are hunted mercilessly by the Camarilla and the Sabbat, forcing them to hide in the fringes of society. In modern nights, they have developed Thin-Blood Alchemy, using their mixed blood to replicate powers they cannot naturally learn."),
    playableStatus: { "REVISED": false, "V20": true, "V5": true },
    sourceEdition: "REVISED"
  }
];
