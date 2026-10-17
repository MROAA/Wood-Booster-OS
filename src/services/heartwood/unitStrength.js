// Unit strength - a hero's attack and health as a share of the game's
// strong end, so a card can SHOW strength as bar length instead of asking
// the player to judge bare numbers (Marc: "yksikön vahvuus pitää näkyä
// selkeämmin ... en osaa lukea näitä hyvin").
//
// Purpose: one source for the strength bars on hero cards (UnitCard.jsx).
// Attack uses tacticsEngine's attackFromMovePattern - the very number the
// battle hits with - so the card and the fight can never disagree.
// Public API: unitStrength(def, entry?) -> { attack, health, maxHealth,
//   attackPct, healthPct, hurtPct }
// Example: unitStrength(UNITS["the-chariot"]) -> { attack: 14, health: 42, ... }

import { attackFromMovePattern } from "./tacticsEngine"

// A full bar = the strong end of the roster. Measured over all 298 heroes
// (2026-10-17): attack median 6, 90th pct 10, max 28; health median 54,
// 90th pct 81, max 105. Anything above the scale shows a full bar.
export const STRENGTH_SCALE = { attack: 12, health: 90 }

const pct = (value, full) => Math.max(0, Math.min(100, Math.round((value / full) * 100)))

export function unitStrength(def, entry = null) {
  const attack = attackFromMovePattern(def?.movePattern)
  const maxHealth = def?.maxHp || 0
  // a hurt hero carries HP between fights as a share (entry.hpPct, same
  // reading as runEngine's unitHpPct / UnitCard's curHp)
  const share = typeof entry?.hpPct === "number" ? Math.max(0, Math.min(1, entry.hpPct)) : 1
  const health = share < 1 ? Math.max(1, Math.round(maxHealth * share)) : maxHealth
  return {
    attack,
    health,
    maxHealth,
    attackPct: pct(attack, STRENGTH_SCALE.attack),
    healthPct: pct(maxHealth, STRENGTH_SCALE.health),
    hurtPct: Math.round(share * 100),
  }
}
