// Hearthwood - Forest Mood. Marc: "metsä eläväksi" -> "Forest Mood +
// Crownless-peilaus". `forestState` (restless | purified | corrupted),
// set by the Act crossroads (crossroads.js), previously only bent the
// route and which events showed - it never touched a fight. Now the
// forest is a live presence in every battle: a visible 0-100 meter that
// climbs a FIXED amount each round (no RNG) and, at set thresholds,
// "stirs" and applies an arena-style field effect. Because the meter is
// on screen and the climb is deterministic, mastery is planning your
// build for it BEFORE the fight (Marc's "easy to play, hard to master":
// depth lives pre-battle), not reacting mid-fight.
//
// Each forestState has its own rail: how fast the mood climbs and what
// the forest does when it wakes. Purified is slow and mending, corrupted
// is fast and caustic, restless is the neutral middle. Effects lean on
// `scope: "both"` (arena doctrine - a hazard, not a handout) with only a
// small tilt toward the player on the path they chose peace on.
//
// Tier `at` values are on the same 0-100 scale as the meter. A tier
// fires once, the first round the meter reaches its `at`, then never
// again (checkForestMood in autoBattleEngine.js tracks fired indices).

export const MOOD_BANDS = ["Calm", "Stirring", "Roused", "Awake"]

export const FOREST_MOOD = {
  restless: {
    // Deliberately DE-escalating, not lethal-escalating. A restless
    // forest that made long fights sharper (strength/vulnerable) hit
    // Fenrir's whole "worse the longer it goes" identity coming and
    // going (-10pp in a fairness pass). Instead the restless forest
    // just makes a drawn-out fight SLOWER and more smothered: cover,
    // then a slow mend, then everyone too tired to swing full-force.
    // The neutral rail climbs SLOWLY (start 0, step 9): tier 0 lands
    // around round 6, tier 1 around round 9 - so a normal 3-5 round
    // fight sees little or none of it, and only a genuine grind
    // (miniboss, heavy formation) ever reaches Roused. That's
    // deliberate: no "both scope" effect is truly outcome-neutral in a
    // fight where one side is the aggressor and the other is being
    // ground down (a fast rail inflated win rates +11pp; a lethal one
    // cost Fenrir -10pp). A restless forest is a slow, background
    // presence. Purified/corrupted (below) climb fast on purpose - the
    // fairness bot never sets a forestState so it only ever meets this
    // rail. Effects: only Frostfall's Weak + Choking Mist's Evade, both
    // proven balanced at `1` / scope "both".
    start: 0,
    step: 9,
    tiers: [
      {
        at: 50,
        name: "Stirring",
        scope: "both",
        announce: "the cold gets into every joint - swings come up short",
        effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
      },
      {
        at: 85,
        name: "Roused",
        scope: "both",
        announce: "a grey mist rolls through - half the blades find nothing",
        effects: [{ type: "applyBuff", id: "evade", amount: 1 }],
      },
      {
        at: 120,
        name: "Awake",
        scope: "both",
        announce: "the whole forest is awake and in the way - nobody fights clean now",
        effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
      },
    ],
  },

  purified: {
    start: 0,
    step: 8,
    tiers: [
      {
        at: 40,
        name: "Stirring",
        scope: "both",
        announce: "the clean green stirs - the field begins to mend",
        effects: [{ type: "applyBuff", id: "regen", amount: 1 }],
      },
      {
        at: 70,
        name: "Roused",
        scope: "player",
        announce: "the forest knows your name - your squad mends faster",
        effects: [{ type: "applyBuff", id: "regen", amount: 1 }],
      },
      {
        at: 100,
        name: "Awake",
        scope: "player",
        announce: "the grove pours itself into your squad",
        effects: [
          { type: "heal", amount: 5 },
          { type: "applyBuff", id: "regen", amount: 1 },
        ],
      },
    ],
  },

  corrupted: {
    start: 35,
    step: 15,
    tiers: [
      {
        at: 45,
        name: "Stirring",
        scope: "both",
        announce: "the rot wakes - every wound festers on both sides",
        effects: [
          { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
        ],
      },
      {
        at: 75,
        name: "Roused",
        scope: "both",
        announce: "the ground turns soft and hungry - everything here is fragile",
        effects: [{ type: "applyBuff", id: "vulnerable", amount: 1 }],
      },
      {
        at: 100,
        name: "Awake",
        scope: "both",
        announce: "the corruption ignites - the whole field burns",
        effects: [{ type: "applyBuff", id: "burn", amount: 2 }],
      },
    ],
  },
}

function railFor(forestState) {
  return FOREST_MOOD[forestState] || FOREST_MOOD.restless
}

// The band label for a meter value - drives the UI badge colour + name.
export function moodBandName(forestState, moodValue) {
  const rail = railFor(forestState)
  let band = 0
  rail.tiers.forEach((tier, i) => {
    if ((moodValue || 0) >= tier.at) band = i + 1
  })
  return MOOD_BANDS[Math.min(band, MOOD_BANDS.length - 1)]
}

// The next tier that has NOT fired yet (for the UI's "what's coming"
// tooltip), or null once the forest is fully Awake.
export function nextMoodTier(forestState, firedIndices = []) {
  const rail = railFor(forestState)
  const fired = new Set(firedIndices)
  for (let i = 0; i < rail.tiers.length; i++) {
    if (!fired.has(i)) return { index: i, ...rail.tiers[i] }
  }
  return null
}

export { railFor as moodRailFor }
