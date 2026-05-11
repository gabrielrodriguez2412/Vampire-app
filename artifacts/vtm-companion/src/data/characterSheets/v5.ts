import { LangCode } from "../../types";

export interface V5SheetSection {
  id: string;
  name: Record<LangCode, string>;
  subsections: {
    id: string;
    name: Record<LangCode, string>;
    fields: {
      id: string;
      name: Record<LangCode, string>;
      type: "text" | "number" | "dots" | "checkbox" | "textarea";
      optional?: boolean;
    }[];
  }[];
}

export const V5_SHEET_SECTIONS: V5SheetSection[] = [
  {
    id: "identity",
    name: {
      es: "Identidad",
      en: "Identity",
      pt: "Identidade",
      fr: "Identité",
      de: "Identität",
      it: "Identità"
    },
    subsections: [
      {
        id: "identity_personal",
        name: {
          es: "Información Personal",
          en: "Personal Information",
          pt: "Informações Pessoais",
          fr: "Informations Personnelles",
          de: "Persönliche Informationen",
          it: "Informazioni Personali"
        },
        fields: [
          {
            id: "name",
            name: { es: "Nombre", en: "Name", pt: "Nome", fr: "Nom", de: "Name", it: "Nome" },
            type: "text"
          },
          {
            id: "player",
            name: { es: "Jugador", en: "Player", pt: "Jogador", fr: "Joueur", de: "Spieler", it: "Giocatore" },
            type: "text",
            optional: true
          },
          {
            id: "chronicle",
            name: { es: "Crónica", en: "Chronicle", pt: "Crônica", fr: "Chronique", de: "Chronik", it: "Cronaca" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "identity_supernatural",
        name: {
          es: "Información Sobrenatural",
          en: "Supernatural Information",
          pt: "Informações Sobrenaturais",
          fr: "Informations Surnaturelles",
          de: "Übernatürliche Informationen",
          it: "Informazioni Sovrumane"
        },
        fields: [
          {
            id: "concept",
            name: { es: "Concepto", en: "Concept", pt: "Conceito", fr: "Concept", de: "Konzept", it: "Concetto" },
            type: "text"
          },
          {
            id: "clan",
            name: { es: "Clan", en: "Clan", pt: "Clã", fr: "Clan", de: "Clan", it: "Clan" },
            type: "text"
          },
          {
            id: "ambition",
            name: { es: "Ambición", en: "Ambition", pt: "Ambição", fr: "Ambition", de: "Ehrgeiz", it: "Ambizione" },
            type: "text",
            optional: true
          },
          {
            id: "desire",
            name: { es: "Deseo", en: "Desire", pt: "Desejo", fr: "Désir", de: "Wunsch", it: "Desiderio" },
            type: "text",
            optional: true
          },
          {
            id: "predator_type",
            name: { es: "Tipo de Depredador", en: "Predator Type", pt: "Tipo de Predador", fr: "Type de Prédateur", de: "Raubtyp", it: "Tipo di Predatore" },
            type: "text",
            optional: true
          },
          {
            id: "generation",
            name: { es: "Generación", en: "Generation", pt: "Geração", fr: "Génération", de: "Generation", it: "Generazione" },
            type: "number",
            optional: true
          },
          {
            id: "sire",
            name: { es: "Sire", en: "Sire", pt: "Sire", fr: "Sire", de: "Sire", it: "Sire" },
            type: "text",
            optional: true
          }
        ]
      }
    ]
  },
  {
    id: "attributes",
    name: {
      es: "Atributos",
      en: "Attributes",
      pt: "Atributos",
      fr: "Attributs",
      de: "Eigenschaften",
      it: "Attributi"
    },
    subsections: [
      {
        id: "attributes_physical",
        name: {
          es: "Físicos",
          en: "Physical",
          pt: "Físicos",
          fr: "Physiques",
          de: "Physisch",
          it: "Fisici"
        },
        fields: [
          {
            id: "strength",
            name: { es: "Fuerza", en: "Strength", pt: "Força", fr: "Force", de: "Stärke", it: "Forza" },
            type: "dots"
          },
          {
            id: "dexterity",
            name: { es: "Destreza", en: "Dexterity", pt: "Destreza", fr: "Dextérité", de: "Geschicklichkeit", it: "Destrezza" },
            type: "dots"
          },
          {
            id: "stamina",
            name: { es: "Resistencia", en: "Stamina", pt: "Resistência", fr: "Vigueur", de: "Widerstandsfähigkeit", it: "Resistenza" },
            type: "dots"
          }
        ]
      },
      {
        id: "attributes_social",
        name: {
          es: "Sociales",
          en: "Social",
          pt: "Sociais",
          fr: "Sociaux",
          de: "Sozial",
          it: "Sociali"
        },
        fields: [
          {
            id: "charisma",
            name: { es: "Carisma", en: "Charisma", pt: "Carisma", fr: "Charisme", de: "Charisma", it: "Carisma" },
            type: "dots"
          },
          {
            id: "manipulation",
            name: { es: "Manipulación", en: "Manipulation", pt: "Manipulação", fr: "Manipulation", de: "Manipulation", it: "Manipolazione" },
            type: "dots"
          },
          {
            id: "composure",
            name: { es: "Compostura", en: "Composure", pt: "Autocontrole", fr: "Sang-froid", de: "Fassung", it: "Ascendente" },
            type: "dots"
          }
        ]
      },
      {
        id: "attributes_mental",
        name: {
          es: "Mentales",
          en: "Mental",
          pt: "Mentais",
          fr: "Mentaux",
          de: "Geistig",
          it: "Mentali"
        },
        fields: [
          {
            id: "intelligence",
            name: { es: "Inteligencia", en: "Intelligence", pt: "Inteligência", fr: "Intelligence", de: "Intelligenz", it: "Intelligenza" },
            type: "dots"
          },
          {
            id: "wits",
            name: { es: "Astucia", en: "Wits", pt: "Raciocínio", fr: "Astuce", de: "Geistesblitze", it: "Prontezza" },
            type: "dots"
          },
          {
            id: "resolve",
            name: { es: "Resolución", en: "Resolve", pt: "Determinação", fr: "Résolution", de: "Entschlossenheit", it: "Risoluzione" },
            type: "dots"
          }
        ]
      }
    ]
  },
  {
    id: "skills",
    name: {
      es: "Habilidades",
      en: "Skills",
      pt: "Habilidades",
      fr: "Compétences",
      de: "Fertigkeiten",
      it: "Competenze"
    },
    subsections: [
      {
        id: "skills_physical",
        name: {
          es: "Habilidades Físicas",
          en: "Physical Skills",
          pt: "Habilidades Físicas",
          fr: "Compétences Physiques",
          de: "Physische Fertigkeiten",
          it: "Competenze Fisiche"
        },
        fields: [
          {
            id: "athletics",
            name: { es: "Atletismo", en: "Athletics", pt: "Atletismo", fr: "Athlétisme", de: "Athletik", it: "Atletica" },
            type: "dots",
            optional: true
          },
          {
            id: "brawl",
            name: { es: "Pelea", en: "Brawl", pt: "Briga", fr: "Bagarre", de: "Handgemenge", it: "Rissa" },
            type: "dots",
            optional: true
          },
          {
            id: "craft",
            name: { es: "Artesanía", en: "Craft", pt: "Ofícios", fr: "Artisanat", de: "Handwerk", it: "Mestieri" },
            type: "dots",
            optional: true
          },
          {
            id: "drive",
            name: { es: "Conducir", en: "Drive", pt: "Condução", fr: "Conduite", de: "Fahren", it: "Guidare" },
            type: "dots",
            optional: true
          },
          {
            id: "firearms",
            name: { es: "Armas de Fuego", en: "Firearms", pt: "Armas de Fogo", fr: "Armes à feu", de: "Schusswaffen", it: "Armi da Fuoco" },
            type: "dots",
            optional: true
          },
          {
            id: "melee",
            name: { es: "Armas Blancas", en: "Melee", pt: "Armas Brancas", fr: "Mêlée", de: "Nahkampf", it: "Mischia" },
            type: "dots",
            optional: true
          },
          {
            id: "stealth",
            name: { es: "Sigilo", en: "Stealth", pt: "Furtividade", fr: "Furtivité", de: "Heimlichkeit", it: "Furtività" },
            type: "dots",
            optional: true
          },
          {
            id: "survival",
            name: { es: "Supervivencia", en: "Survival", pt: "Sobrevivência", fr: "Survie", de: "Überleben", it: "Sopravvivenza" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "skills_social",
        name: {
          es: "Habilidades Sociales",
          en: "Social Skills",
          pt: "Habilidades Sociais",
          fr: "Compétences Sociales",
          de: "Soziale Fertigkeiten",
          it: "Competenze Sociali"
        },
        fields: [
          {
            id: "animal_ken",
            name: { es: "Trato con Animales", en: "Animal Ken", pt: "Empatia com Animais", fr: "Animaux", de: "Tierkunde", it: "Empatia Animale" },
            type: "dots",
            optional: true
          },
          {
            id: "etiquette",
            name: { es: "Etiqueta", en: "Etiquette", pt: "Etiqueta", fr: "Étiquette", de: "Etikette", it: "Etichetta" },
            type: "dots",
            optional: true
          },
          {
            id: "insight",
            name: { es: "Perspicacia", en: "Insight", pt: "Intuição", fr: "Intuition", de: "Menschenkenntnis", it: "Intuito" },
            type: "dots",
            optional: true
          },
          {
            id: "intimidation",
            name: { es: "Intimidación", en: "Intimidation", pt: "Intimidação", fr: "Intimidation", de: "Einschüchterung", it: "Intimidazione" },
            type: "dots",
            optional: true
          },
          {
            id: "leadership",
            name: { es: "Liderazgo", en: "Leadership", pt: "Liderança", fr: "Commandement", de: "Führung", it: "Comando" },
            type: "dots",
            optional: true
          },
          {
            id: "performance",
            name: { es: "Actuación", en: "Performance", pt: "Performance", fr: "Représentation", de: "Ausdruck", it: "Espressione" },
            type: "dots",
            optional: true
          },
          {
            id: "persuasion",
            name: { es: "Persuasión", en: "Persuasion", pt: "Persuasão", fr: "Persuasion", de: "Überreden", it: "Persuasione" },
            type: "dots",
            optional: true
          },
          {
            id: "streetwise",
            name: { es: "Callejeo", en: "Streetwise", pt: "Manha", fr: "Rue", de: "Gassenwissen", it: "Bassifondi" },
            type: "dots",
            optional: true
          },
          {
            id: "subterfuge",
            name: { es: "Subterfugio", en: "Subterfuge", pt: "Lábia", fr: "Subterfuge", de: "Ausflüchte", it: "Sotterfugio" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "skills_mental",
        name: {
          es: "Habilidades Mentales",
          en: "Mental Skills",
          pt: "Habilidades Mentais",
          fr: "Compétences Mentales",
          de: "Geistige Fertigkeiten",
          it: "Competenze Mentali"
        },
        fields: [
          {
            id: "academics",
            name: { es: "Academicismo", en: "Academics", pt: "Erudição", fr: "Érudition", de: "Akademiewissen", it: "Erudizione" },
            type: "dots",
            optional: true
          },
          {
            id: "awareness",
            name: { es: "Consciencia", en: "Awareness", pt: "Percepção", fr: "Vigilance", de: "Aufmerksamkeit", it: "Percezione" },
            type: "dots",
            optional: true
          },
          {
            id: "finance",
            name: { es: "Finanzas", en: "Finance", pt: "Finanças", fr: "Finances", de: "Finanzen", it: "Finanze" },
            type: "dots",
            optional: true
          },
          {
            id: "investigation",
            name: { es: "Investigación", en: "Investigation", pt: "Investigação", fr: "Investigation", de: "Nachforschung", it: "Investigazione" },
            type: "dots",
            optional: true
          },
          {
            id: "medicine",
            name: { es: "Medicina", en: "Medicine", pt: "Medicina", fr: "Médecine", de: "Medizin", it: "Medicina" },
            type: "dots",
            optional: true
          },
          {
            id: "occult",
            name: { es: "Ocultismo", en: "Occult", pt: "Ocultismo", fr: "Occultisme", de: "Okkultismus", it: "Occulto" },
            type: "dots",
            optional: true
          },
          {
            id: "politics",
            name: { es: "Política", en: "Politics", pt: "Política", fr: "Politique", de: "Politik", it: "Politica" },
            type: "dots",
            optional: true
          },
          {
            id: "technology",
            name: { es: "Tecnología", en: "Technology", pt: "Tecnologia", fr: "Technologie", de: "Technologie", it: "Tecnologia" },
            type: "dots",
            optional: true
          }
        ]
      }
    ]
  },
  {
    id: "vampire_traits",
    name: {
      es: "Rasgos de Vampiro",
      en: "Vampire Traits",
      pt: "Traços de Vampiro",
      fr: "Traits de Vampire",
      de: "Vampirmerkmale",
      it: "Tratti di Vampiro"
    },
    subsections: [
      {
        id: "vampire_traits_disciplines",
        name: {
          es: "Disciplinas",
          en: "Disciplines",
          pt: "Disciplinas",
          fr: "Disciplines",
          de: "Disziplinen",
          it: "Discipline"
        },
        fields: [
          {
            id: "disciplines",
            name: { es: "Disciplinas Disponibles", en: "Available Disciplines", pt: "Disciplinas Disponíveis", fr: "Disciplines Disponibles", de: "Verfügbare Disziplinen", it: "Discipline Disponibili" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "vampire_traits_bloodline",
        name: {
          es: "Marca del Clan",
          en: "Clan Bane",
          pt: "Marca do Clã",
          fr: "Malédiction du Clan",
          de: "Clan-Bane",
          it: "Rovina del Clan"
        },
        fields: [
          {
            id: "clan_bane",
            name: { es: "Marca del Clan", en: "Clan Bane", pt: "Marca do Clã", fr: "Malédiction du Clan", de: "Clan-Bane", it: "Rovina del Clan" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "vampire_traits_compulsion",
        name: {
          es: "Compulsión",
          en: "Compulsion",
          pt: "Compulsão",
          fr: "Compulsion",
          de: "Zwang",
          it: "Compulsione"
        },
        fields: [
          {
            id: "compulsion",
            name: { es: "Compulsión", en: "Compulsion", pt: "Compulsão", fr: "Compulsion", de: "Zwang", it: "Compulsione" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "vampire_traits_potency",
        name: {
          es: "Potencia",
          en: "Blood Potency",
          pt: "Potência",
          fr: "Potence du Sang",
          de: "Blutmacht",
          it: "Potenza"
        },
        fields: [
          {
            id: "blood_potency",
            name: { es: "Potencia de Sangre", en: "Blood Potency", pt: "Potência de Sangue", fr: "Potence du Sang", de: "Blutmacht", it: "Potenza del Sangue" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "vampire_traits_hunger",
        name: {
          es: "Hambre",
          en: "Hunger",
          pt: "Fome",
          fr: "Faim",
          de: "Hunger",
          it: "Fame"
        },
        fields: [
          {
            id: "hunger",
            name: { es: "Hambre", en: "Hunger", pt: "Fome", fr: "Faim", de: "Hunger", it: "Fame" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "vampire_traits_humanity",
        name: {
          es: "Humanidad",
          en: "Humanity",
          pt: "Humanidade",
          fr: "Humanité",
          de: "Menschlichkeit",
          it: "Umanità"
        },
        fields: [
          {
            id: "humanity",
            name: { es: "Humanidad", en: "Humanity", pt: "Humanidade", fr: "Humanité", de: "Menschlichkeit", it: "Umanità" },
            type: "dots",
            optional: true
          }
        ]
      }
    ]
  },
  {
    id: "other_traits",
    name: {
      es: "Otros Rasgos",
      en: "Other Traits",
      pt: "Outros Traços",
      fr: "Autres Traits",
      de: "Sonstige Merkmale",
      it: "Altri Tratti"
    },
    subsections: [
      {
        id: "other_traits_health",
        name: {
          es: "Salud",
          en: "Health",
          pt: "Saúde",
          fr: "Santé",
          de: "Gesundheit",
          it: "Salute"
        },
        fields: [
          {
            id: "health",
            name: { es: "Salud", en: "Health", pt: "Saúde", fr: "Santé", de: "Gesundheit", it: "Salute" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_willpower",
        name: {
          es: "Fuerza de Voluntad",
          en: "Willpower",
          pt: "Força de Vontade",
          fr: "Volonté",
          de: "Willenskraft",
          it: "Volontà"
        },
        fields: [
          {
            id: "willpower",
            name: { es: "Fuerza de Voluntad", en: "Willpower", pt: "Força de Vontade", fr: "Volonté", de: "Willenskraft", it: "Volontà" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_advantages",
        name: {
          es: "Ventajas",
          en: "Advantages",
          pt: "Vantagens",
          fr: "Avantages",
          de: "Vorteile",
          it: "Vantaggi"
        },
        fields: [
          {
            id: "advantages",
            name: { es: "Ventajas", en: "Advantages", pt: "Vantagens", fr: "Avantages", de: "Vorteile", it: "Vantaggi" },
            type: "textarea",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_flaws",
        name: {
          es: "Defectos",
          en: "Flaws",
          pt: "Falhas",
          fr: "Défauts",
          de: "Fehler",
          it: "Difetti"
        },
        fields: [
          {
            id: "flaws",
            name: { es: "Defectos", en: "Flaws", pt: "Falhas", fr: "Défauts", de: "Fehler", it: "Difetti" },
            type: "textarea",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_convictions",
        name: {
          es: "Convicciones",
          en: "Convictions",
          pt: "Convicções",
          fr: "Convictions",
          de: "Überzeugungen",
          it: "Convinzioni"
        },
        fields: [
          {
            id: "convictions",
            name: { es: "Convicciones", en: "Convictions", pt: "Convicções", fr: "Convictions", de: "Überzeugungen", it: "Convinzioni" },
            type: "textarea",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_touchstones",
        name: {
          es: "Puntos de Ancla",
          en: "Touchstones",
          pt: "Pontos de Ancla",
          fr: "Points d'Ancrage",
          de: "Ankerplätze",
          it: "Punti di Ancoraggio"
        },
        fields: [
          {
            id: "touchstones",
            name: { es: "Puntos de Ancla", en: "Touchstones", pt: "Pontos de Ancla", fr: "Points d'Ancrage", de: "Ankerplätze", it: "Punti di Ancoraggio" },
            type: "textarea",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_experience",
        name: {
          es: "Experiencia",
          en: "Experience",
          pt: "Experiência",
          fr: "Expérience",
          de: "Erfahrung",
          it: "Esperienza"
        },
        fields: [
          {
            id: "experience",
            name: { es: "Puntos de Experiencia", en: "Experience Points", pt: "Pontos de Experiência", fr: "Points d'Expérience", de: "Erfahrungspunkte", it: "Punti Esperienza" },
            type: "number",
            optional: true
          },
          {
            id: "experience_spent",
            name: { es: "Experiencia Gastada", en: "Experience Spent", pt: "Experiência Gasta", fr: "Expérience Dépensée", de: "Verwendete Erfahrung", it: "Esperienza Spesa" },
            type: "number",
            optional: true
          }
        ]
      },
      {
        id: "other_traits_notes",
        name: {
          es: "Notas",
          en: "Notes",
          pt: "Notas",
          fr: "Notes",
          de: "Notizen",
          it: "Note"
        },
        fields: [
          {
            id: "notes",
            name: { es: "Notas del Personaje", en: "Character Notes", pt: "Notas do Personagem", fr: "Notes du Personnage", de: "Charakternotizen", it: "Note del Personaggio" },
            type: "textarea",
            optional: true
          }
        ]
      }
    ]
  }
];
