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

  // Same "realistic" bot as heartwood-fairness-pass.mjs, but this one
  // ALSO buys and equips items - a real, systematic gap found
  // 2026-08-23: no fairness/balance bot in this file ever bought or
  // equipped an item before this one, meaning every past win-rate
  // number in this session was measured against a weaker squad than a
  // real engaged player (Marc, live: "if u purchase units they just
  // win everything") actually builds. Prioritizes items FIRST each
  // shop visit, then units with whatever's left - a first attempt that
  // bought units first left almost no Essence for items (~0.7/run
  // avg), which barely moved the needle; this version reliably buys
  // 19-23 items across a full run, a genuinely maximal/degenerate
  // "buy everything" strategy, useful as an upper-bound stress case
  // even though it's stronger than typical play.
  function simulateRun(characterId) {
    let run = engine.startRun(characterId)
    let safety = 0
    let diedAt = null
    while (run.phase !== "victory" && run.phase !== "defeat" && safety < 400) {
      safety++
      if (run.phase === "shop") {
        const levelCost = engine.marketLevelCost(run.marketLevel || 1)
        if (levelCost !== null && run.essence >= levelCost + 2) run = engine.levelUpMarket(run)
        run = engine.activateCommanderPower(run)
        for (const id of run.itemOffers || []) {
          const def = window.__ITEMS?.[id]
          if (!def) continue
          if (run.essence >= def.cost) run = engine.buyItem(run, id)
        }
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
        for (const item of run.items) {
          if (item.equippedTo) continue
          const targets = [...run.bench.map((e) => e.key), "commander"]
          for (const benchKey of targets) {
            const maxSlots = engine.effectiveItemSlots(run)
            let placed = false
            for (let slot = 0; slot < maxSlots; slot++) {
              const occupied = run.items.some((it) => it.equippedTo === benchKey && it.slotIndex === slot)
              if (!occupied) {
                run = engine.equipItem(run, item.key, benchKey, slot)
                placed = true
                break
              }
            }
            if (placed) break
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
        const node = run.path[run.nodeIndex]
        run = engine.startFormationBattle(run)
        if (run.battle) run._lastNode = node
      } else if (run.phase === "battle") {
        const nodeBefore = run._lastNode
        run = engine.autoResolve(run)
        if (run.battle.phase === "lost" && !diedAt) {
          diedAt = { nodeIndex: run.nodeIndex, enemyId: nodeBefore?.enemyId, formationId: nodeBefore?.formationId, type: nodeBefore?.type }
        }
        run = engine.resolveBattleOutcome(run)
      } else if (run.phase === "relic") {
        const offers = run.relicOffers || []
        const affordable = offers.find((id) => run.essence >= 3)
        run = engine.chooseRelic(run, affordable || null)
      } else break
    }
    return { characterId, outcome: run.phase, nodeIndex: run.nodeIndex, pathLength: run.path.length, diedAt, itemsOwned: run.items.length }
  }

  const itemsMod = await import("/src/data/heartwood/items.js?t=" + t)
  window.__ITEMS = itemsMod.ITEMS

  const characters = ["tommy", "aatos", "fenrir", "repo"]
  const runs = []
  for (const characterId of characters) {
    for (let i = 0; i < 25; i++) {
      try {
        runs.push(simulateRun(characterId))
      } catch (err) {
        runs.push({ characterId, outcome: "CRASH", error: err.message })
      }
    }
  }
  return runs
})

const byChar = {}
const deathsByFight = {}
for (const r of results) {
  byChar[r.characterId] ||= { wins: 0, total: 0, avgItems: 0 }
  byChar[r.characterId].total++
  byChar[r.characterId].avgItems += r.itemsOwned || 0
  if (r.outcome === "victory") byChar[r.characterId].wins++
  if (r.diedAt) {
    const key = `${r.diedAt.type}:${r.diedAt.enemyId || r.diedAt.formationId}`
    deathsByFight[key] = (deathsByFight[key] || 0) + 1
  }
}

console.log("=== per-commander win rate WITH items (25 runs each) ===")
for (const [char, s] of Object.entries(byChar)) {
  console.log(`${char}: ${s.wins}/${s.total} (${Math.round((s.wins / s.total) * 100)}%), avg items owned: ${(s.avgItems / s.total).toFixed(1)}`)
}
console.log("\n=== which fight actually killed a run ===")
console.log(JSON.stringify(deathsByFight, null, 2))
console.log("\npage errors:", pageErrors.length ? pageErrors.join("\n") : "(none)")
await browser.close()
