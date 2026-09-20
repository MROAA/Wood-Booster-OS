import { chromium } from "playwright"

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5310")

const result = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + Date.now())
  const enemiesMod = await import("/src/data/heartwood/enemies.js?t=" + Date.now())

  function run(units, essence) {
    let state = engine.startRun("tommy")
    const midIndex = Math.floor(state.path.length * 0.7)
    const battleIndex = state.path.findIndex((n, i) => i >= midIndex && (n.type === "battle" || n.type === "miniboss"))
    const node = state.path[battleIndex]
    const rawBaseDmg = enemiesMod.ENEMIES[node.enemyId]?.movePattern.find((m) => m.type === "attack")?.amount
    const rawBaseHp = enemiesMod.ENEMIES[node.enemyId]?.maxHp
    state = { ...state, essence, shopOffers: units, nodeIndex: battleIndex }
    for (const id of units) state = engine.recruitUnit(state, id)
    const started = engine.startFormationBattle(state)
    const scaledDmg = started.battle.enemyDefs[node.enemyId]?.movePattern.find((m) => m.type === "attack")?.amount
    return { rawBaseDmg, scaledDmg, rawBaseHp, scaledHp: started.battle.enemies[0]?.maxHp }
  }

  // Also directly check the ramp itself, since that's what an EARLY
  // fight relies on before the DPS-adaptive layer engages at all.
  const engineSrc = engine
  const firstFight = run(["the-fool"], 999)
  const later = (() => {
    let state = engine.startRun("tommy")
    const battleIndex = state.path.findIndex((n) => n.type === "battle" || n.type === "miniboss")
    const node = state.path[battleIndex]
    const rawBaseHp = enemiesMod.ENEMIES[node.enemyId]?.maxHp
    state = { ...state, essence: 999, shopOffers: ["the-fool"], nodeIndex: battleIndex }
    state = engine.recruitUnit(state, "the-fool")
    const started = engine.startFormationBattle(state)
    return { rawBaseHp, scaledHp: started.battle.enemies[0]?.maxHp, node }
  })()

  return { midRunCheck: firstFight, veryFirstFightCheck: later }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
