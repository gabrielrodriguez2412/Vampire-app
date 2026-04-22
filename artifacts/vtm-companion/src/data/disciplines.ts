export interface Power {
  name: string;
  level: number;
  description: string;
  tacticalUse: string;
}

export interface Discipline {
  id: string;
  name: string;
  type: string;
  description: string;
  powers: Power[];
  narrativeUses: string[];
  clansWhoUse: string[];
}

export const disciplines: Discipline[] = [
  {
    id: "animalism",
    name: "Animalism",
    type: "Mental",
    description: "The supernatural affinity with and control over the beast. It allows communication with animals, drawing familiars, and even cowing the Beast in others.",
    powers: [
      { name: "Bond Famulus", level: 1, description: "Bind an animal to you as a loyal familiar.", tacticalUse: "Create an untraceable spy or a minor combat ally." },
      { name: "Sense the Beast", level: 1, description: "Sense the emotional state and true nature of the beast in others.", tacticalUse: "Determine if someone is a vampire or close to frenzy." },
      { name: "Feral Whispers", level: 2, description: "Communicate clearly with animals.", tacticalUse: "Gather information from rats, birds, or dogs." },
      { name: "Quell the Beast", level: 3, description: "Force the Beast in another into submission, causing apathy.", tacticalUse: "Stop a frenzying vampire or pacify an aggressive mortal." },
      { name: "Subsume the Spirit", level: 4, description: "Transfer your consciousness into an animal.", tacticalUse: "Perfect infiltration or escape." },
      { name: "Animal Dominion", level: 5, description: "Command entire swarms or packs of animals.", tacticalUse: "Overwhelm enemies with swarms of rats or birds." }
    ],
    narrativeUses: [
      "Using the local rat population as a city-wide surveillance network.",
      "Calming a tense negotiation by subtly applying Quell the Beast.",
      "Hiding in plain sight as a stray dog during the day."
    ],
    clansWhoUse: ["Gangrel", "Nosferatu", "Ravnos"]
  },
  {
    id: "auspex",
    name: "Auspex",
    type: "Sensory",
    description: "Extrasensory perception, awareness, and premonitions. Auspex pierces illusions, reads minds, and sees the unseen.",
    powers: [
      { name: "Heightened Senses", level: 1, description: "Vastly improve all normal senses.", tacticalUse: "Hear whispered conversations across a room or see in pitch black." },
      { name: "Sense the Unseen", level: 1, description: "Detect hidden entities, including Obfuscated vampires.", tacticalUse: "Counter stealth and discover spies." },
      { name: "Premonition", level: 2, description: "Receive sudden flashes of insight or visions of the future.", tacticalUse: "Avoid ambushes or solve mysteries through ST hints." },
      { name: "Scry the Soul", level: 3, description: "Read auras, detecting emotions, diablerie, and true nature.", tacticalUse: "Tell if someone is lying or gauge their emotional state." },
      { name: "Spirit's Touch", level: 4, description: "Read psychic impressions left on objects.", tacticalUse: "Reconstruct a crime scene by touching the murder weapon." },
      { name: "Telepathy", level: 5, description: "Read surface thoughts or project your own mind.", tacticalUse: "Extract secrets directly from a target's mind." }
    ],
    narrativeUses: [
      "Solving a murder by tasting the emotional residue left in the room.",
      "Acting as a flawless lie detector during Elysium politics.",
      "Sensing an assassin in the shadows before they strike."
    ],
    clansWhoUse: ["Malkavian", "Toreador", "Tremere", "Hecata", "Salubri"]
  },
  {
    id: "blood_sorcery",
    name: "Blood Sorcery",
    type: "Sorcery",
    description: "The use of vitae to perform unnatural magical effects. It requires study, willpower, and blood.",
    powers: [
      { name: "Corrosive Vitae", level: 1, description: "Turn your blood into a corrosive acid.", tacticalUse: "Melt through locks or deal aggravated damage at close range." },
      { name: "Extinguish Vitae", level: 2, description: "Force another vampire's blood to lose its potency.", tacticalUse: "Prevent an enemy from healing or using disciplines." },
      { name: "Blood of Potency", level: 3, description: "Temporarily lower your generation by concentrating your vitae.", tacticalUse: "Boost discipline resistance and rouse checks." },
      { name: "Theft of Vitae", level: 4, description: "Draw blood from a target at a distance.", tacticalUse: "Damage enemies while simultaneously feeding without a bite." },
      { name: "Baal's Caress", level: 5, description: "Transmute your blood into a lethal poison for mortals and Kindred alike.", tacticalUse: "Coat weapons in aggravated damage-dealing poison." }
    ],
    narrativeUses: [
      "Performing elaborate rituals to ward a haven.",
      "Using an enemy's spilled blood to track them across the city.",
      "Demonstrating power by turning a cup of wine to ash."
    ],
    clansWhoUse: ["Tremere", "Banu Haqim"]
  },
  {
    id: "celerity",
    name: "Celerity",
    type: "Physical",
    description: "Supernatural speed and reflexes. The vampire moves faster than the mortal eye can track.",
    powers: [
      { name: "Cat's Grace", level: 1, description: "Gain perfect balance and negate fall damage.", tacticalUse: "Escape across rooftops without risk." },
      { name: "Rapid Reflexes", level: 1, description: "React to danger instantly, ignoring minor penalties.", tacticalUse: "Dodge surprise attacks effortlessly." },
      { name: "Fleetness", level: 2, description: "Move at incredible speeds for short bursts.", tacticalUse: "Close the distance to a ranged attacker instantly." },
      { name: "Blink", level: 3, description: "Move faster than the eye can see in a single turn.", tacticalUse: "Appear behind an enemy or bypass security cameras." },
      { name: "Unerring Aim", level: 4, description: "Slow down your perception of time to make perfect strikes.", tacticalUse: "Never miss with firearms or thrown weapons." },
      { name: "Lightning Strike", level: 5, description: "Attack with blinding speed.", tacticalUse: "Devastate an opponent before they can react." }
    ],
    narrativeUses: [
      "Stealing an object from someone's hand without them noticing.",
      "Crossing a crowded room in the blink of an eye to intercept an assassin.",
      "Dodging bullets Matrix-style."
    ],
    clansWhoUse: ["Brujah", "Toreador", "Banu Haqim"]
  },
  {
    id: "dominate",
    name: "Dominate",
    type: "Mental",
    description: "The power to crush another's mind and force them to act according to your will. Requires eye contact.",
    powers: [
      { name: "Cloud Memory", level: 1, description: "Erase the last few minutes of a target's memory.", tacticalUse: "Cover up a feeding or a minor Masquerade breach." },
      { name: "Compel", level: 1, description: "Issue a single-word command the target must obey.", tacticalUse: "Tell a guard to 'Sleep' or an attacker to 'Drop' their weapon." },
      { name: "Mesmerize", level: 2, description: "Implant complex instructions in a target's mind.", tacticalUse: "Create sleeper agents or force someone to confess." },
      { name: "The Forgetful Mind", level: 3, description: "Rewrite a target's memories completely.", tacticalUse: "Create a false alibi or erase knowledge of vampires entirely." },
      { name: "Submerged Directive", level: 4, description: "Implant a command that triggers under specific conditions.", tacticalUse: "Set a trap that springs days or weeks later." },
      { name: "Mass Manipulation", level: 5, description: "Command a whole group of people at once.", tacticalUse: "Clear an entire room or turn a crowd into a weapon." }
    ],
    narrativeUses: [
      "Rewriting a mortal's life so they believe they are your loyal servant.",
      "Walking past security by telling them 'You see nothing'.",
      "Forcing a rival to hand over their most prized possession."
    ],
    clansWhoUse: ["Ventrue", "Tremere", "Lasombra", "Malkavian"]
  },
  {
    id: "obfuscate",
    name: "Obfuscate",
    type: "Stealth",
    description: "The power to vanish from the minds of onlookers. It is not true invisibility, but mental manipulation.",
    powers: [
      { name: "Cloak of Shadows", level: 1, description: "Remain unnoticed as long as you stay still and in the dark.", tacticalUse: "Eavesdrop on conversations by hiding in a corner." },
      { name: "Unseen Passage", level: 2, description: "Move around while remaining entirely unnoticed by those around you.", tacticalUse: "Walk through a heavily guarded building completely ignored." },
      { name: "Ghost in the Machine", level: 3, description: "Extend your Obfuscate to hide from cameras and electronic sensors.", tacticalUse: "Infiltrate modern secure facilities without leaving a trace." },
      { name: "Vanish", level: 4, description: "Disappear instantly, even while being observed.", tacticalUse: "Escape immediately from a losing battle." },
      { name: "Cloak the Gathering", level: 5, description: "Extend your invisibility to a group of allies.", tacticalUse: "Sneak an entire coterie into an enemy stronghold." }
    ],
    narrativeUses: [
      "Standing in the center of an Elysium, observing everyone while no one sees you.",
      "Appearing seemingly out of thin air to deliver a threat.",
      "Bypassing the city's most advanced security systems effortlessly."
    ],
    clansWhoUse: ["Nosferatu", "Malkavian", "Banu Haqim", "Ministry", "Ravnos"]
  },
  {
    id: "presence",
    name: "Presence",
    type: "Social",
    description: "The supernatural ability to attract, terrify, and manipulate emotions. Unlike Dominate, it affects emotions rather than the rational mind.",
    powers: [
      { name: "Awe", level: 1, description: "Make everyone around you fascinated and drawn to you.", tacticalUse: "Ensure everyone listens to your speech; gain bonuses to social rolls." },
      { name: "Daunt", level: 1, description: "Project an aura of menace and authority.", tacticalUse: "Intimidate rivals or force weak enemies to flee." },
      { name: "Lingering Kiss", level: 2, description: "Make your bite incredibly addictive to mortals.", tacticalUse: "Create a loyal herd of addicts." },
      { name: "Entrancement", level: 3, description: "Make a target temporarily obsessed with and utterly devoted to you.", tacticalUse: "Gain a powerful, temporary, and willing servant." },
      { name: "Summon", level: 4, description: "Call a person to you, no matter where they are.", tacticalUse: "Force a fleeing enemy or distant ally to come to your location." },
      { name: "Majesty", level: 5, description: "Inspire universal devotion and terror in an entire crowd.", tacticalUse: "End a battle instantly as enemies refuse to strike you." }
    ],
    narrativeUses: [
      "Walking into a hostile bar and having everyone offer to buy you a drink.",
      "Making an interrogator confess to *you* instead.",
      "Stopping a riot just by raising your hand."
    ],
    clansWhoUse: ["Toreador", "Brujah", "Ventrue", "Ministry", "Ravnos"]
  },
  {
    id: "protean",
    name: "Protean",
    type: "Transformation",
    description: "The ability to alter the vampire's physical form, growing claws, meld with the earth, or shape-shift into animals.",
    powers: [
      { name: "Eyes of the Beast", level: 1, description: "Gain glowing red eyes that see perfectly in pitch black.", tacticalUse: "Fight in absolute darkness with no penalties." },
      { name: "Weight of the Feather", level: 1, description: "Reduce your mass to be practically weightless.", tacticalUse: "Walk on snow without leaving tracks or survive huge falls." },
      { name: "Feral Weapons", level: 2, description: "Grow claws that deal aggravated damage.", tacticalUse: "Devastate vampires in melee combat." },
      { name: "Earth Meld", level: 3, description: "Sink into the earth to sleep during the day.", tacticalUse: "Rest safely anywhere there is natural soil." },
      { name: "Shapechange", level: 4, description: "Transform into a specific animal (usually a wolf).", tacticalUse: "Travel quickly or fight with feral strength." },
      { name: "Mist Form", level: 5, description: "Turn your body into an intangible mist.", tacticalUse: "Become immune to most physical attacks and escape through vents." }
    ],
    narrativeUses: [
      "Surviving a daytime ambush by sinking into the dirt of a basement.",
      "Tearing through a rival's armor with supernatural claws.",
      "Infiltrating a penthouse by drifting through the air conditioning as mist."
    ],
    clansWhoUse: ["Gangrel", "Ministry"]
  }
];