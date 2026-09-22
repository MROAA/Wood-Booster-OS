// Corrected re-verification of ALL 5 already-shipped Free Layout
// screens (Settings #543, CommanderSelect+GuildHall #545,
// StoryCinematic+ActTransition #546) against the margin-collapse fix
// in useFreeLayout.jsx/heartwood.css (PR 4's worktree, which already
// has all 5 screens' code merged in from development). This time
// measuring the ACTUAL VISIBLE CONTENT inside each wrapper, not just
// the wrapper's own rect - the wrapper-only check is what silently
// missed this bug across 3 already-merged PRs.
import { chromium } from "playwright"

const PORT = 5187
const browser = await chromium.launch()
const errs = []

async function contentRect(page, wrapperIndex, containerSelector) {
  return page.evaluate(({ wrapperIndex, containerSelector }) => {
    const container = document.querySelector(containerSelector)
    const wrapper = container.children[wrapperIndex]
    const content = [...wrapper.children].find((c) => !c.classList.contains("hw-free-layout-controls")) || wrapper
    return { wrapper: wrapper.getBoundingClientRect().toJSON(), content: content.getBoundingClientRect().toJSON() }
  }, { wrapperIndex, containerSelector })
}

async function check(label, { openScreen, containerSelector, wrapperIndex = 0 }) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[${label}] ${e}`))
  await openScreen(page)

  const before = await contentRect(page, wrapperIndex, containerSelector)
  await page.click("text=Edit Layout")
  await page.waitForTimeout(600)
  const after = await contentRect(page, wrapperIndex, containerSelector)

  const contentJump = Math.abs(before.content.y - after.content.y)
  console.log(
    `${label}: content y before=${before.content.y.toFixed(1)} after=${after.content.y.toFixed(1)} jump=${contentJump.toFixed(1)}px`,
    contentJump <= 1 ? "OK" : "*** STILL BROKEN ***"
  )
  await page.click("text=Reset Layout").catch(() => {})
  await page.close()
}

// Warm up
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.close()
}

await check("Settings (audio, margin-top:16px)", {
  containerSelector: ".hw-settings .hw-free-layout-container",
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(500)
    await page.click(".hw-settings-open-btn")
    await page.waitForSelector(".hw-settings", { timeout: 8000 })
    await page.waitForTimeout(700)
  },
})

await check("CommanderSelect (header)", {
  containerSelector: ".hw-commander-select .hw-free-layout-container",
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(() => {
      localStorage.removeItem("heartwood-run-save-v1")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
    await page.waitForTimeout(700)
  },
})

await check("GuildHallScreen (header)", {
  containerSelector: ".hw-guildhall .hw-free-layout-container",
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(() => {
      localStorage.removeItem("heartwood-run-save-v1")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
      localStorage.setItem("heartwood-story-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
    await page.click(".hw-commander-card:not([data-locked='true'])")
    await page.waitForTimeout(700)
    await page.waitForSelector(".hw-guildhall", { timeout: 8000 })
    await page.waitForTimeout(700)
  },
})

await check("StoryCinematic (head)", {
  containerSelector: ".hw-cinematic .hw-free-layout-container",
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(async () => {
      const { startRun, serializeRun } = await import("/src/services/heartwood/runEngine.js")
      const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "shop" }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      localStorage.removeItem("heartwood-story-intro-seen")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-cinematic", { timeout: 8000 })
    await page.waitForTimeout(700)
  },
})

await check("ActTransitionScreen (turnLabel)", {
  containerSelector: ".hw-act-transition .hw-free-layout-container",
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(async () => {
      const { startRun, serializeRun, actIndexForNode, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
      let nodeIndex = 0
      for (let i = 0; i < RUN_PATH.length; i++) {
        if (actIndexForNode(i, RUN_PATH.length) === 2) { nodeIndex = i; break }
      }
      const rs = { ...startRun("tommy", null), nodeIndex, phase: "shop", lastSeenAct: 1, path: RUN_PATH.slice(0, nodeIndex + 1) }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      localStorage.setItem("heartwood-story-intro-seen", "true")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-act-transition", { timeout: 8000 })
    await page.waitForTimeout(1300)
  },
})

await browser.close()
console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
