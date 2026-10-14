// Hearthwood - SIGNATURE MECHANICS (Hero Identity sprint, Marc: "heroes
// feel alike"). Every one of the 38 classes gets ONE rule of its own that
// changes HOW it plays - not a number on a card. Most build on the class's
// resource (resources.js), so the resource bar becomes part of the
// mechanic. The rules run in services/heartwood/tacticsSignatures.js.
// Pure data - Studio-editable (Hearthwood Studio > ✨ Hero Identity).
//
// Fields:
//   name / icon / text - what the player sees (token chip + tooltip)
//   gauge  - how the token reads: "pips" (stacks), "toggle" (on/off),
//            "count" (a number)
//   max    - the stack cap (pips)
//   combo  - how it plays with stances / combos / reactions (tooltip)
//   n      - the rule's numbers (read by tacticsSignatures.js)
//   legendary - the class's ONE signature legendary item (gear.js /
//            items.js, kind "signature"). Worn by a hero OF THIS CLASS it
//            transforms the mechanic: `n` overrides the numbers above,
//            `skill` patches one class skill, `fx` = plain gear stats.
//            Found rarely: minibosses / elites / a special event.

export const SIGNATURES = {
  guardian: {
    id: "guardian", name: "Bulwark", icon: "🛡", gauge: "toggle", max: 1,
    text: "End your turn WITHOUT moving and the Guardian plants a Bulwark until its next turn: allies within 1 tile take 1 less per hit, and every hit soaked there gives it +1 Holy Power.",
    combo: "A Defensive stance also plants the Bulwark even after moving.",
    n: { radius: 1, guard: 1, holy: 1 },
    legendary: { id: "sig-guardian", name: "Aegis of the Old Oak", icon: "shield", text: "The Bulwark reaches 2 tiles. Bodyguard recharges 1 turn faster.", n: { radius: 2 }, skill: { id: "guard", patch: { cooldown: 1 } }, fx: { hp: 4 } },
  },
  warden: {
    id: "warden", name: "Bramble Hide", icon: "✲", gauge: "pips", max: 4,
    text: "Every hit the Warden takes grows a Thorn (max 4). Any enemy that strikes it in melee takes 1 damage per Thorn.",
    combo: "Holding a Parry still grows a Thorn - and the attacker eats the thorns.",
    n: { perHit: 1 },
    legendary: { id: "sig-warden", name: "Briarheart Mantle", icon: "root", text: "Grows 2 Thorns a hit and holds up to 6.", n: { perHit: 2, max: 6 }, fx: { hp: 3 } },
  },
  juggernaut: {
    id: "juggernaut", name: "Momentum", icon: "➠", gauge: "pips", max: 5,
    text: "Every tile it moves builds 1 Momentum (max 5). Its next melee hit spends it all: +1 damage per Momentum, +3 Rage each, and at 3+ the target is knocked Off-balance and Staggered.",
    combo: "The Off-balance it leaves sets up a Finisher combo for the next melee hero.",
    n: { perStack: 1, rage: 3, staggerAt: 3 },
    legendary: { id: "sig-juggernaut", name: "Avalanche Greaves", icon: "stone", text: "Momentum holds up to 8. Charge reaches 2 tiles further.", n: { max: 8 }, skill: { id: "charge", patch: { range: 6 } }, fx: { hp: 3 } },
  },
  sentinel: {
    id: "sentinel", name: "Held Breath", icon: "◎", gauge: "pips", max: 3,
    text: "Each turn it ends WITHOUT moving it holds 1 more Breath (max 3): +10% to hit each. At full Breath its next shot is a PERFECT SHOT (+50% damage) and lets the breath out. Moving loses all Breath.",
    combo: "Focus stance keeps the breath even when it shifts a tile.",
    n: { aim: 10, focus: 5, perfectMult: 1.5 },
    legendary: { id: "sig-sentinel", name: "Stillwater Scope", icon: "rune", text: "+15% to hit per Breath. Sniper's Watch recharges 1 turn faster.", n: { aim: 15 }, skill: { id: "overwatch", patch: { cooldown: 1 } }, fx: { aim: 5 } },
  },
  bruiser: {
    id: "bruiser", name: "Grit", icon: "✊", gauge: "pips", max: 4,
    text: "Every 3 HP it loses becomes 1 Grit (max 4). Its next melee hit lets it all out: +1 damage per Grit, and it heals 1 HP per Grit.",
    combo: "Aggressive stance takes more damage - and builds Grit faster.",
    n: { hpPer: 3, perStack: 1, heal: 1, rage: 5 },
    legendary: { id: "sig-bruiser", name: "Knuckles of the Pit", icon: "sword", text: "Grit comes from every 2 HP lost and heals 2 HP per Grit.", n: { hpPer: 2, heal: 2 }, fx: { attack: 1 } },
  },
  striker: {
    id: "striker", name: "Openings", icon: "✧", gauge: "pips", max: 3,
    text: "Every ATTACK on an enemy that carries any status or combo setup finds an Opening (max 3). Its next SKILL spends them: +2 damage per Opening, and at 2+ the enemy is Staggered.",
    combo: "Setups from other heroes count as statuses - feed it Off-balance and Marked foes.",
    n: { perStack: 2, staggerAt: 2 },
    legendary: { id: "sig-striker", name: "Thousand-Cut Wraps", icon: "sword", text: "Holds up to 5 Openings. Finishing Blow has no recharge.", n: { max: 5 }, skill: { id: "finishing-blow", patch: { cooldown: 0 } }, fx: { attack: 1 } },
  },
  assassin: {
    id: "assassin", name: "Shadowmeld", icon: "☾", gauge: "toggle", max: 1,
    text: "Starts every fight in STEALTH. Its first hit out of stealth deals +50% damage. A kill slips it right back into stealth.",
    combo: "Ambush hits from behind stack with Backstab and the back-hit crit.",
    n: { mult: 1.5, turns: 1 },
    legendary: { id: "sig-assassin", name: "Veil of the Last Dusk", icon: "shadow", text: "Ambush hits deal +100%. Shadow Step recharges 1 turn faster.", n: { mult: 2 }, skill: { id: "shadow-step", patch: { cooldown: 2 } }, fx: { evade: 1 } },
  },
  duelist: {
    id: "duelist", name: "Tempo", icon: "⚜", gauge: "pips", max: 3,
    text: "Hitting the SAME enemy again and again builds Tempo (max 3): +1 damage each and +1 Combo. Switching targets starts over at 1; a hit from another enemy loses 1 Tempo.",
    combo: "Challenge an enemy, then keep the rhythm on it.",
    n: { perStack: 1, combo: 1 },
    legendary: { id: "sig-duelist", name: "Rapier of Seven Rivers", icon: "sword", text: "Tempo holds up to 5 and each step also adds +5% to hit.", n: { max: 5, aim: 5 }, fx: { aim: 5 } },
  },
  ranger: {
    id: "ranger", name: "Quarry", icon: "➹", gauge: "toggle", max: 1,
    text: "The first enemy it hits becomes its QUARRY: +1 damage and +10% to hit against it. Killing the Quarry gives +20 Focus and marks the nearest enemy as the next one.",
    combo: "Quarry shots leave Off-balance - melee heroes cash it in.",
    n: { dmg: 1, aim: 10, focus: 20 },
    legendary: { id: "sig-ranger", name: "Antler Longbow", icon: "leaf", text: "+2 damage and +15% to hit against the Quarry.", n: { dmg: 2, aim: 15 }, fx: { aim: 5 } },
  },
  artillery: {
    id: "artillery", name: "Braced", icon: "⛬", gauge: "toggle", max: 1,
    text: "End a turn WITHOUT moving and it is BRACED: while braced, every hit it lands also blasts 1 damage onto each enemy next to the target. Moving un-braces it.",
    combo: "Splash leaves Rooted enemies open to a Crush.",
    n: { splash: 1 },
    legendary: { id: "sig-artillery", name: "Siegebreaker Tripod", icon: "stone", text: "Braced splash deals 2. Piercing Beam reaches 2 tiles further.", n: { splash: 2 }, skill: { id: "piercing-beam", patch: { range: 7 } }, fx: { attack: 1 } },
  },
  executioner: {
    id: "executioner", name: "Bloodscent", icon: "✝", gauge: "pips", max: 3,
    text: "It smells blood: enemies below 50% HP are SCENTED. Every kill adds 1 Scent (max 3): +1 damage per Scent against scented enemies, +10 Fury per kill.",
    combo: "Staggered enemies are scented too.",
    n: { below: 0.5, perStack: 1, fury: 10 },
    legendary: { id: "sig-executioner", name: "Headsman's Verdict", icon: "sword", text: "Scents enemies below 60% HP and holds up to 4 Scent.", n: { below: 0.6, max: 4 }, fx: { attack: 1 } },
  },
  spellblade: {
    id: "spellblade", name: "Spellweave", icon: "✦", gauge: "pips", max: 3,
    text: "Weave blade and spell: an attack right after a skill (or a skill right after an attack) adds 1 Weave (max 3) and that hit deals +1 damage per Weave.",
    combo: "Weaving skills between hits keeps Arcane Edge burning too.",
    n: { perStack: 1 },
    legendary: { id: "sig-spellblade", name: "Runeblade of Twin Tides", icon: "rune", text: "+2 damage per Weave. Arcane Dash recharges 1 turn faster.", n: { perStack: 2 }, skill: { id: "arcane-dash", patch: { cooldown: 1 } }, fx: { attack: 1 } },
  },
  healer: {
    id: "healer", name: "Overgrowth", icon: "❀", gauge: "pips", max: 3,
    text: "Each heal plants a Seed (max 3). A heal that tops an ally up to full also gives it +2 Block. At 3 Seeds the next heal BLOOMS: every ally next to the target heals 2 too.",
    combo: "Focus stance + healing = a full Nature bar for the next Bloom.",
    n: { block: 2, burst: 2 },
    legendary: { id: "sig-healer", name: "Evergreen Chalice", icon: "leaf", text: "Blooms at 2 Seeds and the Bloom heals 3.", n: { max: 2, burst: 3 }, fx: { hp: 3 } },
  },
  medic: {
    id: "medic", name: "Triage", icon: "✚", gauge: "pips", max: 3,
    text: "At the start of your turn it counts every ally at or below half HP within 3 tiles (max 3 Triage). Each heal it casts mends +1 HP per Triage, and each Triage gives +5 Blood.",
    combo: "Wounded heroes nearby make the Medic stronger - risky play pays.",
    n: { radius: 3, blood: 5, perStack: 1 },
    legendary: { id: "sig-medic", name: "Field Surgeon's Kit", icon: "heart", text: "Triage counts allies within 5 tiles. Emergency Stim recharges 1 turn faster.", n: { radius: 5 }, skill: { id: "emergency-stim", patch: { cooldown: 2 } }, fx: { hp: 3 } },
  },
  buffer: {
    id: "buffer", name: "Anthem", icon: "♫", gauge: "pips", max: 4,
    text: "Every buff or heal it casts on an ally gives that ally an ANTHEM (+1 damage for 2 turns) and the Buffer 1 Verse. At 4 Verses: CRESCENDO - every ally within 2 tiles gains +2 Block.",
    combo: "Anthem allies cash in combos harder.",
    n: { dmg: 1, turns: 2, block: 2, radius: 2 },
    legendary: { id: "sig-buffer", name: "Lute of the Long Night", icon: "cosmic", text: "Anthem gives +2 damage.", n: { dmg: 2 }, fx: { hp: 3 } },
  },
  commander: {
    id: "commander", name: "Battle Orders", icon: "♛", gauge: "pips", max: 3,
    text: "Every kill by any hero adds 1 Order (max 3). Heroes within 3 tiles of it get +5% to hit per Order.",
    combo: "Orders keep combo chains landing.",
    n: { radius: 3, aim: 5 },
    legendary: { id: "sig-commander", name: "Banner of the Hearth-King", icon: "cosmic", text: "Orders reach 5 tiles and give +7% each.", n: { radius: 5, aim: 7 }, fx: { hp: 4 } },
  },
  tactician: {
    id: "tactician", name: "Gambit", icon: "♞", gauge: "pips", max: 3,
    text: "Every side or back hit ANY hero lands adds 1 Gambit (max 3). At 3 its next skill gets 1 AP back.",
    combo: "Flanking plans pay twice: crits for the striker, AP for the Tactician.",
    n: { ap: 1 },
    legendary: { id: "sig-tactician", name: "Strategist's Board", icon: "rune", text: "The AP refund comes at 2 Gambit.", n: { max: 2 }, fx: { hp: 3 } },
  },
  controller: {
    id: "controller", name: "Tether", icon: "⛓", gauge: "toggle", max: 1,
    text: "The last enemy it hits is TETHERED. If that enemy ends a move more than 2 tiles from the Controller, the tether snaps it back: 3 damage and Slowed.",
    combo: "A tethered enemy that runs is easy prey for Overwatch.",
    n: { leash: 2, dmg: 3 },
    legendary: { id: "sig-controller", name: "Chains of the Deep Root", icon: "root", text: "A snapping tether deals 5 damage.", n: { dmg: 5 }, fx: { hp: 3 } },
  },
  frostbinder: {
    id: "frostbinder", name: "Rime Shell", icon: "❄", gauge: "pips", max: 3,
    text: "Every hit that leaves its target Chilled or Frozen adds 1 Rime (max 3). Each Rime: it takes 1 less per hit. An enemy that strikes it in melee is Chilled and melts 1 Rime.",
    combo: "Chill soaks enemies - a skill from another hero Shocks them.",
    n: { guard: 1 },
    legendary: { id: "sig-frostbinder", name: "Heart of the Glacier", icon: "tide", text: "Holds up to 5 Rime.", n: { max: 5 }, fx: { hp: 3 } },
  },
  rootweaver: {
    id: "rootweaver", name: "Strangleroots", icon: "🌿", gauge: "count", max: 0,
    text: "At the start of your turn every ROOTED enemy within 3 tiles takes 1 damage and feeds it +4 Nature.",
    combo: "Rooted enemies are open to a Crush combo from any area skill.",
    n: { radius: 3, dmg: 1, nature: 4 },
    legendary: { id: "sig-rootweaver", name: "Worldroot Staff", icon: "root", text: "Strangles within 5 tiles for 2 damage. Root Snare recharges 1 turn faster.", n: { radius: 5, dmg: 2 }, skill: { id: "root-snare", patch: { cooldown: 1 } }, fx: { hp: 2 } },
  },
  disruptor: {
    id: "disruptor", name: "Static", icon: "⚡", gauge: "count", max: 0,
    text: "Its hits charge the target with Static (shown on the enemy). At 3 Static the enemy SHORT-CIRCUITS: its skills recharge 2 turns longer and it loses 1 AP next turn.",
    combo: "Short-circuit + an Interrupt reaction can shut a caster down for good.",
    n: { at: 3, cd: 2 },
    legendary: { id: "sig-disruptor", name: "Storm-Torn Lodestone", icon: "gale", text: "Short-circuits at 2 Static.", n: { at: 2 }, fx: { hp: 2 } },
  },
  trapper: {
    id: "trapper", name: "Snare Line", icon: "🕸", gauge: "toggle", max: 1,
    text: "Once per enemy turn, the first enemy that ends a move NEXT to the Trapper is Snared (Rooted) and the Trapper gains +10 Focus.",
    combo: "Snared enemies are Rooted - set up a Crush.",
    n: { focus: 10, uses: 1, dmg: 0 },
    legendary: { id: "sig-trapper", name: "Wire of the Hunter-Queen", icon: "root", text: "Snares twice per enemy turn and each snare deals 2 damage.", n: { uses: 2, dmg: 2 }, fx: { hp: 2 } },
  },
  hexer: {
    id: "hexer", name: "Doom", icon: "⛧", gauge: "count", max: 0,
    text: "Its hits lay Doom on the target (shown on the enemy, max 3). A foe with 3 Doom takes 5 damage at the start of your next turn and the Doom resets.",
    combo: "Doom ticks on your turn - the enemy telegraph shows who is about to drop.",
    n: { at: 3, dmg: 5 },
    legendary: { id: "sig-hexer", name: "Grimoire of Endings", icon: "shadow", text: "Doom falls for 8 damage.", n: { dmg: 8 }, fx: { hp: 2 } },
  },
  summoner: {
    id: "summoner", name: "Soul Link", icon: "✺", gauge: "pips", max: 3,
    text: "Its summons grow stronger every turn they live: +1 Link a turn (max 3), +1 damage each. When a linked summon falls, the Summoner gains +2 Block per Link and +20 Spirit.",
    combo: "Keep spirits alive and they become real threats.",
    n: { perStack: 1, block: 2, spirit: 20 },
    legendary: { id: "sig-summoner", name: "Spirit-Bound Bell", icon: "cosmic", text: "Links grow to 5.", n: { max: 5 }, fx: { hp: 3 } },
  },
  beastmaster: {
    id: "beastmaster", name: "Pack Tactics", icon: "🐺", gauge: "count", max: 0,
    text: "When the Beastmaster AND its companion both hit the same enemy in one turn, the enemy is MAULED: Exposed (+25% damage taken) for 2 turns.",
    combo: "Mauled enemies are perfect Finisher targets.",
    n: { turns: 2, slow: 0 },
    legendary: { id: "sig-beastmaster", name: "Alpha's Collar", icon: "moonGlyph", text: "Mauled enemies are also Slowed.", n: { slow: 1 }, fx: { hp: 3 } },
  },
  alchemist: {
    id: "alchemist", name: "Catalyst", icon: "⚗", gauge: "count", max: 0,
    text: "Hitting a burning, chilled or poisoned enemy distils a matching reagent token (Fire, Frost or Poison) - feed Volatile Mixture from the battlefield.",
    combo: "Element combos on the board fill its satchel.",
    n: { tokens: 1 },
    legendary: { id: "sig-alchemist", name: "Philosopher's Retort", icon: "flame", text: "Distils 2 tokens a hit.", n: { tokens: 2 }, fx: { hp: 2 } },
  },
  scout: {
    id: "scout", name: "Spotter", icon: "👁", gauge: "count", max: 0,
    text: "At the start of your turn every enemy within 4 tiles of the Scout is SPOTTED (eye icon): every hero gets +10% to hit against it.",
    combo: "Spotted + Marked enemies are near-certain Called Shots.",
    n: { radius: 4, aim: 10 },
    legendary: { id: "sig-scout", name: "Eagle-Eye Spyglass", icon: "gale", text: "Spots within 6 tiles for +15% to hit.", n: { radius: 6, aim: 15 }, fx: { aim: 5 } },
  },
  saboteur: {
    id: "saboteur", name: "Rigged", icon: "💣", gauge: "count", max: 0,
    text: "Its hits RIG the target (bomb icon). A rigged enemy that dies explodes for 3 damage on every enemy next to it - chains can cascade.",
    combo: "Rig a cluster, then let an area skill set it off.",
    n: { dmg: 3 },
    legendary: { id: "sig-saboteur", name: "Firedamp Satchel", icon: "ember", text: "Rigged blasts deal 5.", n: { dmg: 5 }, fx: { hp: 2 } },
  },
  engineer: {
    id: "engineer", name: "Overclock", icon: "⚙", gauge: "pips", max: 3,
    text: "Every skill builds 1 Heat (max 3). At 3 Heat its next skill is OVERCLOCKED: +50% damage and 1 AP back - but it overheats and takes 2 damage.",
    combo: "Turrets and barricades build Heat too.",
    n: { mult: 1.5, ap: 1, burn: 2 },
    legendary: { id: "sig-engineer", name: "Dwarf-Forged Governor", icon: "stone", text: "Never overheats, and Overclocks at 2 Heat.", n: { burn: 0, max: 2 }, fx: { hp: 3 } },
  },
  spiritwalker: {
    id: "spiritwalker", name: "Between Worlds", icon: "☁", gauge: "toggle", max: 1,
    text: "End your turn with NO enemy next to it and it turns ETHEREAL until its next turn (takes 2 less per hit). End it next to an enemy and it ANCHORS instead: +10 Spirit.",
    combo: "Ethereal + Defensive stance makes it nearly untouchable.",
    n: { guard: 2, spirit: 10 },
    legendary: { id: "sig-spiritwalker", name: "Mask of Two Skies", icon: "moonGlyph", text: "Ethereal takes 3 less per hit. Phase Shift recharges 1 turn faster.", n: { guard: 3 }, skill: { id: "phase-shift", patch: { cooldown: 2 } }, fx: { hp: 2 } },
  },
  ritualist: {
    id: "ritualist", name: "Raise the Fallen", icon: "☠", gauge: "pips", max: 2,
    text: "NECROMANCY: when an enemy falls within 3 tiles and it holds 10 Souls, it spends them to RAISE the corpse as a Risen Thrall that fights for you (max 2 a fight).",
    combo: "Thralls body-block and flank - free setups for combos.",
    n: { radius: 3, cost: 10, hp: 8, attack: 3 },
    legendary: { id: "sig-ritualist", name: "Lantern of the Hollow King", icon: "shadow", text: "Raises up to 3 Thralls for 6 Souls each; they rise with 12 HP.", n: { max: 3, cost: 6, hp: 12 }, fx: { hp: 2 } },
  },
  chronomancer: {
    id: "chronomancer", name: "Borrowed Time", icon: "⧗", gauge: "pips", max: 3,
    text: "Every skill adds 1 Tick (max 3). At the start of your turn 3 Ticks turn into +1 AP.",
    combo: "Delay + Borrowed Time = a huge burst turn.",
    n: { ap: 1 },
    legendary: { id: "sig-chronomancer", name: "Hourglass of Dawn", icon: "cosmic", text: "2 Ticks are enough for the extra AP.", n: { max: 2 }, fx: { hp: 2 } },
  },
  shapeshifter: {
    id: "shapeshifter", name: "Feral Shift", icon: "🐾", gauge: "toggle", max: 1,
    text: "Changing form primes its INSTINCT: the first hit after a form change deals +3 damage and gives it +2 Block.",
    combo: "Shift, strike, shift again - every form swap is a burst.",
    n: { dmg: 3, block: 2 },
    legendary: { id: "sig-shapeshifter", name: "Moonhide Pelt", icon: "moonGlyph", text: "Instinct hits deal +5.", n: { dmg: 5 }, fx: { hp: 4 } },
  },
  corruptor: {
    id: "corruptor", name: "Spreading Rot", icon: "☣", gauge: "count", max: 0,
    text: "When a corrupted enemy dies its rot SPREADS: every enemy next to it gains 2 Corruption, and the Corruptor cools by 10.",
    combo: "Heart Rot (5 Corruption) makes every hit +2 - spread it through a pack.",
    n: { amount: 2, radius: 1, cool: 10 },
    legendary: { id: "sig-corruptor", name: "Blighted Censer", icon: "flame", text: "The rot spreads 2 tiles and adds 3.", n: { amount: 3, radius: 2 }, fx: { hp: 2 } },
  },
  merchant: {
    id: "merchant", name: "Coin Purse", icon: "🪙", gauge: "pips", max: 5,
    text: "Each hit pockets 1 Coin (max 5). With 3+ Coins its next hit on an enemy at or below half HP BRIBES it: the enemy is Stunned for a turn (3 Coins spent).",
    combo: "A bribed enemy skips its turn - and its ultimate breaks.",
    n: { cost: 3, below: 0.5 },
    legendary: { id: "sig-merchant", name: "Golden Scales", icon: "cosmic", text: "Bribes cost 2 Coins and work below 70% HP.", n: { cost: 2, below: 0.7 }, fx: { hp: 2 } },
  },
  "relic-keeper": {
    id: "relic-keeper", name: "Warding Relics", icon: "⚱", gauge: "pips", max: 2,
    text: "Starts each fight with 2 Relic Charges. When an ally within 2 tiles takes a hit of 4+, a charge soaks 2 of it (+10 mana).",
    combo: "Charges stack with Block, Ward and cover.",
    n: { radius: 2, soak: 2, mana: 10, minHit: 4 },
    legendary: { id: "sig-relic-keeper", name: "Reliquary of the First Fire", icon: "ember", text: "4 charges that soak 3 each.", n: { max: 4, soak: 3 }, fx: { hp: 3 } },
  },
  cleanser: {
    id: "cleanser", name: "Purity", icon: "✧", gauge: "count", max: 0,
    text: "At the start of your turn it washes ONE debuff off the most afflicted ally within 2 tiles (+10 Inspiration).",
    combo: "Frees Rooted / Slowed heroes before they waste a turn.",
    n: { radius: 2, count: 1, insp: 10 },
    legendary: { id: "sig-cleanser", name: "Font of Clear Water", icon: "tide", text: "Washes 2 debuffs within 3 tiles.", n: { radius: 3, count: 2 }, fx: { hp: 3 } },
  },
  gatherer: {
    id: "gatherer", name: "Forage", icon: "🌾", gauge: "pips", max: 3,
    text: "Every turn it ends after moving it forages 1 (max 3). At 3 it brews a Wild Berry: the most hurt ally within 2 tiles heals 4.",
    combo: "Walk the edges of the fight - then feed the front line.",
    n: { heal: 4, radius: 2 },
    legendary: { id: "sig-gatherer", name: "Bottomless Basket", icon: "leaf", text: "Brews at 2 and the berry heals 6.", n: { max: 2, heal: 6 }, fx: { hp: 3 } },
  },
}

export const SIGNATURE_IDS = Object.keys(SIGNATURES)

export function signatureFor(classId) {
  return SIGNATURES[classId] || null
}

// The class whose legendary this item is (null = not a signature item).
export function signatureItemClass(itemId) {
  for (const s of Object.values(SIGNATURES)) if (s.legendary?.id === itemId) return s.id
  return null
}
