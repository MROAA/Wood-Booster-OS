// Hearthwood - forest creatures (First Song PRD §6, NAR-04) verify suite.
// Engine: Forest Regard (fights, runes, crossroads, events), Forest Wardens
// (ally / foe by regard), Shapeshifters (hide as a tree, creep, reveal on a
// strike or next to a hero), the Water-Rememberer event. UI: the forest
// meter, Warden tag, Shapeshifter banner, locked rune choice, a played turn.
//   PORT=5454 node .scratch/verify_creatures.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5454
const SHOTS = process.env.SHOTS || ".scratch/shots"
await mkdir(SHOTS, { recursive: true })
const results = []
const ok = (cond, name, extra) => {
  results.push({ ok: !!cond, name })
  if (!cond) console.log("FAIL:", name, extra !== undefined ? JSON.stringify(extra) : "")
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)

const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const M = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const F = await import("/src/services/heartwood/forestRegard.js")
  const C = await import("/src/services/heartwood/tacticsCreatures.js")
  const O = await import("/src/services/heartwood/tacticsObjects.js")
  const EV = await import("/src/data/heartwood/events.js")
  const out = {}
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const at = (idx, seed, extra = {}) => ({ ...E.startRun("tommy", null, { forcedSeed: seed }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: E.actIndexForNode(idx, E.RUN_PATH.length), ...extra })
  const start = (rs) => E.startTacticsFormationBattle(rs, (s) => M.buildRunTacticsBattle(rs, s))
  const firstIdx = E.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)

  out.startRegard = E.startRun("tommy", null, { forcedSeed: 1 }).regard
  // adjust / clamp / band line
  const a = F.adjustRegard({ regard: 20, nodeIndex: 0 }, 10, "test")
  out.adjust = [a.regard, (a.lastAftermath || []).join(" ")]
  out.clamp = F.adjustRegard({ regard: 95 }, 50).regard
  // after a fight
  const trees = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`0-${i}`, "tree"]))
  out.clean = F.regardAfterFight({ regard: 0 }, { treesAtStart: 3, terrain: trees(3) }).regard
  out.lost2 = F.regardAfterFight({ regard: 0 }, { treesAtStart: 3, terrain: trees(1) }).regard
  out.lost9 = F.regardAfterFight({ regard: 0 }, { treesAtStart: 9, terrain: {} }).regard
  // crossroads
  const cr = at(firstIdx, 7, { phase: "shop" })
  out.purified = E.resolveActCrossroads(cr, 2, "purify").regard
  out.corrupted = E.resolveActCrossroads(cr, 4, "take").regard
  // carving Growth at battle start
  const g = start({ ...at(firstIdx, 424243), runes: ["growth"], carvedRune: "growth" })
  out.growthRegard = g.regard
  out.treesAtStart = typeof g.battle.treesAtStart === "number"
  // Wardens
  const units = (rs) => start(rs).battle.units
  const ally = units(at(firstIdx, 424243, { regard: 30 })).filter((u) => u.creature === "warden")
  const foe = units(at(firstIdx, 424243, { regard: -30 })).filter((u) => u.creature === "warden")
  const none = units(at(firstIdx, 424243, { regard: 0 })).filter((u) => u.creature === "warden")
  out.wardens = { ally: ally.map((u) => [u.side, u.name, u.creatureTag]), foe: foe.map((u) => [u.side, u.name]), none: none.length }
  // Shapeshifters: find a real Act II+ fight that hides one.
  const act2 = E.RUN_PATH.map((n, i) => ({ n, i })).filter(({ n, i }) => n.type === "battle" && n.formationId && E.actIndexForNode(i, E.RUN_PATH.length) >= 2)
  let found = null
  for (const seed of [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]) {
    for (const { i } of act2.slice(0, 6)) {
      const rs = at(i, seed)
      const b = start(rs).battle
      if (b && Object.keys(b.mimics || {}).length) { found = { seed, idx: i, b }; break }
    }
    if (found) break
  }
  out.shapeFound = !!found
  let act1Mimic = 0
  for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) act1Mimic += Object.keys(start(at(firstIdx, seed)).battle.mimics || {}).length
  out.act1Mimic = act1Mimic
  if (found) {
    const b = found.b
    const key = Object.keys(b.mimics)[0]
    out.found = { seed: found.seed, idx: found.idx }
    out.mimicIsTree = b.terrain[key] === "tree"
    out.treesExcludeMimic = F.countTrees(b) === Object.values(b.terrain).filter((t) => t === "tree").length - 1
    out.hint = !!b.creatureHint
    // creep: one enemy turn end
    const stepped = C.shapeshifterTurnEnd(b)
    const key2 = Object.keys(stepped.mimics || {})[0]
    const d = (k, s) => { const [r, c] = k.split("-").map(Number); return Math.min(...s.units.filter((u) => u.side === "player" && u.hp > 0 && !u.npc && !u.structure).map((h) => Math.max(Math.abs(h.pos.row - r), Math.abs(h.pos.col - c)))) }
    out.creep = { moved: !!key2 && key2 !== key, closer: key2 ? d(key2, stepped) < d(key, b) : null, oldEmpty: stepped.terrain[key] !== "tree", newTree: key2 ? stepped.terrain[key2] === "tree" : false, rustle: stepped.log.some((l) => /closer than it was/.test(l)) }
    // strike: damageObject on its tree drags it out
    const struck = O.damageObject(b, (() => { const [row, col] = key.split("-").map(Number); return { row, col } })(), 3)
    const shifter = struck.units.find((u) => u.creature === "shapeshifter")
    out.strike = { revealed: !!shifter, side: shifter?.side, hp: shifter?.hp, noMimic: !Object.keys(struck.mimics || {}).length, noTree: struck.terrain[key] !== "tree", callout: (struck.events || []).some((e) => /never a tree/.test(e.label || "")) }
    // ambush: walk it next to a hero and end the enemy turn
    let s = b
    for (let t = 0; t < 14 && Object.keys(s.mimics || {}).length; t++) s = C.shapeshifterTurnEnd(s)
    out.ambush = { revealed: s.units.some((u) => u.creature === "shapeshifter"), mimicsLeft: Object.keys(s.mimics || {}).length }
  }
  // The Water-Rememberer
  const ev = EV.EVENTS.find((e) => e.id === "the-rememberer")
  out.eventOk = !!ev && ev.act === 2 && ev.choices.length === 4 && ev.choices[0].needsRune === true
  let evIdx = -1
  for (let i = 0; i < E.RUN_PATH.length; i++) if (EV.pickEvent(i, 2, [], {})?.id === "the-rememberer") { evIdx = i; break }
  out.eventPickable = evIdx >= 0
  const ev2Idx = E.RUN_PATH.findIndex((n, i) => n.type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === 2)
  const seen2 = EV.EVENTS.filter((e) => e.act === 2 && e.id !== "the-rememberer").map((e) => e.id)
  const evState = (runes) => ({ ...at(ev2Idx, 5), phase: "event", runes, essence: 100, regard: 0, seenEvents: seen2 })
  out.pinned = E.eventForNode(evState([])).id
  const resolve = (rs, i) => E.resolveEventChoice(rs, i)
  const r0 = resolve(evState(["bond", "echo"]), 0)
  out.trade = { runes: r0.runes, essence: r0.essence, regard: r0.regard, phase: r0.phase }
  const rBlocked = resolve(evState([]), 0)
  out.blocked = { same: rBlocked.phase === "event", essence: rBlocked.essence }
  const r1 = resolve(evState(["bond"]), 1)
  out.drink = r1.runes
  const r2 = resolve(evState([]), 2)
  out.ask = { regard: r2.regard, flag: !!r2.storyFlags?.heard_the_rememberer }
  return out
})

ok(eng.startRegard === 0, "C1 a run starts with the forest Watching (regard 0)")
ok(eng.adjust[0] === 30 && /Friendly/.test(eng.adjust[1]) && eng.clamp === 100, "C2 regard moves, clamps at 100, and names a band change", eng.adjust)
ok(eng.clean === 3 && eng.lost2 === -4 && eng.lost9 === -10, "C3 a clean fight +3, each fallen tree -2 (max -10)", [eng.clean, eng.lost2, eng.lost9])
ok(eng.purified === 15 && eng.corrupted === -15, "C4 crossroads: purified +15, corrupted -15", [eng.purified, eng.corrupted])
ok(eng.growthRegard === 5 && eng.treesAtStart, "C5 carving Growth pleases the forest (+5); the fight remembers its trees", eng.growthRegard)
ok(eng.wardens.ally.length === 1 && eng.wardens.ally[0][0] === "player" && eng.wardens.ally[0][2] === "Warden", "C6 Friendly forest: a Forest Warden fights beside you", eng.wardens.ally)
ok(eng.wardens.foe.length === 1 && eng.wardens.foe[0][0] === "enemy", "C7 Wary forest: a Wrathful Warden fights against you", eng.wardens.foe)
ok(eng.wardens.none === 0, "C8 Watching forest: no Warden")
ok(eng.shapeFound, "C9 some Act II+ fights hide a Shapeshifter", eng.found)
ok(eng.act1Mimic === 0, "C10 never in Act I")
ok(eng.mimicIsTree && eng.treesExcludeMimic && eng.hint, "C11 it stands as a tree (not counted as one), with a hint on the board")
ok(eng.creep && eng.creep.moved && eng.creep.closer && eng.creep.oldEmpty && eng.creep.newTree && eng.creep.rustle, "C12 trees don't move - it does: one step closer each enemy turn", eng.creep)
ok(eng.strike && eng.strike.revealed && eng.strike.side === "enemy" && eng.strike.hp > 0 && eng.strike.noMimic && eng.strike.noTree && eng.strike.callout, "C13 striking its tree drags the Shapeshifter out", eng.strike)
ok(eng.ambush && eng.ambush.revealed && eng.ambush.mimicsLeft === 0, "C14 it bursts out when it reaches a hero", eng.ambush)
ok(eng.eventOk && eng.eventPickable && eng.pinned === "the-rememberer", "C15 the Water-Rememberer is a real Act II event", eng.pinned)
ok(JSON.stringify(eng.trade.runes) === JSON.stringify(["echo"]) && eng.trade.essence === 190 && eng.trade.regard === 8, "C16 trading your oldest rune: Essence + the forest's regard", eng.trade)
ok(eng.blocked.same && eng.blocked.essence === 100, "C17 the rune trade is locked with an empty pouch", eng.blocked)
ok(eng.drink.length === 2, "C18 letting it drink a memory brings up a rune", eng.drink)
ok(eng.ask.regard === 5 && eng.ask.flag, "C19 asking what it remembers: lore + regard", eng.ask)

// ---------------- UI ----------------
const seedSave = (idx, seed, extra) =>
  page.evaluate(async ({ idx, seed, extra }) => {
    localStorage.setItem("heartwood-story-intro-seen", "true")
    const E = await import("/src/services/heartwood/runEngine.js")
    const i = idx < 0 ? E.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId) : idx
    const bench = ["the-fool", "the-magician"].map((defId, k) => ({ key: `b${k}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...E.startRun("tommy", null, { forcedSeed: seed }), nodeIndex: i, path: E.RUN_PATH.slice(0, i + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: E.actIndexForNode(i, E.RUN_PATH.length), ...extra }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  }, { idx, seed, extra })
const startBattle = async () => {
  await page.locator(".hw-tactics-start").click()
  const begin = page.locator(".hwt-begin-battle")
  await begin.waitFor({ timeout: 8000 }).catch(() => {})
  if (await begin.count()) await begin.click()
  await page.waitForTimeout(900)
}

await seedSave(-1, 424243, { regard: 30 })
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-forest-regard]", { timeout: 15000 }).catch(() => {})
ok((await page.locator("[data-forest-regard='friendly']").count()) >= 1, "U1 the Formation screen shows the forest: Friendly")
await page.locator("[data-forest-regard]").first().scrollIntoViewIfNeeded()
await page.screenshot({ path: `${SHOTS}/creatures_formation.png` })
await startBattle()
ok((await page.locator(".hwt-fate-tag[data-creature='warden']").count()) === 1, "U2 a Forest Warden stands on the board, tagged")
await page.screenshot({ path: `${SHOTS}/creatures_warden.png` })

if (eng.found) {
  await seedSave(eng.found.idx, eng.found.seed, {})
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-tactics-start", { timeout: 15000 }).catch(() => {})
  await startBattle()
  ok((await page.locator("[data-creature-banner='shapeshifter']").count()) === 1, "U3 the board warns: something in the treeline is watching")
  const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.mimics || {}))
  await page.locator(".hwt-end-turn").click()
  await page.waitForTimeout(4000)
  const after = await page.evaluate(() => {
    const b = JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle
    return { mimics: Object.keys(b.mimics || {}), turn: b.turn, shifter: b.units.some((u) => u.creature === "shapeshifter"), rustle: b.log.some((l) => /closer than it was|never a tree/.test(l)) }
  })
  ok(after.turn >= 2 && (after.rustle || after.shifter) && (after.shifter || JSON.stringify(after.mimics) !== JSON.stringify(before)), "U4 a played turn: the 'tree' moved (or burst out)", { before, after })
  await page.locator("[data-creature-banner]").scrollIntoViewIfNeeded().catch(() => {})
  await page.screenshot({ path: `${SHOTS}/creatures_shapeshifter.png` })
} else ok(false, "U3/U4 need a Shapeshifter fight")

// Event screen: the rune trade locked with no runes.
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const EV = await import("/src/data/heartwood/events.js")
  let idx = -1
  for (let i = 0; i < E.RUN_PATH.length; i++) if (E.RUN_PATH[i].type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === 2 && EV.pickEvent(i, 2, [], {})?.id === "the-rememberer") { idx = i; break }
  if (idx < 0) for (let i = 0; i < E.RUN_PATH.length; i++) if (E.RUN_PATH[i].type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === 2) { idx = i; break }
  const seen = EV.EVENTS.filter((e) => e.act === 2 && e.id !== "the-rememberer").map((e) => e.id)
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 3 }), runes: [], nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "event", seenEvents: seen, bench: [], deployed: [null, null, null, null], items: [], lastSeenAct: 2 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-event-choice", { timeout: 15000 }).catch(() => {})
const title = await page.locator("h1").first().innerText().catch(() => "")
ok(/Rememberer/.test(title) && (await page.locator(".hw-event-choice[data-blocked]").count()) === 1, "U5 the Rememberer's rune trade is locked with no runes", title)
await page.screenshot({ path: `${SHOTS}/creatures_rememberer.png` })
ok(pageErrors.length === 0, "U6 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_creatures: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
