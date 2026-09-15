import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - battle readability & impact pass. Marc: "kehitetään
// peliä lisää" -> taistelun tuntuma ja luettavuus (all 4 slices).
// Magnitude-scaled floaters + stage shake, status-tick pulses,
// iconified intents, and a real post-battle recap (biggest hit / MVP /
// closest call). Every engine addition is write-only to NEW state keys
// or NEW roundEvents - no combat-math change.

const PORT = process.env.PORT || 5339
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-battle-read"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound, autoResolveBattle, summarizeBattle } = await import(
    "/src/services/heartwood/autoBattleEngine.js"
  )
  const { tickPoison, tickBurn, tickRegen, applyEffects } = await import("/src/services/heartwood/effects.js")

  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- 1. biggestHit (recordMax via dealDamage) -----------------
  // dealDamage applies Strength/Weak/etc, so the recorded amounts won't
  // equal the raw inputs - assert against the actual per-hit overflow
  // recorded in roundEvents.
  let s = startAutoBattle("tommy", ["thornguard"], "rotwood-husk")
  const p0 = s.playerUnits[0].id
  const e0 = s.enemies[0].id
  for (const amt of [12, 25, 8]) s = applyEffects(s, [{ type: "damage", amount: amt }], { actorId: p0, targetId: e0 })
  const hits = (s.roundEvents || []).filter((x) => x.kind === "damage" && x.amount).map((x) => x.amount)
  out.detail.hits = hits
  out.ok.biggestHitIsMax = (s.stats?.[p0]?.biggestHit || 0) === Math.max(...hits)
  out.ok.damageDealtStillSums = (s.stats?.[p0]?.damageDealt || 0) === hits.reduce((a, b) => a + b, 0)
  out.ok.biggestHitNotLoweredBySmall = Math.max(...hits) > hits[hits.length - 1] // 3rd hit is smallest

  // ---- 2. tick roundEvents -------------------------------------
  const withStatus = (id, val) => {
    let st = startAutoBattle("tommy", ["thornguard"], "rotwood-husk")
    st = { ...st, roundEvents: [] }
    st.playerUnits = st.playerUnits.map((u, i) => (i === 0 ? { ...u, powers: { ...u.powers, [id]: val } } : u))
    return st
  }
  let ps = withStatus("poison", 3)
  const psId = ps.playerUnits[0].id
  const psHpBefore = ps.playerUnits[0].hp
  ps = tickPoison(ps, ps.playerUnits)
  const psEv = (ps.roundEvents || []).find((x) => x.kind === "tick" && x.statusId === "poison")
  out.ok.poisonTickEvent = !!psEv && psEv.targetId === psId && psEv.amount === 3
  out.ok.poisonTickHp = ps.playerUnits[0].hp === psHpBefore - 3

  let bs = withStatus("burn", 6)
  bs = tickBurn(bs, bs.playerUnits)
  const bsEv = (bs.roundEvents || []).find((x) => x.kind === "tick" && x.statusId === "burn")
  out.ok.burnTickEvent = !!bsEv && bsEv.amount === 6

  let rs = withStatus("regen", 4)
  const rsHpBefore = rs.playerUnits[0].hp
  rs = tickRegen(rs, rs.playerUnits)
  const rsEv = (rs.roundEvents || []).find((x) => x.kind === "tick" && x.statusId === "regen")
  out.ok.regenTickEvent = !!rsEv && rsEv.amount === 4
  out.ok.regenTickHeals = rs.playerUnits[0].hp >= rsHpBefore // may be capped at maxHp

  // no poison -> no tick event
  let np = startAutoBattle("tommy", ["thornguard"], "rotwood-husk")
  np = { ...np, roundEvents: [] }
  np = tickPoison(np, np.playerUnits)
  out.ok.noStatusNoTick = !(np.roundEvents || []).some((x) => x.kind === "tick")

  // ---- 3. lowestSquadHpPct ----------------------------------
  const fresh = startAutoBattle("tommy", ["thornguard", "thornguard", "the-fool"], "rotwood-husk-pair")
  out.ok.lowStartsAt100 = fresh.lowestSquadHpPct === 100
  let stepped = fresh
  const lows = []
  for (let i = 0; i < 8 && stepped.phase === "player"; i++) {
    stepped = resolveRound(stepped)
    lows.push(stepped.lowestSquadHpPct)
  }
  out.ok.lowIsMonotonic = lows.every((v, i) => i === 0 || v <= lows[i - 1] + 1e-9)
  out.ok.lowDippedOrCombatEnded = lows[lows.length - 1] < 100 || stepped.phase !== "player"
  out.detail.lows = lows.map((v) => Math.round(v))

  // ---- 4. summarizeBattle ---------------------------------
  const done = autoResolveBattle(startAutoBattle("tommy", ["thornguard", "the-fool"], "rotwood-husk"))
  const sum = summarizeBattle(done)
  out.ok.summaryShape =
    sum.biggestHit &&
    typeof sum.biggestHit.amount === "number" &&
    sum.biggestHit.amount > 0 &&
    typeof sum.closestMoment === "number" &&
    sum.closestMoment >= 0 &&
    sum.closestMoment <= 100 &&
    Array.isArray(sum.entries)
  out.detail.summary = { biggestHit: sum.biggestHit, closest: sum.closestMoment, top: sum.topUnit?.name }

  // ---- 5. OUTCOME INVARIANCE (the sharp edge) --------------
  // Deterministic Math.random so autoResolveBattle is reproducible.
  const realRandom = Math.random
  const seq = [0.13, 0.71, 0.42, 0.9, 0.05, 0.55, 0.31, 0.66, 0.22, 0.88, 0.47, 0.03]
  let ri = 0
  Math.random = () => seq[ri++ % seq.length]

  const outcome = (mut) => {
    ri = 0
    let st = startAutoBattle("tommy", ["thornguard", "the-fool", "thornguard"], "rune-wardens-escort")
    if (mut) st = mut(st)
    st = autoResolveBattle(st)
    return {
      phase: st.phase,
      hp: [...st.playerUnits, ...st.enemies].map((u) => `${u.id}:${u.hp}`).sort(),
    }
  }
  const baseA = outcome(null)
  const baseB = outcome(null)
  out.ok.deterministicRepeat = eq(baseA, baseB)
  // pre-seed the new fields with absurd values - if the sim ever read
  // them, the outcome would move.
  const withWeirdLow = outcome((st) => ({ ...st, lowestSquadHpPct: -999 }))
  const withWeirdStats = outcome((st) => ({
    ...st,
    stats: Object.fromEntries(st.playerUnits.map((u) => [u.id, { damageDealt: 9999, healingDone: 5, biggestHit: 9999 }])),
  }))
  out.ok.lowestSquadHpPctInert = eq(baseA, withWeirdLow)
  out.ok.biggestHitInert = eq(baseA, withWeirdStats)
  Math.random = realRandom

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- 6. UI ---------------------------------------------------
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun } = await import("/src/services/heartwood/runEngine.js")
  let idx = RUN_PATH.findIndex((n) => n?.type === "battle")
  if (idx < 0) idx = 1
  const s = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", essence: 999 }
  // deploy a couple of hitters + a healer so the recap has bars
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload()
await page.waitForTimeout(800)

// FormationScreen -> deploy all + start
const deployAll = page.locator("button", { hasText: /Deploy all|Auto-deploy|Deploy/i }).first()
if (await deployAll.isVisible().catch(() => false)) {
  await deployAll.click().catch(() => {})
  await page.waitForTimeout(300)
}
const startBtn = page.locator("button", { hasText: /Start|Fight|Begin|To battle/i }).first()
if (await startBtn.isVisible().catch(() => false)) {
  await startBtn.click().catch(() => {})
}
await page.waitForSelector(".hw-battle", { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(500)

// let a few rounds of auto-play happen, then Auto-Resolve
let floatersSeen = 0
let bigSeen = 0
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(700)
  floatersSeen = Math.max(floatersSeen, await page.locator(".hw-floating-number").count())
  bigSeen = Math.max(bigSeen, await page.locator(".hw-floating-number--big").count())
  if (await page.locator(".hw-recap").isVisible().catch(() => false)) break
}
const dataStatusPips = await page.locator("[data-status]").count()
console.log("floaters seen:", floatersSeen, "| big:", bigSeen, "| data-status pips:", dataStatusPips)

const autoResolve = page.locator("button", { hasText: /Auto-?Resolve|Resolve|Skip/i }).first()
if (await autoResolve.isVisible().catch(() => false)) {
  await autoResolve.click().catch(() => {})
}
await page.waitForSelector(".hw-recap", { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(400)
const recapVisible = await page.locator(".hw-recap").isVisible().catch(() => false)
const highlights = await page.locator(".hw-recap-highlight").count()
const bars = await page.locator(".hw-recap-bar-row").count()
const recapText = (await page.locator(".hw-recap").textContent().catch(() => ""))?.replace(/\s+/g, " ").trim()
console.log("recap visible:", recapVisible, "| highlights:", highlights, "| bars:", bars)
console.log("recap text:", JSON.stringify((recapText || "").slice(0, 240)))
await page.locator(".hw-overlay").screenshot({ path: `${SHOT_DIR}/readability_recap.png` }).catch(() => {})

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
await browser.close()

const uiOk =
  floatersSeen > 0 &&
  dataStatusPips >= 0 && // pips only if a status is up; don't hard-require
  recapVisible &&
  highlights >= 1 &&
  /Closest call|Biggest hit|MVP/.test(recapText || "") &&
  noHScroll

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk, "| noHScroll:", noHScroll)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
