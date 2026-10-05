// Hearthwood Frontier - "Training Grounds", the guided first tactics fight
// (sprint 3). Pure data + a scenario builder: TacticsTutorial.jsx plays the
// real TacticsBoard on this battle and walks TRAINING_STEPS in order. Each
// step names what to spotlight (`target`), when it's done (`done`), and -
// for scripted steps - which board changes it accepts (`allow`), so a
// stray click can't knock the lesson off its rails. Never touches runState.
import { createRealMatchupBattle, getUnit, setUnit } from "./tacticsEngine"
import { enableMana } from "./tacticsMana"

export const TUTORIAL_KEY = "heartwood-tactics-tutorial-v1" // "done" | "skipped" | "offered"

export function tutorialStatus() {
  try {
    return localStorage.getItem(TUTORIAL_KEY)
  } catch {
    return null
  }
}

export function setTutorialStatus(value) {
  try {
    // "offered" never overwrites a real answer; a replay skip keeps "done".
    const cur = tutorialStatus()
    if ((value === "offered" && cur) || (value === "skipped" && cur === "done")) return
    localStorage.setItem(TUTORIAL_KEY, value)
  } catch {
    /* storage blocked - the offer may show again, harmless */
  }
}

// Unit ids in the scenario (createRealMatchupBattle's own id scheme).
export const T = {
  moss: "player-the-fool-0",
  bulwark: "player-bulwark-of-ages-1",
  commander: "player-commander",
  gnat: "enemy-mire-gnat-0",
  troll: "enemy-blightheart-troll-1",
}

const GRID = { rows: 6, cols: 8 }
export const TRAINING_SPOTS = {
  mossDeploy: { row: 1, col: 6 }, // where step 2 asks Mosskit to start
  flank: { row: 0, col: 3 }, // the Gnat's side (it faces east)
}
const START = {
  [T.moss]: { row: 4, col: 7 },
  [T.bulwark]: { row: 2, col: 6 },
  [T.commander]: { row: 5, col: 6 },
  [T.gnat]: { row: 1, col: 3 },
  [T.troll]: { row: 3, col: 4 },
}
// Weak, hand-tuned enemies: a short fight, not a real test.
const ENEMY_STATS = {
  [T.gnat]: { hp: 12, maxHp: 12, attack: 3, baseAttack: 3 },
  [T.troll]: { hp: 16, maxHp: 16, attack: 4, baseAttack: 4 },
}
const TERRAIN = { "1-1": "bush", "4-1": "rock", "5-3": "high", "0-0": "forest" }
const SLAM_AMOUNT = 7

export function buildTrainingBattle() {
  const base = createRealMatchupBattle(["the-fool", "bulwark-of-ages"], ["mire-gnat", "blightheart-troll"], "tommy", 0, TERRAIN)
  const units = base.units.map((u) => {
    const placed = { ...u, pos: { ...(START[u.id] || u.pos) }, ...(ENEMY_STATS[u.id] || {}) }
    delete placed.faction
    return placed
  })
  // Mana step 1: the lesson runs with mana (every bar starts full).
  return enableMana({
    ...base,
    grid: GRID,
    units,
    phase: "deploy",
    tutorial: true,
    // XCOM part 2: the scripted lesson hits must always land.
    noGraze: true,
    log: ["Training Grounds - a practice fight. Nothing here touches your run."],
  })
}

function slamTilesAround(center) {
  const tiles = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = center.row + dr
      const col = center.col + dc
      if (row >= 0 && row < GRID.rows && col >= 0 && col < GRID.cols) tiles.push({ row, col })
    }
  }
  return tiles
}

// Once the battle begins, the Troll has already wound up a Slam centred on
// the Bulwark - so turn 1 can teach "read the red tiles, step out".
export function armTrainingSlam(battle) {
  const bulwark = getUnit(battle, T.bulwark)
  const troll = getUnit(battle, T.troll)
  if (!bulwark || !troll || troll.windup) return battle
  const center = { ...bulwark.pos }
  return setUnit(battle, T.troll, {
    windup: { skillId: "slam", name: "Rot Quake", amount: SLAM_AMOUNT, center, tiles: slamTilesAround(center) },
  })
}

const at = (u, p) => !!u && u.pos.row === p.row && u.pos.col === p.col
export const cellSel = (p) => `.hwt-cell[data-cell="${p.row}-${p.col}"]`
const tokenSel = (id) => `.hwt-token[data-unit-id="${id}"]`
const unitIn = (b, id) => getUnit(b, id)
const onSlam = (b, id) => {
  const u = unitIn(b, id)
  const w = unitIn(b, T.troll)?.windup
  return !!u && !!w && w.tiles.some((t) => at(u, t))
}
// Same unit set, same everything - only positions / hp / ap / flags moved.
const onlyUnitChanged = (prev, next, id, keys) =>
  next.units.every((u) => {
    const p = prev.units.find((x) => x.id === u.id)
    if (!p) return false
    if (u.id === id) return true
    return keys.every((k) => JSON.stringify(p[k]) === JSON.stringify(u[k]))
  })

// Steps as the player sees them. `text` is one short plain sentence.
// target(battle, ui) -> CSS selector to spotlight (ui = { selectedId }).
// done(battle) -> advance. allow(prev, next) -> accept a board change
// (omitted = anything goes). `manual` -> a Next button instead.
export const TRAINING_STEPS = [
  {
    id: "welcome",
    title: "Training Grounds",
    text: "A quick practice fight to learn the basics. Nothing here touches your run.",
    manual: true,
    target: () => null,
  },
  {
    id: "deploy",
    title: "Deployment",
    text: "Before the fight you choose where your squad starts. Click Mosskit, then the highlighted tile.",
    target: (b, ui) => (ui.selectedId === T.moss ? cellSel(TRAINING_SPOTS.mossDeploy) : tokenSel(T.moss)),
    done: (b) => at(unitIn(b, T.moss), TRAINING_SPOTS.mossDeploy),
    allow: (prev, next) => next.phase === "deploy" && at(unitIn(next, T.moss), TRAINING_SPOTS.mossDeploy),
    nudge: "Place Mosskit on the highlighted tile.",
  },
  {
    id: "begin",
    title: "Begin the battle",
    text: "Happy with the setup? Press Begin Battle.",
    target: () => ".hwt-begin-battle",
    done: (b) => b.phase === "player",
    allow: (prev, next) => next.phase === "player",
    nudge: "Press Begin Battle.",
  },
  {
    id: "move",
    title: "Move",
    text: "Each hero has 2 action points (the dots). Click Mosskit, then the highlighted tile beside the Gnat.",
    target: (b, ui) => (ui.selectedId === T.moss ? cellSel(TRAINING_SPOTS.flank) : tokenSel(T.moss)),
    done: (b) => at(unitIn(b, T.moss), TRAINING_SPOTS.flank),
    allow: (prev, next) => at(unitIn(next, T.moss), TRAINING_SPOTS.flank) && onlyUnitChanged(prev, next, T.moss, ["pos", "hp"]),
    nudge: "Move Mosskit to the highlighted tile.",
  },
  {
    id: "flank",
    title: "Attack from the side",
    text: "The arrow shows where an enemy faces. Hit its side (+10%) or back (+50%) for extra damage - click the Gnat.",
    target: () => tokenSel(T.gnat),
    done: (b) => (unitIn(b, T.gnat)?.hp ?? 0) < ENEMY_STATS[T.gnat].hp,
    allow: (prev, next) => (unitIn(next, T.gnat)?.hp ?? 0) < (unitIn(prev, T.gnat)?.hp ?? 0),
    nudge: "Select Mosskit, then click the Gnat.",
  },
  {
    id: "intent",
    title: "Read the enemy's plan",
    text: "Badges above enemies show what they'll do. The ✹ means the Troll will crush the red tiles when you end your turn.",
    manual: true,
    target: () => `${tokenSel(T.troll)} .hwt-intent-badge`,
  },
  {
    id: "dodge",
    title: "Step out of the slam",
    text: "Click the Bulwark and move it off the red tiles.",
    target: (b, ui) => (ui.selectedId === T.bulwark ? `.hwt-cell[data-skill-zone="release"]` : tokenSel(T.bulwark)),
    done: (b) => !onSlam(b, T.bulwark) && !onSlam(b, T.moss) && !onSlam(b, T.commander),
    allow: (prev, next) => !onSlam(next, T.bulwark) && onlyUnitChanged(prev, next, T.bulwark, ["pos", "hp"]),
    nudge: "Move the Bulwark to a tile outside the red area.",
  },
  {
    id: "ability",
    title: "Use an ability",
    text: "Skills cost AP and MANA (the thin blue bar under the health bar - it starts full every fight and refills a little each turn). With the Bulwark selected, press Bulwark Aura to shield itself and its neighbours.",
    target: (b, ui) => (ui.selectedId === T.bulwark ? ".hwt-ability-btn" : tokenSel(T.bulwark)),
    done: (b) => (unitIn(b, T.bulwark)?.cooldownRemaining || 0) > 0,
    allow: (prev, next) => (unitIn(next, T.bulwark)?.cooldownRemaining || 0) > 0,
    nudge: "Select the Bulwark and press its ability button.",
  },
  {
    id: "power",
    title: "Commander Power",
    text: "Your Commander (♛) has a big Power - its mana ULTIMATE. It needs a full blue bar and spends all of it; refill the bar to use it again. Press it now.",
    target: () => ".hwt-power-btn",
    done: (b) => !!b.activePower?.used,
    allow: (prev, next) => !!next.activePower?.used,
    nudge: "Press the Commander Power button.",
  },
  {
    id: "end-turn",
    title: "End your turn",
    text: "Press End Turn. The enemies act - and the Troll's slam hits empty ground.",
    target: () => ".hwt-end-turn",
    done: (b) => b.turn >= 2,
    allow: (prev, next) => next.turn > prev.turn || next.phase === "won" || next.phase === "lost",
    nudge: "Press End Turn.",
  },
  {
    id: "finish",
    title: "Finish the fight",
    text: "Your turn again. Defeat both enemies - attack, flank, use what you learned.",
    target: () => null,
    done: (b) => b.phase === "won",
  },
  {
    id: "victory",
    title: "Victory!",
    text: "That's the basics. New things (terrain, bosses, objectives) get a short tip the first time you meet them.",
    manual: true,
    final: true,
    target: () => null,
  },
]
