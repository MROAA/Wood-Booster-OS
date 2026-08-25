import { chromium } from "playwright"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
// Wait for the app to actually render (forces Vite's dependency
// optimizer/module graph to finish warming up) before doing a raw
// dynamic import - a bare domcontentloaded + immediate evaluate races
// ahead of that and reliably fails to fetch the module.
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.waitForTimeout(500)

const results = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const unitsMod = await import("/src/data/heartwood/units.js?t=" + t)
  const relicsMod = await import("/src/data/heartwood/relics.js?t=" + t)
  const { UNITS } = unitsMod
  const { RELICS } = relicsMod

  // Simple greedy AI, same spirit as the codebase's own documented
  // stress-test scripts: recruit whatever's cheapest/affordable, level
  // the market opportunistically, use Freeze/Commander Active when it
  // doesn't cost anything not to, deploy the whole bench, auto-resolve.
  function simulateRun(characterId) {
    let run = engine.startRun(characterId)
    let safety = 0
    const log = []
    while (run.phase !== "victory" && run.phase !== "defeat" && safety < 300) {
      safety++
      if (run.phase === "shop") {
        // Level the market once if we can afford it and still have
        // essence left for at least one recruit after.
        const levelCost = engine.marketLevelCost(run.marketLevel || 1)
        if (levelCost !== null && run.essence >= levelCost + 2 && (run.marketLevel || 1) < 2) {
          run = engine.levelUpMarket(run)
        }
        // Use the Commander's active power if it's free-ish (leaves
        // room to still recruit something this visit).
        run = engine.activateCommanderPower(run)
        // Recruit greedily until nothing affordable is left.
        let changed = true
        while (changed) {
          changed = false
          for (const id of run.shopOffers) {
            const def = UNITS[id]
            if (def && run.essence >= def.recruitCost) {
              const next = engine.recruitUnit(run, id)
              if (next.essence !== run.essence || next.bench.length !== run.bench.length) {
                run = next
                changed = true
                break
              }
            }
          }
        }
        run = engine.leaveShop(run)
      } else if (run.phase === "formation") {
        for (const entry of run.bench) {
          if (!run.deployed.includes(entry.key)) {
            const emptySlot = run.deployed.indexOf(null)
            if (emptySlot === -1) break
            run = engine.assignToSlot(run, emptySlot, entry.key)
          }
        }
        run = engine.startFormationBattle(run)
      } else if (run.phase === "battle") {
        run = engine.autoResolve(run)
        run = engine.resolveBattleOutcome(run)
      } else if (run.phase === "relic") {
        const offers = run.relicOffers || []
        const affordable = offers.find((id) => RELICS[id] && run.essence >= RELICS[id].cost)
        run = engine.chooseRelic(run, affordable || null)
      } else {
        break
      }
      log.push({ phase: run.phase, nodeIndex: run.nodeIndex, essence: run.essence, bench: run.bench.length })
    }
    return {
      characterId,
      outcome: run.phase,
      nodeIndex: run.nodeIndex,
      pathLength: run.path.length,
      finalEssence: run.essence,
      benchSize: run.bench.length,
      relicsOwned: run.relics.length,
      marketLevel: run.marketLevel,
      minEssence: Math.min(...log.map((l) => l.essence), run.essence),
      safetyHit: safety >= 300,
    }
  }

  const characters = ["tommy", "aatos", "fenrir", "repo"]
  const runs = []
  for (let i = 0; i < 12; i++) {
    const characterId = characters[i % characters.length]
    try {
      runs.push(simulateRun(characterId))
    } catch (err) {
      runs.push({ characterId, outcome: "CRASH", error: err.message, stack: err.stack })
    }
  }
  return runs
})

console.log(JSON.stringify(results, null, 2))
console.log("=== page errors ===")
console.log(pageErrors.length ? pageErrors.join("\n") : "(none)")

const wins = results.filter((r) => r.outcome === "victory").length
const crashes = results.filter((r) => r.outcome === "CRASH").length
console.log(`\n${wins}/${results.length} runs won the boss, ${crashes} crashed.`)

await browser.close()
