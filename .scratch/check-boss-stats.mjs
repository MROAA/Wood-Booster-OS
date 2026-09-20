import { chromium } from "playwright"
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
const result = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const enemiesMod = await import("/src/data/heartwood/enemies.js?t=" + t)
  const battleEngine = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const { ENEMIES } = enemiesMod
  const raw = ENEMIES["spacemonkey"]
  const battle = battleEngine.startAutoBattle("tommy", ["the-fool"], "spacemonkey", [], 0, {}, [], [], 1.35)
  const scaled = battle.enemies[0]
  return { rawHp: raw.maxHp, scaledHp: scaled.maxHp, rawAttack: raw.movePattern, factor: 1.35 }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
