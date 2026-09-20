// Hearthwood Trial - Depths, the challenge ladder (Slay the Spire's
// Ascension / Monster Train's Covenants). Marc: a haasteportaikko where
// beating a run unlocks the next Depth, each adding a permanent run
// modifier and paying out more Acorns.
//
// You always PLAY at a chosen Depth 0..(highest unlocked). Winning a
// run at the highest one you've unlocked unlocks the next. Every Depth
// at or below the one you're playing is in effect - they stack.
//
// Modifiers are plain data, read by runEngine.js:
//   enemyMult    - multiplies the run's difficultyFactor (enemy HP AND
//                  damage - difficultyFactor already scales both)
//   essenceDelta - added to START_ESSENCE (negative; floored at 0)
//   startCurse   - applyEffect objects seeded into pendingActiveEffects,
//                  so the squad enters the FIRST battle already hexed
// No RNG, nothing that needs a new engine mechanic - each modifier
// plugs into a hook that already exists.
export const DEPTHS = [
  {
    level: 1,
    name: "Thicker Hide",
    description: "Everything in the forest is tougher and hits harder (+8%).",
    enemyMult: 1.08,
  },
  {
    level: 2,
    name: "Lean Season",
    description: "You start every run with 75 less Essence.",
    essenceDelta: -75,
  },
  {
    level: 3,
    name: "Deeper Rot",
    description: "The forest is tougher still (+8% more).",
    enemyMult: 1.08,
  },
  {
    level: 4,
    name: "Ill Omen",
    description: "Your squad enters the first battle of every run Weak.",
    startCurse: [{ type: "applyBuff", id: "weak", amount: 1 }],
  },
  {
    level: 5,
    name: "Hard Ground",
    description: "The forest is tougher still (+8% more).",
    enemyMult: 1.08,
  },
  {
    level: 6,
    name: "Famine",
    description: "You start every run with a further 75 less Essence, and your squad enters the first battle Vulnerable.",
    essenceDelta: -75,
    startCurse: [{ type: "applyBuff", id: "vulnerable", amount: 1 }],
  },
  {
    level: 7,
    name: "The Verge",
    description: "The forest is at its most relentless (+10% more).",
    enemyMult: 1.1,
  },
]

export const MAX_DEPTH = DEPTHS.length

// Aggregates every Depth 1..level into one modifier bundle. Depth 0
// (and anything out of range) returns the identity bundle.
export function depthModifiersFor(level) {
  const n = Math.max(0, Math.min(MAX_DEPTH, level | 0))
  const active = DEPTHS.filter((d) => d.level <= n)
  return {
    level: n,
    enemyMult: active.reduce((m, d) => m * (d.enemyMult || 1), 1),
    essenceDelta: active.reduce((s, d) => s + (d.essenceDelta || 0), 0),
    startCurse: active.flatMap((d) => d.startCurse || []),
    active,
  }
}

// The Acorn multiplier for finishing a run at this Depth - a Depth 5
// run is worth 3x a Depth 0 one. Rounding happens in acornsForRun.
export function depthAcornMultiplier(level) {
  return 1 + Math.max(0, Math.min(MAX_DEPTH, level | 0)) * 0.4
}
