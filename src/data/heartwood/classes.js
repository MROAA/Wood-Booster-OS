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
    description: "Protects allies and holds the front line.",
    passive: { id: "stalwart", name: "Stalwart", text: "Side hits don't weaken its Block, and it can't be pushed or pulled." },
    skills: [
      { id: "guard", name: "Guard", icon: "⛨", cost: 1, cooldown: 2, target: "ally", range: 1, noSelf: true, text: "Guard an adjacent ally until your next turn: the Guardian takes half of every attack aimed at it." },
      { id: "shield-wall", name: "Shield Wall", icon: "▦", cost: 1, cooldown: 3, target: "self", self: 3, allies: 2, text: "+3 Block to itself and +2 Block to every adjacent ally." },
    ],
  },
  warden: {
    id: "warden",
    name: "Warden",
    group: "frontline",
    icon: "❦",
    description: "Guards an area, not just one ally.",
    passive: { id: "hold-ground", name: "Hold Ground", text: "If it didn't move this turn, it gains +2 Block when you end the turn." },
    skills: [
      { id: "warden-zone", name: "Warden Zone", icon: "◌", cost: 1, cooldown: 3, target: "self", block: 1, text: "It and allies within 1 tile gain +1 Block and take 1 less damage from every hit until your next turn." },
      { id: "thorn-boundary", name: "Thorn Boundary", icon: "✲", cost: 1, cooldown: 3, target: "self", radius: 2, damage: 2, text: "Thorns burst out: every enemy within 2 tiles takes 2 damage and is Slowed." },
    ],
  },
  juggernaut: {
    id: "juggernaut",
    name: "Juggernaut",
    group: "frontline",
    icon: "⚒",
    description: "Slow, but almost impossible to stop.",
    passive: { id: "last-stand", name: "Last Stand", text: "Below half HP it takes 1 less damage from every hit and can't be pushed or pulled." },
    skills: [
      { id: "charge", name: "Charge", icon: "➠", cost: 2, cooldown: 3, target: "enemy", range: 4, text: "Shake off Root and Slow, charge in a straight line to an enemy up to 4 tiles away and hit it: +1 damage per tile charged." },
      { id: "ground-breaker", name: "Ground Breaker", icon: "✺", cost: 2, cooldown: 3, target: "self", text: "Smash the ground: every adjacent enemy is hit and Slowed, adjacent barricades crumble." },
    ],
  },
  sentinel: {
    id: "sentinel",
    name: "Sentinel",
    group: "frontline",
    icon: "◎",
    description: "Watches an area and punishes enemy movement.",
    passive: { id: "defensive-aim", name: "Defensive Aim", text: "Its hits deal +1 damage while it hasn't moved this turn." },
    skills: [
      { id: "overwatch", name: "Overwatch", icon: "◉", cost: 1, cooldown: 2, target: "self", text: "Until your next turn, it shoots the first enemy that ends a move within its attack range." },
      { id: "mark-intruder", name: "Mark Intruder", icon: "⊕", cost: 1, cooldown: 2, target: "enemy", range: 5, bonus: 3, text: "Mark an enemy within 5 tiles for 2 turns - this Sentinel's hits on it deal +3." },
    ],
  },
  bruiser: {
    id: "bruiser",
    name: "Bruiser",
    group: "frontline",
    icon: "✊",
    description: "Tough and hard-hitting - fights in the thick of it.",
    passive: { id: "adrenaline", name: "Adrenaline", text: "+1 damage for every quarter of its HP that is missing." },
    skills: [
      { id: "heavy-swing", name: "Heavy Swing", icon: "⟳", cost: 2, cooldown: 2, target: "enemy", range: 1, text: "Hit an adjacent enemy; every other enemy next to the Bruiser takes half damage." },
      { id: "shoulder-check", name: "Shoulder Check", icon: "⇥", cost: 1, cooldown: 2, target: "enemy", range: 1, text: "Hit an adjacent enemy for half damage, knock it back 1 tile and step into its place." },
    ],
  },
  striker: {
    id: "striker",
    name: "Striker",
    group: "damage",
    icon: "⚔",
    description: "Reliable, steady damage.",
    passive: { id: "battle-rhythm", name: "Battle Rhythm", text: "Every hit it lands this turn makes its next hit this turn deal +1." },
    skills: [
      { id: "double-strike", name: "Double Strike", icon: "⚔", cost: 2, cooldown: 2, target: "enemy", range: "reach", mult: 0.6, text: "Two quick hits at 60% damage each." },
      { id: "exploit-opening", name: "Exploit Opening", icon: "✧", cost: 1, cooldown: 2, target: "enemy", range: "reach", bonus: 3, text: "Hit an enemy; +3 damage if it carries any status (poison, burn, chill, root, slow, weak, marked...)." },
    ],
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    group: "damage",
    icon: "☾",
    description: "Slips behind the lines and kills a key target.",
    passive: { id: "backstab", name: "Backstab", text: "+3 damage when it hits from the side or from behind." },
    skills: [
      { id: "shadow-step", name: "Shadow Step", icon: "☽", cost: 1, cooldown: 3, target: "enemy", range: 4, text: "Vanish and reappear right behind an enemy within 4 tiles, facing its back." },
      { id: "execution", name: "Execution", icon: "✝", cost: 2, cooldown: 3, target: "enemy", range: "reach", below: 0.4, mult: 2.5, text: "Hit an enemy; if it's below 40% HP the hit deals x2.5 damage." },
    ],
  },
  duelist: {
    id: "duelist",
    name: "Duelist",
    group: "damage",
    icon: "⚜",
    description: "Locks down and beats one important enemy.",
    passive: { id: "riposte", name: "Riposte", text: "Once per enemy turn, when hit in melee it strikes back for half damage." },
    skills: [
      { id: "challenge", name: "Challenge", icon: "⚑", cost: 1, cooldown: 3, target: "enemy", range: 3, bonus: 2, text: "Challenge an enemy within 3 tiles for 2 turns: it must attack the Duelist when it can, and the Duelist deals +2 to it." },
      { id: "disarm", name: "Disarm", icon: "⚯", cost: 1, cooldown: 3, target: "enemy", range: "reach", text: "Hit an enemy for half damage - its attacks deal half damage until your next turn." },
    ],
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    group: "damage",
    icon: "➶",
    description: "Mobile ranged damage that keeps its distance.",
    passive: { id: "steady-aim", name: "Steady Aim", text: "+1 damage to targets 3 or more tiles away." },
    skills: [
      { id: "hunters-mark", name: "Hunter's Mark", icon: "⌖", cost: 1, cooldown: 3, target: "enemy", range: 5, bonus: 2, text: "Mark an enemy within 5 tiles for 2 turns - every ally's hits on it deal +2." },
      { id: "retreat-shot", name: "Retreat Shot", icon: "↶", cost: 2, cooldown: 2, target: "enemy", range: "reach", steps: 2, text: "Hit an enemy, then jump up to 2 tiles straight away from it." },
    ],
  },
  artillery: {
    id: "artillery",
    name: "Artillery",
    group: "damage",
    icon: "✹",
    description: "Long-range and area damage.",
    passive: { id: "siege", name: "Siege Weapon", text: "Deals double damage to barricades, and +2 to targets with Block or Ward." },
    skills: [
      { id: "piercing-beam", name: "Piercing Beam", icon: "⟿", cost: 2, cooldown: 3, target: "enemy", range: 5, text: "Fire in a straight line (row, column or diagonal) up to 5 tiles: every enemy on the line is hit." },
      { id: "suppression-fire", name: "Suppression Fire", icon: "⁂", cost: 1, cooldown: 3, target: "enemy", range: "reach", damage: 2, text: "Pepper an area: the target and every enemy next to it take 2 damage and are Slowed." },
    ],
  },
  executioner: {
    id: "executioner",
    name: "Executioner",
    group: "damage",
    icon: "⚰",
    description: "Finishes off wounded enemies.",
    passive: { id: "finishers-momentum", name: "Finisher's Momentum", text: "Its first kill each turn refunds 1 AP." },
    skills: [
      { id: "execute", name: "Execute", icon: "⚰", cost: 2, cooldown: 2, target: "enemy", range: "reach", below: 0.5, mult: 2, text: "Hit an enemy; if it's below half HP the hit deals double damage." },
      { id: "sever", name: "Sever", icon: "✂", cost: 1, cooldown: 3, target: "enemy", range: "reach", text: "Hit an enemy and cut away its Ward, Revive and Regen - no second chances." },
    ],
  },
  spellblade: {
    id: "spellblade",
    name: "Spellblade",
    group: "damage",
    icon: "✦",
    description: "Blends blade and magic, and loves element combos.",
    passive: { id: "arcane-edge", name: "Arcane Edge", text: "After it uses a skill, its next hit this turn deals +2 and adds 1 Burn." },
    skills: [
      { id: "elemental-strike", name: "Elemental Strike", icon: "✦", cost: 1, cooldown: 2, target: "enemy", range: "reach", text: "Hit an enemy with the element of the turn - Fire (2 Burn), Frost (1 Chill), Nature (Entangle) - it cycles every turn." },
      { id: "arcane-dash", name: "Arcane Dash", icon: "↯", cost: 2, cooldown: 3, target: "enemy", range: 3, bonus: 1, text: "Blink up to 3 tiles next to an enemy and hit it for +1, adding 1 Chill." },
    ],
  },
  healer: {
    id: "healer",
    name: "Healer",
    group: "support",
    icon: "✚",
    description: "Keeps the team on its feet.",
    passive: { id: "gentle-hands", name: "Gentle Hands", text: "Every heal it casts also gives the target +1 Block." },
    skills: [
      { id: "group-renewal", name: "Group Renewal", icon: "❋", cost: 1, cooldown: 3, target: "self", amount: 3, text: "Heal itself and every adjacent ally for 3." },
      { id: "lingering-bloom", name: "Lingering Bloom", icon: "❀", cost: 1, cooldown: 2, target: "ally", range: 2, amount: 2, turns: 2, text: "Heal an ally within 2 tiles for 2 now and 2 more at the start of each of your next 2 turns." },
    ],
  },
  medic: {
    id: "medic",
    name: "Medic",
    group: "support",
    icon: "✙",
    description: "Emergency care: saves allies at the critical moment.",
    passive: { id: "triage", name: "Triage", text: "Its heals are 50% stronger on allies below half HP." },
    skills: [
      { id: "stabilize", name: "Stabilize", icon: "♥", cost: 1, cooldown: 4, target: "ally", range: 2, text: "An ally within 2 tiles can't fall until your next turn - a killing blow leaves it at 1 HP." },
      { id: "cleanse", name: "Cleanse", icon: "✧", cost: 1, cooldown: 2, target: "ally", range: 2, amount: 2, text: "Remove poison, burn, chill, root, slow, weak and similar effects from an ally within 2 tiles and heal it for 2." },
      { id: "emergency-stim", name: "Emergency Stim", icon: "⚡", cost: 1, cooldown: 3, target: "ally", range: 1, noSelf: true, text: "An adjacent ally gets +1 AP right now, but starts your next turn with 1 AP less." },
    ],
  },
  buffer: {
    id: "buffer",
    name: "Buffer",
    group: "support",
    icon: "♫",
    description: "Makes the right ally much stronger.",
    passive: { id: "uplift", name: "Uplift", text: "Allies it targets with a skill also gain +1 Block." },
    skills: [
      { id: "empower", name: "Empower", icon: "▲", cost: 1, cooldown: 2, target: "ally", range: 2, noSelf: true, bonus: 3, text: "An ally within 2 tiles deals +3 damage with every hit until your next turn." },
      { id: "coordinated-strike", name: "Coordinated Strike", icon: "⚔", cost: 2, cooldown: 3, target: "enemy", range: 5, text: "Every ally next to the chosen enemy hits it at once for half damage." },
    ],
  },
  commander: {
    id: "commander",
    name: "Commander",
    group: "support",
    icon: "♛",
    description: "Gives the team extra actions and a shared plan.",
    passive: { id: "chain-of-command", name: "Chain of Command", text: "Whenever an ally lands a kill, the Commander's skill cooldowns drop by 1." },
    skills: [
      { id: "tactical-order", name: "Tactical Order", icon: "➹", cost: 1, cooldown: 3, target: "ally", range: 3, noSelf: true, text: "An ally within 3 tiles gains +1 AP right now." },
      { id: "focus-target", name: "Focus Target", icon: "⌖", cost: 1, cooldown: 2, target: "enemy", range: 6, bonus: 2, text: "Name a target within 6 tiles: every ally's hits on it deal +2 until your next turn." },
      { id: "hold-formation", name: "Hold Formation", icon: "▤", cost: 1, cooldown: 3, target: "self", block: 2, text: "Every ally on the field gains +2 Block." },
    ],
  },
  tactician: {
    id: "tactician",
    name: "Tactician",
    group: "support",
    icon: "♞",
    description: "Reads the battlefield and reshapes it.",
    passive: { id: "foresight", name: "Foresight", text: "It sees every blow coming - it can never be flanked or hit from behind." },
    skills: [
      { id: "reveal-weakness", name: "Reveal Weakness", icon: "◈", cost: 1, cooldown: 3, target: "enemy", range: 5, text: "An enemy within 5 tiles is Exposed for 2 turns - it takes 25% more damage from everything." },
      { id: "formation-shift", name: "Formation Shift", icon: "⇄", cost: 1, cooldown: 3, target: "ally", range: 3, noSelf: true, text: "Swap places with an ally within 3 tiles." },
    ],
  },
  controller: {
    id: "controller",
    name: "Controller",
    group: "control",
    icon: "⌬",
    description: "Takes options away from the enemy.",
    passive: { id: "lockdown", name: "Lockdown", text: "+2 damage to enemies that are Rooted, Slowed, Silenced or Entangled." },
    skills: [
      { id: "silence", name: "Silence", icon: "⊘", cost: 1, cooldown: 3, target: "enemy", range: "reach", text: "Hit an enemy for half damage - it can't use its special skills for its next 2 turns." },
      { id: "pull", name: "Pull", icon: "⇤", cost: 1, cooldown: 2, target: "enemy", range: 3, steps: 2, text: "Drag an enemy within 3 tiles up to 2 tiles toward the Controller and Slow it." },
    ],
  },
  frostbinder: {
    id: "frostbinder",
    name: "Frostbinder",
    group: "control",
    icon: "❄",
    description: "Slows the fight down and turns ground to ice.",
    passive: { id: "cold-snap", name: "Cold Snap", text: "+2 damage to Chilled or Frozen enemies." },
    skills: [
      { id: "frost-bolt", name: "Frost Bolt", icon: "❄", cost: 1, cooldown: 2, target: "enemy", range: 3, text: "Hit an enemy up to 3 tiles away, add 1 Chill and Slow it." },
      { id: "shatter", name: "Shatter", icon: "✷", cost: 2, cooldown: 3, target: "enemy", range: "reach", text: "Hit an enemy: double damage if it's Frozen (on top of the usual +50% Shatter), x1.5 if it's Chilled." },
      { id: "frozen-ground", name: "Frozen Ground", icon: "⧆", cost: 1, cooldown: 4, target: "enemy", range: 3, text: "Freeze the ground under and around an enemy within 3 tiles into slippery Ice - every enemy there gets 1 Chill." },
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
    description: "Controls the battlefield with roots, vines and living walls.",
    passive: { id: "grasping-roots", name: "Grasping Roots", text: "Once per enemy turn, the first enemy that ends a move next to it is Rooted." },
    skills: [
      { id: "root-snare", name: "Root Snare", icon: "➰", cost: 1, cooldown: 2, target: "enemy", range: 3, damage: 1, text: "Roots an enemy within 3 tiles (it can't move on its next turn) and deals 1 damage." },
      { id: "growing-wall", name: "Growing Wall", icon: "▥", cost: 1, cooldown: 3, target: "tile", tile: "empty", range: 3, hp: 5, text: "Grow a thorny barricade (5 HP) on an empty tile within 3; enemies next to it are Rooted." },
      { id: "vine-bridge", name: "Vine Bridge", icon: "⌇", cost: 1, cooldown: 4, target: "tile", tile: "crossing", range: 3, text: "Weave a walkable vine bridge over water, lava or rocks within 3 tiles." },
    ],
  },
  disruptor: {
    id: "disruptor",
    name: "Disruptor",
    group: "control",
    icon: "↯",
    description: "Breaks the enemy's plan before it happens.",
    passive: { id: "interrupt", name: "Interrupt", text: "Its hits cancel an enemy's wind-up (Slam, Charge) and push its special skills 1 turn further on cooldown." },
    skills: [
      { id: "dispel", name: "Dispel", icon: "⊗", cost: 1, cooldown: 3, target: "enemy", range: 3, damage: 1, text: "Strip an enemy within 3 of Block, Ward, Regen, Taunt, Bulwark and earned Strength, then deal 1 damage." },
      { id: "displace", name: "Displace", icon: "⇲", cost: 1, cooldown: 3, target: "enemy", range: 3, steps: 2, bonus: 2, text: "Shove an enemy within 3 up to 2 tiles straight away; if something blocks it, it takes 2 damage." },
      { id: "static-disruption", name: "Static Disruption", icon: "ϟ", cost: 1, cooldown: 3, target: "enemy", range: "reach", text: "Hit an enemy for half damage - it has 1 AP less on its next turn (it can move OR attack, not both)." },
    ],
  },
  trapper: {
    id: "trapper",
    name: "Trapper",
    group: "control",
    icon: "⊼",
    description: "Sets traps and punishes the enemy's routes.",
    passive: { id: "ambush-network", name: "Ambush Network", text: "When one of its traps springs, every other enemy next to the trap takes 2 damage too." },
    skills: [
      { id: "thorn-trap", name: "Thorn Trap", icon: "✳", cost: 1, cooldown: 2, target: "tile", tile: "empty", range: 3, damage: 3, text: "Hide a trap on an empty tile within 3: the first enemy to stop on it takes 3 damage and is Rooted." },
      { id: "poison-mine", name: "Poison Mine", icon: "☣", cost: 1, cooldown: 3, target: "tile", tile: "empty", range: 3, amount: 3, text: "Hide a mine on an empty tile within 3: the first enemy to stop on it gets 3 Poison." },
      { id: "decoy", name: "Decoy", icon: "☖", cost: 1, cooldown: 4, target: "tile", tile: "empty", range: 3, hp: 6, text: "Set up a Decoy (6 HP) on an empty tile within 3 - enemies must go for it while it stands." },
    ],
  },
  hexer: {
    id: "hexer",
    name: "Hexer",
    group: "control",
    icon: "⛧",
    description: "Weakens enemies with curses.",
    passive: { id: "malediction", name: "Malediction", text: "Every hit it lands Curses the target until your next turn: a Cursed unit deals 1 less and takes 1 more damage per hit." },
    skills: [
      { id: "vulnerability", name: "Vulnerability", icon: "◬", cost: 1, cooldown: 3, target: "enemy", range: 4, text: "An enemy within 4 is Exposed for 2 turns - it takes 25% more damage from everything." },
      { id: "hex-chain", name: "Hex Chain", icon: "⛓", cost: 2, cooldown: 3, target: "enemy", range: 4, damage: 1, text: "Curse an enemy within 4 and every enemy next to it for 2 turns, dealing 1 damage to each." },
      { id: "soul-debt", name: "Soul Debt", icon: "⚖", cost: 1, cooldown: 3, target: "enemy", range: 4, damage: 3, text: "For 2 turns, every time the enemy attacks, it takes 3 damage." },
    ],
  },
  summoner: {
    id: "summoner",
    name: "Summoner",
    group: "summoning",
    icon: "⚝",
    description: "Calls spirits to fight and fill the board.",
    passive: { id: "spirit-bond", name: "Spirit Bond", text: "Spirits it summons deal +1 damage with every hit." },
    skills: [
      { id: "summon-spirit", name: "Summon Spirit", icon: "✺", cost: 2, cooldown: 3, target: "self", text: "Summon a Spirit Wolf next to it (one at a time). It can act from your next turn." },
      { id: "sacrificial-summon", name: "Sacrificial Summon", icon: "✹", cost: 1, cooldown: 3, target: "self", damage: 4, text: "Its Spirit bursts: every enemy next to the Spirit takes 4 damage, and the Summoner heals for the Spirit's remaining HP (max 5)." },
      { id: "swarm-command", name: "Swarm Command", icon: "⚑", cost: 1, cooldown: 3, target: "enemy", range: 6, text: "Every spirit and summon on your side that can reach the enemy hits it at once." },
    ],
  },
  beastmaster: {
    id: "beastmaster",
    name: "Beastmaster",
    group: "summoning",
    icon: "🐾",
    description: "Fights side by side with an animal companion.",
    passive: { id: "pack-bond", name: "Pack Bond", text: "If its companion falls, it gains +2 attack for the fight and Call Companion is ready again at once." },
    skills: [
      { id: "call-companion", name: "Call Companion", icon: "🐺", cost: 2, cooldown: 4, target: "self", text: "Call a Spirit Wolf companion next to it (if it has none). It can act from your next turn." },
      { id: "hunt", name: "Hunt", icon: "➹", cost: 1, cooldown: 2, target: "enemy", range: 6, bonus: 2, reach: 4, text: "Its companion leaps up to 4 tiles next to an enemy and bites it for +2." },
      { id: "frenzy", name: "Frenzy", icon: "✶", cost: 1, cooldown: 3, target: "self", bonus: 3, text: "Its companion gets +1 AP and +3 damage with every hit this turn." },
    ],
  },
  alchemist: {
    id: "alchemist",
    name: "Alchemist",
    group: "summoning",
    icon: "⚗",
    description: "Mixes poisons and fire into explosive reactions.",
    passive: { id: "catalyst", name: "Catalyst", text: "Every hit it lands adds 1 Poison (Poison + Fire = Toxic Blaze)." },
    skills: [
      { id: "poison-flask", name: "Poison Flask", icon: "⚱", cost: 1, cooldown: 2, target: "enemy", range: 3, amount: 2, text: "Throw a flask at an enemy within 3: it and every enemy next to it get 2 Poison." },
      { id: "volatile-mixture", name: "Volatile Mixture", icon: "✺", cost: 2, cooldown: 3, target: "enemy", range: 3, amount: 2, text: "Hit an enemy within 3 with 2 Burn - on a poisoned enemy that sets off a Toxic Blaze." },
      { id: "transmute", name: "Transmute", icon: "⟲", cost: 1, cooldown: 3, target: "enemy", range: 3, text: "Turn an enemy's Block and Regen into Poison of the same amount." },
    ],
  },
  scout: {
    id: "scout",
    name: "Scout",
    group: "specialist",
    icon: "⌕",
    description: "Fast, reads the field and opens routes.",
    passive: { id: "pathfinder", name: "Pathfinder", text: "Its first move each turn costs no AP." },
    skills: [
      { id: "mark-threat", name: "Mark Threat", icon: "⚐", cost: 1, cooldown: 3, target: "enemy", range: 6, bonus: 2, text: "Mark an enemy within 6 for 2 turns - every ally's hits on it deal +2." },
      { id: "trailblazer", name: "Trailblazer", icon: "⇶", cost: 1, cooldown: 3, target: "self", radius: 2, text: "Allies within 2 tiles shake off Root and Slow, and their next move this turn costs no AP." },
    ],
  },
  saboteur: {
    id: "saboteur",
    name: "Saboteur",
    group: "specialist",
    icon: "✇",
    description: "Wrecks barricades, totems and defenses.",
    passive: { id: "demolitions", name: "Demolitions", text: "Deals triple damage to barricades and +3 to Totems and other structures." },
    skills: [
      { id: "sabotage", name: "Sabotage", icon: "⚒", cost: 1, cooldown: 2, target: "enemy", range: "reach", text: "Strip an enemy's Block, Ward and Bulwark, then hit it." },
      { id: "explosive-charge", name: "Explosive Charge", icon: "✹", cost: 1, cooldown: 3, target: "tile", tile: "any", range: 2, damage: 4, text: "Plant a charge on a tile within 2 - when you end the turn it blows: 4 damage to enemies on and next to it, and barricades there crumble." },
      { id: "smoke-bomb", name: "Smoke Bomb", icon: "☁", cost: 1, cooldown: 4, target: "tile", tile: "any", range: 3, text: "Smoke fills a 3x3 area within 3 tiles: its open ground turns into Tall grass (cover from ranged attacks)." },
    ],
  },
  engineer: {
    id: "engineer",
    name: "Engineer",
    group: "specialist",
    icon: "⚙",
    description: "Builds turrets and barricades.",
    passive: { id: "field-repairs", name: "Field Repairs", text: "When you end the turn, it repairs 2 HP on its turret and on every barricade next to it." },
    skills: [
      { id: "deploy-turret", name: "Deploy Turret", icon: "⌖", cost: 2, cooldown: 4, target: "tile", tile: "empty", range: 2, hp: 8, attack: 3, reach: 3, text: "Build a Turret (8 HP, one at a time) on an empty tile within 2 - when you end the turn it shoots the nearest enemy within 3 for 3." },
      { id: "build-barricade", name: "Build Barricade", icon: "▦", cost: 1, cooldown: 3, target: "tile", tile: "empty", range: 2, text: "Build a full barricade on an empty tile within 2." },
    ],
  },
  spiritwalker: {
    id: "spiritwalker",
    name: "Spiritwalker",
    group: "specialist",
    icon: "☁",
    description: "Walks between worlds - slips past walls and saves allies.",
    passive: { id: "veil", name: "Veil", text: "When you end the turn with no enemy within 2 tiles of it, it gains +2 Block." },
    skills: [
      { id: "spirit-step", name: "Spirit Step", icon: "⤳", cost: 1, cooldown: 2, target: "tile", tile: "empty", range: 3, text: "Step through the spirit world to an empty tile within 3 - walls, water and units don't block it." },
      { id: "phase-shift", name: "Phase Shift", icon: "◌", cost: 1, cooldown: 4, target: "ally", range: 3, text: "An ally within 3 (or itself) takes no damage from hits until your next turn, but its own hits deal half." },
      { id: "return-to-hearth", name: "Return to Hearth", icon: "⌂", cost: 2, cooldown: 5, target: "self", amount: 4, text: "Return to the back line (your starting edge) and heal 4." },
    ],
  },
  ritualist: {
    id: "ritualist",
    name: "Ritualist",
    group: "specialist",
    icon: "⍟",
    description: "Builds a great effect over several turns.",
    passive: { id: "interrupted-ritual", name: "Interrupted Ritual", text: "If it's hit while channeling, the ritual goes off early at half power." },
    skills: [
      { id: "begin-ritual", name: "Begin Ritual", icon: "◍", cost: 1, cooldown: 1, target: "self", max: 3, text: "Add 1 Ritual stack (max 3)." },
      { id: "complete-ritual", name: "Complete Ritual", icon: "✺", cost: 2, cooldown: 3, target: "self", radius: 3, damage: 3, heal: 2, text: "Spend every Ritual stack: each enemy within 3 takes 3 per stack, each ally within 3 heals 2 per stack." },
      { id: "spirit-offering", name: "Spirit Offering", icon: "♦", cost: 1, cooldown: 3, target: "ally", range: 3, noSelf: true, hpCost: 3, text: "Pay 3 HP: an ally within 3 gains +1 AP right now." },
    ],
  },
  chronomancer: {
    id: "chronomancer",
    name: "Chronomancer",
    group: "specialist",
    icon: "⌛",
    description: "Bends the rhythm of turns and cooldowns.",
    passive: { id: "temporal-flow", name: "Temporal Flow", text: "Its own skill cooldowns tick down twice as fast." },
    skills: [
      { id: "haste-time", name: "Haste Time", icon: "⏩", cost: 1, cooldown: 3, target: "ally", range: 3, noSelf: true, text: "An ally within 3 starts your next turn with +1 AP." },
      { id: "slow-time", name: "Slow Time", icon: "⏪", cost: 1, cooldown: 3, target: "enemy", range: 4, text: "An enemy within 4 is Slowed and its special skills go 2 turns further on cooldown." },
      { id: "rewind", name: "Rewind", icon: "↺", cost: 1, cooldown: 4, target: "ally", range: 3, text: "Turn back time on an ally within 3 (or itself): it regains all HP lost since you last ended your turn." },
    ],
  },
  shapeshifter: {
    id: "shapeshifter",
    name: "Shapeshifter",
    group: "specialist",
    icon: "⟁",
    description: "Changes form to fit the fight.",
    passive: { id: "form-mastery", name: "Form Mastery", text: "Changing form gives +2 Block." },
    skills: [
      { id: "beast-form", name: "Beast Form", icon: "🐾", cost: 1, cooldown: 1, target: "self", text: "Beast Form: +2 damage with every hit." },
      { id: "root-form", name: "Root Form", icon: "🌳", cost: 1, cooldown: 1, target: "self", block: 3, text: "Root Form: +3 Block now, takes 1 less damage from every hit and can't be pushed." },
      { id: "predator-form", name: "Predator Form", icon: "☾", cost: 1, cooldown: 1, target: "self", text: "Predator Form: +3 damage to enemies below half HP." },
    ],
  },
  corruptor: {
    id: "corruptor",
    name: "Corruptor",
    group: "specialist",
    icon: "☠",
    description: "Feeds on the enemy's weaknesses.",
    passive: { id: "corruption", name: "Corruption", text: "Every hit it lands adds 1 Corruption. At 5+ Corruption (Heart Rot) the enemy takes +2 from all your hits." },
    skills: [
      { id: "consume-curse", name: "Consume Curse", icon: "☄", cost: 1, cooldown: 2, target: "enemy", range: 3, text: "Consume an enemy's Corruption and ailments: 2 damage per Corruption stack plus 1 per ailment (Poison, Burn, Chill, Root...)." },
      { id: "invert-blessing", name: "Invert Blessing", icon: "⇅", cost: 1, cooldown: 3, target: "enemy", range: 3, text: "Every buff on an enemy within 3 (Block, Ward, Regen, Taunt, Bulwark, earned Strength) is removed and turns into 1 Corruption each." },
      { id: "spread-corruption", name: "Spread Corruption", icon: "✥", cost: 1, cooldown: 3, target: "enemy", range: 3, text: "Every enemy next to the target gets half its Corruption and a copy of its Poison and Burn." },
    ],
  },
  merchant: {
    id: "merchant",
    name: "Merchant",
    group: "summoning",
    icon: "⚖",
    description: "Turns fights into profit and hands out supplies.",
    passive: { id: "bounty", name: "Bounty", text: "Each enemy it defeats pays +1 Essence after a won fight (max 3 per fight)." },
    skills: [
      { id: "emergency-supply", name: "Emergency Supply", icon: "✚", cost: 1, cooldown: 3, target: "ally", range: 1, amount: 3, block: 2, text: "Hand a potion to itself or an adjacent ally: heal 3 and +2 Block." },
      { id: "appraise", name: "Appraise", icon: "◈", cost: 1, cooldown: 3, target: "enemy", range: 5, text: "Appraise an enemy within 5 for 2 turns: it takes +1 from every hit, and if it falls while Appraised it pays +1 Essence after the fight." },
    ],
  },
  "relic-keeper": {
    id: "relic-keeper",
    name: "Relic Keeper",
    group: "summoning",
    icon: "⚱",
    description: "Wakes old relics and bends the rules of the fight.",
    passive: { id: "resonance", name: "Resonance", text: "When you end the turn, each relic or item effect it carries that fires at turn start or turn end fires once more." },
    skills: [
      { id: "relic-transfer", name: "Relic Transfer", icon: "⇆", cost: 1, cooldown: 4, target: "ally", range: 2, noSelf: true, text: "Copy its relic and item effects onto an ally within 2 for the fight (with none: +2 Block to the ally)." },
      { id: "forbidden-relic", name: "Forbidden Relic", icon: "⛤", cost: 1, cooldown: 4, target: "self", hpCost: 3, bonus: 2, text: "Pay 3 HP for +2 attack for the rest of the fight." },
    ],
  },
  cleanser: {
    id: "cleanser",
    name: "Cleanser",
    group: "support",
    icon: "✧",
    description: "Washes away poisons, curses and ailments.",
    passive: { id: "purity", name: "Purity", text: "When you end the turn, it and every adjacent ally shake off one ailment each." },
    skills: [
      { id: "purge", name: "Purge", icon: "❂", cost: 1, cooldown: 3, target: "ally", range: 3, text: "Remove every ailment from an ally within 3 (or itself); it heals 1 for each ailment removed." },
      { id: "purifying-light", name: "Purifying Light", icon: "☀", cost: 1, cooldown: 3, target: "self", radius: 2, block: 1, damage: 2, text: "Allies within 2 shake off one ailment and gain +1 Block; Cursed or Corrupted enemies within 2 take 2 damage." },
    ],
  },
  gatherer: {
    id: "gatherer",
    name: "Gatherer",
    group: "summoning",
    icon: "✿",
    description: "Lives off the land - forages, scavenges and grows cover.",
    passive: { id: "forage", name: "Forage", text: "When you end the turn standing on or next to Forest or Tall grass, it heals 2." },
    skills: [
      { id: "scavenge", name: "Scavenge", icon: "⛏", cost: 1, cooldown: 2, target: "enemy", range: "reach", amount: 3, text: "Hit an enemy; if it falls, the Gatherer heals 3 and finds +1 Essence (after a won fight)." },
      { id: "overgrow", name: "Overgrow", icon: "❦", cost: 1, cooldown: 3, target: "tile", tile: "any", range: 2, text: "Plant a patch of Tall grass on a tile within 2 and the open ground around it." },
    ],
  },
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
