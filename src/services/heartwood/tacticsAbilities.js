// Hearthwood Frontier - one active ability for EVERY deployable player unit.
// Pure data + derivation: the ability is read off the unit's own real kit
// (className, role, movePattern steps, passive) so it fits who the unit
// already is. tacticsEngine.js's hand-authored ABILITIES still win for the
// 6 original units; castAbility resolves every kind.

// Per-kind numbers. `cost` in AP (units have 2), `cooldown` in own turns.
const KIND_DEFAULTS = {
  dash: { cost: 2, cooldown: 3, range: 3, bonus: 2 },
  cleave: { cost: 2, cooldown: 2 },
  "poison-strike": { cost: 1, cooldown: 2, amount: 2 },
  "root-shot": { cost: 1, cooldown: 3 },
  push: { cost: 1, cooldown: 2, bonus: 2 },
  "taunt-shout": { cost: 1, cooldown: 3, amount: 4 },
  "shield-ally": { cost: 1, cooldown: 2, amount: 3 },
  rally: { cost: 1, cooldown: 3, amount: 1 },
  heal: { cost: 1, cooldown: 2, amount: 4 },
  burst: { cost: 2, cooldown: 3, multiplier: 2 },
  "aura-block": { cost: 1, cooldown: 2, amount: 1 },
}

// A className is the strongest identity signal - it decides kind + name.
const CLASS_ABILITIES = {
  Nightblade: ["dash", "Shadowstep"],
  Skirmisher: ["dash", "Skirmish Dash"],
  Galewing: ["dash", "Gale Dive"],
  Briarblade: ["dash", "Briar Rush"],
  Marksman: ["root-shot", "Pinning Shot"],
  Frostbinder: ["root-shot", "Frostbind"],
  Frostblade: ["root-shot", "Rime Cut"],
  Silencer: ["root-shot", "Hush Bolt"],
  Caller: ["root-shot", "Thunder Snare"],
  Dreamweaver: ["root-shot", "Dream Snare"],
  Venomtongue: ["poison-strike", "Venom Fang"],
  Hexweaver: ["poison-strike", "Hex Bite"],
  Sporelord: ["poison-strike", "Spore Burst"],
  Host: ["poison-strike", "Spore Host"],
  Reaver: ["cleave", "Reaping Arc"],
  Berserker: ["cleave", "Berserk Swing"],
  Hewer: ["cleave", "Great Hew"],
  Sweeper: ["cleave", "Bramble Sweep"],
  Soulbinder: ["cleave", "Soul Rend"],
  Breaker: ["push", "Breaking Blow"],
  Bruiser: ["push", "Haymaker"],
  Keystone: ["push", "Keystone Slam"],
  Bearer: ["push", "Shield Bash"],
  Cutter: ["burst", "Witch Cut"],
  Culler: ["burst", "Cull"],
  Seer: ["burst", "Seer's Mark"],
  Diviner: ["burst", "Spark Bolt"],
  Umbramancer: ["burst", "Umbral Bolt"],
  Zealot: ["rally", "Zealous Cry"],
  Beastcaller: ["rally", "Pack Call"],
  Crownguard: ["rally", "Royal Decree"],
  Stonewarden: ["taunt-shout", "Stone Roar"],
  Ironbark: ["taunt-shout", "Ironbark Roar"],
  Graveguard: ["taunt-shout", "Grave Challenge"],
  Decoy: ["taunt-shout", "Lure"],
  Keeper: ["shield-ally", "Warding Knot"],
  Guardian: ["shield-ally", "Grove Ward"],
  Bulwark: ["shield-ally", "Shield Ally"],
  Sapkeeper: ["shield-ally", "Sap Shield"],
  Oracle: ["heal", "Foresight Mend"],
  Elder: ["heal", "Heartroot Mend"],
  Bloomcaller: ["heal", "Bloom"],
}

// Fallback names by kind, picked by a stable hash of the unit id.
const KIND_NAMES = {
  dash: ["Pounce", "Lunge", "Charge", "Bound"],
  cleave: ["Sweeping Blow", "Wide Swing", "Thrash", "Rend"],
  "poison-strike": ["Venom Bite", "Blight Strike", "Toxic Sting"],
  "root-shot": ["Snaring Root", "Binding Vine", "Hold Fast"],
  push: ["Shove", "Battering Blow", "Sundering Bash"],
  "taunt-shout": ["Challenge", "War Roar", "Stand Firm"],
  "shield-ally": ["Guardian Ward", "Protect", "Bark Ward"],
  rally: ["Rally", "War Cry", "Rallying Call"],
  heal: ["Mend", "Sap Mend", "Soothe"],
  burst: ["Heavy Strike", "Crushing Blow", "Focused Strike"],
  "aura-block": ["Brace", "Hold the Line", "Bark Skin"],
}

function hash(text) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

function hasBuff(def, id) {
  return (def.passive || []).some((p) => p.type === "applyBuff" && p.id === id)
}
function hasTriggerBuff(def, id) {
  return (def.passive || []).some((p) => p.type === "addTrigger" && p.effect?.id === id)
}
function hasTriggerType(def, type) {
  return (def.passive || []).some((p) => p.type === "addTrigger" && p.effect?.type === type)
}
function steps(def, type, id) {
  return (def.movePattern || []).filter((m) => m.type === type && (!id || m.id === id))
}

// The kind a unit's kit points at, first match wins.
function kindForDef(def) {
  const auraEffect = def.aura?.effect
  if (auraEffect?.type === "applyBuff" && auraEffect.id === "strength") return "rally"
  if (steps(def, "heal").length || (def.role === "support" && hasTriggerType(def, "heal"))) return "heal"
  if (steps(def, "debuff", "poison").length || hasTriggerBuff(def, "poison") || hasTriggerBuff(def, "burn")) return "poison-strike"
  if (steps(def, "debuff", "stun").length || hasTriggerBuff(def, "stun") || def.frosty) return "root-shot"
  if (hasBuff(def, "taunt")) return "taunt-shout"
  if (def.haste || hasBuff(def, "evade") || def.nimble || def.attackPattern === "knight") return "dash"
  if (steps(def, "aoe").length || steps(def, "attack").length >= 2) return "cleave"
  if (steps(def, "sunder").length || (def.passive || []).some((p) => p.effect?.type === "sunder")) return "push"
  if (def.role === "tank") {
    if (hasBuff(def, "ward") || hasBuff(def, "bulwark") || hasBuff(def, "regen") || auraEffect) return "shield-ally"
    if (hasTriggerType(def, "block")) return "aura-block"
    return "push"
  }
  if (def.role === "support") return "shield-ally"
  if (def.role === "economy") return "rally"
  if (hasBuff(def, "strength") && def.role !== "dps") return "rally"
  if (def.role === "hybrid") return steps(def, "block").length ? "push" : "cleave"
  return "burst"
}

function amountFor(kind, def) {
  if (kind === "heal") {
    const healStep = Math.max(0, ...steps(def, "heal").map((m) => m.amount || 0))
    return Math.max(3, healStep + 1)
  }
  if (kind === "poison-strike") {
    const poison = steps(def, "debuff", "poison").reduce((s, m) => s + (m.amount || 0), 0)
    return Math.max(2, Math.min(4, poison))
  }
  if (kind === "aura-block") return def.tier === "rare" || def.tier === "legendary" ? 2 : 1
  return KIND_DEFAULTS[kind].amount
}

export function deriveAbilityForDef(def) {
  if (!def || def.summonOnly) return null
  const [kind, className] = CLASS_ABILITIES[def.className] || [kindForDef(def), null]
  const names = KIND_NAMES[kind]
  const name = className || names[hash(def.id) % names.length]
  const base = KIND_DEFAULTS[kind]
  const ability = { id: `${kind}-${def.id}`, name, kind, cost: base.cost, cooldown: base.cooldown }
  if (base.range) ability.range = base.range
  if (base.bonus) ability.bonus = base.bonus
  if (base.multiplier) ability.multiplier = base.multiplier
  const amount = amountFor(kind, def)
  if (amount != null) ability.amount = amount
  return ability
}

// "ally" / "enemy" when the ability needs a clicked target, null if instant.
export function abilityTargetSide(ability) {
  if (!ability) return null
  if (ability.kind === "heal" || ability.kind === "shield-ally") return "ally"
  if (ability.kind === "aura-block" || ability.kind === "taunt-shout" || ability.kind === "rally") return null
  return "enemy"
}

export function describeAbility(ability) {
  if (!ability) return ""
  const a = ability
  switch (a.kind) {
    case "aura-block":
      return `+${a.amount} Block to itself and adjacent allies.`
    case "heal":
      return `Heal itself or an adjacent ally for ${a.amount}.`
    case "burst":
      return `A x${a.multiplier} damage strike on an enemy in range.`
    case "dash":
      return `Leap up to ${a.range} tiles (ignores Zones) and strike an enemy for +${a.bonus}.`
    case "cleave":
      return "Strike an enemy; enemies next to it take half damage."
    case "poison-strike":
      return `Strike an enemy and poison it (+${a.amount}).`
    case "root-shot":
      return "Strike an enemy and Root it - it can't move next turn."
    case "push":
      return `Strike an enemy and knock it back 1 tile (+${a.bonus} damage if it's blocked).`
    case "taunt-shout":
      return `Taunt until your next turn and gain ${a.amount} Block.`
    case "shield-ally":
      return `Give itself or an adjacent ally a Ward and ${a.amount} Block.`
    case "rally":
      return `+${a.amount} Strength to itself and adjacent allies for the battle.`
    default:
      return ""
  }
}

export function abilityHint(ability) {
  if (!ability) return ""
  if (ability.kind === "heal") return "Choose an ally to heal."
  if (ability.kind === "shield-ally") return `Choose an ally to shield with ${ability.name}.`
  return `Choose an enemy for ${ability.name}.`
}
