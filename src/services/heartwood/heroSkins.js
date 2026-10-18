// Hearthwood - which look each drawn hero wears (heroes.js skins).
// Saved in the meta store as `heroSkins: { unlocked: ["tommy:ember"],
// chosen: { tommy: "ember" } }` - additive, an older save just starts
// with every hero in their default look.
//
// The battle board needs the chosen look without HeartwoodBattle's meta
// being threaded through ten components, so this module also keeps the
// current choice in memory: HeartwoodBattle pushes it in with
// setActiveHeroSkins whenever meta changes, and chosenSkinOf reads it.

import { HEROES, HERO_SKIN_COST } from "../../data/heartwood/heroes"
import { loadMeta } from "./metaState"

export function normalizeHeroSkins(raw) {
  const unlocked = Array.isArray(raw?.unlocked) ? raw.unlocked.filter((k) => typeof k === "string") : []
  const chosen = {}
  for (const [heroId, skinId] of Object.entries(raw?.chosen || {})) {
    if (HEROES[heroId]?.skins[skinId] && (skinId === "default" || unlocked.includes(`${heroId}:${skinId}`))) chosen[heroId] = skinId
  }
  return { unlocked, chosen }
}

export function isSkinUnlocked(skins, heroId, skinId) {
  if (skinId === "default") return true
  return normalizeHeroSkins(skins).unlocked.includes(`${heroId}:${skinId}`)
}

// Pure: returns the next meta, or null when the purchase isn't possible.
export function unlockHeroSkin(meta, heroId, skinId) {
  const skin = HEROES[heroId]?.skins[skinId]
  if (!skin?.rare) return null
  const skins = normalizeHeroSkins(meta.heroSkins)
  if (skins.unlocked.includes(`${heroId}:${skinId}`)) return null
  if ((meta.acorns || 0) < HERO_SKIN_COST) return null
  return {
    ...meta,
    acorns: meta.acorns - HERO_SKIN_COST,
    heroSkins: { unlocked: [...skins.unlocked, `${heroId}:${skinId}`], chosen: { ...skins.chosen, [heroId]: skinId } },
  }
}

// Pure: wear an owned look (or "default"). Null when not owned.
export function chooseHeroSkin(meta, heroId, skinId) {
  if (!HEROES[heroId]?.skins[skinId]) return null
  const skins = normalizeHeroSkins(meta.heroSkins)
  if (!isSkinUnlocked(skins, heroId, skinId)) return null
  return { ...meta, heroSkins: { ...skins, chosen: { ...skins.chosen, [heroId]: skinId } } }
}

let active = null

export function setActiveHeroSkins(raw) {
  active = normalizeHeroSkins(raw)
}

export function chosenSkinOf(heroId) {
  if (!active) {
    try {
      active = normalizeHeroSkins(loadMeta().heroSkins)
    } catch {
      active = normalizeHeroSkins(null)
    }
  }
  return active.chosen[heroId] || "default"
}
