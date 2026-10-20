import { chromium } from "playwright"
// Sprint 4: editors live in workspace tabs; several can be mounted at once,
// so editor-content lookups are scoped to the visible tab (VISIBLE).
const VISIBLE = 'section[role="tabpanel"]:not([hidden]) '


// Lists as picture cards (CardGallery.jsx). Read-only; writes blocked.
const PORT = process.env.PORT || 5455
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
await page.locator('[data-room="market"]').waitFor({ timeout: 20000 })
await page.locator('[data-room="market"]').hover()
await page.waitForTimeout(350)
await page.locator('[data-room="market"] button', { hasText: "Edit a relic" }).click()
await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').first().waitFor({ timeout: 15000 })
await page.waitForTimeout(1200)
const r = {
  cards: await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').count(),
  images: await page.locator(VISIBLE + '[data-testid="card-gallery"] img').evaluateAll((els) => els.filter((el) => el.complete && el.naturalWidth > 0).length),
  header: await page.locator(VISIBLE + '[data-testid="card-gallery"]').locator("div").first().textContent(),
}
const card = page.locator(VISIBLE + '[data-card="ember-core"]')
const desc = () => card.locator(".hw-reveal-more").evaluate((el) => Number(getComputedStyle(el).opacity) > 0.5 && el.getBoundingClientRect().height > 8)
r.descBefore = await desc()
await card.hover()
await page.waitForTimeout(450)
r.descAfter = await desc()
await page.screenshot({ path: new URL("./shots/studio_card_gallery.png", import.meta.url).pathname })
await page.locator(VISIBLE + '[data-testid="card-gallery-search"]').fill("ember")
await page.waitForTimeout(200)
r.filtered = await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').count()
await card.click()
await page.locator(VISIBLE + '[data-testid="entity-title"]').waitFor({ timeout: 10000 })
r.title = await page.locator(VISIBLE + '[data-testid="entity-title"]').textContent()
await page.locator(VISIBLE + '[data-testid="back-to-cards"]').click()
await page.locator(VISIBLE + '[data-testid="card-gallery"]').waitFor({ timeout: 10000 })
r.backCards = await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').count()
// Heroes gallery: pictures for heroes.
await page.goto(`http://localhost:${PORT}/hearthwood-studio?type=units`, { waitUntil: "domcontentloaded" })
await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').first().waitFor({ timeout: 15000 })
r.heroCards = await page.locator(VISIBLE + '[data-testid="card-gallery"] [data-card]').count()
out.r = r
c(r.cards === 67 && r.images >= 20 && r.header.includes("67"), "g1 relics as picture cards", r)
c(r.descBefore === false && r.descAfter === true, "g2 description opens on hover", r)
c(r.filtered >= 1 && r.filtered < 67 && r.title === "Ember Core" && r.backCards === 67, "g3 find, open, back to cards", r)
c(r.heroCards === 149, "g4 heroes gallery", r.heroCards)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
