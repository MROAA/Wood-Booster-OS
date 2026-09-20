import { chromium } from "playwright"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))

await page.goto("http://localhost:5310/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.waitForTimeout(300)

const results = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const unitsMod = await import("/src/data/heartwood/units.js?t=" + t)
  const { UNITS } = unitsMod

  // Three bot profiles, deliberately spanning a real skill range - not
  // just one greedy bot (which trivially won 12/12 last round and told
  // us almost nothing about difficulty).
  function simulateRun(characterId, profile) {
    let run = engine.startRun(characterId)
    let safety = 0
    let maxPlayerHpSeenAtBoss = null
    while (run.phase !== "victory" && run.phase !== "defeat" && safety < 400) {
      safety++
      if (run.phase === "shop") {
        if (profile === "greedy" || profile === "smart") {
          const levelCost = engine.marketLevelCost(run.marketLevel || 1)
          if (levelCost !== null && run.essence >= levelCost + 2) run = engine.levelUpMarket(run)
          run = engine.activateCommanderPower(run)
        }
        if (profile === "minimal") {
          // A weak/new-player bot: only recruits until the bench can
          // fill all 4 deploy slots, never touches Market Level,
          // Freeze, or the Commander's active power, never bothers
          // rerolling - the floor of "barely engaging with any system."
          let recruited = 0
          for (const id of run.shopOffers) {
            if (run.bench.length + recruited >= 4) break
            const def = UNITS[id]
            if (def && run.essence >= def.recruitCost) {
              const next = engine.recruitUnit(run, id)
              if (next.bench.length !== run.bench.length) { run = next; recruited++ }
            }
          }
        } else {
          let changed = true
          while (changed) {
            changed = false
            for (const id of run.shopOffers) {
              const def = UNITS[id]
              if (def && run.essence >= def.recruitCost) {
                const next = engine.recruitUnit(run, id)
                if (next.essence !== run.essence) { run = next; changed = true; break }
              }
            }
          }
        }
        run = engine.leaveShop(run)
      } else if (run.phase === "formation") {
        const node = run.path[run.nodeIndex]
        if (node?.type === "boss") {
          maxPlayerHpSeenAtBoss = run.bench.length
        }
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
        if (profile === "minimal") {
          run = engine.chooseRelic(run, null) // always skips
        } else {
          const offers = run.relicOffers || []
          const affordable = offers.find((id) => run.essence >= 3)
          run = engine.chooseRelic(run, affordable || null)
        }
      } else break
    }
    return { characterId, profile, outcome: run.phase, nodeIndex: run.nodeIndex, pathLength: run.path.length, benchAtBoss: maxPlayerHpSeenAtBoss }
  }

  const characters = ["tommy", "aatos", "fenrir", "repo"]
  const profiles = ["minimal", "greedy"]
  const runs = []
  for (const profile of profiles) {
    for (let i = 0; i < 24; i++) {
      const characterId = characters[i % characters.length]
      try {
        runs.push(simulateRun(characterId, profile))
      } catch (err) {
        runs.push({ characterId, profile, outcome: "CRASH", error: err.message })
      }
    }
  }
  return runs
})

const byProfile = {}
for (const r of results) {
  byProfile[r.profile] ||= { wins: 0, total: 0, lossNodes: [] }
  byProfile[r.profile].total++
  if (r.outcome === "victory") byProfile[r.profile].wins++
  else byProfile[r.profile].lossNodes.push(r.nodeIndex + "/" + r.pathLength)
}

console.log(JSON.stringify(results, null, 2))
console.log("\n=== summary ===")
for (const [profile, s] of Object.entries(byProfile)) {
  console.log(`${profile}: ${s.wins}/${s.total} wins. Losses died at node: ${s.lossNodes.join(", ") || "(none)"}`)
}
console.log("\npage errors:", pageErrors.length ? pageErrors.join("\n") : "(none)")
await browser.close()
