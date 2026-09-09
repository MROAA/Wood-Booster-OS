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
    id: "playstyle",
    title: "Your playstyle",
    text: "The run rail shows the lean your choices are adding up to - Aggression, Defense, Control, Economy, Risk or Adaptation. It's a mirror, not a target; the full six-axis read is on the run-end screen.",
    anchor: ".hw-playstyle-compact",
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
    text: "Tanks want the forward slot; DPS, healers and support want the back row - a unit in its preferred slot starts the fight with a small edge (a green ring; an amber dot means it's out of place). Some units also only pay off from the front, or only in a full 4-unit line.",
    anchor: ".hw-grid",
  },
  {
    id: "targeting",
    title: "Where your units strike",
    text: "Most units hit the enemy front line. A few pick their own target - an executioner goes for the lowest-HP enemy to finish it. A unit's card shows this under its role.",
    anchor: ".hw-card-target-line",
  },
  {
    id: "threat",
    title: "Who the enemy hits",
    text: "Enemies work down your squad by threat - a tank, whoever's dealt the most damage, and anyone taunting draw fire first. The 🎯 marks this round's target. A tank in the forward slot soaks the opening hits so your carry survives.",
    anchor: ".hw-piece[data-focus-target=\"true\"]",
  },
  {
    id: "battle-analysis",
    title: "What decided the fight",
    text: "After each battle this panel names what settled it - and, on a loss or a close call, a couple of things you could try. It's a nudge, not the only answer.",
    anchor: ".hw-analysis",
  },
  {
    id: "counterplay",
    title: "Answering the next enemy",
    text: "\"Next fight\" lists what THIS enemy brings - armour, a swarm, healing, poison, control, a back-liner - and marks each ✓ if your squad has an answer or ✗ if it doesn't. A gap isn't a loss, but it's where the fight will be decided.",
    anchor: ".hw-matchup",
  },
  {
    id: "build-score",
    title: "Your build at a glance",
    text: "Seven bars rate your deployed squad - Survivability, Damage, Sustain, Control, Synergy, Economy, Scaling - and 'Watch:' names its biggest gap. A good squad isn't the highest numbers, it's no glaring hole.",
    anchor: ".hw-buildscore",
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
