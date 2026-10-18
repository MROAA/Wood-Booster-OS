// Hearthwood - a carved rune reaching into a real tactics fight.
// Purpose: the rune the player carved on the Formation screen (runRunes.js)
// changes the fight it was carved for - its EFFECT and its COST, both
// visible on the board (banner, glyph marks on the units it touched,
// callouts). Data + numbers: data/heartwood/runes.js.
//
// Two hooks, because the two halves need different moments:
//   withRuneArrivals(battle, runeId) - adds the units a rune's cost brings
//     (Growth's extra beast, Echo's echo of your strongest hero). Call it
//     BEFORE the DifficultyEngine, like fate arrivals, so they get the
//     tier's AI + scaling.
//   applyRuneCarving(battle, runeId) - everything else (cover, healing,
//     mana, binds, shields). Call it LAST, after carried HP, gear and mana
//     are on the units, so nothing later overwrites it.
// Pure and deterministic. An unknown / empty rune id returns `battle`.
import { RUNES } from "../../data/heartwood/runes"
import { UNITS } from "../../data/heartwood/units"
import { deriveTacticsUnit, freeCellsNear, emit, isDeployTile } from "./tacticsEngine"
import { echoUnit } from "./tacticsFactions"
import { terrainAt } from "./tacticsTerrain"

const isHero = (u) => u.side === "player" && u.hp > 0 && !u.structure && !u.npc
const isFoe = (u) => u.side === "enemy" && u.hp > 0 && !u.structure && !u.npc
const power = (u) => (u.maxHp || 0) + (u.attack || 0) * 4
const strongest = (units) => units.reduce((best, u) => (!best || power(u) > power(best) ? u : best), null)
const weakest = (units) => units.reduce((best, u) => (!best || power(u) < power(best) ? u : best), null)
const mapUnits = (state, pred, fn) => ({ ...state, units: state.units.map((u) => (pred(u) ? fn(u) : u)) })
const log = (state, line) => ({ ...state, log: [...(state.log || []), line] })
const COMMANDER_ID = "player-commander"

// ---- arrivals (the costs that add a unit) -----------------------------------
export function withRuneArrivals(battle, runeId) {
  const rune = RUNES[runeId]
  if (!battle?.units || !rune) return battle
  if (runeId === "growth") {
    const beast = weakest(battle.units.filter(isFoe))
    const [pos] = beast ? freeCellsNear(battle, beast.pos, 1) : []
    if (!pos) return battle
    const extra = { ...beast, id: `rune-beast-${beast.defId}`, pos, hp: beast.maxHp, runeMark: rune.glyph, runeArrival: true }
    return log({ ...battle, units: [...battle.units, extra] }, `${rune.glyph} The Growth rune stirs the forest: another ${beast.name} comes out of the new brush.`)
  }
  if (runeId === "echo") {
    const hero = strongest(battle.units.filter((u) => isHero(u) && u.id !== COMMANDER_ID && UNITS[u.defId])) || battle.units.find((u) => u.id === COMMANDER_ID && UNITS[u.defId])
    const foe = battle.units.find(isFoe)
    const origin = foe?.pos || { row: Math.floor(battle.grid.rows / 2), col: 0 }
    const [pos] = hero ? freeCellsNear(battle, origin, 1) : []
    if (!pos) return battle
    const base = deriveTacticsUnit(hero.defId, "enemy", pos, `rune-echo-${hero.defId}`)
    const echo = { ...echoUnit({ ...base, name: hero.name }, { weaken: true }), facing: "E", runeMark: rune.glyph, runeArrival: true }
    return log({ ...battle, units: [...battle.units, echo] }, `${rune.glyph} The Echo rune wakes an old memory: ${echo.name} rises to fight you.`)
  }
  return battle
}

// ---- the rest of the effect + cost -------------------------------------------
// Up to `count` deploy tiles of open ground near the squad grow into brush.
function growBrush(state, count) {
  const { rows, cols } = state.grid
  const occupied = new Set(state.units.filter((u) => u.hp > 0).map((u) => `${u.pos.row}-${u.pos.col}`))
  const open = new Set(["path", "forest", "rubble", "stump", "ash"])
  const mid = Math.floor(rows / 2)
  const order = []
  for (let d = 0; d < rows; d++) for (const row of d === 0 ? [mid] : [mid - d, mid + d]) if (row >= 0 && row < rows) order.push(row)
  const terrain = { ...(state.terrain || {}) }
  const grown = []
  for (const col of [cols - 3, cols - 2, cols - 1]) {
    for (const row of order) {
      if (grown.length >= count) break
      const key = `${row}-${col}`
      if (occupied.has(key) || !open.has(terrainAt(state, { row, col })) || !isDeployTile(state, { row, col })) continue
      if (grown.some((g) => Math.abs(g.row - row) < 2 && g.col === col)) continue
      terrain[key] = "bush"
      grown.push({ row, col })
    }
  }
  return { ...state, terrain, runeBrush: grown }
}

const fillMana = (u) => (u.manaMax > 0 && !u.reagents ? { mana: u.manaMax } : {})
const emptyMana = (u) => (u.manaMax > 0 && !u.reagents ? { mana: 0, overcharge: 0 } : {})

export function applyRuneCarving(battle, runeId) {
  const rune = RUNES[runeId]
  if (!battle?.units || !rune) return battle
  const n = rune.numbers
  let s = { ...battle, rune: { id: rune.id, name: rune.name, glyph: rune.glyph, color: rune.color, effect: rune.effect, cost: rune.cost } }
  const commander = s.units.find((u) => u.id === COMMANDER_ID) || s.units.find(isHero)
  if (runeId === "growth") {
    s = growBrush(s, n.bushTiles)
    s = mapUnits(s, isHero, (u) => ({ ...u, hp: Math.min(u.maxHp, u.hp + Math.round(u.maxHp * n.healPct)) }))
    s = log(s, `${rune.glyph} Growth: brush grows around your squad (${s.runeBrush.length} tiles of cover) and your heroes mend.`)
  } else if (runeId === "echo") {
    s = mapUnits(s, isHero, (u) => ({ ...u, ...fillMana(u), ward: (u.ward || 0) + n.ward }))
    s = log(s, `${rune.glyph} Echo: your heroes remember old fights - full resource bars and +${n.ward} Ward.`)
  } else if (runeId === "bond") {
    const target = strongest(s.units.filter(isFoe))
    if (target) s = mapUnits(s, (u) => u.id === target.id, (u) => ({ ...u, stun: (u.stun || 0) + n.bindTurns, runeMark: rune.glyph }))
    if (commander) s = mapUnits(s, (u) => u.id === commander.id, (u) => ({ ...u, root: (u.root || 0) + n.rootTurns, runeMark: rune.glyph }))
    s = log(s, `${rune.glyph} Bond: ${target ? target.name : "the strongest foe"} is bound for ${n.bindTurns} turns - and so is ${commander ? commander.name : "your Commander"}, rooted in place.`)
  } else if (runeId === "shadow") {
    s = mapUnits(s, isFoe, (u) => {
      const maxHp = Math.round(u.maxHp * n.hpMult)
      return { ...u, stun: (u.stun || 0) + 1, maxHp, hp: Math.min(maxHp, Math.round(u.hp * n.hpMult)), runeMark: rune.glyph }
    })
    s = log(s, `${rune.glyph} Shadow: your squad is hidden - every enemy loses its first turn, but the woken shadows make them ${Math.round((n.hpMult - 1) * 100)}% tougher.`)
  } else if (runeId === "break") {
    s = mapUnits(s, isFoe, (u) => {
      const skillCd = { ...(u.skillCd || {}) }
      for (const sk of u.enemySkills || []) skillCd[sk.id] = Math.max(skillCd[sk.id] || 0, n.skillCd)
      return { ...u, shell: 0, ward: 0, regen: 0, skillCd, runeMark: rune.glyph }
    })
    s = mapUnits(s, isHero, (u) => ({ ...u, ...emptyMana(u) }))
    s = log(s, `${rune.glyph} Break: every enemy shield and ward shatters and their skills go cold - and your own heroes' power drains away with it.`)
  }
  if (commander) s = emit(s, { kind: "reaction", unitId: commander.id, label: `${rune.glyph} ${rune.name} carved!` })
  return s
}
