import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Elite encounters. Marc: "viholliset ja bossit". 4 elite
// enemies on fixed `type: "elite"` RUN_PATH nodes, each with one gimmick
// (a passive trigger) + an HP-threshold phases escalation. Pure data -
// reuses checkBossPhases + the trigger system, no new engine code.

const PORT = process.env.PORT || 5341
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-elites"
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
  const { RUN_PATH, startRun, startFormationBattle, essenceForWin } = await import(
    "/src/services/heartwood/runEngine.js"
  )
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { startAutoBattle, resolveRound, autoResolveBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { applyEffects } = await import("/src/services/heartwood/effects.js")

  const out = { ok: {}, detail: {} }
  const EXPECT = ["the-gorging-maw", "the-iron-sentinel", "the-bramble-lash", "the-ashfall-herald"]

  // ---- 1. RUN_PATH shape ----------------------------------------
  const eliteIdx = RUN_PATH.map((n, i) => (n.type === "elite" ? i : -1)).filter((i) => i >= 0)
  out.ok.fourElites = eliteIdx.length === 4
  out.ok.eliteEnemiesKnown = eliteIdx.every((i) => ENEMIES[RUN_PATH[i].enemyId] && EXPECT.includes(RUN_PATH[i].enemyId))
  out.ok.battleCount47 = RUN_PATH.filter((n) => n.type === "battle").length === 47
  out.detail.eliteIdx = eliteIdx.map((i) => [i, RUN_PATH[i].enemyId])

  // ---- 2. each elite resolves into a fight ---------------------
  out.ok.fightsResolve = eliteIdx.every((i) => {
    const base = startRun("tommy")
    const rs = { ...base, nodeIndex: i, path: RUN_PATH.slice(0, i + 1), phase: "formation" }
    const started = startFormationBattle(rs)
    const e = started.battle?.enemies?.[0]
    return e && e.defId === RUN_PATH[i].enemyId && e.maxHp > 0 && ENEMIES[e.defId].phases?.length
  })

  // ---- 3. gimmicks fire --------------------------------------
  // lifelink: damage the Maw, then let it land a hit on a Ward-less unit
  // -> its onDealDamage trigger heals it.
  {
    let s = startAutoBattle("tommy", ["the-fool"], "the-gorging-maw")
    const eid = s.enemies[0].id
    const pid = s.playerUnits.find((u) => u.id !== "commander")?.id || s.playerUnits[0].id
    s = applyEffects(s, [{ type: "damage", amount: 30 }], { actorId: pid, targetId: eid })
    const hpAfterHit = s.enemies[0].hp
    s = applyEffects(s, [{ type: "damage", amount: 12 }], { actorId: eid, targetId: pid })
    out.ok.lifelinkHeals = s.enemies[0].hp > hpAfterHit
    out.detail.lifelink = { hpAfterHit, hpAfterItAttacks: s.enemies[0].hp }
  }
  // thorns: hit the Lash -> the attacker takes damage back
  {
    let s = startAutoBattle("tommy", ["thornguard", "the-fool"], "the-bramble-lash")
    const eid = s.enemies[0].id
    const pid = s.playerUnits[1].id
    const pHpBefore = s.playerUnits[1].hp
    s = applyEffects(s, [{ type: "damage", amount: 10 }], { actorId: pid, targetId: eid })
    out.ok.thornsRetaliates = s.playerUnits.find((u) => u.id === pid).hp < pHpBefore
    out.detail.thorns = { pHpBefore, pHpAfter: s.playerUnits.find((u) => u.id === pid).hp }
  }
  // compounding bulwark: after a few rounds the Sentinel has stacked it
  {
    let s = startAutoBattle("tommy", ["the-fool"], "the-iron-sentinel")
    for (let i = 0; i < 4 && s.phase === "player"; i++) s = resolveRound(s)
    const sentinel = s.enemies.find((e) => e.defId === "the-iron-sentinel")
    out.ok.bulwarkCompounds = !sentinel || (sentinel.powers?.bulwark || 0) >= 3
    out.detail.bulwark = sentinel?.powers?.bulwark ?? "dead"
  }

  // ---- 4. phase escalation ---------------------------------
  {
    let s = startAutoBattle("tommy", ["thornguard"], "the-gorging-maw")
    const eid = s.enemies[0].id
    const def = ENEMIES["the-gorging-maw"]
    const thresh = def.phases[0].atHpPct
    // drop it just below the threshold
    const target = Math.floor(s.enemies[0].maxHp * thresh) - 1
    s = { ...s, enemies: s.enemies.map((e) => (e.id === eid ? { ...e, hp: Math.max(1, target) } : e)) }
    s = resolveRound(s)
    out.ok.phaseAnnounces = s.bossPhaseAnnounce === def.phases[0].announce
    // second round: it does not re-announce the same phase
    const s2 = resolveRound(s)
    out.ok.phaseOnce = s2.bossPhaseAnnounce !== def.phases[0].announce || s2.phase !== "player"
    out.detail.phase = { announce: s.bossPhaseAnnounce }
  }

  // ---- 5. reward -----------------------------------------
  // synthetic nodes so only the type differs (a real battle node may
  // carry a formationId bonus)
  const base = startRun("tommy")
  const plainEss = essenceForWin(base, { type: "battle" })
  const eliteEss = essenceForWin(base, { type: "elite" })
  const miniEss = essenceForWin(base, { type: "miniboss" })
  out.ok.eliteReward120 = eliteEss - plainEss === 120
  out.ok.eliteBelowMiniboss = eliteEss < miniEss
  out.detail.reward = { plainEss, eliteEss, miniEss }

  // ---- 6. no soft-lock -------------------------------------
  out.ok.allTerminate = EXPECT.every((id) => {
    const done = autoResolveBattle(startAutoBattle("tommy", ["thornguard", "the-fool", "thornguard"], id))
    return done.phase === "won" || done.phase === "lost"
  })

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- 7. UI ---------------------------------------------------
const seed = await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const i = RUN_PATH.findIndex((n) => n.type === "elite")
  const s = { ...startRun("tommy"), nodeIndex: i, path: RUN_PATH.slice(0, i + 1), phase: "formation", essence: 300 }
  s.lastSeenAct = actIndexForNode(i, RUN_PATH.length) // don't let the Act-crossroads screen cover the formation
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: false }))
  return { eliteEnemy: RUN_PATH[i].enemyId }
})
console.log("UI seed:", JSON.stringify(seed))
await page.reload()
await page.waitForTimeout(700)

const gimmickText = await page.locator(".hw-elite-gimmick").textContent().catch(() => "")
console.log("formation gimmick line:", JSON.stringify((gimmickText || "").trim()))
await page.locator(".hw-intro").first().screenshot({ path: `${SHOT_DIR}/elite_A_formation.png` }).catch(() => {})

// let the auto-start fire, then check the in-fight banner
await page.waitForSelector(".hw-battle", { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(600)
const eliteBanner = await page.locator(".hw-elevated-banner--elite").isVisible().catch(() => false)
console.log("elite banner in fight:", eliteBanner)

await page.locator(".hw-battle").first().screenshot({ path: `${SHOT_DIR}/elite_B_fight.png` }).catch(() => {})
// let it auto-play a few rounds to prove nothing throws mid-fight
await page.waitForTimeout(4000)
const midFightErrors = errors.length
// resolve it out (button or just let the timer finish)
const autoResolveBtn = page.locator("button", { hasText: /Auto-?Resolve|Resolve/i }).first()
if (await autoResolveBtn.isVisible().catch(() => false)) await autoResolveBtn.click().catch(() => {})
await page.waitForSelector(".hw-overlay", { timeout: 20000 }).catch(() => {})
const recapVisible = await page.locator(".hw-overlay").first().isVisible().catch(() => false)

// elite recorded in the Almanac
const almanacHasElite = await page.evaluate((id) => {
  try {
    const m = JSON.parse(localStorage.getItem("heartwood-meta-v1") || "{}")
    return (m.almanac?.enemies || []).includes(id)
  } catch {
    return false
  }
}, seed.eliteEnemy)

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
await browser.close()

console.log("recap visible:", recapVisible, "| mid-fight errors:", midFightErrors, "| almanac has elite:", almanacHasElite)

const uiOk =
  /heals|armour|Thorns|flame/i.test(gimmickText || "") &&
  eliteBanner &&
  noHScroll &&
  midFightErrors === 0

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
