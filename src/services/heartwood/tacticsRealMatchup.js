// Hearthwood Frontier - Phase 4's "real preview" bridge. The ONLY file
// that reads a real run's save; kept separate from tacticsEngine.js so the
// core engine's own "no import from runEngine.js/autoBattleEngine.js/
// effects.js, no localStorage" isolation (unbroken since Phase 1) stays
// intact.
//
// Every read here is provably non-mutating: loadRunSave (runSaveState.js)
// is a plain localStorage.getItem + JSON.parse, try/catch, already used
// exactly this way in production; deserializeRun (runEngine.js) is pure
// shape/version validation, also already production-used with zero side
// effects, and already returns null defensively on any corrupt/missing/
// old-version save rather than throwing; resolveFormation (formations.js)
// is the SAME function FormationScreen.jsx already calls to resolve a
// node's real formationId/enemyId - including its built-in fallback that
// wraps a bare solo-enemy id into a 1-piece formation, so any real
// encounter (a multi-piece formation OR a single enemy) resolves through
// one call. This module never imports saveRunSave or anything else that
// could write - there is no path from here back into the real run.
import { withRuneArrivals } from "./tacticsRunes"
import { withForestWardens, withShapeshifter } from "./tacticsCreatures"
import { carvedRuneId } from "./runRunes"
import { loadRunSave } from "./runSaveState"
import { deserializeRun, RUN_PATH, actIndexForNode, DIFFICULTY_TIERS } from "./runEngine"
import { applyDifficulty, difficultySpec } from "./tacticsDifficulty"
import { resolveFormation } from "../../data/heartwood/formations"
import { ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"
import { streamRng } from "../../data/heartwood/seed"
import { GRID, createRunTacticsBattle } from "./tacticsEngine"
import { TERRAIN, buildTemplateTerrain, pickTemplate, sidesConnected } from "./tacticsTerrain"
import { biomeForAct } from "../../data/heartwood/battleBiomes"
import { effectiveUnitDef } from "./autoBattleEngine"
import { objectiveForNode, applyObjective } from "./tacticsObjectives"
import { arenaTerrainFor, applyBossFight } from "./tacticsBosses"
import { applyFaction } from "./tacticsFactions"
import { enableMana } from "./tacticsMana"
import { enableCombatDepth } from "./tacticsDepth"
import { classFieldsFor } from "./tacticsClasses"
import { collarClassFor } from "./gear"
import { riskOf } from "./betweenFights"
import { withFateArrivals, withCommunePools, withStartCharge, betweenFightsMana } from "./tacticsBetweenFights"
// The Long Campaign content sprint: mission objectives, campaign enemy kits, chapter maps.
import { applyCampaignOps, finishCampaignOps } from "./tacticsCampaignOps"

// Only these two phases mean "the player is standing in front of, or
// mid-way through, a real fight" - every other phase (shop/relic/event/
// choice/victory/defeat) has no "current enemy" worth previewing.
const PREVIEWABLE_PHASES = new Set(["formation", "battle"])

// Seeded terrain round: how many scattered hazard/terrain cells a real
// fight gets, and their weighted type mix - the real 4 ids already
// defined in tacticsEngine.js's own TERRAIN map, no new type invented.
// rock/water/poison are the real hazards ("hazardit"); forest is a
// zero-cost cosmetic variant ("ja muut" - Marc's own "and other
// things") so a fight can look different even when nothing dangerous
// lands nearby. Difficulty-scaled terrain density round: this is now
// just the STARTING point (Act I keeps exactly this value) - see
// terrainHazardCountForNode below for the real per-Act scaling.
const TERRAIN_HAZARD_COUNT_BASE = 6

// Difficulty-scaled terrain TYPE MIX round: forest is the only
// zero-effect id of the 4 (cost:1 in tacticsEngine.js's own TERRAIN
// map, byte-identical to plain "path") - rock/water/poison are the 3
// real hazards. Forest's own share shrinks as the Act rises, and what
// it loses is redistributed PROPORTIONALLY across the 3 real hazards,
// keeping their own existing 30:20:25 relative flavor (a 6:4:5 ratio)
// unchanged - a single clean scaling axis, not a second "which hazard
// gets scarier" tuning pass nobody asked for. FOREST_WEIGHT_BASE=0.25
// keeps Act I at EXACTLY today's own 30/20/25/25 split (the same "Act
// I unchanged" guarantee terrainHazardCountForNode below already
// established for density). FOREST_WEIGHT_FLOOR is a forward-looking
// safety net only - never actually engaged within today's real Acts
// 1-7 (Act VII's own forest share is 0.07, above the 0.05 floor).
const FOREST_WEIGHT_BASE = 0.25
const FOREST_WEIGHT_PER_ACT_DROP = 0.03
const FOREST_WEIGHT_FLOOR = 0.05
const HAZARD_RELATIVE_WEIGHTS = { rock: 6, water: 4, poison: 5 }
const HAZARD_RELATIVE_TOTAL = 15

// Exported so verify checks can independently recompute the exact
// expected weights for any node - the same "recompute, don't trust a
// remembered value" discipline the density round already established.
export function terrainWeightsForNode(nodeIndex) {
  const act = actIndexForNode(nodeIndex, RUN_PATH.length)
  const forest = Math.max(FOREST_WEIGHT_FLOOR, FOREST_WEIGHT_BASE - FOREST_WEIGHT_PER_ACT_DROP * (act - 1))
  const remaining = 1 - forest
  return {
    rock: remaining * (HAZARD_RELATIVE_WEIGHTS.rock / HAZARD_RELATIVE_TOTAL),
    water: remaining * (HAZARD_RELATIVE_WEIGHTS.water / HAZARD_RELATIVE_TOTAL),
    poison: remaining * (HAZARD_RELATIVE_WEIGHTS.poison / HAZARD_RELATIVE_TOTAL),
    forest,
  }
}

// Exported alongside terrainWeightsForNode so verify checks can prove
// this function genuinely reads the passed weights (boundary-roll
// behavior), not leftover hardcoded thresholds.
export function pickTerrainType(roll, weights) {
  if (roll < weights.rock) return "rock"
  if (roll < weights.rock + weights.water) return "water"
  if (roll < weights.rock + weights.water + weights.poison) return "poison"
  return "forest"
}

// Difficulty-scaled terrain density round: reuses actIndexForNode
// (runEngine.js) - the SAME 1-7 Act number the story/RunMap/SquadDraft/
// FormationScreen UI already all agree on - rather than
// difficultyFactorForNode (the auto-battler's own heavily-tuned enemy
// HP/damage ramp, re-tuned many times for THAT system's own balance
// needs alone). +1 hazard per Act beyond the first: Act I=6 (today's
// exact, unchanged value), Act II=7, ... Act VII=12. Exported so
// verify checks can independently recompute the exact expected count
// for any node, the same "recompute, don't just trust the render"
// pattern every zone-cell check already uses.
export function terrainHazardCountForNode(nodeIndex) {
  return TERRAIN_HAZARD_COUNT_BASE + (actIndexForNode(nodeIndex, RUN_PATH.length) - 1)
}

// Seed System PRD (seed.js's own SEED_STREAMS): "combat" was reserved
// from PR #429 onward but never wired - this is its first real use, not
// a new stream invented. streamRng(seed, "combat", `${nodeIndex}:terrain`)
// is a fresh, stable generator - the SAME (seed, nodeIndex) always
// regenerates the SAME battlefield (reload-safe, share-a-seed-safe),
// matching every other stream-consuming caller's own contract exactly.
// Confined to the grid's middle columns, keeping a 3-column buffer clear
// on each side (never touching a spawn column) regardless of GRID.cols -
// the same "hazards live between the two sides" shape The Crossing's own
// hand-authored layout already established, generalized so a future
// board-size change needs no edit here either. A pure function of
// (seed, nodeIndex) -
// tacticsEngine.js itself stays unaware the seed system exists at all;
// it just receives a plain terrain map, indistinguishable from a
// hand-authored ENEMY_FORMATIONS one.
export function generateScatterTerrain(seed, nodeIndex) {
  const rng = streamRng(seed, "combat", `${nodeIndex}:terrain`)
  const terrain = {}
  let placed = 0
  let attempts = 0
  const hazardCount = terrainHazardCountForNode(nodeIndex)
  const weights = terrainWeightsForNode(nodeIndex)
  while (placed < hazardCount && attempts < hazardCount * 4) {
    attempts++
    const row = Math.floor(rng() * GRID.rows)
    const col = 3 + Math.floor(rng() * (GRID.cols - 6))
    const key = `${row}-${col}`
    if (terrain[key]) continue
    terrain[key] = pickTerrainType(rng(), weights)
    placed++
  }
  return terrain
}

// Battlefield sprint: which hand-made-feeling map template a node gets
// (own seeded salt, so the scatter layer above stays byte-identical).
export function mapTemplateForNode(seed, nodeIndex) {
  const rng = streamRng(seed, "combat", `${nodeIndex}:map`)
  return { template: pickTemplate(rng, actIndexForNode(nodeIndex, RUN_PATH.length)), rng }
}

// The real battlefield = a seeded map template (river crossing, hill
// fort, ruined walls, forest glade, frozen ford, ember field) + the
// Act-scaled scatter layer filling tiles the template left open.
// Guaranteed crossable: if a scatter tile ever cuts every route
// (walls/water counted as blocking), scatter blockers are dropped.
export function generateRealTerrain(seed, nodeIndex) {
  return generateForestDressing(seed, nodeIndex, generateBaseTerrain(seed, nodeIndex))
}

// Battlefield piece 3: the Act's biome scatters its living-forest pieces
// (battleBiomes.js `dressing`: dry leaves, moss, roots, runestones,
// glowcaps) on middle tiles the template + scatter left open. Own seeded
// salt, so every earlier roll - and the older layouts - stay identical.
// Blocking pieces are only kept where the two sides stay joined.
export function generateForestDressing(seed, nodeIndex, terrain) {
  const biome = biomeForAct(actIndexForNode(nodeIndex, RUN_PATH.length))
  const rng = streamRng(seed, "combat", `${nodeIndex}:forest`)
  const between = (a, b) => a + Math.floor(rng() * (b - a + 1))
  const lo = 3
  const hi = GRID.cols - 4
  const out = { ...terrain }
  for (const piece of biome.dressing || []) {
    const blocks = TERRAIN[piece.type]?.cost === Infinity
    const clumps = between(piece.clumps[0], piece.clumps[1])
    for (let c = 0; c < clumps; c++) {
      let row = between(0, GRID.rows - 1)
      let col = between(lo, hi)
      const size = between(piece.size[0], piece.size[1])
      for (let i = 0; i < size; i++) {
        const key = `${row}-${col}`
        if (!out[key]) {
          out[key] = piece.type
          if (blocks && !sidesConnected(out, GRID)) delete out[key]
        }
        if (rng() < 0.5) row = Math.min(GRID.rows - 1, Math.max(0, row + (rng() < 0.5 ? -1 : 1)))
        else col = Math.min(hi, Math.max(lo, col + (rng() < 0.5 ? -1 : 1)))
      }
    }
  }
  return out
}

// The template + scatter layers (everything before the forest pieces).
export function generateBaseTerrain(seed, nodeIndex) {
  const { template, rng } = mapTemplateForNode(seed, nodeIndex)
  const base = buildTemplateTerrain(template, rng, GRID, 3, GRID.cols - 4)
  const scatter = generateScatterTerrain(seed, nodeIndex)
  const terrain = { ...base }
  for (const [key, type] of Object.entries(scatter)) if (!terrain[key]) terrain[key] = type
  if (sidesConnected(terrain, GRID)) return terrain
  for (const [key, type] of Object.entries(scatter)) if (!base[key] && type === "water") delete terrain[key]
  if (sidesConnected(terrain, GRID)) return terrain
  // Last resort (never seen in 2000-seed sweeps): open every template wall.
  for (const key of Object.keys(terrain)) if (terrain[key] === "wall") terrain[key] = "rubble"
  if (sidesConnected(terrain, GRID)) return terrain
  // Destructibles block too: drop them before giving up.
  for (const key of Object.keys(terrain)) if (TERRAIN[terrain[key]]?.obj) delete terrain[key]
  return terrain
}

// Resolves an already-in-memory runState + node into { label, squadDefIds,
// enemyDefIds, characterId, commanderRank, terrain } for the tactics
// engine's createRealMatchupBattle, or null when there's nothing resolvable (no
// encounter id, or an empty squad/enemy side). Pure - no localStorage
// touch at all, so HeartwoodBattle.jsx can call this directly on the
// LIVE runState it already has in React state, no round-trip needed.
// Phase-gating (is the player even standing in front of a fight right
// now) is the CALLER's job - loadRealMatchup below does it for the
// localStorage-reading path; HeartwoodBattle.jsx already only calls this
// from its own formation/battle-phase code paths.
export function resolveRealMatchup(runState, node) {
  const encounterId = node?.formationId || node?.enemyId
  if (!encounterId) return null

  const formation = resolveFormation(encounterId)

  const squadDefIds = (runState.deployed || [])
    .filter((key) => key !== null)
    .map((key) => (runState.bench || []).find((e) => e.key === key))
    .filter((entry) => entry && UNITS[entry.defId])
    .map((entry) => entry.defId)
  // Mirror faction: the enemy side is the deployed squad itself.
  const enemyDefIds = formation.mirror && squadDefIds.length ? squadDefIds.slice(0, 4) : formation.pieces.map((p) => p.defId).filter((id) => ENEMIES[id])

  // Tactics-default round: a Commander-alone deploy (the run's real
  // opening state - "peli alkaa siitä että commander on yksin") is a
  // real fight too, since the Commander always deploys as its own unit.
  if (!enemyDefIds.length || (!squadDefIds.length && !runState.characterId)) return null

  return {
    label: formation.name || ENEMIES[enemyDefIds[0]]?.name || "your run's next fight",
    squadDefIds,
    enemyDefIds,
    // Real-fight wiring round: the run's own actual chosen Commander +
    // Rank-Up level, threaded through to createRealMatchupBattle so it
    // can deploy the SAME Commander (with the same real rank-scaled
    // Squad Passive) the player actually has, not a hardcoded default.
    characterId: runState.characterId,
    commanderRank: runState.commanderRank || 0,
    // Seeded terrain round: a battlefield generated from the run's own
    // seed + this node's own stable index - the same seed always
    // regenerates the same terrain for the same fight.
    terrain: arenaTerrainFor(encounterId) || generateRealTerrain(runState.seed, runState.nodeIndex),
    bossId: arenaTerrainFor(encounterId) ? encounterId : null,
    faction: formation.faction || null,
  }
}

// Reads the real run's save (localStorage) and resolves it via
// resolveRealMatchup above, or null when there's nothing previewable (no
// save, wrong phase, an unresolvable encounter, or an empty squad/enemy
// side). Never throws. Used by the standalone /heartwood-tactics page,
// which has no runState of its own to read directly.
export function loadRealMatchup() {
  const runState = deserializeRun(loadRunSave())
  if (!runState || !PREVIEWABLE_PHASES.has(runState.phase)) return null
  return resolveRealMatchup(runState, runState.path?.[runState.nodeIndex])
}

// Tactics-default round: runEngine.js's startTacticsFormationBattle hands
// this the auto-battle's own start state (`start` = { battle, deployed,
// difficultyFactor }); this turns it into the real tactics fight. Squad
// units use the SAME upgraded/dual-classed def the auto-battle built them
// from, the enemy list is the auto-battle's own (Act-corrected, Trial-
// named) encounter, and terrain is the run's seeded battlefield.
export function buildRunTacticsBattle(runState, start) {
  const deployedDefIds = start.deployed.map((e) => e.defId)
  const squad = start.deployed.map((e) => ({ defId: e.defId, def: effectiveUnitDef(e.defId, e.upgrades || e.upgradeLevel || 0, deployedDefIds) }))
  const node = runState.path[runState.nodeIndex]
  const encounterId = node?.formationId || node?.enemyId
  const formation = resolveFormation(encounterId)
  // Mirror faction: echoes are UNITS defs (startAutoBattle's mirrorSquad).
  const enemyDefIds = start.battle.enemies.map((e) => e.defId).filter((id) => ENEMIES[id] || (formation.mirror && UNITS[id]))
  // Boss fights (sprint 3): minibosses/bosses/elite Ancients get their arena.
  const arena = arenaTerrainFor(encounterId)
  const battle = createRunTacticsBattle({
    squad,
    enemyDefIds,
    characterId: runState.characterId,
    terrain: arena || generateRealTerrain(runState.seed, runState.nodeIndex),
    autoStart: start.battle,
    difficultyFactor: start.difficultyFactor,
    label: start.battle.enemies.length === 1 ? start.battle.enemies[0].name : formation?.name,
    relicIds: runState.relics || [],
  })
  const factioned = battle && formation.faction ? applyFaction(battle, formation.faction) : battle
  // Mana step 1: every real fight runs with mana (all pools start full).
  const built0 = applyObjective(arena ? applyBossFight(factioned, encounterId) : factioned, objectiveForRunNode(runState))
  // The Long Campaign: the mission's own objective / kits / chapter battlefield.
  const built = built0 && runState.campaignOps ? applyCampaignOps(built0, runState.campaignOps) : built0
  // Difficulty sprint 2: the DifficultyEngine (threat tier for this node) -
  // before mana, so escorts get their bars too.
  // Between-fights: a fated ally / rival joins (before the threat tier, so
  // the rival is scaled and smart like the rest).
  const fated0 = built ? withFateArrivals(built, runState, start.difficultyFactor) : built
  // Runes: a carved rune's cost can bring a unit (Growth's beast, Echo's echo) - before the threat tier too.
  const runed = fated0 ? withRuneArrivals(fated0, carvedRuneId(runState)) : fated0
  // Forest creatures (First Song PRD §6): Wardens answer the forest's regard;
  // from Act II a Shapeshifter may hide among the trees.
  const fated = runed
    ? withShapeshifter(withForestWardens(runed, runState.regard), {
        seed: runState.seed,
        nodeIndex: runState.nodeIndex,
        act: actIndexForNode(runState.nodeIndex, RUN_PATH.length),
        kind: node?.type || "battle",
      })
    : runed
  const threatened = fated ? applyDifficulty(fated, difficultyForRunNode(runState, runState.nodeIndex, start.difficultyFactor)) : fated
  // Combat depth sprint: stances, combos, reactions, Delay/Stagger on.
  // Between-fights mana: build-set tiers, camp Commune, mana-tide fates.
  // Mana sprint 3: campaign ley line colours (15% cheaper skills of that colour).
  const done = threatened
    ? enableCombatDepth(
        withLeyColours(withStartCharge(withCommunePools(enableMana(withBredClasses(threatened, runState), runState.relics || [], betweenFightsMana(runState)), runState), runState), runState),
      )
    : threatened
  const finished = done?.campaignOps ? finishCampaignOps(done) : done
  // Biomes per Act: the battlefield is drawn in the story Act's biome
  // (battleBiomes.js BIOME_FOR_ACT) unless something already chose one.
  return finished && !finished.biome ? { ...finished, biome: biomeForAct(actIndexForNode(runState.nodeIndex, RUN_PATH.length)).id } : finished
}

// The DifficultyEngine spec for a run node: its Act, how deep into the Act
// it sits (0 = first node, 1 = last), elite/boss kind. Pure (seed + index),
// so the formation screen can show the same threat before the fight.
export function difficultyForRunNode(runState, nodeIndex = runState?.nodeIndex, factor = 1) {
  const len = RUN_PATH.length
  const act = actIndexForNode(nodeIndex, len)
  const progress = len > 1 ? nodeIndex / (len - 1) : 0
  const from = DIFFICULTY_TIERS[act - 1]?.threshold ?? 0
  const to = DIFFICULTY_TIERS[act]?.threshold ?? 1
  const depth = to > from ? Math.max(0, Math.min(1, (progress - from) / (to - from))) : 0
  const type = runState?.path?.[nodeIndex]?.type || RUN_PATH[nodeIndex]?.type || "battle"
  const kind = ["elite", "miniboss", "boss"].includes(type) ? type : "battle"
  // Route risk: a Hunted / Cursed path adds its threat to the score.
  // The Long Campaign: difficulty level + fallen regions + doom (campaignEngine.campaignThreatBonus).
  const riskBonus = riskOf(runState?.path?.[nodeIndex]).threat + (Number(runState?.campaignThreat) || 0)
  return difficultySpec({ act, kind, depth, factor, riskBonus, seedKey: `${runState?.seed ?? 0}:${nodeIndex}` })
}

// Breeding (hearth.js breedHeroes): a hatchling can carry the OTHER
// parent's class (bench entry `classId`). A Class Collar (gear.js) wins. Swapped in before mana is
// enabled, so the hero also gets that class's resource.
function withBredClasses(battle, runState) {
  const keys = (runState.deployed || []).filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const byId = {}
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    // Gear sprint: a worn Class Collar wins over the hero's natural class.
    // Weird events: a temporary class swap (bench `tempClass`) wins over both.
    const temp = e?.tempClass?.fights > 0 && e.tempClass.classId
    const classId = temp || collarClassFor(runState, k) || e?.classId
    if (classId && UNITS[e.defId] && UNITS[e.defId].classId !== classId) byId[`player-${e.defId}-${i}`] = { ...UNITS[e.defId], classId }
  })
  if (!Object.keys(byId).length || !battle.units) return battle
  return { ...battle, units: battle.units.map((u) => (byId[u.id] ? { ...u, ...classFieldsFor(byId[u.id], "player") } : u)) }
}

// Battle objectives (sprint 2): the objective for the run's node - pure
// (seed + nodeIndex + node type + Act), so the formation screen shows
// exactly what the fight will be.
export function objectiveForRunNode(runState, nodeIndex = runState?.nodeIndex) {
  if (!runState || nodeIndex == null) return null
  const node = runState.path?.[nodeIndex]
  if (!node) return null
  // The Long Campaign: a mission kind with its own objective replaces the random one.
  if (runState.campaignOps?.kind) return null
  return objectiveForNode(runState.seed, nodeIndex, node.type, actIndexForNode(nodeIndex, RUN_PATH.length))
}

// Mana sprint 3: the campaign's ley network colours ride on every hero.
function withLeyColours(battle, runState) {
  const net = runState?.leyNet
  if (!battle?.units || !net) return battle
  const colours = Array.isArray(net.colours) ? net.colours : []
  return {
    ...battle,
    leyNet: { strength: net.strength || 0, size: net.size || 0, regen: net.regen || 0, startMana: net.startMana || 0, colours },
    units: colours.length ? battle.units.map((u) => (u.side === "player" && !u.structure && !u.npc ? { ...u, leyColours: colours } : u)) : battle.units,
  }
}
