import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Essence interest ("säästä vai käytä" -jännite). Marc:
// "kehitetään kauppaan lisää syvyyttä" -> "säästä vai käytä" -> "korko
// koko saldolle (TFT-tyyli)". The Essence you carry into a fight grows
// a little on a win (bankInterest), capped, paid in resolveBattleOutcome
// - never mid-combat, never on a boss win. No new runState field, no
// RUN_SAVE_VERSION bump.

const PORT = process.env.PORT || 5336
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-interest"
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
  const {
    bankInterest,
    INTEREST_RATE,
    INTEREST_THRESHOLD,
    INTEREST_CAP,
    essenceForWin,
    resolveBattleOutcome,
    RUN_PATH,
    startRun,
  } = await import("/src/services/heartwood/runEngine.js")

  const out = { ok: {}, detail: {} }

  // ---- 1. bankInterest curve ---------------------------------------
  out.detail.consts = { INTEREST_RATE, INTEREST_THRESHOLD, INTEREST_CAP }
  out.ok.curve =
    bankInterest(0) === 0 &&
    bankInterest(INTEREST_THRESHOLD - 1) === 0 &&
    bankInterest(INTEREST_THRESHOLD) === Math.floor(INTEREST_THRESHOLD * INTEREST_RATE) &&
    bankInterest(300) === 30 &&
    bankInterest(1499) === 149 &&
    bankInterest(1500) === INTEREST_CAP &&
    bankInterest(5000) === INTEREST_CAP
  out.ok.noRngInSource = !/(Math\.random|Date\.now|crypto)/.test(bankInterest.toString())
  out.ok.pureRepeat = bankInterest(777) === bankInterest(777)

  // ---- shared: a non-boss battle node + the boss node --------------
  let battleIdx = -1
  for (let i = 1; i < RUN_PATH.length - 1; i++) {
    if (RUN_PATH[i]?.type === "battle" && RUN_PATH[i + 1]?.type === "shop") {
      battleIdx = i
      break
    }
  }
  const bossIdx = RUN_PATH.findIndex((n) => n?.type === "boss")
  out.detail.idx = { battleIdx, bossIdx }

  const mkWon = (essence, nodeIndex = battleIdx) => ({
    ...startRun("tommy"),
    nodeIndex,
    path: RUN_PATH.slice(0, nodeIndex + 1),
    battlePool: [],
    phase: "battle",
    essence,
    battle: { phase: "won" },
  })

  // ---- 2. win branch pays interest --------------------------------
  const rs500 = mkWon(500)
  const node = rs500.path[rs500.nodeIndex]
  const base500 = essenceForWin(rs500, node)
  const after500 = resolveBattleOutcome(mkWon(500))
  out.ok.paysInterest = after500.essence === 500 + base500 + bankInterest(500)
  out.ok.interestIs50 = bankInterest(500) === 50
  out.detail.after500 = { essence: after500.essence, base: base500, interest: bankInterest(500) }

  const after100 = resolveBattleOutcome(mkWon(100))
  const base100 = essenceForWin(mkWon(100), node)
  out.ok.belowThresholdNoInterest = after100.essence === 100 + base100 + 0

  const after3000 = resolveBattleOutcome(mkWon(3000))
  const base3000 = essenceForWin(mkWon(3000), node)
  out.ok.capApplied = after3000.essence === 3000 + base3000 + INTEREST_CAP

  // ---- 3. boss win pays none -------------------------------------
  const bossAfter = resolveBattleOutcome(mkWon(2000, bossIdx))
  out.ok.bossNoInterest = bossAfter.phase === "victory" && bossAfter.essence === 2000

  // ---- 4. compounding across two wins (no spend) ----------------
  // resolveBattleOutcome advances the node; feed it forward twice.
  const step1 = resolveBattleOutcome(mkWon(500))
  const gain1 = step1.essence - 500
  // build a fresh won-state at step1's balance to model "next fight,
  // nothing bought" - the interest term must be >= the first (balance
  // only grew) and both deterministic.
  const step2 = resolveBattleOutcome(mkWon(step1.essence))
  const gain2 = step2.essence - step1.essence
  out.ok.compounds = bankInterest(step1.essence) >= bankInterest(500) && gain2 >= gain1
  out.ok.deterministic =
    resolveBattleOutcome(mkWon(500)).essence === resolveBattleOutcome(mkWon(500)).essence
  out.detail.compound = { gain1, gain2, bal1: step1.essence, bal2: step2.essence }

  // ---- 5. preview matches payout --------------------------------
  const previewRs = mkWon(640)
  const preview = essenceForWin(previewRs, previewRs.path[previewRs.nodeIndex]) + bankInterest(previewRs.essence)
  const actual = resolveBattleOutcome(mkWon(640)).essence - 640
  out.ok.previewMatchesPayout = preview === actual
  out.detail.preview = { preview, actual }

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- 6. UI: shop badge tracks the balance live --------------------
async function seedShop(essence) {
  return page.evaluate(async (essence) => {
    const { RUN_PATH, startRun, serializeRun } = await import("/src/services/heartwood/runEngine.js")
    const s = startRun("tommy")
    s.essence = essence
    s.nodeIndex = 0
    s.path = RUN_PATH.slice(0, 1)
    s.phase = "shop"
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    return true
  }, essence)
}

await seedShop(800)
await page.reload()
await page.waitForSelector(".hw-essence-interest", { timeout: 8000 })
await page.waitForTimeout(400)
const badge800 = (await page.locator(".hw-essence-interest").first().textContent())?.trim()
console.log("essence 800 -> badge:", JSON.stringify(badge800))

// recruit the cheapest offer, badge should drop by (10% of price, floored delta)
const before = await page.locator(".hw-essence-value").first().textContent()
const firstOffer = page.locator(".hw-panel--market .hw-card[data-disabled=\"false\"]").first()
let badgeAfterBuy = badge800
if (await firstOffer.isVisible().catch(() => false)) {
  await firstOffer.click()
  await page.waitForTimeout(500)
  badgeAfterBuy = (await page.locator(".hw-essence-interest").first().textContent())?.trim()
}
const afterBal = await page.locator(".hw-essence-value").first().textContent()
console.log("after recruit: balance", before, "->", afterBal, "| badge:", JSON.stringify(badgeAfterBuy))
await page.locator(".hw-market-top-row").first().screenshot({ path: `${SHOT_DIR}/interest_A_shop_800.png` }).catch(() => {})

await seedShop(100)
await page.reload()
await page.waitForSelector(".hw-essence-interest", { timeout: 8000 })
await page.waitForTimeout(400)
const badge100 = (await page.locator(".hw-essence-interest").first().textContent())?.trim()
const dormant = await page.locator(".hw-essence-interest--dormant").isVisible().catch(() => false)
console.log("essence 100 -> badge:", JSON.stringify(badge100), "| dormant:", dormant)
await page.locator(".hw-market-top-row").first().screenshot({ path: `${SHOT_DIR}/interest_B_shop_100.png` }).catch(() => {})

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

await browser.close()

const uiOk =
  badge800 === "▲ +80" &&
  /^▲ \+\d+$/.test(badgeAfterBuy || "") &&
  Number((badgeAfterBuy || "").replace(/\D/g, "")) < 80 &&
  dormant &&
  !/\+0/.test(badge100 || "") &&
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
