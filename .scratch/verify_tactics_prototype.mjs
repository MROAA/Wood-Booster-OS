import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood Frontier - Phase 2 of the turn-based pivot
// (feat/hearthwood-tactics-phase2): Action Points + one real ability per
// unit, layered onto Phase 1's isolated grid-combat prototype. Still no
// runEngine.js/autoBattleEngine.js/save-state touch. There is no headless
// engine call to substitute for verification - this IS the interactive
// surface, so the script drives the actual rendered UI exactly the way
// Marc would click through it.

const PORT = process.env.PORT || 5383
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-phase2/.scratch/shots"
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

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_prototype (Phase 2) PASS" : "\n❌ verify_tactics_prototype (Phase 2) FAIL")
process.exit(pass ? 0 : 1)
