// Hearthwood class system (Class System & Tactical Roles PRD): part A
// §5-23 + part B §24-40 (+ Cleanser, Gatherer from §3) = 38 classes, each a passive + 2-3 active skills. A unit's own
// derived ability stays on top as its personal "signature" skill.
// Pure data - tacticsClasses.js executes skills / applies passives.
//
// Skill fields: id, name, icon, cost (AP), cooldown (own turns), target
// ("enemy" | "ally" | "self"), range (tiles; "reach" = the unit's own
// attack reach), text (plain-English tooltip). Other fields are numbers
// read by the skill's own handler in tacticsClasses.js.

export const CLASS_GROUPS = {
  frontline: "Frontline",
  damage: "Damage",
  control: "Control",
  support: "Support",
  summoning: "Summoning & Economy",
  specialist: "Specialist",
}

export const CLASSES = {
  guardian: {
    id: "guardian",
    name: "Guardian",
    group: "frontline",
    icon: "⛨",
    manaPool: 45,
    resource: "holy",
    description: "Protects allies and holds the front line.",
    passive: { id: "stalwart", name: "Stalwart", text: "Side hits don't weaken its Block, and it can't be pushed or pulled. INTERCEPT: once per enemy turn it takes half of a blow aimed at an adjacent ally (+1 Holy Power)." },
    skills: [
      { id: "guard", name: "Bodyguard", icon: "⛨", cost: 1, cooldown: 2, mana: 0, target: "ally", range: 1, noSelf: true, gen: 1, text: "Guard an adjacent ally until your next turn: the Guardian takes half of every attack aimed at it (+1 Holy Power each time). Builds 1 Holy Power." },
      { id: "shield-wall", name: "Shield Wall", icon: "▦", cost: 1, cooldown: 3, mana: 2, target: "self", self: 3, allies: 2, spend: "all", allIn: { per: 1, block: 1 }, text: "ALL-IN (2+ Holy Power): +3 Block to itself and +2 to every adjacent ally, +1 more to everyone per Holy Power spent beyond 2. Until your next turn adjacent allies count the Guardian as HALF COVER." },
      { id: "provoke", name: "Provoke", icon: "⚑", cost: 1, cooldown: 3, mana: 1, target: "self", radius: 2, block: 2, text: "TAUNT: every enemy within 2 tiles is Provoked until your next turn - it must attack the Guardian if it can, and walks toward it otherwise. +2 Block." },
    ],
  },
  warden: {
    id: "warden",
    name: "Warden",
    group: "frontline",
    icon: "❦",
    manaPool: 45,
    resource: "holy",
    description: "Guards an area, not just one ally.",
    passive: { id: "hold-ground", name: "Hold Ground", text: "If it didn't move this turn, it gains +2 Block when you end the turn." },
    skills: [
      { id: "warden-zone", name: "Warden Zone", icon: "◌", cost: 1, cooldown: 3, mana: 1, target: "self", block: 1, text: "It and allies within 1 tile gain +1 Block and take 1 less damage from every hit until your next turn." },
      { id: "thorn-boundary", name: "Thorn Boundary", icon: "✲", cost: 1, cooldown: 3, mana: 2, target: "self", radius: 2, damage: 2, text: "Thorns burst out: every enemy within 2 tiles takes 2 damage and is Slowed." },
      { id: "bastion", name: "Bastion", icon: "⛫", cost: 1, cooldown: 3, mana: 0, gen: 1, target: "self", block: 2, text: "BASTION STANCE until your next turn: it can't move, takes HALF damage from every hit, +2 Block. Builds 1 Holy Power." },
    ],
  },
  juggernaut: {
    id: "juggernaut",
    name: "Juggernaut",
    group: "frontline",
    icon: "⚒",
    manaPool: 45,
    resource: "rage",
    description: "Slow, but almost impossible to stop.",
    passive: { id: "last-stand", name: "Last Stand", text: "Below half HP it takes 1 less damage from every hit and can't be pushed or pulled." },
    skills: [
      { id: "charge", name: "Charge", icon: "➠", cost: 2, cooldown: 3, mana: 0, target: "enemy", range: 4, gen: 10, text: "Gap closer: shake off Root and Slow, charge in a straight line to an enemy up to 4 tiles away and hit it: +1 damage per tile charged. Free - builds 10 Rage." },
      { id: "ground-breaker", name: "Ground Breaker", icon: "✺", cost: 2, cooldown: 3, mana: 40, target: "self", text: "Smash the ground: every adjacent enemy is hit and Slowed, adjacent barricades crumble." },
      { id: "hook", name: "Hook", icon: "⚓", cost: 1, cooldown: 2, mana: 25, target: "enemy", range: 3, steps: 2, text: "Hook an enemy within 3 and drag it up to 2 tiles toward the Juggernaut - off its cover - then hit it for half damage." },
    ],
  },
  sentinel: {
    id: "sentinel",
    name: "Sentinel",
    group: "frontline",
    icon: "◎",
    manaPool: 45,
    resource: "focus",
    archetype: "sniper",
    description: "Sniper - holds a perch and picks targets off from long range.",
    passive: { id: "defensive-aim", name: "Deadeye", text: "While it hasn't moved this turn its shots lose no accuracy over distance and deal +1. On high ground it shoots 2 tiles further." },
    skills: [
      { id: "overwatch", name: "Sniper's Watch", icon: "◉", cost: 1, cooldown: 2, mana: 15, target: "self", owAim: 20, text: "Until your next turn, it shoots the first enemy that ends a move within its range - an Aimed shot (+20% to hit)." },
      { id: "mark-intruder", name: "Headshot", icon: "⊕", cost: 2, cooldown: 3, mana: 30, target: "enemy", range: "reach", aim: 25, mult: 1.5, spend: "all", allIn: { per: 20, dmg: 1 }, text: "ALL-IN (30+ Focus): a slow, careful shot at an enemy in range: +25% to hit and x1.5 damage, +1 per 20 Focus spent." },
    ],
  },
  bruiser: {
    id: "bruiser",
    name: "Bruiser",
    group: "frontline",
    icon: "✊",
    manaPool: 50,
    resource: "rage",
    description: "Tough and hard-hitting - fights in the thick of it.",
    passive: { id: "adrenaline", name: "Adrenaline", text: "+1 damage for every quarter of its HP that is missing." },
    skills: [
      { id: "heavy-swing", name: "Whirlwind", icon: "⟳", cost: 2, cooldown: 2, mana: 30, target: "enemy", range: 1, spend: "all", allIn: { per: 15, dmg: 1 }, text: "ALL-IN (30+ Rage): spin and hit EVERY adjacent enemy for full damage, +1 per 15 Rage spent." },
      { id: "shoulder-check", name: "Shoulder Check", icon: "⇥", cost: 1, cooldown: 2, mana: 0, target: "enemy", range: 1, gen: 10, text: "Hit an adjacent enemy for half damage, knock it back 1 tile (out of its cover) and step into its place. Free - builds 10 Rage." },
    ],
  },
  striker: {
    id: "striker",
    name: "Striker",
    group: "damage",
    icon: "⚔",
    manaPool: 50,
    resource: "combo",
    description: "Reliable, steady damage.",
    passive: { id: "battle-rhythm", name: "Battle Rhythm", text: "Every hit it lands this turn makes its next hit this turn deal +1." },
    skills: [
      { id: "double-strike", name: "Double Strike", icon: "⚔", cost: 2, cooldown: 2, mana: 0, target: "enemy", range: "reach", mult: 0.6, text: "Two quick hits at 60% damage each - each hit builds Combo. Free." },
      { id: "exploit-opening", name: "Exploit Opening", icon: "✧", cost: 1, cooldown: 2, mana: 2, target: "enemy", range: "reach", bonus: 3, text: "Hit an enemy; +3 damage if it carries any status (poison, burn, chill, root, slow, weak, marked...)." },
      { id: "finishing-blow", name: "Finishing Blow", icon: "✠", cost: 1, cooldown: 1, mana: 3, spend: "all", allIn: { per: 1, dmg: 1 }, target: "enemy", range: "reach", text: "FINISHER (3+ Combo, spends all): hit an enemy for +1 damage per Combo spent. A kill refunds 1 AP." },
    ],
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    group: "damage",
    icon: "☾",
    manaPool: 50,
    resource: "shadow",
    description: "Slips behind the lines and kills a key target.",
    passive: { id: "backstab", name: "Backstab", text: "+3 damage when it hits from the side or from behind." },
    skills: [
      { id: "shadow-step", name: "Shadow Step", icon: "☽", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 4, text: "Gap closer: vanish and reappear right behind an enemy within 4 tiles, facing its back." },
      { id: "execution", name: "Execution", icon: "✝", cost: 2, cooldown: 3, mana: 30, target: "enemy", range: "reach", below: 0.4, mult: 2.5, spend: "all", allIn: { per: 10, dmg: 1 }, text: "ALL-IN (30+ Shadow): hit an enemy for +1 per 10 Shadow spent; if it's below 40% HP the hit deals x2.5 damage." },
      { id: "vanish", name: "Vanish", icon: "◐", cost: 1, cooldown: 3, mana: 40, target: "self", bonus: 2, text: "Vanish into the shadows until your next turn: ranged enemies more than 2 tiles away can't target it, and its next hit deals +2." },
    ],
  },
  duelist: {
    id: "duelist",
    name: "Duelist",
    group: "damage",
    icon: "⚜",
    manaPool: 50,
    resource: "combo",
    description: "Locks down and beats one important enemy.",
    passive: { id: "riposte", name: "Riposte", text: "Once per enemy turn, when hit in melee it strikes back for half damage (+1 Combo)." },
    skills: [
      { id: "challenge", name: "Challenge", icon: "⚑", cost: 1, cooldown: 3, mana: 0, target: "enemy", range: 3, bonus: 2, gen: 1, text: "Challenge an enemy within 3 tiles for 2 turns: it must attack the Duelist when it can, and the Duelist deals +2 to it. Builds 1 Combo." },
      { id: "disarm", name: "Disarm", icon: "⚯", cost: 1, cooldown: 3, mana: 2, target: "enemy", range: "reach", spend: "all", allIn: { per: 1, dmg: 1 }, text: "FINISHER (2+ Combo, spends all): hit an enemy for half damage +1 per Combo spent - its attacks deal half damage until your next turn (2 turns if 6+ Combo were spent)." },
      { id: "lunge", name: "Lunge", icon: "➹", cost: 1, cooldown: 2, mana: 0, target: "enemy", range: 3, text: "Gap closer: leap up to 3 tiles to the free tile at an enemy's SIDE or BACK (the best flank) and hit it. Free - builds Combo." },
    ],
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    group: "damage",
    icon: "➶",
    manaPool: 55,
    resource: "focus",
    archetype: "hunter",
    description: "Hunter - marks prey, keeps moving and bounces shots between targets.",
    passive: { id: "steady-aim", name: "Hunter's Stride", text: "+1 damage to targets 3 or more tiles away, and +10% to hit with shots after it has moved this turn." },
    skills: [
      { id: "hunters-mark", name: "Hunter's Mark", icon: "⌖", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: 6, bonus: 2, text: "Mark an enemy within 6 tiles for 2 turns - it counts as having NO cover, and every ally's hits on it deal +2." },
      { id: "retreat-shot", name: "Retreat Shot", icon: "↶", cost: 2, cooldown: 2, mana: 20, target: "enemy", range: "reach", steps: 2, text: "Hit an enemy, then jump up to 2 tiles straight away from it." },
      { id: "ricochet-shot", name: "Ricochet", icon: "⤨", cost: 2, cooldown: 2, mana: 30, target: "enemy", range: "reach", bounce: 3, bounces: 1, markBounce: 0, spend: "pct", pct: 30, text: "Hit an enemy, then the shot bounces to the nearest other enemy within 3 tiles of it for half damage - from that new angle its cover doesn't count." },
    ],
  },
  artillery: {
    id: "artillery",
    name: "Artillery",
    group: "damage",
    icon: "✹",
    manaPool: 50,
    resource: "focus",
    archetype: "grenadier",
    description: "Grenadier - lobs explosives over cover and blows cover apart.",
    passive: { id: "siege", name: "Siege Weapon", text: "Deals double damage to barricades and cover objects, and +2 to targets with Block or Ward." },
    skills: [
      { id: "piercing-beam", name: "Frag Grenade", icon: "✹", cost: 2, cooldown: 3, mana: 25, target: "tile", tile: "any", range: 4, indirect: true, text: "Lob a grenade at a tile within 4 - it arcs over cover. Every enemy on it and next to it is hit (cover doesn't help them), and the cover in the blast is torn apart." },
      { id: "suppression-fire", name: "Shred Round", icon: "⁂", cost: 1, cooldown: 2, mana: 15, target: "enemy", range: "reach", shred: 1, text: "Blast away the cover between you and an enemy (full cover becomes half, half becomes none), then hit it." },
    ],
  },
  executioner: {
    id: "executioner",
    name: "Executioner",
    group: "damage",
    icon: "⚰",
    manaPool: 50,
    resource: "fury",
    description: "Finishes off wounded enemies.",
    passive: { id: "finishers-momentum", name: "Finisher's Momentum", text: "Its first kill each turn refunds 1 AP." },
    skills: [
      { id: "execute", name: "Execute", icon: "⚰", cost: 2, cooldown: 2, mana: 20, target: "enemy", range: "reach", below: 0.5, mult: 2, spend: "all", allIn: { per: 20, dmg: 1 }, text: "ALL-IN (20+ Fury): hit an enemy for +1 per 20 Fury spent; if it's below half HP the hit deals double damage." },
      { id: "sever", name: "Sever", icon: "✂", cost: 1, cooldown: 3, mana: 0, target: "enemy", range: "reach", text: "Hit an enemy and cut away its Ward, Revive and Regen - no second chances. Free - the hit builds Fury." },
      { id: "leap", name: "Leap", icon: "⤴", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: 3, text: "Gap closer: leap up to 3 tiles next to an enemy and hit it. A kill grants a free move." },
    ],
  },
  spellblade: {
    id: "spellblade",
    name: "Spellblade",
    group: "damage",
    icon: "✦",
    manaPool: 50,
    resource: "arcane",
    archetype: "mage",
    description: "Mage (battlemage) - blade and spell, loves element combos.",
    passive: { id: "arcane-edge", name: "Arcane Edge", text: "After it uses a skill, its next hit this turn deals +2 and adds 1 Burn." },
    skills: [
      { id: "elemental-strike", name: "Elemental Strike", icon: "✦", cost: 1, cooldown: 2, mana: 15, target: "enemy", range: "reach", text: "Hit an enemy with the element of the turn - Fire (2 Burn), Frost (1 Chill), Nature (Entangle) - it cycles every turn." },
      { id: "arcane-dash", name: "Arcane Dash", icon: "↯", cost: 2, cooldown: 3, mana: 25, target: "enemy", range: 3, bonus: 1, text: "Blink up to 3 tiles next to an enemy and hit it for +1, adding 1 Chill." },
      { id: "arcane-lance", name: "Arcane Lance", icon: "⟿", cost: 2, cooldown: 3, mana: 25, target: "enemy", range: 5, beam: true, elemental: false, spend: "pct", pct: 40, text: "A lance of force down a straight line (row, column or diagonal) up to 5 tiles: every enemy on the line is hit, and cover doesn't protect them. Walls stop it." },
    ],
  },
  healer: {
    id: "healer",
    name: "Healer",
    group: "support",
    icon: "✚",
    manaPool: 75,
    resource: "nature",
    description: "Keeps the team on its feet.",
    passive: { id: "gentle-hands", name: "Gentle Hands", text: "Every heal it casts also gives the target +1 Block." },
    skills: [
      { id: "group-renewal", name: "Group Renewal", icon: "❋", cost: 1, cooldown: 3, mana: 25, target: "self", amount: 3, spend: "all", allIn: { per: 25, heal: 1 }, text: "ALL-IN (25+ Nature): heal itself and every adjacent ally for 3, +1 per 25 Nature spent. Switches to Bloom." },
      { id: "lingering-bloom", name: "Lingering Bloom", icon: "❀", cost: 1, cooldown: 2, mana: 15, target: "ally", range: 2, amount: 2, turns: 2, text: "Heal an ally within 2 tiles for 2 now and 2 more at the start of each of your next 2 turns. Switches to Bloom." },
    ],
  },
  medic: {
    id: "medic",
    name: "Medic",
    group: "support",
    icon: "✙",
    manaPool: 75,
    resource: "blood",
    description: "Emergency care: saves allies at the critical moment.",
    passive: { id: "triage", name: "Triage", text: "Its heals are 50% stronger on allies below half HP." },
    skills: [
      { id: "stabilize", name: "Stabilize", icon: "♥", cost: 1, cooldown: 4, mana: 30, target: "ally", range: 2, spend: "all", allIn: { per: 15, heal: 1 }, text: "ALL-IN (30+ Blood): an ally within 2 tiles can't fall until your next turn - a killing blow leaves it at 1 HP - and heals 1 per 15 Blood spent." },
      { id: "cleanse", name: "Cleanse", icon: "✧", cost: 1, cooldown: 2, mana: 15, target: "ally", range: 2, amount: 2, text: "Remove poison, burn, chill, root, slow, weak and similar effects from an ally within 2 tiles and heal it for 2." },
      { id: "emergency-stim", name: "Emergency Stim", icon: "⚡", cost: 1, cooldown: 3, mana: 20, target: "ally", range: 1, noSelf: true, text: "An adjacent ally gets +1 AP right now, but starts your next turn with 1 AP less." },
    ],
  },
  buffer: {
    id: "buffer",
    name: "Buffer",
    group: "support",
    icon: "♫",
    manaPool: 70,
    resource: "inspiration",
    description: "Makes the right ally much stronger.",
    passive: { id: "uplift", name: "Uplift", text: "Allies it targets with a skill also gain +1 Block." },
    skills: [
      { id: "empower", name: "Empower", icon: "▲", cost: 1, cooldown: 2, mana: 15, target: "ally", range: 2, noSelf: true, bonus: 3, text: "An ally within 2 tiles deals +3 damage with every hit until your next turn." },
      { id: "coordinated-strike", name: "Coordinated Strike", icon: "⚔", cost: 2, cooldown: 3, mana: 25, target: "enemy", range: 5, spend: "all", allIn: { per: 25, dmg: 1 }, text: "ALL-IN (25+ Inspiration): every ally next to the chosen enemy hits it at once for half damage, +1 each per 25 Inspiration spent." },
    ],
  },
  commander: {
    id: "commander",
    name: "Commander",
    group: "support",
    icon: "♛",
    manaPool: 70,
    resource: "inspiration",
    description: "Gives the team extra actions and a shared plan.",
    passive: { id: "chain-of-command", name: "Chain of Command", text: "Whenever an ally lands a kill, the Commander's skill cooldowns drop by 1." },
    skills: [
      { id: "tactical-order", name: "Tactical Order", icon: "➹", cost: 1, cooldown: 3, mana: 20, target: "ally", range: 3, noSelf: true, text: "An ally within 3 tiles gains +1 AP right now." },
      { id: "focus-target", name: "Focus Target", icon: "⌖", cost: 1, cooldown: 2, mana: 10, target: "enemy", range: 6, bonus: 2, text: "Name a target within 6 tiles: until your next turn it counts as having NO cover, and every ally's hits on it deal +2." },
      { id: "hold-formation", name: "Hold Formation", icon: "▤", cost: 1, cooldown: 3, mana: 30, target: "self", block: 2, spend: "pct", pct: 30, text: "Every ally on the field gains +2 Block." },
    ],
  },
  tactician: {
    id: "tactician",
    name: "Tactician",
    group: "support",
    icon: "♞",
    manaPool: 70,
    resource: "inspiration",
    description: "Reads the battlefield and reshapes it.",
    passive: { id: "foresight", name: "Foresight", text: "It sees every blow coming - it can never be flanked or hit from behind." },
    skills: [
      { id: "reveal-weakness", name: "Reveal Weakness", icon: "◈", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 5, spend: "pct", pct: 20, text: "An enemy within 5 tiles is Exposed for 2 turns - it takes 25% more damage from everything." },
      { id: "formation-shift", name: "Formation Shift", icon: "⇄", cost: 1, cooldown: 3, mana: 15, target: "ally", range: 3, noSelf: true, text: "Swap places with an ally within 3 tiles." },
    ],
  },
  controller: {
    id: "controller",
    name: "Controller",
    group: "control",
    icon: "⌬",
    manaPool: 65,
    resource: "arcane",
    description: "Takes options away from the enemy.",
    passive: { id: "lockdown", name: "Lockdown", text: "+2 damage to enemies that are Rooted, Slowed, Silenced or Entangled." },
    skills: [
      { id: "silence", name: "Silence", icon: "⊘", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: "reach", spend: "pct", pct: 25, text: "Hit an enemy for half damage - it can't use its special skills for its next 2 turns." },
      { id: "pull", name: "Pull", icon: "⇤", cost: 1, cooldown: 2, mana: 10, target: "enemy", range: 3, steps: 2, text: "Drag an enemy within 3 tiles up to 2 tiles toward the Controller and Slow it." },
    ],
  },
  frostbinder: {
    id: "frostbinder",
    name: "Frostbinder",
    group: "control",
    icon: "❄",
    manaPool: 65,
    resource: "frost",
    archetype: "mage",
    description: "Mage (frost) - slows the fight down and turns ground to ice.",
    passive: { id: "cold-snap", name: "Cold Snap", text: "+2 damage to Chilled or Frozen enemies." },
    skills: [
      { id: "frost-bolt", name: "Frost Bolt", icon: "❄", cost: 1, cooldown: 2, mana: 15, target: "enemy", range: 4, text: "Hit an enemy up to 4 tiles away, add 1 Chill and Slow it." },
      { id: "shatter", name: "Shatter", icon: "✷", cost: 2, cooldown: 3, mana: 25, target: "enemy", range: "reach", spend: "all", allIn: { per: 10, dmg: 1 }, text: "ALL-IN (25+ frost): hit an enemy for +1 per 10 spent: double damage if it's Frozen (on top of the usual +50% Shatter), x1.5 if it's Chilled." },
      { id: "frozen-ground", name: "Frozen Ground", icon: "⧆", cost: 1, cooldown: 4, mana: 25, target: "enemy", range: 4, damage: 2, area: true, text: "Freeze the ground under and around an enemy within 4 tiles into slippery Ice - every enemy there takes 2 damage (cover doesn't help) and gets 1 Chill." },
    ],
  },

  // ---- Part B (PRD §24-40 + Cleanser & Gatherer from §3) -----------------
  // target "tile": the player clicks a board tile; `tile` names the rule
  // ("empty" free walkable tile, "crossing" water/lava/rock, "any").
  rootweaver: {
    id: "rootweaver",
    name: "Rootweaver",
    group: "control",
    icon: "❧",
    manaPool: 65,
    resource: "nature",
    description: "Controls the battlefield with roots, vines and living walls.",
    passive: { id: "grasping-roots", name: "Grasping Roots", text: "Once per enemy turn, the first enemy that ends a move next to it is Rooted." },
    skills: [
      { id: "root-snare", name: "Root Snare", icon: "➰", cost: 1, cooldown: 2, mana: 15, target: "enemy", range: 3, damage: 1, text: "Roots an enemy within 3 tiles (it can't move on its next turn) and deals 1 damage. Switches to Root." },
      { id: "growing-wall", name: "Growing Wall", icon: "▥", cost: 1, cooldown: 3, mana: 20, target: "tile", tile: "empty", range: 3, hp: 5, text: "Grow a thorny barricade (5 HP) on an empty tile within 3; enemies next to it are Rooted. Switches to Root." },
      { id: "vine-bridge", name: "Vine Bridge", icon: "⌇", cost: 1, cooldown: 4, mana: 20, target: "tile", tile: "crossing", range: 3, spend: "pct", pct: 20, text: "Weave a walkable vine bridge over water, lava or rocks within 3 tiles. Switches to Bloom." },
    ],
  },
  disruptor: {
    id: "disruptor",
    name: "Disruptor",
    group: "control",
    icon: "↯",
    manaPool: 65,
    resource: "arcane",
    description: "Breaks the enemy's plan before it happens.",
    passive: { id: "interrupt", name: "Interrupt", text: "Its hits cancel an enemy's wind-up (Slam, Charge) and push its special skills 1 turn further on cooldown." },
    skills: [
      { id: "dispel", name: "Dispel", icon: "⊗", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: 3, damage: 1, text: "Strip an enemy within 3 of Block, Ward, Regen, Taunt, Bulwark and earned Strength, then deal 1 damage." },
      { id: "displace", name: "Displace", icon: "⇲", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: 3, steps: 2, bonus: 2, text: "Shove an enemy within 3 up to 2 tiles straight away; if something blocks it, it takes 2 damage." },
      { id: "static-disruption", name: "Static Disruption", icon: "ϟ", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: "reach", text: "Hit an enemy for half damage - it has 1 AP less on its next turn (it can move OR attack, not both)." },
    ],
  },
  trapper: {
    id: "trapper",
    name: "Trapper",
    group: "control",
    icon: "⊼",
    manaPool: 65,
    resource: "focus",
    archetype: "suppressor",
    description: "Suppressor - pins enemies down, lays smoke and sets traps.",
    passive: { id: "ambush-network", name: "Ambush Network", text: "When one of its traps springs, every other enemy next to the trap takes 2 damage too." },
    skills: [
      { id: "pinning-shot", name: "Pinning Shot", icon: "➶", cost: 1, cooldown: 2, mana: 10, target: "enemy", range: "reach", full: false, wide: false, text: "Hit an enemy for half damage and pin it down: it is Rooted (can't move on its next turn) and Suppressed until your next turn." },
      { id: "smoke-screen", name: "Smoke Screen", icon: "☁", cost: 1, cooldown: 3, mana: 25, target: "tile", tile: "any", range: 4, turns: 2, spend: "pct", pct: 25, text: "Throw smoke at a tile within 4: it and the 8 tiles around it fill with smoke for 2 turns. Anyone standing in smoke counts as in half cover from every side against ranged attacks." },
      { id: "thorn-trap", name: "Thorn Trap", icon: "✳", cost: 1, cooldown: 2, mana: 10, target: "tile", tile: "empty", range: 3, damage: 3, text: "Hide a trap on an empty tile within 3: the first enemy to stop on it takes 3 damage and is Rooted." },
    ],
  },
  hexer: {
    id: "hexer",
    name: "Hexer",
    group: "control",
    icon: "⛧",
    manaPool: 65,
    resource: "hex",
    archetype: "mage",
    description: "Mage (curses) - weakens enemies with hexes.",
    passive: { id: "malediction", name: "Malediction", text: "Every hit it lands Curses the target until your next turn: a Cursed enemy deals 1 less and takes 1 more damage per hit." },
    skills: [
      { id: "vulnerability", name: "Vulnerability", icon: "◬", cost: 1, cooldown: 3, mana: 0, target: "enemy", range: 4, text: "An enemy within 4 is Exposed for 2 turns - it takes 25% more damage from everything. Free - builds Hex Power." },
      { id: "hex-chain", name: "Hex Chain", icon: "⛓", cost: 2, cooldown: 3, mana: 0, target: "enemy", range: 4, damage: 1, area: true, text: "Curse an enemy within 4 and every enemy next to it for 2 turns, dealing 1 damage to each (cover doesn't help). Free - each curse builds Hex Power." },
      { id: "soul-debt", name: "Soul Debt", icon: "⚖", cost: 1, cooldown: 3, mana: 30, target: "enemy", range: 4, damage: 3, spend: "all", allIn: { per: 15, debt: 1 }, text: "ALL-IN (30+ Hex): for 2 turns, every time the enemy attacks, it takes 3 damage, +1 per 15 Hex spent." },
    ],
  },
  summoner: {
    id: "summoner",
    name: "Summoner",
    group: "summoning",
    icon: "⚝",
    manaPool: 70,
    resource: "spirit",
    description: "Calls spirits to fight and fill the board.",
    passive: { id: "spirit-bond", name: "Spirit Bond", text: "Spirits it summons deal +1 damage with every hit." },
    skills: [
      { id: "summon-spirit", name: "Summon Spirit", icon: "✺", cost: 2, cooldown: 3, mana: 10, target: "self", reserve: 35, text: "Summon a Spirit Wolf next to it (one at a time). It can act from your next turn. The wolf RESERVES 35 Spirit while it lives." },
      { id: "sacrificial-summon", name: "Sacrificial Summon", icon: "✹", cost: 1, cooldown: 3, mana: 15, target: "self", damage: 4, text: "Its Spirit bursts: every enemy next to the Spirit takes 4 damage, and the Summoner heals for the Spirit's remaining HP (max 5)." },
      { id: "swarm-command", name: "Swarm Command", icon: "⚑", cost: 1, cooldown: 3, mana: 25, target: "enemy", range: 6, spend: "pct", pct: 25, text: "Every spirit and summon on your side that can reach the enemy hits it at once." },
    ],
  },
  beastmaster: {
    id: "beastmaster",
    name: "Beastmaster",
    group: "summoning",
    icon: "🐾",
    manaPool: 70,
    resource: "spirit",
    description: "Fights side by side with an animal companion.",
    passive: { id: "pack-bond", name: "Pack Bond", text: "If its companion falls, it gains +2 attack for the fight and Call Companion is ready again at once." },
    skills: [
      { id: "call-companion", name: "Call Companion", icon: "🐺", cost: 2, cooldown: 4, mana: 10, target: "self", reserve: 35, text: "Call a Spirit Wolf companion next to it (if it has none). It can act from your next turn. The wolf RESERVES 35 Spirit while it lives." },
      { id: "hunt", name: "Hunt", icon: "➹", cost: 1, cooldown: 2, mana: 15, target: "enemy", range: 6, bonus: 2, reach: 4, text: "Its companion leaps up to 4 tiles next to an enemy and bites it for +2." },
      { id: "frenzy", name: "Frenzy", icon: "✶", cost: 1, cooldown: 3, mana: 20, target: "self", bonus: 3, spend: "all", allIn: { per: 20, dmg: 1 }, text: "ALL-IN (20+ Spirit): its companion gets +1 AP and +3 damage with every hit this turn, +1 more per 20 Spirit spent." },
    ],
  },
  alchemist: {
    id: "alchemist",
    name: "Alchemist",
    group: "summoning",
    icon: "⚗",
    manaPool: 55,
    resource: "reagents",
    archetype: "mage",
    description: "Mage (alchemy) - lobs poisons and fire into explosive reactions.",
    passive: { id: "catalyst", name: "Catalyst", text: "Every hit it lands adds 1 Poison (Poison + Fire = Toxic Blaze)." },
    skills: [
      { id: "poison-flask", name: "Poison Flask", icon: "⚱", cost: 1, cooldown: 2, mana: 0, target: "enemy", range: 4, amount: 2, area: true, brew: { poison: 1 }, text: "Lob a flask over cover at an enemy within 4: it and every enemy next to it get 2 Poison. Gathers 1 Poison reagent (+1 Fire if the target burns)." },
      { id: "volatile-mixture", name: "Volatile Mixture", icon: "✺", cost: 2, cooldown: 3, mana: 0, target: "enemy", range: 4, amount: 2, area: true, spend: "all", text: "Throw EVERY reagent at once at an enemy within 4 (it arcs over cover): a hit with 2 Burn, +1 damage per reagent. Fire+Poison = Explosive Venom (3 to it and every enemy next to it), Frost+Poison = Freezing Venom (Chill + Root), Fire+Frost = Steam Burst (Exposed), Arcane = +50% damage." },
      { id: "transmute", name: "Transmute", icon: "⟲", cost: 1, cooldown: 3, mana: 0, target: "enemy", range: 3, brew: { arcane: 1, frost: 1 }, text: "Turn an enemy's Block and Regen into Poison of the same amount. Gathers 1 Arcane and 1 Frost reagent." },
    ],
  },
  scout: {
    id: "scout",
    name: "Scout",
    group: "specialist",
    icon: "⌕",
    manaPool: 55,
    resource: "focus",
    archetype: "hunter",
    description: "Hunter (spotter) - fast, spots prey for the whole squad.",
    passive: { id: "pathfinder", name: "Pathfinder", text: "Its first move each turn costs no AP." },
    skills: [
      { id: "mark-threat", name: "Mark Threat", icon: "⚐", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: 6, bonus: 2, text: "Mark an enemy within 6 for 2 turns - it counts as having NO cover, and every ally's hits on it deal +2." },
      { id: "trailblazer", name: "Trailblazer", icon: "⇶", cost: 1, cooldown: 3, mana: 20, target: "self", radius: 2, spend: "pct", pct: 20, text: "Allies within 2 tiles shake off Root and Slow, and their next move this turn costs no AP." },
    ],
  },
  saboteur: {
    id: "saboteur",
    name: "Saboteur",
    group: "specialist",
    icon: "✇",
    manaPool: 50,
    resource: "arcane",
    description: "Wrecks barricades, totems and defenses.",
    passive: { id: "demolitions", name: "Demolitions", text: "Deals triple damage to barricades and +3 to Totems and other structures." },
    skills: [
      { id: "sabotage", name: "Sabotage", icon: "⚒", cost: 1, cooldown: 2, mana: 10, target: "enemy", range: "reach", text: "Strip an enemy's Block, Ward and Bulwark, then hit it." },
      { id: "explosive-charge", name: "Explosive Charge", icon: "✹", cost: 1, cooldown: 3, mana: 15, target: "tile", tile: "any", range: 2, damage: 4, spend: "all", allIn: { per: 10, dmg: 1 }, text: "ALL-IN (15+ mana): plant a charge on a tile within 2 - when you end the turn it blows: 4 damage (+1 per 10 mana spent) to enemies on and next to it, and barricades there crumble." },
      { id: "smoke-bomb", name: "Smoke Bomb", icon: "☁", cost: 1, cooldown: 4, mana: 20, target: "tile", tile: "any", range: 3, text: "Smoke fills a 3x3 area within 3 tiles: its open ground turns into Tall grass (cover from ranged attacks)." },
    ],
  },
  engineer: {
    id: "engineer",
    name: "Engineer",
    group: "specialist",
    icon: "⚙",
    manaPool: 70,
    resource: "arcane",
    description: "Builds turrets and barricades.",
    passive: { id: "field-repairs", name: "Field Repairs", text: "When you end the turn, it repairs 2 HP on its turret and on every barricade next to it." },
    skills: [
      { id: "deploy-turret", name: "Deploy Turret", icon: "⌖", cost: 2, cooldown: 4, mana: 30, target: "tile", tile: "empty", range: 2, hp: 8, attack: 3, reach: 3, text: "Build a Turret (8 HP, one at a time) on an empty tile within 2 - when you end the turn it shoots the nearest enemy within 3 for 3." },
      { id: "build-barricade", name: "Build Barricade", icon: "▦", cost: 1, cooldown: 3, mana: 15, target: "tile", tile: "empty", range: 2, text: "Build a full barricade on an empty tile within 2." },
    ],
  },
  spiritwalker: {
    id: "spiritwalker",
    name: "Spiritwalker",
    group: "specialist",
    icon: "☁",
    manaPool: 70,
    resource: "spirit",
    description: "Walks between worlds - slips past walls and saves allies.",
    passive: { id: "veil", name: "Veil", text: "When you end the turn with no enemy within 2 tiles of it, it gains +2 Block." },
    skills: [
      { id: "spirit-step", name: "Spirit Step", icon: "⤳", cost: 1, cooldown: 2, mana: 15, target: "tile", tile: "empty", range: 3, text: "Step through the spirit world to an empty tile within 3 - walls, water and heroes don't block it." },
      { id: "phase-shift", name: "Phase Shift", icon: "◌", cost: 1, cooldown: 4, mana: 15, target: "ally", range: 3, reserve: 25, text: "An ally within 3 (or itself) takes no damage from hits until your next turn, but its own hits deal half. Holds 25 Spirit in reserve while it lasts." },
      { id: "return-to-hearth", name: "Return to Hearth", icon: "⌂", cost: 2, cooldown: 5, mana: 40, target: "self", amount: 4, spend: "pct", pct: 40, text: "Return to the back line (your starting edge) and heal 4." },
    ],
  },
  ritualist: {
    id: "ritualist",
    name: "Ritualist",
    group: "specialist",
    icon: "⍟",
    manaPool: 70,
    resource: "souls",
    archetype: "mage",
    description: "Mage (rituals) - builds a great spell over several turns.",
    passive: { id: "interrupted-ritual", name: "Interrupted Ritual", text: "If it's hit while channeling, the ritual goes off early at half power." },
    skills: [
      { id: "begin-ritual", name: "Begin Ritual", icon: "◍", cost: 1, cooldown: 1, mana: 0, target: "self", max: 3, gen: 2, text: "Add 1 Ritual stack (max 3) and gather 2 Souls. Free." },
      { id: "complete-ritual", name: "Complete Ritual", icon: "✺", cost: 2, cooldown: 3, mana: 6, target: "self", radius: 3, damage: 3, heal: 2, spend: "all", allIn: { per: 3, dmg: 1 }, text: "ALL-IN (6+ Souls): spend every Ritual stack: each enemy within 3 takes 3 per stack (cover doesn't help), each ally within 3 heals 2 per stack. +1 damage each per 3 Souls spent." },
      { id: "spirit-offering", name: "Spirit Offering", icon: "♦", cost: 1, cooldown: 3, mana: 6, target: "ally", range: 3, noSelf: true, hpCost: 3, text: "Pay 3 HP: an ally within 3 gains +1 AP right now." },
    ],
  },
  chronomancer: {
    id: "chronomancer",
    name: "Chronomancer",
    group: "specialist",
    icon: "⌛",
    manaPool: 65,
    resource: "arcane",
    archetype: "mage",
    description: "Mage (time) - bends the rhythm of turns and cooldowns.",
    passive: { id: "temporal-flow", name: "Temporal Flow", text: "Its own skill cooldowns tick down twice as fast." },
    skills: [
      { id: "haste-time", name: "Haste Time", icon: "⏩", cost: 1, cooldown: 3, mana: 20, target: "ally", range: 3, noSelf: true, text: "An ally within 3 starts your next turn with +1 AP." },
      { id: "slow-time", name: "Slow Time", icon: "⏪", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 4, text: "An enemy within 4 is Slowed and its special skills go 2 turns further on cooldown." },
      { id: "rewind", name: "Rewind", icon: "↺", cost: 1, cooldown: 4, mana: 25, target: "ally", range: 3, spend: "pct", pct: 40, text: "Turn back time on an ally within 3 (or itself): it regains all HP lost since you last ended your turn." },
    ],
  },
  shapeshifter: {
    id: "shapeshifter",
    name: "Shapeshifter",
    group: "specialist",
    icon: "⟁",
    manaPool: 50,
    resource: "nature",
    description: "Changes form to fit the fight.",
    passive: { id: "form-mastery", name: "Form Mastery", text: "Changing form gives +2 Block." },
    skills: [
      { id: "beast-form", name: "Beast Form", icon: "🐾", cost: 1, cooldown: 1, mana: 10, target: "self", text: "Beast Form: +2 damage with every hit." },
      { id: "root-form", name: "Root Form", icon: "🌳", cost: 1, cooldown: 1, mana: 10, target: "self", block: 3, text: "Root Form: +3 Block now, takes 1 less damage from every hit and can't be pushed." },
      { id: "predator-form", name: "Predator Form", icon: "☾", cost: 1, cooldown: 1, mana: 10, target: "self", spend: "pct", pct: 10, text: "Predator Form: +3 damage to enemies below half HP." },
    ],
  },
  corruptor: {
    id: "corruptor",
    name: "Corruptor",
    group: "specialist",
    icon: "☠",
    manaPool: 65,
    resource: "corruption",
    archetype: "mage",
    description: "Mage (corruption) - feeds on the enemy's weaknesses.",
    passive: { id: "corruption", name: "Corruption", text: "Every hit it lands adds 1 Corruption. At 5+ Corruption (Heart Rot) the enemy takes +2 from all your hits." },
    skills: [
      { id: "consume-curse", name: "Consume Curse", icon: "☄", cost: 1, cooldown: 2, mana: 20, target: "enemy", range: 3, spend: "pct", pct: 20, text: "Consume an enemy's Corruption and ailments: 2 damage per Corruption stack plus 1 per ailment (Poison, Burn, Chill, Root...)." },
      { id: "invert-blessing", name: "Invert Blessing", icon: "⇅", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 3, text: "Every buff on an enemy within 3 (Block, Ward, Regen, Taunt, Bulwark, earned Strength) is removed and turns into 1 Corruption each." },
      { id: "spread-corruption", name: "Spread Corruption", icon: "✥", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 3, text: "Every enemy next to the target gets half its Corruption and a copy of its Poison and Burn." },
    ],
  },
  merchant: {
    id: "merchant",
    name: "Merchant",
    group: "summoning",
    icon: "⚖",
    manaPool: 70,
    resource: "inspiration",
    description: "Turns fights into profit and hands out supplies.",
    passive: { id: "bounty", name: "Bounty", text: "Each enemy it defeats pays +1 Essence after a won fight (max 3 per fight)." },
    skills: [
      { id: "emergency-supply", name: "Emergency Supply", icon: "✚", cost: 1, cooldown: 3, mana: 15, target: "ally", range: 1, amount: 3, block: 2, text: "Hand a potion to itself or an adjacent ally: heal 3 and +2 Block." },
      { id: "appraise", name: "Appraise", icon: "◈", cost: 1, cooldown: 3, mana: 20, target: "enemy", range: 5, spend: "pct", pct: 20, text: "Appraise an enemy within 5 for 2 turns: it takes +1 from every hit, and if it falls while Appraised it pays +1 Essence after the fight." },
    ],
  },
  "relic-keeper": {
    id: "relic-keeper",
    name: "Relic Keeper",
    group: "summoning",
    icon: "⚱",
    manaPool: 70,
    resource: "arcane",
    description: "Wakes old relics and bends the rules of the fight.",
    passive: { id: "resonance", name: "Resonance", text: "When you end the turn, each relic or item effect it carries that fires at turn start or turn end fires once more." },
    skills: [
      { id: "relic-transfer", name: "Relic Transfer", icon: "⇆", cost: 1, cooldown: 4, mana: 20, target: "ally", range: 2, noSelf: true, text: "Copy its relic and item effects onto an ally within 2 for the fight (with none: +2 Block to the ally)." },
      { id: "forbidden-relic", name: "Forbidden Relic", icon: "⛤", cost: 1, cooldown: 4, mana: 20, target: "self", hpCost: 3, bonus: 2, text: "Pay 3 HP for +2 attack for the rest of the fight." },
    ],
  },
  cleanser: {
    id: "cleanser",
    name: "Cleanser",
    group: "support",
    icon: "✧",
    manaPool: 75,
    resource: "inspiration",
    description: "Washes away poisons, curses and ailments.",
    passive: { id: "purity", name: "Purity", text: "When you end the turn, it and every adjacent ally shake off one ailment each." },
    skills: [
      { id: "purge", name: "Purge", icon: "❂", cost: 1, cooldown: 3, mana: 15, target: "ally", range: 3, text: "Remove every ailment from an ally within 3 (or itself); it heals 1 for each ailment removed." },
      { id: "purifying-light", name: "Purifying Light", icon: "☀", cost: 1, cooldown: 3, mana: 20, target: "self", radius: 2, block: 1, damage: 2, spend: "all", allIn: { per: 20, dmg: 1, block: 1 }, text: "ALL-IN (20+ Inspiration): allies within 2 shake off one ailment and gain +1 Block; Cursed or Corrupted enemies within 2 take 2 damage. +1 Block and +1 damage per 20 spent." },
    ],
  },
  gatherer: {
    id: "gatherer",
    name: "Gatherer",
    group: "summoning",
    icon: "✿",
    manaPool: 70,
    resource: "nature",
    description: "Lives off the land - forages, scavenges and grows cover.",
    passive: { id: "forage", name: "Forage", text: "When you end the turn standing on or next to Forest or Tall grass, it heals 2." },
    skills: [
      { id: "scavenge", name: "Scavenge", icon: "⛏", cost: 1, cooldown: 2, mana: 0, target: "enemy", range: "reach", amount: 3, gen: 8, text: "Hit an enemy; if it falls, the Gatherer heals 3 and finds +1 Essence (after a won fight). Free - builds 8 Nature, switches to Beast." },
      { id: "overgrow", name: "Overgrow", icon: "❦", cost: 1, cooldown: 3, mana: 15, target: "tile", tile: "any", range: 2, text: "Plant a patch of Tall grass on a tile within 2 and the open ground around it. Switches to Bloom." },
    ],
  },
}

// Skill tree (level-ups): every class skill has 2 upgrade branches, A or
// B, picked on a level-up (one per skill, permanent). `patch` overrides
// the skill's own numbers; `fx` adds a rider run right after the skill
// resolves (tacticsClasses.applySkillFx):
//   t: on the target - enemy: stun/root/slow/poison/burn/chill/expose/
//      curse/disarm/silence/mark/corrupt/dmg; ally: block/heal/ward/ap/attack
//   self: {block, heal, ward, taunt, resetCd} · splash: foes next to the
//   target · aura: allies near the caster · near: foes near the caster ·
//   pet: its companion · kill: if the target fell · tile: units on/next
//   to the chosen tile.
const U = (name, text, patch, fx) => ({ name, text, ...(patch ? { patch } : {}), ...(fx ? { fx } : {}) })
export const SKILL_UPGRADES = {
  // Guardian
  guard: { A: U("Iron Vow", "The guarded ally also gains +2 Block.", null, { t: { block: 2 } }), B: U("Challenge Guard", "The Guardian also Taunts until your next turn - enemies must attack it.", null, { self: { taunt: true } }) },
  "shield-wall": { A: U("Rampart", "+2 more Block to itself (+5 in total).", { self: 5 }), B: U("Rallying Wall", "Also Taunts - enemies must attack it until your next turn.", null, { self: { taunt: true } }) },
  // Warden
  "warden-zone": { A: U("Deep Roots", "+1 more Block to everyone in the zone.", { block: 2 }), B: U("Hallowed Ground", "Everyone in the zone also heals 2.", null, { aura: { heal: 2, incl: true } }) },
  "thorn-boundary": { A: U("Wide Thicket", "Reaches 3 tiles instead of 2.", { radius: 3 }), B: U("Snaring Thorns", "The thorns also Root every enemy they hit.", null, { near: { radius: 2, root: true } }) },
  // Juggernaut
  charge: { A: U("Stunning Impact", "The target is Stunned - it skips its next turn.", null, { t: { stun: 1 } }), B: U("Long Charge", "Charges up to 6 tiles instead of 4.", { range: 6 }) },
  "ground-breaker": { A: U("Aftershock", "Adjacent enemies are also Rooted.", null, { near: { root: true } }), B: U("Unstoppable", "The Juggernaut also gains +3 Block.", null, { self: { block: 3 } }) },
  // Sentinel
  overwatch: { A: U("Pinning Watch", "The Overwatch shot also Roots its target.", { owRoot: true }), B: U("Braced Watch", "Also gains +2 Block right away.", null, { self: { block: 2 } }) },
  "mark-intruder": { A: U("Kill Shot", "x2 damage instead of x1.5.", { mult: 2 }), B: U("Steady Breath", "+40% to hit instead of +25%.", { aim: 40 }) },
  // Bruiser
  "heavy-swing": { A: U("Brutal Swing", "The main target is also Disarmed (half damage until your next turn).", null, { t: { disarm: 1 } }), B: U("Second Wind", "The Bruiser also heals 3.", null, { self: { heal: 3 } }) },
  // Melee rework: new tank skills
  provoke: { A: U("Iron Taunt", "Provoke reaches 3 tiles instead of 2.", { radius: 3 }), B: U("Holy Challenge", "Provoke also gives +2 more Block.", { block: 4 }) },
  bastion: { A: U("Unbreakable", "Bastion also gives +3 more Block.", { block: 5 }), B: U("Sanctuary", "Adjacent allies also gain +2 Block.", null, { aura: { block: 2 } }) },
  hook: { A: U("Long Chain", "Reaches 4 tiles and drags up to 3.", { range: 4, steps: 3 }), B: U("Barbed Hook", "The hooked enemy is also Slowed.", null, { t: { slow: true } }) },
  "finishing-blow": { A: U("Coup de Grace", "A kill also heals 3.", null, { kill: { heal: 3 } }), B: U("Crippling Finish", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }) },
  lunge: { A: U("Fleche", "Reaches 4 tiles instead of 3.", { range: 4 }), B: U("Feint", "The target is also Disarmed until your next turn.", null, { t: { disarm: 1 } }) },
  vanish: { A: U("Smoke and Mirrors", "Also gains 1 Ward.", null, { self: { ward: 1 } }), B: U("Assassin's Patience", "Its next hit deals +4 instead of +2.", { bonus: 4 }) },
  leap: { A: U("Long Leap", "Leaps up to 4 tiles.", { range: 4 }), B: U("Crushing Landing", "Enemies next to the target take 2 damage.", null, { splash: { dmg: 2 } }) },
  "shoulder-check": { A: U("Rattle", "The target is also Slowed.", null, { t: { slow: true } }), B: U("Momentum", "The Bruiser also gains +2 Block.", null, { self: { block: 2 } }) },
  // Striker
  "double-strike": { A: U("Flurry", "Three quick hits at 45% each instead of two.", { hits: 3, mult: 0.45 }), B: U("Rending Strikes", "The target also gets 2 Poison.", null, { t: { poison: 2 } }) },
  "exploit-opening": { A: U("Opportunist", "A kill with it refunds 1 AP.", null, { kill: { ap: 1 } }), B: U("Open Wound", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }) },
  // Assassin
  "shadow-step": { A: U("Veiled Step", "The Assassin also gains 1 Ward.", null, { self: { ward: 1 } }), B: U("Unnerving", "The target is Cursed until your next turn (deals 1 less, takes 1 more).", null, { t: { curse: 1 } }) },
  execution: { A: U("Swift End", "A kill with it refunds 1 AP.", null, { kill: { ap: 1 } }), B: U("Merciless", "Works below 50% HP instead of 40%.", { below: 0.5 }) },
  // Duelist
  challenge: { A: U("Taunting Blade", "The Duelist also gains +2 Block.", null, { self: { block: 2 } }), B: U("First Blood", "The challenge also deals 2 damage.", null, { t: { dmg: 2 } }) },
  disarm: { A: U("Full Disarm", "The target is also Silenced until your next turn.", null, { t: { silence: 1 } }), B: U("Riposte Stance", "The Duelist also gains +2 Block.", null, { self: { block: 2 } }) },
  // Ranger
  "hunters-mark": { A: U("Crippling Mark", "The marked enemy is also Slowed.", null, { t: { slow: true } }), B: U("Tracking Shot", "The mark also deals 2 damage.", null, { t: { dmg: 2 } }) },
  "ricochet-shot": { A: U("Double Bounce", "Bounces on to a third enemy too.", { bounces: 2 }), B: U("Barbed Bounce", "Every enemy it bounces to is Marked for 2 turns (no cover, +1 damage taken).", { markBounce: 1 }) },
  "retreat-shot": { A: U("Leg Shot", "The target is also Slowed.", null, { t: { slow: true } }), B: U("Long Retreat", "Jumps up to 3 tiles away and gains +1 Block.", { steps: 3 }, { self: { block: 1 } }) },
  // Artillery
  "piercing-beam": { A: U("Long Toss", "Throws up to 6 tiles.", { range: 6 }), B: U("Incendiary", "Enemies in the blast also get 2 Burn.", null, { tile: { burn: 2 } }) },
  "suppression-fire": { A: U("Pinning Round", "The target is also Rooted.", null, { t: { root: true } }), B: U("Demolition Round", "Tears the cover away completely (two steps).", { shred: 2 }) },
  // Executioner
  execute: { A: U("Headsman", "Works below 60% HP instead of half.", { below: 0.6 }), B: U("Reaper's Toll", "A kill with it heals the Executioner 3.", null, { kill: { heal: 3 } }) },
  sever: { A: U("Deep Cut", "The target also gets 2 Poison.", null, { t: { poison: 2 } }), B: U("Open Vein", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }) },
  // Spellblade
  "elemental-strike": { A: U("Flare", "Always adds 1 extra Burn.", null, { t: { burn: 1 } }), B: U("Storm Edge", "Enemies next to the target take 1 damage.", null, { splash: { dmg: 1 } }) },
  "arcane-dash": { A: U("Blink Guard", "The Spellblade also gains +2 Block.", null, { self: { block: 2 } }), B: U("Long Blink", "Blinks up to 5 tiles.", { range: 5 }) },
  "arcane-lance": { A: U("Long Lance", "Reaches 7 tiles instead of 5.", { range: 7 }), B: U("Element Lance", "Every enemy it hits also gets the element of the turn.", { elemental: true }) },
  // Healer
  "group-renewal": { A: U("Deep Renewal", "Heals 4 instead of 3.", { amount: 4 }), B: U("Blessed Circle", "Everyone it heals also gains +1 Block.", null, { aura: { block: 1, incl: true } }) },
  "lingering-bloom": { A: U("Evergreen", "Keeps blooming for 3 turns instead of 2.", { turns: 3 }), B: U("Thorned Bloom", "The ally also gains +2 Block.", null, { t: { block: 2 } }) },
  // Medic
  stabilize: { A: U("Steady Hands", "The ally also heals 3.", null, { t: { heal: 3 } }), B: U("Field Triage", "Reaches 3 tiles instead of 2.", { range: 3 }) },
  cleanse: { A: U("Purifying Salve", "Heals 4 instead of 2.", { amount: 4 }), B: U("Protective Film", "The ally also gains 1 Ward.", null, { t: { ward: 1 } }) },
  "emergency-stim": { A: U("Clean Stim", "The ally also heals 2.", null, { t: { heal: 2 } }), B: U("Rage Stim", "The ally also gets +1 attack for the rest of the fight.", null, { t: { attack: 1 } }) },
  // Buffer
  empower: { A: U("Overcharge", "+4 damage instead of +3.", { bonus: 4 }), B: U("Fortify", "The ally also gains +2 Block.", null, { t: { block: 2 } }) },
  "coordinated-strike": { A: U("Pincer", "The target is also Slowed.", null, { t: { slow: true } }), B: U("Rallying Strike", "Allies next to the Buffer gain +1 Block.", null, { aura: { block: 1 } }) },
  // Commander
  "tactical-order": { A: U("Inspire", "The ally also gains +2 Block.", null, { t: { block: 2 } }), B: U("Long Command", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  "focus-target": { A: U("Expose Weakness", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }), B: U("Hunt Order", "The target is also Slowed.", null, { t: { slow: true } }) },
  "hold-formation": { A: U("Iron Line", "+3 Block instead of +2.", { block: 3 }), B: U("Steady Nerves", "The Commander also heals 3.", null, { self: { heal: 3 } }) },
  // Tactician
  "reveal-weakness": { A: U("Crippling Insight", "The enemy is also Slowed.", null, { t: { slow: true } }), B: U("Quick Read", "Recharges in 2 turns instead of 3.", { cooldown: 2 }) },
  "formation-shift": { A: U("Covering Swap", "The swapped ally gains +2 Block.", null, { t: { block: 2 } }), B: U("Long Shift", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  // Controller
  silence: { A: U("Hush Snare", "The target is also Rooted.", null, { t: { root: true } }), B: U("Deep Silence", "Silenced for 3 turns instead of 2.", null, { t: { silence: 3 } }) },
  pull: { A: U("Drag Down", "The pulled enemy is also Rooted.", null, { t: { root: true } }), B: U("Long Pull", "Reaches 4 tiles and drags up to 3.", { range: 4, steps: 3 }) },
  // Frostbinder
  "frost-bolt": { A: U("Brittle Ice", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }), B: U("Long Bolt", "Reaches 6 tiles instead of 4.", { range: 6 }) },
  shatter: { A: U("Shrapnel", "Enemies next to the target take 2 damage.", null, { splash: { dmg: 2 } }), B: U("Refreeze", "Adds 1 Chill to the target afterwards.", null, { t: { chill: 1 } }) },
  "frozen-ground": { A: U("Glacier", "Every enemy on the ice is also Slowed.", null, { t: { slow: true }, splash: { slow: true } }), B: U("Far Freeze", "Reaches 6 tiles instead of 4.", { range: 6 }) },
  // Rootweaver
  "root-snare": { A: U("Thorned Snare", "The target also gets 2 Poison.", null, { t: { poison: 2 } }), B: U("Wide Snare", "Enemies next to the target are Slowed.", null, { splash: { slow: true } }) },
  "growing-wall": { A: U("Ironwood Wall", "The wall has 9 HP instead of 5.", { hp: 9 }), B: U("Bramble Wall", "Enemies next to the wall also take 2 damage.", null, { tile: { dmg: 2 } }) },
  "vine-bridge": { A: U("Quick Weave", "Recharges in 2 turns instead of 4.", { cooldown: 2 }), B: U("Living Bridge", "The Rootweaver also gains +2 Block.", null, { self: { block: 2 } }) },
  // Disruptor
  dispel: { A: U("Backlash", "Deals 3 damage instead of 1.", { damage: 3 }), B: U("Shock Dispel", "The target is also Silenced until your next turn.", null, { t: { silence: 1 } }) },
  displace: { A: U("Crushing Shove", "4 damage if something blocks it instead of 2.", { bonus: 4 }), B: U("Far Shove", "Shoves up to 3 tiles.", { steps: 3 }) },
  "static-disruption": { A: U("Overload", "The target is also Slowed.", null, { t: { slow: true } }), B: U("Static Field", "Enemies next to the target take 1 damage.", null, { splash: { dmg: 1 } }) },
  // Trapper
  "thorn-trap": { A: U("Serrated Trap", "The trap deals 5 damage instead of 3.", { damage: 5 }), B: U("Venom Spikes", "The trap also adds 2 Poison.", { poison: 2 }) },
  "poison-mine": { A: U("Potent Mine", "5 Poison instead of 3.", { amount: 5 }), B: U("Sticky Mine", "The mine also Roots its victim.", { root: true }) },
  decoy: { A: U("Sturdy Decoy", "The Decoy has 10 HP instead of 6.", { hp: 10 }), B: U("Far Decoy", "Can be set up to 5 tiles away.", { range: 5 }) },
  "pinning-shot": { A: U("Heavy Pin", "Deals full damage instead of half.", { full: true }), B: U("Crossfire", "Enemies next to the target are Suppressed too.", { wide: true }) },
  "smoke-screen": { A: U("Thick Smoke", "The smoke lasts 3 turns instead of 2.", { turns: 3 }), B: U("Choking Smoke", "Enemies in the smoke cloud get 1 Poison.", null, { tile: { poison: 1 } }) },
  // Hexer
  vulnerability: { A: U("Deep Hex", "The enemy is also Cursed for 2 turns.", null, { t: { curse: 2 } }), B: U("Far Hex", "Reaches 6 tiles instead of 4.", { range: 6 }) },
  "hex-chain": { A: U("Wracking Chain", "Deals 2 damage to each instead of 1.", { damage: 2 }), B: U("Binding Chain", "The main target is also Slowed.", null, { t: { slow: true } }) },
  "soul-debt": { A: U("Heavy Debt", "4 damage per attack instead of 3.", { damage: 4 }), B: U("Debt Collector", "The enemy is also Cursed for 2 turns.", null, { t: { curse: 2 } }) },
  // Summoner
  "summon-spirit": { A: U("Alpha Spirit", "The Spirit has +4 HP.", null, { pet: { hp: 4 } }), B: U("Eager Spirit", "The Spirit can act right away with 1 AP.", null, { pet: { ap: 1 } }) },
  "sacrificial-summon": { A: U("Bigger Burst", "The burst deals 6 instead of 4.", { damage: 6 }), B: U("Spirit Echo", "Summon Spirit is ready again at once.", null, { self: { resetCd: "summon-spirit" } }) },
  "swarm-command": { A: U("Pack Tactics", "The target is also Slowed.", null, { t: { slow: true } }), B: U("Blood Scent", "The target is Marked for 2 turns: every ally's hits on it deal +1.", null, { t: { mark: 1 } }) },
  // Beastmaster
  "call-companion": { A: U("Alpha Wolf", "The companion has +4 HP.", null, { pet: { hp: 4 } }), B: U("Eager Wolf", "The companion can act right away with 1 AP.", null, { pet: { ap: 1 } }) },
  hunt: { A: U("Savage Hunt", "The bite deals +4 instead of +2.", { bonus: 4 }), B: U("Hamstring", "The target is also Slowed.", null, { t: { slow: true } }) },
  frenzy: { A: U("Feral Frenzy", "The companion also heals 3.", null, { pet: { heal: 3 } }), B: U("Blood Frenzy", "+5 damage per hit instead of +3.", { bonus: 5 }) },
  // Alchemist
  "poison-flask": { A: U("Potent Brew", "3 Poison instead of 2.", { amount: 3 }), B: U("Sticky Flask", "The target is also Slowed.", null, { t: { slow: true } }) },
  "volatile-mixture": { A: U("Wide Blast", "Enemies next to the target get 1 Burn.", null, { splash: { burn: 1 } }), B: U("Corrosive", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }) },
  transmute: { A: U("Caustic Touch", "Also deals 2 damage.", null, { t: { dmg: 2 } }), B: U("Far Throw", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  // Scout
  "mark-threat": { A: U("Flag the Weak", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }), B: U("Pinpoint", "+3 damage per hit instead of +2.", { bonus: 3 }) },
  trailblazer: { A: U("Wide Trail", "Reaches allies within 3 tiles.", { radius: 3 }), B: U("Guarded Trail", "Allies within 2 also gain +1 Block.", null, { aura: { block: 1, radius: 2, incl: true } }) },
  // Saboteur
  sabotage: { A: U("Demolish", "The target is also Exposed until your next turn.", null, { t: { expose: 1 } }), B: U("Shrapnel", "Enemies next to the target take 1 damage.", null, { splash: { dmg: 1 } }) },
  "explosive-charge": { A: U("Big Charge", "Blows for 6 instead of 4.", { damage: 6 }), B: U("Long Fuse", "Can be planted up to 4 tiles away.", { range: 4 }) },
  "smoke-bomb": { A: U("Choking Smoke", "Enemies in the middle and next to it get 1 Poison.", null, { tile: { poison: 1 } }), B: U("Cover Smoke", "Allies in the middle and next to it gain +1 Block.", null, { tile: { block: 1 } }) },
  // Engineer
  "deploy-turret": { A: U("Heavy Turret", "The turret shoots for 4 instead of 3.", { attack: 4 }), B: U("Armored Turret", "The turret has 12 HP instead of 8.", { hp: 12 }) },
  "build-barricade": { A: U("Spiked Barricade", "Enemies next to the barricade take 2 damage.", null, { tile: { dmg: 2 } }), B: U("Quick Build", "Recharges in 2 turns instead of 3.", { cooldown: 2 }) },
  // Spiritwalker
  "spirit-step": { A: U("Ghost Veil", "Also gains +2 Block.", null, { self: { block: 2 } }), B: U("Long Step", "Steps up to 5 tiles.", { range: 5 }) },
  "phase-shift": { A: U("Warding Phase", "The ally also heals 3.", null, { t: { heal: 3 } }), B: U("Quick Phase", "Recharges in 3 turns instead of 4.", { cooldown: 3 }) },
  "return-to-hearth": { A: U("Deep Rest", "Heals 7 instead of 4.", { amount: 7 }), B: U("Ward of Home", "Also gains 1 Ward.", null, { self: { ward: 1 } }) },
  // Ritualist
  "begin-ritual": { A: U("Warding Chant", "Each stack also gives +1 Block.", null, { self: { block: 1 } }), B: U("Deep Chant", "Holds up to 4 stacks.", { max: 4 }) },
  "complete-ritual": { A: U("Wrathful Rite", "4 damage per stack instead of 3.", { damage: 4 }), B: U("Healing Rite", "Heals 3 per stack instead of 2.", { heal: 3 }) },
  "spirit-offering": { A: U("Blood Pact", "Costs 2 HP instead of 3.", { hpCost: 2 }), B: U("Empowering Offering", "The ally also gains +2 Block.", null, { t: { block: 2 } }) },
  // Chronomancer
  "haste-time": { A: U("Twin Haste", "The ally also gains +2 Block.", null, { t: { block: 2 } }), B: U("Far Haste", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  "slow-time": { A: U("Time Lock", "The enemy is also Rooted.", null, { t: { root: true } }), B: U("Quick Slow", "Recharges in 2 turns instead of 3.", { cooldown: 2 }) },
  rewind: { A: U("Rewind Plus", "The ally also heals 2 more.", null, { t: { heal: 2 } }), B: U("Far Rewind", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  // Shapeshifter
  "beast-form": { A: U("Wild Heart", "Shifting heals 2.", null, { self: { heal: 2 } }), B: U("Thick Pelt", "Shifting also gives +2 Block.", null, { self: { block: 2 } }) },
  "root-form": { A: U("Ancient Bark", "+5 Block instead of +3.", { block: 5 }), B: U("Mending Root", "Shifting heals 3.", null, { self: { heal: 3 } }) },
  "predator-form": { A: U("Shadow Pelt", "Shifting gives 1 Ward.", null, { self: { ward: 1 } }), B: U("Scent of Blood", "Shifting also gives +2 Block.", null, { self: { block: 2 } }) },
  // Corruptor
  "consume-curse": { A: U("Devour", "The Corruptor heals 2.", null, { self: { heal: 2 } }), B: U("Lingering Rot", "Leaves 2 Corruption behind.", null, { t: { corrupt: 2 } }) },
  "invert-blessing": { A: U("Bitter Inversion", "Also deals 2 damage.", null, { t: { dmg: 2 } }), B: U("Stolen Blessing", "The Corruptor gains +2 Block.", null, { self: { block: 2 } }) },
  "spread-corruption": { A: U("Plague", "The main target also gets 1 Corruption.", null, { t: { corrupt: 1 } }), B: U("Far Spread", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  // Merchant
  "emergency-supply": { A: U("Premium Potion", "Heals 5 instead of 3.", { amount: 5 }), B: U("Armored Crate", "+4 Block instead of +2.", { block: 4 }) },
  appraise: { A: U("Tax Collector", "Also deals 2 damage.", null, { t: { dmg: 2 } }), B: U("Keen Eye", "Reaches 7 tiles instead of 5.", { range: 7 }) },
  // Relic Keeper
  "relic-transfer": { A: U("Blessed Transfer", "The ally also gains +2 Block.", null, { t: { block: 2 } }), B: U("Quick Transfer", "Recharges in 3 turns instead of 4.", { cooldown: 3 }) },
  "forbidden-relic": { A: U("Blood Price", "Costs 2 HP instead of 3.", { hpCost: 2 }), B: U("Dark Bargain", "+3 attack instead of +2.", { bonus: 3 }) },
  // Cleanser
  purge: { A: U("Radiant Purge", "The ally also gains +2 Block.", null, { t: { block: 2 } }), B: U("Far Purge", "Reaches 5 tiles instead of 3.", { range: 5 }) },
  "purifying-light": { A: U("Burning Light", "Deals 3 damage instead of 2.", { damage: 3 }), B: U("Wide Light", "Reaches 3 tiles instead of 2.", { radius: 3 }) },
  // Gatherer
  scavenge: { A: U("Feast", "Heals 5 instead of 3 on a kill.", { amount: 5 }), B: U("Forager's Blade", "The target also gets 2 Poison.", null, { t: { poison: 2 } }) },
  overgrow: { A: U("Tangling Growth", "Enemies in the middle and next to it are Slowed.", null, { tile: { slow: true } }), B: U("Soft Moss", "Allies in the middle and next to it gain +1 Block.", null, { tile: { block: 1 } }) },
}
for (const cls of Object.values(CLASSES)) for (const sk of cls.skills) sk.upgrades = SKILL_UPGRADES[sk.id]

// Mana (step 1): every class skill costs mana on top of AP + cooldown.
// Default by AP cost + cooldown (cheap 10 ... big 35); an explicit `mana`
// on the skill wins. `manaFx` = the skill's own mana effect on its
// target: restore (ally), burn / steal (enemy).
export function defaultManaCost(skill) {
  const ap = skill?.cost ?? 1
  const cd = skill?.cooldown ?? 2
  if (ap >= 2) return cd >= 5 ? 35 : cd >= 4 ? 30 : 20
  return cd >= 4 ? 20 : cd >= 3 ? 15 : 10
}
export const SKILL_MANA_FX = {
  "lingering-bloom": { restore: 10 },
  "emergency-supply": { restore: 15 },
  empower: { restore: 10 },
  "tactical-order": { restore: 10 },
  silence: { burn: 15 },
  dispel: { burn: 15 },
  "invert-blessing": { burn: 10 },
  "soul-debt": { steal: 10 },
}
export function manaFxText(fx) {
  if (!fx) return ""
  if (fx.restore) return ` Also restores ${fx.restore} mana to the ally.`
  if (fx.burn) return ` Also burns ${fx.burn} of the enemy's mana.`
  if (fx.steal) return ` Also steals ${fx.steal} mana from the enemy.`
  return ""
}
for (const cls of Object.values(CLASSES)) {
  for (const sk of cls.skills) {
    if (sk.mana == null) sk.mana = defaultManaCost(sk)
    if (SKILL_MANA_FX[sk.id]) {
      sk.manaFx = SKILL_MANA_FX[sk.id]
      sk.text += manaFxText(sk.manaFx)
    }
  }
}

// Skill tree: a class skill with a chosen branch folded in: `patch` overrides numbers,
// `upgrade` carries the name/text/fx for the rider + the UI.
export function upgradeClassSkill(skill, branch) {
  const up = skill?.upgrades?.[branch]
  if (!up) return skill
  return { ...skill, ...(up.patch || {}), upgrade: { branch, name: up.name, text: up.text, fx: up.fx || null } }
}

// Apply every chosen branch (`ups` = { skillId: "A"|"B" }) to a unit's
// class skills. The signature is handled by tacticsAbilities.upgradeAbility.
export function applySkillUpgrades(unit, ups) {
  if (!ups || !unit?.classSkills?.length) return unit
  return { ...unit, classSkills: unit.classSkills.map((sk) => (ups[sk.id] ? upgradeClassSkill(sk, ups[sk.id]) : sk)) }
}

export const CLASS_IDS = Object.keys(CLASSES)

export function classById(id) {
  return (id && CLASSES[id]) || null
}

// Units whose kit fit a part-B class better - reassigned in units.js's
// UNIT_CLASS_IDS by part B (kept as the record of that move).
export const PART_B_CANDIDATES = {
  beastcaller: "beastmaster",
  "pack-elder": "beastmaster",
  mycelist: "summoner",
  "mycelian-host": "summoner",
  wraithcaller: "spiritwalker",
  wispkeeper: "spiritwalker",
  hexmother: "hexer",
  huldra: "alchemist",
  witherkit: "hexer",
  nightveil: "hexer",
  "the-devil": "corruptor",
  death: "corruptor",
  "void-herald": "corruptor",
  "the-moon": "disruptor",
  snareclaw: "trapper",
  thornwisp: "rootweaver",
  glimmerward: "cleanser",
  stoneknit: "engineer",
  chimera: "shapeshifter",
  "grove-merchant": "merchant",
  "acorn-banker": "merchant",
  "toll-warden": "merchant",
  "fortunes-root": "relic-keeper",
  "hollow-forager": "gatherer",
  "wheel-of-fortune": "chronomancer",
  stormwing: "scout",
}

// Safety net for a def without an explicit classId (new content, the
// Commander character): best guess from role + signature kind.
export function fallbackClassId(def, abilityKind) {
  if (!def) return null
  const byKind = {
    heal: "healer",
    "shield-ally": def.role === "tank" ? "guardian" : "medic",
    "aura-block": "guardian",
    "taunt-shout": "warden",
    rally: "buffer",
    dash: "assassin",
    cleave: "bruiser",
    push: def.role === "tank" ? "juggernaut" : "bruiser",
    "poison-strike": "executioner",
    "root-shot": "controller",
    burst: def.attackPattern && def.attackPattern !== "single" ? "ranger" : "striker",
  }
  return byKind[abilityKind] || (def.role === "tank" ? "guardian" : def.role === "support" ? "healer" : "striker")
}
