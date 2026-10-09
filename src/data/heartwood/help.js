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
      { term: "Turn by turn", blurb: "Fights are played on a grid, one turn at a time - see \"How to play tactics\" below. \"Auto-battle instead\" on the formation screen resolves one on its own." },
      { term: "Placement", blurb: "Three back-row slots and one forward slot. The forward hero draws fire and leads the charge; some heroes only pay off from there." },
      { term: "Block vs Bulwark", blurb: "Block soaks hits but resets every round. Bulwark is permanent armour that never runs out." },
      { term: "Statuses", blurb: "Strength, Execute, Ward, Regen, Poison, Burn, Weak, Vulnerable and more - flat, readable numbers, no combat RNG." },
    ],
  },
  {
    heading: "Tribes & synergy",
    entries: [
      { term: "Tribes", blurb: "Every hero belongs to one or two tribes (Thorn, Warden, Fang, Grove, Stone, Ember...). The card shows them." },
      { term: "Synergy", blurb: "Field enough heroes of a tribe and the whole squad gets that tribe's bonus. A ✓ on the badge means it's active; the badge also shows how many more you need for the next tier." },
      { term: "Positional synergy", blurb: "A few bonuses depend on which slots your tribes sit in - stacking the shielding column, or a full back row of one tribe." },
    ],
  },
  {
    heading: "The market",
    entries: [
      { term: "Recruit & reroll", blurb: "Buy heroes with Essence; reroll for a fresh set (the price climbs each reroll that visit). Freeze keeps the current offers for next time." },
      { term: "Market level", blurb: "Pay Essence to raise it. Level 2 unlocks Uncommon, level 3 Rare - and at the top, a Legendary sometimes appears." },
      { term: "Sell & reforge", blurb: "Sell a bench hero back for a third of its cost, or reforge it into a random hero of the same rarity for a flat fee." },
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
      { term: "Items", blurb: "Gear equipped to one specific bench hero - a smaller, single-target echo of a relic." },
      { term: "Gear row", blurb: "Every hero (and your Commander) has a row of 5 gear slots. Any item fits any slot - the ORDER matters. Drag an item to move it, or open the hero's Gear screen." },
      { term: "Next-to bonuses", blurb: "Some items help the item right beside them in the row: a Whetstone next to a blade adds +2 attack, a Mana Gem next to a staff adds +2 resource a turn, a Rune Stone makes the charm next to it 50% stronger. A glowing link between two slots means a bonus is on." },
      { term: "Board auras", blurb: "Some items help allies standing next to the wearer on the battlefield: War Banner (+10% to hit), Incense Burner (+5 resource a turn), Watch Lantern (can't be flanked), Warding Bell (1 less damage per hit). The tiles around the wearer glow." },
      { term: "Recipes", blurb: "Two matching items side by side in one row fuse into a stronger one (two Bone Daggers = Twin Fangs). Same-item recipes also fuse when you buy the second copy. The full list is in the recipe book below." },
      { term: "Class Collars", blurb: "A collar in a hero's row makes it fight as that class - skills, passive and resource - while worn. Take it off and the natural class returns. One per hero. Elites and minibosses drop them." },
      { term: "Rarity & the gear purse", blurb: "Items come Common, Rare, Epic and Legendary - better ones show up in later Acts and at a higher Market Level. Each visit the merchant only takes so much Essence for gear (the purse). Lock an offer to keep it, reroll the rest (the price climbs), sell items back for half." },
      { term: "Upgrading", blurb: "Essence can also level a hero, a relic, or your Commander's rank - each makes its numbers bigger." },
    ],
  },
  {
    heading: "Growing heroes",
    entries: [
      { term: "Evolution", blurb: "Deploy a common fill hero enough times, with its tribe fielded alongside it, and it becomes a stronger authored form. Free and permanent - a ▲ marks it." },
      { term: "Fusion", blurb: "Own three copies of the same hero and they combine into one bigger version." },
      { term: "Legendary hooks", blurb: "Legendary heroes carry one of: growth (stronger every round), aura (buffs adjacent allies each round), or conditional (a big bonus if your squad or its placement fits)." },
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

// "How to play tactics" - the turn-based fight, one skimmable entry per
// system. `icon` is the same glyph the board uses, `tone` colours its chip.
export const TACTICS_HELP = [
  { icon: "▦", tone: "gold", term: "Deployment", blurb: "Before turn 1, click a hero and then a gold tile to choose where it starts. Press Begin Battle when ready." },
  { icon: "●●", tone: "gold", term: "Action points", blurb: "Each hero has 2 AP a turn (the dots). Moving, attacking and abilities each cost AP. End Turn when you're done." },
  { icon: "➤", tone: "moss", term: "Move & attack", blurb: "Click a hero: blue tiles show where it can walk, red outlines what it can hit. Click one to act." },
  { icon: "↑", tone: "gold", term: "Facing & flanking", blurb: "The arrow shows where a hero faces. Hitting its side deals +10%, its back +50% (a critical hit)." },
  { icon: "⛶", tone: "ember", term: "Zone of control", blurb: "Melee heroes control the tiles around them. Walking out of an enemy's zone costs an extra AP and can draw a free hit." },
  { icon: "✦", tone: "rune", term: "Abilities", blurb: "Every hero has one special move under its card - a heal, a shield, a big shot. It then needs a few turns to recharge (⏳)." },
  { icon: "♛", tone: "gold", term: "Commander Power", blurb: "Your Commander's big Power is a mana ULTIMATE: it needs a full blue bar and spends all of it - refill the bar to use it again. Keep your Commander alive - it's the heart of the squad." },
  { icon: "💧", tone: "rune", term: "Mana", blurb: "Every hero and enemy has mana (the thin blue bar). Skills cost AP + mana; attacks, moves, Overwatch and Hunker Down are free. Bars start full each fight and refill a little every turn. Casters and healers have big pools, tanks small ones." },
  { icon: "⚡", tone: "rune", term: "Mana gains & Overcharge", blurb: "Tanks gain mana from damage they block, melee heroes when they hit (more on a kill), ranged heroes when they end a turn without moving (more on high ground or in cover), healers and support when they help an ally. Mana above full is stored as Overcharge (the bright cap) - your next skill spends it for a bonus. Mana potions, relics and some skills restore mana; some enemies drain it." },
  { icon: "⚔", tone: "ember", term: "Enemy intents", blurb: "Badges above enemies show their next move: ⚔ strike, ➤ advance, ✦ stunned. What you see is exactly what happens when you end the turn." },
  { icon: "✹", tone: "ember", term: "Telegraphed skills", blurb: "Big enemy skills wind up first. Red tiles get hit when you end your turn - step out of them." },
  { icon: "⛰", tone: "moss", term: "Terrain", blurb: "High ground: +1 range for archers, +25% damage downhill. Barricades block paths and can be broken. Bridges cross rivers. Tall grass hides you from range. Lava burns if you end a turn on it. Ice slides you one tile further." },
  { icon: "🔥", tone: "ember", term: "Element combos", blurb: "Burn, Chill and Entangle are element statuses. Two Chill freezes a hero; mixing elements sets off combos. 'Element combos' in the battle panel lists them all." },
  { icon: "⚑", tone: "rune", term: "Objectives", blurb: "Some fights change the goal: survive a number of turns, protect the Seer, break the Totem, or hold out until reinforcements arrive." },
  { icon: "☠", tone: "ember", term: "Boss phases", blurb: "Bosses change phase at the markers on their HP bar - each phase changes the arena. The bar says what happens next turn." },
  { icon: "❖", tone: "rune", term: "Factions", blurb: "Some enemy packs share a faction rule - Wanderers strike then fade, Mirrors copy your squad, the Corrupted spread Blight. The banner explains it." },
  { icon: "Lv", tone: "gold", term: "Hero levels", blurb: "Heroes earn XP in fights. Each level lets you pick a perk between fights." },
  { icon: "♥", tone: "moss", term: "Wounds carry over", blurb: "Damage stays after a fight. A hero that falls comes back Wounded at 25% HP - Mend it in the shop or rest." },
]
