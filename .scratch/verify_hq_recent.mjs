import { chromium } from "playwright"

// HQ "Continue where you left off" (RecentlyEdited.jsx): the latest saved
// entries from the real change list, one click to open. Read-only.
const PORT = process.env.PORT || 5457
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
let blocked = 0
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => (route.request().method() === "GET" ? route.continue() : (blocked++, route.abort())))
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
const expected = await (await fetch("http://localhost:3001/api/hearthwood-patchbay?archived=false")).json()
const latest = expected.find((row) => (row.status === "qa_passed" || row.status === "applied") && /^[A-Za-z]+\/[^:]+:/.test(row.summary))
const latestKey = latest ? /^([A-Za-z]+\/[^:]+):/.exec(latest.summary)[1] : null
await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.locator('[data-testid="recently-edited"] [data-recent]').first().waitFor({ timeout: 20000 })
const r = {
  items: await page.locator('[data-testid="recently-edited"] [data-recent]').evaluateAll((els) => els.map((el) => el.getAttribute("data-recent"))),
  firstText: await page.locator('[data-testid="recently-edited"] [data-recent]').first().textContent(),
  latestKey,
}
await page.screenshot({ path: new URL("./shots/hq_recent.png", import.meta.url).pathname })
await page.locator('[data-testid="recently-edited"] [data-recent]').first().click()
await page.locator('[data-testid="entity-title"]').waitFor({ timeout: 10000 })
r.opened = await page.locator('[data-testid="entity-title"]').textContent()
r.bar = await page.locator('[data-testid="studio-room-bar"]').textContent()
out.r = r
c(r.items.length >= 1 && r.items.length <= 6 && new Set(r.items).size === r.items.length && r.items[0] === latestKey && /ago|just now/.test(r.firstText), "r1 newest saved entries, no repeats", r)
c(r.opened && r.firstText.startsWith(r.opened.trim()) && r.bar.length > 0, "r2 one click opens it in its room", r)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
