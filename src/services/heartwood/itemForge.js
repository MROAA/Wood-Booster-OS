// Hearthwood - DOTA DEPTH sprint, the run side: item tiers, build paths,
// forging (components + a recipe cost -> a bigger item), layered unlocks
// and the pre-fight counter read. Pure, state in -> state out, no
// runEngine import (runEngine imports this file) - callers pass the Act.
//
// Data: data/heartwood/itemBuilds.js (BUILD_RECIPES, BUILD_PATHS,
// COUNTER_KITS...). The older two-part gear recipes (recipes.js, fused by
// lining them up in a row) are part of the same tree: forgeable from the
// bag too, for free, at any Act.
import { ITEMS } from "../../data/heartwood/items"
import { RECIPES } from "../../data/heartwood/recipes"
import { UNITS } from "../../data/heartwood/units"
import { CLASSES } from "../../data/heartwood/classes"
import { BUILD_TIERS, BUILD_RECIPES, BUILD_PATHS, GROUP_BUILD_PATHS, COUNTER_KITS, COUNTER_TAGS } from "../../data/heartwood/itemBuilds"
import { heroClassId } from "./unitLevels"
import { collarClassFor, COMMANDER_KEY } from "./gear"

// --- tiers + unlocks ------------------------------------------------------------

export function buildTierOf(itemId) {
  return ITEMS[itemId]?.buildTier || 0
}

// The first Act an item can be bought (components) or forged (crafted /
// masterworks). Items outside the tree are always open.
export function unlockActOf(itemId) {
  const def = ITEMS[itemId]
  if (!def) return 99
  if (def.unlockAct) return def.unlockAct
  return BUILD_TIERS[def.buildTier]?.act || 1
}

export function itemUnlocked(itemId, act = 1) {
  return unlockActOf(itemId) <= act
}

// --- recipes --------------------------------------------------------------------

// Every recipe in one shape: { id, parts, cost, result, text, legacy }.
export function allRecipes() {
  const legacy = Object.values(RECIPES).map((r) => ({ id: r.id, parts: [r.a, r.b], cost: 0, result: r.result, text: r.text, legacy: true }))
  return [...legacy, ...Object.values(BUILD_RECIPES).map((r) => ({ ...r, cost: r.cost || 0 }))].filter((r) => ITEMS[r.result] && r.parts.every((p) => ITEMS[p]))
}

export function recipeById(id) {
  return allRecipes().find((r) => r.id === id) || null
}

// What makes this item (the recipe that results in it), or null.
export function madeFrom(itemId) {
  return allRecipes().find((r) => r.result === itemId) || null
}

// The recipes that use this item as a part.
export function buildsInto(itemId) {
  return allRecipes().filter((r) => r.parts.includes(itemId))
}

// "Wind Seed + Lucky Charm + 50 Essence".
export function recipePartsText(recipe) {
  if (!recipe) return ""
  return `${recipe.parts.map((p) => ITEMS[p]?.name || p).join(" + ")}${recipe.cost ? ` + ${recipe.cost} Essence` : ""}`
}

// Owned instances for a recipe's parts, preferring the owner's row, then
// the bag, then anyone else's row. null when a part is missing.
export function pickParts(runState, recipe, ownerKey = null) {
  const items = runState?.items || []
  const used = new Set()
  const out = []
  const rank = (it) => (ownerKey != null && it.equippedTo === ownerKey ? 0 : it.equippedTo == null ? 1 : 2)
  for (const part of recipe.parts) {
    const pick = items.filter((it) => it.defId === part && !used.has(it.key)).sort((a, b) => rank(a) - rank(b) || a.key - b.key)[0]
    if (!pick) return null
    used.add(pick.key)
    out.push(pick)
  }
  return out
}

export function missingParts(runState, recipe) {
  const items = [...(runState?.items || [])]
  const out = []
  for (const part of recipe.parts) {
    const i = items.findIndex((it) => it.defId === part)
    if (i === -1) out.push(part)
    else items.splice(i, 1)
  }
  return out
}

// Why this recipe can't be forged right now (plain English), or null.
export function forgeBlocker(runState, recipeId, act = 1) {
  const r = recipeById(recipeId)
  if (!r) return "Unknown recipe."
  if (!r.legacy && !itemUnlocked(r.result, act)) return `${BUILD_TIERS[buildTierOf(r.result)]?.name || "This item"} recipes open in Act ${unlockActOf(r.result)}.`
  const missing = missingParts(runState, r)
  if (missing.length) return `Missing: ${missing.map((p) => ITEMS[p]?.name || p).join(", ")}.`
  if ((runState.essence || 0) < r.cost) return `Needs ${r.cost} Essence.`
  return null
}

// Recipes the run can forge right now.
export function forgeOptions(runState, act = 1) {
  return allRecipes().filter((r) => !forgeBlocker(runState, r.id, act))
}

// Forge: every part is used up (worn or bagged), the recipe cost is paid,
// and the result lands in `ownerKey`'s row (in the slot of the first part
// it wore) or the bag.
export function forgeRecipe(runState, recipeId, act = 1, ownerKey = null) {
  if (forgeBlocker(runState, recipeId, act)) return runState
  const r = recipeById(recipeId)
  const parts = pickParts(runState, r, ownerKey)
  if (!parts) return runState
  const keys = new Set(parts.map((p) => p.key))
  const owner = ownerKey ?? parts.find((p) => p.equippedTo != null)?.equippedTo ?? null
  const inRow = parts.find((p) => p.equippedTo != null && p.equippedTo === owner)
  const key = runState.itemKeyCounter
  const found = runState.recipesFound || []
  const fresh = { key, defId: r.result, equippedTo: inRow ? owner : null, slotIndex: inRow ? inRow.slotIndex : null }
  return {
    ...runState,
    essence: (runState.essence || 0) - r.cost,
    items: (runState.items || []).filter((it) => !keys.has(it.key)).concat(fresh),
    itemKeyCounter: key + 1,
    recipesFound: found.includes(r.id) ? found : [...found, r.id],
    lastCombined: { recipeId: r.id, result: r.result, owner: fresh.equippedTo, key, forged: true },
  }
}

// --- build paths ----------------------------------------------------------------

// The class a run hero fights as (collar > natural), or null for the Commander.
export function ownerClassId(runState, ownerKey) {
  if (ownerKey === COMMANDER_KEY) return null
  const e = (runState?.bench || []).find((b) => b.key === ownerKey)
  if (!e) return null
  return collarClassFor(runState, ownerKey) || heroClassId(e)
}

// The 2-3 build paths this hero can pick (its class group's).
export function buildPathsFor(runState, ownerKey) {
  const cls = CLASSES[ownerClassId(runState, ownerKey)]
  const group = ownerKey === COMMANDER_KEY ? "commander" : cls?.group || "damage"
  return (GROUP_BUILD_PATHS[group] || GROUP_BUILD_PATHS.damage).map((id) => BUILD_PATHS[id]).filter(Boolean)
}

export function chosenBuildId(runState, ownerKey) {
  const id = (runState?.heroBuilds || {})[ownerKey]
  return buildPathsFor(runState, ownerKey).some((p) => p.id === id) ? id : null
}

export function chooseBuild(runState, ownerKey, pathId) {
  if (!buildPathsFor(runState, ownerKey).some((p) => p.id === pathId)) return runState
  const cur = runState.heroBuilds || {}
  const next = { ...cur }
  if (cur[ownerKey] === pathId) delete next[ownerKey]
  else next[ownerKey] = pathId
  return { ...runState, heroBuilds: next }
}

// Every component (shop-sold leaf) under an item, with repeats: the full
// shopping list for a goal item.
export function componentsOf(itemId, depth = 0) {
  const r = madeFrom(itemId)
  if (!r || depth > 4) return [itemId]
  return r.parts.flatMap((p) => componentsOf(p, depth + 1))
}

// A path step with what the run already has: { itemId, have, recipe, parts:
// [{ itemId, have }] }.
export function pathProgress(runState, path) {
  const owned = new Set((runState?.items || []).map((it) => it.defId))
  return path.items.map((itemId) => {
    const recipe = madeFrom(itemId)
    return { itemId, have: owned.has(itemId), recipe, parts: (recipe?.parts || []).map((p) => ({ itemId: p, have: owned.has(p) })) }
  })
}

// Shop highlighting: component id -> [{ ownerKey, name, pathName }] for
// every hero whose CHOSEN build still needs it (and doesn't own the goal).
export function wantedComponents(runState) {
  const out = new Map()
  const owned = (runState?.items || []).map((it) => it.defId)
  for (const [ownerKey, pathId] of Object.entries(runState?.heroBuilds || {})) {
    const path = BUILD_PATHS[pathId]
    if (!path || chosenBuildId(runState, ownerKey) !== pathId) continue
    const e = (runState.bench || []).find((b) => b.key === ownerKey)
    const name = ownerKey === COMMANDER_KEY ? "Commander" : e?.name || UNITS[e?.defId]?.name || "Hero"
    for (const goal of path.items) {
      if (owned.includes(goal)) continue
      const have = [...owned]
      for (const c of componentsOf(goal)) {
        const i = have.indexOf(c)
        if (i !== -1) {
          have.splice(i, 1)
          continue
        }
        const list = out.get(c) || []
        if (!list.some((w) => w.ownerKey === ownerKey)) list.push({ ownerKey, name, pathName: path.name })
        out.set(c, list)
      }
    }
  }
  return out
}

// --- counterplay ----------------------------------------------------------------

// The kit an enemy family brings at this Act (layered), or null.
export function counterKitFor(defId, act = 1) {
  const id = String(defId || "").replace(/\+$/, "")
  return Object.values(COUNTER_KITS).find((k) => k.act <= act && k.enemies.includes(id)) || null
}

// Pre-fight read for a list of enemy def ids: the kits in play and what to
// bring ({ kits: [{ kit, count }], bring: [tag] }).
export function counterReadFor(defIds = [], act = 1) {
  const counts = new Map()
  for (const id of defIds) {
    const kit = counterKitFor(id, act)
    if (kit) counts.set(kit.id, (counts.get(kit.id) || 0) + 1)
  }
  const kits = [...counts.entries()].map(([id, count]) => ({ kit: COUNTER_KITS[id], count }))
  const bring = [...new Set(kits.flatMap((k) => k.kit.answers.filter((a) => a !== "skills")))]
  return { kits, bring }
}

// "Bring: dispel, area damage".
export function bringText(bring) {
  return bring.length ? `Bring: ${bring.map((t) => COUNTER_TAGS[t]?.label || t).join(", ")}` : ""
}

// Answers the run's gear already carries (worn or bagged): Set of tag ids.
export function runAnswers(runState) {
  const out = new Set()
  for (const it of runState?.items || []) for (const t of ITEMS[it.defId]?.counters || []) out.add(t)
  return out
}
