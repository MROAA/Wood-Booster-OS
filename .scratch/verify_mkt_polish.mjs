import { chromium } from "playwright"

const PORT = 5196
const errors = []
const out = {}
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`))
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`) })

const seen = async (loc, t = 3000) => loc.first().waitFor({ state: "visible", timeout: t }).then(() => true).catch(() => false)
const clickIf = async (loc, t = 3000) => { if (await seen(loc, t)) { await loc.first().click().catch(() => {}); return true } return false }

const overflow = async (label) => {
  const v = await page.evaluate(() => {
    const r = document.querySelector(".hw-root")
    return { sh: r.scrollHeight, ch: r.clientHeight }
  })
  const diff = v.sh - v.ch
  out[label] = diff
  console.log(`overflow ${label}: scrollHeight ${v.sh} - clientHeight ${v.ch} = ${diff}`)
  return diff
}

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
await page.locator(".hw-commander-card").first().click()

// Guild Hall arrival screen
await clickIf(page.locator(".hw-guildhall-cta"), 8000)

await page.waitForSelector(".hw-shop-3zone-stage .hw-market-columns", { timeout: 20000 })
await page.waitForTimeout(500)

// tutorial hint
if (await clickIf(page.locator("button.hw-tutorial-next"), 3000)) await page.waitForTimeout(300)

// rail sanity
out.rail = await page.evaluate(() => ({
  acts: document.querySelectorAll(".hw-run-rail-act").length,
  pips: document.querySelectorAll(".hw-run-rail-pip").length,
  current: document.querySelectorAll('.hw-run-rail-pip[data-state="current"]').length,
  railPresent: !!document.querySelector(".hw-shop-rail--right .hw-run-rail"),
}))
console.log("rail:", JSON.stringify(out.rail))

await page.screenshot({ path: "/tmp/mktpolish-market.png" })
await overflow("market")

// recruit 2
const featured = () => page.locator('.hw-market-featured-grid .hw-card[data-disabled="false"]')
for (let i = 0; i < 2; i++) {
  const c = featured().first()
  if (await c.count()) { await c.click(); await page.waitForTimeout(350) }
}
await page.screenshot({ path: "/tmp/mktpolish-market-2.png" })
await overflow("market_after_recruit2")

// Your Squad tab
await page.locator(".hw-squad-tab-btn").click()
await page.waitForTimeout(400)
await page.screenshot({ path: "/tmp/mktpolish-squad.png" })
await overflow("squad")

// ---- drive toward a full bench (4 deployed + 6 reserve = 10) ----
const benchCount = async () => page.evaluate(() => {
  const b = document.querySelector(".hw-squad-count-badge")
  return b ? parseInt(b.textContent.trim(), 10) : -1
})

let loops = 0
while ((await benchCount()) < 10 && loops < 9) {
  loops++
  // Market tab, buy everything affordable
  await page.locator(".hw-market-tab-btn").click().catch(() => {})
  await page.waitForTimeout(250)
  for (let i = 0; i < 6; i++) {
    const c = featured().first()
    if (await c.count()) { await c.click().catch(() => {}); await page.waitForTimeout(250) } else break
  }
  if ((await benchCount()) >= 10) break
  // Continue out of shop
  const cont = page.locator('button.hw-end-turn:has-text("Continue"), button.hw-shop-confirm-btn')
  await cont.first().click().catch(() => {})
  await page.waitForTimeout(500)
  // map-after-shop interstitial Continue
  if (await clickIf(page.locator('button.hw-end-turn:has-text("Continue")'), 3000)) await page.waitForTimeout(500)
  // FloorChoice
  if (await seen(page.locator(".hw-select-grid .hw-card--power"), 2500)) {
    if (!(await clickIf(page.locator('button.hw-move-btn:has-text("Skip")'), 500))) {
      await page.locator(".hw-select-grid .hw-card--power").first().click().catch(() => {})
    }
    await page.waitForTimeout(500)
  }
  // FormationScreen
  await clickIf(page.locator('button:has-text("Start Battle")'), 5000)
  // battle auto-resolves -> ResultOverlay Continue
  const resultCont = page.locator('.hw-overlay button.hw-end-turn, button.hw-end-turn:has-text("Continue")')
  await resultCont.first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(400)
  await resultCont.first().click().catch(() => {})
  await page.waitForTimeout(700)
  // possible RelicChoice after battle
  if (await clickIf(page.locator('button.hw-move-btn:has-text("Skip")'), 2500)) await page.waitForTimeout(500)
  // back at shop
  await page.waitForSelector(".hw-shop-3zone-stage .hw-market-columns", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(300)
  console.log(`loop ${loops}: bench = ${await benchCount()}`)
}

out.finalBench = await benchCount()
console.log("final bench count:", out.finalBench)

// Squad tab maxed
await page.locator(".hw-squad-tab-btn").click().catch(() => {})
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/mktpolish-maxbench.png" })
await overflow("maxbench_squad")

// ---- populate the left rail (relics + items) for the legibility shot ----
await page.locator(".hw-market-tab-btn").click().catch(() => {})
await page.waitForTimeout(250)
// buy an item if affordable, then cancel the equip prompt
const itemCard = page.locator('.hw-market-items-grid .hw-card[data-disabled="false"]').first()
if (await itemCard.count()) { await itemCard.click().catch(() => {}); await page.waitForTimeout(300) }
await clickIf(page.locator('button.hw-hint-cancel:has-text("Cancel")'), 1500)
await page.waitForTimeout(200)
// advance through nodes until a relic screen, pick a relic, land back in shop
for (let i = 0; i < 6; i++) {
  await clickIf(page.locator('button.hw-end-turn:has-text("Continue"), button.hw-shop-confirm-btn'), 3000)
  await page.waitForTimeout(400)
  await clickIf(page.locator('button.hw-end-turn:has-text("Continue")'), 2500)
  await page.waitForTimeout(400)
  // relic screen? (has a Skip button alongside the option cards)
  if (await seen(page.locator('button.hw-move-btn:has-text("Skip")'), 1500)) {
    await page.locator(".hw-select-grid .hw-card--power").first().click().catch(() => {})
    await page.waitForTimeout(500)
    break
  }
  // floor choice
  if (await seen(page.locator(".hw-select-grid .hw-card--power"), 1500)) {
    await page.locator(".hw-select-grid .hw-card--power").first().click().catch(() => {})
    await page.waitForTimeout(400)
  }
  // battle
  await clickIf(page.locator('button:has-text("Start Battle")'), 4000)
  const rc = page.locator('.hw-overlay button.hw-end-turn, button.hw-end-turn:has-text("Continue")')
  await rc.first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(400)
  await rc.first().click().catch(() => {})
  await page.waitForTimeout(600)
}
await page.waitForSelector(".hw-shop-3zone-stage .hw-market-columns", { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(400)
out.railPopulated = await page.evaluate(() => ({
  relics: document.querySelectorAll(".hw-shop-rail--left .hw-rail-chip:not(.hw-rail-chip--item)").length,
  items: document.querySelectorAll(".hw-shop-rail--left .hw-rail-chip--item").length,
}))
console.log("left rail populated:", JSON.stringify(out.railPopulated))
await page.screenshot({ path: "/tmp/mktpolish-relic-rail.png" })
// tight crop of just the left rail
const leftRail = page.locator(".hw-shop-rail--left")
if (await leftRail.count()) await leftRail.screenshot({ path: "/tmp/mktpolish-leftrail-crop.png" }).catch(() => {})
await overflow("market_with_relics")

out.errors = errors
console.log("\n=== errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
console.log("\n=== summary ===")
console.log(JSON.stringify(out, null, 2))
await browser.close()
