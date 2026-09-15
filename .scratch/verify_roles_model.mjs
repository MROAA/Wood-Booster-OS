import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - unit role & tag identity model (feat/hearthwood-role-identity).
// roles.js's unitProfile(def) must resolve EVERY roster unit to a valid
// { primary, secondary, tags[], strengths[], weaknesses[], position }.
// Presentation + data only - no combat / runState / save change.

const PORT = process.env.PORT || 5346
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-roles/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const units = await import("/src/data/heartwood/units.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = units
  const { unitProfile, ROLES, POSITIONS } = roles
  const ROLE_IDS = Object.keys(ROLES)
  const POS_IDS = Object.keys(POSITIONS)
  const out = {}

  // 1. roster sweep - every unit resolves cleanly
  const bad = []
  const dist = {}
  for (const [id, def] of Object.entries(UNITS)) {
    let p
    try {
      p = unitProfile(def)
    } catch (e) {
      bad.push(`${id}: threw ${e}`)
      continue
    }
    if (!p || !ROLE_IDS.includes(p.primary)) bad.push(`${id}: primary=${p && p.primary}`)
    else if (p.secondary != null && !ROLE_IDS.includes(p.secondary)) bad.push(`${id}: secondary=${p.secondary}`)
    else if (!POS_IDS.includes(p.position)) bad.push(`${id}: position=${p.position}`)
    else if (!Array.isArray(p.tags) || p.tags.length === 0) bad.push(`${id}: tags=${JSON.stringify(p.tags)}`)
    else if (!p.strengths?.length || !p.weaknesses?.length) bad.push(`${id}: str/weak empty`)
    if (p && p.primary) dist[p.primary] = (dist[p.primary] || 0) + 1
  }
  out.sweep = { total: Object.keys(UNITS).length, bad: bad.slice(0, 20), distribution: dist }
  out.sweepOk = bad.length === 0

  // 2. derivation spot-checks
  const pr = (id) => unitProfile(UNITS[id])
  out.spot = {
    theFool: pr("the-fool").primary, // override -> healer
    bulwark: [pr("bulwark-of-ages").primary, pr("bulwark-of-ages").position],
    thornThrone: pr("the-thorn-throne").primary,
    stoneknoll: pr("stoneknoll").primary,
    beastcaller: pr("beastcaller").primary,
  }
  out.spotOk =
    pr("the-fool").primary === "healer" &&
    pr("bulwark-of-ages").primary === "tank" &&
    pr("bulwark-of-ages").position === "front" &&
    ["assassin", "dps"].includes(pr("the-thorn-throne").primary) &&
    pr("stoneknoll").primary === "debuffer" &&
    pr("beastcaller").primary === "summoner"

  // 3. override wins over derivation
  const wa = unitProfile(UNITS["world-ash-elder"])
  out.override = { primary: wa.primary, tags: wa.tags, strengths: wa.strengths }
  out.overrideOk =
    wa.primary === "dps" &&
    wa.tags.includes("scaling") &&
    wa.strengths[0] === "Unstoppable once a fight runs long"

  // 4. bent role overrides primary only
  const bent = unitProfile(UNITS["the-fool"], "tank")
  const plain = unitProfile(UNITS["the-fool"])
  out.bent = { primary: bent.primary, tagsSame: JSON.stringify(bent.tags) === JSON.stringify(plain.tags) }
  out.bentOk = bent.primary === "tank" && out.bent.tagsSame

  // 5. legacy role strings untouched
  out.legacy = { theFool: UNITS["the-fool"].role, dist: {} }
  const legacyRoles = new Set(Object.values(UNITS).map((d) => d.role).filter(Boolean))
  out.legacyOk = UNITS["the-fool"].role === "support" && [...legacyRoles].every((r) => ["dps", "tank", "support", "hybrid"].includes(r))

  // 6. nothing on runState, no save bump
  const rs = engine.startRun("tommy")
  out.save = { version: engine.RUN_SAVE_VERSION, hasProfile: "profile" in rs || "roles" in rs }
  out.saveOk = engine.RUN_SAVE_VERSION === 3 && !out.save.hasProfile

  return out
})

// screenshot a bench card + a shop offer with the role line
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  let s = { ...startRun("tommy"), nodeIndex: 0, path: RUN_PATH.slice(0, 1), phase: "shop", essence: 2000 }
  s.bench = [
    { key: 1, defId: "bulwark-of-ages", upgrades: [], upgradeLevel: 0 },
    { key: 2, defId: "willowmend", upgrades: [], upgradeLevel: 0 },
  ]
  s.deployed = [1, 2, null, null]
  s.benchKeyCounter = 3
  s.lastSeenAct = actIndexForNode(0, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-coach-enabled-v1", "false")
})
await page.reload()
await page.waitForSelector(".hw-market-columns", { timeout: 10000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${SHOT}/roles_shop_offers.png` })
await page.click(".hw-squad-tab-btn").catch(() => {})
await page.waitForTimeout(800)
await page.screenshot({ path: `${SHOT}/roles_bench_cards.png` })

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\npage errors:", errs.length, errs.slice(0, 5))
const checks = ["sweepOk", "spotOk", "overrideOk", "bentOk", "legacyOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const pass = failed.length === 0 && errs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
