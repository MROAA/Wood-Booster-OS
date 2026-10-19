import { chromium } from "playwright"

// "Read the whole story" (StoryMap.jsx): the campaign story on one page in
// story order, hover previews, click -> Story Writer. Read-only; writes blocked.
const PORT = process.env.PORT || 5452
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
let blocked = 0
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => (route.request().method() === "GET" ? route.continue() : (blocked++, route.abort())))
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.locator('[data-room="story"]').waitFor({ timeout: 20000 })
await page.locator('[data-room="story"] button', { hasText: "Read the whole story" }).click()
await page.locator('[data-testid="story-map"] [data-chapter-block="endings"]').waitFor({ timeout: 15000 })
const r = {
  blocks: await page.locator("[data-chapter-block]").evaluateAll((els) => els.map((el) => el.getAttribute("data-chapter-block"))),
  ch5Scenes: await page.locator('[data-chapter-block="5"] [data-testid^="map-scene-"]').count(),
  endings: await page.locator('[data-testid^="map-ending-"]').count(),
  bar: await page.locator('[data-testid="studio-room-bar"]').textContent(),
}
const card = page.locator('[data-testid="map-scene-rootkeeper-gate"]')
const previewShown = () => card.locator(".hw-reveal-more").evaluate((el) => Number(getComputedStyle(el).opacity) > 0.5 && el.getBoundingClientRect().height > 8)
r.previewBefore = await previewShown()
await card.hover()
await page.waitForTimeout(450)
r.previewAfter = await previewShown()
r.previewText = await card.locator(".hw-reveal-more").textContent()
await page.screenshot({ path: new URL("./shots/studio_story_map.png", import.meta.url).pathname })
await page.locator('[data-testid="map-scene-ley-wound"]').click()
await page.locator('[data-testid="story-writer-where"]').waitFor({ timeout: 10000 })
r.writerWhere = await page.locator('[data-testid="story-writer-where"]').textContent()
await page.locator('[data-testid="studio-room-bar"] button', { hasText: "Read the whole story" }).click()
await page.locator('[data-testid="story-map"]').waitFor({ timeout: 10000 })
r.backToMap = await page.locator('[data-testid="story-map"]').count()
out.r = r
c(r.blocks.join() === "1,2,3,4,5,6,7,endings" && r.ch5Scenes === 3 && r.endings === 6 && r.bar.includes("Story"), "m1 whole story in order", r)
c(r.previewBefore === false && r.previewAfter === true && r.previewText.includes("You are not the corruption"), "m2 hover shows how it opens", { before: r.previewBefore, after: r.previewAfter, text: r.previewText })
c(r.writerWhere.includes("Chapter 3 of 7") && r.backToMap === 1, "m3 click -> writer, and back", r.writerWhere)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
