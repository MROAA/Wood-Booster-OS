// Hearthwood Frontier - epic boss fights (sprint 3). Every miniboss/boss
// (and the elite Ancients/Maw/Sentinel) gets a hand-authored arena and
// 2-4 HP-gated phases that change the fight: arena hazards (quakes,
// tiles collapsing into lava/water, walls rising), add waves, weak points
// that shield the boss while they stand, teleports and an enrage timer.
//
// Every arena mechanic is TELEGRAPHED one turn ahead: it is scheduled at
// the start of an enemy phase (state.boss.pending, due next turn), shown
// on the tiles + boss bar for the whole player turn, and resolved at the
// top of the next enemy phase - inside enemyPhaseStart, so
// previewEnemyIntents stays an exact dry-run. Pure + deterministic.
//
// Engine hooks: bossEnemyPhaseStart (resolve + schedule), bossImmuneHit
// (weak-point shield), bossAfterDamage (phase change / shield break),
// bossVerdict (boss down = victory), bossTilePenalty (AI avoids warnings).
import { emit, getUnit, setUnit, livingUnits, applyDamageWithBlock, checkTacticsBattleEnd, deriveTacticsUnit } from "./tacticsEngine"
import { TERRAIN, sidesConnected } from "./tacticsTerrain"
import { ENEMIES } from "../../data/heartwood/enemies"

// ---- arena helpers ----------------------------------------------------------
const CHAR_TERRAIN = { "#": "wall", "^": "high", "~": "water", "=": "bridge", "*": "bush", L: "lava", I: "ice", r: "rock", p: "poison", f: "forest", _: "rubble" }

// 9 strings of 12 chars -> terrain map ("." = plain path).
export function parseArena(rows) {
  const terrain = {}
  rows.forEach((line, r) => [...line].forEach((ch, c) => { if (CHAR_TERRAIN[ch]) terrain[`${r}-${c}`] = CHAR_TERRAIN[ch] }))
  return terrain
}
const P = (row, col) => ({ row, col })
const rowTiles = (row, c0, c1) => Array.from({ length: c1 - c0 + 1 }, (_, i) => P(row, c0 + i))
const colTiles = (col, r0, r1) => Array.from({ length: r1 - r0 + 1 }, (_, i) => P(r0 + i, col))

// ---- the boss table ---------------------------------------------------------
// Hazard spec kinds (the `cycle` of a phase rotates through them):
//   quake   { target: players|column|row|tiles, shape, amount }  - damage on marked tiles
//   terrain { to, waves | target, shape }                         - tiles change type
//   adds    { spawns: [{ defId, pos }] }                          - add wave at marked tiles
//   teleport{ options: [pos] }                                    - boss reappears at marked tile
// Phase `enter`: weakPoints [{ name, pos, hpPct }], enrageIn, enrageAmount, hazards (due next turn).
export const BOSS_FIGHTS = {
  deepwarden: {
    name: "Rootkeeper",
    title: "Warden of the Root Hall",
    bossDefId: "deepwarden",
    enemyDefIds: ["deepwarden"],
    bossStart: P(4, 1),
    arena: [
      "^^..#.......",
      "^^......#...",
      "....#....*..",
      "......*.....",
      "............",
      "......*.....",
      "....#....*..",
      "^^......#...",
      "^^..#.......",
    ],
    phases: [
      { name: "The Guardian Wakes", text: "Root spikes erupt under your units every few turns - keep moving.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Root Spikes", target: "players", shape: "single", max: 2, amount: 5 }] },
      { name: "Heartroots", atHpPct: 0.6, text: "Two Root Hearts shield the Rootkeeper - break them first. Roots rise to block lanes.",
        enter: { weakPoints: [{ name: "Root Heart", pos: P(0, 6), hpPct: 0.16 }, { name: "Root Heart", pos: P(8, 6), hpPct: 0.16 }] },
        every: 2,
        cycle: [
          { kind: "terrain", label: "Roots Rise", to: "wall", waves: [[P(2, 8), P(3, 8), P(5, 8), P(6, 8)], [P(1, 5), P(7, 5)]] },
          { kind: "quake", label: "Root Spikes", target: "players", shape: "cross", max: 2, amount: 5 },
        ] },
      { name: "The Deep Answers", atHpPct: 0.3, text: "The Hall splits open - a fissure tears down the column with most of your squad each turn. Enrages soon.",
        enter: { enrageIn: 3, enrageAmount: 2 }, every: 1,
        cycle: [{ kind: "quake", label: "Deep Fissure", target: "column", amount: 6 }] },
    ],
  },
  "the-gorging-maw": {
    name: "The Gorging Maw",
    title: "Glutton of the Feeding Pit",
    bossDefId: "the-gorging-maw",
    enemyDefIds: ["the-gorging-maw"],
    bossStart: P(4, 1),
    arena: [
      "..p.....~~..",
      "...p........",
      "..........*.",
      ".....pp.....",
      "............",
      ".....pp.....",
      "..........*.",
      "...p........",
      "..p.....~~..",
    ],
    phases: [
      { name: "Feeding Time", text: "Spore broods crawl out of the pit edges - thin them before they feed it.", every: 3, firstAt: 2,
        cycle: [{ kind: "adds", label: "Brood Spill", spawns: [{ defId: "sporelet", pos: P(0, 0) }, { defId: "sporelet", pos: P(8, 0) }] }] },
      { name: "Bloated", atHpPct: 0.5, text: "Two Gorge Sacs swell on the Maw - it can't be hurt until they burst. Bile sprays where you stand.",
        enter: { weakPoints: [{ name: "Gorge Sac", pos: P(2, 3), hpPct: 0.14 }, { name: "Gorge Sac", pos: P(6, 3), hpPct: 0.14 }] },
        every: 2,
        cycle: [
          { kind: "terrain", label: "Bile Spray", to: "poison", target: "players", shape: "cross", max: 2 },
          { kind: "adds", label: "Brood Spill", spawns: [{ defId: "sporelet", pos: P(4, 0) }] },
        ] },
    ],
  },
  "the-iron-sentinel": {
    name: "The Iron Sentinel",
    title: "Keeper of the Anvil Yard",
    bossDefId: "the-iron-sentinel",
    enemyDefIds: ["the-iron-sentinel"],
    bossStart: P(4, 1),
    arena: [
      "......#.....",
      "..^...#.....",
      "..^.........",
      "......#.....",
      "......_.....",
      "......#.....",
      "..^.........",
      "..^...#.....",
      "......#.....",
    ],
    phases: [
      { name: "The Hammer Rises", text: "An anvil drops on the unit with the most allies around it - spread out.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Anvil Drop", target: "players", shape: "3x3", max: 1, amount: 6 }] },
      { name: "Forge Heat", atHpPct: 0.5, text: "The yard melts from the edges inward. The Sentinel enrages soon - finish it.",
        enter: { enrageIn: 4, enrageAmount: 2 }, every: 2,
        cycle: [
          { kind: "terrain", label: "Molten Floor", to: "lava", waves: [[...rowTiles(0, 7, 11), ...rowTiles(8, 7, 11)], [...rowTiles(1, 8, 11), ...rowTiles(7, 8, 11)], [...colTiles(4, 0, 2), ...colTiles(4, 6, 8)]] },
          { kind: "quake", label: "Anvil Drop", target: "players", shape: "3x3", max: 1, amount: 6 },
        ] },
    ],
  },
  thornmaw: {
    name: "Heartwood Warden",
    title: "Thornmaw of the Bramble Court",
    bossDefId: "thornmaw",
    enemyDefIds: ["thornmaw"],
    bossStart: P(4, 1),
    arena: [
      "..*...*.....",
      "....*....*..",
      ".*.....*....",
      "....#.......",
      "..*.........",
      "....#.......",
      ".*.....*....",
      "....*....*..",
      "..*...*.....",
    ],
    phases: [
      { name: "The Court Gathers", text: "Thorn ticks creep in from the court's edge.", every: 3, firstAt: 2,
        cycle: [{ kind: "adds", label: "Thornbrood", spawns: [{ defId: "thorn-tick", pos: P(0, 3) }, { defId: "thorn-tick", pos: P(8, 3) }] }] },
      { name: "Thornwall", atHpPct: 0.66, text: "Thorn walls grow across the lanes - break through or go around.",
        every: 2,
        cycle: [
          { kind: "terrain", label: "Thornwall", to: "wall", waves: [[P(1, 7), P(2, 7), P(3, 7)], [P(5, 7), P(6, 7), P(7, 7)], [P(3, 9), P(5, 9)]] },
          { kind: "adds", label: "Thornbrood", spawns: [{ defId: "thorn-tick", pos: P(4, 0) }] },
        ] },
      { name: "Heartbloom", atHpPct: 0.33, text: "A Heartbloom shields the Warden, and it slips between the bushes. Burn the bloom!",
        enter: { weakPoints: [{ name: "Heartbloom", pos: P(0, 1), hpPct: 0.2 }] },
        every: 2,
        cycle: [
          { kind: "teleport", label: "Bramble Step", options: [P(1, 1), P(7, 1), P(4, 2), P(2, 6), P(6, 6)] },
          { kind: "quake", label: "Thorn Burst", target: "players", shape: "cross", max: 2, amount: 6 },
        ] },
    ],
  },
  "the-ancient-grove": {
    name: "Ancient Oak",
    title: "Heart of the Ancient Grove",
    bossDefId: "ancient-oak",
    enemyDefIds: ["sapling-attendant", "ancient-oak", "sapling-attendant"],
    bossStart: P(4, 0),
    arena: [
      "..f..~.f....",
      ".f...~..f...",
      "..f..=......",
      ".....~.*....",
      "..f..~......",
      ".....~.*....",
      "..f..=......",
      ".f...~..f...",
      "..f..~.f....",
    ],
    phases: [
      { name: "The Grove Stirs", text: "Old branches fall on your squad every few turns.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Falling Boughs", target: "players", shape: "single", max: 3, amount: 4 }] },
      { name: "Awakened Roots", atHpPct: 0.5, text: "Saplings sprout at the grove's edge and the river floods one crossing.",
        every: 2,
        cycle: [
          { kind: "adds", label: "Sprouting", spawns: [{ defId: "sapling-attendant", pos: P(0, 0) }, { defId: "sapling-attendant", pos: P(8, 0) }] },
          { kind: "terrain", label: "Flood", to: "water", waves: [[P(2, 5)]] },
          { kind: "quake", label: "Falling Boughs", target: "players", shape: "single", max: 3, amount: 5 },
        ] },
    ],
  },
  "the-elder-hollow": {
    name: "Elder Oak",
    title: "The One Who Counts",
    bossDefId: "elder-oak",
    enemyDefIds: ["sapling-attendant", "elder-oak", "sapling-attendant"],
    bossStart: P(4, 0),
    arena: [
      "...I....I...",
      "..^.....I...",
      "...II.......",
      "......#.....",
      "..^.........",
      "......#.....",
      "...II.......",
      "..^.....I...",
      "...I....I...",
    ],
    phases: [
      { name: "The Count Begins", text: "Frost creeps over the hollow floor - ice spreads toward you.", every: 2, firstAt: 2,
        cycle: [{ kind: "terrain", label: "Creeping Frost", to: "ice", target: "players", shape: "cross", max: 2 }] },
      { name: "The Last Count", atHpPct: 0.5, text: "A Hollow Heart shields the Elder. A frost wave rakes the row with most of your squad. It enrages soon.",
        enter: { weakPoints: [{ name: "Hollow Heart", pos: P(4, 3), hpPct: 0.14 }], enrageIn: 4, enrageAmount: 2 },
        every: 2,
        cycle: [{ kind: "quake", label: "Frost Wave", target: "row", amount: 6 }] },
    ],
  },
  wyrmgall: {
    name: "Veilbound",
    title: "Wyrmgall of the Drowned Span",
    bossDefId: "wyrmgall",
    enemyDefIds: ["wyrmgall"],
    bossStart: P(4, 1),
    arena: [
      "......~.....",
      "......=.....",
      "......~.....",
      ".*....~.....",
      "......=.....",
      ".*....~.....",
      "......~.....",
      "......=.....",
      "......~.....",
    ],
    phases: [
      { name: "The Span Holds", text: "Three bridges cross the river. The wyrm's tail sweeps a column of your squad.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Tail Sweep", target: "column", amount: 5 }] },
      { name: "Bridges Burn", atHpPct: 0.6, text: "The outer bridges collapse one by one - only the middle one lasts. The wyrm dives and resurfaces.",
        every: 2,
        cycle: [
          { kind: "terrain", label: "Bridge Collapse", to: "water", waves: [[P(1, 6)], [P(7, 6)]] },
          { kind: "teleport", label: "Wyrm Dive", options: [P(2, 7), P(6, 7), P(4, 5)] },
        ] },
      { name: "Veil Storm", atHpPct: 0.3, text: "The veil tears - storm strikes land around your units every turn. It enrages soon.",
        enter: { enrageIn: 3, enrageAmount: 2 }, every: 1,
        cycle: [{ kind: "quake", label: "Veil Storm", target: "players", shape: "3x3", max: 2, amount: 5 }] },
    ],
  },
  spacemonkey: {
    name: "The Hollow King",
    title: "Spacemonkey, on the Hollow Throne",
    bossDefId: "spacemonkey",
    enemyDefIds: ["spacemonkey"],
    bossStart: P(4, 1),
    arena: [
      "L.....#....L",
      "^^..........",
      "^^...*..#...",
      "L...........",
      "^^...#......",
      "L...........",
      "^^...*..#...",
      "^^..........",
      "L.....#....L",
    ],
    phases: [
      { name: "The Hollow Court", text: "A void lance sears the column with most of your squad; echoes answer his call.", every: 2, firstAt: 2,
        cycle: [
          { kind: "quake", label: "Void Lance", target: "column", amount: 7 },
          { kind: "adds", label: "Echo Spawn", spawns: [{ defId: "mire-gnat", pos: P(0, 1) }, { defId: "mire-gnat", pos: P(8, 1) }] },
        ] },
      { name: "Crown of Stars", atHpPct: 0.7, text: "Two Star Anchors make the King untouchable - shatter them. He blinks across the throne room.",
        enter: { weakPoints: [{ name: "Star Anchor", pos: P(1, 4), hpPct: 0.13 }, { name: "Star Anchor", pos: P(7, 4), hpPct: 0.13 }] },
        every: 2,
        cycle: [
          { kind: "teleport", label: "Hollow Step", options: [P(1, 0), P(7, 0), P(4, 3), P(2, 7), P(6, 7)] },
          { kind: "quake", label: "Star Fall", target: "players", shape: "cross", max: 3, amount: 6 },
        ] },
      { name: "The Hollow Collapses", atHpPct: 0.4, text: "The throne room falls into fire from the edges inward - the safe ground shrinks every turn. He enrages soon.",
        enter: { enrageIn: 4, enrageAmount: 3 }, every: 1,
        cycle: [
          { kind: "terrain", label: "Collapse", to: "lava", waves: [[...rowTiles(0, 0, 11), ...rowTiles(8, 0, 11)], [...rowTiles(1, 2, 11), ...rowTiles(7, 2, 11)], [...colTiles(11, 2, 6), ...colTiles(10, 2, 6)], [...colTiles(0, 2, 6)]] },
          { kind: "quake", label: "Void Lance", target: "column", amount: 7 },
        ] },
      { name: "Last Light", atHpPct: 0.15, text: "Last Light: he returns to the throne's heart and the void strikes around every one of you each turn. End it now!",
        enter: { hazards: [{ kind: "teleport", label: "Return to the Throne", options: [P(4, 3), P(4, 2), P(3, 3)] }] }, every: 1,
        cycle: [{ kind: "quake", label: "Void Nova", target: "players", shape: "ring", max: 4, amount: 5 }] },
    ],
  },
}

export const BOSS_IDS = Object.keys(BOSS_FIGHTS)

export function bossFightFor(encounterId) {
  return BOSS_FIGHTS[encounterId] || null
}

export function arenaTerrainFor(encounterId) {
  const fight = BOSS_FIGHTS[encounterId]
  return fight ? parseArena(fight.arena) : null
}

// ---- small board helpers ----------------------------------------------------
const key = (p) => `${p.row}-${p.col}`
const onBoard = (s, p) => p.row >= 0 && p.col >= 0 && p.row < s.grid.rows && p.col < s.grid.cols
const occupant = (s, p, ignoreId) => s.units.find((u) => u.hp > 0 && u.id !== ignoreId && u.pos.row === p.row && u.pos.col === p.col)
const standable = (s, p) => onBoard(s, p) && (TERRAIN[s.terrain?.[key(p)] || "path"] || TERRAIN.path).cost !== Infinity
const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))

// Nearest free, standable tile to `origin` (origin first), ring by ring.
function nearestFree(s, origin, ignoreId = null) {
  for (let d = 0; d <= Math.max(s.grid.rows, s.grid.cols); d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue
        const p = P(origin.row + dr, origin.col + dc)
        if (standable(s, p) && !occupant(s, p, ignoreId) && !TERRAIN[s.terrain?.[key(p)] || "path"].burn) return p
      }
    }
  }
  return null
}

const SHAPES = {
  single: [[0, 0]],
  cross: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]],
  ring: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  "3x3": [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
}

function squad(s) {
  return livingUnits(s, "player").filter((u) => !u.npc)
}

// Deterministic target picks. "players": the units with the most squad-mates
// within 1 tile first (tie: lowest HP, then board order).
function aimedTiles(s, spec) {
  const players = squad(s)
  if (!players.length) return []
  if (spec.target === "column" || spec.target === "row") {
    const axis = spec.target === "column" ? "col" : "row"
    const counts = new Map()
    for (const p of players) counts.set(p.pos[axis], (counts.get(p.pos[axis]) || 0) + 1)
    let best = null
    for (const [v, n] of counts) if (best === null || n > counts.get(best) || (n === counts.get(best) && v > best)) best = v
    return axis === "col" ? colTiles(best, 0, s.grid.rows - 1) : rowTiles(best, 0, s.grid.cols - 1)
  }
  const crowd = (u) => players.filter((o) => o.id !== u.id && cheb(o.pos, u.pos) <= 1).length
  const picked = [...players].sort((a, b) => crowd(b) - crowd(a) || a.hp - b.hp).slice(0, spec.max || 2)
  const tiles = []
  for (const u of picked) for (const [dr, dc] of SHAPES[spec.shape || "single"]) tiles.push(P(u.pos.row + dr, u.pos.col + dc))
  return tiles
}

function uniqueTiles(s, tiles) {
  const seen = new Set()
  return tiles.filter((p) => onBoard(s, p) && !seen.has(key(p)) && seen.add(key(p)))
}

// Builds one pending (telegraphed) hazard from a spec, or null.
function buildHazard(s, boss, spec, due) {
  const base = { kind: spec.kind, label: spec.label, due }
  if (spec.kind === "quake") {
    const tiles = uniqueTiles(s, spec.tiles || aimedTiles(s, spec))
    return tiles.length ? { ...base, tiles, amount: spec.amount } : null
  }
  if (spec.kind === "terrain") {
    let tiles
    let waveKey = null
    if (spec.waves) {
      const done = boss.waves?.[spec.label] || 0
      if (done >= spec.waves.length) return null
      tiles = spec.waves[done]
      waveKey = spec.label
    } else tiles = aimedTiles(s, spec)
    const bossUnit = getUnit(s, boss.unitId)
    tiles = uniqueTiles(s, tiles).filter((p) => (s.terrain?.[key(p)] || "path") !== spec.to && !(spec.to !== "lava" && bossUnit && bossUnit.pos.row === p.row && bossUnit.pos.col === p.col))
    return tiles.length || waveKey ? { ...base, tiles, to: spec.to, waveKey } : null
  }
  if (spec.kind === "adds") {
    const spawns = spec.spawns.filter((sp) => ENEMIES[sp.defId])
    return spawns.length ? { ...base, tiles: spawns.map((sp) => sp.pos), defIds: spawns.map((sp) => sp.defId) } : null
  }
  if (spec.kind === "teleport") {
    const bossUnit = getUnit(s, boss.unitId)
    if (!bossUnit || bossUnit.hp <= 0) return null
    const players = squad(s)
    const free = spec.options.filter((p) => standable(s, p) && !occupant(s, p, bossUnit.id))
    if (!free.length) return null
    // Farthest from your squad's nearest unit (first wins a tie).
    const far = (p) => Math.min(99, ...players.map((u) => cheb(u.pos, p)))
    const dest = free.reduce((best, p) => (far(p) > far(best) ? p : best), free[0])
    return { ...base, tiles: [dest] }
  }
  return null
}

// ---- setup ------------------------------------------------------------------
// Turns a freshly built battle into the boss fight: boss (and formation
// pieces) moved to their spots, state.boss attached. `battle.terrain`
// should already be the arena (see arenaTerrainFor).
export function applyBossFight(battle, encounterId) {
  const fight = BOSS_FIGHTS[encounterId]
  if (!battle || !fight) return battle
  const bossUnit = battle.units.find((u) => u.side === "enemy" && u.defId === fight.bossDefId)
  if (!bossUnit) return battle
  let s = battle
  // Park the boss on its throne tile; other pieces flank it.
  const start = standable(s, fight.bossStart) && !occupant(s, fight.bossStart, bossUnit.id) ? fight.bossStart : bossUnit.pos
  s = setUnit(s, bossUnit.id, { pos: { ...start } })
  const boss = {
    id: encounterId,
    name: fight.name,
    title: fight.title,
    unitId: bossUnit.id,
    phaseIndex: 0,
    phaseCount: fight.phases.length,
    thresholds: fight.phases.slice(1).map((ph) => ph.atHpPct),
    pending: [],
    nextAt: fight.phases[0].firstAt || 2,
    cycleIndex: 0,
    waves: {},
    weakPointIds: [],
    enrageTurn: null,
    enrageAmount: 0,
    enraged: 0,
    spawned: 0,
    qa: false,
  }
  return { ...s, boss, log: [...s.log, `${fight.name}, ${fight.title}. ${fight.phases[0].text}`] }
}

// ---- engine hooks -----------------------------------------------------------
function bossPhaseDef(state) {
  const fight = BOSS_FIGHTS[state.boss?.id]
  return fight?.phases[state.boss.phaseIndex] || null
}

function weakPointsAlive(state) {
  return (state.boss?.weakPointIds || []).filter((id) => getUnit(state, id)?.hp > 0)
}

// Weak-point shield: the boss takes nothing while one of them stands.
export function bossImmuneHit(state, targetId) {
  const boss = state.boss
  if (!boss || boss.qa || targetId !== boss.unitId || !weakPointsAlive(state).length) return null
  const unit = getUnit(state, targetId)
  let next = emit(state, { kind: "reaction", unitId: targetId, label: "Immune!" })
  next = { ...next, log: [...next.log, `${unit.name} is shielded - break the ${getUnit(state, boss.weakPointIds[0])?.name || "weak point"} first!`] }
  return { next, absorbed: 0, armourUsed: 0, remaining: 0, fell: false, revived: false }
}

// After any hit: the boss crossing a phase threshold, or a weak point falling.
export function bossAfterDamage(state, targetId) {
  const boss = state.boss
  if (!boss) return state
  if (boss.weakPointIds.includes(targetId)) {
    const wp = getUnit(state, targetId)
    if (wp && wp.hp <= 0 && !weakPointsAlive(state).length) {
      const next = emit(state, { kind: "reaction", unitId: boss.unitId, label: "Shield broken!" })
      return { ...next, log: [...next.log, `The last ${wp.name} shatters - ${getUnit(state, boss.unitId)?.name} is exposed!`] }
    }
    return state
  }
  if (targetId !== boss.unitId) return state
  let next = state
  const fight = BOSS_FIGHTS[boss.id]
  for (;;) {
    const unit = getUnit(next, boss.unitId)
    const phase = fight.phases[next.boss.phaseIndex + 1]
    if (!unit || unit.hp <= 0 || !phase || unit.hp / unit.maxHp > phase.atHpPct) break
    next = enterPhase(next, next.boss.phaseIndex + 1)
  }
  return next
}

function enterPhase(state, index) {
  const fight = BOSS_FIGHTS[state.boss.id]
  const phase = fight.phases[index]
  const bossUnit = getUnit(state, state.boss.unitId)
  const due = state.turn + 1
  let boss = { ...state.boss, phaseIndex: index, cycleIndex: 0, nextAt: due + (phase.enter?.hazards?.length ? 1 : 0), pending: state.boss.pending }
  let next = { ...state, boss }
  const enter = phase.enter || {}
  // Weak points spawn at once (nearest free tile to their spot).
  const wpIds = []
  for (const wp of enter.weakPoints || []) {
    const pos = nearestFree(next, wp.pos)
    if (!pos) continue
    const id = `enemy-weakpoint-${index}-${wpIds.length}`
    const hp = Math.max(8, Math.round(bossUnit.maxHp * wp.hpPct))
    const unit = deriveTacticsUnit("boss-weakpoint", "enemy", pos, id, { name: wp.name, art: "rune", maxHp: hp })
    next = { ...next, units: [...next.units, { ...unit, hp, maxHp: hp, move: 0, range: 0, attack: 0, baseAttack: 0, ap: 0, apMax: 0, structure: true, weakPoint: true }] }
    next = emit(next, { kind: "reaction", unitId: id, label: wp.name })
    wpIds.push(id)
  }
  if (wpIds.length) boss = { ...next.boss, weakPointIds: [...next.boss.weakPointIds, ...wpIds] }
  else boss = next.boss
  if (enter.enrageIn) boss = { ...boss, enrageTurn: state.turn + enter.enrageIn, enrageAmount: enter.enrageAmount || 2 }
  const extra = (enter.hazards || []).map((spec) => buildHazard(next, boss, spec, due)).filter(Boolean)
  boss = { ...boss, pending: [...boss.pending, ...extra] }
  next = { ...next, boss }
  next = emit(next, { kind: "bossPhase", unitId: boss.unitId, index, name: phase.name })
  return { ...next, log: [...next.log, `${fight.name} - Phase ${index + 1}: ${phase.name}! ${phase.text}`] }
}

// Top of the enemy phase: resolve what is due now, enrage, then telegraph
// the next hazard (due next turn) so the player sees it all turn long.
export function bossEnemyPhaseStart(state) {
  if (!state.boss || state.phase !== "enemy") return state
  const boss = state.boss
  const bossUnit = getUnit(state, boss.unitId)
  if (!bossUnit || bossUnit.hp <= 0) return state
  let next = state
  if (!boss.qa) {
    const due = boss.pending.filter((h) => h.due <= state.turn)
    next = { ...next, boss: { ...boss, pending: boss.pending.filter((h) => h.due > state.turn) } }
    for (const h of due) {
      next = resolveHazard(next, h)
      if (next.phase !== "enemy") return next
    }
    next = checkTacticsBattleEnd(next)
    if (next.phase !== "enemy") return next
  }
  // Enrage: +N attack every turn once the timer runs out.
  const b = next.boss
  if (b.enrageTurn != null && state.turn >= b.enrageTurn && !b.qa) {
    const u = getUnit(next, b.unitId)
    next = setUnit(next, b.unitId, { attack: u.attack + b.enrageAmount })
    next = emit({ ...next, boss: { ...next.boss, enraged: next.boss.enraged + 1 } }, { kind: "reaction", unitId: b.unitId, label: "Enraged!" })
    next = { ...next, log: [...next.log, `${u.name} is enraged: +${b.enrageAmount} attack (now ${u.attack + b.enrageAmount}).`] }
  }
  return scheduleNext(next)
}

function scheduleNext(state) {
  const boss = state.boss
  if (boss.qa) return state
  const phase = bossPhaseDef(state)
  const due = state.turn + 1
  if (!phase?.cycle?.length || boss.nextAt > due) return state
  // Skip specs that have nothing to do (exhausted waves), at most one lap.
  for (let i = 0; i < phase.cycle.length; i++) {
    const spec = phase.cycle[(boss.cycleIndex + i) % phase.cycle.length]
    const hazard = buildHazard(state, boss, spec, due)
    if (!hazard) continue
    return { ...state, boss: { ...boss, pending: [...boss.pending, hazard], cycleIndex: boss.cycleIndex + i + 1, nextAt: due + (phase.every || 2) } }
  }
  return { ...state, boss: { ...boss, nextAt: due + (phase.every || 2) } }
}

function resolveHazard(state, h) {
  let next = state
  const bossUnit = getUnit(state, state.boss.unitId)
  const tag = (label) => emit(next, { kind: "reaction", unitId: bossUnit.id, label })
  if (h.kind === "quake") {
    next = emit(tag(`${h.label}!`), { kind: "aoe", actorId: bossUnit.id })
    next = { ...next, log: [...next.log, `${h.label}! The marked tiles erupt for ${h.amount}.`], bossFlash: { seq: next.eventSeq, tiles: h.tiles, kind: "quake" } }
    for (const p of h.tiles) {
      const victim = occupant(next, p)
      if (!victim || victim.side !== "player") continue
      next = applyDamageWithBlock(next, victim.id, h.amount).next
    }
    return checkTacticsBattleEnd(next)
  }
  if (h.kind === "terrain") {
    let terrain = { ...(next.terrain || {}) }
    const wallHp = { ...(next.wallHp || {}) }
    const changed = []
    for (const p of h.tiles) {
      const k = key(p)
      const prev = terrain[k]
      terrain[k] = h.to
      // Never cut the arena in two: blocking tiles that would are skipped.
      if (TERRAIN[h.to].cost === Infinity && !sidesConnected(terrain, next.grid)) {
        if (prev) terrain[k] = prev
        else delete terrain[k]
        continue
      }
      if (h.to === "wall") delete wallHp[k]
      changed.push(p)
    }
    next = { ...next, terrain, wallHp, bossFlash: { seq: (next.eventSeq || 0) + 1, tiles: changed, kind: h.to } }
    if (h.waveKey) next = { ...next, boss: { ...next.boss, waves: { ...next.boss.waves, [h.waveKey]: (next.boss.waves[h.waveKey] || 0) + 1 } } }
    next = tag(`${h.label}!`)
    next = { ...next, log: [...next.log, `${h.label}! ${changed.length} tile(s) turn to ${h.to}.`] }
    // Anyone caught on a tile that can't be stood on is thrown clear.
    if (TERRAIN[h.to].cost === Infinity) {
      for (const p of changed) {
        const u = occupant(next, p)
        if (!u) continue
        const dest = nearestFree(next, p, u.id)
        if (!dest) continue
        next = setUnit(next, u.id, { pos: dest })
        next = emit({ ...next, log: [...next.log, `${u.name} is thrown clear.`] }, { kind: "reaction", unitId: u.id, label: "Thrown clear!" })
        if (u.side === "player" && h.to === "water") next = applyDamageWithBlock(next, u.id, 3).next
      }
    }
    return checkTacticsBattleEnd(next)
  }
  if (h.kind === "adds") {
    const names = []
    h.tiles.forEach((want, i) => {
      if (livingUnits(next, "enemy").length >= 9) return
      const pos = occupant(next, want) || !standable(next, want) ? nearestFree(next, want) : want
      if (!pos) return
      const id = `enemy-${h.defIds[i]}-boss${next.boss.spawned}`
      const unit = deriveTacticsUnit(h.defIds[i], "enemy", pos, id)
      next = { ...next, units: [...next.units, { ...unit, baseAttack: unit.attack, facing: "E" }], boss: { ...next.boss, spawned: next.boss.spawned + 1 } }
      next = emit(next, { kind: "reaction", unitId: id, label: "Arrives!" })
      names.push(unit.name)
    })
    if (names.length) next = { ...next, log: [...next.log, `${h.label}: ${names.join(", ")} join the fight!`] }
    return next
  }
  if (h.kind === "teleport") {
    const dest = occupant(next, h.tiles[0], bossUnit.id) || !standable(next, h.tiles[0]) ? nearestFree(next, h.tiles[0], bossUnit.id) : h.tiles[0]
    if (!dest) return next
    next = setUnit(next, bossUnit.id, { pos: { ...dest } })
    next = emit({ ...next, log: [...next.log, `${h.label}! ${bossUnit.name} vanishes and reappears.`] }, { kind: "reaction", unitId: bossUnit.id, label: `${h.label}!` })
    return next
  }
  return next
}

// Boss down = victory, whatever adds or weak points remain.
export function bossVerdict(state) {
  const boss = state.boss
  if (!boss) return null
  const unit = getUnit(state, boss.unitId)
  if (unit && unit.hp <= 0) return { phase: "won", line: `${boss.name} falls! Victory.` }
  return null
}

// AI: stepping onto a tile about to become wall/water/lava is a bad idea.
export function bossTilePenalty(state, pos) {
  const pending = state.boss?.pending
  if (!pending?.length) return 0
  return pending.some((h) => h.kind === "terrain" && h.tiles.some((t) => t.row === pos.row && t.col === pos.col)) ? 40 : 0
}

// QA hook companion (withLowEnemyHp): arena mechanics + shield off.
export function bossQa(state) {
  return state.boss ? { ...state, boss: { ...state.boss, qa: true, pending: [] } } : state
}

// ---- UI helpers -------------------------------------------------------------
const HAZARD_TEXT = {
  quake: (h) => `marked tiles take ${h.amount} damage`,
  terrain: (h) => `marked tiles become ${h.to}`,
  adds: (h) => `${h.tiles.length} add${h.tiles.length === 1 ? "" : "s"} arrive at the marked tiles`,
  teleport: () => "the boss reappears at the marked tile",
}

// Tiles to warn about right now: key -> hazard kind (quake/lava/water/wall/.../adds/teleport).
export function bossWarningTiles(state) {
  const map = new Map()
  for (const h of state.boss?.pending || []) {
    const kind = h.kind === "terrain" ? h.to : h.kind
    for (const t of h.tiles) map.set(key(t), kind)
  }
  return map
}

// Everything the boss bar shows.
export function describeBoss(state) {
  const boss = state.boss
  if (!boss) return null
  const fight = BOSS_FIGHTS[boss.id]
  const unit = getUnit(state, boss.unitId)
  const phase = fight.phases[boss.phaseIndex]
  const wps = weakPointsAlive(state).map((id) => getUnit(state, id))
  const upcoming = boss.pending.map((h) => ({
    kind: h.kind === "terrain" ? h.to : h.kind,
    label: h.label,
    inTurns: Math.max(0, h.due - state.turn),
    text: `${h.label}: ${HAZARD_TEXT[h.kind](h)}${h.due <= state.turn ? " when you end your turn" : ` in ${h.due - state.turn} turn(s)`}`,
  }))
  let enrage = null
  if (boss.enrageTurn != null) {
    enrage = boss.enraged > 0 ? `Enraged: +${boss.enrageAmount} attack every turn` : `Enrages in ${Math.max(0, boss.enrageTurn - state.turn)} turn(s)`
  }
  return {
    id: boss.id,
    name: boss.name,
    title: boss.title,
    hp: Math.max(0, unit?.hp || 0),
    maxHp: unit?.maxHp || 1,
    phaseIndex: boss.phaseIndex,
    phaseCount: boss.phaseCount,
    phaseName: phase.name,
    phaseText: phase.text,
    thresholds: boss.thresholds,
    immune: wps.length > 0 && !boss.qa,
    weakPoints: wps.map((u) => ({ id: u.id, name: u.name, hp: u.hp, maxHp: u.maxHp })),
    upcoming,
    enrage,
  }
}
