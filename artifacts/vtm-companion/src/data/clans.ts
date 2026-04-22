export interface Clan {
  id: string;
  name: string;
  description: string;
  identity: string;
  weakness: string;
  disciplines: string[];
  playstyle: string;
  roleplayIdeas: string[];
  relationships: string;
  color: string;
  icon: string;
}

export const clans: Clan[] = [
  {
    id: "brujah",
    name: "Brujah",
    description: "Rebels, idealists, and fighters who champion causes both noble and chaotic. They are the passionate heart of the undead.",
    identity: "The Rabble, Idealists, Philosophers",
    weakness: "Violent Temper: Their beast is easily provoked. They subtract dice equal to their Bane Severity from rolls to resist frenzy.",
    disciplines: ["Celerity", "Potence", "Presence"],
    playstyle: "Aggressive, social, and physically imposing. Great for players who want to take action and lead revolutions.",
    roleplayIdeas: [
      "A punk rocker still fighting the system.",
      "A former debate team captain who uses words as weapons.",
      "A disillusioned veteran seeking a new war."
    ],
    relationships: "Distrust the Ventrue, relate to the Gangrel, tolerate the Toreador.",
    color: "#8B0000",
    icon: "🔥"
  },
  {
    id: "gangrel",
    name: "Gangrel",
    description: "Feral survivors who walk the line between man and beast, often preferring the company of animals to other Kindred.",
    identity: "Outcasts, Wanderers, Beasts",
    weakness: "Animal Features: When they frenzy, they gain an animalistic trait temporarily, losing 1 point from a social attribute.",
    disciplines: ["Animalism", "Fortitude", "Protean"],
    playstyle: "Independent, resilient, and deeply connected to their primal nature. Perfect for solitary or combat-capable characters.",
    roleplayIdeas: [
      "An urban explorer who knows every hidden path.",
      "A park ranger who prefers the woods to the city.",
      "A street-smart survivor who speaks to stray dogs."
    ],
    relationships: "Respect the Brujah, avoid the Tremere, pity the Nosferatu.",
    color: "#556B2F",
    icon: "🐺"
  },
  {
    id: "malkavian",
    name: "Malkavian",
    description: "Seers and mad prophets cursed with fractured minds, but gifted with insights others cannot comprehend.",
    identity: "Oracles, Lunatics, Visionaries",
    weakness: "Affliction: Suffer from a derangement that complicates their unlife, worsening when they experience Bestial Failures.",
    disciplines: ["Auspex", "Dominate", "Obfuscate"],
    playstyle: "Mysterious, unpredictable, and insightful. Excellent for players who enjoy psychological horror and unearthing secrets.",
    roleplayIdeas: [
      "A conspiracy theorist who is actually right.",
      "A child psychologist who speaks to invisible friends.",
      "A late-night radio host broadcasting cryptic warnings."
    ],
    relationships: "Fascinate the Toreador, unnerve the Ventrue, understand the Nosferatu.",
    color: "#4B0082",
    icon: "👁️"
  },
  {
    id: "nosferatu",
    name: "Nosferatu",
    description: "Horrifically deformed by the Embrace, they hide in the shadows and gather secrets, serving as the ultimate spies.",
    identity: "Sewer Rats, Information Brokers, The Hidden",
    weakness: "Hideous Appearance: They are physically repulsive. Any attempt to blend in as human is significantly penalized.",
    disciplines: ["Animalism", "Obfuscate", "Potence"],
    playstyle: "Stealthy, investigative, and cunning. Ideal for players who want to manipulate events from the darkness.",
    roleplayIdeas: [
      "A former model adjusting to a monstrous new reality.",
      "A hacker who operates from abandoned subway tunnels.",
      "A voyeur who records the indiscretions of the elite."
    ],
    relationships: "Trade with the Tremere, hide from the Toreador, ally with the Malkavians.",
    color: "#2F4F4F",
    icon: "🦇"
  },
  {
    id: "toreador",
    name: "Toreador",
    description: "Aesthetes and social manipulators obsessed with beauty, art, and the fleeting passions of mortals.",
    identity: "Degenerates, Artists, Divas",
    weakness: "Aesthetic Fixation: They can become entranced by beauty, losing focus on their surroundings for an entire scene.",
    disciplines: ["Auspex", "Celerity", "Presence"],
    playstyle: "Charming, perceptive, and socially dominant. Best for players focusing on manipulation, high society, and emotion.",
    roleplayIdeas: [
      "A struggling artist who uses their blood to inspire genius.",
      "A club promoter who decides who is 'in' and who is out.",
      "A critic whose review can destroy a mortal's life."
    ],
    relationships: "Adore the Brujah's passion, despise the Nosferatu, envy the Ventrue.",
    color: "#C71585",
    icon: "🌹"
  },
  {
    id: "tremere",
    name: "Tremere",
    description: "Secretive blood sorcerers who use rigid hierarchies and occult knowledge to maintain power in the modern nights.",
    identity: "Warlocks, Usurpers, Scholars",
    weakness: "Deficient Blood: Tremere cannot Blood Bond other Kindred. Their blood is inherently weaker in forming unnatural ties.",
    disciplines: ["Auspex", "Blood Sorcery", "Dominate"],
    playstyle: "Mystical, academic, and authoritative. Suited for players who want to master arcane arts and unravel mysteries.",
    roleplayIdeas: [
      "An occult antiquarian seeking forbidden texts.",
      "A strict professor who demands perfection from their apprentices.",
      "A rogue sorcerer fleeing the remains of the Pyramid."
    ],
    relationships: "Rival the Ventrue, use the Nosferatu, study the Malkavians.",
    color: "#800000",
    icon: "🩸"
  },
  {
    id: "ventrue",
    name: "Ventrue",
    description: "The self-proclaimed rulers of the Kindred. Aristocrats, politicians, and CEOs who demand obedience and enforce the Masquerade.",
    identity: "Blue Bloods, Tyrants, Patricians",
    weakness: "Rarefied Tastes: They can only feed from a very specific type of mortal (e.g., only blondes, only millionaires).",
    disciplines: ["Dominate", "Fortitude", "Presence"],
    playstyle: "Commanding, resilient, and wealthy. Perfect for players who want to be the boss and control the board.",
    roleplayIdeas: [
      "A ruthless corporate raider expanding their empire.",
      "A political fixer who ensures the 'right' candidate wins.",
      "An old-world noble adapting to modern finance."
    ],
    relationships: "Command the Tremere, oppose the Brujah, patronize the Toreador.",
    color: "#000080",
    icon: "👑"
  },
  {
    id: "banu_haqim",
    name: "Banu Haqim",
    description: "Assassins, judges, and scholars of the blood. They enforce their own strict codes of justice upon the undead.",
    identity: "Assassins, Judges, The Children of Haqim",
    weakness: "Blood Addiction: They are drawn to Kindred vitae. If they taste it, it is exceptionally hard for them to stop drinking.",
    disciplines: ["Blood Sorcery", "Celerity", "Obfuscate"],
    playstyle: "Lethal, disciplined, and righteous. Great for playing an enforcer, a silent killer, or a devout scholar.",
    roleplayIdeas: [
      "A street vigilante targeting corrupt mortals.",
      "A scholar of ancient laws interpreting them for modern nights.",
      "A hitman for hire with a strict moral code."
    ],
    relationships: "Judge the Tremere, respect the Ventrue, monitor the Ministry.",
    color: "#2E2B5F",
    icon: "⚖️"
  },
  {
    id: "hecata",
    name: "Hecata",
    description: "A twisted family of necromancers, death cultists, and outcasts who manipulate the underworld and ghosts.",
    identity: "Necromancers, The Clan of Death",
    weakness: "Painful Kiss: Their bite causes excruciating pain rather than the usual ecstasy, making feeding difficult to conceal.",
    disciplines: ["Auspex", "Fortitude", "Oblivion"],
    playstyle: "Morbid, wealthy, and spiritually attuned. Good for exploring the afterlife, mafia-style family dynamics, and occult secrets.",
    roleplayIdeas: [
      "A mortician who learns secrets from the dead.",
      "A mob enforcer who cleans up 'messes'.",
      "A spiritual medium who genuinely summons the departed."
    ],
    relationships: "Isolate from the Camarilla, deal with the Lasombra, exploit the mortal underworld.",
    color: "#4A4A4A",
    icon: "💀"
  },
  {
    id: "lasombra",
    name: "Lasombra",
    description: "Ruthless social Darwinists who manipulate shadows and faith. Many are refugees from the crumbling Sabbat.",
    identity: "Keepers, Shadow Manipulators, Turncoats",
    weakness: "Defective Reflection: They cast no reflection or a distorted one, and technology glitches around them.",
    disciplines: ["Dominate", "Oblivion", "Potence"],
    playstyle: "Ambitious, manipulative, and intimidating. Ideal for playing a cutthroat survivor or a dark priest.",
    roleplayIdeas: [
      "A defector offering Sabbat secrets for a seat in Elysium.",
      "A corrupt priest maintaining control over a parish.",
      "A ruthless venture capitalist who operates only at night."
    ],
    relationships: "Compete with Ventrue, disdain the Brujah, cautiously approach the Hecata.",
    color: "#1A1A1A",
    icon: "🌑"
  },
  {
    id: "ministry",
    name: "Ministry",
    description: "Tempters, liberators, and cult leaders who believe they free souls by breaking down moral boundaries.",
    identity: "Followers of Set, Tempters, Serpents",
    weakness: "Light Sensitivity: They suffer far worse damage and penalties from sunlight and intense bright lights.",
    disciplines: ["Obfuscate", "Presence", "Protean"],
    playstyle: "Seductive, subversive, and charismatic. Best for players who want to corrupt, recruit, and build cults of personality.",
    roleplayIdeas: [
      "A charismatic self-help guru with dark ulterior motives.",
      "An underground club owner dealing in illicit desires.",
      "A street preacher offering salvation through sin."
    ],
    relationships: "Tempt the Toreador, antagonize the Banu Haqim, relate to the Malkavians.",
    color: "#B8860B",
    icon: "🐍"
  },
  {
    id: "ravnos",
    name: "Ravnos",
    description: "Doomed wanderers and masters of illusion. Their clan was nearly annihilated, making them desperate survivors.",
    identity: "Deceivers, Rogues, Daredevils",
    weakness: "Doomed to Wander: If they slumber in the same place more than once in seven nights, they suffer severe damage.",
    disciplines: ["Animalism", "Obfuscate", "Presence"],
    playstyle: "Tricky, mobile, and deceitful. Perfect for a nomadic con artist or a desperate survivor running from their past.",
    roleplayIdeas: [
      "A grifter running elaborate supernatural scams.",
      "A courier who transports illegal goods across domains.",
      "An illusionist performing in underground theaters."
    ],
    relationships: "Evade the Ventrue, trade with the Gangrel, trick the Tremere.",
    color: "#CD5C5C",
    icon: "🃏"
  },
  {
    id: "salubri",
    name: "Salubri",
    description: "Hunted healers with three eyes. They seek Golconda and are relentlessly pursued by the Tremere and others.",
    identity: "Cyclops, Healers, Soulsuckers",
    weakness: "Prey Exclusion: They can only feed from those who give genuine, willing consent. Feeding without consent causes severe penalties.",
    disciplines: ["Auspex", "Fortitude", "Valeren"],
    playstyle: "Altruistic, hunted, and spiritually focused. Suited for a tragedy-driven chronicle or playing a genuine saint among monsters.",
    roleplayIdeas: [
      "An underground doctor running a free clinic for mortals and monsters.",
      "A hunted saint seeking the mythical state of Golconda.",
      "A quiet observer hiding their third eye beneath a bandana."
    ],
    relationships: "Hunted by Tremere, pitied by Malkavians, seek out the humane.",
    color: "#F0E68C",
    icon: "👁️‍🗨️"
  }
];