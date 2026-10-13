// Hearthwood - CLASS PROMOTIONS rules (pure). Data: data/heartwood/promotions.js.
// Purpose: turn a hero's promotion picks into its fight-start unit.
// Stored on a bench / hearth entry as `promoPicks: [promoId, ("master" | "cross")?]`
// (the Commander: runState.commanderPromo). Missing = not promoted.
// The level side (when a promotion is pending, the offers, the pick) lives
// in unitLevels.js; the skills themselves run in tacticsClasses.js.
// Public API: promotionOf, promoSkill, applyPromotionToTactics, promoTitle.
import { PROMOTIONS, promotionsFor } from "../../data/heartwood/promotions"

const arr = (v) => (Array.isArray(v) ? v : [])

// The chosen promotion def (or null) + its rank (1 / 2) + cross-trained path.
export function promotionOf(picks) {
  const p = PROMOTIONS[arr(picks)[0]]
  if (!p) return null
  const second = arr(picks)[1]
  const other = second === "cross" ? promotionsFor(p.base).find((x) => x.id !== p.id) || null : null
  return { promo: p, rank: second ? 2 : 1, mastered: second === "master", cross: other }
}

// "Paladin" / "Paladin II" (+ icon) for cards and tokens.
export function promoTitle(picks) {
  const o = promotionOf(picks)
  if (!o) return null
  return { id: o.promo.id, name: `${o.promo.name}${o.mastered ? " II" : ""}`, icon: o.promo.icon, rank: o.rank, tagline: o.promo.tagline, base: o.promo.base, cross: o.cross?.name || null }
}

// A promotion skill as a castable class skill. Its resource price is a %
// of the hero's own bar (`barMax`), and ALL-IN scales +1 per 1/5 of it.
export function promoSkill(promo, { mastered = false, barMax = 100 } = {}) {
  if (!promo?.skill) return null
  const sk = { ...promo.skill, ...(mastered ? promo.master?.patch || {} : {}) }
  const max = Math.max(1, barMax || 100)
  const mana = Math.max(1, Math.round((max * (sk.pct ?? 40)) / 100))
  const healing = sk.kind === "sanctuary" || (sk.kind === "zone" && !sk.damage)
  const allIn = sk.spend === "all" ? { per: Math.max(1, Math.round(max / 5)), [healing ? "heal" : "dmg"]: 1 } : undefined
  return {
    ...sk,
    classId: promo.base,
    promo: true,
    promoId: promo.id,
    mana,
    ...(allIn ? { allIn } : {}),
    ...(mastered ? { text: `${sk.text} (Mastered: ${promo.master?.text || ""})` } : {}),
  }
}

// Fold a promotion onto a built tactics unit (after mana + levels).
// `natural` = the hero's natural class id; while it fights as another
// class (a Class Collar) only the stat bump + the title carry over.
export function applyPromotionToTactics(u, picks, natural) {
  const o = promotionOf(picks)
  if (!o) return u
  const { promo, mastered, cross } = o
  const hp = promo.stats?.hp || 0
  const atk = promo.stats?.attack || 0
  let next = {
    ...u,
    maxHp: u.maxHp + hp,
    hp: u.hp + hp,
    attack: u.attack + atk,
    baseAttack: (u.baseAttack ?? u.attack) + atk,
    promoId: promo.id,
    promoName: `${promo.name}${mastered ? " II" : ""}`,
    promoIcon: promo.icon,
    promoRank: o.rank,
  }
  if (u.classId !== promo.base || natural !== promo.base) return { ...next, promoDormant: true }
  // Resource twist (only when the fight runs with resources).
  const tw = promo.twist || {}
  const mods = [...arr(next.extraMods)]
  if (typeof next.manaMax === "number" && !next.reagents) {
    if (tw.maxPct) {
      const add = Math.max(1, Math.round((next.manaMax * tw.maxPct) / 100))
      const wasFull = next.mana >= next.manaMax
      next = { ...next, manaMax: next.manaMax + add, mana: wasFull ? next.mana + add : next.mana }
    }
    if (tw.startPct) next = { ...next, mana: Math.max(0, Math.min(next.manaMax, next.mana + Math.round((next.manaMax * tw.startPct) / 100))) }
  }
  if (typeof next.manaMax === "number" && tw.regen) next = { ...next, manaRegenBonus: (next.manaRegenBonus || 0) + tw.regen }
  if (tw.bp) mods.push({ ...tw.bp, when: "resAt", label: tw.bp.name })
  if (promo.passive?.mods) mods.push({ ...promo.passive.mods, label: promo.passive.name })
  const barMax = typeof next.manaMax === "number" ? next.manaMax : null
  const skills = [promoSkill(promo, { mastered, barMax: barMax ?? 100 })]
  if (cross) skills.push(promoSkill(cross, { barMax: barMax ?? 100 }))
  return {
    ...next,
    extraMods: mods,
    promoPassive: promo.passive?.name || null,
    classSkills: [...arr(next.classSkills).filter((s) => !s.promo), ...skills.filter(Boolean)],
  }
}
