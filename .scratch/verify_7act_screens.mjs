import { chromium } from "playwright"

const PORT = process.env.PORT || 5545
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(400)

// Fast-forward a real run headlessly (engine only, no React) to a
// formation stop at/after targetIndex, then hand it to the app via the
// real persistence path (serializeRun -> heartwood-run-save-v1) and
// reload so HeartwoodBattle restores straight onto that formation
// screen. Retries characters/attempts because the auto-bot can lose.
async function seedRunAtFormation(targetIndex) {
  return await page.evaluate(async (targetIndex) => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { UNITS } = await import("/src/data/heartwood/units.js")
    const chars = ["tommy", "aatos", "fenrir", "repo"]
    for (const characterId of chars) {
      for (let attempt = 0; attempt < 3; attempt++) {
        let run = engine.startRun(characterId)
        let safety = 0
        while (run.phase !== "victory" && run.phase !== "defeat" && safety < 600) {
          safety++
          if (run.phase === "formation" && run.nodeIndex >= targetIndex) {
            const saved = engine.serializeRun(run)
            localStorage.setItem("heartwood-run-save-v1", JSON.stringify(saved))
            return { ok: true, characterId, nodeIndex: run.nodeIndex, pathLen: run.path.length }
          }
          if (run.phase === "shop") {
            let changed = true
            while (changed) {
              changed = false
              for (const id of run.shopOffers || []) {
                const def = UNITS[id]
                if (def && run.essence >= def.recruitCost) {
                  const next = engine.recruitUnit(run, id)
                  if (next.essence !== run.essence) { run = next; changed = true; break }
                }
              }
            }
            run = engine.leaveShop(run)
          } else if (run.phase === "formation") {
            for (const entry of run.bench) {
              if (!run.deployed.includes(entry.key)) {
                const slot = run.deployed.indexOf(null)
                if (slot === -1) break
                run = engine.assignToSlot(run, slot, entry.key)
              }
            }
            run = engine.startFormationBattle(run)
          } else if (run.phase === "battle") {
            run = engine.autoResolve(run)
            run = engine.resolveBattleOutcome(run)
          } else if (run.phase === "relic") {
            run = engine.chooseRelic(run, null)
          } else if (run.phase === "choice") {
            run = engine.chooseFloorEncounter(run, Math.random() < 0.5 ? 0 : 1)
          } else break
        }
      }
    }
    return { ok: false }
  }, targetIndex)
}

async function shoot(name, targetIndex) {
  const seed = await seedRunAtFormation(targetIndex)
  if (!seed.ok) throw new Error(`could not seed a run to formation >= ${targetIndex}`)
  await page.reload()
  await page.waitForSelector(".hw-grid", { timeout: 15000 })
  await page.waitForTimeout(600)
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".hw-root")
    const badge = [...document.querySelectorAll(".hw-badge")].map((b) => b.textContent.trim()).filter(Boolean)
    const actBanner = document.querySelector(".hw-intro .hw-section-fade-in[style*='border']")
    return {
      scrollH: root?.scrollHeight ?? -1,
      clientH: root?.clientHeight ?? -1,
      bodyScrollW: document.body.scrollWidth,
      bodyClientW: document.body.clientWidth,
      badges: badge,
      actBannerText: actBanner ? actBanner.textContent.replace(/\s+/g, " ").trim().slice(0, 220) : null,
      flavor: document.querySelector(".hw-intro .hw-flavor")?.textContent.trim().slice(0, 180) ?? null,
    }
  })
  await page.screenshot({ path: `/tmp/${name}.png` })
  console.log(`\n== ${name} (seeded ${seed.characterId} @ node ${seed.nodeIndex}) ==`)
  console.log(JSON.stringify(metrics, null, 2))
  return { seed, metrics }
}

const early = await shoot("7act-early", 1)
const late = await shoot("7act-late", 70)

await browser.close()

// NOTE on vertical scroll: `.hw-root` is an internal scroll container by
// design (see .scratch/check_1080_fit3.mjs, which deliberately scrolls
// it to the bottom). The FormationScreen is taller than the viewport on
// origin/development too - a same-node baseline measured .hw-root
// scrollH === 1270 there, byte-identical to this branch's early screen,
// so the 7-act text/tier change adds ZERO layout height. The meaningful
// regression guards are: no horizontal overflow, the early screen's
// height unchanged from the pre-change baseline, and the late screen
// only taller by the (legitimate, pre-existing) act-crossing banner.
// Pre-change baseline (origin/development, same node) measured 1270. The
// seeding bot recruits different units run to run, so the synergy-badge
// row can wrap one extra line (~18px) - that variance is the bot's, not
// this change's. A generous ceiling catches an actual layout blow-up
// without failing on bot RNG.
const BASELINE_EARLY_SCROLL_H = 1270
const checks = []
checks.push(["early screen: .hw-root height within bot-RNG range of the pre-change baseline (1270)", early.metrics.scrollH - BASELINE_EARLY_SCROLL_H <= 80 && early.metrics.scrollH >= BASELINE_EARLY_SCROLL_H - 80])
checks.push(["early screen: no horizontal overflow", early.metrics.bodyScrollW <= early.metrics.bodyClientW + 1])
checks.push(["late screen reached node >= 50", late.seed.nodeIndex >= 50])
checks.push(["late screen: no horizontal overflow", late.metrics.bodyScrollW <= late.metrics.bodyClientW + 1])
checks.push(["late screen: only modestly taller than early (act banner, not a layout break)", late.metrics.scrollH - early.metrics.scrollH < 500])
checks.push(["early screen shows an Act name badge (Act I..VII)", early.metrics.badges.some((b) => /Act (I|II|III|IV|V|VI|VII) - /.test(b))])
checks.push(["late screen shows an Act name badge (Act I..VII)", late.metrics.badges.some((b) => /Act (I|II|III|IV|V|VI|VII) - /.test(b))])
checks.push(["no console/page errors", errors.length === 0])

console.log("\nerrors:", errors)
let allPass = true
for (const [n, ok] of checks) { console.log(`${ok ? "PASS" : "FAIL"}: ${n}`); if (!ok) allPass = false }
process.exit(allPass ? 0 : 1)
