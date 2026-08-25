import { chromium } from "playwright"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
await page.goto("http://localhost:5310")

const result = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + Date.now())
  let state = engine.startRun("tommy")
  const firstBattleIndex = state.path.findIndex((n) => n.type === "battle" || n.type === "miniboss")
  state = { ...state, essence: 999, shopOffers: ["the-fool", "strength", "justice"], nodeIndex: firstBattleIndex }
  state = engine.recruitUnit(state, "the-fool")
  state = engine.recruitUnit(state, "strength")
  state = engine.recruitUnit(state, "justice")
  for (const entry of state.bench) {
    const emptySlot = state.deployed.indexOf(null)
    if (emptySlot === -1) break
    state = engine.assignToSlot(state, emptySlot, entry.key)
  }
  state = engine.startFormationBattle(state)

  const deployedNames = state.battle.playerUnits.map((u) => u.name)
  let log = []
  for (let i = 0; i < 8 && state.battle.phase === "player"; i++) {
    state = engine.advanceRound(state)
    log = log.concat(state.battle.roundEvents || [])
  }
  const fullLog = state.battle.log

  // Tally "X deal N damage" lines per attacker name.
  const dmgByActor = {}
  for (const line of fullLog) {
    const m = line.match(/^(.+?) deal (\d+) damage/)
    if (m) dmgByActor[m[1]] = (dmgByActor[m[1]] || 0) + Number(m[2])
  }

  return { deployedNames, dmgByActor, outcome: state.battle.phase, fullLog }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
