// PR verify: the story-content expansion - act coverage, flag-gated
// follow-up events, and every event still well-formed.
//   PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5318
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { EVENTS, pickEvent } = await import("/src/data/heartwood/events.js?t=" + t)
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const r = {}

  // 1. Count + every event well-formed.
  r.eventCount = EVENTS.length
  r.wellFormed = EVENTS.every(
    (e) => e.id && e.title && e.body && e.body.length > 40 && Array.isArray(e.choices) &&
      e.choices.length >= 2 && e.choices.every((c) => c.label && c.result && Array.isArray(c.effects)),
  )
  r.uniqueIds = new Set(EVENTS.map((e) => e.id)).size === EVENTS.length

  // 2. Act coverage: every Act 1-7 has at least one act-tagged event,
  //    plus some any-Act events.
  r.byAct = {}
  for (let a = 1; a <= 7; a++) r.byAct[a] = EVENTS.filter((e) => e.act === a).length
  r.anyAct = EVENTS.filter((e) => e.act == null).length
  r.actCoverageOk = [1, 2, 3, 4, 5, 6, 7].every((a) => r.byAct[a] >= 1) && r.anyAct >= 3

  // 3. Flag-gated follow-ups exist and their requiresFlag is a flag some
  //    other event's choice actually sets.
  const setFlags = new Set()
  for (const e of EVENTS) for (const c of e.choices) for (const eff of c.effects) if (eff.flag) setFlags.add(eff.flag)
  const gated = EVENTS.filter((e) => e.requiresFlag)
  r.gatedCount = gated.length
  r.chainsWired = gated.length >= 3 && gated.every((e) => setFlags.has(e.requiresFlag))
  r.chains = gated.map((e) => ({ id: e.id, needs: e.requiresFlag, wired: setFlags.has(e.requiresFlag) }))

  // 4. pickEvent respects the flag gate: a follow-up is NEVER returned
  //    without its flag, and CAN be returned once the flag is set.
  const followup = gated[0]
  let leakedWithoutFlag = false
  for (let i = 0; i < 400; i++) {
    if (pickEvent(i, followup.act, [], {}).id === followup.id) { leakedWithoutFlag = true; break }
  }
  let appearsWithFlag = false
  for (let i = 0; i < 400; i++) {
    if (pickEvent(i, followup.act, [], { [followup.requiresFlag]: true }).id === followup.id) { appearsWithFlag = true; break }
  }
  r.gateEnforced = !leakedWithoutFlag && appearsWithFlag

  // 5. Still deterministic per position (save/restore invariant).
  r.deterministic = [0, 5, 11, 23, 47].every(
    (i) => pickEvent(i, 3, ["roadside-shrine"], { heard_the_name: true }).id ===
      pickEvent(i, 3, ["roadside-shrine"], { heard_the_name: true }).id,
  )

  // 6. Resolving a chain-starter's flag choice, then reaching the
  //    follow-up's Act, surfaces the follow-up. Simulate via storyFlags.
  const starterFlag = followup.requiresFlag
  r.followupReachable = false
  for (let i = 0; i < 200; i++) {
    if (pickEvent(i, followup.act, [], { [starterFlag]: true }).id === followup.id) { r.followupReachable = true; break }
  }

  void eng
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.eventCount >= 28 && out.wellFormed && out.uniqueIds && out.actCoverageOk &&
  out.chainsWired && out.gateEnforced && out.deterministic && out.followupReachable && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
