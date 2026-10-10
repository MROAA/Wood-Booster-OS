// Weird events (events.js, Promotions/Traits/Chaos sprint): each of the
// 12 new events comes up at an event node of its Act and EVERY choice
// resolves to exactly what it says (traits gained / lost, temporary class
// swaps, XP, mutations, Essence, units, relics, mend, curses); the
// EventScreen preview lines match the real resolution; a class swap
// really changes the class in the next fight and wears off; UI via clicks.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const NEW = [
  "the-wrong-berry", "the-badger-sergeant", "the-goose-of-ill-omen", "the-talking-mushroom", "the-reflection-suitor", "the-reading-tree",
  "the-bottomless-teacup", "the-dapper-hat", "the-swapping-pond", "the-rage-bees", "the-soul-auction", "the-snoring-giant",
]

const r = await page.evaluate(async (NEW) => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const EV = await import("/src/data/heartwood/events.js")
  const TD = await import("/src/data/heartwood/traits.js")
  const { CLASSES } = await import("/src/data/heartwood/classes.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const fails = []
  const res = { events: {} }
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 600)}`)
  }
  const KNOWN = new Set(["essence", "relic", "item", "unit", "squadNextBattle", "flag", "boon", "bane", "mend", "mutation", "trait", "loseTrait", "classSwap", "xp", "fights", "who"])
  const bench = () => [
    { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], heroTraits: ["brave"], xp: 2, hpPct: 0.5 },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], heroTraits: ["calm", "lucky"], xp: 2, hpPct: 0.5 },
  ]
  const nodeFor = (act) => rt.RUN_PATH.findIndex((n, i) => n.type === "event" && (act == null || rt.actIndexForNode(i, rt.RUN_PATH.length) === act))
  const stage = (ev) => {
    const idx = nodeFor(ev.act)
    return {
      ...rt.startRun("tommy", null, { forcedSeed: 31337 }),
      nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "event",
      bench: bench(), deployed: ["b0", "b1", null, null], items: [], essence: 200,
      seenEvents: EV.EVENTS.filter((e) => e.id !== ev.id).map((e) => e.id),
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
  }
  const traitsOf = (rs) => rs.bench.map((e) => e.heroTraits || [])
  for (const id of NEW) {
    const ev = EV.EVENTS.find((e) => e.id === id)
    const report = { act: ev?.act ?? null, choices: [] }
    res.events[id] = report
    if (!ev) {
      fails.push(`${id}: missing`)
      continue
    }
    ok(ev.title && ev.body && ev.choices.length === 3 && ev.choices.every((c) => c.label && c.result && Array.isArray(c.effects)), `${id}: well-formed`)
    for (const c of ev.choices) for (const eff of c.effects) for (const k of Object.keys(eff)) if (!KNOWN.has(k)) fails.push(`${id}: unknown effect key ${k}`)
    const rs = stage(ev)
    const shown = rt.eventForNode(rs)
    ok(shown?.id === id, `${id}: comes up at an Act ${ev.act ?? "any"} event node`, shown?.id)
    ev.choices.forEach((c, i) => {
      const preview = rt.previewEventMutations(rs, i)
      const after = rt.resolveEventChoice(rs, i)
      const lines = after.lastMutations || []
      const got = { essence: after.essence - rs.essence, lines, traits: traitsOf(after), temp: after.bench.map((e) => e.tempClass || null), xp: after.bench.map((e) => e.xp || 0), muts: after.bench.map((e) => e.mutations || []) }
      report.choices.push({ label: c.label, ...got })
      const problems = []
      const want = c.effects
      const ess = want.reduce((s, e) => s + (typeof e.essence === "number" ? e.essence : 0), 0)
      if (got.essence !== ess && !want.some((e) => e.relic || e.unit)) problems.push(`essence ${got.essence} != ${ess}`)
      for (const e of want) {
        if (e.trait) {
          const t = e.trait
          const before = traitsOf(rs)
          const gainedBy = got.traits.map((ts, k) => ts.filter((x) => !before[k].includes(x)))
          if (e.who === "all") {
            if (!gainedBy.every((g, k) => g.includes(t) || before[k].includes(t))) problems.push(`trait ${t} not on all`)
          } else if (TD.TRAITS[t]) {
            if (!got.traits.some((ts) => ts.includes(t))) problems.push(`trait ${t} missing`)
          } else if (!gainedBy.some((g) => g.length)) problems.push(`no random trait gained`)
        }
        if (e.loseTrait) {
          const n0 = traitsOf(rs).flat().length
          if (!(got.traits.flat().length < n0 + want.filter((x) => x.trait).length)) problems.push("nothing lost")
        }
        if (e.classSwap) {
          const t = got.temp.find(Boolean)
          if (!t || t.fights !== e.fights || !CLASSES[t.classId]) problems.push(`classSwap ${JSON.stringify(t)}`)
          if (e.classSwap !== "random" && t?.classId !== e.classSwap) problems.push(`classSwap not ${e.classSwap}`)
        }
        if (typeof e.xp === "number") {
          const dx = got.xp.reduce((a, b) => a + b, 0) - rs.bench.reduce((a, b) => a + (b.xp || 0), 0)
          const n = e.who === "all" ? rs.bench.length : 1
          if (dx < e.xp * n) problems.push(`xp +${dx} < ${e.xp * n}`)
        }
        if (e.mutation && !got.muts.some((m) => m.length)) problems.push("no mutation")
        if (e.unit && after.bench.length !== rs.bench.length + 1) problems.push("no unit")
        if (e.relic && after.relics.length !== rs.relics.length + 1) problems.push("no relic")
        if (e.item && after.items.length !== rs.items.length + 1) problems.push("no item")
        if (e.mend && !after.bench.every((x) => (x.hpPct ?? 1) >= 1)) problems.push("not mended")
        if (e.squadNextBattle && !(after.pendingActiveEffects || []).length) problems.push("no next-battle effect")
      }
      const heroChange = want.some((e) => e.trait || e.loseTrait || e.classSwap || typeof e.xp === "number" || e.mutation)
      if (heroChange && !(lines.length && JSON.stringify(preview) === JSON.stringify(lines))) problems.push(`preview ${JSON.stringify(preview)} != lines ${JSON.stringify(lines)}`)
      if (!want.length && (got.essence !== 0 || lines.length)) problems.push("walk-on changed something")
      if (after.phase === "event") problems.push("run did not advance")
      if (problems.length) fails.push(`${id} #${i + 1} "${c.label}": ${problems.join("; ")}`)
    })
  }
  // Act spread: new events across the Acts.
  res.acts = NEW.map((id) => EV.EVENTS.find((e) => e.id === id)?.act ?? "any")

  // --- A class swap really changes the class for N fights, then wears off ---------
  {
    const fidx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...rt.startRun("tommy", null, { forcedSeed: 31337 }), nodeIndex: fidx, path: rt.RUN_PATH.slice(0, fidx + 1), phase: "formation",
      bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], tempClass: { classId: "guardian", fights: 2 } }], deployed: ["b0", null, null, null], items: [],
      lastSeenAct: rt.actIndexForNode(fidx, rt.RUN_PATH.length),
    }
    const natural = (await import("/src/data/heartwood/units.js")).UNITS["the-fool"].classId
    const fight = (st) => rt.startTacticsFormationBattle(st, (s) => buildRunTacticsBattle(st, s))
    const s1 = fight(rs)
    const c1 = s1.battle.units.find((u) => u.id === "player-the-fool-0").classId
    const won = (st) => rt.resolveBattleOutcome({ ...st, battle: { ...st.battle, phase: "won", round: 2, units: st.battle.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) } })
    const a1 = won(s1)
    const left1 = a1.bench[0].tempClass
    const a2 = won(fight({ ...rs, bench: a1.bench }))
    const left2 = a2.bench[0].tempClass
    const c3 = fight({ ...rs, bench: a2.bench }).battle.units.find((u) => u.id === "player-the-fool-0").classId
    res.swap = { c1, left1, left2, c3, natural }
    ok(c1 === "guardian" && left1?.fights === 1 && !left2 && c3 === natural, "a class swap fights as the class for N fights, then wears off", res.swap)
  }
  // UI save: the teacup event (resource gamble).
  {
    const ev = EV.EVENTS.find((e) => e.id === "the-bottomless-teacup")
    res.uiSave = rt.serializeRun(stage(ev))
  }
  res.fails = fails
  return res
}, NEW)
out.events = Object.fromEntries(Object.entries(r.events).map(([k, v]) => [k, v.choices.map((c) => `${c.label} -> ${c.lines.join(" | ") || (c.essence ? `essence ${c.essence}` : "-")}`)]))
out.acts = r.acts
out.swap = r.swap
for (const f of r.fails) out.errors.push(f)

// --- UI: the event screen via real clicks ---------------------------------------
{
  await page.evaluate((s) => {
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s))
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
  }, r.uiSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-event", { timeout: 15000 }).catch(() => {})
  const title = await page.locator(".hw-event h1").innerText().catch(() => "")
  await page.locator(".hw-event button.hw-move-btn", { hasText: "Drink deeply" }).click().catch(() => {})
  await page.waitForTimeout(600)
  const lines = await page.locator("[data-event-mutation]").allInnerTexts().catch(() => [])
  await page.screenshot({ path: `${SHOTS}/weird_event.png` }).catch(() => {})
  await page.locator(".hw-event button.hw-move-btn", { hasText: "Continue" }).click().catch(() => {})
  await page.waitForTimeout(600)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
  out.ui = { title, lines, phase: saved.phase, traits: saved.bench.map((e) => e.heroTraits) }
  const allBrim = saved.bench.every((e) => (e.heroTraits || []).includes("brimful"))
  const hexed = saved.bench.some((e) => (e.heroTraits || []).includes("hexed"))
  if (!(title === "The Bottomless Teacup" && lines.length >= 3 && allBrim && hexed && saved.phase !== "event")) out.errors.push(`UI: teacup via clicks ${JSON.stringify(out.ui)}`)
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_weird_events PASS" : "\n❌ verify_weird_events FAIL")
process.exit(pass ? 0 : 1)
