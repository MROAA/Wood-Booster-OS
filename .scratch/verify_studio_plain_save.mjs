import { chromium } from "playwright"

// The Studio's save step in plain words (PatchPreviewPanel + StudioToast).
// Reads go to the real Studio API (3001); /preview and /apply are MOCKED
// (nothing is written), every other write is blocked.
const PORT = process.env.PORT || 5449
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
const DIFF = `--- a/src/data/heartwood/campaignStory.js\n+++ b/src/data/heartwood/campaignStory.js\n@@ -209,1 +209,1 @@\n-      ["The Rootkeeper", "...You. You are not the corruption."],\n+      ["The Rootkeeper", "...You. You are not the rot."],`
let tier = "MEDIUM"
let applyStatus = "qa_passed"
let blocked = 0
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
await ctx.route("http://localhost:3001/**", (route) => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/preview")) {
    const body = req.postDataJSON()
    return route.fulfill({ status: 201, json: { patchId: "t1", risk: { tier, allowedModes: tier === "HIGH" ? ["pr"] : ["live"], reasons: ["file is a data file"] }, diff: DIFF, targetFiles: [], previewUrl: null, plannedEdits: body.edits, rejectedOps: [], model: "qwen-test" } })
  }
  if (req.method() === "POST" && /\/hearthwood-patchbay\/t1\/apply$/.test(req.url())) return route.fulfill({ json: { id: "t1", status: applyStatus } })
  if (req.method() === "DELETE") return route.fulfill({ json: {} })
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue()
})
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
const openScene = async () => {
  await page.goto(`http://localhost:${PORT}/hearthwood-studio?type=storyScenes&id=rootkeeper-gate`, { waitUntil: "domcontentloaded" })
  await page.locator('[data-testid="story-writer-line"]').first().waitFor({ timeout: 20000 })
  await page.locator('[data-testid="story-writer-line"]').first().fill("...You. You are not the rot.")
  await page.locator('[data-testid="story-writer-preview"]').click()
  await page.locator('[data-testid="patch-review"]').waitFor({ timeout: 10000 })
}

// 1. The review card speaks plainly; tech is hidden until asked.
await openScene()
const review = page.locator('[data-testid="patch-review"]')
const r1 = {
  text: await review.textContent(),
  changes: await page.locator('[data-testid="patch-review-changes"]').textContent(),
  safety: await page.locator('[data-testid="patch-review-safety"]').textContent(),
  techVisible: await page.locator('[data-testid="patch-review-tech"]').count(),
}
await review.scrollIntoViewIfNeeded()
await page.screenshot({ path: new URL("./shots/studio_plain_review.png", import.meta.url).pathname })
await page.locator('[data-testid="patch-review-tech-toggle"]').click()
r1.techText = await page.locator('[data-testid="patch-review-tech"]').textContent()
out.r1 = r1
c(r1.text.includes("Check your change before it goes into the game") && r1.changes.includes("The Rootkeeper: ...You. You are not the rot.") && r1.changes.includes("rootkeeper-gate · Line 1"), "p1 plain before/after", r1.changes)
c(!r1.text.includes("MEDIUM") && !r1.text.includes("qwen") && !r1.text.includes("→") && r1.techVisible === 0, "p2 no tech words by default", r1.text)
c(r1.safety.includes("backup is made first") && r1.techText.includes("MEDIUM") && r1.techText.includes("qwen-test"), "p3 safety line + tech on demand", r1)

// 2. Put it in the game -> a plain "Done" message.
await page.locator('[data-testid="patch-review-apply"]').click()
await page.locator('[data-testid="studio-toast"]').waitFor({ timeout: 5000 })
const t1 = await page.locator('[data-testid="studio-toast"]').textContent()
await page.screenshot({ path: new URL("./shots/studio_plain_toast.png", import.meta.url).pathname })

// 3. An automatic undo is said plainly too.
applyStatus = "rolled_back"
await openScene()
await page.locator('[data-testid="patch-review-apply"]').click()
await page.locator('[data-testid="studio-toast"][data-tone="warn"]').waitFor({ timeout: 5000 })
const t2 = await page.locator('[data-testid="studio-toast"]').textContent()

// 4. A change the Studio won't do on its own: button off, reason in words.
tier = "HIGH"
await openScene()
const h = { disabled: await page.locator('[data-testid="patch-review-apply"]').isDisabled(), safety: await page.locator('[data-testid="patch-review-safety"]').textContent() }
await page.locator('[data-testid="patch-review-discard"]').click()
h.gone = (await page.locator('[data-testid="patch-review"]').count()) === 0
out.toasts = { t1, t2 }
out.high = h
c(t1.includes("Done - your change is in the game") && t1.includes("Undo a change"), "p4 done toast", t1)
c(t2.includes("undone automatically") && t2.includes("nothing was changed"), "p5 rolled-back toast", t2)
c(h.disabled && h.safety.includes("Ask Claude Code") && h.gone, "p6 high-risk refused plainly + Don't change", h)

out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
