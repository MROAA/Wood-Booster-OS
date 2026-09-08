import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - battlefield spectacle + guided onboarding
// (feat/hearthwood-spectacle-onboarding). Two additive presentation
// layers, zero engine change. This proves: (A) the stage themes itself
// deterministically by Act / forestState / arena AND the board never
// moves; reduce-motion freezes the ambient layers; (B) the contextual
// coach fires one tip per mechanic, once, and is fully toggleable; the
// ? overlay renders.

const PORT = process.env.PORT || 5344
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-spectacle"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()

function ctx() {
  return browser.newContext({ viewport: { width: 1536, height: 864 } })
}

// Seed a battle at a given battle-node index, forestState + reduceMotion
// optional. Mirrors verify_theme_pass.mjs's seed helper.
async function seedBattle(page, { nodeIndex, forestState = "restless", reduceMotion = false }) {
  await page.evaluate(
    async ({ nodeIndex, forestState, reduceMotion }) => {
      const { RUN_PATH, startRun, serializeRun, actIndexForNode, startFormationBattle } = await import(
        "/src/services/heartwood/runEngine.js"
      )
      let s = {
        ...startRun("tommy"),
        nodeIndex,
        path: RUN_PATH.slice(0, nodeIndex + 1),
        phase: "formation",
        essence: 400,
        forestState,
      }
      s.lastSeenAct = actIndexForNode(nodeIndex, RUN_PATH.length)
      s = startFormationBattle(s)
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
      localStorage.setItem("heartwood-story-intro-seen", "true")
      localStorage.setItem(
        "heartwood-settings-v1",
        JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion }),
      )
    },
    { nodeIndex, forestState, reduceMotion },
  )
}

// Resolve a few useful battle node indices from the real RUN_PATH.
const nodes = await (async () => {
  const page = await (await ctx()).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
  const r = await page.evaluate(async () => {
    const { RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const { arenaForNode } = await import("/src/data/heartwood/arenas.js")
    // actIndexForNode is 1-based (1..7).
    const battles = RUN_PATH.map((n, i) => ({ i, type: n.type })).filter((n) => n.type === "battle")
    const act1 = battles.find((b) => actIndexForNode(b.i, RUN_PATH.length) === 1)
    const act4 = battles.find((b) => actIndexForNode(b.i, RUN_PATH.length) === 4)
    const arena = battles.find((b) => arenaForNode(b.i, actIndexForNode(b.i, RUN_PATH.length)))
    return { act1: act1?.i, act4: act4?.i, arena: arena?.i, arenaId: arena ? arenaForNode(arena.i, actIndexForNode(arena.i, RUN_PATH.length)) : null }
  })
  await page.close()
  return r
})()

async function arenaAttrs(page) {
  return page.evaluate(() => {
    const a = document.querySelector(".hw-arena")
    if (!a) return null
    const cs = getComputedStyle(a)
    const grid = document.querySelector(".hw-grid")?.getBoundingClientRect()
    const motes = document.querySelector(".hw-stage-motes")
    const piece = document.querySelector(".hw-piece")
    return {
      act: a.getAttribute("data-act"),
      forest: a.getAttribute("data-forest"),
      arena: a.getAttribute("data-arena"),
      accent: cs.getPropertyValue("--hw-stage-accent").trim(),
      motesPresent: !!motes,
      motesAnim: motes ? getComputedStyle(motes).animationName : null,
      pieceAnim: piece ? getComputedStyle(piece).animationName : null,
      grid: grid ? { w: Math.round(grid.width), h: Math.round(grid.height) } : null,
      noHScroll: document.documentElement.scrollWidth <= innerWidth + 1,
    }
  })
}

const out = {}

// --- A: spectacle varies + is deterministic + board is fixed ---------
{
  const page = await (await ctx()).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

  await seedBattle(page, { nodeIndex: nodes.act1 })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(400)
  const a1 = await arenaAttrs(page)
  await page.screenshot({ path: `${SHOT_DIR}/spectacle_act1.png` })

  // same seed again -> identical (save-safe / deterministic)
  await seedBattle(page, { nodeIndex: nodes.act1 })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(300)
  const a1b = await arenaAttrs(page)

  await seedBattle(page, { nodeIndex: nodes.act4 })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(400)
  const a4 = await arenaAttrs(page)
  await page.screenshot({ path: `${SHOT_DIR}/spectacle_act4.png` })

  await seedBattle(page, { nodeIndex: nodes.act1, forestState: "corrupted" })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(400)
  const corrupt = await arenaAttrs(page)
  await page.screenshot({ path: `${SHOT_DIR}/spectacle_corrupted.png` })

  await seedBattle(page, { nodeIndex: nodes.arena })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(400)
  const arena = await arenaAttrs(page)
  const arenaWash = await page.evaluate(() => {
    const el = document.querySelector(".hw-arena[data-arena]")
    if (!el) return null
    return getComputedStyle(el).getPropertyValue("--hw-arena-wash").trim()
  })
  await page.screenshot({ path: `${SHOT_DIR}/spectacle_arena.png` })

  // Board-invariance is checked across SAME-node variants only (a1 / a1b
  // / corrupt / arena are all the first Act-I battle node) - a4 is a
  // different node with different enemies, so its board legitimately
  // differs in height (rows size to content). The point: turning the
  // spectacle layers on/varying them never moves the board.
  const sameNode = [a1, a1b, corrupt, arena]
  out.spectacle = { a1, a4, corrupt, arena, arenaWash, arenaId: nodes.arenaId }
  out.spectacleOk =
    a1.act === "1" &&
    a4.act === "4" &&
    a1.accent !== a4.accent &&
    a1.act === a1b.act &&
    a1.accent === a1b.accent &&
    a1.motesPresent &&
    a1.motesAnim === "hw-stage-drift" &&
    corrupt.forest === "corrupted" &&
    arena.arena === nodes.arenaId &&
    !!arenaWash &&
    arenaWash !== "transparent" &&
    sameNode.every(
      (v) => v.grid && Math.abs(v.grid.w - a1.grid.w) <= 2 && Math.abs(v.grid.h - a1.grid.h) <= 2 && v.noHScroll,
    ) &&
    a4.noHScroll

  await page.close()
}

// --- A: reduce motion freezes the ambient layers --------------------
// Two independent mechanisms: the OS/browser prefers-reduced-motion
// media query (my new @media block -> animation: none) and the app's
// own Reduce Motion setting (.hw-reduce-motion nuclear rule ->
// animation-duration 1ms). Check both.
{
  // (1) prefers-reduced-motion media query
  const page = await (await browser.newContext({ viewport: { width: 1536, height: 864 }, reducedMotion: "reduce" })).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
  await seedBattle(page, { nodeIndex: nodes.act1 })
  await page.reload()
  await page.waitForSelector(".hw-arena", { timeout: 8000 })
  await page.waitForTimeout(300)
  const media = await page.evaluate(() => ({
    motes: getComputedStyle(document.querySelector(".hw-stage-motes")).animationName,
    piece: getComputedStyle(document.querySelector(".hw-piece")).animationName,
  }))
  await page.close()

  // (2) app Reduce Motion setting -> .hw-reduce-motion on <html>
  const page2 = await (await ctx()).newPage()
  await page2.goto(`http://localhost:${PORT}/heartwood`)
  await page2.waitForSelector(".hw-commander-card", { timeout: 20000 })
  await seedBattle(page2, { nodeIndex: nodes.act1, reduceMotion: true })
  await page2.reload()
  await page2.waitForSelector(".hw-arena", { timeout: 8000 })
  await page2.waitForTimeout(300)
  const setting = await page2.evaluate(() => ({
    htmlClass: document.documentElement.classList.contains("hw-reduce-motion"),
    motesDur: getComputedStyle(document.querySelector(".hw-stage-motes")).animationDuration,
  }))
  await page2.close()

  out.reduceMotion = { media, setting }
  out.reduceMotionOk =
    media.motes === "none" &&
    media.piece === "none" &&
    setting.htmlClass === true &&
    parseFloat(setting.motesDur) <= 0.01
}

// --- B: coach fires once, is toggleable ----------------------------
{
  const page = await (await ctx()).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
  await page.evaluate(() => {
    localStorage.removeItem("heartwood-coach-seen-v1")
    localStorage.removeItem("heartwood-coach-enabled-v1")
  })
  // seed a plain shop
  await page.evaluate(async () => {
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const s = {
      ...startRun("tommy"),
      nodeIndex: 0,
      path: RUN_PATH.slice(0, 1),
      phase: "shop",
      essence: 300,
    }
    s.lastSeenAct = actIndexForNode(0, RUN_PATH.length)
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
  })
  await page.reload()
  await page.waitForSelector(".hw-coach-tip", { timeout: 8000 })
  const tipText = await page.textContent(".hw-coach-tip-title")
  await page.screenshot({ path: `${SHOT_DIR}/coach_shop.png` })
  await page.click(".hw-coach-tip .hw-tutorial-next")
  await page.waitForTimeout(300)
  const seenAfter = await page.evaluate(() => localStorage.getItem("heartwood-coach-seen-v1"))
  // no cascade: dismissing one tip suppresses the rest of THIS screen's
  // tips for the session
  const stillShowing = await page.locator(".hw-coach-tip").count()

  // a dismissed tip never returns (the seen-set is persisted)
  await page.reload()
  await page.waitForSelector(".hw-market-columns", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)
  const shopTipBack = await page
    .locator(".hw-coach-tip-title", { hasText: "The Hearthwood Market" })
    .count()

  // disable entirely -> no tip even for an unseen mechanic
  await page.evaluate(() => {
    localStorage.removeItem("heartwood-coach-seen-v1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-market-columns", { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)
  const disabledCount = await page.locator(".hw-coach-tip").count()

  out.coach = { tipText, seenAfter, stillShowing, shopTipBack, disabledCount }
  out.coachOk =
    tipText === "The Hearthwood Market" &&
    (seenAfter || "").includes("shop") &&
    stillShowing === 0 &&
    shopTipBack === 0 &&
    disabledCount === 0
  await page.close()
}

// --- B: help overlay ---------------------------------------------
{
  const page = await (await ctx()).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
  await page.click(".hw-help-open-btn")
  await page.waitForSelector(".hw-help-screen", { timeout: 5000 })
  await page.waitForTimeout(300)
  const help = await page.evaluate(async () => {
    const { HELP_SECTIONS } = await import("/src/data/heartwood/help.js")
    const title = document.querySelector(".hw-screen-title")?.textContent
    const headings = [...document.querySelectorAll(".hw-help-heading")].map((h) => h.textContent)
    return {
      title,
      allHeadings: HELP_SECTIONS.every((s) => headings.includes(s.heading)),
      count: headings.length,
      expected: HELP_SECTIONS.length,
      noHScroll: document.documentElement.scrollWidth <= innerWidth + 1,
    }
  })
  await page.screenshot({ path: `${SHOT_DIR}/help_overlay.png` })
  await page.click(".hw-help-screen .hw-utility-btn")
  await page.waitForTimeout(200)
  const closed = (await page.locator(".hw-help-screen").count()) === 0
  out.help = { ...help, closed }
  out.helpOk = help.title === "How Hearthwood works" && help.allHeadings && help.count === help.expected && help.noHScroll && closed
  await page.close()
}

await browser.close()

console.log(JSON.stringify(out, null, 2))
const checks = ["spectacleOk", "reduceMotionOk", "coachOk", "helpOk"]
const failed = checks.filter((k) => !out[k])
console.log("\nfailed:", failed.length ? failed : "none")
console.log("RESULT:", failed.length ? "FAIL" : "PASS")
process.exit(failed.length ? 1 : 0)
