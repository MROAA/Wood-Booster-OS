// Live smoke test for the branching Dialogue System (grieving-guardian).
// Seeds a run positioned at an "event" node, forces pickEvent to land on
// "the-grieving-guardian" (by marking every OTHER event as already seen),
// picks the new "Talk to it." choice, walks the full 2-level conversation,
// and confirms: DialogueScreen renders, effects (storyFlags) apply, the
// run advances afterward, the Story Journal gets a real (non-blank) entry,
// and 0 page errors throughout. Also regression-checks that a PLAIN event
// choice (no dialogueId) still resolves via the old path with 0 errors.
import { chromium } from "playwright"

const PORT = 5177
const ALL_EVENT_IDS = ["roadside-shrine","hollow-tree","trapped-forager","the-first-milestone","the-snare-line","spacemonkey-warning","still-pool","the-listening-grove","chained-fighter","veil-fragment","the-veil-researcher","the-name-spreads","the-sealed-tree-again","the-crownless-vision","the-throne-road","the-chained-ally-speaks","the-crownless-court","the-echo-of-yourself","the-unmade-road","the-last-clean-water","the-quiet-before","abandoned-camp","the-toll-root","mushroom-ring","the-weeping-stone","the-gambler","the-old-battleground","the-fungus-shrine","the-two-wounded","the-cache"]

const browser = await chromium.launch()
const errs = []

function newPage() {
  return browser.newContext({ viewport: { width: 1300, height: 900 } }).then((ctx) => ctx.newPage())
}

async function seedAtEvent(page, { seenEvents }) {
  return page.evaluate(
    async ({ seenEvents }) => {
      const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
      const idx = RUN_PATH.findIndex((n) => n.type === "event")
      const rs = {
        ...startRun("tommy", null),
        nodeIndex: idx,
        path: RUN_PATH.slice(0, idx + 1),
        phase: "event",
        seenEvents,
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      return { idx }
    },
    { seenEvents },
  )
}

// -- Test 1: dialogue-triggering choice, full 2-level conversation -------
{
  const page = await newPage()
  page.on("pageerror", (e) => errs.push(`[dialogue] ${e}`))
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const seenEvents = ALL_EVENT_IDS.filter((id) => id !== "the-grieving-guardian")
  await seedAtEvent(page, { seenEvents })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(500)

  const title = await page.locator("h1").first().textContent().catch(() => null)
  console.log("Event title:", title)

  const talkBtn = page.locator(".hw-move-btn", { hasText: "Talk to it." })
  const talkBtnCount = await talkBtn.count()
  console.log("Talk to it. button found:", talkBtnCount)
  await talkBtn.click()
  await page.waitForTimeout(400)

  const dialogueScreen = await page.locator('[data-screen="dialogue"]').count()
  const npcName = await page.locator('[data-screen="dialogue"]').textContent().catch(() => null)
  console.log("DialogueScreen rendered:", dialogueScreen, "| npc header present:", npcName?.includes("The Grieving Guardian"))

  // Pick the exchange with a follow-up
  await page.locator(".hw-move-btn", { hasText: "What are you holding?" }).click()
  await page.waitForTimeout(300)
  const answerVisible = await page.locator("text=Mine").count()
  console.log("First answer rendered:", answerVisible > 0)

  const followUpBtn = page.locator(".hw-move-btn", { hasText: "What happened to it?" })
  const followUpCount = await followUpBtn.count()
  console.log("Follow-up question button found:", followUpCount)
  await followUpBtn.click()
  await page.waitForTimeout(300)

  const secondAnswerVisible = await page.locator("text=rot came through fast").count()
  console.log("Follow-up answer rendered:", secondAnswerVisible > 0)

  // No more follow-ups now -> should show "Continue" not "(Leave.)"
  const continueBtn = page.locator(".hw-move-btn", { hasText: "Continue" })
  const continueCount = await continueBtn.count()
  console.log("Continue button shown (no more follow-ups):", continueCount)
  await continueBtn.click()
  await page.waitForTimeout(500)

  const state = await page.evaluate(() => {
    const raw = localStorage.getItem("heartwood-run-save-v1")
    const run = JSON.parse(raw).run
    return {
      storyFlags: run.storyFlags,
      phase: run.phase,
      eventLogTail: (run.eventLog || []).slice(-1),
      nodeIndex: run.nodeIndex,
    }
  })
  console.log("Post-dialogue runState:", JSON.stringify(state, null, 2))

  await page.close()
}

// -- Test 2: regression - plain non-dialogue event choice ------------------
{
  const page = await newPage()
  page.on("pageerror", (e) => errs.push(`[plain-event] ${e}`))
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const seenEvents = ALL_EVENT_IDS.filter((id) => id !== "the-grieving-guardian")
  await seedAtEvent(page, { seenEvents })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(500)

  await page.locator(".hw-move-btn", { hasText: "Leave an offering in its reach and go." }).click()
  await page.waitForTimeout(300)
  const resultVisible = await page.locator("text=coin and a ration").count()
  console.log("Plain choice result rendered:", resultVisible > 0)
  await page.locator(".hw-move-btn", { hasText: "Continue" }).click()
  await page.waitForTimeout(500)

  const state = await page.evaluate(() => {
    const raw = localStorage.getItem("heartwood-run-save-v1")
    const run = JSON.parse(raw).run
    return { eventLogTail: (run.eventLog || []).slice(-1), nodeIndex: run.nodeIndex }
  })
  console.log("Plain-event post runState:", JSON.stringify(state, null, 2))

  await page.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
