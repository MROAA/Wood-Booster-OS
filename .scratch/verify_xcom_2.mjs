import { chromium } from "playwright"

// XCOM part 2 (feat/hearthwood-xcom-2): cover (none/half/full per side),
// hit % with GRAZE (a miss = half damage, no riders), deterministic
// rolls, cover-aware enemy AI, hover % badge + cover shields + GRAZE
// callout. Engine checks import the real modules in-page; UI checks drive
// /heartwood-tactics (hit rolls ON by default there).
const PORT = process.env.PORT || 5445
const SHOT = process.env.SHOT || ".scratch/shots/xcom_2_hit_badge.png"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
await page.addInitScript(() => {
  window.__xf = (name) => {
    const el = document.getElementById("root")
    const stack = [el[Object.keys(el).find((k) => k.startsWith("__reactContainer$"))].stateNode.current]
    while (stack.length) {
      const f = stack.pop()
      if (f.type?.name === name) return f
      if (f.sibling) stack.push(f.sibling)
      if (f.child) stack.push(f.child)
    }
    return null
  }
})
const checks = []
const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail })

await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board .hwt-token", { timeout: 30000 })

const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const C = await import("/src/services/heartwood/tacticsCover.js")
  const r = {}
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0, suppressed: 0, stun: 0,
    execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false, phases: [], phaseIndex: 0, triggers: [],
    aoeMove: null, charge: null, covenAura: null, cultRitual: null, cultFodder: false, broodSplit: null, className: null, classId: null,
    ap: 2, apMax: 2, regen: 0, enemySkills: [], overwatch: 0, hunkered: 0, classPassive: null, classSkills: [], perks: [], frosty: false, wary: false,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 40, maxHp: 40, attack: 8, baseAttack: 8, range: 1, move: 2,
    facing: undefined, ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}, extra = {}) => ({ ...base, units, terrain, phase: "player", turn: 1, log: [], events: [], eventSeq: 0, ...extra })
  const get = (s, id) => s.units.find((u) => u.id === id)
  const D = { row: 4, col: 5 }

  // 1. Cover table: a source right next to the defender, attacker 4 tiles east.
  r.table = {}
  for (const t of ["rock", "wall", "boulder", "tree", "icepillar", "log", "bush", "stump", "rubble", "barrel", "sporepod", "path", "forest", "high", "water"]) {
    r.table[t] = C.coverAgainst(st([], { "4-6": t }), D, { row: 4, col: 9 })
  }
  // 2. Direction / flank: rock on the EAST side only.
  const rockE = st([], { "4-6": "rock" })
  r.dir = {
    east: C.coverAgainst(rockE, D, { row: 4, col: 9 }),
    eastDiag: C.coverAgainst(rockE, D, { row: 6, col: 8 }),
    north: C.coverAgainst(rockE, D, { row: 0, col: 5 }),
    west: C.coverAgainst(rockE, D, { row: 4, col: 1 }),
    farOffAxis: C.coverAgainst(rockE, D, { row: 0, col: 6 }),
    adjacent: C.coverAgainst(rockE, D, { row: 3, col: 6 }),
    flankedNorth: C.isFlanked(rockE, D, { row: 0, col: 5 }),
    flankedEast: C.isFlanked(rockE, D, { row: 4, col: 9 }),
  }
  // 3. High ground steps cover down by one.
  r.high = {
    full: C.coverAgainst(st([], { "4-6": "rock", "4-9": "high" }), D, { row: 4, col: 9 }),
    half: C.coverAgainst(st([], { "4-6": "log", "4-9": "high" }), D, { row: 4, col: 9 }),
  }
  // 4. Hunker doubles cover: none->half, half->full, full->hunkered full.
  const h = (t) => C.coverAgainst(st([], t ? { "4-6": t } : {}), D, { row: 4, col: 9 }, { hunkered: true })
  r.hunker = { none: h(null), half: h("log"), full: h("rock") }
  // 5. Hit % formula.
  const A = (col, extra) => P("a", 4, col, { range: 4, ...extra })
  const T = (extra) => En("t", 4, 5, extra)
  r.hit = {
    melee: C.hitChance(st([], {}), A(6), T(), "front").chance,
    r2: C.hitChance(st([], {}), A(7), T(), "front").chance,
    r3half: C.hitChance(st([], { "4-6": "log" }), A(8), T(), "front").chance,
    r3full: C.hitChance(st([], { "4-6": "rock" }), A(8), T(), "front").chance,
    r3fullSide: C.hitChance(st([], { "4-6": "rock" }), A(8), T(), "side").chance,
    r3high: C.hitChance(st([], { "4-6": "rock", "4-8": "high" }), A(8), T(), "front").chance,
    clampLow: C.hitChance(st([], { "4-6": "rock" }), A(11), T({ hunkered: 1 }), "front").chance,
    structure: C.hitChance(st([], { "4-6": "rock" }), A(8), T({ structure: true }), "front").chance,
  }
  // 6. Graze = half damage, no riders; a clean hit keeps riders. Frosty
  // enemy (Chill rider) + poisonOnHit, attacker at range 3, target in half cover.
  const mkFight = (seq) =>
    st([En("e", 4, 2, { range: 3, attack: 9, frosty: true, poisonOnHit: 2 }), P("p", 4, 5)], { "4-4": "log" }, { phase: "enemy", hitRolls: true, rollSeq: seq })
  let graze = null
  let clean2 = null
  for (let seq = 0; seq < 200 && (!graze || !clean2); seq++) {
    const s = E.attackUnit(mkFight(seq), "e", "p")
    const p = get(s, "p")
    const out = { seq, dmg: 40 - p.hp, poison: p.poison || 0, chill: p.chill || 0, log: s.log.join(" | "), grazeEv: s.events.some((e) => e.kind === "graze"), rollSeq: s.rollSeq }
    if (/GRAZE/.test(out.log)) graze = graze || out
    else clean2 = clean2 || out
  }
  r.graze = { graze, clean: clean2, chance: C.hitChance(mkFight(0), get(mkFight(0), "e"), get(mkFight(0), "p"), "front").chance }
  // Rolls off (hand-built states): exact full damage, never a graze.
  const off = E.attackUnit({ ...mkFight(0), hitRolls: undefined }, "e", "p")
  r.off = { dmg: 40 - get(off, "p").hp, log: off.log.at(-1) }
  // Hunker with rolls off still halves; with rolls on it does not halve.
  const hk = (rolls) => st([En("e", 4, 4, { attack: 10 }), P("p", 4, 5, { hunkered: 1 })], {}, { phase: "enemy", hitRolls: rolls })
  r.hunkerDmg = { off: 40 - get(E.attackUnit(hk(false), "e", "p"), "p").hp }
  // 7. Determinism: same state -> same outcome (twice), incl. rollSeq.
  const d1 = E.attackUnit(mkFight(7), "e", "p")
  const d2 = E.attackUnit(mkFight(7), "e", "p")
  r.det = JSON.stringify(d1.units) === JSON.stringify(d2.units) && JSON.stringify(d1.log) === JSON.stringify(d2.log) && d1.rollSeq === 8
  // Skills roll too (abilityHit): a graze on Root Snare-like root-shot skips the root.
  // 8. Preview == real with rolls on: a real prototype battle in contact,
  // over several turns, the preview's intents match what happens and the
  // real enemy turn is reproducible.
  const b0 = { ...E.createTacticsBattle(), hitRolls: true }
  const players = b0.units.filter((u) => u.side === "player")
  const enemies = b0.units.filter((u) => u.side === "enemy")
  let b = {
    ...b0,
    terrain: { "3-6": "rock", "5-6": "log" },
    units: b0.units.map((u) => {
      const pi = players.indexOf(u)
      if (pi >= 0) return { ...u, pos: { row: 2 + pi, col: 7 + (pi % 2) } }
      const ei = enemies.indexOf(u)
      return { ...u, pos: { row: 2 + ei, col: 4 + (ei % 2) } }
    }),
  }
  r.preview = { turns: 0, mismatch: [], grazes: 0, repro: true }
  for (let turn = 0; turn < 4 && b.phase === "player"; turn++) {
    const intents = E.previewEnemyIntents(b)
    const real = E.endPlayerTurn(b)
    const real2 = E.endPlayerTurn({ ...b })
    if (JSON.stringify(real.units) !== JSON.stringify(real2.units)) r.preview.repro = false
    // Every previewed attack shows up as a strike by that enemy on that target.
    const fresh = (real.events || []).filter((e) => e.seq > (b.eventSeq || 0))
    for (const { enemyId, intent: raw } of intents) {
      const i = raw.then || raw
      if ((i.kind === "attack" || i.kind === "move-attack") && !fresh.some((e) => e.kind === "strike" && e.actorId === enemyId && e.targetId === i.targetId)) r.preview.mismatch.push({ enemyId, i })
    }
    r.preview.grazes += fresh.filter((e) => e.kind === "graze").length
    r.preview.turns++
    // Next player turn: every player attacks something reachable (so rolls advance).
    b = real
    if (b.phase !== "player") break
    for (const p of b.units.filter((u) => u.side === "player" && u.hp > 0)) {
      const t = E.attackableTargets(b, p.id)[0]
      if (t) b = E.attackUnit(b, p.id, t.id)
      if (b.phase !== "player") break
    }
    r.preview.grazes += (b.events || []).filter((e) => e.kind === "graze").length
  }
  // 9a. AI takes cover: an archer that can shoot from several tiles picks one with cover.
  const ai = (rolls) => {
    const s = st([En("arch", 4, 3, { range: 3, move: 3, attack: 6 }), P("m", 4, 9, { move: 3, attack: 6 })], { "5-7": "rock" }, { phase: "enemy", hitRolls: rolls })
    const next = E.runEnemyTurn(s)
    const pos = get(next, "arch").pos
    return { pos, cover: C.coverAgainst(s, pos, { row: 4, col: 9 }) }
  }
  r.aiCover = { on: ai(true), off: ai(false) }
  // 9b. AI flanks: target hides behind a rock facing west; the archer picks a shot with less cover.
  const flank = (rolls) => {
    const s = st([En("arch", 4, 3, { range: 3, move: 6, attack: 6 }), P("m", 4, 9, { move: 1, attack: 1 })], { "4-8": "rock" }, { phase: "enemy", hitRolls: rolls })
    const intent = E.previewEnemyIntents({ ...s, phase: "player" })[0]?.intent
    const from = intent?.to || { row: 4, col: 3 }
    return { intent: intent?.kind, from, targetCover: C.coverAgainst(s, { row: 4, col: 9 }, from) }
  }
  r.aiFlank = { on: flank(true), off: flank(false) }
  return r
})

const T = eng.table
check("cover table: rock/barricade/boulder/tree/ice pillar = FULL", ["rock", "wall", "boulder", "tree", "icepillar"].every((t) => T[t] === 2), T)
check("cover table: log/tall grass/stump/rubble/barrel/spore pod = HALF", ["log", "bush", "stump", "rubble", "barrel", "sporepod"].every((t) => T[t] === 1), T)
check("cover table: open ground/forest/high ground/water = none", ["path", "forest", "high", "water"].every((t) => T[t] === 0), T)
const d = eng.dir
check(
  "direction: east rock covers vs east + diagonal-east shots; flanked from north/west; melee goes around",
  d.east === 2 && d.eastDiag === 2 && d.north === 0 && d.west === 0 && d.farOffAxis === 0 && d.adjacent === 0 && d.flankedNorth && !d.flankedEast,
  d,
)
check("high ground steps cover down one (full->half, half->none)", eng.high.full === 1 && eng.high.half === 0, eng.high)
check("hunker doubles cover (none->half, half->full, full->hunkered full)", eng.hunker.none === 1 && eng.hunker.half === 2 && eng.hunker.full === 3, eng.hunker)
const H = eng.hit
check(
  "hit %: melee 85, range 2 85, range 3 half 60 / full 40, +10 side, +10 & cover-1 from high ground, clamp 15, structures 100",
  H.melee === 85 && H.r2 === 85 && H.r3half === 60 && H.r3full === 40 && H.r3fullSide === 50 && H.r3high === 70 && H.clampLow === 15 && H.structure === 100,
  H,
)
const g = eng.graze
check(
  "GRAZE = half damage (rounded down), no poison/chill riders, logged with %; clean hit = full damage + riders",
  g.graze && g.clean && g.graze.dmg === Math.floor(g.clean.dmg / 2) && g.graze.poison === 0 && g.graze.chill === 0 && g.graze.grazeEv && g.clean.poison === 2 && g.clean.chill > 0 && /\(\d+%\)/.test(g.clean.log) && /GRAZE, 60% to hit/.test(g.graze.log),
  g,
)
check("rolls off (hand-built test states): exact full damage, no % in the log; hunker still halves", eng.off.dmg === 9 && !/%/.test(eng.off.log) && eng.hunkerDmg.off === 5, { off: eng.off, h: eng.hunkerDmg })
check("determinism: same state -> same result; each roll advances the counter", eng.det === true, eng.det)
check(
  "preview == real with rolls on (4 turns, intents land, real turn reproducible, grazes happen)",
  eng.preview.turns >= 2 && !eng.preview.mismatch.length && eng.preview.repro && eng.preview.grazes > 0,
  eng.preview,
)
check("enemy AI takes cover with rolls on", eng.aiCover.on.cover > 0, eng.aiCover)
check("enemy AI flanks a unit in cover (shoots from a side with less cover)", eng.aiFlank.on.targetCover < 2 && /attack/.test(eng.aiFlank.on.intent || ""), eng.aiFlank)

// ---------- UI ----------
const setBattle = (fn) =>
  page.evaluate(async (src) => {
    const f = window.__xf("HeartwoodTactics")
    const hook = f.memoizedState.next
    const cur = hook.memoizedState
    // eslint-disable-next-line no-new-func
    hook.queue.dispatch(new Function("cur", src)(cur))
    await new Promise((res) => setTimeout(res, 300))
  }, fn)
const readBattle = () => page.evaluate(() => window.__xf("TacticsBoard")?.memoizedProps.battle)
const b1 = await readBattle()
check("prototype page runs with hit rolls on", b1.hitRolls === true, b1.hitRolls)

// A player archer-ish unit facing an enemy that stands next to a rock.
await setBattle(`
  const players = cur.units.filter((u) => u.side === "player")
  const enemies = cur.units.filter((u) => u.side === "enemy")
  const shooter = players.find((u) => u.range > 1) || players[0]
  const units = cur.units.map((u) => {
    if (u.id === shooter.id) return { ...u, pos: { row: 4, col: 8 }, range: Math.max(u.range, 3), ap: 2 }
    const pi = players.indexOf(u)
    if (pi >= 0) return { ...u, pos: { row: pi, col: 11 } }
    const ei = enemies.indexOf(u)
    if (ei === 0) return { ...u, pos: { row: 4, col: 5 } }
    return { ...u, pos: { row: 8, col: ei } }
  })
  return { ...cur, units, terrain: { "4-6": "rock", "3-8": "log" }, wallHp: {}, objHp: {} }
`)
const shooterId = (await readBattle()).units.find((u) => u.pos.row === 4 && u.pos.col === 8).id
const targetId = (await readBattle()).units.find((u) => u.pos.row === 4 && u.pos.col === 5).id
await page.locator(`.hwt-token[data-unit-id="${shooterId}"]`).click()
await page.waitForTimeout(200)
await page.locator('.hwt-cell[data-cell="4-5"]').hover()
await page.waitForTimeout(250)
const badge = await page.evaluate(() => {
  const b = document.querySelector('.hwt-cell[data-cell="4-5"] .hwt-hit-badge')
  const panel = document.querySelector(".hwt-hit-panel")
  return { text: b?.textContent || null, hit: b?.dataset.hit, panel: panel?.textContent || null, enemyCover: document.querySelector('.hwt-cell[data-cell="4-5"] .hwt-unit-cover')?.dataset.cover }
})
const expect = await page.evaluate(
  async ([a, t]) => {
    const E = await import("/src/services/heartwood/tacticsEngine.js")
    return E.attackPreview(window.__xf("TacticsBoard").memoizedProps.battle, a, t)
  },
  [shooterId, targetId],
)
check(
  "ui: hovering a target in cover shows '% · dmg (graze N)' badge + breakdown panel, matching the engine",
  badge.text && badge.text.startsWith(`${expect.chance}%`) && badge.text.includes(`${expect.full} (graze ${expect.graze})`) && expect.cover === 2 && /Full cover -40/.test(badge.panel || "") && badge.enemyCover === "2",
  { badge, expect },
)
await page.screenshot({ path: SHOT, fullPage: false })

// Destination hover: shields on the covered sides of the hovered tile.
await page.locator('.hwt-cell[data-cell="4-5"]').hover({ position: { x: 2, y: 2 } }).catch(() => {})
const destKey = await page.evaluate(() => {
  const want = ["4-7", "2-8", "3-7", "5-8", "3-9"]
  return want.find((k) => document.querySelector(`.hwt-cell[data-cell="${k}"][data-move-band]`)) || null
})
await page.locator(`.hwt-cell[data-cell="${destKey}"]`).hover()
await page.waitForTimeout(200)
const shields = await page.evaluate((k) => [...document.querySelectorAll(`.hwt-cell[data-cell="${k}"] .hwt-cover-shield`)].map((s) => `${s.dataset.side}:${s.dataset.cover}`), destKey)
const expShields = await page.evaluate(async (k) => {
  const C = await import("/src/services/heartwood/tacticsCover.js")
  const [row, col] = k.split("-").map(Number)
  const sides = C.tileCoverSides(window.__xf("TacticsBoard").memoizedProps.battle, { row, col })
  return Object.entries(sides).filter(([, v]) => v > 0).map(([s, v]) => `${s}:${v === 2 ? "full" : "half"}`)
}, destKey)
check("ui: hovering a move destination shows half/full shields on its covered sides", destKey && shields.length > 0 && JSON.stringify(shields.sort()) === JSON.stringify(expShields.sort()), { destKey, shields, expShields })

// GRAZE callout: force a graze by walking the roll counter until the shot misses.
const forced = await page.evaluate(
  async ([a, t]) => {
    const E = await import("/src/services/heartwood/tacticsEngine.js")
    const cur = window.__xf("HeartwoodTactics").memoizedState.next.memoizedState
    for (let seq = 0; seq < 300; seq++) {
      const s = E.attackUnit({ ...cur, rollSeq: seq }, a, t)
      if (s.events.some((e) => e.kind === "graze" && e.seq > (cur.eventSeq || 0))) return seq
    }
    return null
  },
  [shooterId, targetId],
)
await setBattle(`return { ...cur, rollSeq: ${forced ?? 0} }`)
await page.locator(`.hwt-cell[data-cell="4-5"]`).click()
let callout = null
for (let i = 0; i < 12 && !callout; i++) {
  await page.waitForTimeout(100)
  callout = await page.evaluate(() => [...document.querySelectorAll(".hw-floating-number--graze")].map((e) => e.textContent)[0] || null)
}
const afterShot = await readBattle()
check("ui: a missed roll shows a GRAZE callout and a '(GRAZE, N% to hit)' log line", forced !== null && callout === "GRAZE" && afterShot.log.some((l) => /GRAZE, \d+% to hit/.test(l)), { forced, callout, last: afterShot.log.at(-1) })

// End turn with rolls live: enemy turn resolves cleanly.
await page.locator(".hwt-end-turn").click()
await page.waitForTimeout(1500)
check("ui: end turn with hit rolls live resolves cleanly", ["player", "won", "lost"].includes((await readBattle()).phase))

// ?rolls=0 turns rolls off (QA switch the older UI suites use).
await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board .hwt-token", { timeout: 30000 })
check("?rolls=0 turns hit rolls off", !(await readBattle()).hitRolls)

check("no page errors", errs.length === 0, errs.slice(0, 5))
await browser.close()

const failed = checks.filter((c) => !c.ok)
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.ok ? "" : `\n     ${JSON.stringify(c.detail).slice(0, 1200)}`}`)
console.log(`screenshot: ${SHOT}`)
console.log(`${checks.length - failed.length}/${checks.length} PASS`)
process.exit(failed.length ? 1 : 0)
