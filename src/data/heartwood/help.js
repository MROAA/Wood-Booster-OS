// Hearthwood Trial - the "?" reference overlay. A plain-language
// glossary of every system a player meets in a run, reachable any time
// from the ? button (HelpOverlay.jsx). Hand-authored, kept short - this
// is a "remind me how X works" panel, not a manual.

// The Long Campaign (components/heartwood/campaign/) - also shown on the
// campaign's own world map behind its "?" button.
export const CAMPAIGN_HELP = [
  { term: "The world map", blurb: "Seven regions. Every day you leave one alone, its threat climbs; at 100 it FALLS. Missions appear on the map and expire - you can't answer them all. Regions further along the road stay quiet until the story reaches them." },
  { term: "Doom", blurb: "The dial on the map. Fallen regions, wiped squads, ignored hunters and plain time all raise it, and it makes every fight harder. If it fills up - or the Hearthstead falls - the campaign is lost. Story wins and retaking regions bring it down." },
  { term: "Roster & fatigue", blurb: "Pick 4-6 heroes for each mission. Heroes who fought are Tired for 2 days; badly hurt ones are Wounded until they heal. Keep a deep roster so someone is always ready." },
  { term: "Permadeath", blurb: "A hero who falls in a campaign mission is gone for good. Their name goes on the Memorial at the Hearth. Retreat (not on Ironman) saves the living but loses the mission." },
  { term: "Hearth rooms", blurb: "Build rooms with Essence (the Ley Well also needs Ley Shards). Each takes days, one at a time: Infirmary heals faster, Barracks holds more heroes, Training Hall teaches resting heroes, Ley Well deepens mana, Recruitment Post brings more recruits." },
  { term: "Story choices", blurb: "Every chapter's story mission ends in a choice. Choices change the next chapter, which faction joins you (a unique hero + warriors in their region), who hunts you, the map itself, and which endings you can reach. The Chronicle at the Hearth keeps them all." },
  { term: "Allies & nemeses", blurb: "An allied faction's warriors fight beside you in their home region, every story mission and their Call to Arms missions. A nemesis sends Hunted missions every few days - beat it twice to drive it off; ignore one and Doom rises." },
  { term: "Ley network", blurb: "Coloured ley lines join the regions. A line counts while you hold BOTH its regions (safe - not threatened or fallen) and it links back to the Hearthstead. The bigger your network, the more start mana and regen every fight gets, and each line colour makes skills of that colour 15% cheaper. Ley Breach missions (⚡) try to cut a line - ignore or lose one and the line is cut; winning a Ley Site next to a cut line mends it. Warded ley lines count double and can't be breached; Drained ley surges for a few days, then its lines wither." },
  { term: "Endings", blurb: "Six endings, each opened by different choices. Every ending unlocks something for your next campaign: a commander, a starting relic, or a new story start." },
]

export const HELP_SECTIONS = [
  {
    heading: "The run",
    entries: [
      { term: "Structure", blurb: "A run is a path of fights broken into Acts. Each Act is tougher than the last; the deeper you go, the more Essence a win pays." },
      { term: "Winning & losing", blurb: "Clear the final boss to win. Lose any fight and the run ends - what you carried out seeds your next attempt (the Grove)." },
      { term: "Choices", blurb: "Between fights you'll pick a path, an event, or a relic. Most of what you leave behind comes back around later in the run." },
    ],
  },
  {
    heading: "Between fights",
    entries: [
      { term: "Paths", blurb: "Every fight is a fork of 2-3 paths. Quiet is the usual. Hunted is tougher and pays more Essence plus gear. Cursed is much tougher, pays a relic, and closes behind you if you pass it by." },
      { term: "Camp", blurb: "Some paths lead to a Camp instead of the next Market. You get 2 actions - Rest, Train, Craft, Scout or Commune (mana). You can't do them all." },
      { term: "Sets", blurb: "Relics and gear belong to families (Wellspring, Emberkin, Thornwall...). Own 2, 4 or 6 different pieces of one family for a growing squad bonus. The badge on a card shows your count." },
      { term: "Fates", blurb: "Some event choices come back later: a curse, an ally who joins a fight, a rival who hunts you, a merchant's mood, a debt. The run panel lists them until they resolve." },
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
    // Dota depth sprint: the Build guide (item tiers, build paths, actives, counters).
    heading: "Build guide",
    entries: [
      { term: "Item tiers", blurb: "Components are sold in the shop. Two or three of them plus a recipe cost forge a Crafted item (from Act II); Crafted items forge into Masterworks (from Act III). A card says what it is made from and what it builds into." },
      { term: "Forging", blurb: "Open a hero's Gear screen in the Market: its Build path shows every step, which parts you have, and a Forge button. A camp's Craft action can forge too. The parts are used up - worn or in the bag." },
      { term: "Build paths", blurb: "Each hero picks one of 2-3 paths for its class (Unbending Oak, Reaper, Mistpiercer, Spellbreaker, Gale-walker, Wellspring, Witherward). The shop then marks the components that path still needs with a gold glow." },
      { term: "Active items", blurb: "Some items add a button to the hero's action bar: Foxfire Step (blink), Gale Push (shove anyone), Sap Burn (drain mana), Cyclone Lift (a foe skips its turn and can't be hit), Heartoak Bark (no control for 2 turns), Unbind (dispel), and consumables with uses - Salve, Moonwell Sip, Glowdust. They cost AP and/or mana and recharge." },
      { term: "Enemy tricks", blurb: "Some enemy families bring a trick that needs an answer: Ironbark armour (armour shred), Mist Veil dodges (true strike, area, or skills), Mossbloom healing (Wither), Seedcallers (area damage), Runeshells (mana burn or dispel) and Shadowmoss hiding (Glowdust or an Owl Lantern). Act I only meets Ironbark; the rest arrive in Acts II and III." },
      { term: "Bring: ...", blurb: "The threat panel before a fight and the Scout report both list the tricks ahead and what to bring - forge or buy the answer before you go in." },
      { term: "Worldseed Scepter", blurb: "A Masterwork that upgrades its wearer's class: the signature skill hits 50% harder and recharges sooner, the first class skill recharges sooner, every skill costs less mana." },
    ],
  },
  {
    // Dota depth 2: talents, neutral items, more enemy tricks + enemy talents.
    heading: "Talents & neutral items",
    entries: [
      { term: "Talent tree", blurb: "Every class has a talent tree with two rows. At Level 2 and Level 4 the level-up IS the talent pick: choose the left or the right talent of that row, for good. Talents change how a hero plays - a 2nd charge (cast a skill twice before it recharges), a faster recharge, a skill that suddenly hits an area, cheaper casts, or mana that comes back per cast, hit or kill. Levels 3 and 5 stay the skill-branch-or-perk pick plus the promotion ceremony. See the tree on a hero's Gear screen (★ = chosen, faded = passed over, grey = not reached yet)." },
      { term: "Mana talents", blurb: "Many talents feed the class resource: Mana Shield (part of each hit is paid from the bar), Wellspring Echo (mana back per cast), Sap Thief (per basic hit), Soul Tithe (per kill), Deep Well (bigger bar), Ley Spring (more each turn), Opening Gambit (the first skill each fight is free)." },
      { term: "Neutral items", blurb: "Won fights sometimes drop a neutral item - elites often, minibosses and bosses always. Tiers open as the story goes on (Tier I in Act I up to Tier V in Act VII). Each hero has ONE neutral slot apart from its gear row; open its Gear screen to put one on. Spare neutrals wait in the stash (the campaign keeps one too)." },
      { term: "More enemy tricks", blurb: "Later Acts bring five more: Bloodfang (lifesteal - answer: Wither / healing cut), Splitting Spores (splits in two when it falls - answer: area damage), Burrower (underground every other turn - answer: reveal), Thornmirror (the first skill each turn bounces half back - answer: basic attacks or a dispel), Hushcap (no skills within 2 tiles - answer: item actives, attacks, a dispel)." },
      { term: "Enemy talents", blurb: "At Threat T2 and up the elites, minibosses and bosses get talents too (T2-T3 one, T4 two, T5 three; at T4+ the second-strongest foe gets one as well): Thick Hide, Sharpened, Fleet, Mana Siphon, Second Wind, Bloodrage, Spellguard. The Threat panel lists them; ✧ marks the enemy on the board." },
    ],
  },
  {
    heading: "Mana colours & risks",
    entries: [
      { term: "Four colours", blurb: "Mana comes in four colours: 🔥 Ember (fire, fury), 🌊 Tide (water, frost, healing), 🌿 Root (earth, growth, guarding) and 🌑 Void (shadow, curses, drain). Every hero has an affinity from its class, and every skill a colour - the small pip on its button. Most heroes hold two colours." },
      { term: "Colour combos", blurb: "Cast two DIFFERENT colours in the same turn - one hero or two - and they combine into a free combo spell: Ember+Tide Steam Burst, Ember+Root Wildfire Bloom, Ember+Void Hellflare, Tide+Root Lifespring, Tide+Void Undertow, Root+Void Blight Bloom. The 'This turn' tracker above the skills shows what is waiting for a partner; a → icon on a button means casting it finishes a combo. A hero starting its turn on a coloured Mana Well has that colour primed for free." },
      { term: "Affinity bonus", blurb: "The hero who FINISHES a combo adds its affinity: Ember hits 2 harder, Tide heals itself 3, Root gains 3 Block, Void gets 5 of its resource back (and builds Backlash 40% slower)." },
      { term: "Overchannel", blurb: "Arm ⚡ Overchannel, then cast a skill you can't afford (not an ALL-IN skill): the missing mana is paid in HP (1 HP per 4% of the bar you're short), shown in red on the button before you click. Each overchannel fills the red Backlash meter on the hero (20 + the % short). At 100 the hero is STUNNED and takes 4 damage at the start of its next turn; otherwise the meter drains 15 a turn. No luck - the numbers are always the same. Void heroes and mages build Backlash slower; the Stormglass Phial relic makes it safer." },
      { term: "Mana-fed enemies", blurb: "Ley Leeches, Manamoths, Silence-eaters and the Gorging Maw FEED on mana spent near them: each hero skill cast in their reach adds a Hunger pip (+1 attack each; big casts and overchannels add 2). A full one is Gorged - the Maw then bursts in a Mana Nova on every hero within 2. Answer: cast away from them, attack or use items instead, burn their mana (it strips Hunger), or kill them first. They walk toward whoever casts the most." },
    ],
  },
  {
    heading: "Growing heroes",
    entries: [
      { term: "Evolution", blurb: "Deploy a common fill hero enough times, with its tribe fielded alongside it, and it becomes a stronger authored form. Free and permanent - a ▲ marks it." },
      { term: "Fusion", blurb: "Own three copies of the same hero and they combine into one bigger version." },
      { term: "Legendary hooks", blurb: "Legendary heroes carry one of: growth (stronger every round), aura (buffs adjacent allies each round), or conditional (a big bonus if your squad or its placement fits)." },
      { term: "Promotions", blurb: "At Level 3 a hero promotes into one of two advanced classes of its own class (a Guardian becomes a Paladin or a Bastion...): a strong new skill, more HP, an upgraded passive and a twist to its power bar. At Level 5 it masters that path or cross-trains in the other one. A Class Collar puts the promotion to sleep while worn." },
      { term: "Traits", blurb: "Every recruit comes with 1-2 quirks - Brave, Greedy, Lucky, Fragile, Mana-touched... - shown as chips on its card. They work in every fight, strange events can add or remove them, and at the Hearth's Nest each parent trait passes to the hatchling half the time." },
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
  {
    heading: "The Long Campaign",
    entries: CAMPAIGN_HELP,
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
  { icon: "⚠", tone: "ember", term: "Threat tiers", blurb: "Every fight has a Threat tier (T0-T5) shown on the board and the formation screen. It climbs slowly through the campaign: enemies get tougher, more of them join (a frontline, a backline and support), their skills recharge faster, and they play smarter - focus fire, take cover, go around your tanks, guard their casters, ambush." },
  { icon: "🪓", tone: "ember", term: "Enemy behaviours", blurb: "Each enemy plays a part, shown by the small icon under its role: Berserker charges the nearest hero, Assassin dives your backline and wounded, Guardian body-blocks for allies, Caster keeps its distance, Swarmer surrounds one hero, Summoner hides, Marksman seeks high ground and cover." },
  { icon: "☄", tone: "rune", term: "Enemy ultimates", blurb: "Elites, bosses and some casters fill a violet ULTIMATE bar. When it's full they channel (⚠ + marked tiles) and fire on their next turn. Break it by burning or stealing ANY of their mana, stunning or freezing them, or one big hit (20%+ of their HP) - or get out of the tiles." },
  { icon: "✦", tone: "gold", term: "Hero ultimates", blurb: "A hero with a FULL resource bar can spend all of it (1 AP) for its role's ultimate: tanks Unbreakable, melee Onslaught, ranged Deadeye, healers Renewal, support Mana Surge, control Mana Storm (breaks enemy ultimates)." },
  { icon: "⇄", tone: "rune", term: "Mana Link & Mana Wells", blurb: "Support, healer and control heroes (and the Commander) can Mana Link: pay some of their bar to give an ally +20 of its own resource - free, once a turn. Glowing blue Mana Wells give +12 to whoever starts a turn on one, and charge enemy ultimates faster - fight over them." },
  { icon: "🌈", tone: "rune", term: "Mana colours & combos", blurb: "Every skill has a colour (Ember, Tide, Root, Void - the pip on its button). Two DIFFERENT colours cast in one turn set off a combo spell (Steam Burst, Wildfire Bloom, Hellflare, Lifespring, Undertow, Blight Bloom). See 'Mana colours & risks' in the battle panel." },
  { icon: "⚡", tone: "ember", term: "Overchannel & Backlash", blurb: "Arm Overchannel to cast past an empty bar: pay the shortfall in HP and fill the Backlash meter. A full meter stuns the hero (and hurts it) at the start of its next turn. The button shows the exact price first." },
  { icon: "🍽", tone: "ember", term: "Mana-fed enemies", blurb: "Purple Hunger pips: this enemy grows stronger from every skill cast near it. Cast away from it, attack instead, burn its mana, or kill it first." },
  { icon: "⚔", tone: "ember", term: "Enemy intents", blurb: "Badges above enemies show their next move: ⚔ strike, ➤ advance, ✦ stunned. What you see is exactly what happens when you end the turn." },
  { icon: "✹", tone: "ember", term: "Telegraphed skills", blurb: "Big enemy skills wind up first. Red tiles get hit when you end your turn - step out of them." },
  { icon: "⛰", tone: "moss", term: "Terrain", blurb: "High ground: +1 range for archers, +25% damage downhill. Barricades block paths and can be broken. Bridges cross rivers. Tall grass hides you from range. Lava burns if you end a turn on it. Ice slides you one tile further. Fire spreads through tall grass; frost freezes deep water into walkable ice." },
  { icon: "💥", tone: "ember", term: "Knockback chaos", blurb: "Knock a unit back (Shove, Shoulder Check, some promotions) and the world reacts: into lava, flames, poison or spikes it goes; into another unit both get hurt; into a barrel it explodes; into a tree it falls; small enemies drown in deep water. Chains are counted. Some brutes shove YOUR heroes the same way - watch what's behind you." },
  { icon: "🔥", tone: "ember", term: "Element combos", blurb: "Burn, Chill and Entangle are element statuses. Two Chill freezes a hero; mixing elements sets off combos. 'Element combos' in the battle panel lists them all." },
  { icon: "⚑", tone: "rune", term: "Objectives", blurb: "Some fights change the goal: survive a number of turns, protect the Seer, break the Totem, or hold out until reinforcements arrive." },
  { icon: "☠", tone: "ember", term: "Boss phases", blurb: "Bosses change phase at the markers on their HP bar - each phase changes the arena. The bar says what happens next turn." },
  { icon: "❖", tone: "rune", term: "Factions", blurb: "Some enemy packs share a faction rule - Wanderers strike then fade, Mirrors copy your squad, the Corrupted spread Blight. The banner explains it." },
  { icon: "Lv", tone: "gold", term: "Hero levels", blurb: "Heroes earn XP in fights. Each level lets you pick a perk between fights." },
  { icon: "♥", tone: "moss", term: "Wounds carry over", blurb: "Damage stays after a fight. A hero that falls comes back Wounded at 25% HP - Mend it in the shop or rest." },
]
