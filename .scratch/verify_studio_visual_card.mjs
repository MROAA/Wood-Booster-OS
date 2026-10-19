import { chromium } from "playwright"

// Hero/enemy page for a visual, non-coding user: big picture, "The basics"
// in plain words with − / + steppers, help on hover, technical fields folded,
// the live game hidden until asked. Reads from the real API; writes mocked/blocked.
const PORT = process.env.PORT || 5450
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
let previewBody = null
let blocked = 0
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/preview")) {
    previewBody = req.postDataJSON()
    return route.fulfill({ status: 201, json: { patchId: "t", risk: { tier: "MEDIUM", allowedModes: ["live"], reasons: [] }, diff: "--- a\n+++ b\n-    maxHp: 58,\n+    maxHp: 59,", targetFiles: [], previewUrl: null, plannedEdits: previewBody.edits, rejectedOps: [] } })
  }
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue()
})
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/hearthwood-studio?type=enemies&id=rotwood-husk`, { waitUntil: "domcontentloaded" })
await page.locator('[data-testid="field-basics"]').waitFor({ timeout: 20000 })
await page.waitForTimeout(600)
const r = {
  basics: await page.locator('[data-testid="field-basics"] [data-basic]').evaluateAll((els) => els.map((el) => el.getAttribute("data-basic"))),
  labels: await page.locator('[data-testid="field-basics"]').textContent(),
  advancedOpen: await page.locator('[data-testid="field-advanced"]').evaluate((el) => el.open),
  advancedText: await page.locator('[data-testid="field-advanced"] summary').textContent(),
  gamePanel: await page.getByText("Live game").count(),
  picture: await page.locator('[data-testid="picture-field"]').count(),
  pictureBox: await page.locator('[data-testid="picture-field"] > :first-child').evaluate((el) => Math.round(el.getBoundingClientRect().height)).catch(() => 0),
}
const hp = page.locator('[data-basic="maxHp"]')
r.helpBefore = await hp.locator(".hw-reveal-more").isVisible()
await hp.hover()
await page.waitForTimeout(400)
r.helpAfter = await hp.locator(".hw-reveal-more").isVisible()
r.hpBefore = await hp.locator('input[type="number"]').inputValue()
await hp.getByRole("button", { name: "More" }).click()
r.hpAfter = await hp.locator('input[type="number"]').inputValue()
await page.screenshot({ path: new URL("./shots/studio_visual_card.png", import.meta.url).pathname })
await page.getByRole("button", { name: /Check my 1 change/ }).click()
await page.locator('[data-testid="patch-review"]').waitFor({ timeout: 8000 })
r.edit = previewBody?.edits
await page.locator('[data-testid="studio-toggle-game"]').click()
await page.waitForTimeout(400)
r.gameAfterToggle = await page.getByText("Live game").count()
out.r = r
c(r.basics.includes("name") && r.basics.includes("maxHp") && !r.basics.includes("art") && !r.basics.includes("moveSelect") && r.labels.includes("Health") && !r.labels.includes("maxHp"), "v1 basics in plain words only", r.basics)
c(r.advancedOpen === false && /more settings/.test(r.advancedText), "v2 technical fields folded", r.advancedText)
c(r.helpBefore === false && r.helpAfter === true, "v3 help opens on hover (game pop-up style)", { before: r.helpBefore, after: r.helpAfter })
c(Number(r.hpAfter) === Number(r.hpBefore) + 1 && r.edit?.[0]?.path.join() === "rotwood-husk,maxHp" && r.edit[0].value === Number(r.hpAfter), "v4 stepper -> one plain edit", r.edit)
c(r.gamePanel === 0 && r.gameAfterToggle === 1, "v5 live game hidden until asked", { before: r.gamePanel, after: r.gameAfterToggle })
c(r.picture === 1 && r.pictureBox >= 150, "v6 big picture", r.pictureBox)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
