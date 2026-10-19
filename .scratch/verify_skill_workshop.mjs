import { chromium } from "playwright"

// Skill workshop part 1 (SkillWorkshop.jsx): every skill as a card per class,
// − / + numbers, typical range on hover, one plain save per card.
// Reads from the real API; /preview mocked (body captured), other writes blocked.
const PORT = process.env.PORT || 5458
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
    return route.fulfill({ status: 201, json: { patchId: "s1", risk: { tier: "MEDIUM", allowedModes: ["live"], reasons: [] }, diff: "--- a\n+++ b\n-      cooldown: 2,\n+      cooldown: 3,", targetFiles: [], previewUrl: null, plannedEdits: previewBody.edits, rejectedOps: [] } })
  }
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue()
})
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.locator('[data-room="skills"] button', { hasText: "Skill workshop" }).click()
await page.locator('[data-testid="skill-workshop"] [data-skill]').first().waitFor({ timeout: 20000 })
const r = {
  header: await page.locator('[data-testid="skill-workshop"] > div').first().textContent(),
  classes: await page.locator('[data-testid="skill-classes"] [data-class]').count(),
  guardianCards: await page.locator("[data-skill]").evaluateAll((els) => els.map((el) => el.getAttribute("data-skill"))),
}
const first = page.locator('[data-skill="guardian/0"]')
const cd = first.locator('[data-number="cooldown"]')
const hint = () => cd.locator(".hw-reveal-more").evaluate((el) => (Number(getComputedStyle(el).opacity) > 0.5 ? el.textContent : null)).catch(() => null)
r.hintBefore = await hint()
await cd.hover()
await page.waitForTimeout(450)
r.hintAfter = await hint()
const before = Number(await cd.locator('input[type="number"]').inputValue())
await cd.getByRole("button", { name: "More" }).click()
r.cdAfter = Number(await cd.locator('input[type="number"]').inputValue())
await page.screenshot({ path: new URL("./shots/skill_workshop.png", import.meta.url).pathname })
await first.locator('[data-testid="skill-check"]').click()
await first.locator('[data-testid="patch-review"]').waitFor({ timeout: 8000 })
r.edit1 = previewBody
// A promotion skill of the same class saves to promotions.js.
previewBody = null
const promo = page.locator('[data-skill="promo/paladin"]')
const heal = promo.locator('[data-number="heal"]')
await heal.getByRole("button", { name: "More" }).click()
await promo.locator('[data-testid="skill-check"]').click()
await promo.locator('[data-testid="patch-review"]').waitFor({ timeout: 8000 })
r.edit2 = previewBody
// Another class.
await page.locator('[data-class="warden"]').click()
await page.waitForTimeout(300)
r.wardenCards = await page.locator("[data-skill]").evaluateAll((els) => els.map((el) => el.getAttribute("data-skill")))
out.r = r
c(/\d+ skills in 38 classes/.test(r.header) && r.classes === 38 && r.guardianCards.includes("guardian/0") && r.guardianCards.includes("promo/paladin"), "k1 every skill as cards per class", r)
c(r.hintBefore === null && /Most skills in the game/.test(r.hintAfter || ""), "k2 typical range on hover", { before: r.hintBefore, after: r.hintAfter })
c(r.cdAfter === before + 1 && r.edit1?.type === "classes" && r.edit1.edits[0].path.join() === "guardian,skills,0,cooldown" && r.edit1.edits[0].value === before + 1, "k3 class skill stepper -> one exact edit", r.edit1)
c(r.edit2?.type === "promotions" && r.edit2.entityId === "paladin" && r.edit2.edits[0].path.join() === "paladin,skill,heal", "k4 promotion skill -> promotions.js", r.edit2)
c(r.wardenCards.every((k) => k.startsWith("warden/") || k.startsWith("promo/")) && r.wardenCards.length >= 2, "k5 switch class", r.wardenCards)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
