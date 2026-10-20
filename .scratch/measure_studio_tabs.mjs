import { chromium } from "playwright"

// Memory with many open editor tabs (Sprint 4 hardening). Reads only:
// GETs go to the live backend, every write is blocked.
const PORT = process.env.PORT || 5447
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
await ctx.route("http://localhost:3001/**", route => (route.request().method() === "GET" ? route.continue() : route.abort()))
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send("Performance.enable")

async function metrics(label) {
  await cdp.send("HeapProfiler.collectGarbage")
  await page.waitForTimeout(500)
  const { metrics: list } = await cdp.send("Performance.getMetrics")
  const get = name => list.find(m => m.name === name)?.value || 0
  const row = {
    label,
    tabs: await page.locator('[data-testid="workspace-tabs"] .hws-tab').count(),
    mountedPanes: await page.locator('[data-testid="studio-pane"]').count(),
    heapMB: Math.round(get("JSHeapUsedSize") / 1048576),
    domNodes: get("Nodes"),
    listeners: get("JSEventListeners"),
    images: await page.locator("img").count(),
  }
  console.log(JSON.stringify(row))
  return row
}

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.evaluate(() => localStorage.clear())
await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(1500)
const base = await metrics("home only")

const opens = [
  ['[data-testid="nav-room-heroes"]'], ['[data-testid="nav-room-skills"]'], ['[data-testid="nav-room-enemies"]'],
  ['[data-testid="nav-room-battlefield"]'], ['[data-testid="nav-room-story"]'], ['[data-testid="nav-room-lore"]'],
  ['[data-testid="nav-room-market"]'], ['[data-testid="nav-room-look"]'], ['[data-testid="nav-tool-qa"]'],
  ['[data-testid="nav-tool-dashboard"]'], ['[data-testid="nav-tool-history"]'],
]
for (const [selector] of opens) {
  await page.locator(selector).click()
  await page.waitForTimeout(1200)
}
await page.waitForLoadState("networkidle")
const full = await metrics("12 tabs")
// cycle through every tab once (each one becomes active)
const tabCount = await page.locator('[data-testid="workspace-tabs"] [role="tab"]').count()
for (let i = 0; i < tabCount; i += 1) {
  await page.locator('[data-testid="workspace-tabs"] [role="tab"]').nth(i).click()
  await page.waitForTimeout(400)
}
const cycled = await metrics("12 tabs, all visited")
console.log(`growth: +${cycled.heapMB - base.heapMB} MB heap, +${cycled.domNodes - base.domNodes} DOM nodes`)
await browser.close()
