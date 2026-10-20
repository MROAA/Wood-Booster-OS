import { chromium } from "playwright"
import fs from "node:fs"
// Sprint 4: editors live in workspace tabs; several can be mounted at once,
// so editor-content lookups are scoped to the visible tab (VISIBLE).
const VISIBLE = 'section[role="tabpanel"]:not([hidden]) '


// A Studio save changes a src/data/heartwood file. The Studio page must NOT
// reload (vite.config.js hearthwoodDataHmr) but refresh what it shows; a game
// page still reloads to run the new data. Edits THIS worktree's battleObjects.js
// and restores it; the Studio API is read-only here.
const PORT = process.env.PORT || 5455
const FILE = "src/data/heartwood/battleObjects.js"
const original = fs.readFileSync(FILE, "utf8")
const browser = await browser_launch()
async function browser_launch() { return chromium.launch() }
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => (route.request().method() === "GET" ? route.continue() : route.abort()))
try {
  const studio = await ctx.newPage()
  studio.on("pageerror", (e) => errs.push(String(e)))
  await studio.goto(`http://localhost:${PORT}/hearthwood-studio?type=storyScenes&id=rootkeeper-gate`, { waitUntil: "domcontentloaded" })
  await studio.locator(VISIBLE + '[data-testid="story-writer-line"]').first().waitFor({ timeout: 20000 })
  await studio.evaluate(() => { window.__mark = "still-here"; window.__events = 0; window.addEventListener("hw-data-changed", () => { window.__events++ }) })
  const game = await ctx.newPage()
  await game.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await game.waitForSelector(".hwt-board", { timeout: 20000 })
  await game.evaluate(() => { window.__mark = "still-here" })
  fs.writeFileSync(FILE, original + "\n// no-reload test\n")
  await studio.waitForTimeout(2500)
  const r = {
    studioMark: await studio.evaluate(() => window.__mark).catch(() => null),
    studioEvents: await studio.evaluate(() => window.__events).catch(() => null),
    studioStillShows: await studio.locator(VISIBLE + '[data-testid="story-writer-line"]').count(),
  }
  await game.waitForTimeout(2500)
  r.gameMark = await game.evaluate(() => window.__mark ?? null).catch(() => null)
  out.r = r
  c(r.studioMark === "still-here" && r.studioEvents >= 1 && r.studioStillShows > 0, "n1 Studio refreshes in place, no reload", r)
  c(r.gameMark === null, "n2 the game page still reloads to run new data", r)
  // A manual refresh comes back to the same place, not the HQ home.
  const p2 = await ctx.newPage()
  await p2.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
  // Sprint 4 restores the last active tab; the front door is the pinned Studio Home tab.
  await p2.locator('[data-testid="workspace-tab-home"]').click()
  await p2.locator('[data-room="story"]').waitFor({ timeout: 20000 })
  await p2.locator('[data-room="story"] button', { hasText: "Read the whole story" }).click()
  await p2.locator(VISIBLE + '[data-testid="map-scene-ley-wound"]').click()
  await p2.locator(VISIBLE + '[data-testid="story-writer-where"]').waitFor({ timeout: 10000 })
  const url = p2.url()
  await p2.reload({ waitUntil: "domcontentloaded" })
  await p2.locator(VISIBLE + '[data-testid="story-writer-where"]').waitFor({ timeout: 20000 }).catch(() => {})
  const after = { url, where: await p2.locator(VISIBLE + '[data-testid="story-writer-where"]').textContent().catch(() => null), bar: await p2.locator(VISIBLE + '[data-testid="studio-room-bar"]').textContent().catch(() => null) }
  out.refresh = after
  c(url.includes("type=storyScenes") && url.includes("id=ley-wound") && after.where?.includes("Chapter 3 of 7") && after.bar?.includes("Story"), "n4 refresh keeps your place", after)
} finally {
  fs.writeFileSync(FILE, original)
}
out.restored = fs.readFileSync(FILE, "utf8") === original
c(out.restored, "n3 data file restored")
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
