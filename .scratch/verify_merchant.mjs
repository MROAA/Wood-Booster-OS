import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - the traveling merchant (merchant.js / MerchantGreeting).
// Marc: "kehitetään pelin kauppasysteemiä" -> "kauppa tuntuu samalta
// joka kerta" -> "kiertävä kauppias hahmona". A named per-Act merchant
// with a hand-authored line chosen by Act x forestState x dominant
// tribe, deterministic in nodeIndex. Flavor only - no combat/economy
// impact, no RUN_SAVE_VERSION bump.

const PORT = process.env.PORT || 5335
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-merchant"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const { MERCHANTS, merchantForAct, merchantLine } = await import("/src/data/heartwood/merchant.js")
  const { RUN_PATH, startRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")

  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- persona lookup + clamp ----------------------------------------
  const names = [1, 2, 3, 4, 5].map((a) => merchantForAct(a).name)
  out.detail.names = names
  out.ok.actNames = eq(names, [
    "The Forest Trader",
    "The Heartwood Artisan",
    "The Veil Trader",
    "The Hollow Merchant",
    "The Echo Market",
  ])
  out.ok.clampLow = merchantForAct(0).name === "The Forest Trader" && merchantForAct(-3).name === "The Forest Trader"
  out.ok.clampHigh = merchantForAct(7).name === "The Echo Market" && merchantForAct(99).name === "The Echo Market"

  // ---- pool completeness -------------------------------------------
  const tribeKeys = ["wood", "grove", "ember", "tide", "stone", "cosmic", "shadow"]
  const nonEmptyArr = (x) => Array.isArray(x) && x.length > 0 && x.every((s) => typeof s === "string" && s.trim().length > 0)
  out.ok.poolsComplete = Object.values(MERCHANTS).every((m) => {
    if (!nonEmptyArr(m.generic) || m.generic.length < 2) return false
    if (!nonEmptyArr(m.byForest.purified) || !nonEmptyArr(m.byForest.corrupted)) return false
    if (typeof m.name !== "string" || typeof m.accent !== "string" || m.glyph !== "merchantGlyph") return false
    return tribeKeys.every((t) => nonEmptyArr(m.byTribe[t]))
  })
  // canon line present verbatim in Act IV generic
  out.ok.canonLine = MERCHANTS[4].generic.includes("Everything here has a price. None of the prices are Essence.")

  // ---- selector: find one shop node per Act ------------------------
  const shopNodeInAct = (act) => {
    for (let i = 0; i < RUN_PATH.length; i++) {
      if (RUN_PATH[i]?.type === "shop" && actIndexForNode(i, RUN_PATH.length) === act) return i
    }
    return -1
  }
  const act1Shop = shopNodeInAct(1)
  const act2Shop = shopNodeInAct(2)
  const act4Shop = shopNodeInAct(4)
  out.detail.shopNodes = { act1Shop, act2Shop, act4Shop }
  out.ok.foundShopNodes = act1Shop >= 0 && act2Shop >= 0 && act4Shop >= 0

  const mkRs = (nodeIndex, { forestState = "restless", deployed = [], bench = [] } = {}) => ({
    ...startRun("tommy"),
    nodeIndex,
    forestState,
    bench,
    deployed: [deployed[0] ?? null, deployed[1] ?? null, deployed[2] ?? null, deployed[3] ?? null],
  })

  // priority 1: non-restless forest wins
  const corruptRs = mkRs(act2Shop, { forestState: "corrupted" })
  const corruptLine = merchantLine(corruptRs)
  out.ok.forestPriority = MERCHANTS[2].byForest.corrupted.includes(corruptLine)
  out.detail.corruptLine = corruptLine

  // priority 2: restless + a real dominant tribe -> byTribe
  const emberRs = mkRs(act2Shop, {
    forestState: "restless",
    bench: [
      { key: 1, defId: "cinderpaw", upgradeLevel: 0 },
      { key: 2, defId: "ashmaw", upgradeLevel: 0 },
    ],
    deployed: [1, 2],
  })
  const emberLine = merchantLine(emberRs)
  out.ok.tribePriority = MERCHANTS[2].byTribe.ember.includes(emberLine)
  out.detail.emberLine = emberLine

  // priority 3: restless + empty board -> generic
  const genericRs = mkRs(act2Shop, { forestState: "restless" })
  const genericLine = merchantLine(genericRs)
  out.ok.genericFallback = MERCHANTS[2].generic.includes(genericLine)
  out.detail.genericLine = genericLine

  // ---- determinism -------------------------------------------------
  out.ok.deterministic =
    merchantLine(mkRs(act4Shop, { forestState: "corrupted" })) === merchantLine(mkRs(act4Shop, { forestState: "corrupted" })) &&
    merchantLine(emberRs) === merchantLine(mkRs(act2Shop, {
      forestState: "restless",
      bench: emberRs.bench,
      deployed: [1, 2],
    }))
  out.ok.noRngInSource = !/(Math\.random|Date\.now|crypto)/.test(merchantLine.toString() + merchantForAct.toString())

  // rotation: different nodeIndex in the same Act's generic pool can differ
  const g0 = merchantLine(mkRs(act1Shop))
  let rotates = false
  for (let i = 0; i < RUN_PATH.length; i++) {
    if (RUN_PATH[i]?.type === "shop" && actIndexForNode(i, RUN_PATH.length) === 1) {
      if (merchantLine(mkRs(i)) !== g0) { rotates = true; break }
    }
  }
  out.ok.lineRotatesAcrossVisits = rotates || MERCHANTS[1].generic.length === 1

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- UI: seed an Act I shop and an Act IV (corrupted) shop ----------
async function seedAndOpen(nodeIndex, forestState) {
  return page.evaluate(
    async ({ nodeIndex, forestState }) => {
      const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
      const s = startRun("tommy")
      s.essence = 999
      s.nodeIndex = nodeIndex
      s.path = RUN_PATH.slice(0, nodeIndex + 1)
      s.phase = "shop"
      s.forestState = forestState
      // Match lastSeenAct to where we're seeding so HeartwoodBattle's
      // Act-crossroads interstitial doesn't arm and cover the shop.
      s.lastSeenAct = actIndexForNode(nodeIndex, RUN_PATH.length)
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
      localStorage.setItem("heartwood-story-intro-seen", "true")
      return true
    },
    { nodeIndex, forestState },
  )
}

const shopNodes = r.detail.shopNodes

await seedAndOpen(shopNodes.act1Shop, "restless")
await page.reload()
await page.waitForSelector(".hw-merchant", { timeout: 8000 })
await page.waitForTimeout(400)
const name1 = (await page.locator(".hw-merchant-name").first().textContent())?.trim()
const line1 = (await page.locator(".hw-merchant-line").first().textContent())?.trim()
console.log("Act I merchant:", JSON.stringify(name1), "|", JSON.stringify(line1))
await page.locator(".hw-shop-center").first().screenshot({ path: `${SHOT_DIR}/merchant_A_act1.png` }).catch(() => {})
// page must not scroll horizontally at 1536x864
const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

await seedAndOpen(shopNodes.act4Shop, "corrupted")
await page.reload()
await page.waitForSelector(".hw-merchant", { timeout: 8000 })
await page.waitForTimeout(400)
const name4 = (await page.locator(".hw-merchant-name").first().textContent())?.trim()
const line4 = (await page.locator(".hw-merchant-line").first().textContent())?.trim()
console.log("Act IV (corrupted) merchant:", JSON.stringify(name4), "|", JSON.stringify(line4))
await page.locator(".hw-shop-center").first().screenshot({ path: `${SHOT_DIR}/merchant_B_act4_corrupted.png` }).catch(() => {})

await browser.close()

const uiOk =
  name1 === "The Forest Trader" &&
  !!line1 &&
  name4 === "The Hollow Merchant" &&
  line4 === "There's nothing left to corrupt. That's why it's quiet. Take what you like." &&
  noHScroll

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk, "| noHScroll:", noHScroll)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
