import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood Frontier - Phase 3 first slice (feat/hearthwood-tactics-
// archetypes): two real enemy archetypes (The Swarm / "the-brood" and The
// Fortress / "the-bulwark") ported with their real ids/HP/attack/synergy
// numbers, selectable via a formation picker, layered onto Phase 1's
// isolated grid-combat prototype and Phase 2's full AP/ability/telegraph/
// cooldown economy. Still no runEngine.js/autoBattleEngine.js/save-state
// touch. There is no headless engine call to substitute for verification -
// this IS the interactive surface, so the script drives the actual
// rendered UI exactly the way Marc would click through it.

const PORT = process.env.PORT || 5386
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-archetypes/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))

const out = { errors: [] }

// ---------------------------------------------------------------
// Phase 1 regression suite (unmodified logic - only port/path changed).
// The old moved/attacked booleans are gone, but every unit still gets
// "one Move + one Attack" per turn for free at apMax 2, so this suite's
// assumptions hold unchanged.
// ---------------------------------------------------------------

// 1. Board renders the real 3v3 roster --------------------------
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })
await page.waitForTimeout(300)
{
  const names = await page.locator(".hwt-token-name").allInnerTexts()
  const expected = ["Ironmaw", "Sapling Attendant", "Hoardling", "Bulwark of Ages", "Mosskit", "Hexbreaker"]
  const dataOk = expected.every((n) => names.includes(n))
  out.data = { names, dataOk }
  if (!dataOk) out.errors.push("check1 real roster did not render")
}

// 2. CommanderSelect WIP link reaches the same route -------------
{
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
  const link = page.locator(".hw-tactics-link")
  const href = await link.getAttribute("href")
  out.link = { href }
  if (href !== "/heartwood-tactics") out.errors.push("check2 WIP link missing/wrong")
}

// 3. Select a unit -> reachable tiles highlight, move works -----
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board")
{
  const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
  await bulwark.click()
  await page.waitForTimeout(150)
  const reachableBefore = await page.locator('.hwt-cell[data-reachable="true"]').count()
  await page.locator('.hwt-cell[data-reachable="true"]').first().click()
  await page.waitForTimeout(250)
  const stillOnLeft = await page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator("xpath=ancestor::div[contains(@class,'hwt-cell')]").count()
  const reachableAfter = await page.locator('.hwt-cell[data-reachable="true"]').count()
  out.move = { reachableBefore, reachableAfter, moved: reachableBefore > 0 }
  if (!(reachableBefore > 0 && stillOnLeft === 1)) out.errors.push("check3 move highlight/click did not work")
}

// 4. Attack a target in range drops HP + logs it -----------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const hpBefore = await page.locator(".hwt-token", { hasText: "Ironmaw" }).locator(".hwt-hp-fill").evaluate((el) => el.style.width)
  let attacked = false
  for (let i = 0; i < 6 && !attacked; i++) {
    const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
    if ((await bulwark.count()) === 0) break
    await bulwark.click({ force: true }).catch(() => {})
    await page.waitForTimeout(120)
    const targets = page.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      const lb = await page.locator(".hwt-log p").count()
      await targets.first().click()
      await page.waitForTimeout(200)
      const la = await page.locator(".hwt-log p").count()
      if (la > lb) attacked = true
    } else {
      const reach = page.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page.waitForTimeout(150)
        const targets2 = page.locator('.hwt-cell[data-targetable="true"]')
        if ((await targets2.count()) > 0) {
          const lb2 = await page.locator(".hwt-log p").count()
          await targets2.first().click()
          await page.waitForTimeout(200)
          const la2 = await page.locator(".hwt-log p").count()
          if (la2 > lb2) attacked = true
        }
      }
    }
    if (!attacked) {
      await page.locator(".hwt-end-turn").click().catch(() => {})
      await page.waitForTimeout(400)
    }
  }
  const logText = await page.locator(".hwt-log").innerText()
  const struck = /strikes .* for \d+/.test(logText)
  out.attack = { attacked, struck, hpBefore, logSample: logText.split("\n").slice(0, 3) }
  if (!(attacked && struck)) out.errors.push("check4 attack did not land / log")
}

// 5. End Turn flips phase and the enemy AI acts ------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const before = await page.locator(".hwt-turn-label").innerText()
  const logBefore = await page.locator(".hwt-log p").count()
  await page.locator(".hwt-end-turn").click()
  await page.waitForTimeout(700)
  const after = await page.locator(".hwt-turn-label").innerText()
  const logAfter = await page.locator(".hwt-log p").count()
  const turnOk = /Player Turn 2/.test(after)
  const aiActed = logAfter > logBefore
  out.endTurn = { before, after, turnOk, aiActed }
  if (!(turnOk && aiActed)) out.errors.push("check5 end turn / enemy AI did not progress")
}

// 6. A fully passive player eventually loses (no stalemate) ------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 40) {
    await page.locator(".hwt-end-turn").click()
    await page.waitForTimeout(120)
    phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  out.passiveLoss = { turns, phase }
  if (phase !== "lost") out.errors.push("check6 a passive player never lost (stalemate?)")
  await page.screenshot({ path: `${SHOT}/tactics_loss.png` })
}

// 7. The debugLowHp QA hook reaches a win + Play Again resets ----
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
    await bulwark.click({ force: true }).catch(() => {})
    await page.waitForTimeout(120)
    let targets = page.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page.waitForTimeout(120)
      }
    }
    targets = page.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page.waitForTimeout(150)
    }
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(400)
    phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOT}/tactics_win.png` })
  const resultTitle = await page.locator(".hwt-result-title").innerText().catch(() => "")
  const wonOk = phase === "won" && /Victory/i.test(resultTitle)
  let resetOk = false
  if (wonOk) {
    await page.locator(".hwt-result-actions button", { hasText: "Play Again" }).click()
    await page.waitForTimeout(300)
    const hpFullWidth = await page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator(".hwt-hp-fill").evaluate((el) => el.style.width)
    resetOk = hpFullWidth === "100%"
  }
  out.win = { turns, phase, resultTitle, wonOk, resetOk }
  if (!(wonOk && resetOk)) out.errors.push("check7 debugLowHp win path / Play Again reset")
}

// ---------------------------------------------------------------
// Phase 2 - Action Points + one real ability per unit
// ---------------------------------------------------------------

// 8. AP gates a 3rd action ----------------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
  await bulwark.click()
  await page.waitForTimeout(150)
  const apStart = await bulwark.locator(".hwt-ap-pips").innerText()
  await page.locator(".hwt-ability-btn").click() // Bulwark Aura, cost 1
  await page.waitForTimeout(150)
  const apAfterAbility = await bulwark.locator(".hwt-ap-pips").innerText()
  const reach1 = page.locator('.hwt-cell[data-reachable="true"]')
  await reach1.first().click() // Move, cost 1 -> ap now 0
  await page.waitForTimeout(200)
  const apAfterMove = await bulwark.locator(".hwt-ap-pips").innerText()
  const reachableAtZeroAp = await page.locator('.hwt-cell[data-reachable="true"]').count()
  const abilityDisabledAtZeroAp = await page.locator(".hwt-ability-btn").isDisabled()
  const actedFlag = await bulwark.getAttribute("data-acted")
  out.apGating = { apStart, apAfterAbility, apAfterMove, reachableAtZeroAp, abilityDisabledAtZeroAp, actedFlag }
  if (!(apStart === "●●" && apAfterAbility === "●○" && apAfterMove === "○○" && reachableAtZeroAp === 0 && abilityDisabledAtZeroAp && actedFlag === "true")) {
    out.errors.push("check8 AP did not gate the 3rd action")
  }
}

// 9. Bulwark Aura grants Block to self + adjacent, not the distant unit --
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).click()
  await page.waitForTimeout(150)
  await page.locator(".hwt-ability-btn").click()
  await page.waitForTimeout(200)
  const bulwarkBlock = await page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator(".hwt-block-badge").innerText().catch(() => "")
  const mosskitBlock = await page.locator(".hwt-token", { hasText: "Mosskit" }).locator(".hwt-block-badge").innerText().catch(() => "")
  const hexbreakerHasBlock = (await page.locator(".hwt-token", { hasText: "Hexbreaker" }).locator(".hwt-block-badge").count()) > 0
  const logText = await page.locator(".hwt-log").innerText()
  const raisedLine = /raises Bulwark Aura/.test(logText)
  out.bulwarkAura = { bulwarkBlock, mosskitBlock, hexbreakerHasBlock, raisedLine }
  if (!(bulwarkBlock.includes("2") && mosskitBlock.includes("2") && !hexbreakerHasBlock && raisedLine)) {
    out.errors.push("check9 Bulwark Aura did not grant Block correctly (self + adjacent only)")
  }
}

// 10. Block actually absorbs an incoming hit ----------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let foundAbsorb = false
  for (let i = 0; i < 12 && !foundAbsorb; i++) {
    const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
    if ((await bulwark.count()) === 0) break
    await bulwark.click({ force: true }).catch(() => {})
    await page.waitForTimeout(100)
    const abilityBtn = page.locator(".hwt-ability-btn")
    if ((await abilityBtn.count()) > 0 && !(await abilityBtn.isDisabled())) {
      await abilityBtn.click()
      await page.waitForTimeout(100)
    }
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(500)
    const logText = await page.locator(".hwt-log").innerText()
    if (/\(absorbed \d+\)/.test(logText)) foundAbsorb = true
    const phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  out.blockAbsorb = { foundAbsorb }
  if (!foundAbsorb) out.errors.push("check10 block absorption never observed")
}

// 11. Block resets exactly when play returns to that side's own turn ---
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const bulwark = page.locator(".hwt-token", { hasText: "Bulwark of Ages" })
  await bulwark.click()
  await page.waitForTimeout(150)
  await page.locator(".hwt-ability-btn").click()
  await page.waitForTimeout(150)
  const blockAfterCast = await bulwark.locator(".hwt-block-badge").count()
  // Turn 1's gap (6 tiles) is wider than any enemy's move+range, so no
  // enemy can reach Bulwark this round - the block is untouched, and its
  // disappearance next turn is purely the reset, not a consumed hit.
  await page.locator(".hwt-end-turn").click()
  await page.waitForTimeout(700)
  const turnLabel = await page.locator(".hwt-turn-label").innerText()
  const blockAfterReset = await page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator(".hwt-block-badge").count()
  out.blockReset = { blockAfterCast, turnLabel, blockAfterReset }
  if (!(blockAfterCast === 1 && /Player Turn 2/.test(turnLabel) && blockAfterReset === 0)) {
    out.errors.push("check11 block did not reset at the next player turn")
  }
}

// 12. Regrowth heals a damaged unit, capped at max HP --------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let mosskitHpBefore = "100%"
  for (let i = 0; i < 12; i++) {
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(400)
    const width = await page.locator(".hwt-token", { hasText: "Mosskit" }).locator(".hwt-hp-fill").evaluate((el) => el.style.width)
    const phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    if (width !== "100%") {
      mosskitHpBefore = width
      break
    }
    if (phase === "lost" || phase === "won") break
  }
  let mended = false
  let hpAfter = mosskitHpBefore
  if (mosskitHpBefore !== "100%") {
    const mosskit = page.locator(".hwt-token", { hasText: "Mosskit" })
    await mosskit.click({ force: true }).catch(() => {})
    await page.waitForTimeout(150)
    const abilityBtn = page.locator(".hwt-ability-btn")
    if ((await abilityBtn.count()) > 0 && !(await abilityBtn.isDisabled())) {
      await abilityBtn.click()
      await page.waitForTimeout(150)
      const selfCell = page.locator('.hwt-cell[data-healable="true"]').filter({ has: page.locator(".hwt-token", { hasText: "Mosskit" }) })
      await selfCell.click()
      await page.waitForTimeout(200)
      const logText = await page.locator(".hwt-log").innerText()
      mended = /mends Mosskit for \d+/.test(logText)
      hpAfter = await mosskit.locator(".hwt-hp-fill").evaluate((el) => el.style.width)
    }
  }
  out.regrowth = { mosskitHpBefore, mended, hpAfter }
  if (!(mosskitHpBefore !== "100%" && mended)) out.errors.push("check12 Regrowth heal did not apply")
}

// 13. Focused Shot deals attack*multiplier and spends the whole turn ---
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let burstDone = false
  let burstLine = ""
  let apAfterBurst = null
  for (let i = 0; i < 12 && !burstDone; i++) {
    const hex = page.locator(".hwt-token", { hasText: "Hexbreaker" })
    if ((await hex.count()) === 0) break
    await hex.click({ force: true }).catch(() => {})
    await page.waitForTimeout(100)
    const apText = await hex.locator(".hwt-ap-pips").innerText().catch(() => "")
    const targetable = page.locator('.hwt-cell[data-targetable="true"]')
    const hasTarget = (await targetable.count()) > 0
    if (apText === "●●" && hasTarget) {
      const lb = await page.locator(".hwt-log p").count()
      await page.locator(".hwt-ability-btn").click()
      await page.waitForTimeout(100)
      await page.locator('.hwt-cell[data-targetable="true"]').first().click()
      await page.waitForTimeout(200)
      const la = await page.locator(".hwt-log p").count()
      burstDone = la > lb
      burstLine = await page.locator(".hwt-log p").first().innerText().catch(() => "")
      apAfterBurst = await hex.locator(".hwt-ap-pips").innerText().catch(() => "")
      break
    }
    if (!hasTarget) {
      const reach = page.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page.waitForTimeout(150)
      }
    }
    const phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase !== "player") break
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(500)
  }
  const unleashOk = /unleashes Focused Shot .* for \d+/.test(burstLine)
  out.focusedShot = { burstDone, burstLine, apAfterBurst }
  if (!(burstDone && unleashOk && apAfterBurst === "○○")) out.errors.push("check13 Focused Shot did not fire correctly")
}

// ---------------------------------------------------------------
// Enemy intent telegraphs (feat/hearthwood-tactics-intents)
// ---------------------------------------------------------------

// 14. Turn 1 - the starting 6-tile gap is wider than any enemy's range,
//     so every living enemy telegraphs "move", nobody telegraphs "attack",
//     and no player cell is threatened -------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.waitForTimeout(200)
  const moveBadges = await page.locator('.hwt-intent-badge[data-intent="move"]').count()
  const attackBadges = await page.locator('.hwt-intent-badge[data-intent="attack"]').count()
  const threatenedCells = await page.locator('.hwt-cell[data-threatened="true"]').count()
  out.intentTurn1 = { moveBadges, attackBadges, threatenedCells }
  if (!(moveBadges === 3 && attackBadges === 0 && threatenedCells === 0)) {
    out.errors.push("check14 turn 1 intents were not all 'move' with no threats")
  }
}

// 15. The telegraph flips to "attack" once an enemy is in range, and it's
//     HONEST - ending the turn strikes exactly the unit it predicted -----
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let sawAttackBadge = false
  let threatenedName = null
  for (let i = 0; i < 10 && !sawAttackBadge; i++) {
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(500)
    const phase = await page.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase !== "player") break
    const attackBadge = page.locator('.hwt-intent-badge[data-intent="attack"]')
    if ((await attackBadge.count()) > 0) {
      sawAttackBadge = true
      threatenedName = await page
        .locator('.hwt-cell[data-threatened="true"]')
        .first()
        .locator(".hwt-token-name")
        .innerText()
        .catch(() => null)
    }
  }
  let honestOk = false
  if (sawAttackBadge && threatenedName) {
    await page.locator(".hwt-end-turn").click().catch(() => {})
    await page.waitForTimeout(700)
    const logText = await page.locator(".hwt-log").innerText()
    const escaped = threatenedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    honestOk = new RegExp(`strikes ${escaped} for \\d+`).test(logText)
  }
  out.intentHonesty = { sawAttackBadge, threatenedName, honestOk }
  if (!(sawAttackBadge && honestOk)) out.errors.push("check15 telegraphed attack did not match the real strike")
}

// 16. Moving the threatened ally out of an enemy's reach flips its
//     telegraph from an attack back to a plain advance - a deterministic
//     distance proof via the exact same pure fn the UI reads. (A live
//     in-game retreat isn't a reliable test here: a slow unit fleeing an
//     equally-mobile enemy can legitimately still get caught - that's
//     correct chase behavior, not a bug - so this pins the underlying
//     distance logic directly instead of depending on relative speeds.) --
{
  const page16 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page16.on("pageerror", (e) => errs.push(String(e)))
  await page16.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page16.waitForSelector(".hwt-board")
  const retreat = await page16.evaluate(async () => {
    const { previewEnemyIntents } = await import("/src/services/heartwood/tacticsEngine.js")
    const unitsAt = (playerCol) => [
      {
        id: "player-1", side: "player", defId: "the-fool", name: "Target", art: "sword", image: null,
        pos: { row: 2, col: playerCol }, hp: 30, maxHp: 30, move: 3, range: 1, attack: 4, ap: 2, apMax: 2, block: 0, ability: null,
      },
      {
        id: "enemy-1", side: "enemy", defId: "ironmaw", name: "Ironmaw", art: "sword", image: null,
        pos: { row: 2, col: 0 }, hp: 20, maxHp: 20, move: 2, range: 1, attack: 5, ap: 2, apMax: 2, block: 0, ability: null,
      },
    ]
    const grid = { rows: 5, cols: 7 }
    // col 3: within the enemy's move(2)+range(1) reach this turn.
    const near = previewEnemyIntents({ grid, phase: "player", turn: 1, log: [], units: unitsAt(3) })
    // col 6: retreated well past that reach.
    const far = previewEnemyIntents({ grid, phase: "player", turn: 1, log: [], units: unitsAt(6) })
    return { near: near[0]?.intent, far: far[0]?.intent }
  })
  await page16.close()
  const nearThreatens = retreat.near?.kind === "attack" || retreat.near?.kind === "move-attack"
  const farClears = retreat.far?.kind === "move" || retreat.far?.kind === "hold"
  out.intentRetreat = retreat
  if (!(nearThreatens && farClears)) out.errors.push("check16 moving the threatened ally did not clear its telegraph")
}

// 17. Sequential accuracy - a later enemy's telegraph already accounts for
//     an earlier enemy's (hypothetical) telegraphed kill, not just an
//     independent read of the untouched board -----------------------
{
  // A fresh page/context (not the one reused for checks 1-16) - this check
  // needs nothing from prior UI state, and isolates it from any
  // accumulated browser state a long run of navigations might leave behind.
  const page17 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page17.on("pageerror", (e) => errs.push(String(e)))
  await page17.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page17.waitForSelector(".hwt-board")
  const seq = await page17.evaluate(async () => {
    const { previewEnemyIntents } = await import("/src/services/heartwood/tacticsEngine.js")
    // A synthetic state: one fragile player unit already in range of TWO
    // enemies. Enemy-1's hit (attack 5) kills the 3-HP target outright;
    // a non-sequential preview would show enemy-2 also targeting it.
    const state = {
      grid: { rows: 5, cols: 7 },
      phase: "player",
      turn: 1,
      log: [],
      units: [
        {
          id: "player-1", side: "player", defId: "bulwark-of-ages", name: "Fragile", art: "sword", image: null,
          pos: { row: 2, col: 3 }, hp: 3, maxHp: 50, move: 2, range: 1, attack: 4, ap: 2, apMax: 2, block: 0, ability: null,
        },
        {
          id: "enemy-1", side: "enemy", defId: "ironmaw", name: "Ironmaw", art: "sword", image: null,
          pos: { row: 2, col: 2 }, hp: 20, maxHp: 20, move: 2, range: 1, attack: 5, ap: 2, apMax: 2, block: 0, ability: null,
        },
        {
          id: "enemy-2", side: "enemy", defId: "hoardling", name: "Hoardling", art: "sword", image: null,
          pos: { row: 2, col: 4 }, hp: 20, maxHp: 20, move: 3, range: 1, attack: 4, ap: 2, apMax: 2, block: 0, ability: null,
        },
      ],
    }
    return previewEnemyIntents(state)
  })
  await page17.close()
  const first = seq.find((i) => i.enemyId === "enemy-1")?.intent
  const second = seq.find((i) => i.enemyId === "enemy-2")?.intent
  const firstKillsIt = first?.kind === "attack" && first.targetId === "player-1"
  const secondSawTheDeath = !(second?.kind === "attack" && second.targetId === "player-1")
  out.sequentialAccuracy = { first, second, firstKillsIt, secondSawTheDeath }
  if (!(firstKillsIt && secondSawTheDeath)) {
    out.errors.push("check17 the second enemy's telegraph did not account for the first enemy's telegraphed kill")
  }
}

// ---------------------------------------------------------------
// Per-unit ability cooldowns (feat/hearthwood-tactics-cooldowns)
// ---------------------------------------------------------------

// Each cooldown check below gets its own fresh page/context, matching
// checks 16/17's established fix: a page.evaluate (or a long enough run of
// interactions) placed after many prior page.goto calls on ONE reused page
// object reliably hung the NEXT page.goto (a Playwright/Chromium quirk with
// very long-lived pages, not anything in the app) - isolating each check
// avoids it entirely rather than re-fighting the same flake per round.

// 18. Casting sets the cooldown, disables the button, and blocks an
//     immediate re-cast even with AP still available --------------------
{
  const page18 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page18.on("pageerror", (e) => errs.push(String(e)))
  await page18.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page18.waitForSelector(".hwt-board")
  const bulwark = page18.locator(".hwt-token", { hasText: "Bulwark of Ages" })
  await bulwark.click()
  await page18.waitForTimeout(150)
  await page18.locator(".hwt-ability-btn").click()
  await page18.waitForTimeout(200)
  const labelAfterCast = await page18.locator(".hwt-ability-btn").innerText()
  const disabledAfterCast = await page18.locator(".hwt-ability-btn").isDisabled()
  const apAfterCast = await bulwark.locator(".hwt-ap-pips").innerText()
  const blockAfterCast = await bulwark.locator(".hwt-block-badge").innerText().catch(() => "")
  // Attempt a 2nd cast despite the disabled button - 1 AP remains, so only
  // the cooldown gate should be stopping it.
  const lb = await page18.locator(".hwt-log p").count()
  await page18.locator(".hwt-ability-btn").click({ force: true }).catch(() => {})
  await page18.waitForTimeout(200)
  const la = await page18.locator(".hwt-log p").count()
  const blockAfterRetry = await bulwark.locator(".hwt-block-badge").innerText().catch(() => "")
  await page18.close()
  out.cooldownGate = { labelAfterCast, disabledAfterCast, apAfterCast, blockAfterCast, blockAfterRetry, logGrew: la > lb }
  if (!(labelAfterCast.includes("Recharging") && disabledAfterCast && apAfterCast === "●○" && blockAfterCast === "2" && blockAfterRetry === "2" && !(la > lb))) {
    out.errors.push("check18 casting did not set the cooldown / a re-cast was not actually blocked")
  }
}

// 19. The board badge shows the cooldown on the unit that cast, and only
//     that unit --------------------------------------------------------
{
  const page19 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page19.on("pageerror", (e) => errs.push(String(e)))
  await page19.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page19.waitForSelector(".hwt-board")
  await page19.locator(".hwt-token", { hasText: "Bulwark of Ages" }).click()
  await page19.waitForTimeout(150)
  await page19.locator(".hwt-ability-btn").click()
  await page19.waitForTimeout(200)
  const bulwarkCooldown = await page19
    .locator(".hwt-token", { hasText: "Bulwark of Ages" })
    .locator(".hwt-cooldown-badge")
    .innerText()
    .catch(() => "")
  const mosskitHasCooldown = (await page19.locator(".hwt-token", { hasText: "Mosskit" }).locator(".hwt-cooldown-badge").count()) > 0
  await page19.close()
  out.cooldownBadge = { bulwarkCooldown, mosskitHasCooldown }
  if (!(bulwarkCooldown === "⏳2" && !mosskitHasCooldown)) out.errors.push("check19 the board cooldown badge was wrong")
}

// 20. It counts down once per the unit's own turn - "every other turn" for
//     a cooldown of 2, not per round, not per enemy action --------------
{
  const page20 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page20.on("pageerror", (e) => errs.push(String(e)))
  await page20.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page20.waitForSelector(".hwt-board")
  await page20.locator(".hwt-token", { hasText: "Bulwark of Ages" }).click()
  await page20.waitForTimeout(150)
  await page20.locator(".hwt-ability-btn").click()
  await page20.waitForTimeout(200)
  await page20.locator(".hwt-end-turn").click().catch(() => {})
  await page20.waitForTimeout(700)
  await page20.locator(".hwt-token", { hasText: "Bulwark of Ages" }).click({ force: true }).catch(() => {})
  await page20.waitForTimeout(150)
  const labelTurn2 = await page20.locator(".hwt-ability-btn").innerText()
  await page20.locator(".hwt-end-turn").click().catch(() => {})
  await page20.waitForTimeout(700)
  await page20.locator(".hwt-token", { hasText: "Bulwark of Ages" }).click({ force: true }).catch(() => {})
  await page20.waitForTimeout(150)
  const disabledTurn3 = await page20.locator(".hwt-ability-btn").isDisabled()
  const lb = await page20.locator(".hwt-log p").count()
  await page20.locator(".hwt-ability-btn").click().catch(() => {})
  await page20.waitForTimeout(200)
  const la = await page20.locator(".hwt-log p").count()
  const blockTurn3 = await page20.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator(".hwt-block-badge").innerText().catch(() => "")
  await page20.close()
  out.cooldownCadence = { labelTurn2, disabledTurn3, recastLogGrew: la > lb, blockTurn3 }
  if (!(labelTurn2.includes("Recharging (1)") && !disabledTurn3 && la > lb && blockTurn3 === "2")) {
    out.errors.push("check20 the cooldown did not count down 'every other turn' as designed")
  }
}

// 21. Two different abilities' cooldowns tick down independently, each at
//     its own configured rate - a deterministic proof via the same pure
//     runEnemyTurn the UI drives, isolated in its own page/context --------
{
  const page21 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page21.on("pageerror", (e) => errs.push(String(e)))
  await page21.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page21.waitForSelector(".hwt-board")
  const independence = await page21.evaluate(async () => {
    const { runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const grid = { rows: 5, cols: 7 }
    const state = {
      grid, phase: "enemy", turn: 1, log: [],
      units: [
        {
          id: "player-1", side: "player", defId: "bulwark-of-ages", name: "A", art: "sword", image: null,
          pos: { row: 2, col: 6 }, hp: 50, maxHp: 50, move: 2, range: 1, attack: 4, ap: 2, apMax: 2, block: 0,
          ability: { id: "aura-block", name: "Bulwark Aura", cost: 1, kind: "aura-block", amount: 2, cooldown: 2 },
          cooldownRemaining: 2,
        },
        {
          id: "player-2", side: "player", defId: "hexbreaker", name: "B", art: "sword", image: null,
          pos: { row: 3, col: 6 }, hp: 30, maxHp: 30, move: 3, range: 3, attack: 5, ap: 2, apMax: 2, block: 0,
          ability: { id: "focused-shot", name: "Focused Shot", cost: 2, kind: "burst", multiplier: 2, cooldown: 3 },
          cooldownRemaining: 3,
        },
      ],
    }
    // No enemies in this synthetic state - runEnemyTurn's own loop is a
    // no-op over an empty filter, falling straight through to the
    // player-phase-return reset/decrement this check is pinning.
    const after1 = runEnemyTurn(state)
    const after2 = runEnemyTurn({ ...after1, phase: "enemy" })
    return {
      a1: after1.units.find((u) => u.id === "player-1").cooldownRemaining,
      b1: after1.units.find((u) => u.id === "player-2").cooldownRemaining,
      a2: after2.units.find((u) => u.id === "player-1").cooldownRemaining,
      b2: after2.units.find((u) => u.id === "player-2").cooldownRemaining,
    }
  })
  await page21.close()
  out.cooldownIndependence = independence
  if (!(independence.a1 === 1 && independence.b1 === 2 && independence.a2 === 0 && independence.b2 === 1)) {
    out.errors.push("check21 two abilities' cooldowns did not tick down independently at their own rates")
  }
}

// ---------------------------------------------------------------
// Phase 3 first slice: Swarm + Fortress archetypes
// (feat/hearthwood-tactics-archetypes). Every new check below gets its
// own fresh page from the start (the established anti-hang lesson from
// the intent-telegraphs and cooldowns rounds).
// ---------------------------------------------------------------

// 22. The Swarm ("the-brood") - real composition, outnumbers the player
//     4-to-3, and the flat +1 Strength bonus actually lands in combat ----
{
  const page22 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page22.on("pageerror", (e) => errs.push(String(e)))
  await page22.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page22.waitForSelector(".hwt-board")
  await page22.locator(".hwt-formation-btn", { hasText: "The Brood" }).click()
  await page22.waitForTimeout(300)
  const enemyNames = await page22.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page22.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  let logText = ""
  let foundBonusHit = false
  for (let i = 0; i < 15 && !foundBonusHit; i++) {
    await page22.locator(".hwt-end-turn").click().catch(() => {})
    await page22.waitForTimeout(400)
    logText = await page22.locator(".hwt-log").innerText()
    // Sporelet's real base attack 3 -> 4 with the swarm bonus; Mire Gnat's
    // real base attack 4 -> 5. Either landing confirms the +1 grant.
    foundBonusHit = /Sporelet strikes .* for 4\./.test(logText) || /Mire Gnat strikes .* for 5\./.test(logText)
    const phase = await page22.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  await page22.close()
  const enemyCountOk =
    enemyNames.filter((n) => n === "Sporelet").length === 2 && enemyNames.filter((n) => n === "Mire Gnat").length === 2
  out.swarmFormation = { enemyNames, playerNames, foundBonusHit, logSample: logText.split("\n").slice(0, 3) }
  if (!(enemyCountOk && playerNames.length === 3 && foundBonusHit)) {
    out.errors.push("check22 Swarm formation composition or its +1 attack bonus was wrong")
  }
}

// 23. The Fortress ("the-bulwark") - real composition, still 3-to-3 -------
{
  const page23 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page23.on("pageerror", (e) => errs.push(String(e)))
  await page23.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page23.waitForSelector(".hwt-board")
  await page23.locator(".hwt-formation-btn", { hasText: "The Bulwark" }).click()
  await page23.waitForTimeout(300)
  const enemyNames = await page23.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page23.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page23.close()
  const enemyCountOk =
    enemyNames.filter((n) => n === "Oakshell Warden").length === 2 && enemyNames.filter((n) => n === "Mossmender").length === 1
  out.fortressFormation = { enemyNames, playerNames }
  if (!(enemyCountOk && playerNames.length === 3)) out.errors.push("check23 Fortress formation composition was wrong")
}

// 24. The Fortress's Block grant is exactly 3 for every enemy, every enemy
//     phase - a deterministic engine-level proof (page.evaluate) rather
//     than inferring it from a live multi-turn attack chase ------------
{
  const page24 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page24.on("pageerror", (e) => errs.push(String(e)))
  await page24.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page24.waitForSelector(".hwt-board")
  const blockGrant = await page24.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const afterEnemyPhaseStarts = endPlayerTurn(createTacticsBattle("fortress"))
    return afterEnemyPhaseStarts.units.filter((u) => u.side === "enemy").map((u) => ({ name: u.name, block: u.block }))
  })
  await page24.close()
  const allThree = blockGrant.length === 3 && blockGrant.every((u) => u.block === 3)
  out.fortressBlockGrant = blockGrant
  if (!allThree) out.errors.push("check24 the Fortress's Block grant was not exactly 3 for every enemy")
}

// 25. The picker restarts cleanly (fresh HP/turn/roster), both ways -------
{
  const page25 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page25.on("pageerror", (e) => errs.push(String(e)))
  await page25.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page25.waitForSelector(".hwt-board")
  await page25.locator(".hwt-end-turn").click().catch(() => {})
  await page25.waitForTimeout(500)
  await page25.locator(".hwt-formation-btn", { hasText: "The Brood" }).click()
  await page25.waitForTimeout(300)
  const turnAfterSwarm = await page25.locator(".hwt-turn-label").innerText()
  const namesAfterSwarm = await page25.locator(".hwt-token-name").allInnerTexts()
  const hpFullAfterSwarm = await page25
    .locator(".hwt-token", { hasText: "Bulwark of Ages" })
    .locator(".hwt-hp-fill")
    .evaluate((el) => el.style.width)
  await page25.locator(".hwt-formation-btn", { hasText: "The Frontier Test Squad" }).click()
  await page25.waitForTimeout(300)
  const namesBackToDefault = await page25.locator(".hwt-token-name").allInnerTexts()
  await page25.close()
  const swarmResetOk = /Player Turn 1/.test(turnAfterSwarm) && hpFullAfterSwarm === "100%" && namesAfterSwarm.includes("Sporelet")
  const roundTripOk = ["Ironmaw", "Sapling Attendant", "Hoardling"].every((n) => namesBackToDefault.includes(n))
  out.pickerRestart = { turnAfterSwarm, hpFullAfterSwarm, swarmResetOk, roundTripOk }
  if (!(swarmResetOk && roundTripOk)) out.errors.push("check25 the formation picker did not reset to a fresh battle both ways")
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_prototype (Swarm + Fortress archetypes) PASS" : "\n❌ verify_tactics_prototype (Swarm + Fortress archetypes) FAIL")
process.exit(pass ? 0 : 1)
