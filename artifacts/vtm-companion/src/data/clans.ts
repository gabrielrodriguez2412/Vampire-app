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
    summary: enEs(
      "Aesthetes, artists, and social manipulators addicted to beauty and sensation.",
      "Estetas, artistas y manipuladores sociales adictos a la belleza y la sensación.",
    ),
    weakness: enEs(
      "Aesthetic Fixation: When confronted with true beauty, they can become completely enraptured and incapacitated for hours, oblivious to their surroundings.",
      "Fijación Estética: Ante la verdadera belleza pueden quedar completamente embelesados e incapacitados durante horas, ajenos a cuanto les rodea.",
    ),
    disciplines: ["auspex", "celerity", "presence"],
    icon: "🌹",
    bannerImage: "/images/toreador.png",
    colorTheme: "#C71585",
    lore: enEs(
      "The Toreador consider themselves the connoisseurs of human passion, art, and beauty. They effortlessly navigate mortal high society, pulling the strings of cultural icons, politicians, and socialites. To a Toreador, unlife is a performance, and boredom is the true enemy. Their deep connection to human emotion allows them to feign life better than most, but their obsession with beauty can easily become a deadly distraction.",
      "Los Toreador se consideran a sí mismos los expertos en pasión, arte y belleza humanas. Se mueven con soltura por la alta sociedad mortal, manejando los hilos de íconos culturales, políticos y figuras de élite. Para un Toreador, la no-vida es una representación y el aburrimiento es el verdadero enemigo. Su profunda conexión con la emoción humana les permite fingir la vida mejor que la mayoría, pero su obsesión con la belleza puede convertirse fácilmente en una distracción mortal.",
    ),
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "tremere",
    name: en("Tremere"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Camarilla", "Camarilla"),
    summary: enEs(
      "Secretive warlocks and scholars who stole immortality through dark blood magic.",
      "Brujos secretos y eruditos que robaron la inmortalidad mediante oscura magia de sangre.",
    ),
    // Batch T: split the mixed-edition Tremere weakness into two
    // edition-specific paragraphs. The flat `weakness` stays as the
    // generic default for search / i18n parity tests; the V20 and V5
    // overrides each tell the user only about the bane that applies
    // to the active edition.
    weakness: enEs(
      "Blood Defect tied to the clan's bond with its elders and its own vitae.",
      "Defecto de Sangre vinculado al lazo con los ancianos del clan y a su propia vitae.",
    ),
    weaknessByEdition: {
      "1ST":     enEs(
        "Blood Defect: They are easily blood bound to other Kindred — especially their own clan elders, who exploit this to keep the pyramid in line.",
        "Defecto de Sangre: se vinculan con facilidad a otros Cainitas, en especial a los ancianos de su propio clan, que aprovechan esto para mantener la pirámide bajo control.",
      ),
      "2ND":     enEs(
        "Blood Defect: They are easily blood bound to other Kindred — especially their own clan elders, who exploit this to keep the pyramid in line.",
        "Defecto de Sangre: se vinculan con facilidad a otros Cainitas, en especial a los ancianos de su propio clan, que aprovechan esto para mantener la pirámide bajo control.",
      ),
      "REVISED": enEs(
        "Blood Defect: They are easily blood bound to other Kindred — especially their own clan elders, who exploit this to keep the pyramid in line.",
        "Defecto de Sangre: se vinculan con facilidad a otros Cainitas, en especial a los ancianos de su propio clan, que aprovechan esto para mantener la pirámide bajo control.",
      ),
      "V20":     enEs(
        "Blood Defect: They are easily blood bound to other Kindred — especially their own clan elders, who exploit this to keep the pyramid in line.",
        "Defecto de Sangre: se vinculan con facilidad a otros Cainitas, en especial a los ancianos de su propio clan, que aprovechan esto para mantener la pirámide bajo control.",
      ),
      "V5":      enEs(
        "Deficient Blood: Their vitae is too thin to forge a blood bond with another Kindred, and feeding their own ghouls demands extra effort.",
        "Sangre Deficiente: su vitae es demasiado débil para forjar un vínculo de sangre con otro Cainita, y alimentar a sus propios ghouls exige un esfuerzo adicional.",
      ),
    },
    disciplines: ["auspex", "blood_sorcery", "dominate", "thaumaturgy"],
    icon: "🩸",
    bannerImage: "/images/tremere.png",
    colorTheme: "#800000",
    lore: enEs(
      "Originally a cabal of mortal hermetic mages, the Tremere stole the Embrace in the Dark Ages to escape their fading magic. They adapted quickly, developing Thaumaturgy to defend themselves against enraged clans like the Tzimisce and Salubri, and operated for centuries under a rigid, pyramidal hierarchy from Vienna.",
      "Originalmente una cábala de magos herméticos mortales, los Tremere robaron el Abrazo en la Edad Oscura para huir de su magia menguante. Se adaptaron con rapidez y desarrollaron la Taumaturgia para defenderse de clanes enfurecidos como los Tzimisce y los Salubri, y operaron durante siglos bajo una rígida jerarquía piramidal desde Viena.",
    ),
    // Batch T: V20 keeps the classic Vienna-pyramid framing; V5
    // narrates the post-Gehenna shattering of the Pyramid and the
    // rebrand under the Camarilla. Each edition reads as its own
    // standalone story.
    loreByEdition: {
      "V5": enEs(
        "Once a cabal of hermetic mages who stole the Embrace in the Dark Ages, the Tremere built an iron pyramid of Thaumaturgy from Vienna. The destruction of the Prime Chantry and the loss of Tremere himself shattered that hierarchy; the clan now operates as a fractured but fiercely independent Camarilla pillar, with House Carna openly breaking away.",
        "Antaño una cábala de magos herméticos que robó el Abrazo en la Edad Oscura, los Tremere levantaron una pirámide férrea de Taumaturgia desde Viena. La destrucción de la Sede Principal y la pérdida del propio Tremere quebraron esa jerarquía; el clan opera ahora como un pilar fracturado pero ferozmente independiente de la Camarilla, con la Casa Carna escindiéndose abiertamente.",
      ),
    },
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
    // Batch S: V20 Tzimisce have Animalism / Auspex / Vicissitude;
    // V5 swapped Auspex out for Dominate and replaced Vicissitude with
    // a Protean variant. Protean was already on the union list;
    // Dominate was missing for V5.
    disciplines: ["animalism", "auspex", "dominate", "protean", "vicissitude"],
    disciplinesByEdition: {
      "1ST":     ["animalism", "auspex", "vicissitude"],
      "2ND":     ["animalism", "auspex", "vicissitude"],
      "REVISED": ["animalism", "auspex", "vicissitude"],
      "V20":     ["animalism", "auspex", "vicissitude"],
      "V5":      ["animalism", "dominate", "protean"],
    },
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
    // Batch P: classic-edition Spanish UI used to show "Assamite" (the
    // English spelling) because the data record only filled `en`. The
    // disciplines page calls `getClanDisplayName(clan, edition, lang)`
    // which uses `alternateNames[edition]` first (so V5 ES → "Banu
    // Haqim") and otherwise falls back to `name`. Adding `es:
    // "Assamita"` here gives the classic-edition Spanish UI its
    // canonical Spanish form without affecting V5 (still routed
    // through `alternateNames.V5` → "Banu Haqim"). Other locales fall
    // through to the English proper noun via the existing `getText`
    // chain.
    name: enEs("Assamite", "Assamita"),
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
    summary: enEs(
      "Assassins, judges, and scholars of the blood from the Middle East.",
      "Asesinos, jueces y eruditos de la sangre procedentes de Medio Oriente.",
    ),
    // Batch T: weakness was one of the most obvious mixed-edition
    // paragraphs in the data — it literally explained both editions
    // in the same sentence. The flat field now carries a neutral
    // summary; each edition's override gives the user only the bane
    // that applies to them.
    weakness: enEs(
      "A blood-borne curse from the clan's founder shapes how they drink.",
      "Una maldición ligada a la sangre del fundador del clan condiciona la forma en que se alimentan.",
    ),
    weaknessByEdition: {
      "1ST":     enEs(
        "Blood Curse: They suffer aggravated damage whenever they try to drink Kindred vitae, enforcing the founder's prohibition on diablerie among their own kind.",
        "Maldición de Sangre: sufren daño agravado al intentar beber vitae Cainita, lo que refuerza la prohibición del fundador de practicar diablerie entre los suyos.",
      ),
      "2ND":     enEs(
        "Blood Curse: They suffer aggravated damage whenever they try to drink Kindred vitae, enforcing the founder's prohibition on diablerie among their own kind.",
        "Maldición de Sangre: sufren daño agravado al intentar beber vitae Cainita, lo que refuerza la prohibición del fundador de practicar diablerie entre los suyos.",
      ),
      "REVISED": enEs(
        "Blood Curse: They suffer aggravated damage whenever they try to drink Kindred vitae, enforcing the founder's prohibition on diablerie among their own kind.",
        "Maldición de Sangre: sufren daño agravado al intentar beber vitae Cainita, lo que refuerza la prohibición del fundador de practicar diablerie entre los suyos.",
      ),
      "V20":     enEs(
        "Blood Curse: They suffer aggravated damage whenever they try to drink Kindred vitae, enforcing the founder's prohibition on diablerie among their own kind.",
        "Maldición de Sangre: sufren daño agravado al intentar beber vitae Cainita, lo que refuerza la prohibición del fundador de practicar diablerie entre los suyos.",
      ),
      "V5":      enEs(
        "Blood Addiction: Drinking Kindred vitae triggers a powerful compulsion to keep feeding from the same victim, risking exposure and turning judges into hunters.",
        "Adicción a la Sangre: beber vitae Cainita desencadena una compulsión intensa de seguir alimentándose del mismo donante, arriesgando la exposición y convirtiendo a los jueces en cazadores.",
      ),
    },
    disciplines: ["blood_sorcery", "celerity", "obfuscate", "quietus"],
    icon: "⚖️",
    bannerImage: "/images/banu-haquim.png",
    colorTheme: "#2E2B5F",
    lore: enEs(
      "An independent clan of assassins and viziers descended from a founder who once judged the Kindred world. Their stronghold at Alamut shaped a culture of contracts, secret schools, and ruthless discipline; their leadership and very name shift across the eras.",
      "Un clan independiente de asesinos y visires descendientes de un fundador que en su día juzgó al mundo Cainita. Su fortaleza en Alamut moldeó una cultura de contratos, escuelas secretas y disciplina implacable; su liderazgo y su propio nombre cambian de era en era.",
    ),
    // Batch T: V20 talks about the Assamites of Alamut and their
    // Independent stance; V5 picks up after the schism and rebrand,
    // with the judge faction joining the Camarilla under the Banu
    // Haqim name. Each version reads without mentioning the other.
    loreByEdition: {
      "1ST":     enEs(
        "An independent clan of assassins and viziers from Alamut, the Assamites act as judges of the Kindred world. Their pyramidal hierarchy of warriors, sorcerers, and viziers answers only to the eldest in their mountain fortress; outside the clan they sell their blades and rarely their loyalty.",
        "Un clan independiente de asesinos y visires de Alamut. Los Asamitas actúan como jueces del mundo Cainita: su jerarquía piramidal de guerreros, hechiceros y visires responde solo al más anciano en la fortaleza de la montaña, y fuera del clan venden sus hojas y rara vez su lealtad.",
      ),
      "2ND":     enEs(
        "An independent clan of assassins and viziers from Alamut, the Assamites act as judges of the Kindred world. Their pyramidal hierarchy of warriors, sorcerers, and viziers answers only to the eldest in their mountain fortress; outside the clan they sell their blades and rarely their loyalty.",
        "Un clan independiente de asesinos y visires de Alamut. Los Asamitas actúan como jueces del mundo Cainita: su jerarquía piramidal de guerreros, hechiceros y visires responde solo al más anciano en la fortaleza de la montaña, y fuera del clan venden sus hojas y rara vez su lealtad.",
      ),
      "REVISED": enEs(
        "An independent clan of assassins and viziers from Alamut, the Assamites act as judges of the Kindred world. Their pyramidal hierarchy of warriors, sorcerers, and viziers answers only to the eldest in their mountain fortress; outside the clan they sell their blades and rarely their loyalty.",
        "Un clan independiente de asesinos y visires de Alamut. Los Asamitas actúan como jueces del mundo Cainita: su jerarquía piramidal de guerreros, hechiceros y visires responde solo al más anciano en la fortaleza de la montaña, y fuera del clan venden sus hojas y rara vez su lealtad.",
      ),
      "V20":     enEs(
        "An independent clan of assassins and viziers from Alamut, the Assamites act as judges of the Kindred world. Their pyramidal hierarchy of warriors, sorcerers, and viziers answers only to the eldest in their mountain fortress; outside the clan they sell their blades and rarely their loyalty.",
        "Un clan independiente de asesinos y visires de Alamut. Los Asamitas actúan como jueces del mundo Cainita: su jerarquía piramidal de guerreros, hechiceros y visires responde solo al más anciano en la fortaleza de la montaña, y fuera del clan venden sus hojas y rara vez su lealtad.",
      ),
      "V5": enEs(
        "After a schism that split the warriors from the judges, the clan now calls itself Banu Haqim. The judge faction has formally joined the Camarilla as sheriffs and enforcers of the Traditions, while the traditionalist warriors keep to Alamut and the Ashirra. A blood addiction shadows them either way.",
        "Tras un cisma que separó a los guerreros de los jueces, el clan se llama ahora Banu Haqim. La facción de los jueces se ha sumado formalmente a la Camarilla como sheriffs y ejecutores de las Tradiciones, mientras los guerreros tradicionalistas siguen ligados a Alamut y a los Ashirra. En cualquier caso, una adicción a la sangre los acompaña.",
      ),
    },
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
    summary: enEs(
      "Tempters, liberators, and religious zealots who seek to corrupt through vice.",
      "Tentadores, liberadores y fanáticos religiosos que buscan corromper mediante el vicio.",
    ),
    weakness: enEs(
      "Light Sensitivity: They suffer far greater damage from sunlight than other vampires, and bright lights cause physical pain and subtract from dice pools.",
      "Sensibilidad a la Luz: Sufren un daño mucho mayor por la luz solar que otros vampiros, y las luces brillantes les provocan dolor físico y restan dados a sus reservas.",
    ),
    // Batch S: V20 Followers of Set have Obfuscate / Presence /
    // Serpentis (no Protean); the V5 rebrand to The Ministry replaced
    // Serpentis with Protean. Serpentis is already classic-only via
    // its `editions`, but Protean is universal and was leaking into
    // V20 — `disciplinesByEdition` scopes both correctly.
    disciplines: ["obfuscate", "presence", "protean", "serpentis"],
    disciplinesByEdition: {
      "1ST":     ["obfuscate", "presence", "serpentis"],
      "2ND":     ["obfuscate", "presence", "serpentis"],
      "REVISED": ["obfuscate", "presence", "serpentis"],
      "V20":     ["obfuscate", "presence", "serpentis"],
      "V5":      ["obfuscate", "presence", "protean"],
    },
    icon: "🐍",
    bannerImage: "/images/ministry.png",
    colorTheme: "#B8860B",
    lore: enEs(
      "An ancient cult devoted to the dark god Set, they offer forbidden knowledge and earthly pleasures to ensnare mortals and Kindred alike. To them, corruption is a tool of spiritual liberation, and every favour they grant carries a hook.",
      "Un antiguo culto consagrado al dios oscuro Set, ofrecen conocimiento prohibido y placeres terrenales para atrapar a mortales y Cainitas por igual. Para ellos la corrupción es una herramienta de liberación espiritual, y todo favor que conceden lleva un anzuelo.",
    ),
    // Batch T: V20 narrates the Followers of Set as the Independent
    // serpent cult; V5 picks up the rebrand to The Ministry and the
    // alliance with the Anarchs. Each edition reads as its own
    // standalone narrative — no cross-edition references.
    loreByEdition: {
      "1ST":     enEs(
        "Independent worshippers of the dark god Set, the Followers of Set run temples disguised as nightclubs, brothels, and apothecaries from the Mediterranean to the New World. They trade in forbidden pleasures and forbidden knowledge, viewing each corrupted soul as a small victory over their enemies.",
        "Adoradores independientes del dios oscuro Set, los Seguidores de Set regentan templos camuflados como discotecas, burdeles y boticas desde el Mediterráneo hasta el Nuevo Mundo. Trafican con placeres y conocimientos prohibidos, y ven cada alma corrompida como una pequeña victoria sobre sus enemigos.",
      ),
      "2ND":     enEs(
        "Independent worshippers of the dark god Set, the Followers of Set run temples disguised as nightclubs, brothels, and apothecaries from the Mediterranean to the New World. They trade in forbidden pleasures and forbidden knowledge, viewing each corrupted soul as a small victory over their enemies.",
        "Adoradores independientes del dios oscuro Set, los Seguidores de Set regentan templos camuflados como discotecas, burdeles y boticas desde el Mediterráneo hasta el Nuevo Mundo. Trafican con placeres y conocimientos prohibidos, y ven cada alma corrompida como una pequeña victoria sobre sus enemigos.",
      ),
      "REVISED": enEs(
        "Independent worshippers of the dark god Set, the Followers of Set run temples disguised as nightclubs, brothels, and apothecaries from the Mediterranean to the New World. They trade in forbidden pleasures and forbidden knowledge, viewing each corrupted soul as a small victory over their enemies.",
        "Adoradores independientes del dios oscuro Set, los Seguidores de Set regentan templos camuflados como discotecas, burdeles y boticas desde el Mediterráneo hasta el Nuevo Mundo. Trafican con placeres y conocimientos prohibidos, y ven cada alma corrompida como una pequeña victoria sobre sus enemigos.",
      ),
      "V20":     enEs(
        "Independent worshippers of the dark god Set, the Followers of Set run temples disguised as nightclubs, brothels, and apothecaries from the Mediterranean to the New World. They trade in forbidden pleasures and forbidden knowledge, viewing each corrupted soul as a small victory over their enemies.",
        "Adoradores independientes del dios oscuro Set, los Seguidores de Set regentan templos camuflados como discotecas, burdeles y boticas desde el Mediterráneo hasta el Nuevo Mundo. Trafican con placeres y conocimientos prohibidos, y ven cada alma corrompida como una pequeña victoria sobre sus enemigos.",
      ),
      "V5": enEs(
        "Rebranded as The Ministry, the clan now speaks of liberation and self-actualisation rather than open Setite worship. Pushed aside by the Camarilla, they have allied with the Anarch Movement, recruiting the disaffected in clubs, recovery groups, and street pulpits — every promise of freedom a quiet contract.",
        "Rebautizados como El Ministerio, el clan ahora habla de liberación y autorrealización antes que de adoración abierta a Set. Apartados por la Camarilla, se han aliado con el Movimiento Anarca y reclutan a los descontentos en clubes, grupos de recuperación y púlpitos callejeros: toda promesa de libertad es un contrato silencioso.",
      ),
    },
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
    summary: enEs(
      "A twisted, incestuous Venetian family of necromancers and merchants.",
      "Una retorcida familia veneciana, incestuosa, de nigromantes y mercaderes.",
    ),
    weakness: enEs(
      "Painful Kiss: Their bite is excruciatingly painful, causing damage rather than the ecstatic pleasure associated with the vampiric Kiss.",
      "Beso Doloroso: Su mordisco es atrozmente doloroso y causa daño en lugar del placer extático asociado al Beso vampírico.",
    ),
    // Batch S: V20 Giovanni and V5 Hecata have completely different
    // discipline trios (Dominate/Necromancy/Potence vs.
    // Auspex/Fortitude/Oblivion) — none of the swapped disciplines are
    // themselves edition-scoped, so the natural `discipline.editions`
    // filter alone cannot route them correctly. `disciplinesByEdition`
    // gives each edition its own authoritative list, and the union flat
    // `disciplines` array below carries every entry for cross-references
    // (search index, validation, and the `clansWhoUse` consistency test).
    disciplines: ["auspex", "dominate", "fortitude", "necromancy", "oblivion", "potence"],
    disciplinesByEdition: {
      "1ST":     ["dominate", "necromancy", "potence"],
      "2ND":     ["dominate", "necromancy", "potence"],
      "REVISED": ["dominate", "necromancy", "potence"],
      "V20":     ["dominate", "necromancy", "potence"],
      "V5":      ["auspex", "fortitude", "oblivion"],
    },
    icon: "💀",
    bannerImage: "/images/hecata.png",
    colorTheme: "#4A4A4A",
    lore: enEs(
      "A merchant-dynasty of necromancers who walk the line between the living and the dead. Their wealth, their command of ghosts, and their willingness to traffic in either currency keep them at the centre of every deal that requires absolute silence.",
      "Una dinastía mercantil de nigromantes que camina la línea entre los vivos y los muertos. Su riqueza, su dominio sobre los fantasmas y su disposición a comerciar con cualquiera de ambas monedas los mantiene en el centro de todo trato que exija silencio absoluto.",
    ),
    // Batch T: V20 follows the Giovanni — the Venetian merchant
    // family that stole Necromancy from the Cappadocians. V5 picks
    // up after the Hecata fusion. Each version stays in its own
    // edition.
    loreByEdition: {
      "1ST":     enEs(
        "The Giovanni are unique among clans for Embracing almost exclusively within their mortal family, a wealthy Venetian merchant dynasty. They stole the power of Necromancy from the Cappadocians during the Renaissance and have used it — alongside their fortune — to broker influence across both the living world and the lands of the dead.",
        "Los Giovanni son únicos entre los clanes por Abrazar casi exclusivamente dentro de su familia mortal, una rica dinastía de mercaderes venecianos. Robaron el poder de la Nigromancia a los Cappadocianos durante el Renacimiento y lo han usado — junto a su fortuna — para tejer influencia tanto en el mundo de los vivos como en las tierras de los muertos.",
      ),
      "2ND":     enEs(
        "The Giovanni are unique among clans for Embracing almost exclusively within their mortal family, a wealthy Venetian merchant dynasty. They stole the power of Necromancy from the Cappadocians during the Renaissance and have used it — alongside their fortune — to broker influence across both the living world and the lands of the dead.",
        "Los Giovanni son únicos entre los clanes por Abrazar casi exclusivamente dentro de su familia mortal, una rica dinastía de mercaderes venecianos. Robaron el poder de la Nigromancia a los Cappadocianos durante el Renacimiento y lo han usado — junto a su fortuna — para tejer influencia tanto en el mundo de los vivos como en las tierras de los muertos.",
      ),
      "REVISED": enEs(
        "The Giovanni are unique among clans for Embracing almost exclusively within their mortal family, a wealthy Venetian merchant dynasty. They stole the power of Necromancy from the Cappadocians during the Renaissance and have used it — alongside their fortune — to broker influence across both the living world and the lands of the dead.",
        "Los Giovanni son únicos entre los clanes por Abrazar casi exclusivamente dentro de su familia mortal, una rica dinastía de mercaderes venecianos. Robaron el poder de la Nigromancia a los Cappadocianos durante el Renacimiento y lo han usado — junto a su fortuna — para tejer influencia tanto en el mundo de los vivos como en las tierras de los muertos.",
      ),
      "V20":     enEs(
        "The Giovanni are unique among clans for Embracing almost exclusively within their mortal family, a wealthy Venetian merchant dynasty. They stole the power of Necromancy from the Cappadocians during the Renaissance and have used it — alongside their fortune — to broker influence across both the living world and the lands of the dead.",
        "Los Giovanni son únicos entre los clanes por Abrazar casi exclusivamente dentro de su familia mortal, una rica dinastía de mercaderes venecianos. Robaron el poder de la Nigromancia a los Cappadocianos durante el Renacimiento y lo han usado — junto a su fortuna — para tejer influencia tanto en el mundo de los vivos como en las tierras de los muertos.",
      ),
      "V5": enEs(
        "Hecata, the Clan of Death, is a fusion of several death-touched bloodlines into a single house. They sit aside from the great sects, running a global Necropolis Plenum of funerary parlours, séance circles, and offshore banks — every contract paid in silence, every favour written in a ledger that does not forget.",
        "Hecata, el Clan de la Muerte, es la fusión de varios linajes tocados por la muerte en una sola casa. Se mantienen al margen de las grandes sectas y dirigen un Plenum de Necrópolis global formado por funerarias, círculos de séance y bancos en paraísos fiscales: cada contrato pagado en silencio, cada favor anotado en un libro que no olvida.",
      ),
    },
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "ravnos",
    name: en("Ravnos"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent", "Independiente"),
    summary: enEs(
      "Doomed wanderers, rogues, and masters of illusion from the East.",
      "Errantes condenados, ladrones y maestros de la ilusión procedentes de Oriente.",
    ),
    weakness: enEs(
      "Doomed to Wander / Vice: If they sleep in the same place more than once, they risk burning. They also suffer from a specific criminal vice they must indulge.",
      "Condenados a Vagar / Vicio: Si duermen más de una vez en el mismo lugar se exponen a arder. Además padecen un vicio criminal específico que deben satisfacer.",
    ),
    // Batch S: Ravnos V20 has Animalism / Chimerstry / Fortitude;
    // V5 dropped Chimerstry (as a discipline) and Fortitude in favour
    // of Animalism / Obfuscate / Presence. Chimerstry is already
    // classic-only via its own `editions`, but Fortitude is universal
    // and was leaking into V5 — `disciplinesByEdition` resolves it.
    disciplines: ["animalism", "chimerstry", "fortitude", "obfuscate", "presence"],
    disciplinesByEdition: {
      "1ST":     ["animalism", "chimerstry", "fortitude"],
      "2ND":     ["animalism", "chimerstry", "fortitude"],
      "REVISED": ["animalism", "chimerstry", "fortitude"],
      "V20":     ["animalism", "chimerstry", "fortitude"],
      "V5":      ["animalism", "obfuscate", "presence"],
    },
    icon: "🃏",
    bannerImage: "/images/ravnos.png",
    colorTheme: "#CD5C5C",
    lore: enEs(
      "Wanderers, thieves, and tricksters with deep ties to the East, the Ravnos answer to no court and trust no haven. A specific criminal vice rides every one of them, and the road behind is always shorter than the road ahead.",
      "Errantes, ladrones y embaucadores con profundos lazos con Oriente, los Ravnos no responden a corte alguna y no confían en ningún refugio. Un vicio criminal específico cabalga con cada uno de ellos, y el camino recorrido siempre es más corto que el que queda por delante.",
    ),
    // Batch T: V20 paints the Ravnos as a sprawling itinerant clan
    // of illusionists; V5 picks up the near-extinction left by the
    // Week of Nightmares and the supernatural doom that hunts the
    // survivors. Each edition stays in its own moment.
    loreByEdition: {
      "1ST":     enEs(
        "A sprawling clan of wanderers, thieves, and tricksters with deep ties to the East, the Ravnos hold a unique mastery of Chimerstry — illusion-craft no other clan can match. Caravans, kumpanias, and crime families scatter their kind across the world; ancient feuds with the Brujah and the Setites stay open across generations.",
        "Un clan extenso de errantes, ladrones y embaucadores con profundos lazos con Oriente, los Ravnos poseen un dominio único del Quimerismo — un arte de la ilusión que ningún otro clan iguala. Caravanas, kumpanias y familias criminales esparcen a los suyos por el mundo; sus antiguas enemistades con los Brujah y los Setitas siguen abiertas a lo largo de generaciones.",
      ),
      "2ND":     enEs(
        "A sprawling clan of wanderers, thieves, and tricksters with deep ties to the East, the Ravnos hold a unique mastery of Chimerstry — illusion-craft no other clan can match. Caravans, kumpanias, and crime families scatter their kind across the world; ancient feuds with the Brujah and the Setites stay open across generations.",
        "Un clan extenso de errantes, ladrones y embaucadores con profundos lazos con Oriente, los Ravnos poseen un dominio único del Quimerismo — un arte de la ilusión que ningún otro clan iguala. Caravanas, kumpanias y familias criminales esparcen a los suyos por el mundo; sus antiguas enemistades con los Brujah y los Setitas siguen abiertas a lo largo de generaciones.",
      ),
      "REVISED": enEs(
        "A sprawling clan of wanderers, thieves, and tricksters with deep ties to the East, the Ravnos hold a unique mastery of Chimerstry — illusion-craft no other clan can match. Caravans, kumpanias, and crime families scatter their kind across the world; ancient feuds with the Brujah and the Setites stay open across generations.",
        "Un clan extenso de errantes, ladrones y embaucadores con profundos lazos con Oriente, los Ravnos poseen un dominio único del Quimerismo — un arte de la ilusión que ningún otro clan iguala. Caravanas, kumpanias y familias criminales esparcen a los suyos por el mundo; sus antiguas enemistades con los Brujah y los Setitas siguen abiertas a lo largo de generaciones.",
      ),
      "V20":     enEs(
        "A sprawling clan of wanderers, thieves, and tricksters with deep ties to the East, the Ravnos hold a unique mastery of Chimerstry — illusion-craft no other clan can match. Caravans, kumpanias, and crime families scatter their kind across the world; ancient feuds with the Brujah and the Setites stay open across generations.",
        "Un clan extenso de errantes, ladrones y embaucadores con profundos lazos con Oriente, los Ravnos poseen un dominio único del Quimerismo — un arte de la ilusión que ningún otro clan iguala. Caravanas, kumpanias y familias criminales esparcen a los suyos por el mundo; sus antiguas enemistades con los Brujah y los Setitas siguen abiertas a lo largo de generaciones.",
      ),
      "V5": enEs(
        "A near-extinct line of wanderers running from a supernatural doom that hunts any Ravnos who stops moving. Survivors keep contact light, hide their bloodline, and burn through havens night after night — the road behind is always shorter than the road ahead.",
        "Una estirpe casi extinta de errantes que huyen de una condena sobrenatural que persigue a cualquier Ravnos que se detenga. Los supervivientes mantienen los contactos al mínimo, ocultan su linaje y queman refugios noche tras noche — el camino recorrido siempre es más corto que el que queda por delante.",
      ),
    },
    playableStatus: { "1ST": true, "2ND": true, "REVISED": true, "V20": true, "V5": true },
    sourceEdition: "1ST"
  },
  {
    id: "salubri",
    name: en("Salubri"),
    editionAvailability: ["1ST", "2ND", "REVISED", "V20", "V5"],
    sect: sectLabel("Independent", "Independiente"),
    summary: enEs(
      "A nearly extinct, three-eyed bloodline of hunted healers and soul-gazers.",
      "Una estirpe casi extinta y de tres ojos, formada por sanadores y contempladores de almas perseguidos.",
    ),
    weakness: enEs(
      "Prey Exclusion: They can only feed from mortals who offer their blood willingly. Forcing the Kiss causes severe spiritual and physical backlash.",
      "Restricción de Presa: Solo pueden alimentarse de mortales que ofrezcan su sangre de buen grado. Forzar el Beso provoca una grave reacción espiritual y física.",
    ),
    // Batch S: V20 Salubri have Auspex / Fortitude / Valeren;
    // V5 Salubri have Auspex / Dominate / Fortitude. Obfuscate was
    // incorrectly listed for both editions in the prior data and is
    // removed here; the matching `salubri` reference in
    // `obfuscate.clansWhoUse` is also removed in `data/disciplines.ts`.
    disciplines: ["auspex", "dominate", "fortitude", "valeren"],
    disciplinesByEdition: {
      "1ST":     ["auspex", "fortitude", "valeren"],
      "2ND":     ["auspex", "fortitude", "valeren"],
      "REVISED": ["auspex", "fortitude", "valeren"],
      "V20":     ["auspex", "fortitude", "valeren"],
      "V5":      ["auspex", "dominate", "fortitude"],
    },
    icon: "👁️‍🗨️",
    bannerImage: "/images/salubri.png",
    colorTheme: "#F0E68C",
    lore: enEs(
      "Once a respected clan of healers and holy warriors, the Salubri were driven to the brink of extinction by the Tremere, who usurped their Antediluvian and systematically branded them as soul-stealing infernalists. The few Salubri who remain exist in complete secrecy. Their most striking feature is a third eye that opens on their forehead whenever they use their unique disciplines.",
      "Antaño un respetado clan de sanadores y guerreros sagrados, los Salubri fueron empujados al borde de la extinción por los Tremere, quienes usurparon a su Antediluviano y los acusaron sistemáticamente de ser infernalistas devoradores de almas. Los pocos Salubri que quedan existen en absoluto secreto. Su rasgo más característico es un tercer ojo que se abre en su frente cada vez que emplean sus disciplinas únicas.",
    ),
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
    summary: enEs(
      "Clanless vampires abandoned by their sires, lacking the specific traits of any lineage.",
      "Vampiros sin clan, abandonados por sus sires y sin los rasgos específicos de ningún linaje.",
    ),
    weakness: enEs(
      "Clanless: They have no clan weakness, but they also have no clan disciplines. They learn all disciplines at a higher experience cost and face severe social prejudice.",
      "Sin Clan: No tienen debilidad de clan, pero tampoco tienen disciplinas de clan. Aprenden todas las disciplinas con un costo de experiencia más alto y enfrentan un severo prejuicio social.",
    ),
    disciplines: [],
    icon: "🗑️",
    bannerImage: "/opengraph.jpg",
    colorTheme: "#888888",
    lore: enEs(
      "Caitiff are the clanless trash of Kindred society. Whether they were abandoned by their sires before learning their heritage, or whether the Blood simply failed to transmit a clan's curse and gifts, the Caitiff belong nowhere. The Camarilla treats them as second-class citizens or immediate Masquerade threats, pushing the vast majority of Caitiff into the welcoming arms of the Anarchs.",
      "Los Caitiff son la basura sin clan de la sociedad Cainita. Ya sea porque sus sires los abandonaron antes de enseñarles su herencia, o porque la Sangre simplemente no transmitió la maldición ni los dones de ningún clan, los Caitiff no pertenecen a ninguna parte. La Camarilla los trata como ciudadanos de segunda o como amenazas inmediatas a la Mascarada, empujando a la inmensa mayoría hacia los brazos acogedores de los Anarcas.",
    ),
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
    summary: enEs(
      "Vampires of the 14th, 15th, and 16th generations whose blood is too weak to sustain full undeath.",
      "Vampiros de las generaciones 14, 15 y 16 cuya sangre es demasiado débil para sostener una no-muerte plena.",
    ),
    weakness: enEs(
      "Duskborn: They cannot blood bond, sire childer easily, or heal like normal vampires. However, they can walk in the daylight and consume human food.",
      "Nacidos del Crepúsculo: No pueden crear vínculos de sangre, engendrar chiquillos con facilidad ni curarse como los vampiros normales. Sin embargo, pueden caminar a la luz del día y consumir alimentos humanos.",
    ),
    disciplines: ["thin_blood_alchemy"],
    icon: "🩸💧",
    bannerImage: "/opengraph.jpg",
    colorTheme: "#5C5C5C",
    lore: enEs(
      "The Thin-Bloods are the ultimate heralds of Gehenna. Born of generations so far removed from Caine that they are barely vampires, they exist in a twilight state between life and undeath. They are hunted mercilessly by the Camarilla and the Sabbat, forcing them to hide in the fringes of society. In modern nights, they have developed Thin-Blood Alchemy, using their mixed blood to replicate powers they cannot naturally learn.",
      "Los Sangre Débil son los heraldos definitivos del Gehenna. Nacidos de generaciones tan alejadas de Caín que apenas son vampiros, existen en un estado de penumbra entre la vida y la no-muerte. Son cazados sin piedad por la Camarilla y el Sabbat, lo que los obliga a esconderse en los márgenes de la sociedad. En las noches modernas han desarrollado la Alquimia de Sangre Débil, usando su sangre mezclada para replicar poderes que no pueden aprender de forma natural.",
    ),
    playableStatus: { "REVISED": false, "V20": true, "V5": true },
    sourceEdition: "REVISED"
  }
];
