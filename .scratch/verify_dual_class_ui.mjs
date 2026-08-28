// Live UI verification: play through the actual React app (not just the
// engine module) to confirm a dual-classed unit's card really shows the
// combo name on screen, with a screenshot as proof (Marc's own repeated
// "show screenshots, not just claims" ask for Hearthwood UI work).
import { chromium } from "playwright"

const PORT = process.env.PORT || 5219
const OUT = process.env.OUT_DIR || ".scratch"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(800)

// Reach the shop directly via localStorage run-state injection - same
// approach this game's own .scratch scripts already use to skip past
// the commander-select screen for a UI check, rather than a fragile
// click-through of the whole intro flow.
const injected = await page.evaluate(async () => {
  const mod = await import("/src/services/heartwood/runEngine.js")
  if (typeof mod.startRun !== "function") return { ok: false, reason: "no startRun export" }
  let runState = mod.startRun("tommy")
  // Force essence high enough, and force this shop's offers to include
  // exactly the units needed so the test doesn't depend on RNG.
  runState = { ...runState, essence: 99, shopOffers: ["ironbark", "briarblade"] }
  const saved = mod.serializeRun(runState)
  window.localStorage.setItem("heartwood-run-save-v1", JSON.stringify(saved))
  return { ok: true, essence: runState.essence, offers: runState.shopOffers }
})

if (!injected.ok) {
  console.log("FAIL: could not inject run state -", injected.reason)
  await browser.close()
  process.exit(1)
}

await page.reload()
await page.waitForTimeout(800)

// Recruit Ironbark then Briarblade from the shop (Market tab is default).
const recruitByName = async (name) => {
  const card = page.locator(`.hw-card:has-text("${name}")`).first()
  await card.waitFor({ state: "visible", timeout: 5000 })
  await card.click()
  await page.waitForTimeout(400)
}

await recruitByName("Ironbark")
await recruitByName("Briarblade")

// Both auto-deploy (existing convention - a bought unit fills an open
// deploy slot automatically). Switch to the Squad tab to see the bench
// cards, where SquadDraft.jsx computes dualClass per entry.
const squadTab = page.locator('button.hw-move-btn:has-text("Your Squad")')
await squadTab.click()
await page.waitForTimeout(400)

const classLabels = await page.locator(".hw-card-class").allTextContents()
const dualLabel = await page.locator(".hw-card-class--dual").allTextContents()

await page.screenshot({ path: `${OUT}/dual_class_squad.png`, fullPage: true })

console.log("Class labels on bench:", classLabels)
console.log("Dual-class labels (gold, .hw-card-class--dual):", dualLabel)
console.log("console/page errors:", errors)
await browser.close()

const hasDeathguardTwice = dualLabel.filter((t) => t === "Deathguard").length === 2
if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (hasDeathguardTwice) {
  console.log("PASS: both Ironbark and Briarblade show 'Deathguard' on their bench card once both are recruited (auto-deployed), screenshot saved")
  process.exit(0)
} else {
  console.log("FAIL: expected both cards to show Deathguard exactly twice, got", dualLabel)
  process.exit(1)
}
