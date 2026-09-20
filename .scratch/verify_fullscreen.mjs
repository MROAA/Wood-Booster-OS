import { chromium } from "playwright"

const PORT = process.env.PORT || 5231

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

// 1. No Wood-Booster HQ sidebar/topbar chrome present on the Heartwood
// route anymore (Marc: "UI:n pitää olla heartstonen kaltainen
// graafinen pääte" - the UI needs to be a Hearthstone-like graphical
// terminal, not a page embedded in the business app's dashboard shell).
const sidebarPresent = await page.locator("text=Työtila").isVisible().catch(() => false)
const exitLinkVisible = await page.locator(".hw-exit-link").isVisible().catch(() => false)

// 2. The exit link actually navigates back to Wood-Booster HQ - check
// via the URL and the Heartwood root disappearing, not via the
// Dashboard's own AI chat panel fully rendering (that panel calls a
// separate backend API this standalone `vite` dev server doesn't run
// alongside, unrelated to Heartwood/this change - would fail the same
// way on any page, not just after this navigation).
await page.click(".hw-exit-link")
await page.waitForTimeout(400)
const heartwoodRootGone = !(await page.locator(".hw-root").isVisible().catch(() => false))
const url = page.url()
const heartwoodUnrelatedErrors = errors.filter((e) => !e.includes("ChatPanel") && !e.includes("Failed to load resource") && !e.includes("apiRequest") && !e.includes("Keskeneräisten") && !e.includes("Keskusteluhistorian"))

console.log(JSON.stringify({ sidebarPresent, exitLinkVisible, heartwoodRootGone, url, heartwoodUnrelatedErrors }, null, 2))
await browser.close()

const ok = !sidebarPresent && exitLinkVisible && heartwoodRootGone && url.endsWith("/")

if (heartwoodUnrelatedErrors.length) {
  console.log("FAIL: console/page errors present (unrelated to the known missing-backend chat fetch)")
  process.exit(1)
}
if (ok) {
  console.log("PASS: Heartwood renders with zero Wood-Booster HQ dashboard chrome, and the exit link navigates back to it")
  process.exit(0)
} else {
  console.log("FAIL", { sidebarPresent, exitLinkVisible, backAtDashboard, url })
  process.exit(1)
}
