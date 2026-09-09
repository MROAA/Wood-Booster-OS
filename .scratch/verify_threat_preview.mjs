import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - enemy threat preview (feat/hearthwood-threat-preview).
// evaluateThreat(previewEnemies, runState, node) is PURE - a danger
// rating + dominant threat + mechanics. No engine/runState/save touch,
// so the panel is a smoke check; these assertions are the gate for it.
// The 3 specialist enemies ARE a real combat change -> the RUNS=100
// fairness pass is the hard gate for those.

const PORT = process.env.PORT || 5361
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-threat-preview/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const tp = await import("/src/data/heartwood/threatPreview.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const auto = await import("/src/services/heartwood/autoBattleEngine.js")
  const { ENEMIES, ACT_ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { evaluateThreat, THREAT_RATINGS } = tp
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION } = engine
  const out = { errors: [] }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // synthetic preview-enemy rows: { defId, hp, maxHp, pos }
  const en = (defId, extra = {}) => ({ defId, hp: 30, maxHp: 30, pos: { row: 0, col: 0 }, ...extra })
  const rs = () => {
    const b = startRun("tommy")
    const bench = ["the-fool", "the-fool", "the-fool", "the-fool"].map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
    return { ...b, bench, deployed: [1, 2, 3, 4], items: [] }
  }

  // 1. rating spread
  {
    const low = evaluateThreat([en("rotwood-husk", { maxHp: 38, pos: { row: 0, col: 0 } })], rs(), { type: "battle" })
    const bigRoster = [0, 1, 2, 3, 4].map((c) => en("hollowfen", { maxHp: 90, pos: { row: c < 3 ? 0 : 1, col: c % 3 } }))
    const elite = evaluateThreat(bigRoster, rs(), { type: "elite" })
    const boss = evaluateThreat([en("spacemonkey", { maxHp: 60 })], rs(), { type: "boss" })
    const intOk = [low, elite, boss].every((t) => Number.isInteger(t.rating) && t.rating >= 1 && t.rating <= 5)
    const labelOk = [low, elite, boss].every((t) => t.ratingLabel === THREAT_RATINGS[t.rating - 1])
    out.rating = { low: low.rating, elite: elite.rating, boss: boss.rating, intOk, labelOk }
    if (!(low.rating <= 2 && elite.rating >= 4 && boss.rating >= 4 && intOk && labelOk)) out.errors.push("check1 rating spread")
  }

  // 2. primary / secondary
  {
    const control3 = [0, 1, 2].map(() => en("needlefen"))
    const t1 = evaluateThreat(control3, rs(), { type: "battle" })
    const control5 = [0, 1, 2, 3, 4].map(() => en("needlefen"))
    const t2 = evaluateThreat(control5, rs(), { type: "battle" })
    const raw = evaluateThreat([en("hollowfen", { maxHp: 90 }), en("ironmaw", { maxHp: 46 })], rs(), { type: "battle" })
    const distinctOk = [t1, t2].every((t) => !t.secondary || t.secondary.id !== t.primary.id)
    out.lead = { t1: t1.primary?.id, t2sec: t2.secondary?.id, raw: raw.primary?.id, distinctOk }
    if (!(t1.primary?.id === "control" && t2.secondary?.id === "swarm" && raw.primary?.id === "raw" && distinctOk)) out.errors.push("check2 primary/secondary")
  }

  // 3. mechanics
  {
    const t = evaluateThreat(
      [en("plaguebearer"), en("dawn-zealot"), en("wraithgale"), en("needlefen")],
      rs(),
      { type: "battle" },
    )
    const hasPoison = t.mechanics.some((m) => /Poison/.test(m))
    const hasHeal = t.mechanics.includes("Heals itself")
    const capOk = t.mechanics.length <= 4 && t.mechanics.every((m) => typeof m === "string" && m.length > 0)
    // deterministic order
    const t2 = evaluateThreat(
      [en("plaguebearer"), en("dawn-zealot"), en("wraithgale"), en("needlefen")],
      rs(),
      { type: "battle" },
    )
    out.mechanics = { list: t.mechanics, hasPoison, hasHeal, capOk, deterministic: eq(t.mechanics, t2.mechanics) }
    if (!(hasPoison && hasHeal && capOk && eq(t.mechanics, t2.mechanics))) out.errors.push("check3 mechanics")
  }

  // 4. note
  {
    // an armour roster the plain the-fool squad can't answer
    const armour = evaluateThreat([en("the-gorging-maw"), en("the-iron-sentinel")], rs(), { type: "battle" })
    const raw = evaluateThreat([en("hollowfen", { maxHp: 90 })], rs(), { type: "battle" })
    const oneLine = (s) => typeof s === "string" && !s.includes("\n")
    out.note = { armour: armour.note, raw: raw.note }
    if (!(armour.note.startsWith("↳ ") && oneLine(armour.note) && raw.note.startsWith("↳ ") && oneLine(raw.note))) out.errors.push("check4 note")
  }

  // 5. specialist enemies - authored data, Codex-listed, stats at/below
  // their Act's peers, and DELIBERATELY excluded from the actEnemyForNode
  // solo pool (see NON_BATTLE_ENEMY_IDS - dropping them in reshuffles the
  // mid-run schedule).
  {
    const IDS = ["silence-weaver", "dawn-zealot", "plaguebearer"]
    const data = IDS.map((id) => {
      const d = ENEMIES[id]
      if (!d) return { id, ok: false, why: "missing" }
      const act = d.act
      const notInPool = !(ACT_ENEMIES[act] || []).includes(id)
      const peers = Object.values(ENEMIES).filter((e) => e.act === act && !IDS.includes(e.id))
      const maxPeerHp = Math.max(...peers.map((e) => e.maxHp || 0))
      const stepAtk = (mp) => Math.max(0, ...(mp || []).filter((m) => m.type === "attack").map((m) => m.amount || 0))
      const maxPeerAtk = Math.max(...peers.map((e) => stepAtk(e.movePattern)))
      return {
        id,
        ok: Number.isInteger(act) && notInPool && (d.maxHp || 0) <= maxPeerHp && stepAtk(d.movePattern) <= maxPeerAtk,
        act,
        hp: d.maxHp,
        atk: stepAtk(d.movePattern),
        maxPeerHp,
        maxPeerAtk,
      }
    })
    out.specialists = data
    if (!data.every((x) => x.ok)) out.errors.push("check5 specialist enemy stats/pool")
  }

  // 5b. engine: silence-weaver applies dampen, dawn-zealot heals -
  // driven via autoResolveBattle (the same "run the whole fight" the
  // fairness bot uses), then scan the accumulated log.
  {
    const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
    // Commander-only squads so the fight lasts long enough for the
    // enemy to reach its debuff / heal step (a fuller squad kills these
    // 38-48 HP mooks in round 1-2, before their own turn 2 action).
    const fightLog = (encounterId, squad) => {
      const st0 = auto.startAutoBattle("tommy", squad, encounterId, [], 0, {}, [], [], 1, null, "restless")
      const done = auto.autoResolveBattle(st0)
      return (st0.log || []).concat(done.log || [])
    }
    let dampenSeen = false
    let healSeen = false
    let dampenLog = []
    try {
      dampenLog = fightLog("silence-weaver", [])
      dampenSeen = dampenLog.some((l) => /dampen/i.test(l))
    } catch (e) {
      out.errors.push("check5b silence-weaver engine: " + e.message)
    }
    try {
      const log = fightLog("dawn-zealot", [])
      healSeen = log.some((l) => /heal/i.test(l))
    } catch (e) {
      out.errors.push("check5b dawn-zealot engine: " + e.message)
    }
    out.engine = { dampenSeen, healSeen, dampenLogTail: dampenLog.slice(-12) }
    if (!dampenSeen) out.errors.push("check5b silence-weaver dampen not applied")
    if (!healSeen) out.errors.push("check5b dawn-zealot heal not seen in log")
  }

  // 6. purity / save
  {
    const r = rs()
    const snap = JSON.stringify(r)
    const preview = [en("needlefen"), en("plaguebearer")]
    const psnap = JSON.stringify(preview)
    const a = evaluateThreat(preview, r, { type: "battle" })
    const b = evaluateThreat(preview, r, { type: "battle" })
    const argsUnchanged = JSON.stringify(r) === snap && JSON.stringify(preview) === psnap
    const noKey = startRun("tommy").threatPreview === undefined
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    out.purity = { argsUnchanged, deterministic: eq(a, b), noKey, version: RUN_SAVE_VERSION, roundOk: round != null }
    if (!(argsUnchanged && eq(a, b) && noKey && RUN_SAVE_VERSION === 3 && round != null)) out.errors.push("check6 purity/save")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen threat panel
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    let run = engine.startRun("tommy", null, { forcedSeed: 0x77EA7 })
    run = {
      ...run,
      nodeIndex: 1,
      path: [RUN_PATH[0], RUN_PATH[1]],
      phase: "formation",
      bench: [
        { key: 1, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-threat-preview", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/threat_preview.png` })
  const txt = await page.$eval(".hw-threat-preview", (el) => el.textContent.replace(/\s+/g, " ").trim())
  console.log("threat panel:", txt)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_threat_preview PASS" : "\n❌ verify_threat_preview FAIL")
process.exit(pass ? 0 : 1)
