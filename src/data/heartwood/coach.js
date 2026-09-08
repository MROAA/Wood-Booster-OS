// Hearthwood Trial - the contextual coach. Marc: "uuden pelaajan
// opastus". The old tutorial.js / BattleScreen.jsx path is for the dead
// card-mode and never fires in the autobattler; this is its
// replacement, built for the real flow (shop -> formation -> auto
// battle). One terse tip surfaces the first time each mechanic's UI
// actually appears - the player learns by seeing the thing, not by
// reading a wall of text up front (same "label-length, not
// sentence-length" rule tutorial.js's own comment set).
//
// HeartwoodBattle.jsx derives an "active" set of tip ids from runState
// each render (pure, no engine call), then shows the FIRST one that is
// active, enabled, and not yet seen. Each tip self-dismisses forever on
// "Got it". The whole layer is one Settings toggle away from off.

export const COACH_SEEN_KEY = "heartwood-coach-seen-v1" // JSON string[]
export const COACH_ENABLED_KEY = "heartwood-coach-enabled-v1" // "false" disables

// `anchor`: a CSS selector already on screen to point the tip at (the
// spotlight ring + positioning reuse TutorialSpotlight's measure loop).
// null -> a centred card. Keep `text` to a line or two.
export const COACH_TIPS = [
  {
    id: "shop",
    title: "The Hearthwood Market",
    text: "Recruit units, drag up to 4 onto the grid, then Continue. They fight on their own - win to earn Essence and press deeper.",
    anchor: ".hw-market-columns",
  },
  {
    id: "market-level",
    title: "Market level",
    text: "Pay Essence to raise the market. Higher levels stock Uncommon, then Rare units - and, at the top, the occasional Legendary.",
    anchor: ".hw-market-level-widget",
  },
  {
    id: "synergy",
    title: "Tribe synergy",
    text: "Units share a tribe. Field enough of one and the whole squad gets that tribe's bonus - a ✓ on the badge means it's live.",
    anchor: ".hw-badge--active",
  },
  {
    id: "interest",
    title: "Essence interest",
    text: "Unspent Essence earns a little more after each win (the ▲ badge). Saving a round can be worth more than a marginal buy.",
    anchor: ".hw-essence-interest",
  },
  {
    id: "ledger",
    title: "The Ledger",
    text: "One-time, run-long upgrades to the market itself - cheaper recruits, an extra offer, more Essence per win. They pay back over the whole run.",
    anchor: ".hw-rail-section--ledger",
  },
  {
    id: "upgrade",
    title: "Upgrading a unit",
    text: "Each Upgrade level is a choice of direction - Power, Defense, Synergy, Utility or Economy. The same unit can grow into different roles in different runs.",
    anchor: ".hw-upgrade-btn",
  },
  {
    id: "roles",
    title: "Roles & tags",
    text: "Every unit shows its role (Tank / DPS / Healer / Support / Control / Debuffer…) and a few tags. A strong squad has a front line, a healer, and something that scales - not six of one thing.",
    anchor: ".hw-card-role-line",
  },
  {
    id: "relic",
    title: "Relics",
    text: "A relic buffs your entire squad, every fight, for the rest of the run. Pick the one that fits where your build is going.",
    anchor: null,
  },
  {
    id: "formation-position",
    title: "Where you place matters",
    text: "The forward slot leads the charge; the back row is safer. Some units only pay off from the front - or only in a full 4-unit line.",
    anchor: ".hw-grid",
  },
  {
    id: "forest-mood",
    title: "The forest is watching",
    text: "This meter climbs as a fight drags on, then shifts the battlefield for both sides. Long fights are never truly neutral.",
    anchor: ".hw-forest-mood-badge",
  },
  {
    id: "arena",
    title: "Arena hazard",
    text: "This battlefield has a modifier in effect - check the Arena badge above the board. It's the same every time you reach this spot, so you can plan for it.",
    anchor: null,
  },
  {
    id: "elite",
    title: "Elite enemy",
    text: "Tougher than a normal fight, with a signature trick and an escalation once it's hurt. Beating one pays extra Essence.",
    anchor: ".hw-elevated-banner--elite",
  },
  {
    id: "evolution",
    title: "A unit evolved",
    text: "Deploy a fill unit enough times, with its tribe alongside it, and it grows into a stronger authored form. Free, automatic, permanent.",
    anchor: ".hw-hint--evolved",
  },
  {
    id: "legendary",
    title: "Legendary unit",
    text: "A build-around anchor: growth (stronger every round), aura (helps its neighbours) or conditional (a big payoff if your squad fits). Expensive on purpose.",
    anchor: ".hw-card[data-tier=\"legendary\"]",
  },
]

function readEnabled() {
  try {
    return localStorage.getItem(COACH_ENABLED_KEY) !== "false"
  } catch {
    return true
  }
}

export function coachEnabled() {
  return readEnabled()
}

export function setCoachEnabled(on) {
  try {
    localStorage.setItem(COACH_ENABLED_KEY, on ? "true" : "false")
  } catch {
    /* private mode / storage blocked - non-fatal, tips just won't persist */
  }
}

export function seenCoachIds() {
  try {
    const raw = localStorage.getItem(COACH_SEEN_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function markCoachSeen(id) {
  try {
    const set = seenCoachIds()
    set.add(id)
    localStorage.setItem(COACH_SEEN_KEY, JSON.stringify([...set]))
  } catch {
    /* non-fatal */
  }
}

export function resetCoachSeen() {
  try {
    localStorage.removeItem(COACH_SEEN_KEY)
  } catch {
    /* non-fatal */
  }
}

// First matching, enabled, unseen tip for a set of currently-active ids.
// `activeIds` is an array in the priority order HeartwoodBattle wants
// them shown (most specific / rarest first).
export function nextCoachTip(activeIds) {
  if (!coachEnabled()) return null
  const seen = seenCoachIds()
  for (const id of activeIds) {
    if (seen.has(id)) continue
    const tip = COACH_TIPS.find((t) => t.id === id)
    if (tip) return tip
  }
  return null
}
