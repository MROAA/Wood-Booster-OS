// Hearthwood - playable hero identity (docs/hearthwood-hero-avatars-prd.md).
// All seven Commanders are drawn: Tommy (orange cat), Aatos (white
// reindeer), Repo (fox - Marc's call, the PRD said robot), Fenrir (wolf),
// Kaski (lynx), Louhi (bear) and Lehva (mountain hare). Pure data: the drawing
// lives in HeroAvatar.jsx and reads `palette`, so a new skin is one entry
// here and never a redraw - the silhouette (the identity) stays the same.
//
// Gameplay numbers live in characters.js; this file only says who the
// hero IS: role, energy, strength, weakness, and the personality - three
// traits, a short persona that fits the First Song story, a quirk, and
// one voice line per reaction (start / joy / hurt / victory / defeat).

export const HERO_SKIN_COST = 40

export const HEROES = {
  tommy: {
    id: "tommy",
    traits: ["Clever", "Curious", "Fearless"],
    persona: "A barn cat who followed a stray spark into the Hearthwood and never went home. Tommy is the sharpest mind in the squad - reads a fight three moves ahead, then strikes first.",
    quirk: "Counts the enemy's weak spots out loud before every battle.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Three weak spots. I've counted. Let's go.",
      joy: "Called it.",
      hurt: "Didn't see that one. Won't happen twice.",
      victory: "Exactly as I figured.",
      defeat: "Nine lives... I'll think of something.",
    },
    kind: "cat",
    role: "Attacker",
    energy: "Spark",
    strength: "Fast damage",
    weakness: "More fragile",
    squadBenefit: "Removes threats",
    skins: {
      default: {
        name: "Tommy",
        palette: {
          fur: "#e8862e", furLight: "#f6b260", furDark: "#b25a17", stripe: "#9a4710",
          cream: "#fbecd2", earInner: "#e9a39a", eye: "#9cc95a", nose: "#d9787a",
          scarf: "#3f6b3a", scarfDark: "#284a27", accent: "#ffb347",
          bgInner: "#7a4a1f", bgOuter: "#1d1a10",
        },
      },
      ember: {
        name: "Emberwhisker",
        rare: true,
        blurb: "Stripes that smoulder like banked coals.",
        palette: {
          fur: "#c4421c", furLight: "#ec7a3a", furDark: "#7e2410", stripe: "#ffcf5a",
          cream: "#ffe3b8", earInner: "#ff9a5c", eye: "#ffd54a", nose: "#a8322a",
          scarf: "#2b2a24", scarfDark: "#15140f", accent: "#ffcf5a",
          bgInner: "#8a2d10", bgOuter: "#1a0c07", glow: true,
        },
      },
    },
  },
  aatos: {
    id: "aatos",
    traits: ["Funny", "Kind", "Optimistic"],
    persona: "An old white reindeer who laughs at storms - and at every joke, especially the bad ones. Aatos keeps the squad standing with a heal in one hoof and a terrible pun in the other.",
    quirk: "Tells the same three jokes before every fight, and laughs at all of them.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Why did the troll cross the clearing? Let's go find out!",
      joy: "Ho ho! Antler-iffic!",
      hurt: "Ouch! Lucky I wasn't using that ear.",
      victory: "Now THAT was a deer-cisive win!",
      defeat: "Well... that one wasn't funny.",
    },
    kind: "reindeer",
    role: "Healer",
    energy: "Wildstrength",
    strength: "Keeps the squad up",
    weakness: "Little attack pressure",
    squadBenefit: "Keeps allies alive",
    skins: {
      default: {
        name: "Aatos",
        palette: {
          fur: "#f1f3f4", furLight: "#ffffff", furDark: "#bcc8d2", antler: "#d9cfb8", antlerDark: "#a39577",
          muzzle: "#e3e8ec", nose: "#6e6066", eye: "#3a3236", scarf: "#5c7f45", scarfDark: "#3d5a2e",
          accent: "#9fd3f0", bgInner: "#5d7d93", bgOuter: "#141c22",
        },
      },
      aurora: {
        name: "Aurora Crown",
        rare: true,
        blurb: "Antlers lit by the northern lights.",
        palette: {
          fur: "#e8eef6", furLight: "#ffffff", furDark: "#a9b9cf", antler: "#8ff0c8", antlerDark: "#8a6fd8",
          muzzle: "#dce6f2", nose: "#5a4f6e", eye: "#2c2640", scarf: "#3b4f8a", scarfDark: "#273463",
          accent: "#a7ffde", bgInner: "#2f4f6e", bgOuter: "#0c1020", glow: true,
        },
      },
    },
  },
  fenrir: {
    id: "fenrir",
    traits: ["Fierce", "Proud", "Restless"],
    persona: "Named for the wolf the old gods chained. Fenrir broke that chain long ago and still wears the pieces, so no one forgets it broke.",
    quirk: "Will not take a single step back - not even to dodge.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Bring me something worth biting.",
      joy: "MORE!",
      hurt: "Good. Now I'm angry.",
      victory: "The chain never held. Nothing holds.",
      defeat: "Not... yet...",
    },
    kind: "wolf",
    role: "Berserker",
    energy: "Bloodrage",
    strength: "Hits harder when hurt",
    weakness: "Risky at low health",
    squadBenefit: "Turns wounds into damage",
    skins: {
      default: {
        name: "Fenrir",
        palette: {
          fur: "#7d8288", furLight: "#a9adb2", furDark: "#3e4146", cream: "#d9d6cf", eye: "#f0a21c",
          nose: "#16120f", chain: "#8d9399", chainDark: "#4b4f55", accent: "#d23a2a", scar: "#8a3a30",
          bgInner: "#5a2a24", bgOuter: "#120c0b",
        },
      },
      gleipnir: {
        name: "Gleipnir Unbound",
        rare: true,
        blurb: "The binding that could not hold him, glowing in pieces.",
        palette: {
          fur: "#3a3d44", furLight: "#5d626b", furDark: "#18191d", cream: "#c4ccd8", eye: "#ffe27a",
          nose: "#0c0a09", chain: "#ffd36b", chainDark: "#b07a1e", accent: "#ffd36b", scar: "#c06a3a",
          bgInner: "#3a2c5a", bgOuter: "#0b0a14", glow: true,
        },
      },
    },
  },
  repo: {
    id: "repo",
    traits: ["Quick", "Loyal", "Inventive"],
    persona: "A fox who dug a humming turquoise stone out of a buried forge. Repo is the fastest paw in the Hearthwood - already across the clearing, shield up, before anyone else has moved.",
    quirk: "Can never stand still - taps a paw whenever someone else is taking their turn.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Already in position. Keep up!",
      joy: "Blink and you missed it!",
      hurt: "Too slow - that one's on me.",
      victory: "First in, last out. Done.",
      defeat: "Couldn't... outrun that one.",
    },
    kind: "fox",
    role: "Defender",
    energy: "Copper Charge",
    strength: "Shields and control",
    weakness: "Slower attack",
    squadBenefit: "Protects the vulnerable",
    skins: {
      default: {
        name: "Repo",
        palette: {
          fur: "#b8632a", furLight: "#d98a45", furDark: "#7a3c17", earTip: "#3a2418",
          cream: "#f4ead8", earInner: "#e8c6a4", eye: "#e7a83a", nose: "#2a1c16",
          strap: "#5b3a22", brass: "#c79a4a", gem: "#3fe0d0", moss: "#5f8a3a",
          bgInner: "#2f5a45", bgOuter: "#0f1a14",
        },
      },
      copperwork: {
        name: "Copperwork Fox",
        rare: true,
        blurb: "A forgotten-forge mask, overgrown with moss.",
        palette: {
          fur: "#9a5a2e", furLight: "#c7854a", furDark: "#5e3216", earTip: "#2a1d14",
          cream: "#e6dccb", earInner: "#d6ae7c", eye: "#4ff5e2", nose: "#1c1410",
          strap: "#4a3020", brass: "#d9a75a", gem: "#4ff5e2", moss: "#6f9a42",
          bgInner: "#1f4a4a", bgOuter: "#0a1414", glow: true, plated: true,
        },
      },
    },
  },
  kaski: {
    id: "kaski",
    traits: ["Patient", "Sly", "Unsettling"],
    persona: "A lynx who walks the burned clearings. Kaski believes every fire makes room for something new - and is happy to wait while it spreads.",
    quirk: "Smells of smoke, even after rain.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Let it smoulder.",
      joy: "It's spreading nicely.",
      hurt: "Hm. You'll regret that. Slowly.",
      victory: "Ash makes good soil.",
      defeat: "The embers... remember me.",
    },
    kind: "lynx",
    role: "Afflicter",
    energy: "Blight",
    strength: "Poison and weakness",
    weakness: "Slow to finish a foe",
    squadBenefit: "Wears enemies down",
    skins: {
      default: {
        name: "Kaski",
        palette: {
          fur: "#6e6458", furLight: "#958a7b", furDark: "#3c342c", cream: "#d8cfc0", earTip: "#e0682a",
          eye: "#a4e04a", nose: "#4a3a36", spot: "#2e2722", cloak: "#3a3632", cloakDark: "#211e1b",
          ember: "#f08a2c", blight: "#9ad040", bgInner: "#3e3a22", bgOuter: "#0f0e0a",
        },
      },
      wildfire: {
        name: "Wildfire",
        rare: true,
        blurb: "The burn season, walking.",
        palette: {
          fur: "#a4552a", furLight: "#d3803e", furDark: "#5a2812", cream: "#f2d6b0", earTip: "#ffd04a",
          eye: "#ffe066", nose: "#3a1e14", spot: "#3a160a", cloak: "#2a1a12", cloakDark: "#140b07",
          ember: "#ffb02e", blight: "#ff7a2a", bgInner: "#6a2410", bgOuter: "#140805", glow: true,
        },
      },
    },
  },
  louhi: {
    id: "louhi",
    traits: ["Stubborn", "Steady", "Protective"],
    persona: "Old as the northern hills, Louhi carries granite on both shoulders and moves only when the mountain agrees. Nothing passes a line Louhi holds.",
    quirk: "Speaks in as few words as possible.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Stand behind me.",
      joy: "Hmph. Good.",
      hurt: "Stone chips. Stone stays.",
      victory: "The mountain is still here.",
      defeat: "Even mountains... wear down.",
    },
    kind: "bear",
    role: "Bulwark",
    energy: "Stoneheart",
    strength: "Armour every round",
    weakness: "Slow and low damage",
    squadBenefit: "Nobody breaks the line",
    skins: {
      default: {
        name: "Louhi",
        palette: {
          fur: "#6b4a30", furLight: "#8e6744", furDark: "#3a2616", muzzle: "#b89470", eye: "#1e140c",
          nose: "#140d08", stone: "#8a8a84", stoneDark: "#55554f", lichen: "#b8c46a", accent: "#ffd27a",
          bgInner: "#4a4a3c", bgOuter: "#11110d",
        },
      },
      frostpeak: {
        name: "Frostpeak",
        rare: true,
        blurb: "Granite under a winter that never ends.",
        palette: {
          fur: "#c9c4b8", furLight: "#efebe2", furDark: "#8a8478", muzzle: "#e6dfd0", eye: "#1a1e26",
          nose: "#1a1a20", stone: "#9fb2c4", stoneDark: "#5f7286", lichen: "#e8f4ff", accent: "#8fe0ff",
          bgInner: "#3a5268", bgOuter: "#0c121a", glow: true,
        },
      },
    },
  },
  lehva: {
    id: "lehva",
    traits: ["Gentle", "Shy", "Hopeful"],
    persona: "A mountain hare crowned in birch leaves who can hear saplings grow. Lehva never wins a fight quickly - but nothing the grove protects stays broken for long.",
    quirk: "Plants a seed on every battlefield before leaving.",
    // Hand-authored voice lines - one per reaction (HeroAvatar moods).
    lines: {
      start: "Little roots, hold fast.",
      joy: "Oh! It's working!",
      hurt: "Eek - I'm fine, I'm fine!",
      victory: "Everyone mended. Everyone home.",
      defeat: "The grove will grow back...",
    },
    kind: "hare",
    role: "Mender",
    energy: "Saplingsong",
    strength: "Healing over time",
    weakness: "Weak in a fast fight",
    squadBenefit: "Outlasts the enemy",
    skins: {
      default: {
        name: "Lehva",
        palette: {
          fur: "#a08466", furLight: "#c4a888", furDark: "#6a5440", cream: "#f3ece0", earInner: "#e8b7a8",
          earTip: "#2e241c", eye: "#5a3a1c", nose: "#d98a8a", leaf: "#7fb04a", leafDark: "#4f7a2c",
          berry: "#c8283a", cloak: "#4f6f3a", cloakDark: "#33502a", bgInner: "#4c6a34", bgOuter: "#10160c",
        },
      },
      winter: {
        name: "Winter Hare",
        rare: true,
        blurb: "Snow-white, crowned in frost.",
        palette: {
          fur: "#eef1f4", furLight: "#ffffff", furDark: "#b8c2cc", cream: "#ffffff", earInner: "#e8c8cc",
          earTip: "#2a2a30", eye: "#3a2a4a", nose: "#d8a0a8", leaf: "#bfe6f6", leafDark: "#7ab0cc",
          berry: "#7ad0ff", cloak: "#5a7898", cloakDark: "#3a5470", bgInner: "#4a6c88", bgOuter: "#0c121a", glow: true,
        },
      },
    },
  },
}

// characters.js `art` key -> drawn hero, so callers that only hold a
// Commander's art key (battle tokens) can find the drawing.
const HERO_BY_ART = { cat: "tommy", reindeer: "aatos", fox: "repo", wolf: "fenrir", shadow: "kaski", stone: "louhi", grove: "lehva" }

export function heroIdForArt(art) {
  return HERO_BY_ART[art] || null
}

export function isDrawnHero(id) {
  return !!HEROES[id]
}

export function skinFor(heroId, skinId) {
  const hero = HEROES[heroId]
  if (!hero) return null
  return hero.skins[skinId] || hero.skins.default
}

export function rareSkinsOf(heroId) {
  const hero = HEROES[heroId]
  if (!hero) return []
  return Object.entries(hero.skins)
    .filter(([, s]) => s.rare)
    .map(([id, s]) => ({ id, ...s }))
}

export function heroLine(heroId, moment) {
  return HEROES[heroId]?.lines?.[moment] || null
}
