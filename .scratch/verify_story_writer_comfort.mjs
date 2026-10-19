import { chromium } from "playwright"

// Story Writer comfort: bigger text, word count, chapter buttons, drafts that
// survive leaving the scene, plain "not in the game yet". Writes mocked/blocked.
const PORT = process.env.PORT || 5454
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
let blocked = 0
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/preview")) return route.fulfill({ status: 201, json: { patchId: "w1", risk: { tier: "MEDIUM", allowedModes: ["live"], reasons: [] }, diff: "--- a\n+++ b\n-x\n+y", targetFiles: [], previewUrl: null, plannedEdits: req.postDataJSON().edits, rejectedOps: [] } })
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/w1/apply")) return route.fulfill({ json: { id: "w1", status: "qa_passed" } })
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue()
})
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
const line = () => page.locator('[data-testid="story-writer-line"]').first()
await page.goto(`http://localhost:${PORT}/hearthwood-studio?type=storyScenes&id=rootkeeper-gate`, { waitUntil: "domcontentloaded" })
await line().waitFor({ timeout: 20000 })
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("hw-story-draft:")) localStorage.removeItem(k) })
await page.reload({ waitUntil: "domcontentloaded" })
await line().waitFor({ timeout: 20000 })
const r = {
  fontSize: await line().evaluate((el) => getComputedStyle(el).fontSize),
  words: await page.locator('[data-testid="story-writer-words"]').textContent(),
  chapters: await page.locator('[data-testid="story-writer-chapters"] button').count(),
}
const original = await line().inputValue()
await line().fill("...You. You are not the rot.")
r.unsaved = await page.locator('[data-testid="story-writer-unsaved"]').textContent()
await page.locator('[data-testid="story-writer-next"]').click()
await page.waitForTimeout(900)
r.nextWhere = await page.locator('[data-testid="story-writer-where"]').textContent()
await page.locator('[data-testid="story-writer-prev"]').click()
await page.waitForTimeout(900)
r.back = await line().inputValue()
r.restored = await page.locator('[data-testid="story-writer-restored"]').textContent().catch(() => null)
await page.screenshot({ path: new URL("./shots/story_writer_comfort.png", import.meta.url).pathname })
await page.locator('[data-testid="story-writer-chapters"] button', { hasText: "5" }).click()
await page.waitForTimeout(900)
r.ch5 = await page.locator('[data-testid="story-writer-where"]').textContent()
// Back to chapter 1: put it in the game -> the draft is gone.
await page.locator('[data-testid="story-writer-chapters"] button', { hasText: "1" }).click()
await page.waitForTimeout(900)
r.stillThere = await line().inputValue()
await page.locator('[data-testid="story-writer-preview"]').click()
await page.locator('[data-testid="patch-review-apply"]').click()
await page.locator('[data-testid="studio-toast"]').waitFor({ timeout: 5000 })
r.draftAfterApply = await page.evaluate(() => localStorage.getItem("hw-story-draft:storyScenes:rootkeeper-gate"))
out.r = { ...r, original }
c(parseFloat(r.fontSize) >= 16 && /\d+ words/.test(r.words) && r.chapters === 7, "c1 bigger text, word count, 7 chapter buttons", r)
c(r.unsaved.includes("not in the game yet") && r.nextWhere.includes("Chapter 2 of 7") && r.back === "...You. You are not the rot." && r.restored?.includes("still here"), "c2 draft survives leaving the scene", r)
c(r.ch5.includes("Chapter 5 of 7") && r.stillThere === "...You. You are not the rot." && r.draftAfterApply === null, "c3 chapter jump + draft cleared once in the game", r)
out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
