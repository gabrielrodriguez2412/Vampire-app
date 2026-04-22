import { GlossaryEntry } from '../types';

const fallbackStr = (val: string) => ({ es: val, en: val, pt: val, fr: val, de: val, it: val });

export const glossary: GlossaryEntry[] = [
  {
    id: "masquerade",
    term: { es: "La Mascarada", en: "The Masquerade", pt: "", fr: "", de: "", it: "" },
    definition: { es: "La principal tradición de la Camarilla: ocultar la existencia de los vampiros a la humanidad para asegurar la supervivencia de la especie.", en: "The primary tradition of the Camarilla: hiding the existence of vampires from humanity to ensure the survival of the species.", pt: "", fr: "", de: "", it: "" },
    related: ["camarilla", "prince"]
  },
  {
    id: "vitae",
    term: fallbackStr("Vitae"),
    definition: { es: "Sangre vampírica. Es el medio por el cual los vampiros usan disciplinas, se curan y crean vínculos.", en: "Vampiric blood. It is the means by which vampires use disciplines, heal, and create bonds.", pt: "", fr: "", de: "", it: "" },
    related: ["ghoul", "blood-bond"]
  },
  {
    id: "beast",
    term: { es: "La Bestia", en: "The Beast", pt: "A Besta", fr: "La Bête", de: "Das Tier", it: "La Bestia" },
    definition: { es: "El instinto primario, animal y depredador dentro de cada vampiro, que busca constantemente sobrevivir, alimentarse y dominar.", en: "The primal, animalistic, and predatory instinct within every vampire, constantly seeking to survive, feed, and dominate.", pt: "", fr: "", de: "", it: "" },
    related: ["frenzy", "humanity"]
  },
  {
    id: "frenzy",
    term: { es: "Frenesí", en: "Frenzy", pt: "Frenesi", fr: "Frénésie", de: "Raserei", it: "Frenesia" },
    definition: { es: "Un estado en el que la Bestia toma el control del vampiro debido al hambre extrema, la ira o el miedo (Rötschreck).", en: "A state in which the Beast takes control of the vampire due to extreme hunger, anger, or fear (Rötschreck).", pt: "", fr: "", de: "", it: "" },
    related: ["beast"]
  },
  {
    id: "prince",
    term: { es: "Príncipe", en: "Prince", pt: "Príncipe", fr: "Prince", de: "Prinz", it: "Principe" },
    definition: { es: "El gobernante de una ciudad en la Camarilla. Tiene el derecho de proclamar dominios, otorgar el derecho de crear progenie y declarar Cazas de Sangre.", en: "The ruler of a Camarilla city. Has the right to proclaim domains, grant the right of progeny, and call Blood Hunts.", pt: "", fr: "", de: "", it: "" },
    related: ["camarilla", "domain"]
  },
  {
    id: "elysium",
    term: { es: "Elíseo", en: "Elysium", pt: "Elísio", fr: "Élysée", de: "Elysium", it: "Elysium" },
    definition: { es: "Zonas neutrales declaradas por el Príncipe donde la violencia, el uso de disciplinas evidentes y cazar están estrictamente prohibidos.", en: "Neutral zones declared by the Prince where violence, obvious discipline use, and hunting are strictly prohibited.", pt: "", fr: "", de: "", it: "" },
    related: ["prince"]
  },
  {
    id: "sire",
    term: { es: "Sire", en: "Sire", pt: "Senhor", fr: "Sire", de: "Erzeuger", it: "Sire" },
    definition: { es: "El creador (padre/madre vampírico) de otro vampiro.", en: "The creator (vampiric parent) of another vampire.", pt: "", fr: "", de: "", it: "" },
    related: ["childer"]
  },
  {
    id: "childer",
    term: { es: "Chiquillo / Progenie", en: "Childer / Childe", pt: "Cria", fr: "Infant", de: "Kind", it: "Infante" },
    definition: { es: "Un vampiro recién creado en relación con su Sire.", en: "A newly created vampire in relation to their Sire.", pt: "", fr: "", de: "", it: "" },
    related: ["sire"]
  },
  {
    id: "coterie",
    term: { es: "Coterie (Cuadrilla)", en: "Coterie", pt: "Coterie", fr: "Coterie", de: "Klünge", it: "Coterie" },
    definition: { es: "Un grupo de vampiros unidos para protección mutua, ambición compartida o simple conveniencia.", en: "A group of vampires bound together for mutual protection, shared ambition, or simple convenience.", pt: "", fr: "", de: "", it: "" },
    related: []
  },
  {
    id: "ghoul",
    term: { es: "Ghoul", en: "Ghoul", pt: "Carniçal", fr: "Goule", de: "Ghul", it: "Ghoul" },
    definition: { es: "Un mortal que ha bebido vitae vampírica sin ser drenado primero. Dejan de envejecer y ganan algo de poder sobrenatural.", en: "A mortal who has drunk vampiric vitae without being drained first. They stop aging and gain some supernatural power.", pt: "", fr: "", de: "", it: "" },
    related: ["vitae", "blood-bond"]
  },
  {
    id: "camarilla",
    term: { es: "La Camarilla", en: "The Camarilla", pt: "A Camarilla", fr: "La Camarilla", de: "Die Camarilla", it: "La Camarilla" },
    definition: { es: "La secta vampírica dominante, estructurada como una sociedad secreta neofeudal que defiende la Mascarada ferozmente.", en: "The dominant vampiric sect, structured as a neo-feudal secret society that fiercely defends the Masquerade.", pt: "", fr: "", de: "", it: "" },
    related: ["masquerade", "prince"]
  },
  {
    id: "anarchs",
    term: { es: "Los Anarquistas", en: "The Anarchs", pt: "Os Anarquistas", fr: "Les Anarchs", de: "Die Anarchen", it: "Gli Anarchici" },
    definition: { es: "Vampiros que rechazan la jerarquía rígida de la Camarilla. En las noches modernas actúan como una secta separada e independiente.", en: "Vampires who reject the rigid hierarchy of the Camarilla. In modern nights they act as a separate, independent sect.", pt: "", fr: "", de: "", it: "" },
    related: ["camarilla"]
  },
  {
    id: "sabbat",
    term: { es: "El Sabbat", en: "The Sabbat", pt: "O Sabá", fr: "Le Sabbat", de: "Der Sabbat", it: "Il Sabbat" },
    definition: { es: "Una secta apocalíptica que rechaza la humanidad, abraza a la Bestia y busca destruir a los Antediluvianos.", en: "An apocalyptic sect that rejects humanity, embraces the Beast, and seeks to destroy the Antediluvians.", pt: "", fr: "", de: "", it: "" },
    related: ["gehenna"]
  },
  {
    id: "gehenna",
    term: { es: "La Gehena", en: "Gehenna", pt: "A Gehenna", fr: "La Géhenne", de: "Gehenna", it: "La Gehenna" },
    definition: { es: "El supuesto fin del mundo vampírico, cuando los Antediluvianos despertarán y devorarán a toda su progenie.", en: "The supposed end of the vampiric world, when the Antediluvians will awaken and devour all their progeny.", pt: "", fr: "", de: "", it: "" },
    related: ["sabbat"]
  },
  {
    id: "diablerie",
    term: { es: "Diablerie (Amaranto)", en: "Diablerie (Amaranth)", pt: "Diablerie", fr: "Diablerie", de: "Diablerie", it: "Diablerie" },
    definition: { es: "El acto de consumir no solo la sangre, sino el alma de otro vampiro. Otorga poder, pero es un tabú absoluto castigado con la Muerte Definitiva.", en: "The act of consuming not just the blood, but the soul of another vampire. Grants power, but is an absolute taboo punishable by Final Death.", pt: "", fr: "", de: "", it: "" },
    related: ["generation"]
  },
  {
    id: "golconda",
    term: { es: "Golconda", en: "Golconda", pt: "Golconda", fr: "Golconde", de: "Golconda", it: "Golconda" },
    definition: { es: "Un legendario estado de iluminación espiritual en el cual el vampiro reconcilia a su Bestia, logrando la paz interior.", en: "A legendary state of spiritual enlightenment in which the vampire reconciles with their Beast, achieving inner peace.", pt: "", fr: "", de: "", it: "" },
    related: ["humanity", "beast"]
  },
  {
    id: "generation",
    term: { es: "Generación", en: "Generation", pt: "Geração", fr: "Génération", de: "Generation", it: "Generazione" },
    definition: { es: "La distancia de un vampiro respecto a Caín (el Primer Vampiro). Menor generación (ej. 8ª en lugar de 12ª) significa mayor poder y cercanía a la pureza de la Sangre.", en: "A vampire's distance from Caine (the First Vampire). Lower generation (e.g., 8th instead of 12th) means greater power and closeness to the purity of the Blood.", pt: "", fr: "", de: "", it: "" },
    related: ["diablerie"]
  },
  {
    id: "resonance_term",
    term: { es: "Resonancia", en: "Resonance", pt: "Ressonância", fr: "Résonance", de: "Resonanz", it: "Risonanza" },
    definition: { es: "El rastro emocional que impregna la sangre humana en el momento en que es consumida.", en: "The emotional trace that permeates human blood at the moment it is consumed.", pt: "", fr: "", de: "", it: "" },
    related: ["vitae"]
  },
  {
    id: "methuselah",
    term: { es: "Matusalén", en: "Methuselah", pt: "Matusalém", fr: "Mathusalem", de: "Methusalem", it: "Matusalemme" },
    definition: { es: "Vampiros inmensamente viejos y poderosos (normalmente de 4ª o 5ª Generación) que a menudo manipulan a los vástagos más jóvenes desde las sombras.", en: "Immensely old and powerful vampires (usually 4th or 5th Generation) who often manipulate younger Kindred from the shadows.", pt: "", fr: "", de: "", it: "" },
    related: ["generation"]
  },
  {
    id: "rack",
    term: { es: "El Coto (The Rack)", en: "The Rack", pt: "O Campo", fr: "Le Parc", de: "Die Jagdgründe", it: "La Riserva" },
    definition: { es: "Un área de la ciudad rica en mortales (clubes, distritos rojos) donde la caza es fácil. Suelen ser territorios disputados.", en: "An area of the city rich in mortals (clubs, red-light districts) where hunting is easy. They are often disputed territories.", pt: "", fr: "", de: "", it: "" },
    related: ["domain"]
  }
];
