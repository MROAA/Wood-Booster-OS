// Heartwood Trial - Dual-Class combinations (roadmap task 19, building on
// Guild Identity v1's 5 named Class identities - see units.js's
// `className` field, added in PR #332).
//
// Marc's own vision doc: a hero can gain a Secondary Class, and specific
// PAIRS form a new named identity (his own examples: "Ironbark+Gravebloom
// -> Death Guardian", "Beastcaller+Briarblade -> Predator",
// "Sapkeeper+Dreamweaver -> Dream Healer"). Gravebloom doesn't exist as a
// unit yet, so this pass uses only the 5 units Guild Identity v1 already
// named (ironbark, briarblade, sapkeeper, beastcaller, the-magician aka
// "Dreamweaver") - matching Marc's own "prove one small piece before
// expanding" precedent (see the decision log's Guild Identity v1 entry).
//
// Mechanism (task 4 of the brief): NOT a new Essence-spend button.
// SquadDraft.jsx already removed the per-unit direct-purchase Upgrade
// button on Marc's own explicit instruction ("Upgrade-nappi on turha...
// haluan RNG-elementin - unitti pitää löytää" - the Upgrade button is
// pointless, I want an RNG element, the unit needs to be FOUND) in favor
// of Fusion, which is entirely automatic once you own the right units.
// Dual-Class follows that same precedent instead of reintroducing the
// button Marc killed: own AND deploy both units of a defined pair
// together, and the combo triggers automatically, no purchase, no extra
// UI flow. This is genuinely simpler than an Essence sink, not a
// workaround - zero new economy, zero new UI beyond the card itself.
//
// Each combo's `grants` gives EACH partner a toned-down taste of the
// OTHER partner's own signature mechanic, reusing existing fields only
// (passive/chainDamage/rallyHeal/summon) - the exact "reuse the game's
// proven mechanic vocabulary" discipline every unit in units.js already
// follows, so this needed zero new engine machinery, just merging
// existing opts onto an existing def at the same point Upgrade already
// does (autoBattleEngine.js's per-round effective-def resolution).
export const DUAL_CLASSES = [
  {
    id: "deathguard",
    name: "Deathguard",
    pair: ["ironbark", "briarblade"],
    description:
      "Ironbark + Briarblade. Ironbark's own killing blow now Chains onto a second target (Briarblade's signature), and Briarblade holds enough Taunt to actually survive standing where Ironbark usually stands.",
    grants: {
      // Ironbark's base kit is pure Taunt/Block - a taste of Briarblade's
      // Chain (5 base) turns its heavy hits into real threat, not just a
      // wall.
      ironbark: { chainDamage: 4 },
      // Briarblade's base kit is a glass-cannon single hit + Chain - a
      // taste of Ironbark's Taunt (1 stack) means it can actually be
      // deployed up front instead of only ever hiding in the back row.
      briarblade: { passive: [{ type: "applyBuff", id: "taunt", amount: 1 }] },
    },
  },
  {
    id: "predator",
    name: "Predator",
    pair: ["beastcaller", "briarblade"],
    description:
      "Beastcaller + Briarblade. Beastcaller's pack learns to finish a kill (Chain, Briarblade's signature), and Briarblade earns its own Spirit Wolf (Beastcaller's summon) to hunt alongside it.",
    grants: {
      // Beastcaller's base kit is two plain attacks + a Spirit Wolf
      // summon - a taste of Briarblade's Chain rewards it for actually
      // landing a killing blow instead of just adding a body.
      beastcaller: { chainDamage: 4 },
      // Briarblade gains Beastcaller's exact summon field - a second
      // Spirit Wolf enters the fight alongside it, the same mechanism
      // Beastcaller itself uses (autoBattleEngine.js's summon loop,
      // startAutoBattle), reused verbatim rather than a new one.
      briarblade: { summon: { defId: "spirit-wolf" } },
    },
  },
  {
    id: "dream-healer",
    name: "Dream Healer",
    pair: ["sapkeeper", "the-magician"],
    description:
      "Sapkeeper + Dreamweaver. Sapkeeper's own attacks now weaken whoever they hit (Dreamweaver's curse), and Dreamweaver picks up Sapkeeper's rallyHeal, mending adjacent allies every round instead of only draining enemy strength.",
    grants: {
      // Sapkeeper's base kit heals/blocks/attacks with no on-hit effect -
      // a taste of Dreamweaver's Weak-on-hit curse turns its attack step
      // into real utility, not just filler between heals.
      sapkeeper: {
        passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }],
      },
      // Dreamweaver's base kit is block/attack + Weak-on-hit, no allied
      // support at all - a taste of Sapkeeper's rallyHeal (2) gives it a
      // real support role alongside its curse, matching "Dream Healer"
      // rather than just "a weaker Sapkeeper."
      "the-magician": { rallyHeal: 2 },
    },
  },

  // --- Round 2: 12 more pairs -----------------------------------------
  // Same discipline as the three above: each partner gets a toned-down
  // taste of the OTHER's signature, through passive / chainDamage /
  // rallyHeal / summon only (the fields applyDualClassGrant merges), no
  // new engine machinery. When a unit sits in more than one pair the
  // FIRST match in this array wins (findDualClassFor), so the more
  // iconic pairing is listed first.
  {
    id: "windblade",
    name: "Windblade",
    pair: ["swiftclaw", "stormwing"],
    description:
      "Swiftclaw + Galewing. Swiftclaw learns to ride the wind (Evade), and Galewing's strikes hit as hard as Swiftclaw's flurry (Strength).",
    grants: {
      swiftclaw: { passive: [{ type: "applyBuff", id: "evade", amount: 1 }] },
      stormwing: { passive: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    },
  },
  {
    id: "hexblade",
    name: "Hexblade",
    pair: ["hexmother", "briarblade"],
    description:
      "Hexweaver + Briarblade. Hexweaver's curses now carry through to a second target (Chain), and Briarblade's blade drips with the Hexweaver's poison.",
    grants: {
      hexmother: { chainDamage: 3 },
      briarblade: {
        passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } }],
      },
    },
  },
  {
    id: "frostwarden",
    name: "Frostwarden",
    pair: ["frostbind", "stoneheart"],
    description:
      "Frostbinder + Stonewarden. Frostbinder plants itself like a glacier (Taunt), and Stonewarden's blows lock a target in place (Stun on hit).",
    grants: {
      frostbind: { passive: [{ type: "applyBuff", id: "taunt", amount: 1 }] },
      stoneheart: {
        passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "stun", target: "target", amount: 1 } }],
      },
    },
  },
  {
    id: "soulwarden",
    name: "Soulwarden",
    pair: ["wraithcaller", "ironbark"],
    description:
      "Soulbinder + Ironbark. Soulbinder stands its ground (Taunt), and Ironbark refuses to fall (Revive), a wall that comes back once.",
    grants: {
      wraithcaller: { passive: [{ type: "applyBuff", id: "taunt", amount: 1 }] },
      ironbark: { passive: [{ type: "applyBuff", id: "revive", amount: 1 }] },
    },
  },
  {
    id: "bloomguard",
    name: "Bloomguard",
    pair: ["bloomcaller", "thornguard"],
    description:
      "Bloomcaller + Bulwark. Bloomcaller shrugs off a hit (Ward), and Bulwark mends the allies it shields (rallyHeal).",
    grants: {
      bloomcaller: { passive: [{ type: "applyBuff", id: "ward", amount: 1 }] },
      thornguard: { rallyHeal: 2 },
    },
  },
  {
    id: "stormcaller",
    name: "Stormcaller",
    pair: ["stormwing", "beastcaller"],
    description:
      "Galewing + Beastcaller. Galewing calls its own Spirit Wolf to the field, and Beastcaller's pack hits with a gale behind it (Strength).",
    grants: {
      stormwing: { summon: { defId: "spirit-wolf" } },
      beastcaller: { passive: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    },
  },
  {
    id: "venomancer",
    name: "Venomancer",
    pair: ["rootfang", "mycelist"],
    description:
      "Venomtongue + Sporelord. Venomtongue's poison spreads to a second enemy (Spore Spread), and Sporelord's spores rot the target's strength (Weak on hit).",
    grants: {
      rootfang: { passive: [{ type: "applyBuff", id: "sporeSpread", amount: 1 }] },
      mycelist: {
        passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }],
      },
    },
  },
  {
    id: "frostreaver",
    name: "Frostreaver",
    pair: ["rimefang", "grimtusk"],
    description:
      "Frostblade + Reaver. Frostblade's finisher Chains to a second target, and Reaver's hits leave the enemy striking feebly (Dampen on hit).",
    grants: {
      rimefang: { chainDamage: 3 },
      grimtusk: {
        passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } }],
      },
    },
  },
  {
    id: "umbralguard",
    name: "Umbralguard",
    pair: ["nightveil", "wraithguard"],
    description:
      "Umbramancer + Graveguard. Umbramancer finishes a wounded enemy far faster (Execute), and Graveguard shrugs off the first hit (Ward).",
    grants: {
      nightveil: { passive: [{ type: "applyBuff", id: "execute", amount: 2 }] },
      wraithguard: { passive: [{ type: "applyBuff", id: "ward", amount: 1 }] },
    },
  },
  {
    id: "purifiers-ward",
    name: "Purifier's Ward",
    pair: ["the-high-priestess", "the-emperor"],
    description:
      "Oracle + Crownguard. The Oracle raises a wall of bark each round (Block), and the Crownguard's presence burns off curses (Cleanse each round).",
    grants: {
      "the-high-priestess": { passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
      "the-emperor": { passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } }] },
    },
  },
  {
    id: "marksmans-mark",
    name: "Marksman's Mark",
    pair: ["trueshot", "duskclaw"],
    description:
      "Marksman + Nightblade. The Marksman's shot Chains to a second target, and the Nightblade learns to finish what the shot started (Execute).",
    grants: {
      trueshot: { chainDamage: 3 },
      duskclaw: { passive: [{ type: "applyBuff", id: "execute", amount: 1 }] },
    },
  },
  {
    id: "warbrand",
    name: "Warbrand",
    pair: ["forgehowl", "thornwarden"],
    description:
      "Berserker + Bruiser. The Berserker only gets angrier as it bleeds (Wounded Fury), and the Bruiser's swings carry through to a second enemy (Chain).",
    grants: {
      forgehowl: { passive: [{ type: "applyBuff", id: "woundedFury", amount: 1 }] },
      thornwarden: { chainDamage: 3 },
    },
  },
]

// A Tier 2 fusion (units.js's makeTier2) keeps its base unit's identity
// for Dual-Class purposes too, same "def.fusedFrom points back to the
// base id" precedent synergies.js's tribesOf already established - a
// fused "ironbark+" still pairs with Briarblade exactly like base
// Ironbark would.
function baseIdOf(defId, unitsById) {
  const def = unitsById[defId]
  return def?.fusedFrom || defId
}

// Returns the active DUAL_CLASSES entry for `defId`, given every defId
// currently DEPLOYED alongside it (not just owned on the bench) - same
// "deployed only" scope synergies.js's tribe synergy tracker already
// uses, since only deployed units actually fight together. If more than
// one combo could apply (a unit named in two different pairs, both
// partners deployed at once), the first match in DUAL_CLASSES wins -
// deterministic, and documented here rather than silently arbitrary.
export function findDualClassFor(defId, allDeployedDefIds, unitsById) {
  const baseId = baseIdOf(defId, unitsById)
  const otherBaseIds = allDeployedDefIds.map((id) => baseIdOf(id, unitsById))
  for (const dc of DUAL_CLASSES) {
    if (!dc.pair.includes(baseId)) continue
    const partner = dc.pair.find((id) => id !== baseId)
    if (otherBaseIds.includes(partner)) return dc
  }
  return null
}

// Merges one combo's grant for `defId` onto an already-resolved def
// (post-Upgrade, same layering order Upgrade/Fusion already use - see
// units.js's unitDefWithUpgrade). Additive on chainDamage/rallyHeal
// (stacks with whatever the base unit already had, never overwrites),
// appends to `passive` rather than replacing it, and only ever
// overwrites `summon` when the grant actually specifies one (units.js's
// own `opts.summon || null` default already means "no grant" -> "keep
// whatever the base def had," so this stays a strict layering, never a
// wipe of the unit's own base kit).
export function applyDualClassGrant(def, defId, dualClass, unitsById) {
  if (!dualClass) return def
  const grant = dualClass.grants[baseIdOf(defId, unitsById)]
  if (!grant) return def
  return {
    ...def,
    // Overwrites the single className (e.g. "Ironbark") with the combo's
    // name (e.g. "Deathguard") - UnitCard.jsx renders whichever is
    // present, so a dual-classed unit's card always shows the new
    // identity, not both stacked.
    className: dualClass.name,
    dualClassId: dualClass.id,
    dualClassDescription: dualClass.description,
    passive: grant.passive ? [...(def.passive || []), ...grant.passive] : def.passive,
    chainDamage: grant.chainDamage != null ? (def.chainDamage || 0) + grant.chainDamage : def.chainDamage,
    rallyHeal: grant.rallyHeal != null ? (def.rallyHeal || 0) + grant.rallyHeal : def.rallyHeal,
    summon: grant.summon || def.summon,
  }
}
