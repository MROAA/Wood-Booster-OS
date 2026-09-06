// Hearthwood Trial - permanent perks bought with Acorns (metaState.js).
// Each is a one-line, always-on head start on a NEW run - never a
// mid-run effect, never RNG, the same "depth lives in the choices you
// make before the fight" rule the rest of the game follows. A player
// buys these once and keeps them; the cost curve is steep enough that
// having all of them takes many runs.
//
// `apply(runState)` runs once, in runEngine.js's startRun, AFTER the
// base run is built. Kept to plain field writes - a couple set a
// `meta*` field that a single downstream read then honours
// (effectiveItemSlots, essenceForWin, the bench-cap checks), so the
// perk data stays declarative and the hook stays one line.

export const META_PERKS = [
  {
    id: "deep-roots",
    name: "Deep Roots",
    cost: 25,
    description: "Start every run with +100 Essence.",
    apply: (rs) => ({ ...rs, essence: rs.essence + 100 }),
  },
  {
    id: "early-market",
    name: "Early Market",
    cost: 45,
    description: "The market starts at Level 2 - uncommon units from the first visit.",
    apply: (rs) => ({ ...rs, marketLevel: Math.max(rs.marketLevel || 1, 2) }),
  },
  {
    id: "hardy-stock",
    name: "Hardy Stock",
    cost: 60,
    description: "Your Commander starts every run at Rank 1.",
    apply: (rs) => ({ ...rs, commanderRank: Math.max(rs.commanderRank || 0, 1) }),
  },
  {
    id: "veterans-guard",
    name: "Veteran's Guard",
    cost: 30,
    description: "Your squad enters the first battle of every run with +1 Ward.",
    apply: (rs) => ({
      ...rs,
      pendingActiveEffects: [...(rs.pendingActiveEffects || []), { type: "applyBuff", id: "ward", amount: 1 }],
    }),
  },
  {
    id: "deep-pockets",
    name: "Deep Pockets",
    cost: 45,
    description: "+1 item slot on every unit, all run.",
    apply: (rs) => ({ ...rs, metaItemSlotBonus: (rs.metaItemSlotBonus || 0) + 1 }),
  },
  {
    id: "wide-bench",
    name: "Wide Bench",
    cost: 40,
    description: "+2 reserve slots - room for a deeper bench.",
    apply: (rs) => ({ ...rs, benchCapBonus: (rs.benchCapBonus || 0) + 2 }),
  },
  {
    id: "essence-flow",
    name: "Essence Flow",
    cost: 55,
    description: "+30 Essence from every battle won.",
    apply: (rs) => ({ ...rs, metaWinBonus: (rs.metaWinBonus || 0) + 30 }),
  },
  {
    id: "travelers-kit",
    name: "Traveler's Kit",
    cost: 35,
    description: "Start every run with a common item already in your bag.",
    apply: (rs) => ({ ...rs, metaStartItem: "random-common" }),
  },
]

export function metaPerkById(id) {
  return META_PERKS.find((p) => p.id === id) || null
}

// Applies every owned perk to a freshly built runState, in list order.
// `metaStartItem` is a signal, not a field startRun keeps - startRun
// resolves it to a real bag entry and deletes it (a data file can't
// reach ITEMS without a circular import).
export function applyMetaPerks(runState, chosenPerkIds = []) {
  let rs = runState
  for (const id of chosenPerkIds) {
    const perk = metaPerkById(id)
    if (perk?.apply) rs = perk.apply(rs)
  }
  return rs
}

// Acorns earned by a finished run (win OR loss), scaled by how far it
// got. A quick fight-1 loss is worth almost nothing; a deep loss is
// worth real progress; a win is worth a lot. Tuned so buying a first
// perk takes ~2-4 honest runs and the full board takes many.
export function acornsForRun(runState, won) {
  const depth = Math.max(0, Math.floor((runState?.nodeIndex || 0) / 4))
  return depth + (won ? 20 : 0)
}
