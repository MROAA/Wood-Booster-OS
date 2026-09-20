import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } })
await page.goto("http://localhost:5310/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-select-grid button", { timeout: 15000 })
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  for (let i = 0; i < 6; i++) {
    if (!(await tutorialNext.isVisible({ timeout: 500 }).catch(() => false))) break
    await tutorialNext.click().catch(() => {})
    await page.waitForTimeout(200)
  }
}
await page.waitForTimeout(300)

// Jump straight to a busy, debuff-heavy formation with a strong,
// buff-stacked squad - the real worst case for badge/icon overload,
// not the clean fight-1 state every screenshot so far has shown.
await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let run = engine.startRun("tommy")
  const idx = run.path.findIndex((n) => n.formationId === "the-withering-pact")
  run = { ...run, essence: 999, nodeIndex: idx, phase: "shop", shopOffers: [], itemOffers: [] }
  // Recruit a full squad so the fight has real numbers on both sides.
  const { UNITS } = await import("/src/data/heartwood/units.js?t=" + t)
  const recruitable = Object.keys(UNITS).filter((id) => UNITS[id].tier === "common").slice(0, 4)
  for (const id of recruitable) run = engine.recruitUnit(run, id)
  run = engine.leaveShop(run)
  for (const entry of run.bench) {
    if (!run.deployed.includes(entry.key)) {
      const slot = run.deployed.indexOf(null)
      if (slot !== -1) run = engine.assignToSlot(run, slot, entry.key)
    }
  }
  run = engine.startFormationBattle(run)
  // Advance a few rounds so debuffs/buffs actually accumulate.
  for (let i = 0; i < 3 && run.battle.phase === "player"; i++) run = engine.resolveRound(run.battle)
    .then ? run : { ...run, battle: engine.resolveRound(run.battle) }
  window.__debugRun = run
  window.__setDebugState && window.__setDebugState(run)
}).catch((e) => console.log("eval error:", e.message))
await page.waitForTimeout(500)
await page.screenshot({ path: ".scratch/shots/05-overload-attempt.png", fullPage: true })
await browser.close()
