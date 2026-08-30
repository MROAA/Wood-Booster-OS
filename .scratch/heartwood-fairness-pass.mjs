import { chromium } from "playwright"

const PORT = Number(process.env.PORT || 5310)
const RUNS = Number(process.env.RUNS || 25)

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
// Game was renamed Heartwood -> Hearthwood; wait on the commander-select
// markup instead of a title string so a future rename can't re-break this.
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })
await page.waitForTimeout(300)

const results = await page.evaluate(async (RUNS) => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const unitsMod = await import("/src/data/heartwood/units.js?t=" + t)
  const { UNITS } = unitsMod
  const { RELICS } = await import("/src/data/heartwood/relics.js?t=" + t)

  // "Realistic" bot: a middle-ground between minimal and greedy - the
  // kind of play a real but not maximally-optimizing player does.
  // Recruits opportunistically, levels the market once, uses the
  // Commander's active power, takes relics it can afford, but doesn't
  // hyper-optimize (no Sell/Reforge micromanagement).
  function simulateRun(characterId) {
    let run = engine.startRun(characterId)
    let safety = 0
    let diedAt = null
    // Opening-tightness metric (start-essence-from-ramp pass): for the
    // FIRST 3 battles specifically, record squad attrition. "Narrow
    // win" = fights 1-3 essentially always won, but with real cost by
    // fight 3 (>=1 unit KO'd on average OR squad HP <= ~55% of max).
    // A walkover (0 KOs, HP ~90%+) is too easy; frequent fight 1-2
    // losses is too hard. KOs here are mid-fight knockouts (units
    // return next fight in this engine) - they measure how close the
    // fight ran, not permanent roster loss.
    let battleCount = 0
    let diedAtFight = null
    const koByFight = [null, null, null]
    const hpPctByFight = [null, null, null]
    while (run.phase !== "victory" && run.phase !== "defeat" && safety < 400) {
      safety++
      if (run.phase === "shop") {
        const levelCost = engine.marketLevelCost(run.marketLevel || 1)
        if (levelCost !== null && run.essence >= levelCost + 2) run = engine.levelUpMarket(run)
        run = engine.activateCommanderPower(run)
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
        battleCount++
        if (battleCount <= 3 && run.battle) {
          // Exclude mid-fight summons - they inflate maxHp and their
          // deaths aren't squad attrition.
          const squad = run.battle.playerUnits.filter((u) => !u.summoned)
          const hpNow = squad.reduce((s, u) => s + Math.max(0, u.hp), 0)
          const hpMax = squad.reduce((s, u) => s + (u.maxHp || 0), 0)
          koByFight[battleCount - 1] = squad.filter((u) => u.hp <= 0).length
          hpPctByFight[battleCount - 1] = hpMax > 0 ? hpNow / hpMax : 1
        }
        if (run.battle.phase === "lost" && !diedAt) {
          diedAt = { nodeIndex: run.nodeIndex, enemyId: nodeBefore?.enemyId, formationId: nodeBefore?.formationId, type: nodeBefore?.type }
          diedAtFight = battleCount
        }
        run = engine.resolveBattleOutcome(run)
      } else if (run.phase === "relic") {
        const offers = run.relicOffers || []
        // Take the priciest relic actually affordable (a "realistic" bot
        // spends a windfall), else skip. Uses the relic's real cost -
        // relics are no longer a flat price since the round-economy pass.
        const affordable = offers
          .filter((id) => run.essence >= (RELICS[id]?.cost ?? Infinity))
          .sort((a, b) => (RELICS[b]?.cost ?? 0) - (RELICS[a]?.cost ?? 0))[0]
        run = engine.chooseRelic(run, affordable || null)
      } else if (run.phase === "choice") {
        // Floor-encounter fork (advanceToNextNode's `phase: "choice"`).
        // A real player picks somewhat arbitrarily; random 0/1 averages
        // out across the sample. Without this handler every run stalls
        // here at the first map fork and never terminates.
        run = engine.chooseFloorEncounter(run, Math.random() < 0.5 ? 0 : 1)
      } else break
    }
    return {
      characterId,
      outcome: run.phase,
      nodeIndex: run.nodeIndex,
      pathLength: run.path.length,
      diedAt,
      diedAtFight,
      reachedFight3: battleCount >= 3,
      // Cumulative mid-fight KOs across fights 1-3, and squad HP % at
      // the END of each of the first 3 fights.
      openingKoCumulative:
        koByFight[2] !== null ? koByFight[0] + koByFight[1] + koByFight[2] : null,
      hpPctByFight,
    }
  }

  const characters = ["tommy", "aatos", "fenrir", "repo"]
  const runs = []
  for (const characterId of characters) {
    for (let i = 0; i < RUNS; i++) {
      try {
        runs.push(simulateRun(characterId))
      } catch (err) {
        runs.push({ characterId, outcome: "CRASH", error: err.message })
      }
    }
  }
  return runs
}, RUNS)

const byChar = {}
const deathsByFight = {}
const openingByChar = {}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
for (const r of results) {
  byChar[r.characterId] ||= { wins: 0, total: 0 }
  byChar[r.characterId].total++
  if (r.outcome === "victory") byChar[r.characterId].wins++
  if (r.diedAt) {
    const key = `${r.diedAt.type}:${r.diedAt.enemyId || r.diedAt.formationId}`
    deathsByFight[key] = (deathsByFight[key] || 0) + 1
  }

  const o = (openingByChar[r.characterId] ||= {
    diedFight1: 0,
    diedFight2: 0,
    diedFight3: 0,
    reachedFight3: 0,
    koCum: [],
    hp1: [],
    hp2: [],
    hp3: [],
  })
  if (r.diedAtFight === 1) o.diedFight1++
  if (r.diedAtFight === 2) o.diedFight2++
  if (r.diedAtFight === 3) o.diedFight3++
  if (r.hpPctByFight?.[0] !== null && r.hpPctByFight?.[0] !== undefined) o.hp1.push(r.hpPctByFight[0])
  if (r.hpPctByFight?.[1] !== null && r.hpPctByFight?.[1] !== undefined) o.hp2.push(r.hpPctByFight[1])
  if (r.reachedFight3) {
    o.reachedFight3++
    o.hp3.push(r.hpPctByFight[2])
    if (r.openingKoCumulative !== null) o.koCum.push(r.openingKoCumulative)
  }
}

console.log(`=== per-commander win rate (${RUNS} runs each, 'realistic' bot) ===`)
for (const [char, s] of Object.entries(byChar)) {
  console.log(`${char}: ${s.wins}/${s.total} (${Math.round((s.wins / s.total) * 100)}%)`)
}

console.log(
  `\n=== opening-tightness (fights 1-3) - target: fights 1-2 almost never lost, AND by end of fight 3 mean KOs >=1 OR mean squad HP <= ~55% ===`,
)
for (const [char, o] of Object.entries(openingByChar)) {
  const pct = (x) => (Number.isNaN(x) ? "n/a" : `${Math.round(x * 100)}%`)
  console.log(
    `${char}: died@f1=${o.diedFight1} died@f2=${o.diedFight2} died@f3=${o.diedFight3} | ` +
      `reachedF3=${o.reachedFight3}/${byChar[char].total} | ` +
      `meanSquadHP end-f1=${pct(mean(o.hp1))} end-f2=${pct(mean(o.hp2))} end-f3=${pct(mean(o.hp3))} | ` +
      `mean cumulative KOs f1-3=${mean(o.koCum).toFixed(2)}`,
  )
}

console.log("\n=== which fight actually killed a run (clustering = an unfair spike, spread = a smooth curve) ===")
console.log(JSON.stringify(deathsByFight, null, 2))
console.log("\npage errors:", pageErrors.length ? pageErrors.join("\n") : "(none)")
await browser.close()
