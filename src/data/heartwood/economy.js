// Hearthwood Trial - the Economy crew (Economy System PRD sections 30-31).
// A small set of units whose whole identity is the RUN'S ECONOMY, not the
// fight: each grants one flat run-layer effect - a cheaper recruit, an
// earlier interest tier, a bigger win payout, a reroll that stops
// escalating - but ONLY while it is deployed. Deploying one means giving
// up a real combat body (PRD section 21: "Economy: +future value /
// -current power"), which is the built-in brake.
//
// The autobattler engine never reads `economyRole` - these units fight
// as ordinary (deliberately feeble) bodies. Everything here is derived
// each shop / win from a `runState.deployed` scan, the exact same shape
// runEngine.js's `economyBranchBonus` already uses for the Economy
// upgrade branch. Nothing is persisted; no RUN_SAVE_VERSION bump.

import { UNITS } from "./units"

// Default interest threshold when no Banker is deployed - kept in sync
// with runEngine.js's INTEREST_THRESHOLD by value (importing it here
// would make economy.js depend on the engine; this module stays a data
// leaf so runEngine.js can import IT).
const DEFAULT_INTEREST_THRESHOLD = 150

// The one tunable table. Each economy unit's `economyRole` (units.js
// opt) keys into this.
// Values trimmed after fairness passes: a first cut (0.15 / 100 / 20)
// held fenrir flat once the unit bodies were bumped, but left tommy
// +6 / aatos -6.5 (more Essence snowballs the tempo Commander, does
// less for the outlast one). Dropped to shrink the whole edge.
export const ECONOMY_ROLES = {
  merchant: { label: "Merchant", recruitPct: 0.1 }, // every recruit costs 10% less
  banker: { label: "Banker", interestThreshold: 120 }, // interest starts at 120 Essence, not 150
  forager: { label: "Forager", winBonus: 12 }, // +12 Essence on every non-boss win
  "toll-warden": { label: "Toll-Warden", rerollFlat: true }, // a paid reroll's cost stops climbing
}

// The deployed economy units, in deploy-slot order: { key, defId, role, label }.
export function economyCrew(runState) {
  const bench = runState?.bench || []
  return (runState?.deployed || [])
    .filter((k) => k !== null && k !== undefined)
    .map((k) => bench.find((e) => e.key === k))
    .filter((e) => e && UNITS[e.defId]?.economyRole)
    .map((e) => {
      const role = UNITS[e.defId].economyRole
      return { key: e.key, defId: e.defId, role, label: ECONOMY_ROLES[role]?.label || role }
    })
}

// The combined run-layer effect of whatever economy units are deployed.
// Pure. Empty / none deployed -> the neutral defaults.
export function economyCrewEffects(runState) {
  const crew = economyCrew(runState)
  let recruitPct = 0
  let interestThreshold = DEFAULT_INTEREST_THRESHOLD
  let winBonus = 0
  let rerollFlat = false
  for (const { role } of crew) {
    const spec = ECONOMY_ROLES[role]
    if (!spec) continue
    if (spec.recruitPct) recruitPct += spec.recruitPct
    if (spec.interestThreshold) interestThreshold = Math.min(interestThreshold, spec.interestThreshold)
    if (spec.winBonus) winBonus += spec.winBonus
    if (spec.rerollFlat) rerollFlat = true
  }
  // Own cap on the recruit discount from this crew (it still combines
  // with the Regular's Discount Ledger buy under effectiveRecruitCost's
  // own 0.6 combined cap).
  return { recruitPct: Math.min(0.45, recruitPct), interestThreshold, winBonus, rerollFlat }
}
