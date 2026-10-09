import { chromium } from "playwright"
import fs from "node:fs"
import { execFileSync } from "node:child_process"

// Mutations (data/heartwood/mutations.js + services/heartwood/mutations.js
// + tacticsMutations.js): every mutation's effect in a real run tactics
// fight (incl. the resource ones), the gain sources (fight / event /
// breeding), badges on the card + battle token, and a Studio edit taking
// effect. Usage: PORT=5445 node .scratch/verify_mutations.mjs
const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || ".scratch/shots"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const fail = (m) => out.errors.push(m)

const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

// Shared in-page helpers (re-installed after every navigation).
async function install() {
  await page.evaluate(async () => {
    const rt = await import("/src/services/heartwood/runEngine.js")
    const te = await import("/src/services/heartwood/tacticsEngine.js")
    const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const mk = (bench, extra = {}) => ({
      ...rt.startRun("tommy", null, { forcedSeed: 777 }),
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench,
      deployed: [...bench.map((e) => e.key), null, null, null, null].slice(0, 4),
      items: [],
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
      ...extra,
    })
    const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s))
    // Clean arena: no terrain/objective, hand-placed units, enemies stunned + parked.
    const arena = (battle, place, terrain = {}) => {
      let far = 0
      return {
        ...battle,
        terrain,
        objective: null,
        phase: "player",
        noGraze: true,
        hitRolls: false,
        units: battle.units.map((u) => {
          const p = place[u.id]
          if (p) return { ...u, ...p, pos: { row: p.row, col: p.col } }
          if (u.side === "enemy") return { ...u, pos: { row: far, col: 0 }, stun: 9, enemySkills: [], farParked: far++ }
          return { ...u, pos: { row: 8, col: 11 - far++ } }
        }),
      }
    }
    window.__mut = { rt, te, mk, start, arena }
  })
}
await install()

const r = await page.evaluate(async () => {
  const { rt, te, mk, start, arena } = window.__mut
  const M = await import("/src/services/heartwood/mutations.js")
  const MD = await import("/src/data/heartwood/mutations.js")
  const manaFx = await import("/src/services/heartwood/tacticsMana.js")
  const cover = await import("/src/services/heartwood/tacticsCover.js")
  const H = await import("/src/services/heartwood/hearth.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const res = { fx: {}, gain: {} }
  const U = (b, id) => b.units.find((u) => u.id === id)
  const foe = { block: 0, ward: 0, revive: 0, nimble: false, taunt: 0, bulwark: 0, evade: 0, stun: 0 }

  // Hero per test: hexbreaker (arcane mana, melee reach), strength (Rage,
  // starts empty), a ranged hero for Long Neck.
  const built = (defId, mutations) => {
    const st = start(mk([{ key: "b0", defId, upgradeLevel: 0, upgrades: [], ...(mutations ? { mutations } : {}) }]))
    return st.battle
  }
  const rangedId = Object.values(UNITS).find((u) => {
    if (u.tier !== "common" || u.summonOnly || u.fusedFrom || u.evolvedFrom) return false
    const b = built(u.id)
    return (U(b, `player-${u.id}-0`)?.range || 1) > 1
  })?.id
  const heroFor = (m) => (m.fx.range ? rangedId : m.fx.manaStartPct ? "strength" : "hexbreaker")
  const enemyOf = (b) => b.units.find((u) => u.side === "enemy").id

  for (const m of Object.values(MD.MUTATIONS)) {
    const defId = heroFor(m)
    const hid = `player-${defId}-0`
    const base = built(defId)
    const mut = built(defId, [m.id])
    const b0 = U(base, hid)
    const b1 = U(mut, hid)
    const checks = {}
    const fx = m.fx
    checks.listed = JSON.stringify(b1.mutations) === JSON.stringify([m.id])
    if (fx.hp || fx.hpPct) checks.hp = b1.maxHp - b0.maxHp === (fx.hp || 0) + Math.round((b0.maxHp * (fx.hpPct || 0)) / 100)
    if (fx.attack) checks.attack = b1.attack - b0.attack === fx.attack
    if (fx.move) checks.move = b1.move === Math.max(1, b0.move + fx.move)
    if (fx.range) checks.range = b1.range - b0.range === fx.range
    if (fx.apStart) checks.apStart = b1.ap - b0.ap === fx.apStart
    if (fx.ward) checks.ward = (b1.ward || 0) - (b0.ward || 0) === fx.ward
    if (fx.evade) checks.evade = (b1.evade || 0) - (b0.evade || 0) === fx.evade
    if (fx.manaMax) checks.manaMax = b1.manaMax - b0.manaMax === fx.manaMax
    if (fx.manaStartPct) checks.manaStart = b1.mana - b0.mana === Math.round((b1.manaMax * fx.manaStartPct) / 100) && b0.mana === 0
    if (fx.aim) {
      const e = enemyOf(mut)
      const place = { [hid]: { row: 4, col: 6, facing: "W" }, [e]: { row: 4, col: 3, ...foe } }
      const s0 = arena(base, place)
      const s1 = arena(mut, place)
      const c0 = cover.hitChance(s0, U(s0, hid), U(s0, e)).chance
      const c1 = cover.hitChance(s1, U(s1, hid), U(s1, e))
      checks.aim = c1.parts.some((p) => p.label === "Mutation" && p.value === fx.aim) && c1.chance - c0 === fx.aim
    }
    // On a landed hit: element / leech.
    if (fx.fireOnHit || fx.frostOnHit || fx.poisonOnHit || fx.natureOnHit || fx.leech) {
      const e = enemyOf(mut)
      const place = { [hid]: { row: 4, col: 6, facing: "W", hp: 10 }, [e]: { row: 4, col: 5, hp: 90, maxHp: 90, ...foe } }
      const a0 = te.attackUnit(arena(base, place), hid, e)
      const a1 = te.attackUnit(arena(mut, place), hid, e)
      if (fx.fireOnHit) checks.fire = (U(a1, e).burn || 0) - (U(a0, e).burn || 0) === fx.fireOnHit
      if (fx.frostOnHit) checks.frost = (U(a1, e).chill || 0) - (U(a0, e).chill || 0) === fx.frostOnHit
      if (fx.poisonOnHit) checks.poison = (U(a1, e).poison || 0) - (U(a0, e).poison || 0) === fx.poisonOnHit
      if (fx.natureOnHit) checks.nature = (U(a1, e).entangle || 0) > (U(a0, e).entangle || 0)
      if (fx.leech) checks.leech = U(a1, hid).hp - U(a0, hid).hp === fx.leech
    }
    // Thorns: an enemy hits the hero and takes damage back.
    if (fx.thorns) {
      const e = enemyOf(mut)
      const place = { [hid]: { row: 4, col: 6, facing: "E" }, [e]: { row: 4, col: 5, hp: 50, maxHp: 50, ap: 2, ...foe } }
      const t0 = te.attackUnit({ ...arena(base, place), phase: "enemy" }, e, hid)
      const t1 = te.attackUnit({ ...arena(mut, place), phase: "enemy" }, e, hid)
      checks.thorns = U(t0, e).hp - U(t1, e).hp === fx.thorns
    }
    // Turn start: regen / block / resource regen / gills.
    if (fx.regen || fx.block || fx.manaRegen || fx.gills) {
      const terrain = fx.gills ? { "4-5": "water" } : {}
      const place = { [hid]: { row: 4, col: 6, hp: 5, mana: 0, overcharge: 0 } }
      const n0 = te.endPlayerTurn(arena(base, place, terrain))
      const n1 = te.endPlayerTurn(arena(mut, place, terrain))
      if (fx.regen) checks.regen = U(n1, hid).hp - U(n0, hid).hp === fx.regen
      if (fx.block) checks.block = U(n1, hid).block - U(n0, hid).block === fx.block
      if (fx.manaRegen) {
        const want = fx.manaRegen + (Math.round(b1.manaMax * 0.1) - Math.round(b0.manaMax * 0.1))
        checks.manaRegen = manaFx.regenFor(b1) - manaFx.regenFor(b0) === want && U(n1, hid).mana - U(n0, hid).mana === want
      }
      if (fx.gills) {
        checks.gills = U(n1, hid).mana - U(n0, hid).mana === fx.gills
        // ...and nothing away from water.
        const dry0 = te.endPlayerTurn(arena(base, place))
        const dry1 = te.endPlayerTurn(arena(mut, place))
        checks.gillsDry = U(dry1, hid).mana === U(dry0, hid).mana
      }
    }
    // Echo: first skill refunds AP once.
    if (fx.echo) {
      const e = enemyOf(mut)
      const place = { [hid]: { row: 4, col: 6, facing: "W" }, [e]: { row: 4, col: 5, hp: 90, maxHp: 90, ...foe } }
      const s0 = arena(base, place)
      const s1 = arena(mut, place)
      const ab = U(s1, hid).ability
      const targets = te.abilityTargets(s1, hid)
      const tgt = targets.length ? targets[0] : null
      const tid = tgt?.id ?? tgt ?? e
      const c0 = te.castAbility(s0, hid, tid)
      const c1 = te.castAbility(s1, hid, tid)
      checks.echo = !!ab && c1 !== s1 && U(c1, hid).ap - U(c0, hid).ap === fx.echo && U(c1, hid).echoUsed === true
    }
    const keys = Object.keys(checks)
    res.fx[m.id] = { hero: defId, ok: keys.every((k) => checks[k] === true), checks }
  }
  res.rangedId = rangedId

  // --- Gain source 1: fights. Corrupted + Blight >> a plain win; a big
  // kill gives a good one; the run bench + aftermath line get it.
  const plain = (seed, extra) => {
    const rs = { ...mk([{ key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] }]), seed }
    const st = start(rs)
    const hu = U(st.battle, "player-hexbreaker-0")
    const battle = { ...st.battle, ...extra, units: st.battle.units.map((u) => (u.id === hu.id ? { ...u, kills: extra.kills || 0 } : u)) }
    if (extra.blightHere) battle.blight = { [`${hu.pos.row}-${hu.pos.col}`]: true }
    return { rs: st, battle }
  }
  let nPlain = 0, nCorr = 0, nBig = 0, bigBad = 0
  for (let seed = 1; seed <= 60; seed++) {
    const p = plain(seed, {})
    if (M.rollFightMutations(p.rs, p.battle, { type: "battle" }).lines.length) nPlain++
    const c = plain(seed, { faction: "corrupted", blightHere: true })
    if (M.rollFightMutations(c.rs, c.battle, { type: "battle" }).lines.length) nCorr++
    const k = plain(seed, { kills: 1 })
    const got = M.rollFightMutations(k.rs, k.battle, { type: "elite" })
    if (got.lines.length) {
      nBig++
      const id = got.runState.bench[0].mutations[0]
      if (MD.MUTATIONS[id].kind !== "good") bigBad++
    }
  }
  res.gain.fight = { nPlain, nCorr, nBig, bigBad }
  // End to end through resolveBattleOutcome (a corrupted won fight).
  let e2e = null
  for (let seed = 1; seed <= 30 && !e2e; seed++) {
    const c = plain(seed, { faction: "corrupted", blightHere: true })
    const won = rt.resolveBattleOutcome({ ...c.rs, battle: { ...c.battle, phase: "won", round: 3, units: c.battle.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) } })
    const b0 = won.bench.find((e) => e.key === "b0")
    if (b0.mutations?.length) e2e = { seed, muts: b0.mutations, lines: won.lastMutations }
  }
  res.gain.e2e = e2e

  // --- Gain source 2: events. Force the Glowing Puddle at an Act-4 event node.
  const evIdx = rt.RUN_PATH.findIndex((n, i) => n.type === "event" && rt.actIndexForNode(i, rt.RUN_PATH.length) === 4)
  const ev = await import("/src/data/heartwood/events.js")
  const act4 = ev.EVENTS.filter((x) => x.act === 4 && x.id !== "the-glowing-puddle").map((x) => x.id)
  const rsE = {
    ...mk([{ key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] }, { key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }]),
    nodeIndex: evIdx, path: rt.RUN_PATH.slice(0, evIdx + 1), phase: "event", seenEvents: act4,
  }
  const evNow = rt.eventForNode(rsE)
  const preview = rt.previewEventMutations(rsE, 0)
  const after = rt.resolveEventChoice(rsE, 0)
  const mutated = after.bench.filter((e) => e.mutations?.length)
  res.gain.event = {
    evIdx, event: evNow?.id, preview, lines: after.lastMutations, mutated: mutated.map((e) => [e.defId, e.mutations]),
    walkOn: rt.resolveEventChoice(rsE, 2).bench.filter((e) => e.mutations?.length).length,
    allThree: ["the-glowing-puddle", "the-grafting-hermit", "the-spore-chorus"].every((id) => ev.EVENTS.some((x) => x.id === id && x.choices.some((c) => c.effects.some((f) => f.mutation)))),
  }

  // --- Gain source 3: breeding - a hatchling with an inherited mutation
  // carries it into a run fight; a mutation grown in a run comes home.
  const hh = H.normalizeHearth({ version: 1, runs: 1, nextHid: 9, rooms: {}, roster: [{ hid: 7, defId: "hexbreaker", xp: 0, parents: [1, 2], generation: 1, bornRun: 0, mutations: ["thorny-back"] }] })
  const hs = H.hearthStartFor(hh, [7])
  let rsB = rt.startRun("tommy", null, { forcedSeed: 4321, hearthStart: hs })
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  rsB = { ...rsB, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length) }
  const vet = rsB.bench.find((e) => e.hearthId === 7)
  const stB = start(rsB)
  const tok = stB.battle.units.find((u) => u.defId === "hexbreaker" && u.side === "player")
  const grown = { ...rsB, bench: rsB.bench.map((e) => (e.key === vet.key ? { ...e, mutations: [...e.mutations, "split-tail"] } : e)) }
  const home = H.harvestRun(hh, { ...grown, phase: "victory" }, true, "mut-run")
  res.gain.breed = { vetMuts: vet.mutations, tokenMuts: tok?.mutations, thornTrigger: !!tok?.triggers?.some((t) => t.source === "Thorny Back"), home: home.hearth.roster.find((u) => u.hid === 7)?.mutations }
  return res
})
out.logic = r
const bad = Object.entries(r.fx).filter(([, v]) => !v.ok)
out.fxSummary = `${Object.keys(r.fx).length - bad.length}/${Object.keys(r.fx).length} mutations verified`
if (Object.keys(r.fx).length < 25 || bad.length) fail(`fx: ${bad.map(([id, v]) => `${id} ${JSON.stringify(v.checks)}`).join(" | ")}`)
const g = r.gain
if (!(g.fight.nCorr > g.fight.nPlain + 15 && g.fight.nBig > 10 && g.fight.bigBad === 0 && g.e2e && g.e2e.lines?.length === 1 && /🧬/.test(g.e2e.lines[0])))
  fail(`gain/fight: ${JSON.stringify(g.fight)} e2e=${JSON.stringify(g.e2e)}`)
if (!(g.event.event === "the-glowing-puddle" && g.event.mutated.length === 1 && g.event.lines?.length === 1 && JSON.stringify(g.event.preview) === JSON.stringify(g.event.lines) && g.event.walkOn === 0 && g.event.allThree))
  fail(`gain/event: ${JSON.stringify(g.event)}`)
if (!(g.breed.vetMuts?.join() === "thorny-back" && g.breed.tokenMuts?.join() === "thorny-back" && g.breed.thornTrigger && g.breed.home?.join() === "thorny-back,split-tail"))
  fail(`gain/breeding: ${JSON.stringify(g.breed)}`)

// --- UI: badges on the card (shop) + on the battle token, plus the screenshot.
{
  await page.evaluate(async () => {
    const { rt, mk, start } = window.__mut
    localStorage.clear()
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    const rs = mk([
      { key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], mutations: ["extra-eye", "ember-blood", "glass-bones"] },
      { key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [], mutations: ["mossy-hide"] },
      { key: "b2", defId: "strength", upgradeLevel: 0, upgrades: [] },
    ])
    const st = start(rs)
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(st)))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".hwt-board").waitFor({ timeout: 15000 })
  await page.waitForTimeout(800)
  const ui = {}
  ui.mutatedTokens = await page.locator(".hwt-token[data-mutated=true]").count()
  ui.glyphs = await page.locator(".hwt-token .hwt-mut-glyph").count()
  ui.badge = await page.locator('.hwt-token[data-unit-id="player-hexbreaker-0"] .hwt-mut-badge').innerText().catch(() => "")
  ui.badgeTitle = await page.locator('.hwt-token[data-unit-id="player-hexbreaker-0"] .hwt-mut-badge').getAttribute("title").catch(() => "")
  // The glyph is really on top (not hidden under the token art).
  ui.glyphOnTop = await page.evaluate(() => {
    const g = document.querySelector('.hwt-token[data-unit-id="player-hexbreaker-0"] .hwt-mut-glyph')
    if (!g) return false
    const r = g.getBoundingClientRect()
    const cs = getComputedStyle(g)
    const t = g.closest(".hwt-token").getBoundingClientRect()
    return r.width > 0 && Number(cs.zIndex) >= 3 && Number(cs.opacity) > 0.5 && r.left >= t.left && r.right <= t.right && r.top >= t.top && r.bottom <= t.bottom
  })
  ui.plainToken =await page.locator('.hwt-token[data-unit-id="player-strength-2"][data-mutated]').count()
  await page.screenshot({ path: `${SHOTS}/mutations_battle.png` })
  // Close-up of the mutated tokens (the glyph overlay + 🧬 badge).
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 4, mobile: false })
  await page.waitForTimeout(300)
  const box = await page.locator('.hwt-token[data-unit-id="player-hexbreaker-0"]').boundingBox()
  if (box) await page.screenshot({ path: `${SHOTS}/mutations_tokens_zoom.png`, clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height * 2 + 30 } }).catch(() => {})
  await cdp.send("Emulation.clearDeviceMetricsOverride")
  await cdp.detach()
  // Card: the same bench in the shop.
  await install()
  await page.evaluate(async () => {
    const { rt, mk } = window.__mut
    const rs = { ...mk([{ key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], mutations: ["extra-eye", "ember-blood"] }]), phase: "shop" }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(rs)))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".hw-mut-badge").first().waitFor({ timeout: 15000 }).catch(() => {})
  ui.cardBadges = await page.locator(".hw-card-mutations .hw-mut-badge").count()
  ui.cardTitle = await page.locator(".hw-card-mutations .hw-mut-badge").first().getAttribute("title").catch(() => "")
  out.ui = ui
  if (!(ui.mutatedTokens === 2 && ui.glyphs === 2 && ui.glyphOnTop && /3/.test(ui.badge) && /Extra Eye/.test(ui.badgeTitle) && /Glass Bones/.test(ui.badgeTitle) && ui.plainToken === 0))
    fail("UI: mutation glyph/badge on battle tokens wrong")
  if (!(ui.cardBadges >= 2 && /Extra Eye/.test(ui.cardTitle)))
    fail("UI: mutation badges on the unit card wrong")
}

// --- Studio: Mutations editor (plain-English default, numbers behind a toggle),
// and an edit applied through the patchbay script takes effect in the game.
{
  await page.goto(`http://localhost:${PORT}/hearthwood-studio?view=mutations`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector('[data-testid="mutation-editor"]', { timeout: 20000 })
  await page.locator('[data-testid="mutation-editor"] [data-mutation="sickly"]').click()
  const studio = {}
  studio.title = await page.locator('[data-testid="mutation-title"]').innerText()
  studio.friendly = await page.locator('[data-field="text"]').count()
  studio.numbersBefore = await page.locator('[data-testid="mutation-numbers"]').count()
  await page.locator('[data-testid="mutation-numbers-toggle"]').click()
  studio.numbersAfter = await page.locator('[data-field="fx.hp"]').count()
  await page.locator('[data-field="fx.hp"]').fill("-9")
  studio.previewEnabled = await page.locator('[data-testid="mutation-preview"]').isEnabled()
  await page.screenshot({ path: `${SHOTS}/mutations_studio.png` })
  const file = "src/data/heartwood/mutations.js"
  const orig = fs.readFileSync(file, "utf8")
  try {
    const res = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-apply-edit.mjs"], { input: JSON.stringify({ filePath: file, exportName: "MUTATIONS", edits: [{ path: ["sickly", "fx", "hp"], op: "set", value: -9 }] }), encoding: "utf8" }))
    studio.applied = res.applied?.length
    if (!res.ok) fail("Studio: apply-edit rejected the mutation edit")
    fs.writeFileSync(file, res.proposedCode)
    await new Promise((r2) => setTimeout(r2, 1500))
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await install()
    studio.hpDiff = await page.evaluate(async () => {
      const { mk, start } = window.__mut
      const b = (m) => start(mk([{ key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], ...(m ? { mutations: m } : {}) }])).battle.units.find((u) => u.id === "player-hexbreaker-0").maxHp
      return b(["sickly"]) - b(null)
    })
  } catch (e) {
    fail(`Studio pipeline: ${e.message.slice(0, 200)}`)
  } finally {
    fs.writeFileSync(file, orig)
  }
  const json = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-read-entities.mjs", "--type", "mutations"], { encoding: "utf8", maxBuffer: 8e6 }))
  studio.readerCount = json.entities.length
  out.studio = studio
  if (!(/Sickly/.test(studio.title) && studio.friendly === 1 && studio.numbersBefore === 0 && studio.numbersAfter === 1 && studio.previewEnabled && studio.hpDiff === -9 && studio.readerCount >= 25))
    fail(`Studio: ${JSON.stringify(studio)}`)
}

out.pageErrors = errs
if (errs.length) fail(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
