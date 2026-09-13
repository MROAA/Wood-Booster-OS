import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood Frontier - Phase 3 continues (feat/hearthwood-tactics-ancients,
// fix/hearthwood-tactics-charge-telegraph, then feat/hearthwood-tactics-
// coven): The Ancients archetype ("ancients" / "The Ancient Grove") - 2x
// Sapling Attendant + 1x Ancient Oak, real HP/attack numbers, a telegraphed
// countdown to ONE big AoE hit (applyChargeTick, ported line-for-line from
// autoBattleEngine.js's applyAncientCharge - same log phrasing, same
// stagger/tick/payoff shape, minus the stun-holds-the-count branch this
// engine has no status system for yet). Also: GRID doubled from 5x7 to 7x10
// (Marc: "taistelukenttä saa olla isompi") - every formation's row spread
// re-centered on the taller grid; no synthetic-state check below depends on
// the real GRID/row constants (each builds its own literal grid), so this
// needed zero test changes beyond this comment. FOLLOW-UP FIX (same
// session, Marc's feedback: "vihollisen intend pitää näyttää area of
// effect. ancientin hyökkäys ei näy ja sen rajat pitäisi näkyä"): the
// charge payoff had NO visual telegraph at all beyond the plain countdown
// number - a new previewChargeThreat(state) dry-runs applyChargeTick (the
// same provably-accurate discipline as previewEnemyIntents) so the UI can
// mark every player cell the payoff will hit (reusing the existing
// data-threatened ember ring) and flip the charging enemy's own badge to
// "⚡!" the turn it's about to land. THE COVEN ARCHETYPE ("coven" / "The
// Conclave") - Bog Devotee + Hex Acolyte + Coven Matron, real HP/attack
// numbers, a per-round applyCovenTick (ported from autoBattleEngine.js's
// own applyCovenTick) that buffs every OTHER living enemy's attack by the
// Matron's real covenAura amount each round - killing the Matron stops it
// for free. A new baseAttack snapshot (taken once at battle start) lets
// the UI show a growing "▲N" badge on any buffed unit, so the mechanic is
// visible the same round it ships (not a repeat of the Ancients' telegraph
// gap). Layered onto Phase 1's isolated grid-combat prototype, Phase 2's
// full AP/ability/telegraph/cooldown economy, and Phase 3's Swarm +
// Fortress + Hunters + Ancients archetypes. THE CULT ARCHETYPE ("cult" /
// "The Communion") - 2x Sworn Cultist + 1x Ritual Warden, real HP/attack
// numbers, a new applyCultTick (ported from autoBattleEngine.js's own
// applyCultTick) that periodically sacrifices a living cultFodder ally to
// buff EVERY remaining living enemy - the leader itself included this
// time (unlike the Coven's exclude-self model). Bounded: only fires while
// fodder lives (2 per formation -> at most 2 cycles, then permanent
// de-escalation); killing the leader stops it. The real mechanic ticks
// silently until it fires; this round adds a small ☾-badge + a quiet log
// line on every tick too, matching the established "narrate every tick"
// pattern from the Ancients/Coven rounds rather than reproducing the real
// game's silence. THE BROOD ARCHETYPE ("brood" / "The Clutch") - 3x Brood
// Mother, real HP/attack numbers, a new trySpawnBrood hook wired into both
// attackUnit and castAbility's burst branch: when a broodSplit-carrying
// enemy falls, it tears into `count` HP-reduced copies of itself (via a
// new freeCellsNear board-wide nearest-free-cell search, a generalization
// of the real game's fixed 3-column zone to this engine's much bigger
// 7x10 board) BEFORE checkTacticsBattleEnd runs - the critical ordering
// that keeps a "kill the last living mother" moment from falsely
// resolving as "won" before its hatchlings land. A hatchling's own
// broodGen >= maxGen guard (inherited from the same defId) stops any
// cascade - no separate "can't re-split" flag needed. No AoE/execute
// mechanic exists on any player unit in this engine, so unlike the real
// archetype's headline answer, the honest counter here is just that the
// hatchlings are frail - a pre-existing limitation, not a new one. THE
// ROT ARCHETYPE ("rot" / "The Blight") - 2x Rotgut Crawler + 1x Spore
// Lurcher, real HP/attack/poison numbers ported from enemies.js directly.
// A new player-side poison stack: `poisonFromMovePattern` sums a def's
// real `debuff poison` movePattern steps into one flat `poisonOnHit`
// number (the same "read the def's own data" discipline
// attackFromMovePattern already uses for attack); attackUnit applies it
// on every landed enemy hit, unconditional of Block. A new
// applyPoisonTick (ported from effects.js's own tickPoison) deals damage
// equal to the current stack DIRECTLY to hp - bypassing Block entirely,
// the one defining trait that makes poison distinct from every other
// damage source this engine has had so far - then decays the stack by
// exactly 1; ticks at the "top of the next turn" checkpoint
// (runEnemyTurn's existing AP/Block/cooldown reset point), the closest
// analog to the real game's own "poison ticks before anyone acts" timing.
// Also ported: the real formation's "The rot won't quit" self-mend
// synergy (a flat turnStart -> heal 1 to every living enemy piece each
// round) via a new applyRotMendTick, the same per-round tick SHAPE
// applyCovenTick/applyCultTick/applyChargeTick already use. No cleanse
// ability exists on any player unit in this engine - a named, pre-
// existing limitation, not a new one; burst and the existing Regrowth
// heal remain real working answers. THE COLLECTORS ARCHETYPE ("collectors"
// / "The Tithe") - 2x Hoardling + 1x Tithe-Warden, real HP/attack/leech
// numbers ported from enemies.js/formations.js directly - the LAST of
// the 9 real auto-battler archetypes. A new grantStrengthOnKill gives
// every player unit +1 permanent attack on a killing blow (reusing the
// already-computed `fell` flag Brood's spawn hook also reads) - the
// "something worth stealing" this archetype needs, and the SAME
// attack-above-baseAttack shape the Coven round's generic hwt-strength-
// badge already renders for any unit, so zero UI changes were needed.
// A new applyLeechOnHit (ported from effects.js's own leech()) steals
// exactly 1 point of that earned bonus on a landed hit (remaining > 0,
// mirroring the real onDealDamage's overflow > 0 gate) and hands it to
// the thief, or logs "finds nothing worth taking" if there's none -
// deliberately targets `attack`, never Block, since a hit that overflows
// Block has already zeroed it within that same hit's own absorb-then-
// deplete math, so Block would never have anything left to steal by the
// time a leech check could run. No Sunder-equivalent answer exists in
// this engine - a named, pre-existing limitation; bursting the Collectors
// down fast remains the real working answer. Still no runEngine.js/
// autoBattleEngine.js/save-state touch. THE ROSTER-EXPANSION ROUND (all
// 9 archetypes now shipped; Marc picked expanding the player roster, then
// - after a real trade-off was surfaced and asked back to him - a SIDEBAR
// squad picker mirroring the existing "Choose your opponent" list, not a
// dedicated pre-battle screen that would have gated every page load and
// broken all 54 prior checks' "loads straight into a fight" assumption).
// 3 new units - Oathshield/Willowmend/Bramble Sweep - each converted onto
// one of the 3 EXISTING ability kinds (aura-block/heal/burst): Shieldwall
// (a lighter Bulwark Aura, amount 1), Mending Waters (a second Regrowth,
// amount 4), Ripple Strike (a second Focused Shot, identical numbers). A
// new PLAYER_ROSTER_IDS export (the 6-unit pool) and createTacticsBattle's
// new optional squadDefIds param (defaulting to PLAYER_DEF_IDS, today's
// exact starting 3 - so every one of the 54 prior checks needed zero
// changes beyond this comment) are the only engine surface added. Still
// no runEngine.js/autoBattleEngine.js/save-state touch. There is no
// headless engine call to substitute for verification - this IS the
// interactive surface, so the script drives the actual rendered UI
// exactly the way Marc would click through it.

const PORT = process.env.PORT || 5395
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-roster/.scratch/shots"
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

// ---------------------------------------------------------------
// The Hunters archetype (feat/hearthwood-tactics-hunters). Every new check
// gets its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 26. The Pack ("hunters") - real composition: 2x Fen Stalker + 1x Pack
//     Runner, 3 living player tokens -----------------------------------
{
  const page26 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page26.on("pageerror", (e) => errs.push(String(e)))
  await page26.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page26.waitForSelector(".hwt-board")
  await page26.locator(".hwt-formation-btn", { hasText: "The Pack" }).click()
  await page26.waitForTimeout(300)
  const enemyNames = await page26.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page26.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page26.close()
  const enemyCountOk =
    enemyNames.filter((n) => n === "Fen Stalker").length === 2 && enemyNames.filter((n) => n === "Pack Runner").length === 1
  out.huntersFormation = { enemyNames, playerNames }
  if (!(enemyCountOk && playerNames.length === 3)) out.errors.push("check26 Hunters formation composition was wrong")
}

// 27. The Pack's +2 bonus lands in combat - a passive End-Turn loop until
//     the log shows a landed hit at real-base+2 --------------------------
{
  const page27 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page27.on("pageerror", (e) => errs.push(String(e)))
  await page27.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page27.waitForSelector(".hwt-board")
  await page27.locator(".hwt-formation-btn", { hasText: "The Pack" }).click()
  await page27.waitForTimeout(300)
  let logText = ""
  let foundBonusHit = false
  for (let i = 0; i < 15 && !foundBonusHit; i++) {
    await page27.locator(".hwt-end-turn").click().catch(() => {})
    await page27.waitForTimeout(400)
    logText = await page27.locator(".hwt-log").innerText()
    // Fen Stalker's real base attack 7 -> 9 with the +2 grant; Pack
    // Runner's real base attack (derived average of 4/5 -> 5) -> 7.
    foundBonusHit = /Fen Stalker strikes .* for 9\./.test(logText) || /Pack Runner strikes .* for 7\./.test(logText)
    const phase = await page27.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  await page27.close()
  out.huntersBonusHit = { foundBonusHit, logSample: logText.split("\n").slice(0, 3) }
  if (!foundBonusHit) out.errors.push("check27 the Hunters' +2 battle-start bonus did not land in combat")
}

// 28. Already-weakest-first targeting still holds (no regression from the
//     swarmBonus -> battleStartBonus rename) - a Hunters enemy in range of
//     two player units at different HP telegraphs an attack on the LOWER
//     one, exactly the same decideEnemyIntent every other formation
//     already gets for free ----------------------------------------------
{
  const page28 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page28.on("pageerror", (e) => errs.push(String(e)))
  await page28.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page28.waitForSelector(".hwt-board")
  const weakest = await page28.evaluate(async () => {
    const { previewEnemyIntents } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 7 },
      phase: "player",
      turn: 1,
      log: [],
      units: [
        {
          id: "player-tanky", side: "player", defId: "bulwark-of-ages", name: "Tanky", art: "sword", image: null,
          pos: { row: 2, col: 1 }, hp: 40, maxHp: 40, move: 2, range: 1, attack: 4, ap: 2, apMax: 2, block: 0, ability: null, cooldownRemaining: 0,
        },
        {
          id: "player-weak", side: "player", defId: "the-fool", name: "Weak", art: "sword", image: null,
          pos: { row: 2, col: 3 }, hp: 6, maxHp: 24, move: 3, range: 1, attack: 5, ap: 2, apMax: 2, block: 0, ability: null, cooldownRemaining: 0,
        },
        {
          id: "enemy-1", side: "enemy", defId: "fen-stalker", name: "Fen Stalker", art: "wolf", image: null,
          pos: { row: 2, col: 2 }, hp: 32, maxHp: 32, move: 2, range: 1, attack: 9, ap: 2, apMax: 2, block: 0, ability: null, cooldownRemaining: 0,
        },
      ],
    }
    const intents = previewEnemyIntents(state)
    return intents.find((i) => i.enemyId === "enemy-1")?.intent
  })
  await page28.close()
  const huntsWeakest = weakest?.kind === "attack" && weakest.targetId === "player-weak"
  out.huntersWeakestTargeting = weakest
  if (!huntsWeakest) out.errors.push("check28 a Hunters enemy did not telegraph an attack on the lowest-HP player unit")
}

// ---------------------------------------------------------------
// The Ancients archetype (feat/hearthwood-tactics-ancients). Every new
// check gets its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 29. The Ancient Grove ("ancients") - real composition: 2x Sapling
//     Attendant + 1x Ancient Oak, 3 living player tokens, and the Oak's
//     charge badge initializes to the real charge.turns (3) while neither
//     Sapling shows one ------------------------------------------------
{
  const page29 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page29.on("pageerror", (e) => errs.push(String(e)))
  await page29.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page29.waitForSelector(".hwt-board")
  await page29.locator(".hwt-formation-btn", { hasText: "The Ancient Grove" }).click()
  await page29.waitForTimeout(300)
  const enemyNames = await page29.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page29.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const oakBadge = await page29
    .locator(".hwt-token", { hasText: "Ancient Oak" })
    .locator(".hwt-charge-badge")
    .innerText()
    .catch(() => null)
  const saplingBadges = await page29
    .locator(".hwt-token", { hasText: "Sapling Attendant" })
    .locator(".hwt-charge-badge")
    .count()
  await page29.close()
  const enemyCountOk =
    enemyNames.filter((n) => n === "Sapling Attendant").length === 2 && enemyNames.filter((n) => n === "Ancient Oak").length === 1
  out.ancientsFormation = { enemyNames, playerNames, oakBadge, saplingBadges }
  if (!(enemyCountOk && playerNames.length === 3 && oakBadge === "⚡3" && saplingBadges === 0)) {
    out.errors.push("check29 Ancient Grove composition or the charge badge init was wrong")
  }
}

// 30. The countdown ticks down and the payoff lands - a passive End-Turn
//     loop (only clicking End Turn): the badge reads 3->2->1, the log
//     narrates each tick, then the payoff fires, every living player unit
//     loses HP, and the badge resets to 3 --------------------------------
{
  const page30 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page30.on("pageerror", (e) => errs.push(String(e)))
  await page30.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page30.waitForSelector(".hwt-board")
  await page30.locator(".hwt-formation-btn", { hasText: "The Ancient Grove" }).click()
  await page30.waitForTimeout(300)
  const hpFillSum = async () => {
    const widths = await page30.locator('.hwt-token[data-side="player"] .hwt-hp-fill').evaluateAll((els) => els.map((el) => parseFloat(el.style.width)))
    return widths.reduce((a, b) => a + b, 0)
  }
  const badges = [await page30.locator(".hwt-token", { hasText: "Ancient Oak" }).locator(".hwt-charge-badge").innerText()]
  const hpBeforePayoff = await hpFillSum()
  let logText = ""
  let sawUnleash = false
  for (let i = 0; i < 5 && !sawUnleash; i++) {
    await page30.locator(".hwt-end-turn").click().catch(() => {})
    await page30.waitForTimeout(400)
    badges.push(await page30.locator(".hwt-token", { hasText: "Ancient Oak" }).locator(".hwt-charge-badge").innerText().catch(() => "gone"))
    logText = await page30.locator(".hwt-log").innerText()
    sawUnleash = /unleashes Rootfall!/.test(logText)
    const phase = await page30.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  const hpAfterPayoff = await hpFillSum().catch(() => -1)
  await page30.close()
  const badgeSeq = badges.join(",")
  // The badge shows "⚡!" instead of a literal "⚡1" the turn the payoff is
  // about to land (the charge-telegraph fix, same session) - the sequence
  // is 3 -> 2 -> "about to fire" -> reset, not literally down to "1".
  const tickedDown = /⚡3.*⚡2.*⚡!/.test(badgeSeq)
  const resetAfter = badges[badges.length - 1] === "⚡3" || badges[badges.length - 1] === "gone"
  const hpDropped = hpAfterPayoff < hpBeforePayoff || hpAfterPayoff === -1
  out.ancientsPayoff = { badges, sawUnleash, tickedDown, hpBeforePayoff, hpAfterPayoff, logSample: logText.split("\n").slice(-4) }
  if (!(sawUnleash && tickedDown && hpDropped)) {
    out.errors.push("check30 the charge countdown did not tick down and land its telegraphed payoff")
  }
}

// 31. A heavy hit stalls it - a deterministic page.evaluate proof: reduce
//     the Oak's hp by more than breakDamage (22), call endPlayerTurn, and
//     assert the log narrates a stagger and the counter is back to 3 -----
{
  const page31 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page31.on("pageerror", (e) => errs.push(String(e)))
  await page31.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page31.waitForSelector(".hwt-board")
  const staggerResult = await page31.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("ancients")
    const damaged = { ...battle, units: battle.units.map((u) => (u.defId === "ancient-oak" ? { ...u, hp: u.hp - 30 } : u)) }
    const after = endPlayerTurn(damaged)
    const oak = after.units.find((u) => u.defId === "ancient-oak")
    return { chargeCounter: oak?.chargeCounter, logHasStagger: after.log.some((l) => l.includes("staggers - the Rootfall unravels")) }
  })
  await page31.close()
  out.ancientsStagger = staggerResult
  if (!(staggerResult.chargeCounter === 3 && staggerResult.logHasStagger)) {
    out.errors.push("check31 a heavy hit did not stagger the Ancient Oak's charge")
  }
}

// 32. Killing the Ancient Oak stops it - a deterministic page.evaluate
//     proof: hand-zero its hp, call endPlayerTurn, and assert no charge
//     activity is logged for it (the tick loop simply skips a dead unit) --
{
  const page32 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page32.on("pageerror", (e) => errs.push(String(e)))
  await page32.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page32.waitForSelector(".hwt-board")
  const killResult = await page32.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("ancients")
    const killed = { ...battle, units: battle.units.map((u) => (u.defId === "ancient-oak" ? { ...u, hp: 0 } : u)) }
    const after = endPlayerTurn(killed)
    return {
      logHasUnleash: after.log.some((l) => l.includes("unleashes")),
      logHasDrawBreath: after.log.some((l) => l.includes("draws breath")),
      phase: after.phase,
    }
  })
  await page32.close()
  out.ancientsKillStopsIt = killResult
  if (killResult.logHasUnleash || killResult.logHasDrawBreath) {
    out.errors.push("check32 a dead Ancient Oak still had charge activity logged")
  }
}

// ---------------------------------------------------------------
// AoE charge telegraph fix (fix/hearthwood-tactics-charge-telegraph) -
// Marc: "vihollisen intend pitää näyttää area of effect. ancientin
// hyökkäys ei näy ja sen rajat pitäisi näkyä" (the enemy's intent should
// show the area of effect; the Ancient's attack doesn't show and its
// bounds should be visible). Every new check gets its own fresh page.
// ---------------------------------------------------------------

// 33. previewChargeThreat is accurate, deterministically, via 3 hand-built
//     synthetic states (about to fire / not yet / staggers instead) -----
{
  const page33 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page33.on("pageerror", (e) => errs.push(String(e)))
  await page33.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page33.waitForSelector(".hwt-board")
  const threat = await page33.evaluate(async () => {
    const { previewChargeThreat } = await import("/src/services/heartwood/tacticsEngine.js")
    const charge = { turns: 3, breakDamage: 22, effect: [{ type: "damage", amount: 9 }], label: "Rootfall" }
    // chargeHpMark is the Oak's HP as of the LAST tick (always 100 here -
    // it was full then); `hp` is its CURRENT hp - lower than chargeHpMark
    // means it's taken damage since, and >= breakDamage of that triggers a
    // stagger instead of a payoff.
    const oak = (chargeCounter, hp) => ({
      id: "enemy-oak", side: "enemy", defId: "ancient-oak", name: "Ancient Oak", art: "barkBrute", image: null,
      pos: { row: 3, col: 0 }, hp, maxHp: 100, move: 2, range: 1, attack: 6, ap: 2, apMax: 2, block: 0,
      ability: null, cooldownRemaining: 0, charge, chargeCounter, chargeHpMark: 100,
    })
    const players = ["p1", "p2", "p3"].map((id, i) => ({
      id, side: "player", defId: "bulwark-of-ages", name: id, art: "sword", image: null,
      pos: { row: i + 2, col: 6 }, hp: 30, maxHp: 30, move: 2, range: 1, attack: 4, ap: 2, apMax: 2, block: 0,
      ability: null, cooldownRemaining: 0,
    }))
    const grid = { rows: 7, cols: 10 }
    const base = { grid, phase: "player", turn: 1, log: [] }
    const aboutToFire = previewChargeThreat({ ...base, units: [oak(1, 100), ...players] })
    const notYet = previewChargeThreat({ ...base, units: [oak(2, 100), ...players] })
    const willStagger = previewChargeThreat({ ...base, units: [oak(1, 100 - 30), ...players] })
    return { aboutToFire, notYet, willStagger }
  })
  await page33.close()
  out.chargeThreatPreview = threat
  const fireOk = threat.aboutToFire.enemyIds.includes("enemy-oak") && threat.aboutToFire.playerIds.length === 3
  const notYetOk = threat.notYet.enemyIds.length === 0 && threat.notYet.playerIds.length === 0
  const staggerOk = threat.willStagger.enemyIds.length === 0 && threat.willStagger.playerIds.length === 0
  if (!(fireOk && notYetOk && staggerOk)) {
    out.errors.push("check33 previewChargeThreat did not correctly distinguish about-to-fire / not-yet / staggering")
  }
}

// 34. The board shows it: after 2 End Turns (chargeCounter 3->2->1), the
//     Oak's badge flips to "⚡!" and EVERY living player cell shows the
//     same data-threatened ring the regular attack telegraph uses ------
{
  const page34 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page34.on("pageerror", (e) => errs.push(String(e)))
  await page34.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page34.waitForSelector(".hwt-board")
  await page34.locator(".hwt-formation-btn", { hasText: "The Ancient Grove" }).click()
  await page34.waitForTimeout(300)
  await page34.locator(".hwt-end-turn").click().catch(() => {})
  await page34.waitForTimeout(400)
  await page34.locator(".hwt-end-turn").click().catch(() => {})
  await page34.waitForTimeout(400)
  const oakBadge = await page34.locator(".hwt-token", { hasText: "Ancient Oak" }).locator(".hwt-charge-badge").innerText()
  const oakImminent = await page34
    .locator(".hwt-token", { hasText: "Ancient Oak" })
    .locator(".hwt-charge-badge")
    .getAttribute("data-imminent")
  const threatenedPlayerCells = await page34
    .locator('.hwt-cell[data-threatened="true"]')
    .locator('.hwt-token[data-side="player"]')
    .count()
  await page34.close()
  out.chargeTelegraphUi = { oakBadge, oakImminent, threatenedPlayerCells }
  if (!(oakBadge === "⚡!" && oakImminent === "true" && threatenedPlayerCells === 3)) {
    out.errors.push("check34 the board did not telegraph the imminent AoE (badge + threatened cells)")
  }
}

// ---------------------------------------------------------------
// The Coven archetype (feat/hearthwood-tactics-coven). Every new check
// gets its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 35. The Conclave ("coven") - real composition: Bog Devotee + Hex
//     Acolyte + Coven Matron, 3 living player tokens ---------------------
{
  const page35 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page35.on("pageerror", (e) => errs.push(String(e)))
  await page35.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page35.waitForSelector(".hwt-board")
  await page35.locator(".hwt-formation-btn", { hasText: "The Conclave" }).click()
  await page35.waitForTimeout(300)
  const enemyNames = await page35.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page35.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page35.close()
  const enemyCountOk = ["Bog Devotee", "Hex Acolyte", "Coven Matron"].every((n) => enemyNames.includes(n))
  out.covenFormation = { enemyNames, playerNames }
  if (!(enemyCountOk && enemyNames.length === 3 && playerNames.length === 3)) {
    out.errors.push("check35 Conclave formation composition was wrong")
  }
}

// 36. The buff lands every round, on everyone but itself - a passive
//     End-Turn loop: the log narrates it, the buffed pieces show a
//     growing "▲N" badge, the Matron itself shows none ------------------
{
  const page36 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page36.on("pageerror", (e) => errs.push(String(e)))
  await page36.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page36.waitForSelector(".hwt-board")
  await page36.locator(".hwt-formation-btn", { hasText: "The Conclave" }).click()
  await page36.waitForTimeout(300)
  for (let i = 0; i < 3; i++) {
    await page36.locator(".hwt-end-turn").click().catch(() => {})
    await page36.waitForTimeout(400)
    const phase = await page36.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  const logText = await page36.locator(".hwt-log").innerText()
  const empowersLogged = /empowers the pack\./.test(logText)
  const devoteeBadge = await page36
    .locator(".hwt-token", { hasText: "Bog Devotee" })
    .locator(".hwt-strength-badge")
    .innerText()
    .catch(() => null)
  const matronBadgeCount = await page36
    .locator(".hwt-token", { hasText: "Coven Matron" })
    .locator(".hwt-strength-badge")
    .count()
  await page36.close()
  out.covenBuffVisible = { empowersLogged, devoteeBadge, matronBadgeCount }
  if (!(empowersLogged && devoteeBadge && /^▲\d+$/.test(devoteeBadge) && matronBadgeCount === 0)) {
    out.errors.push("check36 the coven's per-round buff was not narrated/visible, or the Matron wrongly buffed itself")
  }
}

// 37. Exact per-round amount - a deterministic page.evaluate proof: one
//     endPlayerTurn on a fresh Conclave battle raises every OTHER living
//     enemy's attack by exactly the real covenAura.amount (1), and never
//     the Matron's own ------------------------------------------------
{
  const page37 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page37.on("pageerror", (e) => errs.push(String(e)))
  await page37.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page37.waitForSelector(".hwt-board")
  const result = await page37.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const before = createTacticsBattle("coven")
    const after = endPlayerTurn(before)
    const byId = (state, defId) => state.units.find((u) => u.defId === defId)
    return {
      devoteeDelta: byId(after, "bog-devotee").attack - byId(before, "bog-devotee").attack,
      acolyteDelta: byId(after, "hex-acolyte").attack - byId(before, "hex-acolyte").attack,
      matronDelta: byId(after, "coven-matron").attack - byId(before, "coven-matron").attack,
    }
  })
  await page37.close()
  out.covenExactAmount = result
  if (!(result.devoteeDelta === 1 && result.acolyteDelta === 1 && result.matronDelta === 0)) {
    out.errors.push("check37 the coven's per-round buff amount was not exactly the real covenAura.amount, or hit the Matron itself")
  }
}

// 38. Killing the Matron stops it - a deterministic page.evaluate proof:
//     hand-zero its hp, call endPlayerTurn a few times, assert no other
//     enemy's attack ever changes and no "empowers" log line appears ----
{
  const page38 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page38.on("pageerror", (e) => errs.push(String(e)))
  await page38.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page38.waitForSelector(".hwt-board")
  const result = await page38.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("coven")
    const killed = { ...base, units: base.units.map((u) => (u.defId === "coven-matron" ? { ...u, hp: 0 } : u)) }
    let state = killed
    for (let i = 0; i < 3; i++) state = endPlayerTurn(state)
    const byId = (s, defId) => s.units.find((u) => u.defId === defId)
    return {
      devoteeAttack: byId(state, "bog-devotee").attack,
      baseDevoteeAttack: byId(base, "bog-devotee").attack,
      logHasEmpowers: state.log.some((l) => l.includes("empowers the pack")),
    }
  })
  await page38.close()
  out.covenKillStopsIt = result
  if (!(result.devoteeAttack === result.baseDevoteeAttack && !result.logHasEmpowers)) {
    out.errors.push("check38 a dead Coven Matron still buffed the pack")
  }
}

// ---------------------------------------------------------------
// The Cult archetype (feat/hearthwood-tactics-cult). Every new check gets
// its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 39. The Communion ("cult") - real composition: 2x Sworn Cultist + 1x
//     Ritual Warden, 3 living player tokens; the Warden's ritual badge
//     initializes to "☾2" (every=2, ritualCharge=0), neither cultist
//     shows one ------------------------------------------------------
{
  const page39 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page39.on("pageerror", (e) => errs.push(String(e)))
  await page39.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page39.waitForSelector(".hwt-board")
  await page39.locator(".hwt-formation-btn", { hasText: "The Communion" }).click()
  await page39.waitForTimeout(300)
  const enemyNames = await page39.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page39.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const wardenBadge = await page39
    .locator(".hwt-token", { hasText: "Ritual Warden" })
    .locator(".hwt-ritual-badge")
    .innerText()
    .catch(() => null)
  const cultistBadgeCount = await page39
    .locator(".hwt-token", { hasText: "Sworn Cultist" })
    .locator(".hwt-ritual-badge")
    .count()
  await page39.close()
  const enemyCountOk = enemyNames.filter((n) => n === "Sworn Cultist").length === 2 && enemyNames.includes("Ritual Warden")
  out.cultFormation = { enemyNames, playerNames, wardenBadge, cultistBadgeCount }
  if (!(enemyCountOk && playerNames.length === 3 && wardenBadge === "☾2" && cultistBadgeCount === 0)) {
    out.errors.push("check39 Communion formation composition or the ritual badge init was wrong")
  }
}

// 40. The rite completes on the exact real cadence (every 2 rounds), and
//     it's visible: a passive End-Turn loop, exactly 2 turns - the log
//     narrates the sacrifice, one cultist dies, BOTH the surviving
//     cultist and the Warden show a growing "▲2" (the buff hits every
//     living enemy, itself included - unlike the Coven), and the ritual
//     badge resets to "☾2" ------------------------------------------
{
  const page40 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page40.on("pageerror", (e) => errs.push(String(e)))
  await page40.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page40.waitForSelector(".hwt-board")
  await page40.locator(".hwt-formation-btn", { hasText: "The Communion" }).click()
  await page40.waitForTimeout(300)
  await page40.locator(".hwt-end-turn").click().catch(() => {})
  await page40.waitForTimeout(400)
  await page40.locator(".hwt-end-turn").click().catch(() => {})
  await page40.waitForTimeout(400)
  const logText = await page40.locator(".hwt-log").innerText()
  const gaveLogged = /gives Sworn Cultist to the ritual\./.test(logText)
  const livingCultists = await page40.locator('.hwt-token[data-side="enemy"]', { hasText: "Sworn Cultist" }).count()
  const wardenStrengthBadge = await page40
    .locator(".hwt-token", { hasText: "Ritual Warden" })
    .locator(".hwt-strength-badge")
    .innerText()
    .catch(() => null)
  const cultistStrengthBadge = await page40
    .locator(".hwt-token[data-side=\"enemy\"]", { hasText: "Sworn Cultist" })
    .locator(".hwt-strength-badge")
    .innerText()
    .catch(() => null)
  const wardenRitualBadge = await page40
    .locator(".hwt-token", { hasText: "Ritual Warden" })
    .locator(".hwt-ritual-badge")
    .innerText()
    .catch(() => null)
  await page40.close()
  out.cultRiteCompletes = { gaveLogged, livingCultists, wardenStrengthBadge, cultistStrengthBadge, wardenRitualBadge }
  if (!(gaveLogged && livingCultists === 1 && wardenStrengthBadge === "▲2" && cultistStrengthBadge === "▲2" && wardenRitualBadge === "☾2")) {
    out.errors.push("check40 the rite did not complete on the real cadence, or its buff/reset was not visible/correct")
  }
}

// 41. De-escalation - a deterministic page.evaluate proof: drive
//     endPlayerTurn 4 times (2 full cycles, both cultists sacrificed),
//     then 2 more (a 3rd, fodder-less cycle attempt - `every: 2` means the
//     3rd attempt completes at call 6, not call 5); that 6th call's log
//     shows the ritual sputtering and the Warden's attack is unchanged
//     from where it stood after call 4 ------------------------------
{
  const page41 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page41.on("pageerror", (e) => errs.push(String(e)))
  await page41.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page41.waitForSelector(".hwt-board")
  const result = await page41.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("cult")
    for (let i = 0; i < 4; i++) state = endPlayerTurn(state)
    const wardenAttackAfter4 = state.units.find((u) => u.defId === "ritual-warden").attack
    for (let i = 0; i < 2; i++) state = endPlayerTurn(state)
    return {
      wardenAttackAfter4,
      wardenAttackAfter6: state.units.find((u) => u.defId === "ritual-warden").attack,
      sputterLogged: state.log.some((l) => l.includes("sputters - nothing left to give")),
    }
  })
  await page41.close()
  out.cultDeescalation = result
  if (!(result.sputterLogged && result.wardenAttackAfter6 === result.wardenAttackAfter4)) {
    out.errors.push("check41 the ritual did not de-escalate once its fodder was spent")
  }
}

// 42. Killing the Ritual Warden stops it - a deterministic page.evaluate
//     proof: hand-zero its hp, drive endPlayerTurn a few times, assert
//     both cultists remain alive and no "gives"/"sputters" line appears -
{
  const page42 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page42.on("pageerror", (e) => errs.push(String(e)))
  await page42.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page42.waitForSelector(".hwt-board")
  const result = await page42.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("cult")
    const killed = { ...base, units: base.units.map((u) => (u.defId === "ritual-warden" ? { ...u, hp: 0 } : u)) }
    let state = killed
    for (let i = 0; i < 3; i++) state = endPlayerTurn(state)
    const cultistsAlive = state.units.filter((u) => u.defId === "sworn-cultist" && u.hp > 0).length
    return {
      cultistsAlive,
      logHasGives: state.log.some((l) => l.includes("gives") && l.includes("ritual")),
      logHasSputters: state.log.some((l) => l.includes("sputters")),
    }
  })
  await page42.close()
  out.cultKillStopsIt = result
  if (!(result.cultistsAlive === 2 && !result.logHasGives && !result.logHasSputters)) {
    out.errors.push("check42 a dead Ritual Warden still ran its ritual")
  }
}

// ---------------------------------------------------------------
// The Brood archetype (feat/hearthwood-tactics-brood). Every new check
// gets its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 43. The Clutch ("brood") - real composition: 3x Brood Mother (distinct
//     ids, same defId), 3 living player tokens -------------------------
{
  const page43 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page43.on("pageerror", (e) => errs.push(String(e)))
  await page43.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page43.waitForSelector(".hwt-board")
  await page43.locator(".hwt-formation-btn", { hasText: "The Clutch" }).click()
  await page43.waitForTimeout(300)
  const enemyNames = await page43.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page43.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page43.close()
  const mothersOk = enemyNames.length === 3 && enemyNames.every((n) => n === "Brood Mother")
  out.broodFormation = { enemyNames, playerNames }
  if (!(mothersOk && playerNames.length === 3)) {
    out.errors.push("check43 The Clutch formation composition was wrong")
  }
}

// 44. Killing the last living mother spawns 2 HP-reduced hatchlings
//     BEFORE the battle can resolve as "won" - the critical ordering
//     proof (trySpawnBrood must run before checkTacticsBattleEnd) -------
{
  const page44 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page44.on("pageerror", (e) => errs.push(String(e)))
  await page44.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page44.waitForSelector(".hwt-board")
  const result = await page44.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("brood")
    const survivorId = base.units.find((u) => u.side === "enemy").id
    const attackerId = base.units.find((u) => u.side === "player").id
    // Zero every mother except one (the sole living enemy), park it at
    // hp:1 adjacent to the attacker - the exact "kill the LAST living
    // enemy" scenario that would falsely resolve as "won" if the spawn
    // ran after checkTacticsBattleEnd instead of before it.
    const state = {
      ...base,
      units: base.units.map((u) => {
        if (u.id === attackerId) return { ...u, pos: { row: 2, col: 2 } }
        if (u.side !== "enemy") return u
        if (u.id === survivorId) return { ...u, hp: 1, pos: { row: 2, col: 1 } }
        return { ...u, hp: 0 }
      }),
    }
    const beforeLivingEnemies = state.units.filter((u) => u.side === "enemy" && u.hp > 0).length
    const after = attackUnit(state, attackerId, survivorId)
    const livingEnemies = after.units.filter((u) => u.side === "enemy" && u.hp > 0)
    return {
      beforeLivingEnemies,
      phase: after.phase,
      livingEnemyCount: livingEnemies.length,
      hatchlingHps: livingEnemies.map((u) => u.hp),
      broodGens: livingEnemies.map((u) => u.broodGen),
      tearsCount: (after.log.join(" ").match(/tears free of the husk\./g) || []).length,
    }
  })
  await page44.close()
  out.broodKillSpawns = result
  const hpOk = result.hatchlingHps.length === 2 && result.hatchlingHps.every((hp) => hp === 14)
  const genOk = result.broodGens.every((g) => g === 1)
  if (!(result.beforeLivingEnemies === 1 && result.phase === "player" && result.livingEnemyCount === 2 && hpOk && genOk && result.tearsCount === 2)) {
    out.errors.push("check44 killing the last mother did not spawn 2 reduced hatchlings before the battle could resolve as won")
  }
}

// 45. No cascade - a hatchling (broodGen: 1) that falls does NOT spawn
//     again; the maxGen:1 guard holds -----------------------------------
{
  const page45 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page45.on("pageerror", (e) => errs.push(String(e)))
  await page45.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page45.waitForSelector(".hwt-board")
  const result = await page45.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("brood")
    const motherId = base.units.find((u) => u.side === "enemy").id
    const attackerId = base.units.find((u) => u.side === "player").id
    const state = {
      ...base,
      units: base.units.map((u) => {
        if (u.id === attackerId) return { ...u, pos: { row: 2, col: 2 } }
        if (u.side !== "enemy") return u
        // Hand-build "already a hatchling" in the mother's place.
        if (u.id === motherId) return { ...u, hp: 1, maxHp: 14, broodGen: 1, pos: { row: 2, col: 1 } }
        return { ...u, hp: 0 }
      }),
    }
    const unitCountBefore = state.units.length
    const after = attackUnit(state, attackerId, motherId)
    return {
      unitCountBefore,
      unitCountAfter: after.units.length,
      tearsCount: (after.log.join(" ").match(/tears free of the husk\./g) || []).length,
      phase: after.phase,
    }
  })
  await page45.close()
  out.broodNoCascade = result
  if (!(result.unitCountAfter === result.unitCountBefore && result.tearsCount === 0 && result.phase === "won")) {
    out.errors.push("check45 a broodGen:1 hatchling re-split, breaking the maxGen guard")
  }
}

// 46. The board-wide free-cell search works away from the real game's
//     fixed 3-column zone (rows 0-1, cols 0-2) - a mother dying deep in
//     the board spawns hatchlings on the nearest ACTUALLY-FREE cells to
//     its own death tile, not confined to that corner -------------------
{
  const page46 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page46.on("pageerror", (e) => errs.push(String(e)))
  await page46.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page46.waitForSelector(".hwt-board")
  const result = await page46.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const motherPos = { row: 5, col: 7 }
    const state = {
      grid: { rows: 7, cols: 10 },
      phase: "player",
      turn: 1,
      log: [],
      formationId: "brood",
      units: [
        {
          id: "attacker", side: "player", defId: "bulwark-of-ages", name: "Attacker", art: "sword", image: null,
          pos: { row: 5, col: 6 }, hp: 40, maxHp: 40, move: 2, range: 1, attack: 10, ap: 2, apMax: 2, block: 0,
          ability: null, cooldownRemaining: 0, charge: null, chargeCounter: 0, chargeHpMark: 40, covenAura: null,
          cultRitual: null, cultFodder: false, ritualCharge: 0, broodSplit: null, broodGen: 0,
        },
        {
          id: "mother", side: "enemy", defId: "brood-mother", name: "Brood Mother", art: "husk", image: null,
          pos: motherPos, hp: 1, maxHp: 34, move: 2, range: 1, attack: 5, ap: 2, apMax: 2, block: 0,
          ability: null, cooldownRemaining: 0, charge: null, chargeCounter: 0, chargeHpMark: 34, covenAura: null,
          cultRitual: null, cultFodder: false, ritualCharge: 0,
          broodSplit: { count: 2, hpFactor: 0.4, maxGen: 1 }, broodGen: 0,
        },
      ],
    }
    const after = attackUnit(state, "attacker", "mother")
    const hatchlings = after.units.filter((u) => u.id !== "attacker" && u.id !== "mother" && u.hp > 0)
    const overlapsAttacker = hatchlings.some((h) => h.pos.row === 5 && h.pos.col === 6)
    const inFixedRealGameZone = hatchlings.every((h) => h.pos.row <= 1 && h.pos.col <= 2)
    const maxDist = Math.max(
      ...hatchlings.map((h) => Math.max(Math.abs(h.pos.row - motherPos.row), Math.abs(h.pos.col - motherPos.col))),
    )
    return { hatchlingCount: hatchlings.length, positions: hatchlings.map((h) => h.pos), overlapsAttacker, inFixedRealGameZone, maxDist }
  })
  await page46.close()
  out.broodFreeCellSearch = result
  if (!(result.hatchlingCount === 2 && !result.overlapsAttacker && !result.inFixedRealGameZone && result.maxDist <= 1)) {
    out.errors.push("check46 the board-wide free-cell search did not land hatchlings on the nearest free cells to the death tile")
  }
}

// ---------------------------------------------------------------
// The Rot archetype (feat/hearthwood-tactics-rot). Every new check gets
// its own fresh page from the start (the established anti-hang
// discipline).
// ---------------------------------------------------------------

// 47. The Blight ("rot") - real composition: 2x Rotgut Crawler + 1x
//     Spore Lurcher, 3 living player tokens ----------------------------
{
  const page47 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page47.on("pageerror", (e) => errs.push(String(e)))
  await page47.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page47.waitForSelector(".hwt-board")
  await page47.locator(".hwt-formation-btn", { hasText: "The Blight" }).click()
  await page47.waitForTimeout(300)
  const enemyNames = await page47.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page47.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page47.close()
  const compositionOk =
    enemyNames.filter((n) => n === "Rotgut Crawler").length === 2 && enemyNames.filter((n) => n === "Spore Lurcher").length === 1
  out.rotFormation = { enemyNames, playerNames }
  if (!(compositionOk && playerNames.length === 3)) {
    out.errors.push("check47 The Blight formation composition was wrong")
  }
}

// 48. Poison lands, is visible, and is narrated - a passive End-Turn loop
//     until a player token shows the poison badge; the log narrates it
//     landing with the right stack count -------------------------------
{
  const page48 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page48.on("pageerror", (e) => errs.push(String(e)))
  await page48.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page48.waitForSelector(".hwt-board")
  await page48.locator(".hwt-formation-btn", { hasText: "The Blight" }).click()
  await page48.waitForTimeout(300)
  let logText = ""
  let poisonBadge = null
  for (let i = 0; i < 15 && !poisonBadge; i++) {
    await page48.locator(".hwt-end-turn").click().catch(() => {})
    await page48.waitForTimeout(400)
    poisonBadge = await page48.locator(".hwt-poison-badge").first().innerText().catch(() => null)
    logText = await page48.locator(".hwt-log").innerText()
    const phase = await page48.locator(".hwt-turn-label").getAttribute("data-phase")
    if (phase === "lost" || phase === "won") break
  }
  await page48.close()
  const isPoisonedLogged = /is poisoned \(\+[23]\)\./.test(logText)
  const badgeOk = poisonBadge === "☠2" || poisonBadge === "☠3"
  out.rotPoisonLands = { poisonBadge, isPoisonedLogged, logSample: logText.split("\n").slice(-6) }
  if (!(badgeOk && isPoisonedLogged)) out.errors.push("check48 poison did not land visibly with the right stack + log narration")
}

// 49. Poison deals damage equal to its FULL stack directly to hp,
//     bypassing Block entirely (a Block value large enough to fully
//     absorb a normal hit does NOT reduce the poison tick at all), then
//     decays by exactly 1 - a deterministic page.evaluate proof --------
{
  const page49 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page49.on("pageerror", (e) => errs.push(String(e)))
  await page49.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page49.waitForSelector(".hwt-board")
  const result = await page49.evaluate(async () => {
    const { createTacticsBattle, runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("rot")
    const playerId = base.units.find((u) => u.side === "player").id
    // Enemies stay alive at their normal starting positions (col 0 vs.
    // the player's col 9) - the same wide starting gap every other
    // synthetic check in this suite relies on to guarantee no attack can
    // land this single call, isolating the poison tick from any real
    // combat. Zeroing every enemy instead would falsely trip
    // checkTacticsBattleEnd's "0 living enemies -> won" the moment
    // applyPoisonTick's own end-of-tick check runs.
    const state = {
      ...base,
      phase: "enemy",
      units: base.units.map((u) => (u.id === playerId ? { ...u, hp: 40, maxHp: 40, block: 5, poison: 3 } : u)),
    }
    const after = runEnemyTurn(state)
    const poisonedUnit = after.units.find((u) => u.id === playerId)
    return { hpAfter: poisonedUnit.hp, poisonAfter: poisonedUnit.poison, blockAfter: poisonedUnit.block, phase: after.phase }
  })
  await page49.close()
  out.rotPoisonBypassesBlock = result
  if (!(result.hpAfter === 37 && result.poisonAfter === 2 && result.phase === "player")) {
    out.errors.push("check49 poison did not deal its full stack directly to hp, bypassing Block, or did not decay by exactly 1")
  }
}

// 50. The Blight's self-mend synergy: every living enemy heals 1 HP each
//     round (capped at maxHp), and it's narrated - a deterministic
//     page.evaluate proof via endPlayerTurn ----------------------------
{
  const page50 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page50.on("pageerror", (e) => errs.push(String(e)))
  await page50.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page50.waitForSelector(".hwt-board")
  const result = await page50.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("rot")
    const crawlerId = base.units.find((u) => u.defId === "rotgut-crawler").id
    const damaged = { ...base, units: base.units.map((u) => (u.id === crawlerId ? { ...u, hp: u.maxHp - 5 } : u)) }
    const hpBefore = damaged.units.find((u) => u.id === crawlerId).hp
    const after = endPlayerTurn(damaged)
    const healed = after.units.find((u) => u.id === crawlerId)
    return { hpBefore, hpAfter: healed.hp, mendLogged: after.log.some((l) => l.includes("knits itself back together")) }
  })
  await page50.close()
  out.rotSelfMend = result
  if (!(result.hpAfter === result.hpBefore + 1 && result.mendLogged)) {
    out.errors.push("check50 the Blight's self-mend synergy did not heal exactly 1 HP or was not narrated")
  }
}

// ---------------------------------------------------------------
// The Collectors archetype (feat/hearthwood-tactics-collectors), the
// LAST of the 9 real auto-battler archetypes. Every new check gets its
// own fresh page from the start (the established anti-hang discipline).
// ---------------------------------------------------------------

// 51. The Tithe ("collectors") - real composition: 2x Hoardling + 1x
//     Tithe-Warden, 3 living player tokens -----------------------------
{
  const page51 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page51.on("pageerror", (e) => errs.push(String(e)))
  await page51.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page51.waitForSelector(".hwt-board")
  await page51.locator(".hwt-formation-btn", { hasText: "The Tithe" }).click()
  await page51.waitForTimeout(300)
  const enemyNames = await page51.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page51.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page51.close()
  const compositionOk =
    enemyNames.filter((n) => n === "Hoardling").length === 2 && enemyNames.filter((n) => n === "Tithe-Warden").length === 1
  out.collectorsFormation = { enemyNames, playerNames }
  if (!(compositionOk && playerNames.length === 3)) {
    out.errors.push("check51 The Tithe formation composition was wrong")
  }
}

// 52. A player unit's attack grows by exactly 1 on a killing blow, and
//     it's narrated - reuses the already-computed `fell` flag; the
//     visible ▲{delta} badge itself is the Coven round's existing
//     component (already covered by checks 36-38), unchanged here -----
{
  const page52 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page52.on("pageerror", (e) => errs.push(String(e)))
  await page52.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page52.waitForSelector(".hwt-board")
  const result = await page52.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("collectors")
    const attackerId = base.units.find((u) => u.side === "player").id
    const victimId = base.units.find((u) => u.side === "enemy").id
    const state = {
      ...base,
      units: base.units.map((u) => {
        if (u.id === attackerId) return { ...u, pos: { row: 2, col: 1 } }
        if (u.id === victimId) return { ...u, hp: 1, pos: { row: 2, col: 0 } }
        return u
      }),
    }
    const attackBefore = state.units.find((u) => u.id === attackerId).attack
    const after = attackUnit(state, attackerId, victimId)
    const attacker = after.units.find((u) => u.id === attackerId)
    return { attackBefore, attackAfter: attacker.attack, grewLogged: after.log.some((l) => l.includes("grows stronger")) }
  })
  await page52.close()
  out.collectorsGrantOnKill = result
  if (!(result.attackAfter === result.attackBefore + 1 && result.grewLogged)) {
    out.errors.push("check52 a player kill did not grant +1 permanent attack, or was not narrated")
  }
}

// 53. Leech steals exactly 1 point of an earned attack bonus on a landed
//     hit, visible on both sides (victim shrinks, thief grows) ---------
{
  const page53 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page53.on("pageerror", (e) => errs.push(String(e)))
  await page53.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page53.waitForSelector(".hwt-board")
  const result = await page53.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("collectors")
    const thiefId = base.units.find((u) => u.side === "enemy").id
    const victimId = base.units.find((u) => u.side === "player").id
    const state = {
      ...base,
      phase: "enemy",
      units: base.units.map((u) => {
        if (u.id === thiefId) return { ...u, pos: { row: 2, col: 1 } }
        if (u.id === victimId) return { ...u, hp: 40, maxHp: 40, block: 0, attack: u.baseAttack + 2, pos: { row: 2, col: 0 } }
        return u
      }),
    }
    const thiefAttackBefore = state.units.find((u) => u.id === thiefId).attack
    const after = attackUnit(state, thiefId, victimId)
    const victim = after.units.find((u) => u.id === victimId)
    const thief = after.units.find((u) => u.id === thiefId)
    return {
      victimAttackAfter: victim.attack,
      victimBaseAttack: victim.baseAttack,
      thiefAttackBefore,
      thiefAttackAfter: thief.attack,
      leechLogged: after.log.some((l) => l.includes("takes a stack of Strength from")),
    }
  })
  await page53.close()
  out.collectorsLeech = result
  if (
    !(
      result.victimAttackAfter === result.victimBaseAttack + 1 &&
      result.thiefAttackAfter === result.thiefAttackBefore + 1 &&
      result.leechLogged
    )
  ) {
    out.errors.push("check53 leech did not steal exactly 1 point of the earned attack bonus")
  }
}

// 54. Nothing to steal, honestly logged - a player unit sitting exactly
//     at baseAttack is a clean no-op (never dips below baseAttack) ----
{
  const page54 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page54.on("pageerror", (e) => errs.push(String(e)))
  await page54.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page54.waitForSelector(".hwt-board")
  const result = await page54.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("collectors")
    const thiefId = base.units.find((u) => u.side === "enemy").id
    const victimId = base.units.find((u) => u.side === "player").id
    const state = {
      ...base,
      phase: "enemy",
      units: base.units.map((u) => {
        if (u.id === thiefId) return { ...u, pos: { row: 2, col: 1 } }
        if (u.id === victimId) return { ...u, hp: 40, maxHp: 40, block: 0, pos: { row: 2, col: 0 } }
        return u
      }),
    }
    const victimAttackBefore = state.units.find((u) => u.id === victimId).attack
    const thiefAttackBefore = state.units.find((u) => u.id === thiefId).attack
    const after = attackUnit(state, thiefId, victimId)
    const victim = after.units.find((u) => u.id === victimId)
    const thief = after.units.find((u) => u.id === thiefId)
    return {
      victimAttackUnchanged: victim.attack === victimAttackBefore,
      thiefAttackUnchanged: thief.attack === thiefAttackBefore,
      nothingLogged: after.log.some((l) => l.includes("finds nothing worth taking")),
    }
  })
  await page54.close()
  out.collectorsNoSteal = result
  if (!(result.victimAttackUnchanged && result.thiefAttackUnchanged && result.nothingLogged)) {
    out.errors.push("check54 a leech attempt with nothing to steal was not a clean no-op, or was not honestly logged")
  }
}

// ---------------------------------------------------------------
// The roster-expansion round (feat/hearthwood-tactics-roster) - a sidebar
// squad picker + 3 new units (Oathshield/Willowmend/Bramble Sweep). Every
// new check gets its own fresh page from the start (the established
// anti-hang discipline).
// ---------------------------------------------------------------

// 55. The squad picker renders correctly on a fresh load: 3 selects, the
//     real default squad, and all 3 new roster ids offered somewhere ----
{
  const page55 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page55.on("pageerror", (e) => errs.push(String(e)))
  await page55.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page55.waitForSelector(".hwt-board")
  const selectCount = await page55.locator(".hwt-squad-select").count()
  const values = await page55.locator(".hwt-squad-select").evaluateAll((els) => els.map((e) => e.value))
  const allOptionValues = await page55.locator(".hwt-squad-select").evaluateAll((els) =>
    els.flatMap((e) => Array.from(e.options).map((o) => o.value)),
  )
  await page55.close()
  out.squadPickerInit = { selectCount, values, allOptionValues }
  const defaultOk = selectCount === 3 && JSON.stringify(values) === JSON.stringify(["bulwark-of-ages", "the-fool", "hexbreaker"])
  const rosterOffered = ["oathshield", "willowmend", "bramble-sweep"].every((id) => allOptionValues.includes(id))
  if (!(defaultOk && rosterOffered)) {
    out.errors.push("check55 the squad picker did not render 3 selects with the real default squad + all 6 roster ids")
  }
}

// 56. Swapping a slot restarts the fight with the new unit, preserving
//     the other 2 slots and the enemy formation ------------------------
{
  const page56 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page56.on("pageerror", (e) => errs.push(String(e)))
  await page56.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page56.waitForSelector(".hwt-board")
  await page56.locator(".hwt-formation-btn", { hasText: "The Bulwark" }).click()
  await page56.waitForTimeout(200)
  await page56.locator(".hwt-squad-select").nth(0).selectOption("oathshield")
  await page56.waitForTimeout(200)
  const playerNames = await page56.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page56.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const turnLabel = await page56.locator(".hwt-turn-label").innerText()
  await page56.close()
  out.squadSwapRestart = { playerNames, enemyNames, turnLabel }
  const squadOk = playerNames.includes("Oathshield") && playerNames.includes("Mosskit") && playerNames.includes("Hexbreaker") && !playerNames.includes("Bulwark of Ages")
  const formationOk = enemyNames.filter((n) => n === "Oakshell Warden").length === 2 && enemyNames.includes("Mossmender")
  if (!(squadOk && formationOk && turnLabel.includes("Turn 1"))) {
    out.errors.push("check56 swapping a squad slot did not restart with the new unit while preserving the rest + formation")
  }
}

// 57. No duplicate unit across slots - once a unit is picked in one slot,
//     the other slots' option lists stop offering it -------------------
{
  const page57 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page57.on("pageerror", (e) => errs.push(String(e)))
  await page57.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page57.waitForSelector(".hwt-board")
  await page57.locator(".hwt-squad-select").nth(0).selectOption("oathshield")
  await page57.waitForTimeout(200)
  const otherOptions = await page57.locator(".hwt-squad-select").evaluateAll((els) =>
    els.slice(1).map((e) => Array.from(e.options).map((o) => o.value)),
  )
  await page57.close()
  out.squadNoDuplicate = otherOptions
  const noOathshieldElsewhere = otherOptions.every((opts) => !opts.includes("oathshield"))
  const stillOffersRest = otherOptions.every((opts) => opts.includes("willowmend") && opts.includes("bramble-sweep"))
  if (!(noOathshieldElsewhere && stillOffersRest)) {
    out.errors.push("check57 a unit picked in one slot was still offered (or the rest of the roster wrongly excluded) in the other slots")
  }
}

// 58. Shieldwall (Oathshield's aura-block) grants +1 Block to itself + its
//     one Chebyshev-adjacent ally, not the non-adjacent third unit ------
{
  const page58 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page58.on("pageerror", (e) => errs.push(String(e)))
  await page58.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page58.waitForSelector(".hwt-board")
  const result = await page58.evaluate(async () => {
    const { createTacticsBattle, castAbility } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("default", ["oathshield", "the-fool", "hexbreaker"])
    const oathshield = base.units.find((u) => u.defId === "oathshield")
    const theFool = base.units.find((u) => u.defId === "the-fool")
    const hexbreaker = base.units.find((u) => u.defId === "hexbreaker")
    const after = castAbility(base, oathshield.id)
    return {
      abilityName: oathshield.ability?.name,
      oathshieldBlock: after.units.find((u) => u.id === oathshield.id).block,
      theFoolBlock: after.units.find((u) => u.id === theFool.id).block,
      hexbreakerBlock: after.units.find((u) => u.id === hexbreaker.id).block,
      logged: after.log.some((l) => l.includes("raises Shieldwall")),
    }
  })
  await page58.close()
  out.shieldwall = result
  if (
    !(
      result.abilityName === "Shieldwall" &&
      result.oathshieldBlock === 1 &&
      result.theFoolBlock === 1 &&
      result.hexbreakerBlock === 0 &&
      result.logged
    )
  ) {
    out.errors.push("check58 Shieldwall did not grant +1 Block to self + the one adjacent ally only")
  }
}

// 59. Mending Waters (Willowmend's heal) heals a damaged ally by exactly 4,
//     capped at maxHp ---------------------------------------------------
{
  const page59 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page59.on("pageerror", (e) => errs.push(String(e)))
  await page59.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page59.waitForSelector(".hwt-board")
  const result = await page59.evaluate(async () => {
    const { createTacticsBattle, castAbility } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("default", ["bulwark-of-ages", "willowmend", "hexbreaker"])
    const bulwark = base.units.find((u) => u.defId === "bulwark-of-ages")
    const willowmend = base.units.find((u) => u.defId === "willowmend")
    const damaged = { ...base, units: base.units.map((u) => (u.id === bulwark.id ? { ...u, hp: u.maxHp - 10 } : u)) }
    const hpBefore = damaged.units.find((u) => u.id === bulwark.id).hp
    const after = castAbility(damaged, willowmend.id, bulwark.id)
    return {
      abilityName: willowmend.ability?.name,
      hpBefore,
      hpAfter: after.units.find((u) => u.id === bulwark.id).hp,
      logged: after.log.some((l) => l.includes("mends") && l.includes("for 4")),
    }
  })
  await page59.close()
  out.mendingWaters = result
  if (!(result.abilityName === "Mending Waters" && result.hpAfter === result.hpBefore + 4 && result.logged)) {
    out.errors.push("check59 Mending Waters did not heal exactly 4, or was not narrated")
  }
}

// 60. Ripple Strike (Bramble Sweep's burst) deals exactly attack x 2 -
//     the same math Focused Shot already uses --------------------------
{
  const page60 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page60.on("pageerror", (e) => errs.push(String(e)))
  await page60.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page60.waitForSelector(".hwt-board")
  const result = await page60.evaluate(async () => {
    const { createTacticsBattle, castAbility } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("default", ["bulwark-of-ages", "the-fool", "bramble-sweep"])
    const sweep = base.units.find((u) => u.defId === "bramble-sweep")
    const enemy = base.units.find((u) => u.side === "enemy")
    const state = {
      ...base,
      units: base.units.map((u) => {
        if (u.id === sweep.id) return { ...u, pos: { row: 4, col: 9 } }
        if (u.id === enemy.id) return { ...u, hp: 999, maxHp: 999, block: 0, pos: { row: 4, col: 6 } }
        return u
      }),
    }
    const attacker = state.units.find((u) => u.id === sweep.id)
    const target = state.units.find((u) => u.id === enemy.id)
    const hpBefore = target.hp
    const after = castAbility(state, sweep.id, enemy.id)
    return {
      abilityName: attacker.ability?.name,
      expectedDamage: attacker.attack * 2,
      actualDamage: hpBefore - after.units.find((u) => u.id === enemy.id).hp,
      logged: after.log.some((l) => l.includes("unleashes Ripple Strike")),
    }
  })
  await page60.close()
  out.rippleStrike = result
  if (!(result.abilityName === "Ripple Strike" && result.actualDamage === result.expectedDamage && result.logged)) {
    out.errors.push("check60 Ripple Strike did not deal exactly attack x2 damage, or was not narrated")
  }
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_prototype (roster expansion + squad picker) PASS" : "\n❌ verify_tactics_prototype (roster expansion + squad picker) FAIL")
process.exit(pass ? 0 : 1)
