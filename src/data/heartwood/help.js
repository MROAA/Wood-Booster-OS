// Hearthwood Trial - the "?" reference overlay. A plain-language
// glossary of every system a player meets in a run, reachable any time
// from the ? button (HelpOverlay.jsx). Hand-authored, kept short - this
// is a "remind me how X works" panel, not a manual.

export const HELP_SECTIONS = [
  {
    heading: "The run",
    entries: [
      { term: "Structure", blurb: "A run is a path of fights broken into Acts. Each Act is tougher than the last; the deeper you go, the more Essence a win pays." },
      { term: "Winning & losing", blurb: "Clear the final boss to win. Lose any fight and the run ends - what you carried out seeds your next attempt (the Grove)." },
      { term: "Choices", blurb: "Between fights you'll pick a path, an event, or a relic. Whatever you leave behind comes back around later in the run." },
    ],
  },
  {
    heading: "Fights",
    entries: [
      { term: "Automatic", blurb: "You build the squad and place it; the fight then resolves on its own, round by round. All the depth is in the decisions before the clash." },
      { term: "Placement", blurb: "Three back-row slots and one forward slot. The forward unit draws fire and leads the charge; some units only pay off from there." },
      { term: "Block vs Bulwark", blurb: "Block soaks hits but resets every round. Bulwark is permanent armour that never runs out." },
      { term: "Statuses", blurb: "Strength, Execute, Ward, Regen, Poison, Burn, Weak, Vulnerable and more - flat, readable numbers, no combat RNG." },
    ],
  },
  {
    heading: "Tribes & synergy",
    entries: [
      { term: "Tribes", blurb: "Every unit belongs to one or two tribes (Thorn, Warden, Fang, Grove, Stone, Ember...). The card shows them." },
      { term: "Synergy", blurb: "Field enough units of a tribe and the whole squad gets that tribe's bonus. A ✓ on the badge means it's active; the badge also shows how many more you need for the next tier." },
      { term: "Positional synergy", blurb: "A few bonuses depend on which slots your tribes sit in - stacking the shielding column, or a full back row of one tribe." },
    ],
  },
  {
    heading: "The market",
    entries: [
      { term: "Recruit & reroll", blurb: "Buy units with Essence; reroll for a fresh set (the price climbs each reroll that visit). Freeze keeps the current offers for next time." },
      { term: "Market level", blurb: "Pay Essence to raise it. Level 2 unlocks Uncommon, level 3 Rare - and at the top, a Legendary sometimes appears." },
      { term: "Sell & reforge", blurb: "Sell a bench unit back for a third of its cost, or reforge it into a random unit of the same rarity for a flat fee." },
      { term: "The Ledger", blurb: "One-time run-long investments in the market itself: cheaper recruits, an extra offer slot, or more Essence per win." },
    ],
  },
  {
    heading: "Essence",
    entries: [
      { term: "Earning", blurb: "Mostly from winning fights - more the deeper you are, plus bonuses for minibosses, elites and bodyguard formations." },
      { term: "Interest", blurb: "Unspent Essence above a threshold earns a little extra after each non-boss win (the ▲ badge). Saving is a real strategy." },
    ],
  },
  {
    heading: "Relics & items",
    entries: [
      { term: "Relics", blurb: "A squad-wide buff that applies every fight for the rest of the run. Some only reach one tribe, but hit harder for it." },
      { term: "Items", blurb: "Gear equipped to one specific bench unit - a smaller, single-target echo of a relic." },
      { term: "Upgrading", blurb: "Essence can also level a unit, a relic, or your Commander's rank - each makes its numbers bigger." },
    ],
  },
  {
    heading: "Growing units",
    entries: [
      { term: "Evolution", blurb: "Deploy a common fill unit enough times, with its tribe fielded alongside it, and it becomes a stronger authored form. Free and permanent - a ▲ marks it." },
      { term: "Fusion", blurb: "Own three copies of the same unit and they combine into one bigger version." },
      { term: "Legendary hooks", blurb: "Legendary units carry one of: growth (stronger every round), aura (buffs adjacent allies each round), or conditional (a big bonus if your squad or its placement fits)." },
    ],
  },
  {
    heading: "The battlefield",
    entries: [
      { term: "The forest", blurb: "Its state (restless, purified or corrupted) is set by your Act choices and tints the whole fight. A meter climbs as a fight drags on, then shifts the field for both sides." },
      { term: "Arena hazards", blurb: "Some battlefields carry a modifier - a Blood Moon, a Sacred Grove, Frostfall. It's fixed for that spot, so you can plan around it." },
      { term: "Elites, minibosses, bosses", blurb: "Marked with their own banner. Each has a signature mechanic and escalates once hurt. They pay more Essence." },
    ],
  },
]
