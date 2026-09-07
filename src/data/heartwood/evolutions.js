// Hearthwood - Unit Evolution. Marc: "jatketaan" -> "Yksiköiden
// evoluutio", "automaattinen + ilmainen". The story bible's Evolution
// Chain / DNA System is lore, not a mechanic ("creatures evolve from
// purpose, not power") - it names the arc Sap Spirit -> Wood Elemental
// -> Grovekeeper. This is the buildable slice of that: a unit you keep
// on the field, in a squad that leans its tribe, GROWS into a stronger
// authored form. Deterministic (no RNG), settled after a win (never
// mid-fight - depth lives pre-battle), automatic, free. The "cost" is
// the build commitment: keep it deployed, stack its tribe.
//
// This module is pure data + a pure predicate. runEngine.js owns
// applyEvolutions (it already knows bench / deployed) so this file
// never has to import the engine.

// Every condition carries a `tribe` gate (2+ of the source unit's own
// tribe deployed) AND a win floor. The tribe gate is the real cost:
// a fairness pass (RUNS=100) showed that WITHOUT it, or with only a
// win floor, the "realistic" bot - which recruits everything and never
// sells - triggers evolutions in ~1 run in 8 and gains +10pp win rate
// on the low-tier Commanders (fenrir/repo). A deployed pair of one
// tribe is a build choice the random bot rarely makes but a
// deliberate player reaches by mid-run. Win floors are 4 (elementals)
// / 5 (the rarer shadow/cosmic/thorn chains).
export const EVOLUTIONS = {
  // The 7 elemental fill units (content-breadth round) -> their
  // elemental-guardian form, once the squad has actually committed to
  // that element (2+ of the tribe) and the unit has survived the run
  // a while.
  sapthorn: { to: "wood-elemental", when: { minWins: 4, tribe: { id: "wood", count: 2 } } },
  cinderpaw: { to: "ember-elemental", when: { minWins: 4, tribe: { id: "ember", count: 2 } } },
  brinecaller: { to: "tide-elemental", when: { minWins: 4, tribe: { id: "tide", count: 2 } } },
  cairnfist: { to: "stone-elemental", when: { minWins: 4, tribe: { id: "stone", count: 2 } } },
  galeblade: { to: "storm-elemental", when: { minWins: 4, tribe: { id: "gale", count: 2 } } },
  shadefang: { to: "void-herald", when: { minWins: 5, tribe: { id: "shadow", count: 2 } } },
  starcaller: { to: "star-herald", when: { minWins: 5, tribe: { id: "cosmic", count: 2 } } },
  // A non-elemental chain - the Tarot common Goldenbough, once it's
  // anchored a real Thorn line and carried it deep into the run.
  "the-hierophant": { to: "goldenbough-ascendant", when: { minWins: 5, tribe: { id: "thorn", count: 2 } } },
}

export function evolutionFor(defId) {
  return EVOLUTIONS[defId] || null
}

// Deterministic: does this deployed bench entry meet its evolution's
// condition right now? `tribeCounts` is the DEPLOYED tribe count map
// (runEngine.deployedTribeCounts), `forestState` the world posture.
// Returns the target defId, or null.
export function evolutionReady(entry, tribeCounts = {}, forestState = "restless") {
  const evo = EVOLUTIONS[entry?.defId]
  if (!evo) return null
  const w = evo.when
  if (w.minWins && (entry.wins || 0) < w.minWins) return null
  if (w.tribe && (tribeCounts[w.tribe.id] || 0) < w.tribe.count) return null
  if (w.forestState && forestState !== w.forestState) return null
  return evo.to
}

// A short human line for the UnitCard hint: what this unit becomes and
// what it needs. `entry` optional - with it, shows remaining wins.
export function evolutionHint(defId, entry) {
  const evo = EVOLUTIONS[defId]
  if (!evo) return null
  const w = evo.when
  const parts = []
  if (w.minWins) {
    const have = entry?.wins || 0
    parts.push(have >= w.minWins ? `${w.minWins} wins deployed` : `${have}/${w.minWins} wins deployed`)
  }
  if (w.tribe) parts.push(`${w.tribe.count} ${w.tribe.id}`)
  if (w.forestState) parts.push(`a ${w.forestState} forest`)
  return `Evolves — needs ${parts.join(" + ")}`
}
