import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - theme & polish pass. Marc: "kehitetään pelin visuaalista
// puolta" -> "yleisilme ja teema". Consolidated design tokens (type /
// radius / spacing / surface), 4 shared .hw-screen-* primitives, one
// subtle premium frame edge. CSS + inline->class swaps only - zero
// engine change. Verify: before/after screenshots + no layout
// regression + token wiring.

const BEFORE = process.env.BEFORE_PORT || 5173 // origin/development
const AFTER = process.env.PORT || 5342 // this worktree
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-theme"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()

// seed a run at a shop / formation / battle so those screens exist
async function seed(page, phase) {
  await page.evaluate(async (phase) => {
    const { RUN_PATH, startRun, serializeRun, actIndexForNode, startFormationBattle } = await import(
      "/src/services/heartwood/runEngine.js"
    )
    const idx = phase === "shop" ? 0 : RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
    let s = {
      ...startRun("tommy"),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: phase === "battle" ? "formation" : phase,
      essence: 400,
    }
    s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
    if (phase === "battle") s = startFormationBattle(s) // real battle state, not a bare phase flag
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: false }))
  }, phase)
}

async function captureSet(port, label) {
  const page = await (await browser.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
  const url = `http://localhost:${port}/heartwood`
  const out = {}

  // 1. character-select
  await page.goto(url)
  await page.waitForSelector(".hw-commander-card", { timeout: 15000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOT_DIR}/theme_select_${label}.png` })
  out.selectNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)

  // 2. Grove
  await page.click(".hw-grove-open-btn")
  await page.waitForSelector(".hw-grove", { timeout: 5000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOT_DIR}/theme_grove_${label}.png` })
  out.groveNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  await page.click(".hw-grove .hw-exit-link").catch(() => {})
  await page.waitForTimeout(200)

  // 3. Almanac (may not exist on BEFORE if branch is old - guarded)
  const almBtn = page.locator(".hw-almanac-open-btn")
  if (await almBtn.isVisible().catch(() => false)) {
    await almBtn.click()
    await page.waitForSelector(".hw-almanac-screen", { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOT_DIR}/theme_almanac_${label}.png` })
    out.almanacNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
    await page.click(".hw-almanac-screen .hw-exit-link").catch(() => {})
    await page.waitForTimeout(200)
  }

  // 4. Settings
  const setBtn = page.locator(".hw-settings-open-btn")
  if (await setBtn.isVisible().catch(() => false)) {
    await setBtn.click()
    await page.waitForSelector(".hw-settings", { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOT_DIR}/theme_settings_${label}.png` })
    out.settingsNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  }

  // 5. shop
  await seed(page, "shop")
  await page.reload()
  await page.waitForSelector(".hw-market-columns", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOT_DIR}/theme_shop_${label}.png` })
  out.shopNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  out.shopTitle = await page.locator("h1", { hasText: /Hearthwood Market/ }).first().evaluate((el) => {
    const cs = getComputedStyle(el)
    return { ff: cs.fontFamily, fs: cs.fontSize }
  }).catch(() => null)

  // 6. formation
  await seed(page, "formation")
  await page.reload()
  await page.waitForSelector(".hw-intro", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOT_DIR}/theme_formation_${label}.png` })
  out.formationNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)

  // 7. battle
  await seed(page, "battle")
  await page.reload()
  await page.waitForSelector(".hw-battle", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT_DIR}/theme_battle_${label}.png` })
  out.battleNoHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)

  out.errors = errs
  await page.close()
  return out
}

const before = await captureSet(BEFORE, "before")
const after = await captureSet(AFTER, "after")

// token wiring on the AFTER build
const tw = await (async () => {
  const page = await (await browser.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
  await page.goto(`http://localhost:${AFTER}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 15000 })
  await page.click(".hw-grove-open-btn")
  await page.waitForSelector(".hw-screen-title", { timeout: 5000 })
  const r = await page.evaluate(() => {
    const t = document.querySelector(".hw-screen-title")
    const f = document.querySelector(".hw-screen-frame")
    const e = document.querySelector(".hw-screen-eyebrow")
    const tcs = getComputedStyle(t)
    const fcs = getComputedStyle(f)
    const ecs = getComputedStyle(e)
    return {
      titleFont: tcs.fontFamily,
      titleSize: tcs.fontSize,
      frameShadow: fcs.boxShadow,
      eyebrowTransform: ecs.textTransform,
      eyebrowColor: ecs.color,
    }
  })
  await page.close()
  return r
})()

await browser.close()

console.log("BEFORE:", JSON.stringify(before, null, 2))
console.log("AFTER:", JSON.stringify(after, null, 2))
console.log("token wiring:", JSON.stringify(tw, null, 2))

const noHScroll = (o) =>
  Object.entries(o)
    .filter(([k]) => k.endsWith("NoHScroll"))
    .every(([, v]) => v === true)

const pass =
  noHScroll(after) &&
  after.errors.length === 0 &&
  /Cormorant/i.test(tw.titleFont) &&
  tw.titleSize === "26px" &&
  tw.frameShadow !== "none" &&
  tw.eyebrowTransform === "uppercase" &&
  /(Cormorant)/i.test(after.shopTitle?.ff || "") &&
  after.shopTitle?.fs === "22px"

console.log("\nno-h-scroll all screens:", noHScroll(after))
console.log("after page errors:", after.errors.length)
console.log("\nRESULT:", pass ? "PASS" : "FAIL")
console.log("(review .scratch/shots/theme_*_before.png vs *_after.png by eye)")
process.exit(pass ? 0 : 1)
