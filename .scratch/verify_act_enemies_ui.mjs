import { chromium } from "playwright"

const PORT = process.env.PORT || 5571
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)))
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console.error: " + m.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(600)

// Build a valid mid-run save whose CURRENT node is a battle against a
// NEW Act-7 sample enemy, deployed squad in place, phase "formation".
const seeded = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const { startRun, recruitUnit, leaveShop, chooseFloorEncounter, serializeRun } = engine

  const { RUN_PATH } = engine

  // Natural start -> recruit the opening shop -> gives a valid
  // bench/deployed/items shape.
  let run = startRun("tommy")
  for (const id of [...run.shopOffers]) run = recruitUnit(run, id)
  run = leaveShop(run)
  if (run.phase === "choice") run = chooseFloorEncounter(run, 0)

  // Jump to the LAST node position (Act VII band) so the Act-fallback
  // keeps the Act-7 sample enemy instead of swapping it for an
  // Act-appropriate one. deserializeRun only requires
  // path.length === nodeIndex + 1 and nodeIndex < RUN_PATH.length.
  const lastIdx = RUN_PATH.length - 2
  const path = RUN_PATH.slice(0, lastIdx).map((n) => ({ ...n }))
  path.push({ type: "battle", enemyId: "verge-warden", beat: "Placeholder Act VII sample - Verge Warden." })
  run.path = path
  run.nodeIndex = lastIdx
  run.battlePool = []
  run.floorChoices = null
  run.phase = "formation"

  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(run)))
  return { nodeIndex: run.nodeIndex, deployed: run.deployed.filter(Boolean).length, pathLen: run.path.length }
})
console.log("seeded save:", seeded)

await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(1200)

// FormationScreen should now show the Verge Warden encounter. Find and
// click whatever starts the fight.
const startBtn = page.locator("button", { hasText: /Start|Begin|Fight|Taistele|Aloita/i })
let clickedStart = false
if (await startBtn.count()) {
  await startBtn.first().click().catch(() => {})
  clickedStart = true
  await page.waitForTimeout(1500)
}

const bodyText = await page.locator("body").innerText()
const nameVisible = /Verge Warden/i.test(bodyText)

await page.screenshot({ path: "/tmp/act-enemies-fight.png", fullPage: true })
console.log("screenshot -> /tmp/act-enemies-fight.png")
console.log("clicked a start button:", clickedStart)
console.log("'Verge Warden' visible on screen:", nameVisible)
console.log("errors:", errors)

await browser.close()
const ok = nameVisible && errors.length === 0
console.log(ok ? "PASS: new sample enemy renders in a real UI battle, no errors" : "FAIL")
process.exit(ok ? 0 : 1)
