import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood shop: The Gamble. Marc: "the game needs also gamble
// mechanic ... with gambler addition" - an ACTIVE wager the player
// takes themselves (distinct from The Gambler economy unit, which only
// reweights which random Market Event shows up). A standing shop
// button, same shape as Reroll: spend GAMBLE_COST Essence for an
// unchosen random item, or rarely a relic (otherwise never purchasable
// - relics are normally only a free node-choice reward).

const PORT = process.env.PORT || 5507
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-gamble"
const DIR = `${ROOT}/.scratch/shots`
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const out = { ok: {}, detail: {} }

// ---- 1. Pure engine logic ----------------------------------------
const engine = await page.evaluate(async () => {
  const { gambleShop, GAMBLE_COST, startRun, leaveShop, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const r = { ok: {}, detail: {} }

  r.detail.GAMBLE_COST = GAMBLE_COST

  // Refuses when broke.
  const broke = { ...startRun("tommy"), essence: GAMBLE_COST - 1 }
  const brokeResult = gambleShop(broke)
  r.ok.refusesBroke = brokeResult.essence === broke.essence && !brokeResult.lastGambleReward

  // A single pull: essence deducted, a reward recorded, and either the
  // bag or the relics list actually grew by exactly one.
  const rs = { ...startRun("tommy"), essence: 5000, seed: 777, nodeIndex: 2 }
  const itemCountBefore = rs.items.length
  const relicCountBefore = rs.relics.length
  const after = gambleShop(rs)
  r.detail.reward = after.lastGambleReward
  r.ok.deductsEssence = after.essence === rs.essence - GAMBLE_COST
  r.ok.recordsReward = !!after.lastGambleReward && ["item", "relic"].includes(after.lastGambleReward.kind)
  if (after.lastGambleReward?.kind === "item") {
    r.ok.grantsOneItem =
      after.items.length === itemCountBefore + 1 &&
      after.items[after.items.length - 1].defId === after.lastGambleReward.defId &&
      !!ITEMS[after.lastGambleReward.defId]
    r.ok.relicsUnchanged = after.relics.length === relicCountBefore
  } else {
    r.ok.grantsOneRelic =
      after.relics.length === relicCountBefore + 1 &&
      after.relics[after.relics.length - 1] === after.lastGambleReward.defId &&
      !!RELICS[after.lastGambleReward.defId]
    r.ok.itemsUnchanged = after.items.length === itemCountBefore
  }

  // Deterministic: same seed/nodeIndex/gamble-count -> same reward.
  const a = gambleShop({ ...startRun("tommy"), essence: 5000, seed: 42, nodeIndex: 5 })
  const b = gambleShop({ ...startRun("tommy"), essence: 5000, seed: 42, nodeIndex: 5 })
  r.ok.deterministic = JSON.stringify(a.lastGambleReward) === JSON.stringify(b.lastGambleReward)

  // Repeatable: a 2nd pull (with essence for it) is a fresh independent
  // roll, not stuck repeating the first outcome, and each of the 3
  // outcome kinds is reachable across enough seeds.
  const tally = { item: 0, relic: 0 }
  const relicIds = new Set()
  const itemIds = new Set()
  for (let s = 0; s < 300; s++) {
    const res = gambleShop({ ...startRun("tommy"), essence: 5000, seed: s, nodeIndex: 3 })
    tally[res.lastGambleReward.kind]++
    if (res.lastGambleReward.kind === "relic") relicIds.add(res.lastGambleReward.defId)
    else itemIds.add(res.lastGambleReward.defId)
  }
  r.detail.tally = tally
  r.detail.distinctRelics = relicIds.size
  r.detail.distinctItems = itemIds.size
  // ~25% relic band over 300 rolls - wide tolerance for RNG noise.
  r.ok.bothKindsReachable = tally.item > 150 && tally.relic > 30 && tally.relic < 130
  r.ok.variesAcrossPulls = relicIds.size > 3 && itemIds.size > 5

  // A relic already owned this run is never handed out again.
  const owned = relicPool()[0].id
  let dupeFound = false
  for (let s = 0; s < 200; s++) {
    const res = gambleShop({ ...startRun("tommy"), essence: 5000, seed: s, nodeIndex: 7, relics: [owned] })
    if (res.lastGambleReward.kind === "relic" && res.lastGambleReward.defId === owned) dupeFound = true
  }
  r.ok.neverDuplicatesOwnedRelic = !dupeFound

  // leaveShop clears the reveal so it never carries into a later visit.
  const withReward = { ...startRun("tommy"), lastGambleReward: { kind: "item", defId: "twig-charm" }, phase: "shop", path: RUN_PATH.slice(0, 1), nodeIndex: 0 }
  r.ok.leaveShopClearsReveal = leaveShop(withReward).lastGambleReward === null

  return r
})
out.ok = { ...out.ok, ...engine.ok }
out.detail = { ...out.detail, ...engine.detail }

// ---- 2. Real UI ---------------------------------------------------
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = 0
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 4000,
    seed: 777,
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
})
await page.reload()
await page.waitForSelector(".hw-gamble-btn", { timeout: 10000 })
await page.waitForTimeout(300)
const gotIt = page.locator("button", { hasText: "Got it" })
if (await gotIt.count()) await gotIt.click()
await page.waitForTimeout(200)

const essenceBefore = await page.locator(".hw-essence-value").textContent()
const gambleBtn = page.locator(".hw-gamble-btn")
out.ok.buttonVisible = await gambleBtn.isVisible()
await gambleBtn.click()
await page.waitForTimeout(300)
const essenceAfter = await page.locator(".hw-essence-value").textContent()
out.detail.essenceBefore = essenceBefore
out.detail.essenceAfter = essenceAfter
out.ok.essenceDropsInUI = Number(essenceAfter.replace(/\D/g, "")) === Number(essenceBefore.replace(/\D/g, "")) - engine.detail.GAMBLE_COST

const revealText = await page.locator(".hw-gamble-reveal").textContent().catch(() => "")
out.detail.revealText = revealText
out.ok.revealShowsInUI = revealText.length > 0 && revealText.includes("You won")

await page.screenshot({ path: `${DIR}/shop_gamble_reveal.png`, fullPage: true })

// A 2nd click (repeatable) works and updates the reveal / essence again.
const essenceMid = await page.locator(".hw-essence-value").textContent()
await gambleBtn.click()
await page.waitForTimeout(300)
const essenceEnd = await page.locator(".hw-essence-value").textContent()
out.ok.repeatable = Number(essenceEnd.replace(/\D/g, "")) === Number(essenceMid.replace(/\D/g, "")) - engine.detail.GAMBLE_COST

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
