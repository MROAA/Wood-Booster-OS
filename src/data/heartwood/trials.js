// Hearthwood - Trials. A Trial is a named narrative wrapper around an
// existing enemy/formation encounter, not a redefinition of its combat.
// This lets a miniboss/boss carry real story identity (title, its own
// intro/victory/defeat lines) without ever touching the balance work
// already done on the underlying enemy def - `enemyId` still resolves
// through ENEMIES exactly as before, only the presentation layer reads
// through the Trial when one wraps the node.
//
// First entry: Rootkeeper (Act I's boss, from Marc's own written story -
// docs/hearthwood-story-acts.md) wraps the existing "deepwarden" miniboss
// (already-tuned stats/moveset, a defensive warden-type enemy - a close
// mechanical fit for a corrupted tree-guardian). Content for more Trials
// (Heartwood Warden/Act II, Veilbound/Act III, Hollow King/Act IV,
// The Crownless/Act V) already exists in full in that same doc - this
// table is the seam they drop into next, one entry each, with zero
// further engine work.
export const TRIALS = {
  rootkeeper: {
    id: "rootkeeper",
    enemyId: "deepwarden",
    title: "Rootkeeper",
    rank: 1,
    act: "The Outer Grove",
    beat: "The forest's oldest guardian, still standing watch - corruption has reached him too.",
    introLine:
      '"Pysähdy. Sinä... vieras... Miksi kosket juuriani?" He does not move to strike yet - only to be heard.',
    victoryLine:
      '"...Sinä et ole korruptio." The roots fall away. Light kindles in his chest. "Kuuntele. Korruptio ei tule juurista. Se tulee syvemmältä." He is not defeated - he is purified.',
  },
}

export function resolveTrial(id) {
  return TRIALS[id] || null
}
