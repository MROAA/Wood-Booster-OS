// PR4 UI verify: play the real flow to the Formation screen with a
// squad that lights a cross-tribe combo AND a positional synergy, and
// confirm the new "Combos" / "Formation bonuses" rows and the glowing
// grid tiles render without error. Screenshot as proof.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5313
const OUT = process.env.OUT_DIR || ".scratch"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(700)

// Inject a shop offering 4 units: nightveil + wraithcaller are both
// spirit+shadow, rootfang + frostbind are root -> shadow 2 + spirit 2
// lights the "eclipse" combo, and a back row of shadow/root units
// lights "backline-coven".
await page.evaluate(async () => {
  const m = await import("/src/services/heartwood/runEngine.js")
  let rs = m.startRun("tommy")
  rs = { ...rs, essence: 9999, shopOffers: ["nightveil", "wraithcaller", "rootfang", "frostbind"] }
  window.localStorage.setItem("heartwood-run-save-v1", JSON.stringify(m.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(900)

// Dismiss the "Got it" tutorial toast if present.
const gotIt = page.locator('button:has-text("Got it")')
if (await gotIt.count()) { await gotIt.first().click(); await page.waitForTimeout(200) }

for (const name of ["Nightveil", "Wraithcaller", "Rootfang", "Frostbind"]) {
  const card = page.locator(`.hw-card:has-text("${name}")`).first()
  await card.waitFor({ state: "visible", timeout: 5000 })
  await card.click()
  await page.waitForTimeout(350)
}

// Walk shop -> node intro -> path choice -> Formation. Click whatever
// forward affordance is present each step until the Battlefield label
// (FormationScreen) shows.
for (let i = 0; i < 8; i++) {
  if (await page.locator('.hw-section-label:has-text("Battlefield")').count()) break
  const cont = page.locator('button:has-text("Continue")').first()
  if (await cont.count()) {
    await cont.click()
  } else {
    // path-choice screen: click the first encounter option
    const choice = page.locator('[class*="choice"], .hw-floor-choice, .hw-select-grid > *').first()
    if (await choice.count()) await choice.click()
    else break
  }
  await page.waitForTimeout(800)
}
await page.waitForTimeout(500)

const res = await page.evaluate(() => {
  const labels = [...document.querySelectorAll(".hw-section-label")].map((e) => e.textContent.trim())
  const activeBadges = [...document.querySelectorAll(".hw-badge--active")].map((e) => e.textContent.trim())
  const bonusCells = document.querySelectorAll('.hw-grid-cell[data-formation-bonus="true"]').length
  return { labels, activeBadges, bonusCells }
})

console.log(JSON.stringify(res, null, 2))
await page.screenshot({ path: `${OUT}/pr4_formation_synergies.png`, fullPage: true })
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")

// This squad (2 spirit+shadow, 2 root, all in the back row) lights the
// "eclipse" combo and the "backline-coven" formation bonus.
const pass =
  res.labels.includes("Combos") &&
  res.labels.includes("Formation bonuses") &&
  res.activeBadges.some((b) => /Shadow \+ Spirit/i.test(b)) &&
  res.activeBadges.some((b) => /back row is Root or Shadow/i.test(b)) &&
  res.bonusCells >= 3 &&
  errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
