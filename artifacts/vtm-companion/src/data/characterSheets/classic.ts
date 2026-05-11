import { LangCode } from "../../types";

export interface ClassicSheetSection {
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

export const CLASSIC_SHEET_SECTIONS: ClassicSheetSection[] = [
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
            id: "nature",
            name: { es: "Naturaleza", en: "Nature", pt: "Natureza", fr: "Nature", de: "Natur", it: "Natura" },
            type: "text",
            optional: true
          },
          {
            id: "demeanor",
            name: { es: "Conducta", en: "Demeanor", pt: "Comportamento", fr: "Comportement", de: "Verhalten", it: "Comportamento" },
            type: "text",
            optional: true
          },
          {
            id: "clan",
            name: { es: "Clan", en: "Clan", pt: "Clã", fr: "Clan", de: "Clan", it: "Clan" },
            type: "text"
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
            id: "appearance",
            name: { es: "Apariencia", en: "Appearance", pt: "Aparência", fr: "Apparence", de: "Aussehen", it: "Aspetto" },
            type: "dots",
            optional: true
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
            type: "dots",
            optional: true
          }
        ]
      }
    ]
  },
  {
    id: "abilities",
    name: {
      es: "Habilidades",
      en: "Abilities",
      pt: "Habilidades",
      fr: "Compétences",
      de: "Fähigkeiten",
      it: "Abilità"
    },
    subsections: [
      {
        id: "abilities_talents",
        name: {
          es: "Talentos",
          en: "Talents",
          pt: "Talentos",
          fr: "Talents",
          de: "Talente",
          it: "Talenti"
        },
        fields: [
          {
            id: "alertness",
            name: { es: "Alerta", en: "Alertness", pt: "Vigilância", fr: "Vigilance", de: "Aufmerksamkeit", it: "Prontezza" },
            type: "dots",
            optional: true
          },
          {
            id: "athletics",
            name: { es: "Atletismo", en: "Athletics", pt: "Atletismo", fr: "Athlétisme", de: "Athletik", it: "Atletica" },
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
            id: "brawl",
            name: { es: "Pelea", en: "Brawl", pt: "Briga", fr: "Bagarre", de: "Handgemenge", it: "Rissa" },
            type: "dots",
            optional: true
          },
          {
            id: "empathy",
            name: { es: "Empatía", en: "Empathy", pt: "Empatia", fr: "Empathie", de: "Einfühlungsvermögen", it: "Empatia" },
            type: "dots",
            optional: true
          },
          {
            id: "expression",
            name: { es: "Expresión", en: "Expression", pt: "Expressão", fr: "Expression", de: "Ausdruck", it: "Espressione" },
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
            id: "streetwise",
            name: { es: "Callejeo", en: "Streetwise", pt: "Manha", fr: "Rue", de: "Gassenwissen", it: "Bassifondi" },
            type: "dots",
            optional: true
          }
        ]
      },
      {
        id: "abilities_skills",
        name: {
          es: "Habilidades",
          en: "Skills",
          pt: "Perícias",
          fr: "Compétences",
          de: "Fertigkeiten",
          it: "Competenze"
        },
        fields: [
          {
            id: "animal_ken",
            name: { es: "Trato con Animales", en: "Animal Ken", pt: "Empatia com Animais", fr: "Animaux", de: "Tierkunde", it: "Empatia Animale" },
            type: "dots",
            optional: true
          },
          {
            id: "crafts",
            name: { es: "Artesanía", en: "Crafts", pt: "Ofícios", fr: "Artisanat", de: "Handwerk", it: "Mestieri" },
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
            id: "etiquette",
            name: { es: "Etiqueta", en: "Etiquette", pt: "Etiqueta", fr: "Étiquette", de: "Etikette", it: "Etichetta" },
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
            id: "performance",
            name: { es: "Actuación", en: "Performance", pt: "Performance", fr: "Représentation", de: "Ausdruck", it: "Espressione" },
            type: "dots",
            optional: true
          },
          {
            id: "security",
            name: { es: "Seguridad", en: "Security", pt: "Segurança", fr: "Sécurité", de: "Sicherheit", it: "Sicurezza" },
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
        id: "abilities_knowledges",
        name: {
          es: "Conocimientos",
          en: "Knowledges",
          pt: "Conhecimentos",
          fr: "Connaissances",
          de: "Wissen",
          it: "Conoscenze"
        },
        fields: [
          {
            id: "academics",
            name: { es: "Academicismo", en: "Academics", pt: "Erudição", fr: "Érudition", de: "Akademiewissen", it: "Erudizione" },
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
            id: "law",
            name: { es: "Derecho", en: "Law", pt: "Direito", fr: "Droit", de: "Recht", it: "Diritto" },
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
            id: "science",
            name: { es: "Ciencia", en: "Science", pt: "Ciência", fr: "Science", de: "Wissenschaft", it: "Scienza" },
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
    id: "advantages",
    name: {
      es: "Ventajas",
      en: "Advantages",
      pt: "Vantagens",
      fr: "Avantages",
      de: "Vorteile",
      it: "Vantaggi"
    },
    subsections: [
      {
        id: "advantages_disciplines",
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
        id: "advantages_backgrounds",
        name: {
          es: "Trasfondo",
          en: "Backgrounds",
          pt: "Origens",
          fr: "Antécédents",
          de: "Hintergründe",
          it: "Antefatti"
        },
        fields: [
          {
            id: "backgrounds",
            name: { es: "Trasfondos", en: "Backgrounds", pt: "Origens", fr: "Antécédents", de: "Hintergründe", it: "Antefatti" },
            type: "text",
            optional: true
          }
        ]
      },
      {
        id: "advantages_virtues",
        name: {
          es: "Virtudes",
          en: "Virtues",
          pt: "Virtudes",
          fr: "Vertus",
          de: "Tugenden",
          it: "Virtù"
        },
        fields: [
          {
            id: "conscience",
            name: { es: "Conciencia", en: "Conscience", pt: "Consciência", fr: "Conscience", de: "Gewissen", it: "Coscienza" },
            type: "dots",
            optional: true
          },
          {
            id: "self_control",
            name: { es: "Autocontrol", en: "Self-Control", pt: "Autocontrole", fr: "Maîtrise de soi", de: "Selbstbeherrschung", it: "Autocontrollo" },
            type: "dots",
            optional: true
          },
          {
            id: "courage",
            name: { es: "Valor", en: "Courage", pt: "Coragem", fr: "Courage", de: "Mut", it: "Coraggio" },
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
        id: "other_traits_resources",
        name: {
          es: "Recursos",
          en: "Resources",
          pt: "Recursos",
          fr: "Ressources",
          de: "Ressourcen",
          it: "Risorse"
        },
        fields: [
          {
            id: "humanity",
            name: { es: "Humanidad", en: "Humanity", pt: "Humanidade", fr: "Humanité", de: "Menschlichkeit", it: "Umanità" },
            type: "dots",
            optional: true
          },
          {
            id: "willpower",
            name: { es: "Fuerza de Voluntad", en: "Willpower", pt: "Força de Vontade", fr: "Volonté", de: "Willenskraft", it: "Volontà" },
            type: "dots",
            optional: true
          },
          {
            id: "blood_pool",
            name: { es: "Reserva de Sangre", en: "Blood Pool", pt: "Reserva de Sangue", fr: "Réserve de Sang", de: "Blutreserve", it: "Riserva di Sangue" },
            type: "number",
            optional: true
          }
        ]
      },
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
        id: "other_traits_merits_flaws",
        name: {
          es: "Méritos y Defectos",
          en: "Merits and Flaws",
          pt: "Méritos e Falhas",
          fr: "Mérites et Défauts",
          de: "Verdienste und Fehler",
          it: "Meriti e Difetti"
        },
        fields: [
          {
            id: "merits_flaws",
            name: { es: "Méritos y Defectos", en: "Merits and Flaws", pt: "Méritos e Falhas", fr: "Mérites et Défauts", de: "Verdienste und Fehler", it: "Meriti e Difetti" },
            type: "textarea",
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
