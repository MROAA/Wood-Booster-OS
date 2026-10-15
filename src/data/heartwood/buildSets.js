// Hearthwood - BUILD SETS (between-fights build depth, Backpack Battles
// style). Relics and gear belong to families; owning 2 / 4 / 6 different
// pieces of one family turns on a growing bonus for the whole squad.
//
// As a player reads it:
// - Every set piece shows its family badge (shop, relic offers, bag).
// - The run panel shows each family you have started: "Wellspring 3/6".
// - Hitting 2, 4 or 6 pieces fires a banner and the bonus is live from
//   the next fight on.
//
// Pure data + pure helpers. A tier bonus can carry:
//   effects  - squad effects at the start of every fight (the same
//              channel run modifiers use - boons.js)
//   mana     - squad resource bonus in tactics fights, same keys as a
//              relic's `mana` field (pool / regen / onHit / startOvercharge)
//   essence  - extra Essence per won fight
//   camp     - extra camp actions per camp
// Counting: DIFFERENT pieces you own (relics held + gear in the bag or
// worn). A second copy of the same item does not count twice.

export const SET_TIERS = [2, 4, 6]

export const BUILD_SETS = {
  wellspring: {
    id: "wellspring",
    name: "Wellspring",
    icon: "cosmic",
    color: "#7fa8e0",
    blurb: "Mana that never runs dry.",
    relics: ["wellspring-stone", "mana-crystal", "brimming-chalice", "siphon-fang", "wellspring-compass", "echo-prism", "soul-lantern"],
    items: ["mana-draught", "deepwell-tonic", "mana-gem", "mana-heart", "wellspring-torc", "wellspring-staff", "overflow-chalice", "focus-lens"],
    tiers: {
      2: { text: "Every hero's resource pool +10.", mana: { pool: 10 } },
      4: { text: "Heroes regain +2 resource each turn.", mana: { regen: 2 } },
      6: { text: "Every fight starts Overcharged (+20).", mana: { startOvercharge: 20, pool: 10 } },
    },
  },
  emberkin: {
    id: "emberkin",
    name: "Emberkin",
    icon: "flame",
    color: "#d06a3a",
    blurb: "Hit hard, leave it burning.",
    relics: ["ember-core", "emberbrand", "emberveil-charm", "ashclaw-standard", "berserkers-oath", "reckless-oath"],
    items: ["ember-charm", "emberroot-talisman", "emberbrand-oil", "emberflow-oil", "pyre-edge", "ashclaw-fang", "crimson-shard", "rage-drum"],
    tiers: {
      2: { text: "Squad +1 Strength.", effects: [{ type: "applyBuff", id: "strength", amount: 1 }] },
      4: {
        text: "Your strikes leave a burn. Hits feed +2 resource.",
        effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } }],
        mana: { onHit: 2 },
      },
      6: { text: "Another +1 Strength.", effects: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    },
  },
  thornwall: {
    id: "thornwall",
    name: "Thornwall",
    icon: "stone",
    color: "#9a8c7a",
    blurb: "Bark, stone and spite.",
    relics: ["bramble-ward", "bark-ward", "bastion-of-stone", "wardens-bastion", "bulwark-standard", "stoneblood-totem", "quarry-vanguard", "aegis-ward"],
    items: ["twig-charm", "bark-plating", "thorned-bracer", "stonebound-charm", "bark-mail", "worldroot-mail", "ironbark-guard", "stoneskin-band", "thornhide-ward", "padded-vest", "buckler"],
    tiers: {
      2: { text: "Squad gains 2 Block every turn.", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
      4: { text: "Whoever strikes your heroes takes 2 back.", effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 2 } }] },
      6: { text: "Squad enters every fight warded once.", effects: [{ type: "applyBuff", id: "ward", amount: 1 }] },
    },
  },
  rotvenom: {
    id: "rotvenom",
    name: "Rot & Venom",
    icon: "leaf",
    color: "#7d9a3e",
    blurb: "Slow poison, sure ending.",
    relics: ["venomous-edge", "mycotic-bloom", "rootbound-curse", "cascading-wound", "witherspite-crown", "culling-strike", "vampiric-bloom"],
    items: ["venomed-fang", "bloodroot-fang", "hexroot-vial", "fungal-spore-sac", "witherspite-fang", "cascading-claw", "bloodfen-ring", "bloodletters-lancet", "herb-pouch"],
    tiers: {
      2: { text: "Squad finishes wounded enemies faster (Execute +1).", effects: [{ type: "applyBuff", id: "execute", amount: 1 }] },
      4: {
        text: "Your strikes poison.",
        effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } }],
      },
      6: { text: "Hits feed +3 resource. Execute +1 more.", effects: [{ type: "applyBuff", id: "execute", amount: 1 }], mana: { onHit: 3 } },
    },
  },
  galetide: {
    id: "galetide",
    name: "Gale & Tide",
    icon: "gale",
    color: "#79c6cf",
    blurb: "Never where they swing.",
    relics: ["frostbrand", "tides-embrace", "galeforce-banner", "windstep-standard", "tideworn-band", "stormgrove-charm", "spirits-veil"],
    items: ["chilling-grip", "windstep-charm", "tidewrack-vial", "tidestone-band", "galeheart-charm", "cyclone-edge", "glacier-fang", "frostbite-fang", "quickening-ring", "stormcaller-banner"],
    tiers: {
      2: { text: "Squad slips the first blow (Evade 1).", effects: [{ type: "applyBuff", id: "evade", amount: 1 }] },
      4: { text: "Squad mends 1 a turn and regains +1 resource.", effects: [{ type: "applyBuff", id: "regen", amount: 1 }], mana: { regen: 1 } },
      6: { text: "Evade +1 more. Fights start Overcharged (+10).", effects: [{ type: "applyBuff", id: "evade", amount: 1 }], mana: { startOvercharge: 10 } },
    },
  },
  hearthcoin: {
    id: "hearthcoin",
    name: "Hearth & Coin",
    icon: "spark",
    color: "#e0b04a",
    blurb: "A full purse and a warm camp.",
    relics: ["essence-well", "honest-scale", "marked-coin", "market-charter", "traders-compass", "artificers-ledger", "weathered-standard"],
    items: ["wanderers-ledger", "runebound-coffer", "lucky-charm", "fortune-rune", "wayfarers-talisman", "glowmoss-lantern", "watch-lantern"],
    tiers: {
      2: { text: "+25 Essence per won fight.", essence: 25 },
      4: { text: "+1 action at every camp.", camp: 1 },
      6: { text: "+50 more Essence per won fight.", essence: 50 },
    },
  },
}

export const SET_IDS = Object.keys(BUILD_SETS)

const RELIC_SET = new Map()
const ITEM_SET = new Map()
for (const set of Object.values(BUILD_SETS)) {
  for (const id of set.relics) RELIC_SET.set(id, set.id)
  for (const id of set.items) ITEM_SET.set(id, set.id)
}

// The set a relic / item belongs to, or null.
export function setOfRelic(id) {
  return RELIC_SET.get(id) || null
}
export function setOfItem(id) {
  return ITEM_SET.get(id) || null
}
export function setById(id) {
  return BUILD_SETS[id] || null
}
export function setSize(set) {
  return set.relics.length + set.items.length
}

// Different set pieces a run owns, per set: { setId: Set(pieceKey) }.
function ownedPieces(runState) {
  const out = {}
  const add = (setId, key) => {
    if (!setId) return
    if (!out[setId]) out[setId] = new Set()
    out[setId].add(key)
  }
  for (const id of runState?.relics || []) add(setOfRelic(id), `r:${id}`)
  for (const it of runState?.items || []) add(setOfItem(it.defId), `i:${it.defId}`)
  return out
}

// Highest tier reached for a count (0 = none).
export function tierFor(count) {
  let t = 0
  for (const n of SET_TIERS) if (count >= n) t = n
  return t
}

// Every set the run has started, with count / tier / next breakpoint.
// Sorted by count, biggest first.
export function setProgress(runState) {
  const owned = ownedPieces(runState)
  return Object.entries(owned)
    .map(([setId, pieces]) => {
      const set = BUILD_SETS[setId]
      const count = pieces.size
      const tier = tierFor(count)
      const next = SET_TIERS.find((n) => n > count) || null
      return { set, count, tier, next, size: setSize(set) }
    })
    .sort((a, b) => b.count - a.count || a.set.name.localeCompare(b.set.name))
}

// Every active tier bonus, in order: [{ set, tier, bonus }].
export function activeSetBonuses(runState) {
  const out = []
  for (const p of setProgress(runState)) {
    for (const n of SET_TIERS) if (p.count >= n) out.push({ set: p.set, tier: n, bonus: p.set.tiers[n] })
  }
  return out
}

// Squad effects for the start of a fight.
export function setBonusEffects(runState) {
  return activeSetBonuses(runState).flatMap((b) => b.bonus.effects || [])
}

// Mana bonus (relic `mana` keys) summed across active tiers.
export function setManaBonus(runState) {
  const out = { pool: 0, regen: 0, onHit: 0, startOvercharge: 0 }
  for (const b of activeSetBonuses(runState)) {
    for (const k of Object.keys(out)) out[k] += b.bonus.mana?.[k] || 0
  }
  return out
}

export function setEssenceBonus(runState) {
  return activeSetBonuses(runState).reduce((s, b) => s + (b.bonus.essence || 0), 0)
}

export function setCampBonus(runState) {
  return activeSetBonuses(runState).reduce((s, b) => s + (b.bonus.camp || 0), 0)
}

// "setId:tier" keys for every active tier - the UI compares this against
// runState.setTiersSeen to know when to celebrate.
export function activeSetTierKeys(runState) {
  return activeSetBonuses(runState).map((b) => `${b.set.id}:${b.tier}`)
}

// Sets the run has at least one piece of (shop "plan toward" hint).
export function startedSetIds(runState) {
  return setProgress(runState).map((p) => p.set.id)
}
