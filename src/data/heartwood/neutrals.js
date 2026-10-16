// Hearthwood - DOTA DEPTH 2: NEUTRAL ITEMS (Dota 2's neutral drops).
// Won fights - elites and bosses most of all - sometimes drop a neutral
// item. Neutrals are small, quirky trinkets, most of them about the class
// resource (mana is the core fun system). Every hero has ONE neutral slot
// of its own, apart from the gear row; spare neutrals wait in the stash.
// Tiers open as the story goes on (Act / campaign chapter) - an Act I
// fight only drops tier 1.
//
// Pure data - Studio-editable (Hearthwood Studio > ✦ Talents & Neutrals).
// Rules: services/heartwood/neutrals.js (drops, slot, stash) and
// services/heartwood/tacticsTalents.js (the effects in a fight - the same
// fx keys as a talent, see data/heartwood/talents.js).

// Tier -> the first Act it can drop in.
export const NEUTRAL_TIERS = {
  1: { tier: 1, act: 1, name: "Tier I", color: "#9fb07a" },
  2: { tier: 2, act: 2, name: "Tier II", color: "#7fb3a6" },
  3: { tier: 3, act: 3, name: "Tier III", color: "#8f9fd6" },
  4: { tier: 4, act: 5, name: "Tier IV", color: "#c58fd0" },
  5: { tier: 5, act: 7, name: "Tier V", color: "#e0b25a" },
}

// Drop chance per won fight by node type (the rest never drop).
export const NEUTRAL_DROP_CHANCE = { battle: 0.15, elite: 0.6, miniboss: 1, boss: 1 }

export const NEUTRAL_ITEMS = {
  // --- Tier I ---
  "sap-dewdrop": { id: "sap-dewdrop", tier: 1, name: "Sap Dewdrop", icon: "💧", text: "+5 resource at the start of every turn.", fx: { regen: 5 } },
  "pocket-acorn": { id: "pocket-acorn", tier: 1, name: "Pocket Acorn", icon: "🌰", text: "+4 max HP. It keeps rattling.", fx: { hp: 4 } },
  "glimmer-moth": { id: "glimmer-moth", tier: 1, name: "Glimmer Moth in a Jar", icon: "✦", text: "The first class skill each fight costs no resource.", fx: { firstFree: true } },
  "fox-tooth": { id: "fox-tooth", tier: 1, name: "Fox Tooth", icon: "🦊", text: "+1 attack, and every kill gives 10 resource.", fx: { attack: 1, killMana: 10 } },
  // --- Tier II ---
  "wisp-lantern": { id: "wisp-lantern", tier: 2, name: "Wisp Lantern", icon: "🏮", text: "+20 max resource, and it starts that much fuller.", fx: { manaPool: 20 } },
  "thiefs-glove": { id: "thiefs-glove", tier: 2, name: "Mana-Thief's Glove", icon: "🧤", text: "Every basic hit it lands gives 6 resource.", fx: { hitMana: 6 } },
  "treant-shard": { id: "treant-shard", tier: 2, name: "Treant Shard", icon: "🪵", text: "Starts every fight with 1 Ward and +3 max HP.", fx: { ward: 1, hp: 3 } },
  "echo-quill": { id: "echo-quill", tier: 2, name: "Quill of Echoes", icon: "🪶", text: "Every skill costs 15% less resource.", fx: { cheaper: 15 } },
  // --- Tier III ---
  "moonmoth-cloak": { id: "moonmoth-cloak", tier: 3, name: "Moonmoth Cloak", icon: "🦋", text: "30% of the damage it takes is paid from its resource instead of HP.", fx: { manaShield: 30 } },
  "ember-seed": { id: "ember-seed", tier: 3, name: "Ember Seed", icon: "🔥", text: "While its resource is 75%+ full: +2 damage.", fx: { mods: [{ when: "res75", dmg: 2, label: "Ember Seed" }] } },
  "hourglass-bark": { id: "hourglass-bark", tier: 3, name: "Hourglass Bark", icon: "⌛", text: "+1 movement.", fx: { move: 1 } },
  "wellspring-bead": { id: "wellspring-bead", tier: 3, name: "Wellspring Bead", icon: "🔮", text: "Every class skill cast gives back 8 resource.", fx: { castMana: 8 } },
  // --- Tier IV ---
  "stormheart-pearl": { id: "stormheart-pearl", tier: 4, name: "Stormheart Pearl", icon: "🌩", text: "+25 max resource and +5 at the start of every turn.", fx: { manaPool: 25, regen: 5 } },
  "thornvine-band": { id: "thornvine-band", tier: 4, name: "Thornvine Band", icon: "🌿", text: "+3 attack, but -3 max HP. It bites.", fx: { attack: 3, hp: -3 } },
  "quiet-bell": { id: "quiet-bell", tier: 4, name: "Bell That Won't Ring", icon: "🔕", text: "Every kill gives 25 resource and heals 3.", fx: { killMana: 25, killHeal: 3 } },
  // --- Tier V ---
  "worldtree-heart": { id: "worldtree-heart", tier: 5, name: "Heart of the World Tree", icon: "🌳", text: "+30 max resource (starts fuller) and every skill costs 20% less.", fx: { manaPool: 30, cheaper: 20 } },
  "star-crown": { id: "star-crown", tier: 5, name: "Crown of Quiet Stars", icon: "👑", text: "Every class skill cast gives back 15 resource, and 40% of damage taken is paid from it.", fx: { castMana: 15, manaShield: 40 } },
  "seven-league-root": { id: "seven-league-root", tier: 5, name: "Seven-League Root", icon: "🥾", text: "+2 movement and +1 AP on the first turn.", fx: { move: 2, headAp: 1 } },
}

export const neutralsOfTier = (tier) => Object.values(NEUTRAL_ITEMS).filter((n) => n.tier === tier)
