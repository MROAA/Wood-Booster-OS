// Hearthwood Trial - unit role & tag identity model. PRD "Unit Roles,
// Build System" sections 27-29 / 45: every unit resolves to a primary +
// secondary role, a tag set, one strength, one weakness, and a
// preferred position - the foundation the build-evaluation layer and
// the Act II enemy AI will read from.
//
// It is DERIVED from the signals each def already carries (its legacy
// `role` string, movePattern shape, passive ids, and the hook fields
// summon / aura / growth / chainDamage / rallyHeal / rallyAdjacent /
// conditionalPassive), with a small per-id override table for the
// cases the derivation gets wrong or Marc wants worded. Pure function
// of a def - no combat math reads it, nothing is written to runState.
// Placeholder-first: the override table grows over later rounds.

import { tribesOf } from "./synergies"

export const ROLES = {
  tank: { id: "tank", label: "Tank", icon: "shield", accent: "var(--hw-stone)", card: "power" },
  dps: { id: "dps", label: "DPS", icon: "sword", accent: "var(--hw-ember)", card: "attack" },
  healer: { id: "healer", label: "Healer", icon: "heart", accent: "var(--hw-moss)", card: "skill" },
  support: { id: "support", label: "Support", icon: "spark", accent: "var(--hw-tide)", card: "skill" },
  control: { id: "control", label: "Control", icon: "rune", accent: "var(--hw-rune)", card: "skill" },
  debuffer: { id: "debuffer", label: "Debuffer", icon: "root", accent: "var(--hw-curse)", card: "curse" },
  assassin: { id: "assassin", label: "Assassin", icon: "shadow", accent: "var(--hw-hp)", card: "attack" },
  summoner: { id: "summoner", label: "Summoner", icon: "wolf", accent: "var(--hw-cosmic)", card: "skill" },
  economy: { id: "economy", label: "Economy", icon: "cosmic", accent: "var(--hw-cosmic)", card: "skill" },
}

export const POSITIONS = { front: "front", center: "center", back: "back" }

// One strength / one weakness / a preferred position per role (label-
// length, the game's own rule). Overridable per unit below.
const ROLE_META = {
  tank: { position: "front", strengths: ["Holds the front line"], weaknesses: ["Little damage of its own"] },
  dps: { position: "back", strengths: ["Steady damage every round"], weaknesses: ["Thin - needs a wall in front"] },
  healer: { position: "back", strengths: ["Keeps the squad standing"], weaknesses: ["Almost no offence"] },
  support: { position: "center", strengths: ["Makes the units around it better"], weaknesses: ["Does little alone"] },
  control: { position: "center", strengths: ["Blunts the enemy's swings"], weaknesses: ["Weak in a raw trade"] },
  debuffer: { position: "center", strengths: ["Softens a target for your DPS"], weaknesses: ["Slow to matter solo"] },
  assassin: { position: "back", strengths: ["Finishes a wounded target"], weaknesses: ["Folds under focus fire"] },
  summoner: { position: "back", strengths: ["Brings extra bodies to the field"], weaknesses: ["Fragile if the summon falls"] },
  economy: { position: "back", strengths: ["Funds your run"], weaknesses: ["Carries little weight in the fight"] },
}

// Hand-authored overrides - the units the derivation mis-reads or that
// deserve worded identity. Any field present replaces the derived one.
export const ROLE_OVERRIDES = {
  "world-ash-elder": {
    primary: "dps", secondary: "support", position: "back",
    tags: ["scaling", "grove", "cosmic"],
    strengths: ["Unstoppable once a fight runs long"], weaknesses: ["Almost harmless in the opening rounds"],
  },
  "the-thorn-throne": {
    primary: "dps", secondary: "assassin", position: "back",
    tags: ["chain", "thorn", "mono-tribe"],
    strengths: ["Wrecking ball in a full Thorn board"], weaknesses: ["Ordinary without the Thorn count"],
  },
  "bulwark-of-ages": {
    primary: "tank", secondary: "support", position: "front",
    tags: ["shield", "aura", "warden", "stone"],
    strengths: ["Hardens whoever stands beside it"], weaknesses: ["Barely threatens anything"],
  },
  "deepwood-sovereign": {
    primary: "assassin", secondary: "dps", position: "front",
    tags: ["execute", "frontline", "fang", "shadow"],
    strengths: ["Breaks a lane from the front slot"], weaknesses: ["Wasted anywhere but the front"],
  },
  saplingward: { primary: "support", secondary: "dps", tags: ["scaling", "wood"] },
  emberbanner: { primary: "support", secondary: "dps", tags: ["aura", "ember", "thorn"] },
  "pack-elder": { primary: "dps", secondary: "assassin", tags: ["chain", "fang"] },
  "stonemoot-sentinel": { primary: "tank", position: "front", tags: ["shield", "stone", "warden"] },
  "grove-merchant": {
    primary: "economy", position: "back", tags: ["economy", "grove", "warden"],
    strengths: ["Shaves the price off every recruit"], weaknesses: ["A near-passenger in the fight"],
  },
  "acorn-banker": {
    primary: "economy", position: "back", tags: ["economy", "stone", "warden"],
    strengths: ["Your Essence starts earning interest sooner"], weaknesses: ["Turtles; barely threatens anything"],
  },
  "hollow-forager": {
    primary: "economy", position: "back", tags: ["economy", "wood", "fang"],
    strengths: ["Every win pays out more Essence"], weaknesses: ["Light in a real fight"],
  },
  "toll-warden": {
    primary: "economy", position: "back", tags: ["economy", "stone", "thorn"],
    strengths: ["Keeps a paid reroll from getting expensive"], weaknesses: ["Not built to trade blows"],
  },
  "the-fool": { primary: "healer", secondary: "support", tags: ["regen", "thorn"] },
  beastcaller: { primary: "summoner", position: "back", strengths: ["Opens the fight a body up"] },
  sapkeeper: { primary: "support", secondary: "healer", tags: ["aura", "regen", "grove"] },
  willowmend: { primary: "healer", secondary: "support", tags: ["regen", "grove"] },
  stoneknoll: { primary: "debuffer", secondary: "dps", tags: ["shatter", "stone"] },
  thornwisp: { primary: "debuffer", secondary: "dps", tags: ["poison", "root"] },
  quarrywarden: { primary: "tank", secondary: "support", tags: ["shield", "aura", "grove", "warden"] },
}

function movesOf(def, type) {
  return (def.movePattern || []).filter((m) => m.type === type)
}

// Every status id this unit puts ON AN ENEMY (movePattern debuff moves
// + passive addTrigger applyBuff/sunder with target "target").
function targetDebuffs(def) {
  const ids = new Set()
  for (const m of def.movePattern || []) {
    if ((m.type === "debuff" || m.type === "applyBuff") && m.id) ids.add(m.id)
  }
  for (const p of def.passive || []) {
    if (p.type === "addTrigger" && p.effect) {
      if (p.effect.type === "sunder") ids.add("sunder")
      if (p.effect.type === "applyBuff" && p.effect.target === "target" && p.effect.id) ids.add(p.effect.id)
    }
  }
  return ids
}

// Every status id this unit grants ITSELF (or an ally).
function friendlyBuffs(def) {
  const ids = new Set()
  for (const p of def.passive || []) {
    if (p.type === "applyBuff" && p.id) ids.add(p.id)
    if (p.type === "addTrigger" && p.effect?.type === "applyBuff" && p.effect.target !== "target" && p.effect.id) {
      ids.add(p.effect.id)
    }
  }
  if (def.rallyAdjacent?.id) ids.add(def.rallyAdjacent.id)
  if (def.aura?.effect?.id) ids.add(def.aura.effect.id)
  if (def.growth) ids.add("ascendant")
  return ids
}

function hasHealTrigger(def) {
  return (def.passive || []).some(
    (p) => p.type === "addTrigger" && p.effect?.type === "heal" && ["onHit", "onDealDamage"].includes(p.trigger),
  )
}

export function deriveProfile(def) {
  const legacy = def.role || "dps"
  const debuffs = targetDebuffs(def)
  const buffs = friendlyBuffs(def)
  const heals = movesOf(def, "heal").length > 0

  let primary
  if (def.summon) primary = "summoner"
  else if (legacy === "tank") primary = "tank"
  else if (heals && (legacy === "support" || def.rallyHeal)) primary = "healer"
  else if ([...debuffs].some((id) => ["stun", "slow", "dampen", "taunt", "silence"].includes(id))) primary = "control"
  else if ([...debuffs].some((id) => ["vulnerable", "sunder", "shatter", "weak"].includes(id))) primary = "debuffer"
  // Assassin = a real finisher: Execute, or Chain strong enough to be
  // the point of the unit (a chip-1/2 Chain stays a plain DPS).
  else if (buffs.has("execute") || (def.chainDamage || 0) >= 3) primary = "assassin"
  else if (legacy === "support") primary = "support"
  else primary = "dps"

  // Secondary - a lighter off-lean, or null.
  let secondary = null
  const blockTotal = movesOf(def, "block").reduce((s, m) => s + (m.amount || 0), 0)
  const attackTotal = movesOf(def, "attack").reduce((s, m) => s + (m.amount || 0), 0)
  if (legacy === "hybrid") {
    if (blockTotal >= attackTotal && blockTotal > 0) secondary = "tank"
    else if (heals) secondary = "healer"
    else if (def.rallyHeal || def.rallyAdjacent || def.aura) secondary = "support"
    else secondary = "support"
  } else if (primary !== "support" && (def.rallyAdjacent || def.aura || def.rallyHeal)) {
    secondary = "support"
  } else if (primary === "tank" && attackTotal >= blockTotal && attackTotal > 0) {
    secondary = "dps"
  } else if (primary === "support" && attackTotal > 0 && movesOf(def, "attack").length >= 2) {
    secondary = "dps"
  }
  if (secondary === primary) secondary = null

  // Tags - mechanic tags first, then tribes; capped by the renderer.
  const tags = []
  const add = (t) => {
    if (t && !tags.includes(t)) tags.push(t)
  }
  if (buffs.has("ward") || buffs.has("bulwark") || (movesOf(def, "block")[0]?.amount || 0) >= 5) add("shield")
  if (debuffs.has("poison") || buffs.has("poison") || def.sporeSpread) add("poison")
  if (debuffs.has("burn") || buffs.has("burn")) add("burn")
  if (buffs.has("regen") || def.rallyHeal) add("regen")
  if (def.attackPattern && def.attackPattern !== "single") add("aoe")
  if (def.growth || def.aura || buffs.has("ascendant")) add("scaling")
  if (def.summon) add("summon")
  if (def.aura || def.rallyAdjacent || def.rallyHeal) add("aura")
  if (buffs.has("execute")) add("execute")
  if (def.chainDamage) add("chain")
  if (hasHealTrigger(def)) add("lifelink")
  if (def.haste) add("haste")
  const meta = ROLE_META[primary]
  if (meta.position === "front") add("frontline")
  for (const t of tribesOf(def.id, def)) add(t)
  if (!tags.length) add("forest")

  return {
    primary,
    secondary,
    tags,
    strengths: [...meta.strengths],
    weaknesses: [...meta.weaknesses],
    position: meta.position,
  }
}

// The public resolver: override table wins field-by-field; a Hero-Bent
// role (items.js's effectiveRole) overrides the primary only.
export function unitProfile(def, bentRole) {
  if (!def) return null
  const derived = deriveProfile(def)
  const ov = ROLE_OVERRIDES[def.id] || {}
  const profile = {
    primary: ov.primary || derived.primary,
    secondary: ov.secondary !== undefined ? ov.secondary : derived.secondary,
    tags: ov.tags || derived.tags,
    strengths: ov.strengths || derived.strengths,
    weaknesses: ov.weaknesses || derived.weaknesses,
    position: ov.position || derived.position,
  }
  if (bentRole && ROLES[bentRole] && bentRole !== profile.primary) {
    profile.primary = bentRole
    if (profile.secondary === bentRole) profile.secondary = null
  }
  return profile
}

// --- Per-DPS target profiles (feat/hearthwood-dps-target-profiles) ---
// PRD "Strategic Combat System V2" 11-12. Which enemy a unit's own
// single-target attack goes for. `default` = the front rank (the
// pre-existing frontmost() behaviour - the vast majority of units). The
// engine's playerTarget() reads this; the card shows it under the role.
//
// v1 ships ONE non-default profile:
//  - executioner: the lowest-HP enemy (finish the wounded)
// It CONCENTRATES the squad's damage, so it's the one profile that
// landed inside the RUNS=100 gate. The others swung it hard across ~15
// pairs of tuning: `assassin -> back line` splits an offense squad's
// burst (tommy/fenrir up to -16 pp), and even a single common `breaker`
// unit gave the outlast Commander +16 pp (cracking the enemy tank is
// exactly what an attrition squad wants). Both are held for their own
// round - `assassin` needs a real screen-bypass mechanic + a damage
// trade-off. The table + playerTarget are the machinery; grow them one
// signature unit at a time behind the gate.
export const TARGET_PROFILES = ["default", "executioner"]

export const TARGET_PROFILE_LABEL = {
  executioner: "the lowest-HP enemy",
}

export const TARGET_PROFILE_OVERRIDES = {
  "deepwood-sovereign": "executioner", // Legendary; its front-row payoff is applyBuff execute - the fairness bot almost never fields it
  "the-thorn-throne": "default", // a full-board Thorn wrecker, pinned so it never drifts
}

export function unitTargetProfile(def, bentRole) {
  if (!def) return "default"
  void bentRole // accepted for the card; no bent case in the v1 table
  return TARGET_PROFILE_OVERRIDES[def.id] || "default"
}

// --- Positioning as a role mechanic (feat/hearthwood-positioning) ----
// PRD "Unit Roles, Build System" 20-21. The autobattler board is 3 back
// slots + 1 forward slot (autoBattleEngine.js's SLOT_POSITIONS: 0/1/2
// = row 2, slot 3 = row 1). So "position" is binary here: slot 3 is the
// front, slots 0-2 are the back. `front`-preferring units (tanks) want
// slot 3; `center` and `back` both want a back slot.
export function positionFitForSlot(unitPosition, slotIndex) {
  const wantsFront = unitPosition === "front"
  const slotIsFront = slotIndex === 3
  return wantsFront === slotIsFront ? "in" : "out"
}

// The one-stack battle-start bonus an IN-position unit gets, by primary
// role. Out-of-position units simply don't get it - no penalty (the
// PRD's cost without a punishing feel). Applied self-target at battle
// start, exactly like the Legendary conditionalPassive loop.
//
// v1: only the two roles the PRD leads with - Tank forward, Healer
// protected in back - and both bonuses are DEFENSIVE. A first pass that
// also buffed DPS / support / control / etc. ran tommy +15pp on the
// RUNS=100 gate (a near-free squad-wide stack, since the bot fills
// slots in recruit order so most units land in-position). Narrowing to
// tank + healer, with no `strength`, brought it back inside +-8pp. The
// positioning CUE (roles.js positionFitForSlot -> FormationScreen ring,
// build-score readout) still covers every role - only the mechanical
// buff is limited for now.
export const POSITION_BONUS = {
  tank: { id: "bulwark", amount: 1 }, // a wall belongs at the front
  healer: { id: "regen", amount: 1 }, // a protected mender keeps ticking
}
