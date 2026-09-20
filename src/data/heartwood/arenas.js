// Hearthwood Trial - arena hazards. Marc: "areena-hasardit... taistelut
// vaihtelevat enemmän" - per-battle field modifiers so no two fights
// feel identical, the way a Slay the Spire room modifier works.
//
// An arena is pure data: a name, a one-line description, a `scope`
// (which side(s) it touches), and an `effects` list from the same
// vocabulary as relics/synergies. autoBattleEngine.js's startAutoBattle
// applies it once, at battle start, AFTER the DPS-based enemy HP
// scaling, so it lands as a raw overlay on an already-balanced fight.
//
// scope: "player"  - only your squad
//        "enemy"   - only the enemy formation
//        "both"    - every unit on the field
//
// Only a fraction of battles get an arena (see runEngine.js's
// arenaForNode) - a hazard should be an event, not the baseline.
// Deliberately no RNG: every effect is a flat, readable number a
// player can plan around, the game's standing "easy to play, hard to
// master" rule.
export const ARENAS = [
  {
    id: "overgrowth",
    name: "Overgrowth",
    description: "Thick bramble everywhere - easy to hunker down in, for anyone.",
    scope: "both",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 1 } }],
  },
  {
    id: "bloodmoon",
    name: "Blood Moon",
    description: "A red moon hangs low. Everything here fights harder and dies quicker.",
    scope: "both",
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "vulnerable", amount: 1 },
    ],
  },
  {
    id: "choking-mist",
    name: "Choking Mist",
    description: "You can't see a blade coming until it's almost landed - which cuts both ways.",
    scope: "both",
    effects: [{ type: "applyBuff", id: "evade", amount: 1 }],
  },
  {
    id: "frostfall",
    name: "Frostfall",
    description: "The cold gets into every joint. Nobody swings at full strength here.",
    scope: "both",
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
  },
  {
    id: "sacred-grove",
    name: "The Sacred Grove",
    description: "One of the last clean places. Your squad mends here, round after round.",
    scope: "player",
    effects: [{ type: "applyBuff", id: "regen", amount: 2 }],
  },
  {
    id: "ley-line",
    name: "A Ley Line",
    description: "The ground hums with old power. Your squad grows stronger the longer this goes.",
    scope: "player",
    effects: [{ type: "applyBuff", id: "ascendant", amount: 1 }],
  },
  {
    id: "corrupted-soil",
    name: "Corrupted Soil",
    description: "The rot runs deep here. Whatever grows from it hits like a falling tree.",
    scope: "enemy",
    effects: [{ type: "applyBuff", id: "strength", amount: 2 }],
  },
  {
    id: "sinkhole-mire",
    name: "Sinkhole Mire",
    description: "Your squad is knee-deep in sucking mud from the first step. The locals aren't.",
    scope: "player",
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
  },
]

// Deterministic per battle position: most fights get no arena; roughly
// one in three does. Seeded by nodeIndex + act so a run always shows
// the same arena at the same place (the save/restore invariant), but
// different positions vary, and early Acts lean on the milder,
// both-sided hazards rather than the one-sided ones.
export function arenaForNode(nodeIndex, act = 1) {
  const roll = (nodeIndex * 7 + act * 3) % 9
  if (roll >= 3) return null
  const early = act <= 2 ? ARENAS.filter((a) => a.scope === "both") : ARENAS
  return early[(nodeIndex + act) % early.length].id
}

export function arenaById(id) {
  return id ? ARENAS.find((a) => a.id === id) || null : null
}
