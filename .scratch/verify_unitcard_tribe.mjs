// PR2 verify: the promoted tribe band on the unit card - a labelled
// colour band under the cost/HP row, a tribe-colour top edge, and two
// badges for a unit that has both a mechanical and an elemental tribe.
// Screenshot as proof.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5311
const OUT = process.env.OUT_DIR || ".scratch"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(600)

const injected = await page.evaluate(async () => {
  const mod = await import("/src/services/heartwood/runEngine.js")
  let rs = mod.startRun("tommy")
  // abyssong = spirit + tide (2 tribes incl. elemental); the-lovers =
  // thorn + fang (2 mechanical, from PR1); the-fool = single tribe.
  rs = { ...rs, essence: 999, shopOffers: ["abyssong", "the-lovers", "the-fool"] }
  window.localStorage.setItem("heartwood-run-save-v1", JSON.stringify(mod.serializeRun(rs)))
  return true
})
if (!injected) { console.log("FAIL: inject"); await browser.close(); process.exit(1) }

await page.reload()
await page.waitForTimeout(900)

const res = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".hw-card")]
  const info = cards.map((c) => ({
    name: c.querySelector(".hw-card-name")?.textContent?.trim(),
    bandPresent: !!c.querySelector(".hw-tribe-band"),
    edgePresent: !!c.querySelector(".hw-card-tribe-edge"),
    badges: [...c.querySelectorAll(".hw-tribe-badge")].map((b) => b.textContent.trim()),
  }))
  return { count: cards.length, info }
})

console.log(JSON.stringify(res, null, 2))
await page.screenshot({ path: `${OUT}/unitcard_tribe_band.png`, fullPage: false })
console.log(`screenshot -> ${OUT}/unitcard_tribe_band.png`)
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")

// Only unit cards carry a tribe band; item cards (Cascading Claw etc.)
// correctly have none. Check the unit cards - the ones with >=1 badge.
const unitCards = res.info.filter((c) => c.badges.length >= 1)
const twoTagCard = unitCards.find((c) => c.badges.length === 2)
const oneTagCard = unitCards.find((c) => c.badges.length === 1)
const pass =
  unitCards.length >= 3 &&
  unitCards.every((c) => c.bandPresent && c.edgePresent) &&
  !!twoTagCard &&
  !!oneTagCard &&
  errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
