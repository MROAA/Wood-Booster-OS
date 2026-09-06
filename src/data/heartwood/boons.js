// Hearthwood - Run Modifiers (Boons & Banes). Marc: "peli tarvitsee
// lisää syvyyttä se on vielä yksinkertainen ja tylsä" - and, of the
// three boredom axes he named, first: "valinnat eivät tunnu tärkeiltä"
// (choices don't feel important). Until now a map-event choice paid out
// once (essence / a relic / a one-battle buff via `squadNextBattle`)
// and then it was over. A Run Modifier is the opposite: a NAMED,
// permanent consequence that rides the whole rest of the run.
//
// Mechanically each one is just a list of effect objects fed into the
// exact same per-battle channel the Commander's active power and
// `squadNextBattle` already use (runEngine.js's `pendingActiveEffects`
// arg to startAutoBattle) - only, instead of being consumed after one
// fight, runEngine re-applies a run modifier's effects at the start of
// EVERY battle for the rest of the run (see expandRunModifierEffects +
// startFormationBattle). No new effect vocabulary, no new combat code.
//
// `essenceWinPct` (optional): a flat % bonus to every battle's Essence
// payout while this modifier is active (essenceForWin) - the lever that
// makes a "bane" a real risk/reward pick rather than just a penalty.
//
// All effects target the player squad (that's the only thing the
// pending-effects channel touches), so a "bane" is a squad debuff at
// battle start, usually paired with an upside - never an enemy buff.
// Amounts stay at 1-2: this stacks across ~39 fights in a full run.

export const RUN_BOONS = [
  {
    id: "rootblessed",
    name: "Rootblessed",
    kind: "boon",
    description: "The forest owes you a kindness. Your squad recovers a little in every battle.",
    effects: [{ type: "applyBuff", id: "regen", amount: 1 }],
  },
  {
    id: "grove-warded",
    name: "Grove-Warded",
    kind: "boon",
    description: "A grove spoke for you. Your squad enters every battle already warded once.",
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  {
    id: "stoneblood",
    name: "Stoneblood",
    kind: "boon",
    description: "You buried the old dead. Your squad holds a sliver of armour between rounds, every battle.",
    effects: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
  },
  {
    id: "emberfed",
    name: "Emberfed",
    kind: "boon",
    description: "The forge-fire took to you. Your squad's strikes leave a burn behind.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
    ],
  },
  {
    id: "windfavoured",
    name: "Windfavoured",
    kind: "boon",
    description: "The gale owes you a step. Your squad slips the first blow of every round.",
    effects: [{ type: "applyBuff", id: "evade", amount: 1 }],
  },
  {
    id: "milestone-oath",
    name: "Milestone Oath",
    kind: "boon",
    description: "Your name is cut into the stone now. Your squad fights a little harder for it, all the way.",
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  {
    id: "veil-lucid",
    name: "Veil-Lucid",
    kind: "boon",
    description: "You looked into the still pool and came back steadier. Your squad opens every battle braced.",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
  },
  {
    id: "forager-friend",
    name: "The Forager's Word",
    kind: "boon",
    description: "The forager talks to the right people. Coin finds you easier - +15% Essence from every win.",
    effects: [],
    essenceWinPct: 0.15,
  },
]

export const RUN_BANES = [
  {
    id: "hollow-marked",
    name: "Hollow-Marked",
    kind: "bane",
    description: "Something deep noticed you noticing it. Your squad starts every battle Weak - but the forest's spoils come richer (+30% Essence per win).",
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
    essenceWinPct: 0.3,
  },
  {
    id: "veil-touched",
    name: "Veil-Touched",
    kind: "bane",
    description: "A shard's hum follows you: sharper, and harder to hold. Your squad starts every battle Vulnerable, and a little stronger.",
    effects: [
      { type: "applyBuff", id: "vulnerable", amount: 1 },
      { type: "applyBuff", id: "strength", amount: 1 },
    ],
  },
  {
    id: "root-debt",
    name: "Root-Debt",
    kind: "bane",
    description: "You cut the toll root instead of paying it. It remembers - your squad starts every battle Weak. The road pays you back in coin (+15% Essence per win).",
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
    essenceWinPct: 0.15,
  },
  {
    id: "sap-heavy",
    name: "Sap-Heavy",
    kind: "bane",
    description: "You drank too deep from the weeping stone. Your squad is slow off the mark every battle - Vulnerable - but recovers strongly.",
    effects: [
      { type: "applyBuff", id: "vulnerable", amount: 1 },
      { type: "applyBuff", id: "regen", amount: 2 },
    ],
  },
  {
    id: "name-burden",
    name: "The Name's Weight",
    kind: "bane",
    description: "You say it in your sleep now. Your squad starts every battle Vulnerable - and the spoils come richer for carrying it (+25% Essence per win).",
    effects: [{ type: "applyBuff", id: "vulnerable", amount: 1 }],
    essenceWinPct: 0.25,
  },
  {
    id: "grief-touched",
    name: "Grief-Touched",
    kind: "bane",
    description: "The grieving guardian's sorrow clings to your squad. Less fight in them at the start of every battle - Weak - but they ward themselves for it.",
    effects: [
      { type: "applyBuff", id: "weak", amount: 1 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  },
]

// Act Allegiances (crossroads.js): the same permanent-modifier channel
// as boons/banes, but granted by the ONE mandatory choice at each Act
// boundary rather than an optional map event. `kind: "allegiance"` so
// the UI strip can mark them apart (a chosen side, not luck), and each
// carries an `act` for the ending-selection tally in a later PR.
export const ACT_ALLEGIANCES = [
  // Act I -> II : The Rootbound Ritual
  {
    id: "rite-purified",
    name: "Rite of Mending",
    kind: "allegiance",
    act: 1,
    description: "You mended the broken root-ritual. The forest heals alongside your squad - Regen 1 in every battle.",
    effects: [{ type: "applyBuff", id: "regen", amount: 1 }],
  },
  {
    id: "rite-strengthened",
    name: "Rite of Feeding",
    kind: "allegiance",
    act: 1,
    description: "You fed the broken ritual instead of fixing it. Dangerous power - your squad hits +1 Strength every battle, and the forest stays Restless.",
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  {
    id: "rite-untouched",
    name: "The Ritual Left Alone",
    kind: "allegiance",
    act: 1,
    description: "You walked past the broken ritual. Silence is a choice too - the forest stays Restless, and the road pays a little better (+10% Essence per win).",
    effects: [],
    essenceWinPct: 0.1,
  },
  // Act II -> III : pick an elemental side
  {
    id: "side-ember",
    name: "Sworn to Ember",
    kind: "allegiance",
    act: 2,
    description: "You took the flame's side in the elementals' dispute. Your squad's strikes leave a burn behind.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
    ],
  },
  {
    id: "side-tide",
    name: "Sworn to Tide",
    kind: "allegiance",
    act: 2,
    description: "You took the water's side. Your squad slips the first blow of every round.",
    effects: [{ type: "applyBuff", id: "evade", amount: 1 }],
  },
  {
    id: "side-stone",
    name: "Sworn to Stone",
    kind: "allegiance",
    act: 2,
    description: "You took the stone's side. Your squad holds a sliver of armour between rounds, every battle.",
    effects: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
  },
  // Act III -> IV : the Echo power
  {
    id: "echo-taken",
    name: "The Echo, Taken",
    kind: "allegiance",
    act: 3,
    description: "You took the Veil's echo into your build. It hums louder - squad +1 Strength every battle, but it opens each battle Vulnerable.",
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "vulnerable", amount: 1 },
    ],
  },
  {
    id: "echo-refused",
    name: "The Echo, Refused",
    kind: "allegiance",
    act: 3,
    description: "You turned the echo down and kept your build clean. Your squad enters every battle warded once.",
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  // Act IV -> V : the Hollow power
  {
    id: "hollow-accepted",
    name: "The Hollow Crown",
    kind: "allegiance",
    act: 4,
    description: "You accepted the void's power for the last stretch. Your squad starts every battle Weak - but the spoils come far richer (+35% Essence per win).",
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
    essenceWinPct: 0.35,
  },
  {
    id: "hollow-resisted",
    name: "Pure Heartwood",
    kind: "allegiance",
    act: 4,
    description: "You resisted the void and held to the living forest. Your squad opens every battle braced and recovering.",
    effects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "applyBuff", id: "regen", amount: 1 },
    ],
  },
]

const BY_ID = Object.fromEntries([...RUN_BOONS, ...RUN_BANES, ...ACT_ALLEGIANCES].map((m) => [m.id, m]))

export function runModifierById(id) {
  return BY_ID[id] || null
}

// The subset of `ids` that are real, in declared order - the single
// place every consumer (UI strip, engine expansion, essence %) reads
// so a stale/unknown id can never crash a run or a save restore.
export function activeRunModifiers(ids = []) {
  return ids.map(runModifierById).filter(Boolean)
}

// Every run modifier's effects, flattened into one list - fed to
// startAutoBattle's pending-effects arg at the start of every battle.
export function expandRunModifierEffects(ids = []) {
  return activeRunModifiers(ids).flatMap((m) => m.effects || [])
}

// Summed Essence-per-win multiplier bonus from all active modifiers
// (0 when none carry `essenceWinPct`).
export function runModifierWinPct(ids = []) {
  return activeRunModifiers(ids).reduce((sum, m) => sum + (m.essenceWinPct || 0), 0)
}
