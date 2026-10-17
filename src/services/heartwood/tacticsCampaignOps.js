// Hearthwood Frontier - THE LONG CAMPAIGN's own fights (content sprint).
//
// Purpose: what a campaign mission adds to the tactics fight:
//   - mission OBJECTIVES: escort a Ley-Carrier, hold a Mana Well, hunt a
//     fleeing caster, free captives from cages, a night raid (limited
//     vision), a mana storm (colour shifts each turn), two fronts;
//   - CAMPAIGN ENEMY KITS (data/heartwood/campaignEnemies.js campKit):
//     Ley-Cutters, colour-attuned Cantors, Bulwarks, Pack Howl, Voidstep,
//     Ley Anchors;
//   - the CHAPTER BATTLEFIELD feature (one hand-shaped map per chapter);
//   - the Named Foe's intro line (the fight itself is tacticsBosses.js).
// Responsibilities: battle setup (applyCampaignOps before the difficulty
// tier, finishCampaignOps after mana), the engine hooks (chained through
// tacticsObjectives.js - the engine itself is untouched), the panel view.
// Every enemy-side mechanic runs in campaignOpsEnemyPhaseStart, inside the
// engine's shared enemyPhaseStart, so previewEnemyIntents stays an exact
// dry run. The QA hook (withLowEnemyHp sets depthQa) turns the enemy-side
// kits, the caster's escape and the night's darkness off.
// Dependencies: tacticsEngine helpers (call-time, circular like the other
// tactics modules), tacticsMana (gain/burn), tacticsManaColours (affinity),
// tacticsTerrain (template builder), campaign data files.
// Public API: applyCampaignOps, finishCampaignOps, campaignOpsVerdict,
// campaignOpsEnemyPhaseStart, campaignOpsBeforeNewTurn, campaignOpsNewTurn,
// describeCampaignOps, campaignOpsView, chapterTerrain, stormColourFor,
// campaignOpsResult, OPS_KINDS.
// Tests: .scratch/verify_campaign_content.mjs (ENGINE_ONLY=1).
import { emit, getUnit, setUnit, livingUnits, checkTacticsBattleEnd, deriveTacticsUnit, freeCellsNear } from "./tacticsEngine"
import { gainExternal, burnMana } from "./tacticsMana"
import { affinityOf } from "./tacticsManaColours"
import { TERRAIN, buildTemplateTerrain, sidesConnected } from "./tacticsTerrain"
import { streamRng } from "../../data/heartwood/seed"
import { ENEMIES } from "../../data/heartwood/enemies"
import { MISSION_BRIEFS, CHAPTER_FEATURES } from "../../data/heartwood/campaignContent"
import { MANA_COLOURS, COLOUR_IDS } from "../../data/heartwood/manaColours"

export const OPS_KINDS = ["escort", "well", "assassinate", "liberate", "night", "storm", "twofront", "warlord"]
export const CARRIER_ID = "player-npc-carrier"
export const WELL_ID = "player-npc-well"
export const CAGE_PREFIX = "player-npc-cage-"
export const ESCORT_STEPS = 2
export const ESCORT_MANA = 6
export const WELL_TURNS = 5
export const WELL_MANA = 8
export const WELL_RADIUS = 2
export const ESCAPE_TURN = 5
export const NIGHT_SIGHT = 2
export const STORM_MANA = 10
export const STORM_RAGE = 2
export const BACKLINE_TURN = 2

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const addLog = (s, line) => ({ ...s, log: [...(s.log || []), line] })
const heroesOf = (s) => livingUnits(s, "player").filter((u) => !u.npc && !u.structure)
const qaOn = (s) => !!s.depthQa
const ended = (s) => s.phase === "won" || s.phase === "lost"
const standable = (s, p) => p.row >= 0 && p.col >= 0 && p.row < s.grid.rows && p.col < s.grid.cols && (TERRAIN[s.terrain?.[`${p.row}-${p.col}`] || "path"]?.cost ?? 1) !== Infinity
const occupied = (s, p, ignore) => s.units.some((u) => u.hp > 0 && u.id !== ignore && u.pos.row === p.row && u.pos.col === p.col)
const freeNear = (s, p) => (standable(s, p) && !occupied(s, p) ? { ...p } : freeCellsNear(s, p, 1)[0] || null)

function npcUnit(s, kind, pos, id, name, art, maxHp, extra = {}) {
  const u = deriveTacticsUnit(kind, "player", pos, id, { name, art, maxHp })
  return { ...u, hp: maxHp, maxHp, move: 0, range: 0, attack: 0, baseAttack: 0, ap: 0, apMax: 0, npc: true, ...extra }
}

// ---------------------------------------------------------------------------
// Chapter battlefields
// ---------------------------------------------------------------------------
const between = (rng, a, b) => a + Math.floor(rng() * (b - a + 1))

const FEATURE_BUILDERS = {
  // Rings of old trees around sunken hollows (grass in the hollow).
  "root-hollows": (rng, grid, lo, hi, set, place) => {
    for (let i = 0; i < 3; i++) {
      const r = between(rng, 1, grid.rows - 2)
      const c = between(rng, lo + 1, hi - 1)
      set(r, c, "bush")
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (rng() < 0.6 && place) place(r + dr, c + dc, "tree")
    }
    set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "forest")
    set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  },
  // Mana Wells in tall grass.
  "gold-glade": (rng, grid, lo, hi, set) => {
    const wells = [[between(rng, 1, 3), between(rng, lo + 1, hi - 1)], [between(rng, 5, grid.rows - 2), between(rng, lo + 1, hi - 1)]]
    for (const [r, c] of wells) {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) set(r + dr, c + dc, "bush")
      set(r, c, "manawell")
    }
    set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  },
  // A cracked ley line down the field: poison where it bleeds, a well where it pools.
  "ley-fault": (rng, grid, lo, hi, set) => {
    let c = between(rng, lo + 1, hi - 1)
    const pool = between(rng, 2, grid.rows - 3)
    for (let r = 0; r < grid.rows; r++) {
      if (r === pool) set(r, c, "manawell")
      else if (rng() < 0.7) set(r, c, "poison")
      else set(r, c, "rubble")
      if (rng() < 0.3) c = Math.max(lo, Math.min(hi, c + (rng() < 0.5 ? -1 : 1)))
    }
    set(between(rng, 0, grid.rows - 1), lo, "high")
    set(between(rng, 0, grid.rows - 1), hi, "high")
  },
  // Quarry ledges, boulders and the miners' barrels.
  "ash-quarry": (rng, grid, lo, hi, set, place) => {
    for (let i = 0; i < 2; i++) {
      const r = between(rng, 0, grid.rows - 2)
      const c = between(rng, lo, hi - 1)
      set(r, c, "high")
      set(r + 1, c, "high")
      set(r, c + 1, "high")
    }
    set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "rock")
    if (place) {
      for (let i = 0; i < 2; i++) place(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "boulder")
      for (let i = 0; i < 2; i++) place(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "barrel")
    }
  },
  // Tiered steps of high ground behind broken barricades.
  "throne-steps": (rng, grid, lo, hi, set) => {
    const c = between(rng, lo + 1, hi - 2)
    for (let r = 1; r < grid.rows - 1; r++) {
      set(r, c, "high")
      if (r > 2 && r < grid.rows - 3) set(r, c + 1, "high")
    }
    const gap = between(rng, 2, grid.rows - 3)
    for (let r = 0; r < grid.rows; r++) if (r !== gap && r !== gap + 1 && rng() < 0.45) set(r, c - 1, rng() < 0.5 ? "wall" : "rubble")
  },
  // A mirrored field of ice and ice pillars.
  "echo-mirrors": (rng, grid, lo, hi, set, place) => {
    const half = Math.floor(grid.rows / 2)
    for (let i = 0; i < 4; i++) {
      const r = between(rng, 0, half - 1)
      const c = between(rng, lo, hi)
      set(r, c, "ice")
      set(grid.rows - 1 - r, c, "ice")
    }
    if (place) {
      const r = between(rng, 0, half - 1)
      const c = between(rng, lo, hi)
      place(r, c, "icepillar")
      place(grid.rows - 1 - r, c, "icepillar")
    }
  },
  // Smouldering ring of dead trees around one Mana Well.
  "last-hollow": (rng, grid, lo, hi, set, place) => {
    const r = Math.floor(grid.rows / 2)
    const c = between(rng, lo + 1, hi - 1)
    set(r, c, "manawell")
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) set(r + dr, c + dc, "ash")
    for (const [dr, dc] of [[-1, 0], [1, 0]]) set(r + dr, c + dc, "fire")
    if (place) {
      for (const [dr, dc] of [[-2, -1], [2, 1], [-2, 1], [2, -1]]) place(r + dr, c + dc, "tree")
    }
    set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "lava")
  },
}

// The chapter's own battlefield for a fight (pure: feature + seed). Falls
// back to `fallback` if the shape would cut the two sides apart.
export function chapterTerrain(featureId, seed, grid, fallback = {}) {
  const build = FEATURE_BUILDERS[featureId]
  if (!build) return fallback
  const rng = streamRng(seed >>> 0, "combat", `campaign-map:${featureId}`)
  const terrain = buildTemplateTerrain({ id: featureId, build }, rng, grid, 3, grid.cols - 4)
  return sidesConnected(terrain, grid) ? terrain : fallback
}

// ---------------------------------------------------------------------------
// The storm
// ---------------------------------------------------------------------------
export function stormOrder(seed) {
  const rng = streamRng(seed >>> 0, "combat", "campaign-storm")
  const order = [...COLOUR_IDS]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}
export function stormColourFor(state, turn = state?.turn || 1) {
  const order = state?.campaignOps?.storm?.order
  return order?.length ? order[(Math.max(1, turn) - 1) % order.length] : null
}

function stormTick(s0) {
  const colour = stormColourFor(s0)
  if (!colour) return s0
  let s = { ...s0, campaignOps: { ...s0.campaignOps, storm: { ...s0.campaignOps.storm, colour } } }
  // Heroes of the storm's colour drink deep, and its skills cost less (leyColours).
  for (const h of heroesOf(s)) {
    const base = Array.isArray(h.stormLeyBase) ? h.stormLeyBase : Array.isArray(h.leyColours) ? h.leyColours : []
    s = setUnit(s, h.id, { stormLeyBase: base, leyColours: [...new Set([...base, colour])] })
    if (affinityOf(h) === colour) s = gainExternal(s, h.id, STORM_MANA, "Storm")
  }
  // Attuned enemies of that colour rage.
  for (const e of livingUnits(s, "enemy")) {
    const want = !qaOn(s) && e.campKit?.colour === colour ? STORM_RAGE : 0
    const had = e.stormRage || 0
    if (want !== had) s = setUnit(s, e.id, { stormRage: want, attack: Math.max(0, (e.attack || 0) + want - had) })
    if (want && !had) s = emit(s, { kind: "reaction", unitId: e.id, label: "Storm-fed!" })
  }
  const c = MANA_COLOURS[colour]
  return addLog(s, `The mana storm turns ${c?.name || colour} ${c?.icon || ""}. ${c?.name} heroes drink deep; ${c?.name}-attuned foes rage.`)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Before the DifficultyEngine (so new pieces are scaled + get mana bars).
// `spec` = runState.campaignOps (campaignContentEngine.missionOpsSpec).
export function applyCampaignOps(battle, spec) {
  if (!battle?.units || !spec) return battle
  let s = battle
  const { rows, cols } = s.grid
  const mid = Math.floor(rows / 2)
  const act = spec.act || 1
  // The chapter's own battlefield.
  if (spec.feature && CHAPTER_FEATURES[spec.feature] && !s.boss) {
    s = { ...s, terrain: chapterTerrain(spec.feature, spec.seed || 0, s.grid, s.terrain || {}), wallHp: {}, objHp: {} }
  }
  // Campaign enemy kits + behaviour profiles.
  s = {
    ...s,
    units: s.units.map((u) => {
      const def = u.side === "enemy" ? ENEMIES[u.defId] : null
      if (!def?.campaign) return u
      return { ...u, ...(def.campKit ? { campKit: { ...def.campKit }, kitCount: 0, kitBonus: 0 } : {}), ...(def.behavior ? { behavior: def.behavior } : {}) }
    }),
  }
  const ops = { kind: OPS_KINDS.includes(spec.kind) ? spec.kind : null, chapter: spec.chapter || 1, title: spec.title || null, feature: spec.feature || null, leySevered: 0 }
  const lines = []
  if (ops.kind === "escort") {
    const pos = freeNear(s, { row: mid, col: cols - 4 })
    if (pos) {
      s = { ...s, units: [...s.units, npcUnit(s, "campaign-carrier", pos, CARRIER_ID, "Ley-Carrier", "spark", 16 + 3 * act, { escort: true })] }
      Object.assign(ops, { carrierId: CARRIER_ID, steps: 0 })
      lines.push("Objective: get the Ley-Carrier to the far treeline (column 1). It walks 2 tiles a turn unless an enemy pins it.")
    }
  } else if (ops.kind === "well") {
    const pos = freeNear(s, { row: mid, col: Math.floor(cols / 2) })
    if (pos) {
      s = { ...s, units: [...s.units, npcUnit(s, "campaign-well", pos, WELL_ID, "Mana Well", "tide", 22 + 4 * act, { manaWell: true })] }
      Object.assign(ops, { wellId: WELL_ID, turns: WELL_TURNS })
      lines.push(`Objective: hold the Mana Well for ${WELL_TURNS} turns. It feeds every hero within ${WELL_RADIUS} tiles.`)
    }
  } else if (ops.kind === "assassinate") {
    const foes = s.units.filter((u) => u.side === "enemy" && !u.structure && !u.weakPoint && !(s.boss && u.id === s.boss.unitId))
    const quarry = [...foes].sort((a, b) => (b.range || 1) - (a.range || 1) || a.maxHp - b.maxHp)[0]
    if (quarry) {
      const pos = freeNear(s, { row: quarry.pos.row, col: Math.floor(cols / 2) - 1 }) || quarry.pos
      s = setUnit(s, quarry.id, { pos, quarry: true, behavior: "caster" })
      Object.assign(ops, { quarryId: quarry.id, escapeTurn: ESCAPE_TURN })
      lines.push(`Objective: kill ${quarry.name} before it escapes at the end of turn ${ESCAPE_TURN}.`)
    }
  } else if (ops.kind === "liberate") {
    const cageIds = []
    for (const [i, want] of [{ row: 2, col: 3 }, { row: rows - 3, col: 3 }].entries()) {
      const pos = freeNear(s, want)
      if (!pos) continue
      const id = `${CAGE_PREFIX}${i}`
      s = { ...s, units: [...s.units, npcUnit(s, "campaign-cage", pos, id, "Rot Cage", "the-hanged-man", 10 + 2 * act, { cage: true })] }
      cageIds.push(id)
    }
    Object.assign(ops, { cageIds, freed: 0 })
    lines.push("Objective: start a turn next to a Rot Cage to free its captive. Every captive still alive at the end joins the Hearth.")
  } else if (ops.kind === "night") {
    s = { ...s, night: true, units: s.units.map((u) => (u.side === "enemy" && !u.structure ? { ...u, shroud: true } : u)) }
    lines.push(`Night raid: the enemy is hidden in the dark. Your heroes see ${NIGHT_SIGHT} tiles by torchlight.`)
  } else if (ops.kind === "storm") {
    ops.storm = { order: stormOrder(spec.seed || 0), colour: null }
    lines.push("A mana storm rolls in. Its colour shifts every turn.")
  } else if (ops.kind === "twofront") {
    lines.push(`Two fronts: half the enemy waits behind you, and comes out on turn ${BACKLINE_TURN}.`)
  } else if (ops.kind === "warlord") {
    const bossUnit = s.boss ? getUnit(s, s.boss.unitId) : null
    const intro = (bossUnit && ENEMIES[bossUnit.defId]?.introLine) || null
    Object.assign(ops, { warlordId: bossUnit?.defId || null, intro })
    if (intro) lines.push(`${bossUnit.name}: ${intro}`)
  }
  if (ops.feature) lines.push(`The field: ${CHAPTER_FEATURES[ops.feature].name}. ${CHAPTER_FEATURES[ops.feature].text}`)
  return { ...s, campaignOps: ops, log: [...(s.log || []), ...lines] }
}

// After mana + the difficulty tier: night sight, the storm's first colour,
// the two-front split (the hidden half keeps its scaled, mana-ready stats).
export function finishCampaignOps(battle) {
  const ops = battle?.campaignOps
  if (!ops) return battle
  let s = battle
  if (ops.kind === "night") s = { ...s, units: s.units.map((u) => (u.side === "player" && !u.npc ? { ...u, gearReveal: Math.max(u.gearReveal || 0, NIGHT_SIGHT) } : u)) }
  if (ops.kind === "storm") s = stormTick(s)
  if (ops.kind === "twofront") {
    const foes = s.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure && !u.weakPoint && !(s.boss && u.id === s.boss.unitId))
    const n = Math.floor(foes.length / 2)
    if (n > 0) {
      const back = foes.slice(-n)
      const { rows, cols } = s.grid
      const edgeRows = [1, rows - 2, Math.floor(rows / 2), 0, rows - 1]
      const tiles = back.map((_, i) => ({ row: edgeRows[i % edgeRows.length], col: cols - 1 }))
      const ids = new Set(back.map((u) => u.id))
      s = {
        ...s,
        units: s.units.filter((u) => !ids.has(u.id)),
        objective: {
          ...(s.objective || { type: "kill", act: 1 }),
          reinforcements: { turn: BACKLINE_TURN, tiles, templates: back.map((u) => ({ ...u, hp: u.maxHp })), arrived: false, backline: true },
        },
        campaignOps: { ...ops, backlineCount: n },
      }
    }
  }
  return s
}

// ---------------------------------------------------------------------------
// Engine hooks (chained by tacticsObjectives.js)
// ---------------------------------------------------------------------------

export function campaignOpsVerdict(state) {
  const ops = state.campaignOps
  if (!ops?.kind) return null
  if (ops.kind === "escort" && ops.carrierId) {
    const c = getUnit(state, ops.carrierId)
    if (!(c?.hp > 0)) return { phase: "lost", line: "The Ley-Carrier has fallen. Its lantern goes out, and the mission with it." }
    if (c.pos.col <= 1) return { phase: "won", line: "The Ley-Carrier reaches the treeline. The ley light is safe. Victory!" }
  }
  if (ops.kind === "well" && ops.wellId && !(getUnit(state, ops.wellId)?.hp > 0)) return { phase: "lost", line: "The Mana Well cracks and runs dry. The fight is lost." }
  if (ops.kind === "assassinate" && ops.quarryId && !(getUnit(state, ops.quarryId)?.hp > 0)) return { phase: "won", line: "The caster falls, its stolen ley spilling into the grass. The rest scatter. Victory!" }
  return null
}

function kitTick(s0, e) {
  let s = s0
  const kit = e.campKit
  const heroes = heroesOf(s)
  if (kit.id === "leycut") {
    if (heroes.some((h) => cheb(h.pos, e.pos) <= 1)) return s
    const count = (e.kitCount || 0) + 1
    if (count < (kit.every || 3)) return setUnit(s, e.id, { kitCount: count })
    s = setUnit(s, e.id, { kitCount: 0 })
    s = emit(s, { kind: "reaction", unitId: e.id, label: "Ley cut!" })
    for (const h of heroes) s = burnMana(s, h.id, kit.burn || 10).next
    s = { ...s, campaignOps: { ...s.campaignOps, leySevered: (s.campaignOps?.leySevered || 0) + 1 } }
    return addLog(s, `${e.name} drives its knife into the ley! Every hero loses ${kit.burn || 10} mana - and a ley line here will be cut after the fight.`)
  }
  if (kit.id === "resonate") {
    let hit = 0
    for (const h of heroes) {
      if (cheb(h.pos, e.pos) > (kit.range || 4) || affinityOf(h) !== kit.colour) continue
      const r = burnMana(s, h.id, kit.drain || 8)
      s = r.next
      if (r.burned > 0) hit++
    }
    if (!hit) return s
    const live = getUnit(s, e.id)
    const grow = (live.kitBonus || 0) < (kit.cap || 4) ? 1 : 0
    s = setUnit(s, e.id, { kitBonus: (live.kitBonus || 0) + grow, attack: (live.attack || 0) + grow })
    s = emit(s, { kind: "reaction", unitId: e.id, label: `Resonance ${MANA_COLOURS[kit.colour]?.icon || ""}` })
    return addLog(s, `${e.name} sings to the ${MANA_COLOURS[kit.colour]?.name || kit.colour} in ${hit} hero${hit > 1 ? "es" : ""} and drinks their mana${grow ? " (+1 attack)" : ""}.`)
  }
  if (kit.id === "bulwark") {
    const allies = livingUnits(s, "enemy").filter((u) => u.id !== e.id && !u.structure && cheb(u.pos, e.pos) <= 1)
    if (!allies.length) return s
    for (const a of allies) s = setUnit(s, a.id, { block: (getUnit(s, a.id).block || 0) + (kit.block || 4) })
    s = emit(s, { kind: "reaction", unitId: e.id, label: "Bulwark!" })
    return addLog(s, `${e.name} braces its neighbours: +${kit.block || 4} Block to ${allies.length}.`)
  }
  if (kit.id === "pack") {
    const want = livingUnits(s, "enemy").filter((u) => u.id !== e.id && u.campKit?.id === "pack").length
    const had = e.kitBonus || 0
    if (want === had) return s
    s = setUnit(s, e.id, { kitBonus: want, attack: Math.max(0, (e.attack || 0) + want - had) })
    return want > had ? emit(s, { kind: "reaction", unitId: e.id, label: "Howl!" }) : s
  }
  if (kit.id === "voidstep") {
    const count = (e.kitCount || 0) + 1
    s = setUnit(s, e.id, { kitCount: count })
    if (count % (kit.every || 2) !== 0 || !heroes.length) return s
    const target = [...heroes].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.hp - b.hp)[0]
    if (cheb(target.pos, e.pos) <= 1) return s
    const dest = freeCellsNear(s, target.pos, 8).find((p) => cheb(p, target.pos) <= 1)
    if (!dest) return s
    s = setUnit(s, e.id, { pos: dest })
    s = emit(s, { kind: "reaction", unitId: e.id, label: "Voidstep!" })
    return addLog(s, `${e.name} steps through the void to ${target.name}.`)
  }
  if (kit.id === "anchor") {
    let healed = 0
    for (const u of livingUnits(s, "enemy")) {
      if (u.id === e.id || u.structure || u.hp >= u.maxHp) continue
      const hp = Math.min(u.maxHp, u.hp + (kit.regen || 3))
      s = emit(setUnit(s, u.id, { hp }), { kind: "heal", targetId: u.id, amount: hp - u.hp })
      healed++
    }
    return healed ? addLog(s, `${e.name}'s chant knits ${healed} of its allies back together.`) : s
  }
  return s
}

// Top of the enemy phase (inside enemyPhaseStart: preview == real).
export function campaignOpsEnemyPhaseStart(state) {
  if (state.phase !== "enemy" || qaOn(state)) return state
  let s = state
  for (const e of livingUnits(state, "enemy")) {
    if (!e.campKit) continue
    const live = getUnit(s, e.id)
    if (!(live?.hp > 0)) continue
    s = kitTick(s, live)
    if (s.phase !== "enemy") return s
  }
  const ops = s.campaignOps
  if (ops?.kind === "assassinate" && ops.quarryId) {
    const q = getUnit(s, ops.quarryId)
    if (q?.hp > 0) {
      if (s.turn >= ops.escapeTurn) {
        s = emit(s, { kind: "reaction", unitId: q.id, label: "Escaped!" })
        return { ...s, phase: "lost", log: [...s.log, `${q.name} slips into the treeline with the stolen ley. The mission is lost.`] }
      }
      // It runs a tile toward the treeline (col 0).
      const step = [{ row: q.pos.row, col: q.pos.col - 1 }, { row: q.pos.row - 1, col: q.pos.col - 1 }, { row: q.pos.row + 1, col: q.pos.col - 1 }].find((p) => standable(s, p) && !occupied(s, p))
      if (step) s = setUnit(s, q.id, { pos: step })
    }
  }
  return checkTacticsBattleEnd(s)
}

// A new player turn, BEFORE the objective's own reinforcements: the two-front
// backline comes out at your back edge (beside its tile if a hero stands there).
export function campaignOpsBeforeNewTurn(state) {
  const reinf = state.objective?.reinforcements
  if (state.campaignOps?.kind !== "twofront" || !reinf?.backline || reinf.arrived || state.turn < reinf.turn) return state
  let s = { ...state, objective: { ...state.objective, reinforcements: { ...reinf, arrived: true } } }
  const names = []
  reinf.templates.forEach((tpl, i) => {
    const pos = freeNear(s, reinf.tiles[i])
    if (!pos) return
    const unit = { ...tpl, id: `enemy-${tpl.defId}-b${i}`, pos, facing: "W", ap: tpl.apMax, block: 0, ...(qaOn(s) ? { hp: 1 } : {}) }
    s = emit({ ...s, units: [...s.units, unit] }, { kind: "reaction", unitId: unit.id, label: "Behind you!" })
    names.push(unit.name)
  })
  return names.length ? addLog(s, `The second front breaks from the trees behind you: ${names.join(", ")}!`) : s
}

function escortWalk(s0) {
  let s = s0
  const ops = s.campaignOps
  let c = getUnit(s, ops.carrierId)
  if (!(c?.hp > 0)) return s
  // Lantern light: heroes beside it drink.
  for (const h of heroesOf(s)) if (cheb(h.pos, c.pos) <= 1) s = gainExternal(s, h.id, ESCORT_MANA, "Lantern")
  if (livingUnits(s, "enemy").some((e) => !e.structure && cheb(e.pos, c.pos) <= 1)) {
    s = emit(s, { kind: "reaction", unitId: c.id, label: "Pinned!" })
    return addLog(s, "The Ley-Carrier is pinned - an enemy blocks its road.")
  }
  let moved = 0
  for (let i = 0; i < ESCORT_STEPS && c.pos.col > 1; i++) {
    const opts = []
    for (const dr of [0, -1, 1]) {
      for (const dc of [-1, 0]) {
        if (!dr && !dc) continue
        const p = { row: c.pos.row + dr, col: c.pos.col + dc }
        if (standable(s, p) && !occupied(s, p, c.id)) opts.push(p)
      }
    }
    const mid = Math.floor(s.grid.rows / 2)
    opts.sort((a, b) => a.col - b.col || Math.abs(a.row - mid) - Math.abs(b.row - mid))
    if (!opts.length || opts[0].col >= c.pos.col) break
    s = setUnit(s, c.id, { pos: opts[0] })
    c = getUnit(s, c.id)
    moved++
  }
  s = { ...s, campaignOps: { ...s.campaignOps, steps: (ops.steps || 0) + moved } }
  return moved ? addLog(s, `The Ley-Carrier walks on (${Math.max(0, c.pos.col - 1)} column${c.pos.col - 1 === 1 ? "" : "s"} to go).`) : s
}

// A new player turn (after the base objective): escort, well, cages, storm.
export function campaignOpsNewTurn(state) {
  const ops = state.campaignOps
  if (!ops?.kind || state.phase !== "player") return state
  let s = state
  if (ops.kind === "escort") s = escortWalk(s)
  if (ops.kind === "well" && ops.wellId) {
    const w = getUnit(s, ops.wellId)
    if (w?.hp > 0) {
      if (s.turn > ops.turns) return { ...s, turn: ops.turns, phase: "won", log: [...s.log, `You held the Mana Well for ${ops.turns} turns. Victory!`] }
      for (const h of heroesOf(s)) if (cheb(h.pos, w.pos) <= WELL_RADIUS) s = gainExternal(s, h.id, WELL_MANA, "Well")
    }
  }
  if (ops.kind === "liberate") {
    let freed = s.campaignOps.freed || 0
    for (const id of ops.cageIds || []) {
      const cage = getUnit(s, id)
      if (!(cage?.hp > 0)) continue
      const hero = heroesOf(s).find((h) => cheb(h.pos, cage.pos) <= 1)
      if (!hero) continue
      s = { ...s, units: s.units.filter((u) => u.id !== id) }
      s = emit(s, { kind: "reaction", unitId: hero.id, label: "Captive freed!" })
      s = addLog(s, `${hero.name} breaks open a Rot Cage - the captive inside is free!`)
      freed++
    }
    s = { ...s, campaignOps: { ...s.campaignOps, freed } }
  }
  if (ops.kind === "storm") s = stormTick(s)
  if (ops.kind === "night" && qaOn(s)) s = { ...s, units: s.units.map((u) => (u.side === "enemy" && u.shroud ? { ...u, shroud: false } : u)) }
  return ended(s) ? s : checkTacticsBattleEnd(s)
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const KIND_TITLE = {
  escort: "Escort the Ley-Carrier",
  well: "Hold the Mana Well",
  assassinate: "Kill the fleeing caster",
  liberate: "Free the captives",
  night: "Night raid",
  storm: "Win in the mana storm",
  twofront: "Fight on two fronts",
  warlord: "Defeat the Named Foe",
}

// { type, title, detail, extra } for the objective panel (describeObjective).
export function describeCampaignOps(state) {
  const ops = state.campaignOps
  if (!ops?.kind) return null
  let detail = MISSION_BRIEFS[ops.kind]?.goal || ""
  let extra = null
  if (ops.kind === "escort") {
    const c = getUnit(state, ops.carrierId)
    detail = c?.hp > 0 ? `Carrier HP ${c.hp}/${c.maxHp} - ${Math.max(0, c.pos.col - 1)} column(s) to the treeline. It walks ${ESCORT_STEPS} a turn unless an enemy is next to it.` : "The carrier has fallen."
  } else if (ops.kind === "well") {
    const w = getUnit(state, ops.wellId)
    detail = `Turn ${Math.min(state.turn, ops.turns)} of ${ops.turns}. Well HP ${Math.max(0, w?.hp || 0)}/${w?.maxHp || 0} - heroes within ${WELL_RADIUS} gain +${WELL_MANA} mana each turn.`
  } else if (ops.kind === "assassinate") {
    const q = getUnit(state, ops.quarryId)
    const left = Math.max(0, ops.escapeTurn - state.turn)
    detail = q?.hp > 0 ? `${q.name}: HP ${q.hp}/${q.maxHp}. ${left === 0 ? "It escapes when you end this turn!" : `It escapes in ${left} turn(s).`}` : "The caster is dead."
  } else if (ops.kind === "liberate") {
    const alive = (ops.cageIds || []).filter((id) => getUnit(state, id)?.hp > 0).length
    detail = `Freed ${ops.freed || 0}. Cages still locked: ${alive}. Start a turn next to a cage to open it.`
  } else if (ops.kind === "night") {
    detail = `Hidden foes: you see ${NIGHT_SIGHT} tiles by torchlight. Close in to strike.`
  } else if (ops.kind === "storm") {
    const now = stormColourFor(state)
    const next = stormColourFor(state, state.turn + 1)
    detail = `Storm: ${MANA_COLOURS[now]?.icon || ""} ${MANA_COLOURS[now]?.name || "?"} - its heroes +${STORM_MANA} mana and cheaper skills; its attuned foes +${STORM_RAGE} attack.`
    extra = `Next turn: ${MANA_COLOURS[next]?.icon || ""} ${MANA_COLOURS[next]?.name || "?"}.`
  } else if (ops.kind === "twofront") {
    const reinf = state.objective?.reinforcements
    detail = reinf && !reinf.arrived ? `${reinf.templates.length} foe(s) wait behind you - they come out on turn ${reinf.turn}.` : "Both fronts are open. Clear the field."
  } else if (ops.kind === "warlord") {
    detail = "Defeat the champion. Break its weak points first - every hazard is marked a turn ahead."
  }
  return { type: `campaign-${ops.kind}`, title: KIND_TITLE[ops.kind], detail, extra }
}

// Everything the campaign fight panel shows (CampaignContentUi.jsx).
export function campaignOpsView(state) {
  const ops = state?.campaignOps
  if (!ops) return null
  const kits = []
  const seen = new Set()
  for (const u of livingUnits(state, "enemy")) {
    if (!u.campKit) continue
    const k = `${u.defId}`
    if (seen.has(k)) continue
    seen.add(k)
    const status =
      u.campKit.id === "leycut" ? `knife ${u.kitCount || 0}/${u.campKit.every || 3}` : u.campKit.id === "resonate" ? `+${u.kitBonus || 0} attack` : u.campKit.id === "pack" ? `+${u.kitBonus || 0} attack` : u.campKit.id === "voidstep" ? ((u.kitCount || 0) + 1) % (u.campKit.every || 2) === 0 ? "steps next turn" : "gathering" : null
    kits.push({ defId: u.defId, name: u.name, icon: u.campKit.icon, label: u.campKit.label, text: u.campKit.text, status, colour: u.campKit.colour || null })
  }
  const storm = ops.kind === "storm" ? { now: stormColourFor(state), next: stormColourFor(state, state.turn + 1) } : null
  return {
    kind: ops.kind,
    objective: describeCampaignOps(state),
    feature: ops.feature ? CHAPTER_FEATURES[ops.feature] : null,
    intro: ops.intro || null,
    kits,
    storm,
    leySevered: ops.leySevered || 0,
    freed: ops.freed || 0,
  }
}

// What the campaign reads back after the fight (campaignContentEngine).
export function campaignOpsResult(battle) {
  const ops = battle?.campaignOps
  if (!ops) return null
  const won = battle.phase === "won"
  const cagesAlive = (ops.cageIds || []).filter((id) => getUnit(battle, id)?.hp > 0).length
  return {
    kind: ops.kind,
    freed: ops.kind === "liberate" ? (ops.freed || 0) + (won ? cagesAlive : 0) : 0,
    leySevered: ops.leySevered || 0,
    shardsTaken: battle.units.filter((u) => u.side === "enemy" && u.campKit?.id === "shard" && u.hp <= 0).length,
    warlordId: ops.warlordId || null,
  }
}
