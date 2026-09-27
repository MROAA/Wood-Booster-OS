// Hearthwood class system, part A (Class System & Tactical Roles PRD
// §5-23): 19 classes, each a passive + 2-3 active skills. A unit's own
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
}

export const CLASS_IDS = Object.keys(CLASSES)

export function classById(id) {
  return (id && CLASSES[id]) || null
}

// Units whose kit would fit one of part B's classes better (Summoner,
// Beastmaster, Hexer, Merchant...). Part B reassigns these.
export const PART_B_CANDIDATES = {
  beastcaller: "beastmaster",
  "pack-elder": "beastmaster",
  mycelist: "summoner",
  "mycelian-host": "summoner",
  wraithcaller: "spiritwalker",
  wispkeeper: "spiritwalker",
  hexmother: "hexer",
  huldra: "hexer",
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
