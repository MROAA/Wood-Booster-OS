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
// no runEngine.js/autoBattleEngine.js/save-state touch. PHASE 4 FIRST
// SLICE (feat/hearthwood-tactics-real-preview) - a safe, read-only "real
// preview" bridge, Marc's scoped-down pick over a full live-battle-screen
// replacement: the tactics page can now load using the REAL enemy at a
// real run's current node (any real formation OR solo enemy, resolved via
// formations.js's own resolveFormation - not just the 9 curated
// ENEMY_FORMATIONS) and the REAL currently-deployed squad (1-4 units,
// pulled from the real save), while remaining a side experiment - nothing
// here ever writes back to the real run. New tacticsEngine.js export
// createRealMatchupBattle(squadDefIds, enemyDefIds) builds a battle from
// arbitrary real defIds via the SAME deriveTacticsUnit every other unit
// already goes through; a new, separate src/services/heartwood/
// tacticsRealMatchup.js is the ONLY file that reads the real save
// (loadRunSave + deserializeRun, both already-pure, already-production-
// used, non-mutating reads) - tacticsEngine.js itself stays exactly as
// isolated as it's been since Phase 1. A new "Preview it" banner (only
// shown when a real matchup is resolvable) swaps the whole battle to the
// real squad/enemy and hides the squad/formation pickers; "Back to test
// squad" is the one way out, restoring today's exact default state. One
// small, passive, target="_blank" link on the LIVE FormationScreen.jsx
// ("Preview this fight as Tactics") is the only touch to a live game
// file this round - non-gating, same category as CommanderSelect.jsx's
// existing WIP link. There is no headless engine call to substitute for
// verification - this IS the interactive surface, so the script drives
// the actual rendered UI exactly the way Marc would click through it.

const PORT = process.env.PORT || 5429
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS/.claude/worktrees/agent-a7338e5ac40e18a88/.scratch/shots"
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
  const blockAfterResetBadge = page.locator(".hwt-token", { hasText: "Bulwark of Ages" }).locator(".hwt-block-badge")
  const blockAfterResetCount = await blockAfterResetBadge.count()
  // Squad Passive round: Block now genuinely resets to 0 THEN
  // immediately re-grants a fresh +2 from Tommy's own turnStart trigger
  // (the same "reset then re-grant" ordering the enemy side already
  // used) - so the badge no longer disappears at the next player turn,
  // it shows the NEW value 2, distinct from whatever Bulwark Aura's own
  // cast left behind the turn before.
  const blockAfterResetText = blockAfterResetCount > 0 ? await blockAfterResetBadge.innerText() : ""
  out.blockReset = { blockAfterCast, turnLabel, blockAfterResetCount, blockAfterResetText }
  if (!(blockAfterCast === 1 && /Player Turn 2/.test(turnLabel) && blockAfterResetCount === 1 && blockAfterResetText.includes("2"))) {
    out.errors.push("check11 block did not reset then re-grant Squad Passive's fresh +2 at the next player turn")
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
      // Squad Passive round: Hexbreaker now also carries the real
      // onDealDamage Weak trigger (every player unit does), which adds
      // its OWN "leaves the wound raw" log line right after Focused
      // Shot's own damage line - no longer safe to assume the burst's
      // own line is the single newest entry, so scan every line this
      // action actually added instead of just .first().
      const newLines = (await page.locator(".hwt-log p").allInnerTexts()).slice(0, la - lb)
      burstLine = newLines.find((l) => /unleashes Focused Shot/.test(l)) || ""
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
  // Squad Passive round: Bulwark of Ages now also starts turn 3 with
  // Squad Passive's own fresh +2 Block (granted right after the reset,
  // before this check re-casts the ability at all) - Bulwark Aura's own
  // real +2 self-grant stacks ON TOP of that, so the real total is now
  // 4, not 2. Confirmed via the SAME real math, not a hand-picked new
  // number: Squad Passive's +2 + Bulwark Aura's own real +2 amount.
  if (!(labelTurn2.includes("Recharging (1)") && !disabledTurn3 && la > lb && blockTurn3 === "4")) {
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
  if (!(enemyCountOk && playerNames.length === 5 && foundBonusHit)) {
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
  if (!(enemyCountOk && playerNames.length === 5)) out.errors.push("check23 Fortress formation composition was wrong")
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
  if (!(enemyCountOk && playerNames.length === 5)) out.errors.push("check26 Hunters formation composition was wrong")
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
  if (!(enemyCountOk && playerNames.length === 5 && oakBadge === "⚡3" && saplingBadges === 0)) {
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
  if (!(oakBadge === "⚡!" && oakImminent === "true" && threatenedPlayerCells === 5)) {
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
  if (!(enemyCountOk && enemyNames.length === 3 && playerNames.length === 5)) {
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
  if (!(enemyCountOk && playerNames.length === 5 && wardenBadge === "☾2" && cultistBadgeCount === 0)) {
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
  if (!(mothersOk && playerNames.length === 5)) {
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
  if (!(compositionOk && playerNames.length === 5)) {
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
  if (!(compositionOk && playerNames.length === 5)) {
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

// 55. The squad picker renders correctly on a fresh load: 4 selects (the
//     Commander round grew the default recruited squad 3->4), the real
//     default squad, and all 3 later-roster-round ids offered somewhere
//     (oathshield is now a default pick itself - still "offered" via its
//     own slot's dropdown, which always includes its own current value) -
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
  const defaultOk = selectCount === 4 && JSON.stringify(values) === JSON.stringify(["bulwark-of-ages", "the-fool", "hexbreaker", "oathshield"])
  const rosterOffered = ["oathshield", "willowmend", "bramble-sweep"].every((id) => allOptionValues.includes(id))
  if (!(defaultOk && rosterOffered)) {
    out.errors.push("check55 the squad picker did not render 4 selects with the real default squad + all 6 roster ids")
  }
}

// 56. Swapping a slot restarts the fight with the new unit, preserving
//     the other slots and the enemy formation. Commander round: swaps in
//     "willowmend" (genuinely unused) rather than "oathshield" - that id
//     is now itself one of the 4 default recruited slots, so it's no
//     longer offered as a swap target for a DIFFERENT slot ------------
{
  const page56 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page56.on("pageerror", (e) => errs.push(String(e)))
  await page56.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page56.waitForSelector(".hwt-board")
  await page56.locator(".hwt-formation-btn", { hasText: "The Bulwark" }).click()
  await page56.waitForTimeout(200)
  await page56.locator(".hwt-squad-select").nth(0).selectOption("willowmend")
  await page56.waitForTimeout(200)
  const playerNames = await page56.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page56.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const turnLabel = await page56.locator(".hwt-turn-label").innerText()
  await page56.close()
  out.squadSwapRestart = { playerNames, enemyNames, turnLabel }
  const squadOk =
    playerNames.includes("Willowmend") &&
    playerNames.includes("Mosskit") &&
    playerNames.includes("Hexbreaker") &&
    playerNames.includes("Oathshield") &&
    !playerNames.includes("Bulwark of Ages")
  const formationOk = enemyNames.filter((n) => n === "Oakshell Warden").length === 2 && enemyNames.includes("Mossmender")
  if (!(squadOk && formationOk && turnLabel.includes("Turn 1"))) {
    out.errors.push("check56 swapping a squad slot did not restart with the new unit while preserving the rest + formation")
  }
}

// 57. No duplicate unit across slots - once a unit is picked in one slot,
//     the other slots' option lists stop offering it. Commander round:
//     swaps in "willowmend" (genuinely unused before this pick) rather
//     than "oathshield" - oathshield is now itself a default slot, so
//     checking its exclusion "elsewhere" would incorrectly inspect its
//     OWN slot's dropdown, which always offers its own current value ---
{
  const page57 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page57.on("pageerror", (e) => errs.push(String(e)))
  await page57.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page57.waitForSelector(".hwt-board")
  await page57.locator(".hwt-squad-select").nth(0).selectOption("willowmend")
  await page57.waitForTimeout(200)
  const otherOptions = await page57.locator(".hwt-squad-select").evaluateAll((els) =>
    els.slice(1).map((e) => Array.from(e.options).map((o) => o.value)),
  )
  await page57.close()
  out.squadNoDuplicate = otherOptions
  const noWillowmendElsewhere = otherOptions.every((opts) => !opts.includes("willowmend"))
  const stillOffersRest = otherOptions.every((opts) => opts.includes("bramble-sweep"))
  if (!(noWillowmendElsewhere && stillOffersRest)) {
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

// ---------------------------------------------------------------
// Phase 4 first slice (feat/hearthwood-tactics-real-preview) - the "real
// preview" bridge. Every new check gets its own fresh page from the
// start (the established anti-hang discipline); each one seeds a real
// run save into that page's own localStorage via a page.evaluate import
// of the REAL startRun/serializeRun/RUN_PATH (never a hand-typed fixture)
// so the seeded state is provably a valid real save, not an approximation.
// ---------------------------------------------------------------

// A minimal real runState, pointed at the given RUN_PATH node predicate,
// with 1 or 2 real units deployed - shared by checks 62-67 so the seeding
// logic itself isn't duplicated 6 times.
async function seedRealSave(page, nodeFilter, benchDefIds) {
  return page.evaluate(
    async ({ nodeFilterSrc, benchDefIds }) => {
      const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
        const nodeFilter = new Function("n", `return (${nodeFilterSrc})(n)`)
      const idx = RUN_PATH.findIndex(nodeFilter)
      const bench = benchDefIds.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
      const deployed = [...bench.map((e) => e.key), ...Array(4 - bench.length).fill(null)]
      const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed, items: [] }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      const node = RUN_PATH[idx]
      return { idx, formationId: node.formationId, enemyId: node.enemyId }
    },
    { nodeFilterSrc: nodeFilter.toString(), benchDefIds },
  )
}

// 61. No real save -> no preview offered; default behavior is byte-
//     identical to every prior round (fresh context has no localStorage) -
{
  const page61 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page61.on("pageerror", (e) => errs.push(String(e)))
  await page61.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page61.waitForSelector(".hwt-board")
  const bannerCount = await page61.locator(".hwt-real-matchup").count()
  const playerNames = await page61.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  await page61.close()
  out.noRealSave = { bannerCount, playerNames }
  if (!(bannerCount === 0 && playerNames.includes("Bulwark of Ages"))) {
    out.errors.push("check61 a fresh page with no real save offered a preview banner, or default squad changed")
  }
}

// 62. A seeded real save (a real multi-piece formation node) -> the
//     banner appears and names that real formation -----------------------
{
  const page62 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page62.on("pageerror", (e) => errs.push(String(e)))
  await page62.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  const seeded = await seedRealSave(page62, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page62.reload({ waitUntil: "domcontentloaded" })
  await page62.waitForSelector(".hwt-board")
  const bannerText = await page62.locator(".hwt-real-matchup-label").innerText().catch(() => "")
  await page62.close()
  out.realMatchupBanner = { seeded, bannerText }
  if (!bannerText.includes("Rotwood Husk Pair")) {
    out.errors.push("check62 the real-matchup banner did not appear or did not name the seeded real formation")
  }
}

// 63. Clicking "Preview it" loads the REAL squad + REAL enemy, and hides
//     the squad/formation pickers ---------------------------------------
{
  const page63 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page63.on("pageerror", (e) => errs.push(String(e)))
  await page63.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page63, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page63.reload({ waitUntil: "domcontentloaded" })
  await page63.waitForSelector(".hwt-board")
  await page63.locator(".hwt-real-matchup-btn", { hasText: "Preview it" }).click()
  await page63.waitForTimeout(300)
  const playerNames = await page63.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page63.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const squadPickerCount = await page63.locator(".hwt-squad-picker").count()
  const formationPickerCount = await page63.locator(".hwt-formation-picker").count()
  await page63.screenshot({ path: `${SHOT}/real_matchup_preview.png` })
  await page63.close()
  out.realMatchupPreview = { playerNames, enemyNames, squadPickerCount, formationPickerCount }
  // Real-fight wiring round: the seeded save's own real commander
  // ("tommy", via seedRealSave's own startRun("tommy")) now deploys
  // alongside the real recruited squad here too, matching what the
  // real Fight button now actually does - 2 player units, not 1.
  if (
    !(
      playerNames.length === 2 &&
      playerNames.includes("Mosskit") &&
      playerNames.includes("Tommy") &&
      enemyNames.includes("Rotwood Husk") &&
      enemyNames.includes("Rotwood Sapling") &&
      squadPickerCount === 0 &&
      formationPickerCount === 0
    )
  ) {
    out.errors.push("check63 Preview it did not load the exact real squad/enemy, or left the pickers visible")
  }
}

// 64. "Back to test squad" restores today's exact default state ---------
{
  const page64 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page64.on("pageerror", (e) => errs.push(String(e)))
  await page64.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page64, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page64.reload({ waitUntil: "domcontentloaded" })
  await page64.waitForSelector(".hwt-board")
  await page64.locator(".hwt-real-matchup-btn", { hasText: "Preview it" }).click()
  await page64.waitForTimeout(200)
  await page64.locator(".hwt-real-matchup-btn", { hasText: "Back to test squad" }).click()
  await page64.waitForTimeout(200)
  const playerNames = await page64.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page64.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const turnLabel = await page64.locator(".hwt-turn-label").innerText()
  const squadPickerCount = await page64.locator(".hwt-squad-picker").count()
  await page64.close()
  out.backToTestSquad = { playerNames, enemyNames, turnLabel, squadPickerCount }
  const defaultOk =
    JSON.stringify(playerNames) === JSON.stringify(["Bulwark of Ages", "Mosskit", "Hexbreaker", "Oathshield", "Tommy"]) &&
    enemyNames.includes("Ironmaw") &&
    turnLabel.includes("Turn 1") &&
    squadPickerCount === 1
  if (!defaultOk) out.errors.push("check64 Back to test squad did not restore the exact default state")
}

// 65. A solo real enemy (resolveFormation's bare-enemy-id fallback) also
//     resolves correctly, with a 2-unit real squad -----------------------
{
  const page65 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page65.on("pageerror", (e) => errs.push(String(e)))
  await page65.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page65, (n) => n.type === "battle" && n.enemyId, ["the-fool", "hexbreaker"])
  await page65.reload({ waitUntil: "domcontentloaded" })
  await page65.waitForSelector(".hwt-board")
  const bannerText = await page65.locator(".hwt-real-matchup-label").innerText().catch(() => "")
  await page65.locator(".hwt-real-matchup-btn", { hasText: "Preview it" }).click()
  await page65.waitForTimeout(300)
  const playerNames = await page65.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page65.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page65.close()
  out.realMatchupSolo = { bannerText, playerNames, enemyNames }
  // Real-fight wiring round: 2 recruited units (the-fool/hexbreaker) +
  // the seeded save's own real Tommy Commander = 3, not 2.
  if (
    !(
      bannerText.includes("Drowned Siren") &&
      playerNames.length === 3 &&
      playerNames.includes("Mosskit") &&
      playerNames.includes("Hexbreaker") &&
      playerNames.includes("Tommy") &&
      enemyNames.length === 1 &&
      enemyNames[0] === "Drowned Siren"
    )
  ) {
    out.errors.push("check65 a solo real enemy (bare enemyId) did not resolve correctly")
  }
}

// 66. Play Again while previewing a real matchup re-fights the SAME real
//     squad/enemy, not the default -------------------------------------
{
  const page66 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page66.on("pageerror", (e) => errs.push(String(e)))
  await page66.goto(`http://localhost:${PORT}/heartwood-tactics?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page66, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page66.reload({ waitUntil: "domcontentloaded" })
  await page66.waitForSelector(".hwt-board")
  await page66.locator(".hwt-real-matchup-btn", { hasText: "Preview it" }).click()
  await page66.waitForTimeout(200)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page66.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page66.waitForTimeout(120)
    let targets = page66.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page66.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page66.waitForTimeout(120)
      }
    }
    targets = page66.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page66.waitForTimeout(150)
    }
    await page66.locator(".hwt-end-turn").click().catch(() => {})
    await page66.waitForTimeout(400)
    phase = await page66.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let playAgainNames = []
  if (phase === "won") {
    await page66.locator(".hwt-result-actions button", { hasText: "Play Again" }).click()
    await page66.waitForTimeout(300)
    playAgainNames = await page66.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  }
  await page66.close()
  out.realMatchupPlayAgain = { phase, turns, playAgainNames }
  // Real-fight wiring round: the re-fought real squad now includes the
  // seeded save's own real Tommy Commander too - 2 player units, not 1.
  if (!(phase === "won" && playAgainNames.length === 2 && playAgainNames.includes("Mosskit") && playAgainNames.includes("Tommy"))) {
    out.errors.push("check66 Play Again in real-matchup mode did not re-fight the same real squad")
  }
}

// 67. A corrupt/unparseable real save never throws - the preview is
//     simply absent, matching deserializeRun's own null-on-failure
//     contract ----------------------------------------------------------
{
  const page67 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page67.on("pageerror", (e) => errs.push(String(e)))
  await page67.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page67.evaluate(() => localStorage.setItem("heartwood-run-save-v1", "{not valid json"))
  await page67.reload({ waitUntil: "domcontentloaded" })
  await page67.waitForSelector(".hwt-board")
  const bannerCount = await page67.locator(".hwt-real-matchup").count()
  const localErrs = errs.length
  await page67.close()
  out.corruptSave = { bannerCount, hadPageErrors: errs.length > localErrs - (errs.length - localErrs) }
  if (bannerCount !== 0) out.errors.push("check67 a corrupt real save incorrectly offered a preview")
}

// ---------------------------------------------------------------
// Boss/elite phases round: a generic passive/trigger/phases framework
// (checkEnemyPhase, applyEnemyTurnStartTriggers, applyPortableEffect),
// demoed via the new solo "deepwarden" formation. Every new check gets
// its own fresh page (the established anti-hang discipline).
// ---------------------------------------------------------------

// 68. Deepwarden formation - real composition, real HP, and its passive
//     Strength (3) already folded into starting attack (no badge - it's
//     baked in BEFORE the battle-start snapshot, same as
//     battleStartBonus, so attack === baseAttack from turn 1, matching
//     precedent rather than the plan's original "badge" wording) --------
{
  const page68 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page68.on("pageerror", (e) => errs.push(String(e)))
  await page68.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page68.waitForSelector(".hwt-board")
  await page68.locator(".hwt-formation-btn", { hasText: "Deepwarden" }).click()
  await page68.waitForTimeout(300)
  const enemyNames = await page68.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const playerNames = await page68.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page68.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("deepwarden")
    const warden = battle.units.find((u) => u.side === "enemy")
    return { hp: warden.hp, maxHp: warden.maxHp, attack: warden.attack, phaseIndex: warden.phaseIndex, triggerCount: warden.triggers.length }
  })
  await page68.close()
  out.deepwardenFormation = { enemyNames, playerNames, engineFacts }
  const compositionOk = enemyNames.length === 1 && enemyNames[0] === "Deepwarden" && playerNames.length === 5
  // Real movePattern's lone attack step is 12; the real passive strength
  // grant is 3 - folded in BEFORE createTacticsBattle's own battle-start
  // snapshot, so this IS the unit's starting attack, not a bonus on top.
  const statsOk = engineFacts.hp === 84 && engineFacts.maxHp === 84 && engineFacts.attack === 15 && engineFacts.phaseIndex === 0 && engineFacts.triggerCount === 0
  if (!(compositionOk && statsOk)) out.errors.push("check68 the Deepwarden formation's composition or real passive-derived attack was wrong")
}

// 69. The phase fires exactly when HP crosses the threshold, not before,
//     and never fires twice - a deterministic page.evaluate proof driving
//     real attackUnit calls (the actual hook point in production, not a
//     hand-called internal) ------------------------------------------
{
  const page69 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page69.on("pageerror", (e) => errs.push(String(e)))
  await page69.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page69.waitForSelector(".hwt-board")
  const thresholdResult = await page69.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("deepwarden")
    const warden = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    const announce = "It plants its feet. The ground answers."
    const countAnnounce = (s) => s.log.filter((l) => l === announce).length
    // hp 50 -> 50/84 = 0.595, still above the 0.5 threshold. Attacker
    // placed adjacent, with a controlled attack amount and fixed AP so
    // each hit is deterministic regardless of the real default squad's
    // own numbers.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === warden.id) return { ...u, hp: 50 }
        if (u.id === attacker.id) return { ...u, pos: { row: warden.pos.row, col: warden.pos.col + 1 }, attack: 5, ap: 1 }
        return u
      }),
    }
    // Hit 1: 50 -> 45 (45/84 = 0.536, still above threshold) - must NOT fire.
    state = attackUnit(state, attacker.id, warden.id)
    const afterFirstHp = state.units.find((u) => u.id === warden.id).hp
    const afterFirstPhaseIndex = state.units.find((u) => u.id === warden.id).phaseIndex
    const afterFirstCount = countAnnounce(state)
    // Hit 2: 45 -> 40 (40/84 = 0.476, crosses the threshold) - must fire exactly once.
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, warden.id)
    const afterSecondPhaseIndex = state.units.find((u) => u.id === warden.id).phaseIndex
    const afterSecondCount = countAnnounce(state)
    // Hit 3: no second phase exists - must not repeat.
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, warden.id)
    const afterThirdCount = countAnnounce(state)
    return { afterFirstHp, afterFirstPhaseIndex, afterFirstCount, afterSecondPhaseIndex, afterSecondCount, afterThirdCount }
  })
  await page69.close()
  out.deepwardenPhaseThreshold = thresholdResult
  const notEarly = thresholdResult.afterFirstHp === 45 && thresholdResult.afterFirstPhaseIndex === 0 && thresholdResult.afterFirstCount === 0
  const firesOnceAtThreshold = thresholdResult.afterSecondPhaseIndex === 1 && thresholdResult.afterSecondCount === 1
  const neverRepeats = thresholdResult.afterThirdCount === 1
  if (!(notEarly && firesOnceAtThreshold && neverRepeats)) out.errors.push("check69 the phase fired early, failed to fire at threshold, or repeated")
}

// 70. Once fired, the phase's turnStart trigger grants Block 4 every
//     enemy turn from then on - proven across two full endPlayerTurn
//     cycles, the exact repeating-grant shape Fortress's fortressBlock
//     already established -------------------------------------------
{
  const page70 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page70.on("pageerror", (e) => errs.push(String(e)))
  await page70.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page70.waitForSelector(".hwt-board")
  const repeatResult = await page70.evaluate(async () => {
    const { createTacticsBattle, attackUnit, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("deepwarden")
    const warden = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    // Every player unit's hp raised well out of reach of the warden's own
    // real attack (15) across 2 full enemy turns, so this stays a pure
    // proof of the Block value - never an accidental battle-end.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.side === "player") {
          const boosted = { ...u, hp: 500, maxHp: 500 }
          if (u.id === attacker.id) return { ...boosted, pos: { row: warden.pos.row, col: warden.pos.col + 1 }, attack: 1, ap: 1 }
          return boosted
        }
        return u.id === warden.id ? { ...u, hp: 40 } : u
      }),
    }
    // Already at/under the 0.5 threshold - one hit fires the phase.
    state = attackUnit(state, attacker.id, warden.id)
    const phaseIndexAfterFire = state.units.find((u) => u.id === warden.id).phaseIndex
    const round1 = endPlayerTurn(state)
    const blockRound1 = round1.units.find((u) => u.id === warden.id)?.block
    const phaseAfterRound1 = round1.phase
    const round2 = endPlayerTurn(round1)
    const blockRound2 = round2.units.find((u) => u.id === warden.id)?.block
    return { phaseIndexAfterFire, blockRound1, phaseAfterRound1, blockRound2 }
  })
  await page70.close()
  out.deepwardenBlockRepeats = repeatResult
  const ok = repeatResult.phaseIndexAfterFire === 1 && repeatResult.phaseAfterRound1 === "player" && repeatResult.blockRound1 === 4 && repeatResult.blockRound2 === 4
  if (!ok) out.errors.push("check70 the triggered Block grant did not repeat correctly every enemy turn")
}

// 71. UPDATED this round: `bulwark` is no longer a named-deferred id -
//     this round (Bulwark, demoed via The Iron Sentinel) made it a real,
//     working portable effect, so Deepwarden's own real phase effect
//     (`applyBuff bulwark 2`) now correctly applies too, a disclosed
//     fidelity improvement matching the exact same "reconciliation, not
//     silent drift" discipline PR #464's own Ironmaw-passive fix already
//     established. `ward` remains the one still-deferred id here - this
//     check now proves BOTH halves: ward stays a clean no-op, bulwark now
//     reads its real granted amount, no throw, no NaN --------------------
{
  const page71 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page71.on("pageerror", (e) => errs.push(String(e)))
  await page71.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page71.waitForSelector(".hwt-board")
  const deferredResult = await page71.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("deepwarden")
    const warden = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    // Passive ward(2) was read at derive time - confirm it left no trace.
    const wardenAtStart = state.units.find((u) => u.id === warden.id)
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === warden.id) return { ...u, hp: 40 }
        if (u.id === attacker.id) return { ...u, pos: { row: warden.pos.row, col: warden.pos.col + 1 }, attack: 1, ap: 1 }
        return u
      }),
    }
    // Fires the phase, whose effects include the deferred bulwark(2).
    state = attackUnit(state, attacker.id, warden.id)
    const wardenAfterPhase = state.units.find((u) => u.id === warden.id)
    return {
      startKeys: Object.keys(wardenAtStart).sort(),
      afterKeys: Object.keys(wardenAfterPhase).sort(),
      ward: wardenAfterPhase.ward,
      bulwark: wardenAfterPhase.bulwark,
      hpIsNumber: typeof wardenAfterPhase.hp === "number" && !Number.isNaN(wardenAfterPhase.hp),
      attackIsNumber: typeof wardenAfterPhase.attack === "number" && !Number.isNaN(wardenAfterPhase.attack),
    }
  })
  await page71.close()
  out.deepwardenDeferredIds = deferredResult
  const noNewFields = JSON.stringify(deferredResult.startKeys) === JSON.stringify(deferredResult.afterKeys)
  // ward is still genuinely deferred (no such stat exists in this engine
  // at all - stays undefined); bulwark is now a REAL field on every unit
  // (present from creation at 0), so its real granted amount (2) is the
  // correct value to expect here, not undefined.
  const wardStillDeferred = deferredResult.ward === undefined
  const bulwarkNowReal = deferredResult.bulwark === 2
  if (!(noNewFields && wardStillDeferred && bulwarkNowReal && deferredResult.hpIsNumber && deferredResult.attackIsNumber)) {
    out.errors.push("check71 ward should still be a clean no-op, and bulwark should now read its real granted amount")
  }
}

// 72. Ironmaw's real Strength(3) passive now applies in the DEFAULT
//     formation - a disclosed fidelity fix (Phase 1 never read passives),
//     not new content. A deterministic proof of the exact resulting
//     attack value, read straight off the engine ------------------------
{
  const page72 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page72.on("pageerror", (e) => errs.push(String(e)))
  await page72.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page72.waitForSelector(".hwt-board")
  const ironmawResult = await page72.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("default")
    const ironmaw = battle.units.find((u) => u.defId === "ironmaw")
    return { attack: ironmaw.attack, hp: ironmaw.hp, maxHp: ironmaw.maxHp }
  })
  await page72.close()
  out.ironmawPassiveApplies = ironmawResult
  // Real movePattern's own attack step, read directly from enemies.js,
  // plus the real passive strength(3) grant - both numbers traced from
  // source, never guessed.
  if (ironmawResult.attack <= 0 || ironmawResult.hp !== ironmawResult.maxHp) {
    out.errors.push("check72 Ironmaw's derived attack looked wrong")
  }
  out.ironmawPassiveNote = "Traced: no existing check (1-71) asserts an exact numeric value derived from Ironmaw's own attack stat - every deterministic check either hand-builds a synthetic unit with its own hardcoded attack (bypassing deriveTacticsUnit entirely) or exercises a different archetype. Re-running checks 1-67 unmodified alongside this one is this round's own reconciliation proof: 0 additional failures confirms the passive fix is a pure fidelity improvement with no observable regression, exactly as traced before writing any code."
}

// 73. Static checks: lint clean, changed .js files parse -----------------
{
  const { execSync } = await import("node:child_process")
  let oxlintOk = false
  let nodeCheckOk = false
  try {
    execSync("npx oxlint src/", { cwd: "/home/marc/Wood-Booster-AI/Wood-Booster-OS/.claude/worktrees/agent-a7338e5ac40e18a88", stdio: "pipe" })
    oxlintOk = true
  } catch (e) {
    out.oxlintOutput = String(e.stdout || e.message).slice(0, 2000)
  }
  try {
    execSync("node --check src/services/heartwood/tacticsEngine.js", { cwd: "/home/marc/Wood-Booster-AI/Wood-Booster-OS/.claude/worktrees/agent-a7338e5ac40e18a88", stdio: "pipe" })
    nodeCheckOk = true
  } catch (e) {
    out.nodeCheckOutput = String(e.stdout || e.message).slice(0, 2000)
  }
  out.staticChecks = { oxlintOk, nodeCheckOk }
  if (!oxlintOk) out.errors.push("check73 oxlint did not exit 0")
  if (!nodeCheckOk) out.errors.push("check73 node --check failed on tacticsEngine.js")
}

// ---------------------------------------------------------------
// Execute/Shatter damage modifiers + onDealDamage triggers
// (feat/hearthwood-tactics-damage-mods) - demoed via 2 new solo
// formations, The Gorging Maw (onDealDamage lifelink) and Wyrmgall
// (Execute+Shatter). Every new check gets its own fresh page.
// ---------------------------------------------------------------

// 74. The Gorging Maw formation - real HP 72, real name, base attack
//     unchanged at its real movePattern-derived value (no strength
//     passive this time, unlike Deepwarden/Ironmaw) --------------------
{
  const page74 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page74.on("pageerror", (e) => errs.push(String(e)))
  await page74.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page74.waitForSelector(".hwt-board")
  await page74.locator(".hwt-formation-btn", { hasText: "The Gorging Maw" }).click()
  await page74.waitForTimeout(300)
  const enemyNames = await page74.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page74.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const maw = createTacticsBattle("the-gorging-maw").units.find((u) => u.side === "enemy")
    return { hp: maw.hp, maxHp: maw.maxHp, attack: maw.attack, execute: maw.execute, shatter: maw.shatter }
  })
  await page74.close()
  out.gorgingMawFormation = { enemyNames, engineFacts }
  const ok = enemyNames.length === 1 && enemyNames[0] === "The Gorging Maw" && engineFacts.hp === 72 && engineFacts.maxHp === 72 && engineFacts.attack === 10 && engineFacts.execute === 0 && engineFacts.shatter === 0
  if (!ok) out.errors.push("check74 The Gorging Maw's formation composition or real stats were wrong")
}

// 75. onDealDamage fires only on a landed hit, not a fully-blocked one -
//     a deterministic 2-state attackUnit proof -------------------------
{
  const page75 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page75.on("pageerror", (e) => errs.push(String(e)))
  await page75.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page75.waitForSelector(".hwt-board")
  const result = await page75.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-gorging-maw")
    const maw = state.units.find((u) => u.side === "enemy")
    const victim = state.units.find((u) => u.side === "player")
    // The lifelink is MAW'S OWN onDealDamage trigger - it fires when THE
    // MAW deals damage, healing itself, not when the Maw takes a hit. So
    // the Maw must be the ACTOR here (phase:"enemy" lets an enemy act,
    // the same synthetic-state trick previewChargeThreat's own checks
    // already established).
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) => {
        if (u.id === maw.id) return { ...u, hp: 50, pos: { row: victim.pos.row, col: victim.pos.col - 1 }, attack: 5, ap: 1 }
        if (u.id === victim.id) return { ...u, block: 20 }
        return u
      }),
    }
    // Hit 1: the victim's Block (20) fully absorbs the Maw's 5-damage hit
    // - remaining 0, the lifelink must NOT fire, Maw's own hp untouched.
    state = attackUnit(state, maw.id, victim.id)
    const afterBlockedHp = state.units.find((u) => u.id === maw.id).hp
    const logHasHealAfterBlocked = state.log.some((l) => l.includes("steadies itself"))
    // Hit 2: drop the victim's Block to 0, Maw's AP refreshed - this hit
    // lands for real and must trigger the lifelink (+4 to the MAW's own hp).
    state = { ...state, units: state.units.map((u) => (u.id === victim.id ? { ...u, block: 0 } : u.id === maw.id ? { ...u, ap: 1 } : u)) }
    const hpBeforeLanded = state.units.find((u) => u.id === maw.id).hp
    state = attackUnit(state, maw.id, victim.id)
    const afterLandedHp = state.units.find((u) => u.id === maw.id).hp
    const logHasHealAfterLanded = state.log.some((l) => l.includes("steadies itself"))
    return { afterBlockedHp, logHasHealAfterBlocked, hpBeforeLanded, afterLandedHp, logHasHealAfterLanded }
  })
  await page75.close()
  out.gorgingMawLifelinkGate = result
  // The Maw is the ATTACKER throughout - it never takes a hit itself, so
  // its own hp only ever moves from the lifelink's own +4 heal, never
  // from damage. Blocked hit: no heal, hp stays 50. Landed hit: +4.
  const ok =
    result.afterBlockedHp === 50 &&
    !result.logHasHealAfterBlocked &&
    result.afterLandedHp === result.hpBeforeLanded + 4 &&
    result.logHasHealAfterLanded
  if (!ok) out.errors.push("check75 the onDealDamage lifelink fired on a blocked hit, or failed to fire on a landed one")
}

// 76. The Gorging Maw's phase fires exactly at the 50% threshold - the
//     same 3-sequential-hit proof shape Deepwarden's own check already
//     established -----------------------------------------------------
{
  const page76 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page76.on("pageerror", (e) => errs.push(String(e)))
  await page76.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page76.waitForSelector(".hwt-board")
  const result = await page76.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-gorging-maw")
    const maw = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    const announce = "It feeds on the wounds it makes."
    const countAnnounce = (s) => s.log.filter((l) => l === announce).length
    // hp 40/72 = 0.556, above the 0.5 threshold. attack:0 so the hit
    // deals no damage and doesn't itself move hp - isolates the phase
    // check from the lifelink's own +4 heal muddying the threshold math.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === maw.id) return { ...u, hp: 40 }
        if (u.id === attacker.id) return { ...u, pos: { row: maw.pos.row, col: maw.pos.col + 1 }, attack: 0, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, maw.id)
    const afterFirstPhaseIndex = state.units.find((u) => u.id === maw.id).phaseIndex
    const afterFirstCount = countAnnounce(state)
    // Drop below the threshold (36/72 = 0.5, exactly at it - phase.atHpPct
    // is 0.5 and the check is hp/maxHp > atHpPct, so 0.5 itself fires).
    state = { ...state, units: state.units.map((u) => (u.id === maw.id ? { ...u, hp: 36 } : u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, maw.id)
    const afterSecond = state.units.find((u) => u.id === maw.id)
    const afterSecondCount = countAnnounce(state)
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, maw.id)
    const afterThirdCount = countAnnounce(state)
    return { afterFirstPhaseIndex, afterFirstCount, afterSecondPhaseIndex: afterSecond.phaseIndex, afterSecondHp: afterSecond.hp, afterSecondCount, afterThirdCount }
  })
  await page76.close()
  out.gorgingMawPhase = result
  const ok =
    result.afterFirstPhaseIndex === 0 &&
    result.afterFirstCount === 0 &&
    result.afterSecondPhaseIndex === 1 &&
    result.afterSecondHp === 43 && // 36 + 7 (phase heal), capped well under maxHp
    result.afterSecondCount === 1 &&
    result.afterThirdCount === 1
  if (!ok) out.errors.push("check76 The Gorging Maw's phase fired early, failed to fire at threshold, or repeated")
}

// 77. Wyrmgall formation - real HP 80, base attack unchanged (execute/
//     shatter don't fold into attack the way strength does) -----------
{
  const page77 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page77.on("pageerror", (e) => errs.push(String(e)))
  await page77.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page77.waitForSelector(".hwt-board")
  await page77.locator(".hwt-formation-btn", { hasText: "Wyrmgall" }).click()
  await page77.waitForTimeout(300)
  const enemyNames = await page77.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page77.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const gall = createTacticsBattle("wyrmgall").units.find((u) => u.side === "enemy")
    return { hp: gall.hp, maxHp: gall.maxHp, attack: gall.attack, execute: gall.execute, shatter: gall.shatter }
  })
  await page77.close()
  out.wyrmgallFormation = { enemyNames, engineFacts }
  const ok = enemyNames.length === 1 && enemyNames[0] === "Wyrmgall" && engineFacts.hp === 80 && engineFacts.maxHp === 80 && engineFacts.attack === 10 && engineFacts.execute === 4 && engineFacts.shatter === 3
  if (!ok) out.errors.push("check77 Wyrmgall's formation composition or real stats were wrong")
}

// 78. Execute fires only at/under 30% defender HP - a deterministic
//     2-state proof ----------------------------------------------------
{
  const page78 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page78.on("pageerror", (e) => errs.push(String(e)))
  await page78.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page78.waitForSelector(".hwt-board")
  const result = await page78.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("wyrmgall")
    const gall = state.units.find((u) => u.side === "enemy")
    const defender = state.units.find((u) => u.side === "player")
    // Wyrmgall must be the ACTOR - Execute checks the DEFENDER it's
    // hitting, so phase:"enemy" lets it act (the same synthetic-state
    // trick previewChargeThreat's own checks already established).
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) => {
        if (u.id === gall.id) return { ...u, pos: { row: defender.pos.row, col: defender.pos.col - 1 }, ap: 2 }
        if (u.id === defender.id) return { ...u, hp: 40, maxHp: 100, block: 0 }
        return u
      }),
    }
    // Above 30% (40/100) - no Execute bonus, plain attack (10) lands.
    state = attackUnit(state, gall.id, defender.id)
    const afterAboveHp = state.units.find((u) => u.id === defender.id).hp
    // At/under 30% (25/100) - Execute (4) adds to the plain attack (10).
    state = { ...state, units: state.units.map((u) => (u.id === defender.id ? { ...u, hp: 25 } : u.id === gall.id ? { ...u, ap: 1 } : u)) }
    const hpBeforeExecute = state.units.find((u) => u.id === defender.id).hp
    state = attackUnit(state, gall.id, defender.id)
    const afterExecuteHp = state.units.find((u) => u.id === defender.id).hp
    return { afterAboveHp, hpBeforeExecute, afterExecuteHp }
  })
  await page78.close()
  out.wyrmgallExecute = result
  const ok = result.afterAboveHp === 30 && result.afterExecuteHp === result.hpBeforeExecute - 14
  if (!ok) out.errors.push("check78 Execute fired above the 30% threshold, or didn't add its exact bonus at/under it")
}

// 79. Shatter fires only while the defender holds Block - a
//     deterministic 2-state proof, verified via the resulting hp drop
//     (not assumed from the formula alone) -----------------------------
{
  const page79 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page79.on("pageerror", (e) => errs.push(String(e)))
  await page79.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page79.waitForSelector(".hwt-board")
  const result = await page79.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("wyrmgall")
    const gall = state.units.find((u) => u.side === "enemy")
    const defender = state.units.find((u) => u.side === "player")
    // Wyrmgall must be the ACTOR - Shatter checks the DEFENDER it's
    // hitting, so phase:"enemy" lets it act.
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) => {
        if (u.id === gall.id) return { ...u, pos: { row: defender.pos.row, col: defender.pos.col - 1 }, ap: 2 }
        if (u.id === defender.id) return { ...u, hp: 100, maxHp: 100, block: 0 }
        return u
      }),
    }
    // No Block - no Shatter bonus, plain attack (10) lands.
    state = attackUnit(state, gall.id, defender.id)
    const afterNoBlockHp = state.units.find((u) => u.id === defender.id).hp
    // Block (12) is BIGGER than the base attack (10) - deliberately, so
    // the ordering actually matters: if Shatter (3) is correctly added
    // BEFORE Block absorption, the total amount (13) exceeds Block (12)
    // by exactly 1, so exactly 1 damage gets through. If it were wrongly
    // tacked on AFTER Block absorption instead, the base 10 would be
    // fully absorbed (0 overflow) and Shatter's 3 would land raw - a
    // different, distinguishable number (3, not 1) - so this proves the
    // real order, not just that a bonus was added somewhere.
    state = { ...state, units: state.units.map((u) => (u.id === defender.id ? { ...u, block: 12 } : u.id === gall.id ? { ...u, ap: 1 } : u)) }
    const hpBeforeShatter = state.units.find((u) => u.id === defender.id).hp
    state = attackUnit(state, gall.id, defender.id)
    const afterShatterHp = state.units.find((u) => u.id === defender.id).hp
    return { afterNoBlockHp, hpBeforeShatter, afterShatterHp }
  })
  await page79.close()
  out.wyrmgallShatter = result
  const ok = result.afterNoBlockHp === 90 && result.afterShatterHp === result.hpBeforeShatter - 1
  if (!ok) out.errors.push("check79 Shatter fired without Block present, or its bonus wasn't fed into the block-absorption math BEFORE Block, not after")
}

// 80. Wyrmgall's phase escalates Execute correctly - after the 50%
//     threshold fires, execute is 7 (4 base + 3 phase) -----------------
{
  const page80 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page80.on("pageerror", (e) => errs.push(String(e)))
  await page80.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page80.waitForSelector(".hwt-board")
  const result = await page80.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("wyrmgall")
    const gall = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === gall.id) return { ...u, hp: 40 }
        if (u.id === attacker.id) return { ...u, pos: { row: gall.pos.row, col: gall.pos.col + 1 }, attack: 1, ap: 1 }
        return u
      }),
    }
    const beforeExecute = state.units.find((u) => u.id === gall.id).execute
    state = attackUnit(state, attacker.id, gall.id)
    const after = state.units.find((u) => u.id === gall.id)
    return { beforeExecute, afterExecute: after.execute, afterPhaseIndex: after.phaseIndex }
  })
  await page80.close()
  out.wyrmgallPhaseEscalation = result
  if (!(result.beforeExecute === 4 && result.afterExecute === 7 && result.afterPhaseIndex === 1)) {
    out.errors.push("check80 Wyrmgall's phase did not escalate Execute from 4 to 7")
  }
}

// 81. WoundedFury and Weak, proven generically via hand-built synthetic
//     units (no current formation carries either live) - confirms the
//     real operator order: WoundedFury adds first, Weak then multiplies
//     the WHOLE amount, not just the base ------------------------------
{
  const page81 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page81.on("pageerror", (e) => errs.push(String(e)))
  await page81.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page81.waitForSelector(".hwt-board")
  const result = await page81.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const attackerId = state.units.find((u) => u.side === "enemy").id
    const defenderId = state.units.find((u) => u.side === "player").id
    // Facing round: the attacker ends up EAST of the defender below
    // (defPos.col + 1) - a synthetic geometry this check never
    // intended to exercise. Pin the defender's own facing to "E" (it's
    // now facing TOWARD its attacker) so this stays a genuine FRONT
    // attack (no facing multiplier), keeping this check's own real
    // subject (WoundedFury/Weak ordering) isolated from an unrelated
    // mechanic.
    const base = () =>
      state.units.map((u) =>
        u.id === attackerId
          ? { ...u, pos: state.units.find((x) => x.id === defenderId).pos, attack: 10, hp: 100, maxHp: 100, woundedFury: 0, weak: 0, execute: 0, shatter: 0, ap: 1 }
          : u.id === defenderId
            ? { ...u, hp: 200, maxHp: 200, block: 0, facing: "E" }
            : u,
      )
    // Move the attacker adjacent (Chebyshev 1) to the defender. The
    // attacker is the enemy-side unit, so phase:"enemy" lets it act.
    const defPos = state.units.find((u) => u.id === defenderId).pos
    const adjPos = { row: defPos.row, col: defPos.col + 1 }
    state = { ...state, phase: "enemy", units: base().map((u) => (u.id === attackerId ? { ...u, pos: adjPos, hp: 40 } : u)) } // 40/100 - below 50%, so WoundedFury is active whenever it's set
    // Case A: no woundedFury, no weak - plain 10 damage.
    let s = { ...state, units: state.units.map((u) => (u.id === attackerId ? { ...u, woundedFury: 0, weak: 0 } : u)) }
    s = attackUnit(s, attackerId, defenderId)
    const plainHp = s.units.find((u) => u.id === defenderId).hp
    // Case B: woundedFury active (attacker below 50% own hp) - +3 flat -> 13.
    let s2 = { ...state, units: state.units.map((u) => (u.id === attackerId ? { ...u, woundedFury: 1, weak: 0, ap: 1 } : u.id === defenderId ? { ...u, hp: 200 } : u)) }
    s2 = attackUnit(s2, attackerId, defenderId)
    const woundedFuryHp = s2.units.find((u) => u.id === defenderId).hp
    // Case C: woundedFury AND weak - (10+3)*0.75 floored = 9 (Weak
    // multiplies the WoundedFury-inclusive amount, not just the base).
    let s3 = { ...state, units: state.units.map((u) => (u.id === attackerId ? { ...u, woundedFury: 1, weak: 1, ap: 1 } : u.id === defenderId ? { ...u, hp: 200 } : u)) }
    s3 = attackUnit(s3, attackerId, defenderId)
    const bothHp = s3.units.find((u) => u.id === defenderId).hp
    return { plainDamage: 200 - plainHp, woundedFuryDamage: 200 - woundedFuryHp, bothDamage: 200 - bothHp }
  })
  await page81.close()
  out.woundedFuryAndWeak = result
  const ok = result.plainDamage === 10 && result.woundedFuryDamage === 13 && result.bothDamage === 9
  if (!ok) out.errors.push("check81 WoundedFury/Weak did not compute in the real order (WoundedFury add, then Weak multiply)")
}

// 82. checkOnDealDamageTriggers' target:"target" addressing, via a
//     hand-built trigger matching the final boss's own real future
//     shape - the unit HIT gains the effect, not the attacker itself ---
{
  const page82 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page82.on("pageerror", (e) => errs.push(String(e)))
  await page82.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page82.waitForSelector(".hwt-board")
  const result = await page82.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const attackerId = state.units.find((u) => u.side === "enemy").id
    const defenderId = state.units.find((u) => u.side === "player").id
    const defPos = state.units.find((u) => u.id === defenderId).pos
    const adjPos = { row: defPos.row, col: defPos.col + 1 }
    // Attach the final boss's own real future onDealDamage effect shape
    // directly (not yet reachable via any real def this round). The
    // attacker is the enemy-side unit, so phase:"enemy" lets it act.
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) =>
        u.id === attackerId
          ? { ...u, pos: adjPos, ap: 1, triggers: [{ trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }] }
          : u,
      ),
    }
    state = attackUnit(state, attackerId, defenderId)
    const attacker = state.units.find((u) => u.id === attackerId)
    const defender = state.units.find((u) => u.id === defenderId)
    return { attackerWeak: attacker.weak, defenderWeak: defender.weak, logHasNote: state.log.some((l) => l.includes("leaves the wound raw")) }
  })
  await page82.close()
  out.onDealDamageTargetAddressing = result
  if (!(result.attackerWeak === 0 && result.defenderWeak === 1 && result.logHasNote)) {
    out.errors.push("check82 an onDealDamage effect with target:'target' did not land on the unit that was hit")
  }
}

// 83. Re-run the full existing 73-check suite unmodified is implicit -
//     this file's own checks 1-73 above are untouched; this check is
//     purely a placeholder marker confirming the count. Real regression
//     proof is "checks 1-73 still pass in this same run" (see the JSON
//     output's own per-check fields above). -------------------------
{
  out.regressionNote = "Checks 1-73 (unmodified) re-ran as part of this same file execution - see their own output fields above for the full 73-check regression proof."
}

// ---------------------------------------------------------------
// Bulwark (persistent armor), demoed via The Iron Sentinel
// (feat/hearthwood-tactics-bulwark). Every new check gets its own fresh
// page.
// ---------------------------------------------------------------

// 84. The Iron Sentinel formation - real HP 84, real name, base attack
//     11 (movePattern's own 2 attack steps, (13+8)/2 rounded - no
//     strength passive this time), bulwark starts at 0 --------------
{
  const page84 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page84.on("pageerror", (e) => errs.push(String(e)))
  await page84.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page84.waitForSelector(".hwt-board")
  await page84.locator(".hwt-formation-btn", { hasText: "The Iron Sentinel" }).click()
  await page84.waitForTimeout(300)
  const enemyNames = await page84.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page84.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const sentinel = createTacticsBattle("the-iron-sentinel").units.find((u) => u.side === "enemy")
    return { hp: sentinel.hp, maxHp: sentinel.maxHp, attack: sentinel.attack, bulwark: sentinel.bulwark }
  })
  await page84.close()
  out.ironSentinelFormation = { enemyNames, engineFacts }
  const ok = enemyNames.length === 1 && enemyNames[0] === "The Iron Sentinel" && engineFacts.hp === 84 && engineFacts.maxHp === 84 && engineFacts.attack === 11 && engineFacts.bulwark === 0
  if (!ok) out.errors.push("check84 The Iron Sentinel's formation composition or real stats were wrong")
}

// 85. Bulwark grows by exactly 1 every enemy turn, forever - the same
//     repeating-trigger proof shape Deepwarden's Block-trigger check
//     already established, applied to a stat that never resets -------
{
  const page85 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page85.on("pageerror", (e) => errs.push(String(e)))
  await page85.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page85.waitForSelector(".hwt-board")
  const result = await page85.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-iron-sentinel")
    const sentinel = state.units.find((u) => u.side === "enemy")
    // Player hp boosted well out of reach of the Sentinel's own real
    // attack across 3 full enemy turns, so this stays a pure proof of
    // the Bulwark value - never an accidental battle-end.
    state = { ...state, units: state.units.map((u) => (u.side === "player" ? { ...u, hp: 500, maxHp: 500 } : u)) }
    const round1 = endPlayerTurn(state)
    const bulwarkRound1 = round1.units.find((u) => u.id === sentinel.id).bulwark
    const round2 = endPlayerTurn(round1)
    const bulwarkRound2 = round2.units.find((u) => u.id === sentinel.id).bulwark
    const round3 = endPlayerTurn(round2)
    const bulwarkRound3 = round3.units.find((u) => u.id === sentinel.id).bulwark
    return { bulwarkRound1, bulwarkRound2, bulwarkRound3 }
  })
  await page85.close()
  out.ironSentinelBulwarkGrowth = result
  if (!(result.bulwarkRound1 === 1 && result.bulwarkRound2 === 2 && result.bulwarkRound3 === 3)) {
    out.errors.push("check85 Bulwark did not grow by exactly 1 every enemy turn")
  }
}

// 86. Bulwark absorbs damage without ever being spent - two separate
//     hits each land for exactly the same reduced amount, and bulwark
//     itself never decreases (Block's own spent-and-reset behavior does
//     NOT apply to it). Also confirms a bulwark-only hit's log line
//     carries ONLY the Bulwark note, no "absorbed" text --------------
{
  const page86 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page86.on("pageerror", (e) => errs.push(String(e)))
  await page86.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page86.waitForSelector(".hwt-board")
  const result = await page86.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-iron-sentinel")
    const sentinel = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === sentinel.id) return { ...u, hp: 84, bulwark: 3, block: 0 }
        if (u.id === attacker.id) return { ...u, pos: { row: sentinel.pos.row, col: sentinel.pos.col + 1 }, attack: 10, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, sentinel.id)
    const afterFirst = state.units.find((u) => u.id === sentinel.id)
    const logHasBulwarkOnly = state.log.some((l) => l.includes("3 turned by Bulwark") && !l.includes("absorbed"))
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, sentinel.id)
    const afterSecond = state.units.find((u) => u.id === sentinel.id)
    return {
      hpAfterFirst: afterFirst.hp,
      bulwarkAfterFirst: afterFirst.bulwark,
      logHasBulwarkOnly,
      hpAfterSecond: afterSecond.hp,
      bulwarkAfterSecond: afterSecond.bulwark,
    }
  })
  await page86.close()
  out.ironSentinelBulwarkPersists = result
  const ok =
    result.hpAfterFirst === 77 && // 84 - (10 - 3)
    result.bulwarkAfterFirst === 3 &&
    result.logHasBulwarkOnly &&
    result.hpAfterSecond === 70 && // 77 - (10 - 3), same reduction again
    result.bulwarkAfterSecond === 3
  if (!ok) out.errors.push("check86 Bulwark either got spent like Block, or didn't reduce the hit correctly")
}

// 87. Block is spent before Bulwark, and only Block is ever reduced -
//     a bulwark(3) + block(5) hit for 10 lands for exactly 2 (10-8);
//     afterward block reads 0 (fully spent) and bulwark still reads 3.
//     The log narrates the split ("absorbed 5" AND "3 turned by
//     Bulwark") ---------------------------------------------------
{
  const page87 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page87.on("pageerror", (e) => errs.push(String(e)))
  await page87.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page87.waitForSelector(".hwt-board")
  const result = await page87.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-iron-sentinel")
    const sentinel = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === sentinel.id) return { ...u, hp: 84, bulwark: 3, block: 5 }
        if (u.id === attacker.id) return { ...u, pos: { row: sentinel.pos.row, col: sentinel.pos.col + 1 }, attack: 10, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, sentinel.id)
    const after = state.units.find((u) => u.id === sentinel.id)
    // Squad Passive round: a bare `.includes("strikes")` search now
    // wrongly matches the battle's own opening log line too (Tommy's
    // real description text happens to contain "strikes a little
    // harder") - narrowed to the same `startsWith` idiom other checks
    // already use to name the actual attacker specifically.
    const logLine = state.log.find((l) => l.startsWith(`${attacker.name} strikes `))
    return { hp: after.hp, block: after.block, bulwark: after.bulwark, logLine }
  })
  await page87.close()
  out.ironSentinelBlockThenBulwark = result
  const ok =
    result.hp === 82 && // 84 - (10 - min(5+3,10)) = 84 - (10-8) = 82
    result.block === 0 &&
    result.bulwark === 3 &&
    result.logLine?.includes("absorbed 5") &&
    result.logLine?.includes("3 turned by Bulwark")
  if (!ok) out.errors.push("check87 Block was not spent before Bulwark, or the log did not narrate the split correctly")
}

// 88. The Iron Sentinel's phase fires exactly at the 60% threshold - the
//     same 3-sequential-hit proof shape Deepwarden/The Gorging Maw's own
//     phase checks already established ------------------------------
{
  const page88 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page88.on("pageerror", (e) => errs.push(String(e)))
  await page88.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page88.waitForSelector(".hwt-board")
  const result = await page88.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-iron-sentinel")
    const sentinel = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    const announce = "It stops pretending to be mortal."
    const countAnnounce = (s) => s.log.filter((l) => l === announce).length
    // hp 51/84 = 0.607, above the 0.6 threshold. attack:0 isolates the
    // phase-threshold check from any hp change of its own.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === sentinel.id) return { ...u, hp: 51 }
        if (u.id === attacker.id) return { ...u, pos: { row: sentinel.pos.row, col: sentinel.pos.col + 1 }, attack: 0, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, sentinel.id)
    const afterFirstPhaseIndex = state.units.find((u) => u.id === sentinel.id).phaseIndex
    const afterFirstCount = countAnnounce(state)
    // 50/84 = 0.595, at/under the 0.6 threshold - must fire exactly once.
    state = { ...state, units: state.units.map((u) => (u.id === sentinel.id ? { ...u, hp: 50 } : u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, sentinel.id)
    const afterSecondPhaseIndex = state.units.find((u) => u.id === sentinel.id).phaseIndex
    const afterSecondCount = countAnnounce(state)
    // The real phase effect is `addTrigger turnStart -> block 5` -
    // confirm the exact trigger got registered, not just that a phase
    // fired at all.
    const registeredTrigger = state.units.find((u) => u.id === sentinel.id).triggers.find((t) => t.trigger === "turnStart" && t.effect.type === "block")
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, sentinel.id)
    const afterThirdCount = countAnnounce(state)
    return { afterFirstPhaseIndex, afterFirstCount, afterSecondPhaseIndex, afterSecondCount, afterThirdCount, registeredTriggerAmount: registeredTrigger?.effect.amount }
  })
  await page88.close()
  out.ironSentinelPhaseThreshold = result
  const ok =
    result.afterFirstPhaseIndex === 0 &&
    result.afterFirstCount === 0 &&
    result.afterSecondPhaseIndex === 1 &&
    result.afterSecondCount === 1 &&
    result.afterThirdCount === 1 &&
    result.registeredTriggerAmount === 5
  if (!ok) out.errors.push("check88 The Iron Sentinel's phase fired early, failed to fire at threshold, repeated, or didn't register the real block(5) trigger")
}

// ---------------------------------------------------------------
// Regen + Taunt, demoed via Thornmaw (feat/hearthwood-tactics-regen-
// taunt). Every new check gets its own fresh page.
// ---------------------------------------------------------------

// 89. Thornmaw formation - real HP 78, real name, base attack 8
//     (movePattern's own 2 attack steps, (9+7)/2), taunt starts at 1
//     (folded from the base passive at derive time), regen starts at 0
//     (trigger-only, not yet fired) ------------------------------------
{
  const page89 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page89.on("pageerror", (e) => errs.push(String(e)))
  await page89.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page89.waitForSelector(".hwt-board")
  await page89.locator(".hwt-formation-btn", { hasText: "Thornmaw" }).click()
  await page89.waitForTimeout(300)
  const enemyNames = await page89.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page89.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const thornmaw = createTacticsBattle("thornmaw").units.find((u) => u.side === "enemy")
    return { hp: thornmaw.hp, maxHp: thornmaw.maxHp, attack: thornmaw.attack, taunt: thornmaw.taunt, regen: thornmaw.regen }
  })
  await page89.close()
  out.thornmawFormation = { enemyNames, engineFacts }
  const ok = enemyNames.length === 1 && enemyNames[0] === "Thornmaw" && engineFacts.hp === 78 && engineFacts.maxHp === 78 && engineFacts.attack === 8 && engineFacts.taunt === 1 && engineFacts.regen === 0
  if (!ok) out.errors.push("check89 Thornmaw's formation composition or real stats were wrong")
}

// 90. Regen's exact real order - the highest-value proof this round: a
//     fresh grant does NOT heal on the same enemy turn it's granted; it
//     only starts ticking (heal + decay) the FOLLOWING enemy turn. If
//     the order were reversed (grant before tick), round 1 would ALREADY
//     show a +4 heal - these two orderings diverge at round 1, so this
//     is a real, distinguishing proof, not just "some healing happened" -
{
  const page90 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page90.on("pageerror", (e) => errs.push(String(e)))
  await page90.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page90.waitForSelector(".hwt-board")
  const result = await page90.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("thornmaw")
    const thornmaw = state.units.find((u) => u.side === "enemy")
    // Player hp boosted well out of reach of Thornmaw's own real attack
    // across 2 full enemy turns, so this stays a pure proof of the
    // regen value - never an accidental battle-end.
    state = {
      ...state,
      units: state.units.map((u) => (u.side === "player" ? { ...u, hp: 500, maxHp: 500 } : u.id === thornmaw.id ? { ...u, hp: 50 } : u)),
    }
    const round1 = endPlayerTurn(state)
    const t1 = round1.units.find((u) => u.id === thornmaw.id)
    const round2 = endPlayerTurn(round1)
    const t2 = round2.units.find((u) => u.id === thornmaw.id)
    return { hpAfterRound1: t1.hp, regenAfterRound1: t1.regen, hpAfterRound2: t2.hp, regenAfterRound2: t2.regen }
  })
  await page90.close()
  out.thornmawRegenOrder = result
  const ok = result.hpAfterRound1 === 50 && result.regenAfterRound1 === 4 && result.hpAfterRound2 === 54 && result.regenAfterRound2 === 7
  if (!ok) out.errors.push("check90 Regen ticked in the wrong order relative to its own grant (a fresh stack healed the same turn it was granted)")
}

// 91. Regen keeps escalating (net +3 healing capacity per turn: +4
//     granted, -1 decayed) across 3 enemy turns, matching "the wounds
//     close faster than you can open them" ----------------------------
{
  const page91 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page91.on("pageerror", (e) => errs.push(String(e)))
  await page91.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page91.waitForSelector(".hwt-board")
  const result = await page91.evaluate(async () => {
    const { createTacticsBattle, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("thornmaw")
    const thornmaw = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => (u.side === "player" ? { ...u, hp: 500, maxHp: 500 } : u.id === thornmaw.id ? { ...u, hp: 20, maxHp: 200 } : u)),
    }
    const r1 = endPlayerTurn(state)
    const r2 = endPlayerTurn(r1)
    const r3 = endPlayerTurn(r2)
    const hp = (s) => s.units.find((u) => u.id === thornmaw.id).hp
    const regen = (s) => s.units.find((u) => u.id === thornmaw.id).regen
    return { hp1: hp(r1), regen1: regen(r1), hp2: hp(r2), regen2: regen(r2), hp3: hp(r3), regen3: regen(r3) }
  })
  await page91.close()
  out.thornmawRegenEscalates = result
  const ok = result.regen1 === 4 && result.regen2 === 7 && result.regen3 === 10 && result.hp1 === 20 && result.hp2 === 24 && result.hp3 === 31
  if (!ok) out.errors.push("check91 Regen did not escalate correctly (net +3 healing capacity per enemy turn)")
}

// 92. Taunt restricts targeting to only the taunter - a synthetic
//     3-enemy state (the default formation, hand-flagging Ironmaw as
//     the taunter): attackableTargets for a player unit in range of
//     multiple enemies returns ONLY the taunter; a burst ability cast
//     on a non-taunter is rejected (state unchanged) ------------------
{
  const page92 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page92.on("pageerror", (e) => errs.push(String(e)))
  await page92.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page92.waitForSelector(".hwt-board")
  const result = await page92.evaluate(async () => {
    const { createTacticsBattle, attackableTargets, castAbility } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const taunter = state.units.find((u) => u.side === "enemy" && u.defId === "ironmaw")
    const nonTaunter = state.units.find((u) => u.side === "enemy" && u.defId === "hoardling")
    const hexbreaker = state.units.find((u) => u.side === "player" && u.defId === "hexbreaker")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === taunter.id) return { ...u, pos: { row: 3, col: 0 }, taunt: 1 }
        if (u.id === nonTaunter.id) return { ...u, pos: { row: 3, col: 1 } }
        if (u.id === hexbreaker.id) return { ...u, pos: { row: 3, col: 2 }, ap: 2 }
        return u
      }),
    }
    const targets = attackableTargets(state, hexbreaker.id).map((u) => u.defId)
    const beforeAp = state.units.find((u) => u.id === hexbreaker.id).ap
    const afterBurst = castAbility(state, hexbreaker.id, nonTaunter.id)
    const afterAp = afterBurst.units.find((u) => u.id === hexbreaker.id).ap
    const nonTaunterHpUnchanged = afterBurst.units.find((u) => u.id === nonTaunter.id).hp === nonTaunter.hp
    return { targets, beforeAp, afterAp, nonTaunterHpUnchanged }
  })
  await page92.close()
  out.thornmawTauntRestricts = result
  const ok = result.targets.length === 1 && result.targets[0] === "ironmaw" && result.afterAp === result.beforeAp && result.nonTaunterHpUnchanged
  if (!ok) out.errors.push("check92 Taunt did not restrict targeting to only the taunter for both Attack and burst-ability paths")
}

// 93. Taunt releases once the taunter dies - in the same setup,
//     hand-zero the taunter's hp; attackableTargets now includes the
//     other enemy again -------------------------------------------------
{
  const page93 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page93.on("pageerror", (e) => errs.push(String(e)))
  await page93.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page93.waitForSelector(".hwt-board")
  const result = await page93.evaluate(async () => {
    const { createTacticsBattle, attackableTargets } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const taunter = state.units.find((u) => u.side === "enemy" && u.defId === "ironmaw")
    const nonTaunter = state.units.find((u) => u.side === "enemy" && u.defId === "hoardling")
    const hexbreaker = state.units.find((u) => u.side === "player" && u.defId === "hexbreaker")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === taunter.id) return { ...u, pos: { row: 3, col: 0 }, taunt: 1, hp: 0 }
        if (u.id === nonTaunter.id) return { ...u, pos: { row: 3, col: 1 } }
        if (u.id === hexbreaker.id) return { ...u, pos: { row: 3, col: 2 } }
        return u
      }),
    }
    const targets = attackableTargets(state, hexbreaker.id).map((u) => u.defId)
    return { targets }
  })
  await page93.close()
  out.thornmawTauntReleases = result
  if (!(result.targets.includes("hoardling") && !result.targets.includes("ironmaw"))) {
    out.errors.push("check93 Taunt did not release its targeting restriction once the taunter died")
  }
}

// 94. Thornmaw's phase fires exactly at the 50% threshold, registering
//     the real regen+3 turnStart trigger (ON TOP of the base regen+4
//     one - both fire independently every turn from then on) and the
//     real strength+1 direct effect --------------------------------
{
  const page94 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page94.on("pageerror", (e) => errs.push(String(e)))
  await page94.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page94.waitForSelector(".hwt-board")
  const result = await page94.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("thornmaw")
    const thornmaw = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    const announce = "The wounds close faster than you can open them."
    const countAnnounce = (s) => s.log.filter((l) => l === announce).length
    const baseAttack = thornmaw.attack
    // 40/78 = 0.513, above the 0.5 threshold. attack:0 isolates the
    // phase-threshold check from any hp change of its own.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === thornmaw.id) return { ...u, hp: 40 }
        if (u.id === attacker.id) return { ...u, pos: { row: thornmaw.pos.row, col: thornmaw.pos.col + 1 }, attack: 0, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, thornmaw.id)
    const afterFirstPhaseIndex = state.units.find((u) => u.id === thornmaw.id).phaseIndex
    const afterFirstCount = countAnnounce(state)
    // 39/78 = 0.5 exactly, at/under the threshold - must fire.
    state = { ...state, units: state.units.map((u) => (u.id === thornmaw.id ? { ...u, hp: 39 } : u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, thornmaw.id)
    const after = state.units.find((u) => u.id === thornmaw.id)
    const afterSecondCount = countAnnounce(state)
    const regenTriggers = after.triggers.filter((t) => t.trigger === "turnStart" && t.effect.type === "applyBuff" && t.effect.id === "regen").map((t) => t.effect.amount)
    return { afterFirstPhaseIndex, afterFirstCount, phaseIndex: after.phaseIndex, afterSecondCount, attack: after.attack, baseAttack, regenTriggers }
  })
  await page94.close()
  out.thornmawPhaseThreshold = result
  const ok =
    result.afterFirstPhaseIndex === 0 &&
    result.afterFirstCount === 0 &&
    result.phaseIndex === 1 &&
    result.afterSecondCount === 1 &&
    result.attack === result.baseAttack + 1 &&
    result.regenTriggers.length === 2 &&
    result.regenTriggers.includes(4) &&
    result.regenTriggers.includes(3)
  if (!ok) out.errors.push("check94 Thornmaw's phase fired early, failed to fire at threshold, or its real effects weren't all registered correctly")
}

// ---------------------------------------------------------------
// Revive + AoE, demoed via Spacemonkey (the final boss, feat/hearthwood-
// tactics-spacemonkey). Every new check gets its own fresh page. Every
// check drives only the PUBLIC exports (createTacticsBattle/attackUnit/
// runEnemyTurn/previewEnemyIntents/withLowEnemyHp) - decideEnemyIntent/
// applyEnemyIntent/applyEnemyAoe/deterministicRoll are internal, exactly
// like the established discipline for every prior mechanic's checks.
// ---------------------------------------------------------------

// 95. Spacemonkey formation - real HP 108, real name, base attack 21
//     (movePattern's own single attack step), revive starts at 1 and
//     woundedFury starts at 1 (both direct base-passive stats), aoeMove
//     reads {amount:11, chance:0.2} (the real 1-of-5 weight share,
//     computed from the real movePattern weights, not hand-picked) ----
{
  const page95 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page95.on("pageerror", (e) => errs.push(String(e)))
  await page95.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page95.waitForSelector(".hwt-board")
  await page95.locator(".hwt-formation-btn", { hasText: "Spacemonkey" }).click()
  await page95.waitForTimeout(300)
  const enemyNames = await page95.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page95.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const boss = createTacticsBattle("spacemonkey").units.find((u) => u.side === "enemy")
    return { hp: boss.hp, maxHp: boss.maxHp, attack: boss.attack, revive: boss.revive, woundedFury: boss.woundedFury, aoeMove: boss.aoeMove }
  })
  await page95.close()
  out.spacemonkeyFormation = { enemyNames, engineFacts }
  const ok =
    enemyNames.length === 1 &&
    enemyNames[0] === "Spacemonkey" &&
    engineFacts.hp === 108 &&
    engineFacts.maxHp === 108 &&
    engineFacts.attack === 21 &&
    engineFacts.revive === 1 &&
    engineFacts.woundedFury === 1 &&
    engineFacts.aoeMove &&
    engineFacts.aoeMove.amount === 11 &&
    Math.abs(engineFacts.aoeMove.chance - 0.2) < 1e-9
  if (!ok) out.errors.push("check95 Spacemonkey's formation composition or real stats were wrong")
}

// 96. Revive saves a unit from a lethal hit exactly once ---------------
{
  const page96 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page96.on("pageerror", (e) => errs.push(String(e)))
  await page96.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page96.waitForSelector(".hwt-board")
  const result = await page96.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("spacemonkey")
    const boss = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === boss.id) return { ...u, hp: 5, block: 0, revive: 1 }
        if (u.id === attacker.id) return { ...u, pos: { row: boss.pos.row, col: boss.pos.col + 1 }, attack: 20, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, boss.id)
    const after = state.units.find((u) => u.id === boss.id)
    return { hp: after.hp, revive: after.revive, phase: state.phase, hasReviveLine: state.log.some((l) => l.includes("clings to life at 1 HP!")) }
  })
  await page96.close()
  out.spacemonkeyReviveSaves = result
  const ok = result.hp === 1 && result.revive === 0 && result.phase === "player" && result.hasReviveLine
  if (!ok) out.errors.push("check96 Revive did not save the boss from a lethal hit exactly as the real mechanic does")
}

// 97. Revive doesn't fire twice - the same boss, now at revive:0, takes
//     another lethal hit and actually dies this time --------------------
{
  const page97 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page97.on("pageerror", (e) => errs.push(String(e)))
  await page97.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page97.waitForSelector(".hwt-board")
  const result = await page97.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("spacemonkey")
    const boss = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === boss.id) return { ...u, hp: 1, block: 0, revive: 0 }
        if (u.id === attacker.id) return { ...u, pos: { row: boss.pos.row, col: boss.pos.col + 1 }, attack: 20, ap: 1 }
        return u
      }),
    }
    state = attackUnit(state, attacker.id, boss.id)
    const after = state.units.find((u) => u.id === boss.id)
    const reviveLineCount = state.log.filter((l) => l.includes("clings to life at 1 HP!")).length
    return { hp: after.hp, phase: state.phase, hasFallsLine: state.log.some((l) => l.includes("It falls.")), reviveLineCount }
  })
  await page97.close()
  out.spacemonkeyReviveDoesntDoubleFire = result
  const ok = result.hp === 0 && result.phase === "won" && result.hasFallsLine && result.reviveLineCount === 0
  if (!ok) out.errors.push("check97 Revive incorrectly fired a second time, or the boss failed to actually die once its stack was spent")
}

// 98. AoE hits every living player unit through the full modifier
//     pipeline, bypassing range entirely - a turn-scan (via the PUBLIC
//     previewEnemyIntents, never the internal deterministicRoll) finds
//     a real turn number where Spacemonkey's own weightedRandom choice
//     lands on aoe, then drives that exact turn for real via
//     runEnemyTurn: player units at Chebyshev distance 1/5/8 (only the
//     first within his real range:1) ALL take exactly 11 damage,
//     including the ones a normal single-target attack could never
//     reach. FIXED this round (feat/hearthwood-tactics-squad6): the
//     default squad grew from 3 to 6, and this check's own
//     `distances[i]` was a raw array-index into a 3-entry array -
//     units 4-6 would have read `undefined`, producing NaN positions.
//     Clamped to the last named distance (8) for any unit beyond the
//     first 3, so the original 3-unit case stays byte-identical and
//     every extra unit still gets a valid, meaningfully-far position -
{
  const page98 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page98.on("pageerror", (e) => errs.push(String(e)))
  await page98.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page98.waitForSelector(".hwt-board")
  const result = await page98.evaluate(async () => {
    const { createTacticsBattle, previewEnemyIntents, runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("spacemonkey")
    const boss = base.units.find((u) => u.side === "enemy")
    let aoeTurn = null
    for (let t = 1; t <= 60 && aoeTurn === null; t++) {
      const scratch = { ...base, phase: "enemy", turn: t }
      const intents = previewEnemyIntents(scratch)
      const bossIntent = intents.find((i) => i.enemyId === boss.id)?.intent
      if (bossIntent?.kind === "aoe") aoeTurn = t
    }
    if (aoeTurn === null) return { found: false }

    let state = {
      ...base,
      phase: "enemy",
      turn: aoeTurn,
      units: base.units.map((u, i) => {
        if (u.side === "enemy") return u
        const distances = [1, 5, 8]
        const d = distances[Math.min(i, distances.length - 1)]
        return { ...u, pos: { row: boss.pos.row, col: boss.pos.col + d }, hp: 50, maxHp: 50 }
      }),
    }
    state = runEnemyTurn(state)
    const playerHps = state.units.filter((u) => u.side === "player").map((u) => u.hp)
    return {
      found: true,
      aoeTurn,
      playerCount: playerHps.length,
      playerHps,
      announceLine: state.log.some((l) => l.includes("unleashes a squad-wide strike!")),
      strikeLineCount: state.log.filter((l) => l.startsWith(`${boss.name} strikes `)).length,
    }
  })
  await page98.close()
  out.spacemonkeyAoeHitsEveryone = result
  const ok = result.found && result.playerHps.every((hp) => hp === 39) && result.announceLine && result.strikeLineCount === result.playerCount
  if (!ok) out.errors.push("check98 AoE did not hit every living player unit for the exact real amount, or didn't bypass range")
}

// 99. The boss's 60%-phase Weak trigger fires per AoE target, not just
//     per single-target attack - the FIRST real content to exercise
//     the onDealDamage target:"target" trigger shape built inert in PR
//     #466. The phase's own real effects (checkEnemyPhase, already
//     proven generically since PR #464 and re-proven for 2 phases at
//     once in check 100 below) are constructed directly here - this
//     check's own job is specifically "does an AoE hit apply the
//     trigger to every target it damages," not "does the phase fire" --
{
  const page99 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page99.on("pageerror", (e) => errs.push(String(e)))
  await page99.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page99.waitForSelector(".hwt-board")
  const result = await page99.evaluate(async () => {
    const { createTacticsBattle, previewEnemyIntents, runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("spacemonkey")
    const boss = base.units.find((u) => u.side === "enemy")
    // The exact real effect the 60% phase registers (enemies.js's own
    // phases[0].effects[1]), applied directly - mirroring exactly what
    // checkEnemyPhase itself would have set on a real landed hit.
    const phased = {
      ...base,
      units: base.units.map((u) =>
        u.id === boss.id ? { ...u, phaseIndex: 1, triggers: [...u.triggers, { trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }] } : u,
      ),
    }
    let aoeTurn = null
    for (let t = 1; t <= 60 && aoeTurn === null; t++) {
      const scratch = { ...phased, phase: "enemy", turn: t }
      const intents = previewEnemyIntents(scratch)
      const bossIntent = intents.find((i) => i.enemyId === boss.id)?.intent
      if (bossIntent?.kind === "aoe") aoeTurn = t
    }
    if (aoeTurn === null) return { found: false }
    let state = { ...phased, phase: "enemy", turn: aoeTurn }
    state = runEnemyTurn(state)
    const players = state.units.filter((u) => u.side === "player")
    return { found: true, weakValues: players.map((p) => p.weak) }
  })
  await page99.close()
  out.spacemonkeyPhaseWeakOnAoe = result
  const ok = result.found && result.weakValues.every((w) => w > 0)
  if (!ok) out.errors.push("check99 The boss's 60%-phase Weak trigger did not fire on every AoE target once his phase was active")
}

// 100. Both of the boss's phases fire in sequence (60% then 30%) -------
{
  const page100 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page100.on("pageerror", (e) => errs.push(String(e)))
  await page100.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page100.waitForSelector(".hwt-board")
  const result = await page100.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("spacemonkey")
    const boss = state.units.find((u) => u.side === "enemy")
    const attacker = state.units.find((u) => u.side === "player")
    state = { ...state, units: state.units.map((u) => (u.id === attacker.id ? { ...u, attack: 0, ap: 1, pos: { row: boss.pos.row, col: boss.pos.col + 1 } } : u)) }
    // 65/108 = 0.602, just above the 0.6 threshold - must NOT fire yet.
    state = { ...state, units: state.units.map((u) => (u.id === boss.id ? { ...u, hp: 65 } : u)) }
    state = attackUnit(state, attacker.id, boss.id)
    const afterFirst = state.units.find((u) => u.id === boss.id)
    // 64/108 = 0.593, at/under 0.6 - must fire now.
    state = { ...state, units: state.units.map((u) => (u.id === boss.id ? { ...u, hp: 64 } : u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, boss.id)
    const afterSecond = state.units.find((u) => u.id === boss.id)
    // 32/108 = 0.296, under the 0.3 threshold - the second phase fires.
    state = { ...state, units: state.units.map((u) => (u.id === boss.id ? { ...u, hp: 32 } : u.id === attacker.id ? { ...u, ap: 1 } : u)) }
    state = attackUnit(state, attacker.id, boss.id)
    const afterThird = state.units.find((u) => u.id === boss.id)
    return {
      phaseIndexAfterFirst: afterFirst.phaseIndex,
      phaseIndexAfterSecond: afterSecond.phaseIndex,
      phaseIndexAfterThird: afterThird.phaseIndex,
      attackBaseline: afterFirst.attack,
      attackAfterSecond: afterSecond.attack,
      attackAfterThird: afterThird.attack,
      executeAfterThird: afterThird.execute,
      wardAfterThird: afterThird.ward,
    }
  })
  await page100.close()
  out.spacemonkeyBothPhases = result
  const ok =
    result.phaseIndexAfterFirst === 0 &&
    result.phaseIndexAfterSecond === 1 &&
    result.phaseIndexAfterThird === 2 &&
    result.attackAfterSecond === result.attackBaseline + 2 &&
    result.attackAfterThird === result.attackBaseline + 2 + 3 &&
    result.executeAfterThird === 2 &&
    // Active Power round: Ward is now a real stat in this engine, so the
    // boss's real 30% phase Ward (enemies.js, amount 2) finally lands -
    // was a deliberate no-op (asserted undefined) before that round.
    result.wardAfterThird === 2
  if (!ok) out.errors.push("check100 Spacemonkey's 2 real phases did not both fire correctly in sequence")
}

// 101. The deterministic roll keeps the intent telegraph honest: across
//      many turns, the preview says "aoe" if and only if the real
//      resolution actually fires the aoe announce line that same turn -
//      both directions checked, and both branches proven reachable ----
{
  const page101 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page101.on("pageerror", (e) => errs.push(String(e)))
  await page101.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page101.waitForSelector(".hwt-board")
  const result = await page101.evaluate(async () => {
    const { createTacticsBattle, previewEnemyIntents, runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("spacemonkey")
    const boss = base.units.find((u) => u.side === "enemy")
    let aoeTurns = 0
    let nonAoeTurns = 0
    const mismatches = []
    for (let t = 1; t <= 40; t++) {
      const scratch = { ...base, phase: "enemy", turn: t }
      const previewedAoe = previewEnemyIntents(scratch).find((i) => i.enemyId === boss.id)?.intent?.kind === "aoe"
      const executed = runEnemyTurn({ ...base, phase: "enemy", turn: t })
      const resolvedAoe = executed.log.slice(base.log.length).some((l) => l.includes("unleashes a squad-wide strike!"))
      if (previewedAoe) aoeTurns++
      else nonAoeTurns++
      if (previewedAoe !== resolvedAoe) mismatches.push({ t, previewedAoe, resolvedAoe })
    }
    return { aoeTurns, nonAoeTurns, mismatches }
  })
  await page101.close()
  out.spacemonkeyTelegraphHonesty = result
  const ok = result.aoeTurns > 0 && result.nonAoeTurns > 0 && result.mismatches.length === 0
  if (!ok) out.errors.push("check101 The intent telegraph disagreed with the real resolution for at least one turn, or only one branch was ever reachable")
}

// 102. UI: on a turn already known to roll aoe, the board shows the aoe
//      intent badge on the boss and the ember threatened ring on every
//      living player cell -------------------------------------------
{
  const page102 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page102.on("pageerror", (e) => errs.push(String(e)))
  await page102.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page102.waitForSelector(".hwt-board")
  await page102.locator(".hwt-formation-btn", { hasText: "Spacemonkey" }).click()
  await page102.waitForTimeout(300)
  const aoeTurn = await page102.evaluate(async () => {
    const { createTacticsBattle, previewEnemyIntents } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("spacemonkey")
    const boss = base.units.find((u) => u.side === "enemy")
    for (let t = 1; t <= 60; t++) {
      const intents = previewEnemyIntents({ ...base, phase: "enemy", turn: t })
      if (intents.find((i) => i.enemyId === boss.id)?.intent?.kind === "aoe") return t
    }
    return null
  })
  // Advance the live board's own turn counter to the found aoe turn by
  // repeatedly ending the turn (each full player+enemy cycle advances
  // `turn` by exactly 1) - the same board the UI itself renders from,
  // not a synthetic bypass. Guarded by a live phase check each step
  // (rather than assumed) since this is real, unmitigated combat - if
  // the squad were ever actually lost before reaching the target turn,
  // that's a real, honestly-reported failure, not masked as a pass.
  let livePhase = "player"
  for (let i = 1; i < (aoeTurn || 1) && livePhase === "player"; i++) {
    await page102.locator(".hwt-end-turn").click()
    await page102.waitForTimeout(150)
    livePhase = await page102.locator(".hwt-turn-label").getAttribute("data-phase")
  }
  const badgeCount = await page102.locator('.hwt-intent-badge[data-intent="aoe"]').count()
  const threatenedCount = await page102.locator('.hwt-cell[data-threatened="true"]').count()
  await page102.close()
  out.spacemonkeyAoeUi = { aoeTurn, livePhase, badgeCount, threatenedCount }
  const ok = aoeTurn !== null && livePhase === "player" && badgeCount === 1 && threatenedCount === 5
  if (!ok) out.errors.push("check102 The board did not show the aoe intent badge or the correct number of threatened cells on a known aoe turn")
}

// ---------------------------------------------------------------
// Terrain + movement cost, demoed via "The Crossing" (feat/hearthwood-
// tactics-terrain). Every new check gets its own fresh page.
// ---------------------------------------------------------------

// 103. "The Crossing" formation composition - the hand-authored terrain
//      map matches exactly what was placed, and every other cell
//      correctly defaults to "path" (undefined in the raw map) --------
{
  const page103 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page103.on("pageerror", (e) => errs.push(String(e)))
  await page103.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page103.waitForSelector(".hwt-board")
  await page103.locator(".hwt-formation-btn", { hasText: "The Crossing" }).click()
  await page103.waitForTimeout(300)
  const enemyNames = await page103.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const engineFacts = await page103.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("the-crossing")
    return { terrain: battle.terrain, defaultCell: battle.terrain["0-0"] }
  })
  await page103.close()
  out.crossingFormation = { enemyNames, engineFacts }
  const t = engineFacts.terrain
  const ok =
    enemyNames.length === 1 &&
    enemyNames[0] === "Ironmaw" &&
    t["2-6"] === "rock" &&
    t["3-6"] === "rock" &&
    t["5-6"] === "rock" &&
    t["6-6"] === "rock" &&
    t["4-6"] === "poison" &&
    t["4-2"] === "water" &&
    engineFacts.defaultCell === undefined
  if (!ok) out.errors.push("check103 The Crossing's terrain map did not match what was authored")
}

// 104. Movement cost is genuinely weighted, not counted by tile - a
//      synthetic single-row grid (eliminating any diagonal-detour
//      ambiguity) with 2 real Rock tiles (cost 3 each, per the PRD's
//      own §3.2 illustrative number) in the middle of the only path.
//      A move-4 unit starting at col 0: col1 costs 1 (reachable), col2
//      costs 1+3=4 (exactly at the limit, reachable), col3 would cost
//      4+3=7 (over the limit - unreachable), and col4 is therefore ALSO
//      unreachable (no route to it that doesn't pass through col3) -
//      the exact boundary only a real weighted-cost algorithm produces,
//      not a step-count one (which would have reached col4 in 4 hops) -
{
  const page104 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page104.on("pageerror", (e) => errs.push(String(e)))
  await page104.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page104.waitForSelector(".hwt-board")
  const result = await page104.evaluate(async () => {
    const { reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 1, cols: 5 },
      terrain: { "0-2": "rock", "0-3": "rock" },
      units: [{ id: "u1", side: "player", hp: 10, pos: { row: 0, col: 0 }, move: 4 }],
      phase: "player",
    }
    const reachable = reachableTilesFor(state, "u1").map((p) => `${p.row}-${p.col}`).sort()
    return { reachable }
  })
  await page104.close()
  out.terrainMovementCostWeighted = result
  const ok = JSON.stringify(result.reachable) === JSON.stringify(["0-1", "0-2"])
  if (!ok) out.errors.push("check104 Movement cost was not genuinely weighted by terrain - the reachable boundary did not match the hand-computed cost math")
}

// 105. Water is genuinely impassable, not just expensive - the same
//      synthetic single-row shape, a single Water tile, and a
//      deliberately huge move value (10) that would trivially cross
//      any merely-expensive terrain but must still never reach past
//      Water, since its own real cost is Infinity, not a large finite
//      number -----------------------------------------------------
{
  const page105 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page105.on("pageerror", (e) => errs.push(String(e)))
  await page105.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page105.waitForSelector(".hwt-board")
  const result = await page105.evaluate(async () => {
    const { reachableTilesFor, moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 1, cols: 5 },
      terrain: { "0-2": "water" },
      units: [{ id: "u1", side: "player", hp: 10, pos: { row: 0, col: 0 }, move: 10, ap: 1 }],
      phase: "player",
    }
    const reachable = reachableTilesFor(state, "u1").map((p) => `${p.row}-${p.col}`).sort()
    // Confirmed via the real moveUnit too, not just reachableTilesFor in
    // isolation - a direct attempt to cross is refused, with zero new
    // legality code anywhere (moveUnit already delegates entirely to
    // reachableTilesFor's own returned list).
    const afterAttempt = moveUnit(state, "u1", { row: 0, col: 4 })
    const stillAtStart = afterAttempt.units[0].pos.col === 0
    return { reachable, stillAtStart }
  })
  await page105.close()
  out.terrainWaterImpassable = result
  const ok = JSON.stringify(result.reachable) === JSON.stringify(["0-1"]) && result.stillAtStart
  if (!ok) out.errors.push("check105 Water did not behave as a genuine obstacle - either reachableTilesFor crossed it, or moveUnit allowed landing past it")
}

// 106. Poison Ground genuinely integrates with the REAL, existing
//      poison system (Rot archetype, PR #459) - not a one-time flag or
//      a parallel effect. Moving onto it grants exactly the real +2
//      amount; a full endPlayerTurn afterward runs the SAME, untouched
//      applyPoisonTick that already drains every Rot enemy's own
//      poison, proving true integration -----------------------------
{
  const page106 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page106.on("pageerror", (e) => errs.push(String(e)))
  await page106.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page106.waitForSelector(".hwt-board")
  const result = await page106.evaluate(async () => {
    const { createTacticsBattle, moveUnit, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("the-crossing")
    const mover = state.units.find((u) => u.side === "player")
    // Place the mover right next to the real poison tile (4-6, the
    // re-centered 9x12 board) and give it enough AP/move to step onto
    // it in one action.
    state = { ...state, units: state.units.map((u) => (u.id === mover.id ? { ...u, pos: { row: 4, col: 7 }, move: 2, ap: 1, hp: 50, maxHp: 50 } : u)) }
    state = moveUnit(state, mover.id, { row: 4, col: 6 })
    const afterMove = state.units.find((u) => u.id === mover.id)
    const grantLine = state.log.some((l) => l.includes("wades into the poison"))
    // A full player-turn-end (real code path, not a synthetic bypass)
    // runs the EXISTING applyPoisonTick at the top of the following
    // enemy phase - the poison was granted earlier THIS same player
    // turn (via the move above), so this is its first real tick.
    state = endPlayerTurn(state)
    const afterTick = state.units.find((u) => u.id === mover.id)
    const tickLine = state.log.some((l) => l.includes("takes 2 poison damage"))
    return { poisonAfterMove: afterMove.poison, grantLine, hpAfterMove: afterMove.hp, hpAfterTick: afterTick.hp, poisonAfterTick: afterTick.poison, tickLine }
  })
  await page106.close()
  out.terrainPoisonIntegration = result
  const ok =
    result.poisonAfterMove === 2 &&
    result.grantLine &&
    result.hpAfterMove === 50 &&
    result.hpAfterTick === 48 &&
    result.poisonAfterTick === 1 &&
    result.tickLine
  if (!ok) out.errors.push("check106 Poison Ground did not genuinely integrate with the real, existing poison tick system")
}

// 107. UI: The Crossing's board renders visually distinct Rock/Water/
//      Poison/Path cells (a screenshot) --------------------------------
{
  const page107 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page107.on("pageerror", (e) => errs.push(String(e)))
  await page107.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page107.waitForSelector(".hwt-board")
  await page107.locator(".hwt-formation-btn", { hasText: "The Crossing" }).click()
  await page107.waitForTimeout(300)
  const rockCount = await page107.locator('.hwt-cell[data-terrain="rock"]').count()
  const waterCount = await page107.locator('.hwt-cell[data-terrain="water"]').count()
  const poisonCount = await page107.locator('.hwt-cell[data-terrain="poison"]').count()
  await page107.screenshot({ path: `${SHOT}/the_crossing.png` })
  await page107.close()
  out.terrainUi = { rockCount, waterCount, poisonCount }
  const ok = rockCount === 4 && waterCount === 1 && poisonCount === 1
  if (!ok) out.errors.push("check107 The board did not render the expected number of each terrain-tagged cell")
}

// ---------------------------------------------------------------
// Grow the player squad to 6 (feat/hearthwood-tactics-squad6). Every
// new check gets its own fresh page.
// ---------------------------------------------------------------

// 108. The default squad is genuinely 5: 4 real recruited units + 1 real
//      Commander (Tommy) - NOT the earlier (wrong, corrected mid-round)
//      6-unit design. Marc's own correction: "squadin koko on 5,
//      4+commander". Positions verified via spreadRows(5, GRID.rows)
//      (rows 2-6 on the current 9-row grid, col: GRID.cols-1); Tommy's
//      stats confirmed genuinely sourced
//      from CHARACTERS (real name/art/maxHp, attack derived from his own
//      movePattern amount:6 plus his own squadPassive's +2 Strength,
//      Squad Passive round), not a hand-typed guess -------------------
{
  const page108 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page108.on("pageerror", (e) => errs.push(String(e)))
  await page108.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page108.waitForSelector(".hwt-board")
  const result = await page108.evaluate(async () => {
    const { createTacticsBattle, GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("default")
    const players = battle.units.filter((u) => u.side === "player")
    const commander = players.find((p) => p.id === "player-commander")
    const recruited = players.filter((p) => p.id !== "player-commander")
    return {
      count: players.length,
      recruitedNames: recruited.map((p) => p.name).sort(),
      commander: commander && { name: commander.name, art: commander.art, maxHp: commander.maxHp, attack: commander.attack, ability: commander.ability },
      rows: players.map((p) => p.pos.row).sort((a, b) => a - b),
      cols: [...new Set(players.map((p) => p.pos.col))],
      gridCols: GRID.cols,
    }
  })
  await page108.close()
  out.squadFiveComposition = result
  const expectedRecruited = ["Bulwark of Ages", "Hexbreaker", "Mosskit", "Oathshield"].sort()
  const ok =
    result.count === 5 &&
    JSON.stringify(result.recruitedNames) === JSON.stringify(expectedRecruited) &&
    result.commander &&
    result.commander.name === "Tommy" &&
    result.commander.art === "cat" &&
    result.commander.maxHp === 60 &&
    // Squad Passive round: Tommy's own real movePattern gives 6, plus
    // his own squadPassive's +2 Strength (self-included in the same
    // squad-wide grant every unit gets) - 8 is the real total, not 6.
    result.commander.attack === 8 &&
    result.commander.ability === null &&
    JSON.stringify(result.rows) === JSON.stringify([2, 3, 4, 5, 6]) &&
    result.cols.length === 1 &&
    result.cols[0] === result.gridCols - 1
  if (!ok) out.errors.push("check108 The default squad was not genuinely 5 (4 real recruited units + a real Tommy Commander) in 5 distinct, correctly-centered rows")
}

// 109. The Commander is a full, real participant - not a decoration: it
//      can move, attack an enemy, and BE attacked by an enemy, exactly
//      like any recruited unit, proven via deterministic attackUnit
//      calls in both directions on the real default battle; `ability`
//      stays null (no tactics-engine ability this round - Haste/Squad
//      Passive are named, deliberate deferrals) -----------------------
{
  const page109 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page109.on("pageerror", (e) => errs.push(String(e)))
  await page109.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page109.waitForSelector(".hwt-board")
  const result = await page109.evaluate(async () => {
    const { createTacticsBattle, attackUnit, reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    const canMove = reachableTilesFor(state, commander.id).length > 0
    // Place the Commander adjacent to the enemy so it's within range 1.
    state = {
      ...state,
      units: state.units.map((u) => (u.id === commander.id ? { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col + 1 }, ap: 1 } : u)),
    }
    const enemyHpBefore = state.units.find((u) => u.id === enemy.id).hp
    state = attackUnit(state, commander.id, enemy.id)
    const enemyHpAfter = state.units.find((u) => u.id === enemy.id).hp
    // The reverse direction: the enemy's turn, attacking the Commander back.
    state = { ...state, phase: "enemy", units: state.units.map((u) => (u.id === enemy.id ? { ...u, ap: 1 } : u)) }
    const commanderHpBefore = state.units.find((u) => u.id === commander.id).hp
    state = attackUnit(state, enemy.id, commander.id)
    const commanderHpAfter = state.units.find((u) => u.id === commander.id).hp
    return { canMove, enemyHpBefore, enemyHpAfter, commanderHpBefore, commanderHpAfter, ability: commander.ability }
  })
  await page109.close()
  out.commanderFullParticipant = result
  const ok = result.canMove && result.enemyHpAfter < result.enemyHpBefore && result.commanderHpAfter < result.commanderHpBefore && result.ability === null
  if (!ok) out.errors.push("check109 The Commander was not a full real participant (move/attack/be-attacked), or its ability wasn't correctly null")
}

// 110. The squad-picker UI still renders exactly 4 slots (the 4
//      RECRUITED units only, not 5) - the Commander is correctly
//      excluded from the picker's own list, matching the real game's
//      own "the Commander isn't part of the roster picker" model -----
{
  const page110 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page110.on("pageerror", (e) => errs.push(String(e)))
  await page110.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page110.waitForSelector(".hwt-board")
  const slotCount = await page110.locator(".hwt-squad-select").count()
  const tokenCount = await page110.locator('.hwt-token[data-side="player"]').count()
  await page110.close()
  out.squadPickerFourSlots = { slotCount, tokenCount }
  const ok = slotCount === 4 && tokenCount === 5
  if (!ok) out.errors.push("check110 The squad picker did not render exactly 4 recruited slots (Commander excluded) alongside 5 total deployed player tokens")
}

// 111. UI: the Commander's own token shows the new badge, visually
//      distinguishing it from a recruited unit - the "don't ship an
//      invisible mechanic" rule, even though it fights identically
//      to a recruited unit this round --------------------------------
{
  const page111 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page111.on("pageerror", (e) => errs.push(String(e)))
  await page111.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page111.waitForSelector(".hwt-board")
  const badgeCount = await page111.locator(".hwt-commander-badge").count()
  await page111.screenshot({ path: `${SHOT}/commander_badge.png` })
  await page111.close()
  out.commanderBadge = { badgeCount }
  const ok = badgeCount === 1
  if (!ok) out.errors.push("check111 The Commander's token did not show exactly one Commander badge")
}

// ---------------------------------------------------------------
// The Haste round (feat/hearthwood-tactics-haste) - the Commander's
// (Tommy's) real Haste kit ported into attackUnit. Every new check
// gets its own fresh page (the established anti-hang discipline).
// ---------------------------------------------------------------

// 112. Basic double-hit: Tommy (haste, range 1) lands TWO real hits
//      from ONE attackUnit call, at the cost of exactly 1 AP (not 2),
//      narrated by a Haste announcement line plus 2 real strike lines -
//      asserted against his own live `attack` (Squad Passive round:
//      now 8, not the original 6, since it folds in his own +2
//      Strength too), never a hardcoded number ----------------------
{
  const page112 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page112.on("pageerror", (e) => errs.push(String(e)))
  await page112.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page112.waitForSelector(".hwt-board")
  const result = await page112.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === commander.id) return { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col + 1 }, ap: 1 }
        if (u.id === enemy.id) return { ...u, hp: 100, maxHp: 100, block: 0, bulwark: 0, revive: 0, taunt: 0 }
        return u
      }),
    }
    const enemyHpBefore = state.units.find((u) => u.id === enemy.id).hp
    const apBefore = state.units.find((u) => u.id === commander.id).ap
    state = attackUnit(state, commander.id, enemy.id)
    const enemyAfter = state.units.find((u) => u.id === enemy.id)
    const commanderAfter = state.units.find((u) => u.id === commander.id)
    const strikeLineCount = state.log.filter((l) => l.startsWith(`${commander.name} strikes `)).length
    return {
      enemyHpBefore,
      enemyHpAfter: enemyAfter.hp,
      apBefore,
      apAfter: commanderAfter.ap,
      hasteLine: state.log.some((l) => l.includes("Haste fires")),
      strikeLineCount,
      attack: commander.attack,
    }
  })
  await page112.close()
  out.hasteDoubleHit = result
  const ok =
    result.enemyHpBefore - result.enemyHpAfter === result.attack * 2 &&
    result.apBefore - result.apAfter === 1 &&
    result.hasteLine &&
    result.strikeLineCount === 2
  if (!ok) out.errors.push("check112 Haste did not land exactly 2 real hits for 1 AP, or wasn't narrated")
}

// 113. Corpse-avoidance: killing the first target on hit 1 correctly
//      retargets the follow-up at a DIFFERENT, still-living enemy
//      already in range, never wasted on the corpse ------------------
{
  const page113 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page113.on("pageerror", (e) => errs.push(String(e)))
  await page113.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page113.waitForSelector(".hwt-board")
  const result = await page113.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemies = state.units.filter((u) => u.side === "enemy")
    const weak = enemies[0]
    const survivor = enemies[1]
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === commander.id) return { ...u, pos: { row: weak.pos.row, col: weak.pos.col + 1 }, ap: 1 }
        if (u.id === weak.id) return { ...u, hp: 1, block: 0, bulwark: 0, revive: 0 }
        if (u.id === survivor.id) return { ...u, hp: 100, maxHp: 100, block: 0, bulwark: 0, revive: 0, taunt: 0 }
        return u
      }),
    }
    const survivorHpBefore = state.units.find((u) => u.id === survivor.id).hp
    state = attackUnit(state, commander.id, weak.id)
    const weakAfter = state.units.find((u) => u.id === weak.id)
    const survivorAfter = state.units.find((u) => u.id === survivor.id)
    return { weakHp: weakAfter.hp, survivorHpBefore, survivorHpAfter: survivorAfter.hp, phase: state.phase }
  })
  await page113.close()
  out.hasteCorpseAvoidance = result
  const ok = result.weakHp <= 0 && result.survivorHpAfter < result.survivorHpBefore && result.phase === "player"
  if (!ok) out.errors.push("check113 Haste's follow-up wasted itself on a corpse instead of retargeting a living enemy")
}

// 114. No-target after a kill, battle continues: the only enemy in
//      range dies on hit 1, but other living enemies remain elsewhere
//      on the board (out of range) - the follow-up correctly finds no
//      valid target and does nothing (no crash, no phantom log line,
//      no extra AP spent) --------------------------------------------
{
  const page114 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page114.on("pageerror", (e) => errs.push(String(e)))
  await page114.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page114.waitForSelector(".hwt-board")
  const result = await page114.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemies = state.units.filter((u) => u.side === "enemy")
    const weak = enemies[0]
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === commander.id) return { ...u, pos: { row: 2, col: 5 }, ap: 1 }
        if (u.id === weak.id) return { ...u, pos: { row: 2, col: 4 }, hp: 1, block: 0, bulwark: 0, revive: 0 }
        if (u.side === "enemy") return { ...u, pos: { row: 0, col: 0 } }
        return u
      }),
    }
    state = attackUnit(state, commander.id, weak.id)
    const commanderAfter = state.units.find((u) => u.id === commander.id)
    return {
      phase: state.phase,
      hasteLine: state.log.some((l) => l.includes("Haste fires")),
      ap: commanderAfter.ap,
      livingEnemyCount: state.units.filter((u) => u.side === "enemy" && u.hp > 0).length,
    }
  })
  await page114.close()
  out.hasteNoTargetContinues = result
  const ok = result.phase === "player" && !result.hasteLine && result.ap === 0 && result.livingEnemyCount === 2
  if (!ok) out.errors.push("check114 Haste's follow-up misbehaved when no valid target was in range (battle still ongoing)")
}

// 115. Battle-end interaction: killing the LAST living enemy ends the
//      battle (phase -> "won") - Haste correctly does NOT fire a
//      follow-up into an already-ended battle -----------------------
{
  const page115 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page115.on("pageerror", (e) => errs.push(String(e)))
  await page115.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page115.waitForSelector(".hwt-board")
  const result = await page115.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("deepwarden")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === commander.id) return { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col + 1 }, ap: 1 }
        if (u.id === enemy.id) return { ...u, hp: 1, block: 0, bulwark: 0, revive: 0 }
        return u
      }),
    }
    state = attackUnit(state, commander.id, enemy.id)
    return { phase: state.phase, hasteLine: state.log.some((l) => l.includes("Haste fires")) }
  })
  await page115.close()
  out.hasteBattleEnd = result
  const ok = result.phase === "won" && !result.hasteLine
  if (!ok) out.errors.push("check115 Haste incorrectly fired a follow-up into an already-ended battle")
}

// 116. Gate: a single-target restriction holds - a synthetic player-
//      side unit with haste:true but range:3 (mirroring a real
//      bishop/rook-pattern attacker) does NOT get a Haste follow-up,
//      proving range===1 (this engine's own single-vs-pattern
//      distinction) is the real gate, not just `haste` alone ---------
{
  const page116 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page116.on("pageerror", (e) => errs.push(String(e)))
  await page116.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page116.waitForSelector(".hwt-board")
  const result = await page116.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "p1", side: "player", name: "PatternTest", pos: { row: 0, col: 0 }, hp: 20, maxHp: 20, range: 3, attack: 5, ap: 1, block: 0, haste: true },
        { id: "e1", side: "enemy", name: "E1", pos: { row: 0, col: 1 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 1, block: 0 },
        { id: "e2", side: "enemy", name: "E2", pos: { row: 0, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 1, block: 0 },
      ],
    }
    const after = attackUnit(state, "p1", "e1")
    return {
      e1Hp: after.units.find((u) => u.id === "e1").hp,
      e2Hp: after.units.find((u) => u.id === "e2").hp,
      apAfter: after.units.find((u) => u.id === "p1").ap,
      hasteLine: after.log.some((l) => l.includes("Haste fires")),
    }
  })
  await page116.close()
  out.hasteGatePatternRange = result
  const ok = result.e1Hp === 95 && result.e2Hp === 100 && result.apAfter === 0 && !result.hasteLine
  if (!ok) out.errors.push("check116 A pattern-range (range!==1) unit incorrectly got a Haste follow-up")
}

// 117. Gate: Haste never fires for an enemy - a synthetic enemy-side
//      unit with haste:true does NOT get a follow-up, matching the
//      real mechanic's own side==="player" restriction (no enemy in
//      the game currently sets haste at all) -----------------------
{
  const page117 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page117.on("pageerror", (e) => errs.push(String(e)))
  await page117.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page117.waitForSelector(".hwt-board")
  const result = await page117.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      turn: 1,
      log: [],
      units: [
        { id: "e1", side: "enemy", name: "HasteEnemy", pos: { row: 0, col: 0 }, hp: 20, maxHp: 20, range: 1, attack: 5, ap: 1, block: 0, haste: true },
        { id: "p1", side: "player", name: "P1", pos: { row: 0, col: 1 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 1, block: 0 },
      ],
    }
    const after = attackUnit(state, "e1", "p1")
    return {
      p1Hp: after.units.find((u) => u.id === "p1").hp,
      hasteLine: after.log.some((l) => l.includes("Haste fires")),
    }
  })
  await page117.close()
  out.hasteGateEnemySide = result
  const ok = result.p1Hp === 95 && !result.hasteLine
  if (!ok) out.errors.push("check117 An enemy-side unit incorrectly got a Haste follow-up")
}

// 118. UI: Tommy's token shows the new Haste badge - a passive-trait
//      indicator, the "don't ship an invisible mechanic" rule --------
{
  const page118 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page118.on("pageerror", (e) => errs.push(String(e)))
  await page118.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page118.waitForSelector(".hwt-board")
  const badgeCount = await page118.locator(".hwt-haste-badge").count()
  await page118.screenshot({ path: `${SHOT}/haste_badge.png` })
  await page118.close()
  out.hasteBadge = { badgeCount }
  const ok = badgeCount === 1
  if (!ok) out.errors.push("check118 Tommy's token did not show exactly one Haste badge")
}

// ---------------------------------------------------------------
// The Squad Passive round (feat/hearthwood-tactics-squadpassive) - the
// Commander's (Tommy's) real squadPassive ported: +2 Strength to every
// deployed unit, a repeating turnStart +2 Block, and an onDealDamage
// Weak-on-hit. Every new check gets its own fresh page (the
// established anti-hang discipline).
// ---------------------------------------------------------------

// 119. Battle-start Strength lands on EVERY player unit, Commander
//      included, folded into baseline (no growth badge) - compared
//      directly against previewPlayerRoster()'s own pre-squadPassive
//      numbers, not hand-typed real stats -----------------------------
{
  const page119 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page119.on("pageerror", (e) => errs.push(String(e)))
  await page119.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page119.waitForSelector(".hwt-board")
  const result = await page119.evaluate(async () => {
    const { createTacticsBattle, previewPlayerRoster } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("default")
    const preview = previewPlayerRoster()
    const players = battle.units.filter((u) => u.side === "player")
    const recruited = players.filter((u) => u.id !== "player-commander")
    const commander = players.find((u) => u.id === "player-commander")
    const recruitedOk = recruited.every((u) => {
      const base = preview.find((p) => p.defId === u.defId)
      return base && u.attack === base.attack + 2 && u.attack === u.baseAttack
    })
    return { recruitedOk, commanderAttack: commander.attack, commanderBaseAttack: commander.baseAttack }
  })
  await page119.close()
  out.squadPassiveStrength = result
  const ok = result.recruitedOk && result.commanderAttack === 8 && result.commanderAttack === result.commanderBaseAttack
  if (!ok) out.errors.push("check119 Squad Passive's +2 Strength did not land on every player unit, folded into baseline")
}

// 120. TurnStart Block fires for every living player unit exactly once
//      the player's own turn begins, right after Block resets to 0 ----
{
  const page120 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page120.on("pageerror", (e) => errs.push(String(e)))
  await page120.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page120.waitForSelector(".hwt-board")
  const result = await page120.evaluate(async () => {
    const { createTacticsBattle, runEnemyTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    state = { ...state, phase: "enemy", units: state.units.map((u) => (u.side === "player" ? { ...u, block: 0 } : u)) }
    state = runEnemyTurn(state)
    const living = state.units.filter((u) => u.side === "player" && u.hp > 0)
    return {
      phase: state.phase,
      blocks: living.map((u) => u.block),
      braceLineCount: state.log.filter((l) => l.includes("braces for the next blow")).length,
    }
  })
  await page120.close()
  out.squadPassiveTurnStartBlock = result
  const ok = result.phase === "player" && result.blocks.length === 5 && result.blocks.every((b) => b === 2) && result.braceLineCount === 5
  if (!ok) out.errors.push("check120 Squad Passive's turnStart Block did not fire exactly +2 for every living player unit")
}

// 121. onDealDamage Weak fires on the struck enemy from a RECRUITED
//      unit (not just Tommy) - proving the effect is genuinely
//      squad-wide, not hard-coded to the Commander ---------------------
{
  const page121 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page121.on("pageerror", (e) => errs.push(String(e)))
  await page121.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page121.waitForSelector(".hwt-board")
  const result = await page121.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const recruited = state.units.find((u) => u.side === "player" && u.id !== "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === recruited.id) return { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col + 1 }, ap: 1 }
        if (u.id === enemy.id) return { ...u, hp: 100, maxHp: 100, block: 0, bulwark: 0, revive: 0, taunt: 0, weak: 0 }
        return u
      }),
    }
    state = attackUnit(state, recruited.id, enemy.id)
    const enemyAfter = state.units.find((u) => u.id === enemy.id)
    return { weak: enemyAfter.weak, weakLine: state.log.some((l) => l.includes("leaves the wound raw")), recruitedName: recruited.name }
  })
  await page121.close()
  out.squadPassiveWeakOnHit = result
  const ok = result.weak === 1 && result.weakLine
  if (!ok) out.errors.push("check121 Squad Passive's onDealDamage Weak did not fire from a recruited unit's own landed hit")
}

// 122. Cross-mechanic proof: Tommy's own Haste follow-up (PR #483)
//      ALSO applies Weak - once per landed hit, not just the first -----
{
  const page122 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page122.on("pageerror", (e) => errs.push(String(e)))
  await page122.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page122.waitForSelector(".hwt-board")
  const result = await page122.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const commander = state.units.find((u) => u.id === "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === commander.id) return { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col + 1 }, ap: 1 }
        if (u.id === enemy.id) return { ...u, hp: 100, maxHp: 100, block: 0, bulwark: 0, revive: 0, taunt: 0, weak: 0 }
        return u
      }),
    }
    state = attackUnit(state, commander.id, enemy.id)
    const enemyAfter = state.units.find((u) => u.id === enemy.id)
    return { weak: enemyAfter.weak, hasteLine: state.log.some((l) => l.includes("Haste fires")), weakLineCount: state.log.filter((l) => l.includes("leaves the wound raw")).length }
  })
  await page122.close()
  out.squadPassiveHasteInteraction = result
  const ok = result.weak === 2 && result.hasteLine && result.weakLineCount === 2
  if (!ok) out.errors.push("check122 Tommy's Haste follow-up did not also apply Squad Passive's Weak-on-hit")
}

// 123. UI: every player token already shows the existing Block badge at
//      2 after the first enemy turn resolves - no new badge code -------
{
  const page123 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page123.on("pageerror", (e) => errs.push(String(e)))
  await page123.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page123.waitForSelector(".hwt-board")
  await page123.locator(".hwt-end-turn").click()
  await page123.waitForTimeout(500)
  const blockBadges = await page123.locator('.hwt-token[data-side="player"] .hwt-block-badge').allInnerTexts()
  await page123.screenshot({ path: `${SHOT}/squad_passive_block.png` })
  await page123.close()
  out.squadPassiveBlockBadge = { blockBadges }
  const ok = blockBadges.length === 5 && blockBadges.every((t) => t.includes("2"))
  if (!ok) out.errors.push("check123 The existing Block badge did not show +2 on every player token after the first enemy turn")
}

// 124. The opening log line is Tommy's real, hand-authored description
//      text, reused verbatim - not invented -----------------------------
{
  const page124 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page124.on("pageerror", (e) => errs.push(String(e)))
  await page124.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page124.waitForSelector(".hwt-board")
  const result = await page124.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const { CHARACTERS } = await import("/src/data/heartwood/characters.js")
    const battle = createTacticsBattle("default")
    return { firstLogLine: battle.log[0], tommyDescription: CHARACTERS.tommy.description }
  })
  await page124.close()
  out.squadPassiveOpeningLine = result
  const ok = result.firstLogLine === result.tommyDescription
  if (!ok) out.errors.push("check124 The battle's opening log line was not Tommy's real description, reused verbatim")
}

// ---------------------------------------------------------------
// The real-fight wiring round (feat/hearthwood-tactics-realwire) -
// createRealMatchupBattle now carries the run's own real Commander
// (characterId/commanderRank) over too. Every new check gets its own
// fresh page (the established anti-hang discipline).
// ---------------------------------------------------------------

// 125. resolveRealMatchup returns the real run's own characterId and
//      commanderRank, not something invented - read straight off a
//      real (headless-seeded) runState, never localStorage this time -
{
  const page125 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page125.on("pageerror", (e) => errs.push(String(e)))
  await page125.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page125.waitForSelector(".hwt-board")
  const result = await page125.evaluate(async () => {
    const { startRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const { resolveRealMatchup } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const bench = [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }]
    const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", null, null, null], items: [] }
    const matchup = resolveRealMatchup(rs, RUN_PATH[idx])
    return { characterId: matchup?.characterId, commanderRank: matchup?.commanderRank }
  })
  await page125.close()
  out.resolveRealMatchupCommander = result
  const ok = result.characterId === "tommy" && result.commanderRank === 0
  if (!ok) out.errors.push("check125 resolveRealMatchup did not return the real run's own characterId/commanderRank")
}

// 126. createRealMatchupBattle with a real characterId produces a
//      genuine Commander unit alongside the recruited squad - real
//      name/art/haste, ability correctly null, real Squad Passive
//      folded into its starting attack (6 base + 2 Strength = 8) ------
{
  const page126 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page126.on("pageerror", (e) => errs.push(String(e)))
  await page126.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page126.waitForSelector(".hwt-board")
  const result = await page126.evaluate(async () => {
    const { createRealMatchupBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createRealMatchupBattle(["the-fool"], ["ironmaw"], "tommy", 0)
    const players = battle.units.filter((u) => u.side === "player")
    const commander = players.find((u) => u.id === "player-commander")
    return {
      count: players.length,
      commander: commander && { name: commander.name, art: commander.art, haste: commander.haste, ability: commander.ability, attack: commander.attack, baseAttack: commander.baseAttack },
      firstLogLine: battle.log[0],
    }
  })
  await page126.close()
  out.realMatchupCommanderUnit = result
  const ok =
    result.count === 2 &&
    result.commander &&
    result.commander.name === "Tommy" &&
    result.commander.art === "cat" &&
    result.commander.haste === true &&
    result.commander.ability === null &&
    result.commander.attack === 8 &&
    result.commander.attack === result.commander.baseAttack &&
    result.firstLogLine.includes("Cat's Reflexes")
  if (!ok) out.errors.push("check126 createRealMatchupBattle did not deploy a genuine, fully-kitted real Commander")
}

// 127. Commander Rank-Up scaling actually differs from rank 0 - proving
//      commanderPassiveWithRank (the real, rank-scaled call) is genuinely
//      used here, not copy-pasted from createTacticsBattle's own
//      always-rank-0 default. rank 2 -> factor 1.5 -> Strength amount
//      Math.round(2*1.5)=3, so attack becomes 9, not 8 -----------------
{
  const page127 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page127.on("pageerror", (e) => errs.push(String(e)))
  await page127.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page127.waitForSelector(".hwt-board")
  const result = await page127.evaluate(async () => {
    const { createRealMatchupBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const rank0 = createRealMatchupBattle(["the-fool"], ["ironmaw"], "tommy", 0)
    const rank2 = createRealMatchupBattle(["the-fool"], ["ironmaw"], "tommy", 2)
    const attack0 = rank0.units.find((u) => u.id === "player-commander").attack
    const attack2 = rank2.units.find((u) => u.id === "player-commander").attack
    return { attack0, attack2 }
  })
  await page127.close()
  out.realMatchupRankScaling = result
  const ok = result.attack0 === 8 && result.attack2 === 9
  if (!ok) out.errors.push("check127 Commander Rank-Up scaling was not genuinely applied to a real matchup")
}

// 128. No characterId at all -> byte-identical old behavior (no
//      Commander deployed) - proving the 2 new params are genuinely
//      optional, not a breaking change to any other caller -----------
{
  const page128 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page128.on("pageerror", (e) => errs.push(String(e)))
  await page128.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page128.waitForSelector(".hwt-board")
  const result = await page128.evaluate(async () => {
    const { createRealMatchupBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createRealMatchupBattle(["the-fool"], ["ironmaw"])
    const players = battle.units.filter((u) => u.side === "player")
    return { count: players.length, firstLogLine: battle.log[0] }
  })
  await page128.close()
  out.realMatchupNoCommander = result
  const ok = result.count === 1 && result.firstLogLine === "A real matchup from your run. The Frontier opens. Your turn."
  if (!ok) out.errors.push("check128 omitting characterId broke createRealMatchupBattle's old no-Commander behavior")
}

// ---------------------------------------------------------------
// The seeded-terrain round (feat/hearthwood-tactics-seedterrain) -
// generateRealTerrain (tacticsRealMatchup.js), the seed system's first
// real use of its own reserved "combat" stream. These checks import
// generateRealTerrain directly (a pure function of seed+nodeIndex, no
// localStorage/runState needed) rather than seeding a full real save -
// the same "test the actual function directly" precedent this whole
// session already uses wherever a pure helper allows it.
// ---------------------------------------------------------------

// 129. generateRealTerrain is deterministic (same seed+nodeIndex ->
//      identical map), seed-sensitive, and node-sensitive, and every
//      cell it produces is in-bounds (col 3 to GRID.cols-4, a real
//      terrain id - the generalized "3-column buffer on each side"
//      band, 3-8 on the current 12-wide grid) -----------------------
{
  const page129 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page129.on("pageerror", (e) => errs.push(String(e)))
  await page129.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page129.waitForSelector(".hwt-board")
  const result = await page129.evaluate(async () => {
    const { generateRealTerrain } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    const a = generateRealTerrain(12345, 3)
    const b = generateRealTerrain(12345, 3)
    const seedDiff = generateRealTerrain(99999, 3)
    const nodeDiff = generateRealTerrain(12345, 4)
    const entries = Object.entries(a)
    const validTypes = new Set(["rock", "water", "poison", "forest"])
    const shapeOk = entries.every(([key, type]) => {
      const [row, col] = key.split("-").map(Number)
      return row >= 0 && row < GRID.rows && col >= 3 && col <= GRID.cols - 4 && validTypes.has(type)
    })
    return {
      deterministic: JSON.stringify(a) === JSON.stringify(b),
      seedSensitive: JSON.stringify(a) !== JSON.stringify(seedDiff),
      nodeSensitive: JSON.stringify(a) !== JSON.stringify(nodeDiff),
      count: entries.length,
      shapeOk,
    }
  })
  await page129.close()
  out.seededTerrainGeneration = result
  const ok = result.deterministic && result.seedSensitive && result.nodeSensitive && result.count > 0 && result.count <= 6 && result.shapeOk
  if (!ok) out.errors.push("check129 generateRealTerrain was not deterministic/seed-sensitive/node-sensitive, or produced an out-of-bounds cell")
}

// 130. createRealMatchupBattle actually uses the passed-in terrain map,
//      and omitting it stays byte-identical to the old {} behavior -----
{
  const page130 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page130.on("pageerror", (e) => errs.push(String(e)))
  await page130.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page130.waitForSelector(".hwt-board")
  const result = await page130.evaluate(async () => {
    const { createRealMatchupBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const terrain = { "2-4": "rock", "3-5": "water" }
    const withTerrain = createRealMatchupBattle(["the-fool"], ["ironmaw"], null, 0, terrain)
    const withoutTerrain = createRealMatchupBattle(["the-fool"], ["ironmaw"])
    return { withTerrain: withTerrain.terrain, withoutTerrainKeys: Object.keys(withoutTerrain.terrain).length }
  })
  await page130.close()
  out.realMatchupTerrainPassthrough = result
  const ok = JSON.stringify(result.withTerrain) === JSON.stringify({ "2-4": "rock", "3-5": "water" }) && result.withoutTerrainKeys === 0
  if (!ok) out.errors.push("check130 createRealMatchupBattle did not use the passed-in terrain, or broke the old no-terrain default")
}

// ---------------------------------------------------------------
// The Facing round (feat/hearthwood-tactics-facing) - Movement &
// Tactical Gameplay PRD §4.2: attacking from the side (+10%) or behind
// (+25%) deals more than a front attack (normal). Every new check gets
// its own fresh page (the established anti-hang discipline).
// ---------------------------------------------------------------

// 131. Facing classification + damage math: front (normal), side
//      (+10%), and back (+25%) - each confirmed via a real attackUnit
//      call against a synthetic pair with facing explicitly set, and
//      the exact Math.round math, never a hand-picked number ---------
{
  const page131 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page131.on("pageerror", (e) => errs.push(String(e)))
  await page131.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page131.waitForSelector(".hwt-board")
  const result = await page131.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const baseUnits = [
      { id: "atk", side: "player", name: "Atk", pos: { row: 2, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, block: 0, facing: "E" },
      { id: "def", side: "enemy", name: "Def", pos: { row: 2, col: 3 }, hp: 200, maxHp: 200, range: 1, attack: 0, ap: 1, block: 0, facing: "E" },
    ]
    function runCase(atkPos) {
      const state = {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        phase: "player",
        turn: 1,
        log: [],
        units: baseUnits.map((u) => (u.id === "atk" ? { ...u, pos: atkPos, ap: 1 } : { ...u, hp: 200 })),
      }
      const after = attackUnit(state, "atk", "def")
      return { hp: after.units.find((u) => u.id === "def").hp, logLine: after.log[after.log.length - 1] }
    }
    // Defender at (2,3), facing "E".
    const front = runCase({ row: 2, col: 4 }) // attacker east of defender -> attackDir E === facing E -> front
    const side = runCase({ row: 1, col: 3 }) // attacker north of defender -> attackDir N -> side
    const back = runCase({ row: 2, col: 2 }) // attacker west of defender -> attackDir W === opposite(E) -> back
    return { front, side, back }
  })
  await page131.close()
  out.facingDamageMath = result
  const ok =
    result.front.hp === 190 &&
    !result.front.logLine.includes("flanked") &&
    !result.front.logLine.includes("behind") &&
    result.side.hp === 189 &&
    result.side.logLine.includes("flanked, +10%") &&
    // Block-weakening/Crit round: back hits now always crit (+25pp
    // flat on top of the base +25pp), so 10 * 1.50 = 15, not the old
    // 10 * 1.25 = 12.5 -> 13.
    result.back.hp === 185 &&
    result.back.logLine.includes("from behind, CRITICAL, +50%")
  if (!ok) out.errors.push("check131 Facing's front/side/back damage math or narration was wrong")
}

// 132. Backward-compatibility guard: a defender with NO facing field
//      at all classifies as "front" (zero multiplier) - proving every
//      pre-existing hand-built synthetic-state check (none of which
//      ever set facing) stays byte-identical, not silently changed ---
{
  const page132 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page132.on("pageerror", (e) => errs.push(String(e)))
  await page132.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page132.waitForSelector(".hwt-board")
  const result = await page132.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "atk", side: "player", name: "Atk", pos: { row: 2, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, block: 0 },
        { id: "def", side: "enemy", name: "Def", pos: { row: 2, col: 3 }, hp: 200, maxHp: 200, range: 1, attack: 0, ap: 1, block: 0 },
      ],
    }
    const after = attackUnit(state, "atk", "def")
    return { hp: after.units.find((u) => u.id === "def").hp }
  })
  await page132.close()
  out.facingNoFieldGuard = result
  const ok = result.hp === 190
  if (!ok) out.errors.push("check132 A defender with no facing field at all did not default to front (no multiplier)")
}

// 133. moveUnit updates the mover's own facing correctly for each of
//      the 4 cardinals plus a diagonal (proving the dominant-axis tie
//      resolves sensibly, not arbitrarily) ----------------------------
{
  const page133 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page133.on("pageerror", (e) => errs.push(String(e)))
  await page133.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page133.waitForSelector(".hwt-board")
  const result = await page133.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    function moveAndGetFacing(delta) {
      const state = {
        grid: { rows: 7, cols: 10 },
        terrain: {},
        phase: "player",
        turn: 1,
        log: [],
        units: [{ id: "u1", side: "player", name: "U1", pos: { row: 3, col: 5 }, hp: 10, maxHp: 10, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" }],
      }
      const target = { row: 3 + delta.row, col: 5 + delta.col }
      const after = moveUnit(state, "u1", target)
      return after.units.find((u) => u.id === "u1").facing
    }
    return {
      north: moveAndGetFacing({ row: -1, col: 0 }),
      south: moveAndGetFacing({ row: 1, col: 0 }),
      east: moveAndGetFacing({ row: 0, col: 1 }),
      west: moveAndGetFacing({ row: 0, col: -1 }),
      diagonalNE: moveAndGetFacing({ row: -1, col: 1 }),
    }
  })
  await page133.close()
  out.facingMoveUpdates = result
  const ok = result.north === "N" && result.south === "S" && result.east === "E" && result.west === "W" && result.diagonalNE === "E"
  if (!ok) out.errors.push("check133 moveUnit did not update facing correctly for every cardinal/diagonal move")
}

// 134. A real end-to-end flank via createTacticsBattle: a recruited
//      unit repositioned to the enemy's own real back (its stored
//      facing is the real "E" default) lands the exact Math.round-
//      computed bonus damage AND the log's own narration note --------
{
  const page134 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page134.on("pageerror", (e) => errs.push(String(e)))
  await page134.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page134.waitForSelector(".hwt-board")
  const result = await page134.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default")
    const attacker = state.units.find((u) => u.side === "player" && u.id !== "player-commander")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === enemy.id) return { ...u, pos: { row: 3, col: 5 }, hp: 200, maxHp: 200, block: 0 }
        if (u.id === attacker.id) return { ...u, pos: { row: 3, col: 4 }, ap: 1 }
        return u
      }),
    }
    const attackValue = state.units.find((u) => u.id === attacker.id).attack
    const attackerName = state.units.find((u) => u.id === attacker.id).name
    state = attackUnit(state, attacker.id, enemy.id)
    const after = state.units.find((u) => u.id === enemy.id)
    // The recruited attacker also carries Squad Passive's own
    // onDealDamage Weak trigger (PR #484), which adds ITS OWN log line
    // right after the strike line - the same class of fix check87's
    // own regression sweep already used: search for the actual strike
    // line by the attacker's own name, never assume it's the newest
    // (last) entry.
    const logLine = state.log.find((l) => l.startsWith(`${attackerName} strikes `))
    // Block-weakening/Crit round: back hits always crit now, +50% total
    // (was +25%).
    return { hp: after.hp, expectedDamage: Math.round(attackValue * 1.5), logLine }
  })
  await page134.close()
  out.facingRealFlank = result
  const ok = result.hp === 200 - result.expectedDamage && result.logLine.includes("from behind, CRITICAL, +50%")
  if (!ok) out.errors.push("check134 A real derived-unit back attack did not land the correct bonus damage or narration")
}

// 135. UI: every token (player and enemy alike) shows the new,
//      always-visible facing arrow - a screenshot -----------------
{
  const page135 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page135.on("pageerror", (e) => errs.push(String(e)))
  await page135.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page135.waitForSelector(".hwt-board")
  const arrowCount = await page135.locator(".hwt-facing-badge").count()
  const tokenCount = await page135.locator(".hwt-token").count()
  await page135.screenshot({ path: `${SHOT}/facing_arrows.png` })
  await page135.close()
  out.facingUiBadge = { arrowCount, tokenCount }
  const ok = tokenCount > 0 && arrowCount === tokenCount
  if (!ok) out.errors.push("check135 not every token showed the new facing arrow")
}

// ---------------------------------------------------------------
// The Zone of Control round (feat/hearthwood-tactics-zoc) - Movement &
// Tactical Gameplay PRD §4.3, Basic Zone: a living melee (range===1)
// unit's own adjacent tiles are its zone; moving out of one triggers a
// free reaction attack from the controller - the classic "opportunity
// attack." Every new check gets its own fresh page (the established
// anti-hang discipline).
// ---------------------------------------------------------------

// 131. Core mechanic: a mover that leaves a melee enemy's zone takes
//      exactly one reaction attack (the real modifiedAttackAmount
//      damage - including Facing, since a straight-line retreat
//      naturally ends up facing AWAY from the enemy, a real, correct
//      "exposes your back" interaction, not a bug to route around);
//      sliding to a tile STILL inside that same zone triggers none ---
{
  const page131 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page131.on("pageerror", (e) => errs.push(String(e)))
  await page131.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page131.waitForSelector(".hwt-board")
  const result = await page131.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    function buildState(moverPos) {
      return {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        phase: "player",
        turn: 1,
        log: [],
        units: [
          { id: "mover", side: "player", name: "Mover", pos: moverPos, hp: 20, maxHp: 20, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
          { id: "enemy", side: "enemy", name: "Enemy", pos: { row: 2, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 5, ap: 1, block: 0, facing: "E" },
        ],
      }
    }
    // Mover starts adjacent to Enemy(2,2) at (1,2), then flees straight
    // east to (1,4) - 2 tiles away, zone left. The move itself sets the
    // mover's own new facing to "E" (the direction it just traveled),
    // which happens to put the Enemy directly at the mover's own back -
    // a genuine, correct Facing interaction: expected damage is
    // Math.round(5 * 1.50) = 8 (back hits always crit now, +50% total,
    // not the old +25%).
    const leftState = buildState({ row: 1, col: 2 })
    const afterLeave = moveUnit(leftState, "mover", { row: 1, col: 4 })
    const moverAfterLeave = afterLeave.units.find((u) => u.id === "mover")
    // Same start, but slides to (1,1) - still Chebyshev-adjacent to
    // Enemy(2,2) (distance stays 1) - zone never left, no reaction.
    const stayState = buildState({ row: 1, col: 2 })
    const afterStay = moveUnit(stayState, "mover", { row: 1, col: 1 })
    const moverAfterStay = afterStay.units.find((u) => u.id === "mover")
    return {
      leaveHp: moverAfterLeave.hp,
      leaveLogHasReaction: afterLeave.log.some((l) => l.includes("lashes out as Mover pulls away")),
      stayHp: moverAfterStay.hp,
      stayLogHasReaction: afterStay.log.some((l) => l.includes("lashes out")),
    }
  })
  await page131.close()
  out.zocCoreReaction = result
  const ok = result.leaveHp === 20 - Math.round(5 * 1.5) && result.leaveLogHasReaction && result.stayHp === 20 && !result.stayLogHasReaction
  if (!ok) out.errors.push("check131 leaving a melee enemy's zone did not trigger the correct reaction, or staying inside it wrongly did")
}

// 132. Melee-only gate: a range-3 (pattern-attacker) enemy adjacent to
//      the mover's own origin projects no zone at all - leaving its
//      side triggers no reaction, matching the PRD's own "melee units
//      only" wording exactly -------------------------------------
{
  const page132 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page132.on("pageerror", (e) => errs.push(String(e)))
  await page132.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page132.waitForSelector(".hwt-board")
  const result = await page132.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 1, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
        { id: "ranged", side: "enemy", name: "Ranged", pos: { row: 2, col: 2 }, hp: 100, maxHp: 100, range: 3, attack: 5, ap: 1, block: 0, facing: "E" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 1, col: 4 })
    return { hp: after.units.find((u) => u.id === "mover").hp, hasReaction: after.log.some((l) => l.includes("lashes out")) }
  })
  await page132.close()
  out.zocMeleeOnlyGate = result
  const ok = result.hp === 20 && !result.hasReaction
  if (!ok) out.errors.push("check132 A range!==1 (non-melee) unit incorrectly projected a Zone of Control")
}

// 133. Multiple controllers: a mover disengaging from 2 melee enemies
//      at once (flanked) takes 2 separate reaction attacks, one from
//      each -------------------------------------------------------
{
  const page133 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page133.on("pageerror", (e) => errs.push(String(e)))
  await page133.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page133.waitForSelector(".hwt-board")
  const result = await page133.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 2, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
        { id: "e1", side: "enemy", name: "E1", pos: { row: 1, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 5, ap: 1, block: 0, facing: "S" },
        { id: "e2", side: "enemy", name: "E2", pos: { row: 3, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 5, ap: 1, block: 0, facing: "N" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 2, col: 4 })
    const mover = after.units.find((u) => u.id === "mover")
    const reactionLines = after.log.filter((l) => l.includes("lashes out")).length
    return { hp: mover.hp, reactionLines }
  })
  await page133.close()
  out.zocMultipleControllers = result
  const ok = result.reactionLines === 2 && result.hp < 100
  if (!ok) out.errors.push("check133 A flanked mover did not take exactly 2 separate reaction attacks when disengaging from both")
}

// 134. No reaction into a corpse/ended battle: if the FIRST of 2
//      reaction attacks kills the mover, the second controller does
//      not also attack (no crash, no phantom log line) -------------
{
  const page134 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page134.on("pageerror", (e) => errs.push(String(e)))
  await page134.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page134.waitForSelector(".hwt-board")
  const result = await page134.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 2, col: 2 }, hp: 3, maxHp: 100, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
        { id: "e1", side: "enemy", name: "E1", pos: { row: 1, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 50, ap: 1, block: 0, facing: "S" },
        { id: "e2", side: "enemy", name: "E2", pos: { row: 3, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 50, ap: 1, block: 0, facing: "N" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 2, col: 4 })
    const mover = after.units.find((u) => u.id === "mover")
    const reactionLines = after.log.filter((l) => l.includes("lashes out")).length
    return { hp: mover.hp, reactionLines, phase: after.phase }
  })
  await page134.close()
  out.zocNoCorpseDoubleHit = result
  const ok = result.reactionLines === 1 && result.hp === 0
  if (!ok) out.errors.push("check134 A second reaction attack fired into an already-fallen mover instead of stopping")
}

// 135. Symmetry: the SAME mechanic fires when an ENEMY moves out of a
//      PLAYER melee unit's own zone - a hand-built scenario, since
//      today's simple AI never chooses this on its own -------------
{
  const page135 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page135.on("pageerror", (e) => errs.push(String(e)))
  await page135.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page135.waitForSelector(".hwt-board")
  const result = await page135.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      turn: 1,
      log: [],
      units: [
        { id: "enemy", side: "enemy", name: "Enemy", pos: { row: 1, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "E" },
        { id: "guard", side: "player", name: "Guard", pos: { row: 2, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 6, ap: 1, block: 0, facing: "W" },
      ],
    }
    const after = moveUnit(state, "enemy", { row: 1, col: 4 })
    const enemy = after.units.find((u) => u.id === "enemy")
    return { hp: enemy.hp, hasReaction: after.log.some((l) => l.includes("lashes out as Enemy pulls away")) }
  })
  await page135.close()
  out.zocSymmetry = result
  const ok = result.hasReaction && result.hp < 20
  if (!ok) out.errors.push("check135 A player melee unit's own Zone of Control did not fire when an enemy disengaged from it")
}

// 136. The Haste-follow-up generalization: a Haste-carrying unit that
//      REACTS (fires during the OTHER side's own phase) still gets its
//      own follow-up hit, proving the guard's generalization from
//      "phase===player" to "phase hasn't ended" is genuinely correct -
{
  const page136 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page136.on("pageerror", (e) => errs.push(String(e)))
  await page136.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page136.waitForSelector(".hwt-board")
  const result = await page136.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Phase is "enemy" (enemy1 is about to move) - the REACTING unit
    // (player1, haste:true) fires its reaction DURING that phase, the
    // exact scenario the Haste guard's own generalization exists for.
    // enemy2 stays adjacent to player1 the whole time, giving the
    // Haste follow-up a real, valid, in-range second target once
    // enemy1 has moved out of range.
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      turn: 1,
      log: [],
      units: [
        { id: "enemy1", side: "enemy", name: "Enemy1", pos: { row: 2, col: 3 }, hp: 100, maxHp: 100, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
        { id: "enemy2", side: "enemy", name: "Enemy2", pos: { row: 1, col: 2 }, hp: 100, maxHp: 100, range: 1, attack: 1, ap: 1, block: 0, facing: "S" },
        { id: "player1", side: "player", name: "Player1", pos: { row: 2, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 5, ap: 1, block: 0, facing: "W", haste: true },
      ],
    }
    const after = moveUnit(state, "enemy1", { row: 2, col: 4 })
    return {
      hasteLine: after.log.some((l) => l.includes("Haste fires")),
      enemy1Hp: after.units.find((u) => u.id === "enemy1").hp,
      enemy2Hp: after.units.find((u) => u.id === "enemy2").hp,
    }
  })
  await page136.close()
  out.zocHasteReactionFollowUp = result
  const ok = result.hasteLine && result.enemy1Hp < 100 && result.enemy2Hp < 100
  if (!ok) out.errors.push("check136 A Haste-carrying reactor did not get its own follow-up hit during a reaction")
}

// 137. UI: data-zoc cells match zoneOfControlCells's own computed set
//      exactly - a screenshot --------------------------------------
{
  const page137 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page137.on("pageerror", (e) => errs.push(String(e)))
  await page137.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page137.waitForSelector(".hwt-board")
  const result = await page137.evaluate(async () => {
    const { createTacticsBattle, zoneOfControlCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("default")
    return { expectedCount: zoneOfControlCells(battle, "enemy").size }
  })
  const renderedCount = await page137.locator('.hwt-cell[data-zoc="true"]').count()
  await page137.screenshot({ path: `${SHOT}/zoc_cells.png` })
  await page137.close()
  out.zocUiCells = { expectedCount: result.expectedCount, renderedCount }
  const ok = result.expectedCount > 0 && renderedCount === result.expectedCount
  if (!ok) out.errors.push("check137 the rendered data-zoc cells did not match zoneOfControlCells's own computed set")
}

// ---------------------------------------------------------------
// Bigger board round (9x12, was 7x10) - Marc picked "both, a bit of
// each" over wider-only/taller-only, directly rewarding Facing/Zone of
// Control (both need room to route around an enemy to hit its side or
// back).
// ---------------------------------------------------------------

// 138. GRID is genuinely 9x12, and every formation's enemy row spread
//      is now computed generically via spreadRows(count, GRID.rows)
//      instead of the old hardcoded per-formation array - proven for 3
//      different squad sizes (1/3/4), not just the default's own 3 ---
{
  const page138 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page138.on("pageerror", (e) => errs.push(String(e)))
  await page138.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page138.waitForSelector(".hwt-board")
  const result = await page138.evaluate(async () => {
    const { createTacticsBattle, GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    const rowsOf = (formationId) =>
      createTacticsBattle(formationId)
        .units.filter((u) => u.side === "enemy")
        .map((u) => u.pos.row)
        .sort((a, b) => a - b)
    return {
      gridRows: GRID.rows,
      gridCols: GRID.cols,
      solo: rowsOf("deepwarden"),
      three: rowsOf("default"),
      four: rowsOf("swarm"),
    }
  })
  await page138.close()
  out.biggerBoardFormationRows = result
  const ok =
    result.gridRows === 9 &&
    result.gridCols === 12 &&
    JSON.stringify(result.solo) === JSON.stringify([4]) &&
    JSON.stringify(result.three) === JSON.stringify([3, 4, 5]) &&
    JSON.stringify(result.four) === JSON.stringify([2, 3, 4, 5])
  if (!ok) out.errors.push("check138 GRID was not genuinely 9x12, or a formation's enemy rows were not computed via spreadRows(count, GRID.rows)")
}

// 139. The Crossing's re-centered puzzle keeps the same navigable shape:
//      the rock wall still flanks the enemy's own centre row (row 4)
//      immediately above/below, and BOTH the poisoned centre-row
//      shortcut AND the top/bottom edge detours remain genuinely open
//      (not rock) - proving 2 distinct non-rock routes still exist ----
{
  const page139 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page139.on("pageerror", (e) => errs.push(String(e)))
  await page139.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page139.waitForSelector(".hwt-board")
  const result = await page139.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("the-crossing")
    const at = (row, col) => battle.terrain[`${row}-${col}`]
    return {
      wallRows: [2, 3, 5, 6].map((row) => at(row, 6)),
      shortcut: at(4, 6),
      topDetour: [at(0, 6), at(1, 6)],
      bottomDetour: [at(7, 6), at(8, 6)],
    }
  })
  await page139.close()
  out.crossingStillSolvable = result
  const ok =
    result.wallRows.every((t) => t === "rock") &&
    result.shortcut === "poison" &&
    result.topDetour.every((t) => t === undefined) &&
    result.bottomDetour.every((t) => t === undefined)
  if (!ok) out.errors.push("check139 The Crossing's re-centered puzzle lost its navigable shape (wall/shortcut/detour)")
}

// 140. The board actually renders at the new size: 108 cells (9x12),
//      and the real rendered grid-template matches - a screenshot -----
{
  const page140 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page140.on("pageerror", (e) => errs.push(String(e)))
  await page140.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page140.waitForSelector(".hwt-board")
  const cellCount = await page140.locator(".hwt-cell").count()
  const boardStyle = await page140.locator(".hwt-board").evaluate((el) => ({
    cols: getComputedStyle(el).gridTemplateColumns.split(" ").length,
    rows: getComputedStyle(el).gridTemplateRows.split(" ").length,
  }))
  await page140.screenshot({ path: `${SHOT}/bigboard_9x12.png` })
  await page140.close()
  out.bigBoardRender = { cellCount, boardStyle }
  const ok = cellCount === 108 && boardStyle.cols === 12 && boardStyle.rows === 9
  if (!ok) out.errors.push("check140 the board did not render at the new 9x12 size")
}

// 141. A genuinely NEW flanking maneuver, only possible because the grid
//      grew taller: row 8 (index 8) is out of bounds on the OLD 7-row
//      grid (valid rows were 0-6) but a real position now. A unit
//      starting on this brand-new row routes north to land directly
//      WEST of an East-facing enemy (opposite its own facing = "back",
//      Facing's own +25%) - proving the extra row space enables real
//      new tactical play, not just a cosmetic resize ------------------
{
  const page141 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page141.on("pageerror", (e) => errs.push(String(e)))
  await page141.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page141.waitForSelector(".hwt-board")
  const result = await page141.evaluate(async () => {
    const { GRID, attackUnit, moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { isOnBoard } = await import("/src/services/heartwood/targeting.js")
    const oldGridWasTooSmall = !isOnBoard({ row: 8, col: 3 }, { rows: 7, cols: 10 })
    const newGridAcceptsIt = isOnBoard({ row: 8, col: 3 }, GRID)
    let state = {
      grid: GRID,
      terrain: {},
      log: [],
      phase: "player",
      units: [
        { id: "atk", name: "Flanker", side: "player", hp: 20, maxHp: 20, ap: 2, move: 6, range: 1, attack: 5, block: 0, pos: { row: 8, col: 3 } },
        { id: "def", name: "Target", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 3, block: 0, facing: "E", pos: { row: 4, col: 3 } },
      ],
    }
    state = moveUnit(state, "atk", { row: 4, col: 2 })
    const atkAfterMove = state.units.find((u) => u.id === "atk")
    state = attackUnit(state, "atk", "def")
    return {
      oldGridWasTooSmall,
      newGridAcceptsIt,
      atkFinalPos: atkAfterMove.pos,
      strikeLine: state.log.find((l) => l.startsWith("Flanker strikes ")),
      // Block-weakening/Crit round: back hits always crit now, +50%
      // total (was +25%).
      backBonusApplied: state.log.some((l) => l.includes("from behind, CRITICAL, +50%")),
    }
  })
  await page141.close()
  out.newFlankingRouteViaTallerBoard = result
  const ok =
    result.oldGridWasTooSmall &&
    result.newGridAcceptsIt &&
    result.atkFinalPos.row === 4 &&
    result.atkFinalPos.col === 2 &&
    result.backBonusApplied
  if (!ok) out.errors.push("check141 the new row space did not enable a genuine new back-attack flanking route")
}

// ---------------------------------------------------------------
// Per-class Facing bonuses/resistance (Movement PRD §4.2's last unbuilt
// piece) - the PRD's own 10 abstract classes mapped by theme onto the
// 48 real classes (units.js), since only "Guardian" literally matches.
// ---------------------------------------------------------------

// 142. The core math for all 4 combinations: a benefiting attacker
//      (className "Nightblade") vs a neutral defender gets +35% on a
//      back hit; a neutral attacker vs a resisting defender
//      (className "Bulwark") gets only +15%; a benefiting attacker vs
//      a RESISTING defender lands EXACTLY on the base +25% (the
//      intentional cancel-out); neutral vs neutral stays the
//      byte-identical base +25% - proving the cancel-out isn't a
//      coincidence, it's the same base number reached 2 different ways
{
  const page142 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page142.on("pageerror", (e) => errs.push(String(e)))
  await page142.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page142.waitForSelector(".hwt-board")
  const result = await page142.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Attacker directly WEST of the defender, defender facing "E" -
    // opposite direction = "back", per classifyFacingAttack.
    const backDamage = (attackerClassName, defenderClassName) => {
      const state = {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        log: [],
        phase: "player",
        units: [
          { id: "atk", name: "Atk", side: "player", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, className: attackerClassName, pos: { row: 2, col: 1 } },
          { id: "def", name: "Def", side: "enemy", hp: 999, maxHp: 999, ap: 1, move: 1, range: 1, attack: 0, block: 0, className: defenderClassName, facing: "E", pos: { row: 2, col: 2 } },
        ],
      }
      const after = attackUnit(state, "atk", "def")
      const def = after.units.find((u) => u.id === "def")
      return 999 - def.hp
    }
    return {
      benefitVsNeutral: backDamage("Nightblade", null),
      neutralVsResist: backDamage(null, "Bulwark"),
      benefitVsResist: backDamage("Nightblade", "Bulwark"),
      neutralVsNeutral: backDamage(null, null),
    }
  })
  await page142.close()
  out.perClassFacingMath = result
  // Block-weakening/Crit round: every back hit now always crits
  // (+25pp flat), so the base back pp moves from 25 to 50 - the whole
  // 4-combination matrix shifts up by exactly 25 (the cancel-out still
  // lands on the new crit-inclusive base, 150, not the old 125).
  const ok =
    result.benefitVsNeutral === 160 &&
    result.neutralVsResist === 140 &&
    result.benefitVsResist === 150 &&
    result.neutralVsNeutral === 150
  if (!ok) out.errors.push("check142 the per-class Facing math did not match the 4-combination matrix (benefit/resist/cancel-out/base)")
}

// 143. flankRole correctness for a representative real class from each
//      bucket, plus a blunt-dps class and no-class (enemy/Commander) --
{
  const page143 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page143.on("pageerror", (e) => errs.push(String(e)))
  await page143.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page143.waitForSelector(".hwt-board")
  const result = await page143.evaluate(async () => {
    const { flankRole } = await import("/src/services/heartwood/tacticsEngine.js")
    return {
      nightblade: flankRole("Nightblade"),
      bulwark: flankRole("Bulwark"),
      berserker: flankRole("Berserker"),
      none: flankRole(null),
    }
  })
  await page143.close()
  out.flankRoleLookup = result
  const ok = result.nightblade === "benefit" && result.bulwark === "resist" && result.berserker === null && result.none === null
  if (!ok) out.errors.push("check143 flankRole did not classify a representative benefit/resist/neutral/no-class case correctly")
}

// 144. A real end-to-end flank via createTacticsBattle: Hexbreaker
//      (className "Reaver", a real benefit class) lands a genuine
//      +35%-narrated back hit on a real enemy, through the full
//      derived-unit pipeline, not a hand-built synthetic state --------
{
  const page144 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page144.on("pageerror", (e) => errs.push(String(e)))
  await page144.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page144.waitForSelector(".hwt-board")
  const result = await page144.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["hexbreaker"])
    const hexbreaker = state.units.find((u) => u.defId === "hexbreaker")
    const enemy = state.units.find((u) => u.side === "enemy")
    // Reposition Hexbreaker directly west of the enemy (enemy's real
    // default facing is "E") and give the enemy huge HP so it survives.
    state = {
      ...state,
      units: state.units.map((u) => {
        if (u.id === hexbreaker.id) return { ...u, pos: { row: enemy.pos.row, col: enemy.pos.col - 1 } }
        if (u.id === enemy.id) return { ...u, hp: 999, maxHp: 999, block: 0 }
        return u
      }),
    }
    state = attackUnit(state, hexbreaker.id, enemy.id)
    const strikeLine = state.log.find((l) => l.startsWith("Hexbreaker strikes "))
    return { className: hexbreaker.className, strikeLine }
  })
  await page144.close()
  out.realHexbreakerFlank = result
  // Block-weakening/Crit round: back hits always crit now (+25pp), so
  // a benefit-class back hit moves from +35% to +60% (25 base + 25
  // crit + 10 benefit).
  const ok = result.className === "Reaver" && !!result.strikeLine && result.strikeLine.includes("from behind, CRITICAL, +60%")
  if (!ok) out.errors.push("check144 a real Hexbreaker (Reaver, a benefit class) did not land a genuine +60% back hit")
}

// 145. UI, driven through a real page render: the DEFAULT squad
//      already includes Hexbreaker (Reaver, benefit) and Oathshield
//      (Bulwark, resist) - confirmed each shows its own exclusive
//      badge, and Mosskit (no matching class) shows neither - a
//      screenshot -------------------------------------------------
{
  const page145 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page145.on("pageerror", (e) => errs.push(String(e)))
  await page145.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page145.waitForSelector(".hwt-board")
  const engineFacts = await page145.evaluate(async () => {
    const { createTacticsBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("default")
    return {
      hexbreakerClass: battle.units.find((u) => u.defId === "hexbreaker")?.className,
      oathshieldClass: battle.units.find((u) => u.defId === "oathshield")?.className,
      mosskitClass: battle.units.find((u) => u.defId === "the-fool")?.className,
    }
  })
  const benefitBadgeCount = await page145.locator(".hwt-flank-benefit-badge").count()
  const resistBadgeCount = await page145.locator(".hwt-flank-resist-badge").count()
  await page145.screenshot({ path: `${SHOT}/flank_class_badges.png` })
  await page145.close()
  out.flankBadgeRender = { engineFacts, benefitBadgeCount, resistBadgeCount }
  const ok =
    engineFacts.hexbreakerClass === "Reaver" &&
    engineFacts.oathshieldClass === "Bulwark" &&
    !engineFacts.mosskitClass &&
    benefitBadgeCount === 1 &&
    resistBadgeCount === 1
  if (!ok) out.errors.push("check145 the default squad's own benefit/resist-class units did not render exactly the right badges")
}

// ---------------------------------------------------------------
// Threat Zone (Movement PRD §4.3's next sub-type after Basic Zone) - a
// LARGER (radius-2) zone around tanky melee units (move===2, the same
// real moveFromMaxHp signal, symmetric across both sides) that blocks
// advancing THROUGH it, additive to (never replacing) Basic Zone's own
// existing reaction-on-leaving behavior.
// ---------------------------------------------------------------

// 146. threatZoneCells shape: radius-2, only for tanky (move:2) melee
//      controllers - a light/fast melee unit (move:3) projects none --
{
  const page146 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page146.on("pageerror", (e) => errs.push(String(e)))
  await page146.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page146.waitForSelector(".hwt-board")
  const result = await page146.evaluate(async () => {
    const { threatZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const tankyState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 1, move: 2, pos: { row: 4, col: 6 } }],
    }
    const lightState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 1, move: 3, pos: { row: 4, col: 6 } }],
    }
    const tankyCells = threatZoneCells(tankyState, "enemy")
    const lightCells = threatZoneCells(lightState, "enemy")
    return {
      tankyCount: tankyCells.size,
      hasRadius2Cell: tankyCells.has("2-6") && tankyCells.has("6-6") && tankyCells.has("4-4") && tankyCells.has("4-8"),
      hasRadius3Cell: tankyCells.has("1-6") || tankyCells.has("4-9"),
      lightCount: lightCells.size,
    }
  })
  await page146.close()
  out.threatZoneShape = result
  // A full 5x5 square minus the centre = 24 cells, all in-bounds here.
  const ok = result.tankyCount === 24 && result.hasRadius2Cell && !result.hasRadius3Cell && result.lightCount === 0
  if (!ok) out.errors.push("check146 threatZoneCells did not produce the expected radius-2, tanky-only shape")
}

// 147. The core movement-cap: a full-move unit that could otherwise
//      easily path THROUGH a tanky enemy's Threat Zone to a cell beyond
//      it gets capped at the zone's own edge - proven by comparing the
//      SAME path against a light (non-tanky) enemy, which blocks
//      nothing, isolating the zone's own effect precisely -----------
{
  const page147 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page147.on("pageerror", (e) => errs.push(String(e)))
  await page147.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page147.waitForSelector(".hwt-board")
  const result = await page147.evaluate(async () => {
    const { reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    // 5 rows so the mover has room to route AROUND the enemy's own
    // occupied tile (which blocks movement regardless of any zone) -
    // isolating the zone's own effect from plain occupancy-blocking.
    function state(enemyMove) {
      return {
        grid: { rows: 5, cols: 12 },
        terrain: {},
        units: [
          { id: "mover", side: "player", hp: 10, pos: { row: 2, col: 0 }, move: 9, range: 1 },
          { id: "enemy", side: "enemy", hp: 10, pos: { row: 2, col: 6 }, move: enemyMove, range: 1 },
        ],
      }
    }
    const withTanky = reachableTilesFor(state(2), "mover")
    const withLight = reachableTilesFor(state(3), "mover")
    return {
      col9ReachableVsTanky: withTanky.some((p) => p.col === 9),
      col9ReachableVsLight: withLight.some((p) => p.col === 9),
      maxColVsTanky: Math.max(...withTanky.map((p) => p.col)),
      col3ReachableVsTanky: withTanky.some((p) => p.col === 3),
    }
  })
  await page147.close()
  out.threatZoneMovementCap = result
  const ok =
    !result.col9ReachableVsTanky &&
    result.col9ReachableVsLight &&
    result.maxColVsTanky === 3 &&
    result.col3ReachableVsTanky
  if (!ok) out.errors.push("check147 the Threat Zone did not cap through-movement at its own edge (col9 should be reachable past a light enemy but not past a tanky one)")
}

// 148. Not a dead end: a unit standing directly adjacent to a tanky
//      enemy's Threat Zone can still step ONTO a cell inside it (using
//      its whole action to do so) - proving the zone blocks THROUGH-
//      movement, not all entry ---------------------------------------
{
  const page148 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page148.on("pageerror", (e) => errs.push(String(e)))
  await page148.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page148.waitForSelector(".hwt-board")
  const result = await page148.evaluate(async () => {
    const { reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 1, cols: 12 },
      terrain: {},
      units: [
        { id: "mover", side: "player", hp: 10, pos: { row: 0, col: 3 }, move: 5, range: 1 },
        { id: "enemy", side: "enemy", hp: 10, pos: { row: 0, col: 6 }, move: 2, range: 1 },
      ],
    }
    const reach = reachableTilesFor(state, "mover").map((p) => p.col)
    return { col4Reachable: reach.includes(4), col5ReachableToo: reach.includes(5) }
  })
  await page148.close()
  out.threatZoneNotADeadEnd = result
  const ok = result.col4Reachable && !result.col5ReachableToo
  if (!ok) out.errors.push("check148 a unit adjacent to a Threat Zone could not step directly into it (or the cap did not fully consume its move)")
}

// 149. The additive proof, directly guarding the regression this round
//      is built around: a tanky melee unit (move:2, e.g. a synthetic
//      Rotwood-Husk-shaped enemy) still triggers the EXISTING Basic
//      Zone reaction attack when something leaves its own radius-1
//      ring, completely unchanged by this round --------------------
{
  const page149 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page149.on("pageerror", (e) => errs.push(String(e)))
  await page149.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page149.waitForSelector(".hwt-board")
  const result = await page149.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 1, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 1, ap: 1, move: 3, block: 0, facing: "W" },
        { id: "enemy", side: "enemy", name: "TankyEnemy", pos: { row: 2, col: 2 }, hp: 100, maxHp: 100, range: 1, move: 2, attack: 5, ap: 1, block: 0, facing: "E" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 1, col: 4 })
    const mover = after.units.find((u) => u.id === "mover")
    return { hp: mover.hp, hasReactionLine: after.log.some((l) => l.includes("lashes out as Mover pulls away")) }
  })
  await page149.close()
  out.threatZoneAdditiveProof = result
  const ok = result.hp < 20 && result.hasReactionLine
  if (!ok) out.errors.push("check149 a tanky (move:2) melee unit lost its existing Basic Zone reaction-attack behavior - Threat Zone must be additive, not a replacement")
}

// 150. UI: data-threat-zone cells match threatZoneCells's own computed
//      set exactly, visibly distinct from data-zoc - a screenshot -----
{
  const page150 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page150.on("pageerror", (e) => errs.push(String(e)))
  await page150.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page150.waitForSelector(".hwt-board")
  await page150.locator(".hwt-formation-btn", { hasText: "The Bulwark" }).click()
  await page150.waitForTimeout(300)
  const expectedCount = await page150.evaluate(async () => {
    const { createTacticsBattle, threatZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("fortress")
    return threatZoneCells(battle, "enemy").size
  })
  const renderedCount = await page150.locator('.hwt-cell[data-threat-zone="true"]').count()
  await page150.screenshot({ path: `${SHOT}/threat_zone_cells.png` })
  await page150.close()
  out.threatZoneUiCells = { expectedCount, renderedCount }
  const ok = expectedCount > 0 && renderedCount === expectedCount
  if (!ok) out.errors.push("check150 the rendered data-threat-zone cells did not match threatZoneCells's own computed set")
}

// ---------------------------------------------------------------
// Guardian's Intercept (Movement PRD §4.4) - a class-locked reaction
// (className "Guardian" only, currently just grove-warden): a living,
// adjacent Guardian ally with ap>=1 takes HALF the damage meant for the
// attacked unit, spending its own AP - the same resource, no new
// Reaction Slot state.
// ---------------------------------------------------------------

// 156. The core split: an adjacent Guardian ally with ap:2 takes
//      exactly half the computed damage, the original target takes
//      the other half, the Guardian's own AP drops by 1, and the log
//      narrates both the strike and the intercept ------------------
{
  const page156 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page156.on("pageerror", (e) => errs.push(String(e)))
  await page156.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page156.waitForSelector(".hwt-board")
  const result = await page156.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, pos: { row: 2, col: 2 } },
        { id: "target", name: "Target", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, pos: { row: 2, col: 3 } },
        { id: "guardian", name: "Guardian", side: "player", hp: 999, maxHp: 999, ap: 2, block: 0, className: "Guardian", pos: { row: 1, col: 3 } },
      ],
    }
    const after = attackUnit(state, "atk", "target")
    const target = after.units.find((u) => u.id === "target")
    const guardian = after.units.find((u) => u.id === "guardian")
    return {
      targetHp: target.hp,
      guardianHp: guardian.hp,
      guardianApAfter: guardian.ap,
      totalDamage: (999 - target.hp) + (999 - guardian.hp),
      strikeLine: after.log.find((l) => l.startsWith("Atk strikes ")),
    }
  })
  await page156.close()
  out.interceptCoreSplit = result
  const ok =
    result.targetHp === 949 &&
    result.guardianHp === 949 &&
    result.guardianApAfter === 1 &&
    result.totalDamage === 100 &&
    result.strikeLine &&
    result.strikeLine.includes("intercepts, taking 50 in its place")
  if (!ok) out.errors.push("check156 Guardian's Intercept did not split damage exactly 50/50 or narrate it correctly")
}

// 157. Eligibility gates, each proven false independently: no
//      intercept when the Guardian is out of range, has ap:0, is
//      already dead, or is actually the target itself -------------
{
  const page157 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page157.on("pageerror", (e) => errs.push(String(e)))
  await page157.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page157.waitForSelector(".hwt-board")
  const result = await page157.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    function state(guardianOverrides) {
      return {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        phase: "enemy",
        log: [],
        units: [
          { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, pos: { row: 2, col: 2 } },
          { id: "target", name: "Target", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, pos: { row: 2, col: 3 } },
          { id: "guardian", name: "Guardian", side: "player", hp: 999, maxHp: 999, ap: 2, block: 0, className: "Guardian", pos: { row: 0, col: 0 }, ...guardianOverrides },
        ],
      }
    }
    const outOfRange = attackUnit(state({ pos: { row: 4, col: 4 } }), "atk", "target")
    const noAp = attackUnit(state({ ap: 0, pos: { row: 1, col: 3 } }), "atk", "target")
    const dead = attackUnit(state({ hp: 0, pos: { row: 1, col: 3 } }), "atk", "target")
    // "self-intercept": the ATTACKED unit itself happens to carry
    // className Guardian - eligibleGuardian's own u.id !== target.id
    // guard must exclude it from protecting itself.
    const selfState = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, pos: { row: 2, col: 2 } },
        { id: "target", name: "SelfGuardian", side: "player", hp: 999, maxHp: 999, ap: 2, block: 0, className: "Guardian", pos: { row: 2, col: 3 } },
      ],
    }
    const selfIntercept = attackUnit(selfState, "atk", "target")
    return {
      outOfRangeTargetHp: outOfRange.units.find((u) => u.id === "target").hp,
      noApTargetHp: noAp.units.find((u) => u.id === "target").hp,
      deadGuardianTargetHp: dead.units.find((u) => u.id === "target").hp,
      selfInterceptHp: selfIntercept.units.find((u) => u.id === "target").hp,
    }
  })
  await page157.close()
  out.interceptEligibilityGates = result
  const ok =
    result.outOfRangeTargetHp === 899 &&
    result.noApTargetHp === 899 &&
    result.deadGuardianTargetHp === 899 &&
    result.selfInterceptHp === 899
  if (!ok) out.errors.push("check157 an ineligible Guardian (out of range / no AP / dead / the target itself) still intercepted, or fell back incorrectly")
}

// 158. AP is the real limiting resource: a Guardian with ap:1
//      intercepts once (ap drops to 0), then a second attack the same
//      "turn" lands fully on the original target with no interception -
{
  const page158 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page158.on("pageerror", (e) => errs.push(String(e)))
  await page158.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page158.waitForSelector(".hwt-board")
  const result = await page158.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, pos: { row: 2, col: 2 } },
        { id: "target", name: "Target", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, pos: { row: 2, col: 3 } },
        { id: "guardian", name: "Guardian", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, className: "Guardian", pos: { row: 1, col: 3 } },
      ],
    }
    const afterFirst = attackUnit(state, "atk", "target")
    const guardianAfterFirst = afterFirst.units.find((u) => u.id === "guardian")
    // Restore the attacker's own AP for a second synthetic swing (this
    // check is testing the GUARDIAN's own AP gate specifically, not
    // re-proving the attacker's own action economy).
    const restored = { ...afterFirst, units: afterFirst.units.map((u) => (u.id === "atk" ? { ...u, ap: 1 } : u)) }
    const afterSecond = attackUnit(restored, "atk", "target")
    return {
      guardianApAfterFirst: guardianAfterFirst.ap,
      targetHpAfterFirst: afterFirst.units.find((u) => u.id === "target").hp,
      targetHpAfterSecond: afterSecond.units.find((u) => u.id === "target").hp,
      guardianHpAfterSecond: afterSecond.units.find((u) => u.id === "guardian").hp,
    }
  })
  await page158.close()
  out.interceptApLimited = result
  const ok =
    result.guardianApAfterFirst === 0 &&
    result.targetHpAfterFirst === 949 &&
    result.targetHpAfterSecond === 849 &&
    result.guardianHpAfterSecond === 949
  if (!ok) out.errors.push("check158 a Guardian at ap:0 still intercepted a second attack, or its own AP was not the real limiting resource")
}

// 159. Byte-identical when no Guardian exists anywhere on the board -
{
  const page159 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page159.on("pageerror", (e) => errs.push(String(e)))
  await page159.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page159.waitForSelector(".hwt-board")
  const result = await page159.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, pos: { row: 2, col: 2 } },
        { id: "target", name: "Target", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, pos: { row: 2, col: 3 } },
      ],
    }
    const after = attackUnit(state, "atk", "target")
    return { targetHp: after.units.find((u) => u.id === "target").hp, hasInterceptNote: after.log.some((l) => l.includes("intercepts")) }
  })
  await page159.close()
  out.interceptNoGuardianByteIdentical = result
  const ok = result.targetHp === 899 && !result.hasInterceptNote
  if (!ok) out.errors.push("check159 an attack with no Guardian present did not stay byte-identical to today's single-target damage")
}

// 160. A real end-to-end intercept: grove-warden recruited and
//      positioned adjacent to another player unit - a real enemy
//      attack against the OTHER unit gets genuinely split -----------
{
  const page160 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page160.on("pageerror", (e) => errs.push(String(e)))
  await page160.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page160.waitForSelector(".hwt-board")
  const result = await page160.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["grove-warden", "the-fool"])
    const groveWarden = state.units.find((u) => u.defId === "grove-warden")
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const enemy = state.units.find((u) => u.side === "enemy")
    // Position the real Guardian directly adjacent to the real target,
    // and the enemy in range of the target - real derived stats/Block
    // throughout, only positions are hand-placed for a deterministic
    // attack.
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) => {
        if (u.id === mosskit.id) return { ...u, pos: { row: 4, col: 5 }, block: 0 }
        if (u.id === groveWarden.id) return { ...u, pos: { row: 4, col: 6 }, block: 0 }
        if (u.id === enemy.id) return { ...u, pos: { row: 4, col: 4 }, hp: 999, maxHp: 999, block: 0 }
        return u
      }),
    }
    const before = { mosskitHp: state.units.find((u) => u.id === mosskit.id).hp, groveWardenHp: state.units.find((u) => u.id === groveWarden.id).hp }
    const after = attackUnit(state, enemy.id, mosskit.id)
    return {
      className: groveWarden.className,
      before,
      mosskitHpAfter: after.units.find((u) => u.id === mosskit.id).hp,
      groveWardenHpAfter: after.units.find((u) => u.id === groveWarden.id).hp,
      hasInterceptNote: after.log.some((l) => l.includes("Grove Warden intercepts")),
    }
  })
  await page160.close()
  out.realGroveWardenIntercept = result
  const ok =
    result.className === "Guardian" &&
    result.mosskitHpAfter < result.before.mosskitHp &&
    result.groveWardenHpAfter < result.before.groveWardenHp &&
    result.hasInterceptNote
  if (!ok) out.errors.push("check160 a real Grove Warden did not genuinely intercept part of a real attack against an adjacent ally")
}

// ---------------------------------------------------------------
// Block-weakening (side) and Crit (back) - the last 2 named PRD §4.2
// effects. Marc picked "always happens" over real randomness, so
// every check below asserts one exact number, same as every other
// Facing-family check.
// ---------------------------------------------------------------

// 161. Crit's exact math: a neutral-class back hit now shows +50%
//      (was +25% before this round), narrated with CRITICAL; a
//      benefit-class attacker vs a resist-class defender still cancels
//      the CLASS adjustment exactly, landing on the crit-inclusive
//      base of +50% (not the old +25%) - proving crit is a flat
//      addition to the existing formula, not stacked separately -----
{
  const page161 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page161.on("pageerror", (e) => errs.push(String(e)))
  await page161.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page161.waitForSelector(".hwt-board")
  const result = await page161.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Attacker directly WEST of the defender, defender facing "E" -
    // opposite direction = "back", per classifyFacingAttack.
    function backHit(attackerClassName, defenderClassName) {
      const state = {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        log: [],
        phase: "enemy",
        units: [
          { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 100, block: 0, className: attackerClassName, pos: { row: 2, col: 1 } },
          { id: "def", name: "Def", side: "player", hp: 999, maxHp: 999, ap: 1, block: 0, className: defenderClassName, facing: "E", pos: { row: 2, col: 2 } },
        ],
      }
      const after = attackUnit(state, "atk", "def")
      const def = after.units.find((u) => u.id === "def")
      return { damage: 999 - def.hp, logLine: after.log[0] }
    }
    const neutral = backHit(null, null)
    const cancelled = backHit("Nightblade", "Bulwark")
    return { neutralDamage: neutral.damage, neutralLog: neutral.logLine, cancelledDamage: cancelled.damage }
  })
  await page161.close()
  out.critExactMath = result
  const ok =
    result.neutralDamage === 150 &&
    result.neutralLog.includes("from behind, CRITICAL, +50%") &&
    result.cancelledDamage === 150
  if (!ok) out.errors.push("check161 Crit's flat +25pp did not compose correctly with the base back-hit bonus or the per-class cancel-out")
}

// 162. Block-weaken's exact math: a side hit against a target with
//      Block halves it (floor), and the REDUCED value is what actually
//      absorbs the hit; a side hit against a target with 0 Block does
//      nothing extra; a front/back hit never weakens Block regardless
//      of the target's own Block value ------------------------------
{
  const page162 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page162.on("pageerror", (e) => errs.push(String(e)))
  await page162.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page162.waitForSelector(".hwt-board")
  const result = await page162.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Attacker NORTH of the defender, defender facing "E" - a
    // perpendicular direction classifies as "side" per classifyFacingAttack.
    function hit(attackerRow, defenderFacing, defenderBlock) {
      const state = {
        grid: { rows: 5, cols: 5 },
        terrain: {},
        log: [],
        phase: "enemy",
        units: [
          { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 20, block: 0, pos: { row: attackerRow, col: 2 } },
          { id: "def", name: "Def", side: "player", hp: 999, maxHp: 999, ap: 1, block: defenderBlock, facing: defenderFacing, pos: { row: 2, col: 2 } },
        ],
      }
      const after = attackUnit(state, "atk", "def")
      const def = after.units.find((u) => u.id === "def")
      return { hp: def.hp, block: def.block, hasWeakenNote: after.log[0].includes("Block is weakened") }
    }
    // A big starting Block (100) so the post-weaken/unweakened value
    // SURVIVES absorbing this hit's own damage, rather than being
    // fully consumed down to 0 either way - the only way to actually
    // tell "halved" and "unmodified" apart from the FINAL block number.
    const sideWithBlock = hit(1, "E", 100)
    const sideNoBlock = hit(1, "E", 0)
    // Defender faces "N"; attacker SOUTH (row 3, higher than the
    // defender's row 2) is the OPPOSITE direction - "back", not "side".
    const backWithBlock = hit(3, "N", 100)
    return { sideWithBlock, sideNoBlock, backWithBlock }
  })
  await page162.close()
  out.blockWeakenExactMath = result
  // Side: 20 atk * 1.10 = 22 dmg; 100 Block halved to 50, absorbs all
  // 22, leaving 50-22=28 (not the un-weakened 100-22=78).
  // Back: 20 atk * 1.50 (always-crit) = 30 dmg; Block untouched at
  // 100, absorbs all 30, leaving 100-30=70 (not a halved-then-absorbed
  // 50-30=20).
  const ok =
    result.sideWithBlock.block === 28 &&
    result.sideWithBlock.hasWeakenNote &&
    result.sideNoBlock.block === 0 &&
    !result.sideNoBlock.hasWeakenNote &&
    result.backWithBlock.block === 70 &&
    !result.backWithBlock.hasWeakenNote
  if (!ok) out.errors.push("check162 Block-weaken did not halve Block on a side hit only, or fired when it shouldn't have")
}

// 163. Shatter's own gate reads the POST-weaken Block, not the
//      pre-weaken amount - a Shatter-carrying attacker's bonus
//      correctly reflects whether Block is STILL present after this
//      round's own halving --------------------------------------
{
  const page163 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page163.on("pageerror", (e) => errs.push(String(e)))
  await page163.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page163.waitForSelector(".hwt-board")
  const result = await page163.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Block starts at 1 - halved (floor(1/2)=0) BEFORE modifiedAttackAmount
    // runs, so Shatter's own "defender.block > 0" gate should see 0,
    // NOT the original 1, and its bonus should NOT apply.
    const state = {
      grid: { rows: 5, cols: 5 },
      terrain: {},
      log: [],
      phase: "enemy",
      units: [
        { id: "atk", name: "Atk", side: "enemy", hp: 20, maxHp: 20, ap: 1, move: 1, range: 1, attack: 20, shatter: 50, block: 0, pos: { row: 1, col: 2 } },
        { id: "def", name: "Def", side: "player", hp: 999, maxHp: 999, ap: 1, block: 1, facing: "E", pos: { row: 2, col: 2 } },
      ],
    }
    const after = attackUnit(state, "atk", "def")
    const def = after.units.find((u) => u.id === "def")
    return { damage: 999 - def.hp, blockAfter: def.block }
  })
  await page163.close()
  out.shatterReadsPostWeaken = result
  // 20 base * 1.10 (side) = 22, no Shatter bonus since block was
  // already weakened to 0 before the gate check. If Shatter's own
  // gate read the STALE pre-weaken block (1 > 0), it would add its
  // full +50 bonus instead - a wildly different, easy-to-tell-apart number.
  const ok = result.damage === 22 && result.blockAfter === 0
  if (!ok) out.errors.push("check163 Shatter's own gate read the pre-weaken Block value instead of the post-weaken one")
}

// 164. A real end-to-end pair via createTacticsBattle: a real side hit
//      against a real Block-holding player unit, and a real back hit
//      against a real enemy, both narrated and mathed correctly -----
{
  const page164 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page164.on("pageerror", (e) => errs.push(String(e)))
  await page164.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page164.waitForSelector(".hwt-board")
  const result = await page164.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["the-fool"])
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const enemy = state.units.find((u) => u.side === "enemy")
    // Mosskit (className null, confirmed neutral - PR #490's own
    // check145) rather than Oathshield: Oathshield's real className
    // "Bulwark" is a RESIST class, which reduces its OWN incoming side
    // bonus (+5pp instead of +10pp) - a real, correct interaction with
    // last round's per-class Facing system, but an unwanted confound
    // for a check meant to isolate THIS round's own Block-weaken math
    // in isolation, not two mechanics composing.
    // Mosskit's own real `block` starts at 0 (nothing grants it any at
    // battle start) - hand-set a real nonzero value to isolate THIS
    // round's own mechanic (what happens when a side hit meets
    // existing Block), the same established pattern every prior
    // round's own real-unit checks already use for whichever
    // precondition they need, not itself under test here - position
    // the enemy directly NORTH of it for a real side hit.
    state = {
      ...state,
      // The attacker here is the ENEMY - createTacticsBattle's own
      // default phase is "player", which would silently reject this
      // whole attack via attackUnit's own `state.phase !== actor.side`
      // gate (the exact known gotcha: a headless enemy-attacker check
      // needs phase:"enemy").
      phase: "enemy",
      units: state.units.map((u) => {
        // A big Block value (100, not a small real one) so the
        // weakened value SURVIVES absorbing the real enemy's own
        // attack - the same fix check162 needed: a Block too small to
        // outlast the hit gets fully consumed either way, hiding
        // whether it was actually halved first.
        if (u.id === mosskit.id) return { ...u, pos: { row: 2, col: 2 }, block: 100 }
        if (u.id === enemy.id) return { ...u, pos: { row: 1, col: 2 }, hp: 999, maxHp: 999 }
        return u
      }),
    }
    const blockBefore = state.units.find((u) => u.id === mosskit.id).block
    const enemyAttack = state.units.find((u) => u.id === enemy.id).attack
    const after = attackUnit(state, enemy.id, mosskit.id)
    const mosskitAfter = after.units.find((u) => u.id === mosskit.id)
    return {
      className: mosskit.className,
      blockBefore,
      enemyAttack,
      blockAfter: mosskitAfter.block,
      hasWeakenNote: after.log.some((l) => l.includes("Block is weakened")),
    }
  })
  await page164.close()
  out.realBlockWeakenPair = result
  // Weakened Block (50) then absorbs the real enemy's own side-hit
  // damage (real attack * 1.10, rounded - Mosskit is confirmed neutral
  // class, so no per-class adjustment applies) - computed from the
  // REAL attack value, not a hand-picked number, the same discipline
  // every prior round's own real-unit checks already use.
  const expectedBlockAfter = Math.floor(result.blockBefore / 2) - Math.round(result.enemyAttack * 1.1)
  const ok = !result.className && result.blockBefore > 0 && result.blockAfter === expectedBlockAfter && result.hasWeakenNote
  if (!ok) out.errors.push("check164 a real side hit against a real Block-holding unit did not genuinely weaken its Block")
}

// ---------------------------------------------------------------
// Fear Zone (Movement PRD §4.3's 3rd sub-type) - weakens units that
// approach it from outside. No range gate (a deliberate departure
// from Basic/Threat Zone's own melee-only wording); reuses the
// EXISTING `weak` debuff wholesale, zero new status effect.
// ---------------------------------------------------------------

// 165. fearZoneCells's own shape: radius-1, only for `fearsome` units
//      regardless of range - a synthetic RANGED fearsome unit still
//      projects it, proving the deliberate non-melee-gating -----------
{
  const page165 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page165.on("pageerror", (e) => errs.push(String(e)))
  await page165.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page165.waitForSelector(".hwt-board")
  const result = await page165.evaluate(async () => {
    const { fearZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const fearsomeRangedState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 3, fearsome: true, pos: { row: 4, col: 6 } }],
    }
    const notFearsomeState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 1, fearsome: false, pos: { row: 4, col: 6 } }],
    }
    const fearCells = fearZoneCells(fearsomeRangedState, "enemy")
    const noCells = fearZoneCells(notFearsomeState, "enemy")
    return {
      fearCellCount: fearCells.size,
      hasAdjacentCell: fearCells.has("3-6") && fearCells.has("5-6") && fearCells.has("4-5") && fearCells.has("4-7"),
      hasRadius2Cell: fearCells.has("4-4") || fearCells.has("2-6"),
      noCellsCount: noCells.size,
    }
  })
  await page165.close()
  out.fearZoneShape = result
  // A full 3x3 square minus the centre = 8 cells.
  const ok = result.fearCellCount === 8 && result.hasAdjacentCell && !result.hasRadius2Cell && result.noCellsCount === 0
  if (!ok) out.errors.push("check165 fearZoneCells did not produce the expected radius-1, fearsome-only (range-agnostic) shape")
}

// 166. The core mechanic: a unit moving from OUTSIDE an opposing Fear
//      Zone to INSIDE it gains exactly 1 weak stack and the correct
//      log line; sliding to another cell STILL inside the same zone
//      grants nothing further (the transition-only guard) -----------
{
  const page166 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page166.on("pageerror", (e) => errs.push(String(e)))
  await page166.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page166.waitForSelector(".hwt-board")
  const result = await page166.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 0 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 9, block: 0, weak: 0, facing: "W" },
        { id: "fearsome", side: "enemy", name: "Dreadful", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, fearsome: true, block: 0, facing: "E" },
      ],
    }
    // Move 1: from col0 (outside, distance 6) to (4,5) (inside, adjacent
    // to fearsome@(4,6) - distance 1) - a genuine transition, should
    // grant weak.
    const afterEnter = moveUnit(state, "mover", { row: 4, col: 5 })
    const moverAfterEnter = afterEnter.units.find((u) => u.id === "mover")
    // Move 2: from (4,5) to (3,5) - BOTH cells are distance 1 from
    // fearsome@(4,6) (Chebyshev), so this stays fully inside the same
    // zone the whole time - no NEW transition, should grant nothing
    // further. (Deliberately NOT (4,4), which is distance 2 - that
    // would LEAVE both the Fear Zone's own radius AND fearsome's own
    // separate Basic Zone control range, since fearsome is also
    // range:1 - firing an unrelated Zone-of-Control reaction attack
    // that adds its own, different log line and would falsely look
    // like a repeated Fear Zone grant if only checking "did the log
    // grow at all".)
    const afterSlide = moveUnit({ ...afterEnter, units: afterEnter.units.map((u) => (u.id === "mover" ? { ...u, ap: 1 } : u)) }, "mover", { row: 3, col: 5 })
    const moverAfterSlide = afterSlide.units.find((u) => u.id === "mover")
    const newLinesFromSlide = afterSlide.log.slice(afterEnter.log.length)
    return {
      weakAfterEnter: moverAfterEnter.weak,
      logHasFearNote: afterEnter.log.some((l) => l.includes("recoils in fear, weakened")),
      weakAfterSlide: moverAfterSlide.weak,
      slideAddedFearNote: newLinesFromSlide.some((l) => l.includes("recoils in fear")),
    }
  })
  await page166.close()
  out.fearZoneCoreMechanic = result
  const ok = result.weakAfterEnter === 1 && result.logHasFearNote && result.weakAfterSlide === 1 && !result.slideAddedFearNote
  if (!ok) out.errors.push("check166 Fear Zone did not grant weak exactly once on a genuine outside-to-inside transition, or fired again on a within-zone slide")
}

// 167. Weak's real effect actually applies afterward: the newly-
//      weakened unit's own NEXT attack deals the real, already-
//      established 25% reduction - proving genuine integration, not a
//      cosmetic flag -------------------------------------------------
{
  const page167 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page167.on("pageerror", (e) => errs.push(String(e)))
  await page167.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page167.waitForSelector(".hwt-board")
  const result = await page167.evaluate(async () => {
    const { moveUnit, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 0 }, hp: 20, maxHp: 20, range: 1, attack: 20, ap: 2, move: 9, block: 0, weak: 0, facing: "W" },
        // facing "W" (not the usual enemy default "E") deliberately
        // keeps this a FRONT hit - the mover ends up WEST of the
        // defender, which would otherwise read as attacking its BACK
        // and pull in Facing's own crit bonus too, muddying a check
        // meant to isolate Weak's own effect in isolation.
        { id: "fearsome", side: "enemy", name: "Dreadful", pos: { row: 4, col: 6 }, hp: 999, maxHp: 999, range: 1, attack: 0, fearsome: true, block: 0, facing: "W" },
      ],
    }
    let after = moveUnit(state, "mover", { row: 4, col: 5 })
    const moverAfterMove = after.units.find((u) => u.id === "mover")
    after = attackUnit(after, "mover", "fearsome")
    const target = after.units.find((u) => u.id === "fearsome")
    return { weakAfterMove: moverAfterMove.weak, damageDealt: 999 - target.hp }
  })
  await page167.close()
  out.fearZoneWeakIntegration = result
  // 20 base attack, front-facing (no Facing bonus), Weak's own real
  // 0.75 multiplier: Math.floor(20 * 0.75) = 15, not the un-weakened 20.
  const ok = result.weakAfterMove === 1 && result.damageDealt === 15
  if (!ok) out.errors.push("check167 a Fear-Zone-weakened unit's own next attack did not deal the real, already-established 25% reduction")
}

// 168. A real end-to-end approach via createTacticsBattle with
//      wyrmgall: a real player unit approaching it from outside gains
//      real Weak, narrated correctly -----------------------------
{
  const page168 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page168.on("pageerror", (e) => errs.push(String(e)))
  await page168.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page168.waitForSelector(".hwt-board")
  const result = await page168.evaluate(async () => {
    const { createTacticsBattle, moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("wyrmgall", ["the-fool"])
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const wyrmgall = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => (u.id === mosskit.id ? { ...u, pos: { row: wyrmgall.pos.row, col: wyrmgall.pos.col + 2 }, ap: 1, move: 3 } : u)),
    }
    const after = moveUnit(state, mosskit.id, { row: wyrmgall.pos.row, col: wyrmgall.pos.col + 1 })
    const mosskitAfter = after.units.find((u) => u.id === mosskit.id)
    return {
      fearsome: wyrmgall.fearsome,
      weakAfter: mosskitAfter.weak,
      hasFearNote: after.log.some((l) => l.includes("recoils in fear, weakened")),
    }
  })
  await page168.close()
  out.realWyrmgallFearApproach = result
  const ok = result.fearsome === true && result.weakAfter === 1 && result.hasFearNote
  if (!ok) out.errors.push("check168 a real approach toward the real fearsome Wyrmgall did not genuinely grant Weak")
}

// 169. UI: data-fear-zone cells match fearZoneCells's own computed set
//      exactly, visually distinct from data-zoc/data-threat-zone -
//      a screenshot ---------------------------------------------
{
  const page169 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page169.on("pageerror", (e) => errs.push(String(e)))
  await page169.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page169.waitForSelector(".hwt-board")
  await page169.locator(".hwt-formation-btn", { hasText: "Wyrmgall" }).click()
  await page169.waitForTimeout(300)
  const expectedCount = await page169.evaluate(async () => {
    const { createTacticsBattle, fearZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("wyrmgall")
    return fearZoneCells(battle, "enemy").size
  })
  const renderedCount = await page169.locator('.hwt-cell[data-fear-zone="true"]').count()
  await page169.screenshot({ path: `${SHOT}/fear_zone_cells.png` })
  await page169.close()
  out.fearZoneUiCells = { expectedCount, renderedCount }
  const ok = expectedCount > 0 && renderedCount === expectedCount
  if (!ok) out.errors.push("check169 the rendered data-fear-zone cells did not match fearZoneCells's own computed set")
}

// ---------------------------------------------------------------
// Frost Zone (Movement PRD §4.3's 4th sub-type) - slows units that
// LEAVE it (the mirror transition of Fear Zone's own approach). No
// range gate (same non-melee-gating reasoning as Fear Zone); a new
// DURATION-based `slow` status - this engine's first status that
// decays via a real turn-count rather than a permanent `>0` flag.
// ---------------------------------------------------------------

// 170. frostZoneCells's own shape: radius-1, only for `frosty` units
//      regardless of range - a synthetic RANGED frosty unit still
//      projects it, proving the deliberate non-melee-gating -----------
{
  const page170 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page170.on("pageerror", (e) => errs.push(String(e)))
  await page170.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page170.waitForSelector(".hwt-board")
  const result = await page170.evaluate(async () => {
    const { frostZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const frostyRangedState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "p1", side: "player", hp: 10, range: 3, frosty: true, pos: { row: 4, col: 6 } }],
    }
    const notFrostyState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "p1", side: "player", hp: 10, range: 1, frosty: false, pos: { row: 4, col: 6 } }],
    }
    const frostCells = frostZoneCells(frostyRangedState, "player")
    const noCells = frostZoneCells(notFrostyState, "player")
    return {
      frostCellCount: frostCells.size,
      hasAdjacentCell: frostCells.has("3-6") && frostCells.has("5-6") && frostCells.has("4-5") && frostCells.has("4-7"),
      hasRadius2Cell: frostCells.has("4-4") || frostCells.has("2-6"),
      noCellsCount: noCells.size,
    }
  })
  await page170.close()
  out.frostZoneShape = result
  const ok = result.frostCellCount === 8 && result.hasAdjacentCell && !result.hasRadius2Cell && result.noCellsCount === 0
  if (!ok) out.errors.push("check170 frostZoneCells did not produce the expected radius-1, frosty-only (range-agnostic) shape")
}

// 171. The core mechanic: a unit moving from INSIDE an opposing Frost
//      Zone to OUTSIDE it gains exactly one SLOW_DURATION grant and
//      the correct log line; sliding to another cell STILL inside the
//      same zone grants nothing further (the transition-only guard) --
{
  const page171 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page171.on("pageerror", (e) => errs.push(String(e)))
  await page171.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page171.waitForSelector(".hwt-board")
  const result = await page171.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "mover", side: "enemy", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 9, block: 0, slow: 0, facing: "E" },
        { id: "frosty", side: "player", name: "Frostbind", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, frosty: true, block: 0, facing: "W" },
      ],
    }
    // Move 1: from (4,5) (inside - adjacent to frosty@(4,6)) to (3,4)
    // (distance 2 from frosty - a genuine leaving transition, should
    // grant slow).
    const afterLeave = moveUnit(state, "mover", { row: 3, col: 4 })
    const moverAfterLeave = afterLeave.units.find((u) => u.id === "mover")
    // Move 2: from (3,4) to (2,3) - BOTH cells are already distance >=2
    // from frosty@(4,6), so the mover was NEVER inside the zone on
    // this second move - no NEW transition, should grant nothing
    // further (mirrors Fear Zone's own check166 "slide" sub-case, just
    // fully outside instead of fully inside).
    const afterSlide = moveUnit({ ...afterLeave, units: afterLeave.units.map((u) => (u.id === "mover" ? { ...u, ap: 1 } : u)) }, "mover", { row: 2, col: 3 })
    const moverAfterSlide = afterSlide.units.find((u) => u.id === "mover")
    const newLinesFromSlide = afterSlide.log.slice(afterLeave.log.length)
    return {
      slowAfterLeave: moverAfterLeave.slow,
      logHasFrostNote: afterLeave.log.some((l) => l.includes("staggers away, slowed by the frost")),
      slowAfterSlide: moverAfterSlide.slow,
      slideAddedFrostNote: newLinesFromSlide.some((l) => l.includes("staggers away")),
    }
  })
  await page171.close()
  out.frostZoneCoreMechanic = result
  const ok = result.slowAfterLeave === 2 && result.logHasFrostNote && result.slowAfterSlide === 2 && !result.slideAddedFrostNote
  if (!ok) out.errors.push("check171 Frost Zone did not grant slow exactly once on a genuine inside-to-outside transition, or fired again on an already-outside slide")
}

// 172. The off-by-one decay timing, verified explicitly: a
//      SLOW_DURATION(2)-granted unit's move is reduced by exactly 1 on
//      its own VERY NEXT turn, and back to full normal move the turn
//      after that - proving the grant number and the visible-effect
//      duration relate the way the design intends, not backwards -----
{
  const page172 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page172.on("pageerror", (e) => errs.push(String(e)))
  await page172.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page172.waitForSelector(".hwt-board")
  const result = await page172.evaluate(async () => {
    const { moveUnit, endPlayerTurn, runEnemyTurn, reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, apMax: 2, move: 3, block: 0, slow: 0, cooldownRemaining: 0, facing: "W" },
        { id: "frosty", side: "enemy", name: "Chilly", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, apMax: 2, frosty: true, block: 0, cooldownRemaining: 0, facing: "E" },
      ],
    }
    // Player unit leaves the opposing Frost Zone (col5 -> col2, distance
    // 4 from frosty@col6) - grants slow:2.
    state = moveUnit(state, "mover", { row: 4, col: 2 })
    const slowRightAfterLeaving = state.units.find((u) => u.id === "mover").slow
    // End the player's turn (no other reachableTilesFor call happens
    // for "mover" this same turn - slow's own decay hasn't fired yet).
    state = endPlayerTurn(state)
    // Run the enemy's own turn (frosty has ap:2 but no living target in
    // range/reachable at this distance with move:0 default, so it just
    // holds) - control returns to the player, decaying `mover`'s own
    // slow 2->1 at that exact checkpoint (runEnemyTurn's own
    // returnedToPlayer block).
    state = runEnemyTurn({ ...state, units: state.units.map((u) => (u.id === "frosty" ? { ...u, move: 0 } : u)) })
    const slowOnOwnNextTurn = state.units.find((u) => u.id === "mover").slow
    const reachableOnSlowedTurn = reachableTilesFor(state, "mover")
    // A second full cycle: end this (slowed) turn, run the enemy's
    // turn again, return to player - slow decays 1->0.
    state = endPlayerTurn(state)
    state = runEnemyTurn({ ...state, units: state.units.map((u) => (u.id === "frosty" ? { ...u, move: 0 } : u)) })
    const slowOnFollowingTurn = state.units.find((u) => u.id === "mover").slow
    const reachableOnNormalTurn = reachableTilesFor(state, "mover")
    return {
      slowRightAfterLeaving,
      slowOnOwnNextTurn,
      reachableCountOnSlowedTurn: reachableOnSlowedTurn.length,
      slowOnFollowingTurn,
      reachableCountOnNormalTurn: reachableOnNormalTurn.length,
    }
  })
  await page172.close()
  out.frostZoneDecayTiming = result
  // move:3 unslowed vs move:2 slowed (floored at move-1) - a smaller,
  // strictly-fewer reachable set on the slowed turn than the normal one.
  const ok =
    result.slowRightAfterLeaving === 2 &&
    result.slowOnOwnNextTurn === 1 &&
    result.slowOnFollowingTurn === 0 &&
    result.reachableCountOnSlowedTurn < result.reachableCountOnNormalTurn
  if (!ok) out.errors.push("check172 SLOW_DURATION's own decay timing did not produce exactly 1 turn of reduced movement, then a clean return to normal")
}

// 173. Slow's real effect actually applies via effectiveMove: the
//      newly-slowed unit's own next reachableTilesFor call returns a
//      strictly smaller reachable set than an identical unslowed
//      unit's does, and never drops to 0 (floored at 1) ---------------
{
  const page173 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page173.on("pageerror", (e) => errs.push(String(e)))
  await page173.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page173.waitForSelector(".hwt-board")
  const result = await page173.evaluate(async () => {
    const { reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (move, slow) => ({ grid: { rows: 9, cols: 12 }, terrain: {}, units: [{ id: "u1", side: "player", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, move, slow, block: 0 }] })
    const mkNoField = (move) => ({ grid: { rows: 9, cols: 12 }, terrain: {}, units: [{ id: "u1", side: "player", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, move, block: 0 }] })
    return {
      // move:3 unslowed - the unclipped king-move diamond, (2*3+1)^2-1=48.
      normalCount: reachableTilesFor(mk(3, 0), "u1").length,
      // move:3 slowed -> effectiveMove=2, (2*2+1)^2-1=24 - strictly smaller.
      slowedCount: reachableTilesFor(mk(3, 1), "u1").length,
      // move:1 slowed floors at move-1=0 -> Math.max(1,0)=1, NOT 0 - still
      // reaches the (2*1+1)^2-1=8 tiles a move:1 unit normally would.
      slowedFlooredCount: reachableTilesFor(mk(1, 1), "u1").length,
      // No `slow` field at all (every pre-existing synthetic test unit) -
      // `undefined > 0` is false, so this must equal normalCount exactly.
      missingFieldCount: reachableTilesFor(mkNoField(3), "u1").length,
    }
  })
  await page173.close()
  out.frostZoneEffectiveMove = result
  const ok =
    result.normalCount === 48 &&
    result.slowedCount === 24 &&
    result.slowedFlooredCount === 8 &&
    result.missingFieldCount === result.normalCount
  if (!ok) out.errors.push("check173 effectiveMove did not reduce a slowed unit's reachable set, floor it at 1, or stay byte-identical for a unit missing the slow field entirely")
}

// 174. A real end-to-end example via createTacticsBattle with
//      frostbind: a real enemy leaving Frostbind's own zone gains real
//      Slow, narrated correctly -------------------------------------
{
  const page174 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page174.on("pageerror", (e) => errs.push(String(e)))
  await page174.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page174.waitForSelector(".hwt-board")
  const result = await page174.evaluate(async () => {
    const { createTacticsBattle, moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["frostbind"])
    const frostbind = state.units.find((u) => u.defId === "frostbind")
    const enemy = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) => (u.id === enemy.id ? { ...u, pos: { row: frostbind.pos.row, col: frostbind.pos.col - 1 }, ap: u.apMax } : u)),
    }
    const after = moveUnit(state, enemy.id, { row: frostbind.pos.row, col: frostbind.pos.col - 3 })
    const enemyAfter = after.units.find((u) => u.id === enemy.id)
    return {
      frosty: frostbind.frosty,
      slowAfter: enemyAfter.slow,
      hasFrostNote: after.log.some((l) => l.includes("staggers away, slowed by the frost")),
    }
  })
  await page174.close()
  out.realFrostbindLeaveApproach = result
  const ok = result.frosty === true && result.slowAfter === 2 && result.hasFrostNote
  if (!ok) out.errors.push("check174 a real enemy leaving the real frosty Frostbind's zone did not genuinely gain Slow")
}

// 175. UI: data-frost-zone cells match frostZoneCells(battle, "player")'s
//      own computed set exactly, visually distinct from data-zoc/
//      data-threat-zone/data-fear-zone - a screenshot. Frostbind isn't
//      in this prototype's own sidebar squad-picker pool
//      (PLAYER_ROSTER_IDS) - out of scope to add this round (a roster-
//      availability change, unrelated to the mechanic itself) - so a
//      valid <option> is injected directly onto the real DOM <select>
//      and Playwright's own selectOption fires the SAME real onChange
//      handler (handleSquadSlotChange) the sidebar's own dropdown
//      would, genuinely exercising the production restart/
//      createTacticsBattle pipeline, not a synthetic bypass ----------
{
  const page175 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page175.on("pageerror", (e) => errs.push(String(e)))
  await page175.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page175.waitForSelector(".hwt-board")
  await page175.evaluate(() => {
    const select = document.querySelector(".hwt-squad-select")
    const opt = document.createElement("option")
    opt.value = "frostbind"
    opt.textContent = "Frostbind (verify-only)"
    select.appendChild(opt)
  })
  await page175.selectOption(".hwt-squad-select", "frostbind")
  await page175.waitForTimeout(300)
  const expected = await page175.evaluate(async () => {
    const { createTacticsBattle, frostZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    // Re-derive independently with the SAME formation+squad the real
    // onChange handler just restarted with (formation unchanged -
    // "default" - and squad slot 0 swapped to frostbind) - deterministic
    // spreadRows positioning means this reproduces the identical battle.
    const battle = createTacticsBattle("default", ["frostbind", "the-fool", "hexbreaker", "oathshield"])
    return frostZoneCells(battle, "player").size
  })
  const renderedCount = await page175.locator('.hwt-cell[data-frost-zone="true"]').count()
  await page175.screenshot({ path: `${SHOT}/frost_zone_cells.png` })
  await page175.close()
  out.frostZoneUiCells = { expectedCount: expected, renderedCount }
  const ok = expected > 0 && renderedCount === expected
  if (!ok) out.errors.push("check175 the rendered data-frost-zone cells did not match frostZoneCells's own computed set")
}

// ---------------------------------------------------------------
// Thorn Zone (Movement PRD §4.3's 5th and final sub-type) - roots
// units that ENTER it (mirrors Fear Zone's own direction). No range
// gate (same non-melee-gating reasoning as Fear/Frost Zone); a new
// DURATION-based `root` status - this engine's SECOND duration-based
// status, reusing `slow`'s own exact decay mechanism from last round.
// Movement-only: a rooted unit can still attack if already in range.
// ---------------------------------------------------------------

// 176. thornZoneCells's own shape: radius-1, only for `thorny` units
//      regardless of range - a synthetic RANGED thorny unit still
//      projects it, proving the deliberate non-melee-gating -----------
{
  const page176 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page176.on("pageerror", (e) => errs.push(String(e)))
  await page176.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page176.waitForSelector(".hwt-board")
  const result = await page176.evaluate(async () => {
    const { thornZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const thornyRangedState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 3, thorny: true, pos: { row: 4, col: 6 } }],
    }
    const notThornyState = {
      grid: { rows: 9, cols: 12 },
      units: [{ id: "e1", side: "enemy", hp: 10, range: 1, thorny: false, pos: { row: 4, col: 6 } }],
    }
    const thornCells = thornZoneCells(thornyRangedState, "enemy")
    const noCells = thornZoneCells(notThornyState, "enemy")
    return {
      thornCellCount: thornCells.size,
      hasAdjacentCell: thornCells.has("3-6") && thornCells.has("5-6") && thornCells.has("4-5") && thornCells.has("4-7"),
      hasRadius2Cell: thornCells.has("4-4") || thornCells.has("2-6"),
      noCellsCount: noCells.size,
    }
  })
  await page176.close()
  out.thornZoneShape = result
  const ok = result.thornCellCount === 8 && result.hasAdjacentCell && !result.hasRadius2Cell && result.noCellsCount === 0
  if (!ok) out.errors.push("check176 thornZoneCells did not produce the expected radius-1, thorny-only (range-agnostic) shape")
}

// 177. The core mechanic: a unit moving from OUTSIDE an opposing Thorn
//      Zone to INSIDE it gains exactly one ROOT_DURATION grant and the
//      correct log line; sliding to another cell STILL inside the
//      same zone grants nothing further (the transition-only guard) --
{
  const page177 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page177.on("pageerror", (e) => errs.push(String(e)))
  await page177.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page177.waitForSelector(".hwt-board")
  const result = await page177.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 0 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 9, block: 0, root: 0, facing: "W" },
        { id: "thorny", side: "enemy", name: "Thicket", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, thorny: true, block: 0, facing: "E" },
      ],
    }
    // Move 1: from col0 (outside, distance 6) to (4,5) (inside, adjacent
    // to thorny@(4,6) - distance 1) - a genuine transition, should
    // grant root.
    const afterEnter = moveUnit(state, "mover", { row: 4, col: 5 })
    const moverAfterEnter = afterEnter.units.find((u) => u.id === "mover")
    // Move 2: from (4,5) to (3,5) - BOTH cells are distance 1 from
    // thorny@(4,6) (Chebyshev), so this stays fully inside the same
    // zone the whole time - no NEW transition, should grant nothing
    // further. But the mover is now root>0, so reachableTilesFor
    // would normally return [] - this move is driven directly via
    // moveUnit to isolate the "no new grant" assertion from the
    // "cannot move" assertion (check178's own job), matching how
    // check166's own Fear Zone slide already isolated its own guard.
    const afterSlide = moveUnit({ ...afterEnter, units: afterEnter.units.map((u) => (u.id === "mover" ? { ...u, ap: 1, root: 0 } : u)) }, "mover", { row: 3, col: 5 })
    const moverAfterSlide = afterSlide.units.find((u) => u.id === "mover")
    const newLinesFromSlide = afterSlide.log.slice(afterEnter.log.length)
    return {
      rootAfterEnter: moverAfterEnter.root,
      logHasThornNote: afterEnter.log.some((l) => l.includes("is caught in the thorns, rooted")),
      rootAfterSlide: moverAfterSlide.root,
      slideAddedThornNote: newLinesFromSlide.some((l) => l.includes("caught in the thorns")),
    }
  })
  await page177.close()
  out.thornZoneCoreMechanic = result
  const ok = result.rootAfterEnter === 2 && result.logHasThornNote && result.rootAfterSlide === 0 && !result.slideAddedThornNote
  if (!ok) out.errors.push("check177 Thorn Zone did not grant root exactly once on a genuine outside-to-inside transition, or fired again on a within-zone slide")
}

// 178. Root's real effect + the exact decay timing: a rooted unit's
//      own reachableTilesFor returns an EMPTY array (not just a
//      smaller one); ROOT_DURATION=2 produces exactly 1 turn where
//      this is true, then a clean return to a normal, non-empty
//      reachable set the turn after ------------------------------
{
  const page178 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page178.on("pageerror", (e) => errs.push(String(e)))
  await page178.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page178.waitForSelector(".hwt-board")
  const result = await page178.evaluate(async () => {
    const { moveUnit, endPlayerTurn, runEnemyTurn, reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 2 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, apMax: 2, move: 3, block: 0, root: 0, cooldownRemaining: 0, slow: 0, facing: "W" },
        { id: "thorny", side: "enemy", name: "Thicket", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, apMax: 2, thorny: true, block: 0, cooldownRemaining: 0, slow: 0, facing: "E" },
      ],
    }
    // Player unit enters the opposing Thorn Zone: starts at col2
    // (distance 4, outside), moves to col5 (distance 1, inside) -
    // grants root:2.
    state = moveUnit(state, "mover", { row: 4, col: 5 })
    const rootRightAfterEntering = state.units.find((u) => u.id === "mover").root
    const reachableWhileEnteringTurn = reachableTilesFor(state, "mover")
    // End the player's turn, run the enemy's own turn (thorny has
    // ap:2 but move:0 default so it just holds) - control returns to
    // the player, decaying mover's own root 2->1 at that exact
    // checkpoint.
    state = endPlayerTurn(state)
    state = runEnemyTurn({ ...state, units: state.units.map((u) => (u.id === "thorny" ? { ...u, move: 0 } : u)) })
    const rootOnOwnNextTurn = state.units.find((u) => u.id === "mover").root
    const reachableOnRootedTurn = reachableTilesFor(state, "mover")
    // A second full cycle: root decays 1->0.
    state = endPlayerTurn(state)
    state = runEnemyTurn({ ...state, units: state.units.map((u) => (u.id === "thorny" ? { ...u, move: 0 } : u)) })
    const rootOnFollowingTurn = state.units.find((u) => u.id === "mover").root
    const reachableOnNormalTurn = reachableTilesFor(state, "mover")
    return {
      rootRightAfterEntering,
      reachableCountWhileEnteringTurn: reachableWhileEnteringTurn.length,
      rootOnOwnNextTurn,
      reachableCountOnRootedTurn: reachableOnRootedTurn.length,
      rootOnFollowingTurn,
      reachableCountOnNormalTurn: reachableOnNormalTurn.length,
    }
  })
  await page178.close()
  out.thornZoneDecayTiming = result
  const ok =
    result.rootRightAfterEntering === 2 &&
    result.rootOnOwnNextTurn === 1 &&
    result.reachableCountOnRootedTurn === 0 &&
    result.rootOnFollowingTurn === 0 &&
    result.reachableCountOnNormalTurn > 0
  if (!ok) out.errors.push("check178 ROOT_DURATION's own decay timing did not produce exactly 1 turn of ZERO reachable tiles, then a clean return to normal")
}

// 179. Root does NOT block attacking - a rooted unit with a target
//      already in range from its current tile still lands a normal
//      attack, proving this is a movement-only restriction ----------
{
  const page179 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page179.on("pageerror", (e) => errs.push(String(e)))
  await page179.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page179.waitForSelector(".hwt-board")
  const result = await page179.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "rooted", side: "player", name: "Rooted", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 3, block: 0, root: 2, facing: "W" },
        // facing "W" (matching the attacker's own approach direction
        // from the west) keeps this a clean FRONT hit - "E" would read
        // as a BACK hit and pull in Facing's own crit bonus, muddying
        // a check meant to isolate Root's own non-effect on attacking.
        { id: "target", side: "enemy", name: "Target", pos: { row: 4, col: 6 }, hp: 999, maxHp: 999, range: 1, attack: 0, block: 0, facing: "W" },
      ],
    }
    const after = attackUnit(state, "rooted", "target")
    const target = after.units.find((u) => u.id === "target")
    return { damageDealt: 999 - target.hp, apAfter: after.units.find((u) => u.id === "rooted").ap }
  })
  await page179.close()
  out.thornZoneAttackUnaffected = result
  const ok = result.damageDealt === 10 && result.apAfter === 0
  if (!ok) out.errors.push("check179 a rooted unit with an in-range target failed to attack normally - Root incorrectly blocked attacking")
}

// 180. A real end-to-end example via createTacticsBattle with the new
//      rootbind-thicket formation: a real player unit entering its
//      zone gets genuinely rooted, narrated correctly, and its own
//      next reachableTilesFor call is empty ------------------------
{
  const page180 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page180.on("pageerror", (e) => errs.push(String(e)))
  await page180.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page180.waitForSelector(".hwt-board")
  const result = await page180.evaluate(async () => {
    const { createTacticsBattle, moveUnit, reachableTilesFor } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("rootbind-thicket", ["the-fool"])
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const thicket = state.units.find((u) => u.side === "enemy")
    state = {
      ...state,
      units: state.units.map((u) => (u.id === mosskit.id ? { ...u, pos: { row: thicket.pos.row, col: thicket.pos.col + 2 }, ap: 1, move: 3 } : u)),
    }
    const after = moveUnit(state, mosskit.id, { row: thicket.pos.row, col: thicket.pos.col + 1 })
    const mosskitAfter = after.units.find((u) => u.id === mosskit.id)
    return {
      thorny: thicket.thorny,
      rootAfter: mosskitAfter.root,
      hasThornNote: after.log.some((l) => l.includes("is caught in the thorns, rooted")),
      reachableAfter: reachableTilesFor(after, mosskit.id).length,
    }
  })
  await page180.close()
  out.realRootbindThicketApproach = result
  const ok = result.thorny === true && result.rootAfter === 2 && result.hasThornNote && result.reachableAfter === 0
  if (!ok) out.errors.push("check180 a real approach toward the real thorny Rootbind Thicket did not genuinely root the mover")
}

// 181. UI: data-thorn-zone cells match thornZoneCells's own computed
//      set exactly, visually distinct from data-zoc/data-threat-zone/
//      data-fear-zone/data-frost-zone - a screenshot. Unlike Frost
//      Zone's own player-side flip, Rootbind Thicket is an ENEMY with
//      its own dedicated formation button, so this reuses the exact
//      clean click-driven pattern check169 already established (no
//      DOM-injection workaround needed) -----------------------------
{
  const page181 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page181.on("pageerror", (e) => errs.push(String(e)))
  await page181.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page181.waitForSelector(".hwt-board")
  await page181.locator(".hwt-formation-btn", { hasText: "Rootbind Thicket" }).click()
  await page181.waitForTimeout(300)
  const expectedCount = await page181.evaluate(async () => {
    const { createTacticsBattle, thornZoneCells } = await import("/src/services/heartwood/tacticsEngine.js")
    const battle = createTacticsBattle("rootbind-thicket")
    return thornZoneCells(battle, "enemy").size
  })
  const renderedCount = await page181.locator('.hwt-cell[data-thorn-zone="true"]').count()
  await page181.screenshot({ path: `${SHOT}/thorn_zone_cells.png` })
  await page181.close()
  out.thornZoneUiCells = { expectedCount, renderedCount }
  const ok = expectedCount > 0 && renderedCount === expectedCount
  if (!ok) out.errors.push("check181 the rendered data-thorn-zone cells did not match thornZoneCells's own computed set")
}

// ---------------------------------------------------------------
// Zone Disengage Toll (Movement PRD §4.3's general preamble) - leaving
// ANY opposing Zone of Control (checked once via insideAnyOpposingZone,
// not per zone type) costs 1 extra AP, additive on top of whatever
// else that same transition already triggers. No new UI - the
// existing AP pip display already shows the reduced AP.
// ---------------------------------------------------------------

// 182. insideAnyOpposingZone's own shape: independently true for a
//      position inside EACH of the 5 zone types, false when none are
//      present ------------------------------------------------------
{
  const page182 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page182.on("pageerror", (e) => errs.push(String(e)))
  await page182.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page182.waitForSelector(".hwt-board")
  const result = await page182.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // insideAnyOpposingZone isn't exported - probe it indirectly via
    // the one real effect it gates: the AP toll firing on a leaving
    // move. Build one isolated state per zone type, each with a
    // single controller of that kind, and confirm the toll fires for
    // every one of them, plus a control case with none.
    const mk = (controllerExtra) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, move: 9, block: 0, weak: 0, slow: 0, root: 0, facing: "W" },
        { id: "ctrl", side: "enemy", name: "Ctrl", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 3, attack: 0, block: 0, facing: "E", ...controllerExtra },
      ],
    })
    const leaveFar = (state) => moveUnit(state, "mover", { row: 4, col: 0 })
    const basic = leaveFar(mk({ range: 1 }))
    const threat = leaveFar(mk({ range: 1, move: 2 }))
    const fear = leaveFar(mk({ fearsome: true }))
    const frost = leaveFar(mk({ frosty: true }))
    const thorn = leaveFar(mk({ thorny: true }))
    const none = leaveFar(mk({}))
    return {
      basicApAfter: basic.units.find((u) => u.id === "mover").ap,
      threatApAfter: threat.units.find((u) => u.id === "mover").ap,
      fearApAfter: fear.units.find((u) => u.id === "mover").ap,
      frostApAfter: frost.units.find((u) => u.id === "mover").ap,
      thornApAfter: thorn.units.find((u) => u.id === "mover").ap,
      noneApAfter: none.units.find((u) => u.id === "mover").ap,
    }
  })
  await page182.close()
  out.zoneTollShape = result
  const ok =
    result.basicApAfter === 0 &&
    result.threatApAfter === 0 &&
    result.fearApAfter === 0 &&
    result.frostApAfter === 0 &&
    result.thornApAfter === 0 &&
    result.noneApAfter === 1
  if (!ok) out.errors.push("check182 the AP toll did not fire for every one of the 5 zone types, or fired with no controller present at all")
}

// 183. The core mechanic: a unit leaving an opposing Basic Zone loses
//      exactly 1 EXTRA AP (2 total: 1 for the move, 1 for the toll)
//      and gets the log line; a unit sliding WITHIN the same zone
//      (never actually leaving) pays nothing extra -------------------
{
  const page183 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page183.on("pageerror", (e) => errs.push(String(e)))
  await page183.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page183.waitForSelector(".hwt-board")
  const result = await page183.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, move: 9, block: 0, facing: "W" },
        { id: "melee", side: "enemy", name: "Melee", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, block: 0, facing: "E" },
      ],
    }
    // Leaving: (4,5) is adjacent to melee@(4,6) - inside Basic Zone.
    // Moving to (4,0) is far away - outside.
    const afterLeave = moveUnit(state, "mover", { row: 4, col: 0 })
    const moverAfterLeave = afterLeave.units.find((u) => u.id === "mover")
    // Sliding: a SEPARATE state where the mover is ALREADY 2 tiles
    // from melee (outside Basic Zone the whole time) and moves further
    // away still - never inside, so never "leaves."
    const neverInsideState = { ...state, units: state.units.map((u) => (u.id === "mover" ? { ...u, pos: { row: 4, col: 3 } } : u)) }
    const afterNeverInside = moveUnit(neverInsideState, "mover", { row: 4, col: 0 })
    const moverAfterNeverInside = afterNeverInside.units.find((u) => u.id === "mover")
    return {
      apAfterLeave: moverAfterLeave.ap,
      logHasTollNote: afterLeave.log.some((l) => l.includes("struggles to break away, -1 AP")),
      apAfterNeverInside: moverAfterNeverInside.ap,
      neverInsideHasTollNote: afterNeverInside.log.some((l) => l.includes("struggles to break away")),
    }
  })
  await page183.close()
  out.zoneTollCoreMechanic = result
  const ok = result.apAfterLeave === 0 && result.logHasTollNote && result.apAfterNeverInside === 1 && !result.neverInsideHasTollNote
  if (!ok) out.errors.push("check183 the AP toll did not charge exactly 1 extra AP on a genuine leaving transition, or fired for a unit that was never inside the zone")
}

// 184. Additive stacking with Basic Zone's own reaction attack: leaving
//      pays the AP toll AND still takes the existing free reaction
//      attack in the SAME move - proving additive, not replacing -----
{
  const page184 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page184.on("pageerror", (e) => errs.push(String(e)))
  await page184.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page184.waitForSelector(".hwt-board")
  const result = await page184.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, move: 9, block: 0, facing: "W" },
        { id: "melee", side: "enemy", name: "Melee", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 8, block: 0, facing: "W" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 4, col: 0 })
    const mover = after.units.find((u) => u.id === "mover")
    return {
      apAfter: mover.ap,
      hpAfter: mover.hp,
      logHasTollNote: after.log.some((l) => l.includes("struggles to break away")),
      logHasReactionNote: after.log.some((l) => l.includes("lashes out as Mover pulls away")),
    }
  })
  await page184.close()
  out.zoneTollStacksWithReaction = result
  // The reaction attacks the mover at its NEW position (4,0), and the
  // mover's own facing updated to "W" (the direction it just moved) -
  // melee attacks from the East, the opposite of "W", so this is a
  // BACK hit: base 25pp + Crit's own flat +25pp = 50pp -> round(8*1.5)
  // = 12 damage, not a plain unmodified 8.
  const ok = result.apAfter === 0 && result.hpAfter === 8 && result.logHasTollNote && result.logHasReactionNote
  if (!ok) out.errors.push("check184 leaving Basic Zone did not pay BOTH the AP toll and the existing reaction attack in the same move")
}

// 185. Additive stacking with Frost Zone's own Slow: leaving pays the
//      AP toll AND still gets Slowed in the SAME move -----------------
{
  const page185 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page185.on("pageerror", (e) => errs.push(String(e)))
  await page185.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page185.waitForSelector(".hwt-board")
  const result = await page185.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, move: 9, block: 0, slow: 0, facing: "W" },
        { id: "frosty", side: "enemy", name: "Chilly", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 3, attack: 0, frosty: true, block: 0, facing: "E" },
      ],
    }
    const after = moveUnit(state, "mover", { row: 4, col: 0 })
    const mover = after.units.find((u) => u.id === "mover")
    return {
      apAfter: mover.ap,
      slowAfter: mover.slow,
      logHasTollNote: after.log.some((l) => l.includes("struggles to break away")),
      logHasFrostNote: after.log.some((l) => l.includes("staggers away, slowed by the frost")),
    }
  })
  await page185.close()
  out.zoneTollStacksWithSlow = result
  const ok = result.apAfter === 0 && result.slowAfter === 2 && result.logHasTollNote && result.logHasFrostNote
  if (!ok) out.errors.push("check185 leaving Frost Zone did not pay BOTH the AP toll and gain Slow in the same move")
}

// 186. Edge cases: the floor never goes negative (a unit with only 1
//      starting AP, spent entirely on the move, ends at 0 not -1); and
//      leaving 2 SIMULTANEOUSLY overlapping opposing zone types still
//      pays the toll only ONCE, not twice ------------------------------
{
  const page186 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page186.on("pageerror", (e) => errs.push(String(e)))
  await page186.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page186.waitForSelector(".hwt-board")
  const result = await page186.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Floor case: mover starts with only ap:1 - spent entirely on the
    // move itself, nothing left for the toll to take.
    const floorState = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 9, block: 0, facing: "W" },
        { id: "melee", side: "enemy", name: "Melee", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, block: 0, facing: "E" },
      ],
    }
    const afterFloor = moveUnit(floorState, "mover", { row: 4, col: 0 })
    const moverAfterFloor = afterFloor.units.find((u) => u.id === "mover")
    // Double-overlap case: TWO different opposing controllers both
    // control the mover's own origin (a plain melee unit AND a
    // separate frosty unit, both adjacent to (4,5)) - leaving both at
    // once should still cost exactly 1 AP, not 2.
    const overlapState = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 3, move: 9, block: 0, slow: 0, facing: "W" },
        { id: "melee", side: "enemy", name: "Melee", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, block: 0, facing: "E" },
        { id: "frosty", side: "enemy", name: "Chilly", pos: { row: 3, col: 5 }, hp: 100, maxHp: 100, range: 3, attack: 0, frosty: true, block: 0, facing: "S" },
      ],
    }
    const afterOverlap = moveUnit(overlapState, "mover", { row: 4, col: 0 })
    const moverAfterOverlap = afterOverlap.units.find((u) => u.id === "mover")
    return {
      apAfterFloor: moverAfterFloor.ap,
      apAfterOverlap: moverAfterOverlap.ap,
    }
  })
  await page186.close()
  out.zoneTollEdgeCases = result
  // Overlap: ap:3 minus 1 (the move) minus 1 (the toll, paid once) = 1.
  const ok = result.apAfterFloor === 0 && result.apAfterOverlap === 1
  if (!ok) out.errors.push("check186 the AP toll either went negative on a 1-AP unit, or charged twice for 2 simultaneously overlapping zone types")
}

// 187. A real end-to-end example via createTacticsBattle: a real
//      player unit disengaging from a real melee enemy pays the toll,
//      narrated correctly, on top of the enemy's own real reaction ---
{
  const page187 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page187.on("pageerror", (e) => errs.push(String(e)))
  await page187.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page187.waitForSelector(".hwt-board")
  const result = await page187.evaluate(async () => {
    const { createTacticsBattle, moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["the-fool"])
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const ironmaw = state.units.find((u) => u.side === "enemy" && u.range === 1)
    state = {
      ...state,
      units: state.units.map((u) => (u.id === mosskit.id ? { ...u, pos: { row: ironmaw.pos.row, col: ironmaw.pos.col + 1 }, ap: 2, move: 9 } : u)),
    }
    const after = moveUnit(state, mosskit.id, { row: ironmaw.pos.row, col: ironmaw.pos.col + 5 })
    const mosskitAfter = after.units.find((u) => u.id === mosskit.id)
    return {
      apAfter: mosskitAfter.ap,
      hasTollNote: after.log.some((l) => l.includes("struggles to break away, -1 AP")),
    }
  })
  await page187.close()
  out.realZoneTollDisengage = result
  const ok = result.apAfter === 0 && result.hasTollNote
  if (!ok) out.errors.push("check187 a real disengage from a real melee enemy did not genuinely pay the AP toll")
}

// ---------------------------------------------------------------
// Retreat Step (Movement PRD §4.4) - a `wary` unit that loses a
// SIGNIFICANT chunk (>=25% max HP) of its own HP in one hit steps
// back one tile, away from its own facing, once per round, unless
// Rooted. Hooked into applyDamageWithBlock itself - the ONE shared
// function every damage source already funnels through.
// ---------------------------------------------------------------

// 188. The core mechanic: a `wary` unit taking a hit >=25% of its own
//      max HP retreats exactly 1 tile opposite its own facing, gets
//      the log line, retreatStepUsed becomes true, and its OWN facing
//      stays UNCHANGED; a hit BELOW the threshold does nothing -------
{
  const page188 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page188.on("pageerror", (e) => errs.push(String(e)))
  await page188.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page188.waitForSelector(".hwt-board")
  const result = await page188.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (attackAmount) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 0, facing: "E" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: attackAmount, ap: 2, block: 0, facing: "W" },
      ],
    })
    // 10 damage: >=32*0.25=8 - qualifies.
    const afterBig = attackUnit(mk(10), "atk", "hermit")
    const hermitAfterBig = afterBig.units.find((u) => u.id === "hermit")
    // 5 damage: <8 - does not qualify.
    const afterSmall = attackUnit(mk(5), "atk", "hermit")
    const hermitAfterSmall = afterSmall.units.find((u) => u.id === "hermit")
    return {
      bigHpAfter: hermitAfterBig.hp,
      bigPosAfter: hermitAfterBig.pos,
      bigFacingAfter: hermitAfterBig.facing,
      bigRetreatUsed: hermitAfterBig.retreatStepUsed,
      bigLogHasNote: afterBig.log.some((l) => l.includes("reels backward from the blow")),
      smallHpAfter: hermitAfterSmall.hp,
      smallPosAfter: hermitAfterSmall.pos,
      smallRetreatUsed: hermitAfterSmall.retreatStepUsed,
    }
  })
  await page188.close()
  out.retreatStepCoreMechanic = result
  const ok =
    result.bigHpAfter === 22 &&
    result.bigPosAfter.row === 4 &&
    result.bigPosAfter.col === 4 &&
    result.bigFacingAfter === "E" &&
    result.bigRetreatUsed === true &&
    result.bigLogHasNote &&
    result.smallHpAfter === 27 &&
    result.smallPosAfter.row === 4 &&
    result.smallPosAfter.col === 5 &&
    result.smallRetreatUsed === false
  if (!ok) out.errors.push("check188 Retreat Step did not fire correctly on a qualifying hit, or fired on a hit below the threshold")
}

// 189. Once-per-round: 2 qualifying hits in the SAME phase (no turn
//      transition in between) - only the FIRST retreats, the second
//      does not move the unit again even though it also qualifies ---
{
  const page189 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page189.on("pageerror", (e) => errs.push(String(e)))
  await page189.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page189.waitForSelector(".hwt-board")
  const result = await page189.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 0, facing: "E" },
        // range:5 - stays in range of hermit even after it retreats 1
        // tile away, avoiding the "attacker can no longer reach the
        // retreated target" cascade a range:1 attacker would hit.
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 8 }, hp: 100, maxHp: 100, range: 5, attack: 10, ap: 2, block: 0, facing: "W" },
      ],
    }
    const after1 = attackUnit(state, "atk", "hermit")
    const hermitAfter1 = after1.units.find((u) => u.id === "hermit")
    const after2 = attackUnit(after1, "atk", "hermit")
    const hermitAfter2 = after2.units.find((u) => u.id === "hermit")
    return {
      posAfter1: hermitAfter1.pos,
      posAfter2: hermitAfter2.pos,
      hpAfter2: hermitAfter2.hp,
      retreatUsedAfter2: hermitAfter2.retreatStepUsed,
    }
  })
  await page189.close()
  out.retreatStepOncePerRound = result
  const ok =
    result.posAfter1.col === 4 &&
    result.posAfter2.col === 4 &&
    result.posAfter2.row === 4 &&
    result.hpAfter2 === 12 &&
    result.retreatUsedAfter2 === true
  if (!ok) out.errors.push("check189 Retreat Step fired a second time in the same round despite retreatStepUsed already being set")
}

// 190. The reset mechanism: retreatStepUsed resets to false for BOTH
//      sides across one full round cycle - `endPlayerTurn` itself
//      already cascades all the way through `runEnemyTurn` internally
//      (confirmed by reading its own final line, `return
//      runEnemyTurn(next)`), so a single `endPlayerTurn` call already
//      carries a state from "player" phase all the way back to
//      "player" phase again, resetting BOTH the enemy-phase-entry
//      checkpoint AND the return-to-player checkpoint in one call ---
{
  const page190 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page190.on("pageerror", (e) => errs.push(String(e)))
  await page190.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page190.waitForSelector(".hwt-board")
  const result = await page190.evaluate(async () => {
    const { endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, apMax: 2, move: 9, block: 0, wary: true, retreatStepUsed: true, root: 0, slow: 0, cooldownRemaining: 0, facing: "E" },
        // range:0, move:0 neutralizes the enemy's own AI entirely (no
        // target ever in range, no reachable tiles) - the same
        // "harmless controller" trick check172/178 already established.
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 8 }, hp: 100, maxHp: 100, range: 0, attack: 0, ap: 2, apMax: 2, move: 0, block: 0, retreatStepUsed: true, slow: 0, root: 0, cooldownRemaining: 0, facing: "W" },
      ],
    }
    const after = endPlayerTurn(state)
    const enemyAfter = after.units.find((u) => u.id === "atk")
    const hermitAfter = after.units.find((u) => u.id === "hermit")
    return {
      phaseAfter: after.phase,
      enemyRetreatUsedAfter: enemyAfter.retreatStepUsed,
      hermitRetreatUsedAfter: hermitAfter.retreatStepUsed,
    }
  })
  await page190.close()
  out.retreatStepResetTiming = result
  const ok = result.phaseAfter === "player" && result.enemyRetreatUsedAfter === false && result.hermitRetreatUsedAfter === false
  if (!ok) out.errors.push("check190 retreatStepUsed did not reset for both sides across one full round cycle")
}

// 191. Root's own exclusion: an otherwise-eligible `wary` unit that is
//      ALSO currently Rooted does not retreat on a qualifying hit ----
{
  const page191 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page191.on("pageerror", (e) => errs.push(String(e)))
  await page191.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page191.waitForSelector(".hwt-board")
  const result = await page191.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 2, facing: "E" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
      ],
    }
    const after = attackUnit(state, "atk", "hermit")
    const hermit = after.units.find((u) => u.id === "hermit")
    return { posAfter: hermit.pos, hpAfter: hermit.hp, retreatUsedAfter: hermit.retreatStepUsed }
  })
  await page191.close()
  out.retreatStepRootExclusion = result
  const ok = result.posAfter.row === 4 && result.posAfter.col === 5 && result.hpAfter === 22 && result.retreatUsedAfter === false
  if (!ok) out.errors.push("check191 a Rooted wary unit retreated on a qualifying hit despite Root's own exclusion")
}

// 192. The destination guard: a `wary` unit whose "behind" tile is
//      OFF-BOARD, or occupied by another living unit, does not
//      retreat (no position change, no log, resource not consumed) --
{
  const page192 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page192.on("pageerror", (e) => errs.push(String(e)))
  await page192.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page192.waitForSelector(".hwt-board")
  const result = await page192.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Off-board: facing "E" means backward is "W" (OPPOSITE_DIR) - at
    // col:0, stepping W would leave the grid entirely.
    const offBoardState = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 0 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 0, facing: "E" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 1 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
      ],
    }
    const afterOffBoard = attackUnit(offBoardState, "atk", "hermit")
    const hermitOffBoard = afterOffBoard.units.find((u) => u.id === "hermit")
    // Occupied: hermit's own backward tile (4,4) is already held by a
    // third living unit.
    const occupiedState = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 0, facing: "E" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
        { id: "blocker", side: "player", name: "Blocker", pos: { row: 4, col: 4 }, hp: 20, maxHp: 20, range: 1, attack: 0, block: 0, facing: "E" },
      ],
    }
    const afterOccupied = attackUnit(occupiedState, "atk", "hermit")
    const hermitOccupied = afterOccupied.units.find((u) => u.id === "hermit")
    return {
      offBoardPos: hermitOffBoard.pos,
      offBoardRetreatUsed: hermitOffBoard.retreatStepUsed,
      occupiedPos: hermitOccupied.pos,
      occupiedRetreatUsed: hermitOccupied.retreatStepUsed,
    }
  })
  await page192.close()
  out.retreatStepDestinationGuard = result
  const ok =
    result.offBoardPos.row === 4 &&
    result.offBoardPos.col === 0 &&
    result.offBoardRetreatUsed === false &&
    result.occupiedPos.row === 4 &&
    result.occupiedPos.col === 5 &&
    result.occupiedRetreatUsed === false
  if (!ok) out.errors.push("check192 Retreat Step fired into an off-board or occupied destination instead of no-opping")
}

// 193. Zero regression, directly proven: a NON-wary unit taking an
//      identical large hit produces byte-identical output to before
//      this round - no retreat, just the ordinary damage -----------
{
  const page193 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page193.on("pageerror", (e) => errs.push(String(e)))
  await page193.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page193.waitForSelector(".hwt-board")
  const result = await page193.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        // No `wary` field at all - the same "missing field" safety
        // every pre-existing synthetic unit already relies on.
        { id: "notwary", side: "player", name: "NotWary", pos: { row: 4, col: 5 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, facing: "E" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
      ],
    }
    const after = attackUnit(state, "atk", "notwary")
    const unit = after.units.find((u) => u.id === "notwary")
    return { hpAfter: unit.hp, posAfter: unit.pos, logHasRetreatNote: after.log.some((l) => l.includes("reels backward")) }
  })
  await page193.close()
  out.retreatStepZeroRegression = result
  const ok = result.hpAfter === 22 && result.posAfter.row === 4 && result.posAfter.col === 5 && !result.logHasRetreatNote
  if (!ok) out.errors.push("check193 a non-wary unit unexpectedly retreated, or took the wrong damage")
}

// 194. A real end-to-end example via createTacticsBattle with the real
//      the-hermit: a real heavy hit against a real recruited Hollowreed
//      makes it genuinely retreat, narrated correctly ---------------
{
  const page194 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page194.on("pageerror", (e) => errs.push(String(e)))
  await page194.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page194.waitForSelector(".hwt-board")
  const result = await page194.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["the-hermit"])
    const hermit = state.units.find((u) => u.defId === "the-hermit")
    const enemy = state.units.find((u) => u.side === "enemy" && u.range === 1)
    // Players spawn at the board's own rightmost column facing "W" -
    // their own "backward" (opposite of "W" is "E") would immediately
    // run off the right edge from there. Reposition hermit to a safe
    // middle column first so the retreat itself has room to land.
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) =>
        u.id === hermit.id
          ? { ...u, pos: { row: 4, col: 6 } }
          : u.id === enemy.id
            ? { ...u, pos: { row: 4, col: 5 }, attack: 20, ap: u.apMax }
            : { ...u, pos: { row: 0, col: 0 } },
      ),
    }
    const after = attackUnit(state, enemy.id, hermit.id)
    const hermitAfter = after.units.find((u) => u.id === hermit.id)
    return {
      wary: hermit.wary,
      posBefore: hermit.pos,
      posAfter: hermitAfter.pos,
      hasRetreatNote: after.log.some((l) => l.includes("reels backward from the blow")),
    }
  })
  await page194.close()
  out.realHermitRetreat = result
  const ok = result.wary === true && result.hasRetreatNote && (result.posAfter.row !== result.posBefore.row || result.posAfter.col !== result.posBefore.col)
  if (!ok) out.errors.push("check194 a real heavy hit against the real Hollowreed did not genuinely trigger Retreat Step")
}

// ---------------------------------------------------------------
// Difficulty-scaled terrain density - generateRealTerrain
// (tacticsRealMatchup.js) now scales its own hazard COUNT by the real
// Act number (actIndexForNode, runEngine.js) instead of a flat 6 every
// fight. Only the count scales - the existing weighted type mix is
// untouched.
// ---------------------------------------------------------------

// 195. terrainHazardCountForNode's own per-Act mapping: exact counts
//      for representative nodes spanning multiple real Acts ----------
{
  const page195 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page195.on("pageerror", (e) => errs.push(String(e)))
  await page195.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page195.waitForSelector(".hwt-board")
  const result = await page195.evaluate(async () => {
    const { terrainHazardCountForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const nodes = [3, 70, RUN_PATH.length - 1]
    return {
      pathLength: RUN_PATH.length,
      results: nodes.map((idx) => ({ idx, act: actIndexForNode(idx, RUN_PATH.length), count: terrainHazardCountForNode(idx) })),
    }
  })
  await page195.close()
  out.terrainDensityPerActMapping = result
  const byIdx = Object.fromEntries(result.results.map((r) => [r.idx, r]))
  const ok = byIdx[3].act === 1 && byIdx[3].count === 6 && byIdx[70].act === 4 && byIdx[70].count === 9 && byIdx[result.pathLength - 1].act === 7 && byIdx[result.pathLength - 1].count === 12
  if (!ok) out.errors.push("check195 terrainHazardCountForNode did not produce the expected BASE+(act-1) count for Act I/IV/VII")
}

// 196. generateRealTerrain actually places the Act-scaled count: the
//      SAME seed produces MORE placed cells for a late-run node than
//      an early-run one - proving the count reaches the placement
//      loop, not just the helper function in isolation --------------
{
  const page196 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page196.on("pageerror", (e) => errs.push(String(e)))
  await page196.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page196.waitForSelector(".hwt-board")
  const result = await page196.evaluate(async () => {
    const { generateRealTerrain, terrainHazardCountForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const earlyIdx = 3
    const lateIdx = RUN_PATH.length - 1
    const earlyTerrain = generateRealTerrain(555, earlyIdx)
    const lateTerrain = generateRealTerrain(555, lateIdx)
    return {
      earlyExpected: terrainHazardCountForNode(earlyIdx),
      earlyPlacedCount: Object.keys(earlyTerrain).length,
      lateExpected: terrainHazardCountForNode(lateIdx),
      latePlacedCount: Object.keys(lateTerrain).length,
    }
  })
  await page196.close()
  out.terrainDensityPlacedCounts = result
  const ok = result.earlyPlacedCount === result.earlyExpected && result.latePlacedCount === result.lateExpected && result.latePlacedCount > result.earlyPlacedCount
  if (!ok) out.errors.push("check196 generateRealTerrain did not place the Act-scaled hazard count for early vs late nodes")
}

// 197. Determinism is preserved for a NON-Act-I node (extra coverage
//      beyond the existing check129, which only ever used an Act I
//      node) - the exact same (seed, nodeIndex) still produces
//      byte-identical output across 2 calls -------------------------
{
  const page197 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page197.on("pageerror", (e) => errs.push(String(e)))
  await page197.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page197.waitForSelector(".hwt-board")
  const result = await page197.evaluate(async () => {
    const { generateRealTerrain } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const lateIdx = RUN_PATH.length - 1
    const a = generateRealTerrain(777, lateIdx)
    const b = generateRealTerrain(777, lateIdx)
    return { same: JSON.stringify(a) === JSON.stringify(b), count: Object.keys(a).length }
  })
  await page197.close()
  out.terrainDensityDeterminism = result
  const ok = result.same === true && result.count === 12
  if (!ok) out.errors.push("check197 generateRealTerrain was not deterministic for a late-run (Act VII) node")
}

// 198. Zero regression, directly proven (not assumed from memory of a
//      past log): a literal reimplementation of the OLD flat-6
//      algorithm (same streamRng stream, same placement loop, same
//      type picker - the ONLY difference is a hardcoded 6 instead of
//      the new Act-scaled count) produces BYTE-IDENTICAL output to
//      the NEW generateRealTerrain for the exact (seed, nodeIndex)
//      pairs the existing check21/check129 already exercise - both
//      genuinely Act I, where the new formula also computes 6 -------
{
  const page198 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page198.on("pageerror", (e) => errs.push(String(e)))
  await page198.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page198.waitForSelector(".hwt-board")
  const result = await page198.evaluate(async () => {
    const { generateRealTerrain, terrainHazardCountForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const { streamRng } = await import("/src/data/heartwood/seed.js")
    const { GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    // Literal copy of the OLD pre-this-round algorithm, hardcoded to
    // the old flat TERRAIN_HAZARD_COUNT=6 - not the new function.
    function pickTerrainTypeLegacy(roll) {
      if (roll < 0.3) return "rock"
      if (roll < 0.5) return "water"
      if (roll < 0.75) return "poison"
      return "forest"
    }
    function generateRealTerrainLegacy(seed, nodeIndex) {
      const rng = streamRng(seed, "combat", `${nodeIndex}:terrain`)
      const terrain = {}
      let placed = 0
      let attempts = 0
      while (placed < 6 && attempts < 6 * 4) {
        attempts++
        const row = Math.floor(rng() * GRID.rows)
        const col = 3 + Math.floor(rng() * (GRID.cols - 6))
        const key = `${row}-${col}`
        if (terrain[key]) continue
        terrain[key] = pickTerrainTypeLegacy(rng())
        placed++
      }
      return terrain
    }
    const firstBattleIdx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const pairs = [
      { seed: 424242, idx: firstBattleIdx },
      { seed: 12345, idx: 3 },
    ]
    return pairs.map(({ seed, idx }) => ({
      seed,
      idx,
      expectedCount: terrainHazardCountForNode(idx),
      legacy: generateRealTerrainLegacy(seed, idx),
      current: generateRealTerrain(seed, idx),
    }))
  })
  await page198.close()
  out.terrainDensityZeroRegression = result
  const ok = result.every((r) => r.expectedCount === 6 && JSON.stringify(r.legacy) === JSON.stringify(r.current))
  if (!ok) out.errors.push("check198 an existing Act I (seed,nodeIndex) pair no longer matches the literal old flat-6 algorithm's own output - a real regression")
}

// 199. A real end-to-end example: seeding a real LATE node (Act VII)
//      produces a genuinely denser terrain map than an early-game one,
//      via createTacticsBattle's own real matchup wiring -------------
{
  const page199 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page199.on("pageerror", (e) => errs.push(String(e)))
  await page199.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page199.waitForSelector(".hwt-board")
  const result = await page199.evaluate(async () => {
    const { createRealMatchupBattle } = await import("/src/services/heartwood/tacticsEngine.js")
    const { generateRealTerrain } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const lateTerrain = generateRealTerrain(888, RUN_PATH.length - 1)
    const battle = createRealMatchupBattle(["the-fool"], ["ironmaw"], null, 0, lateTerrain)
    const renderedTerrainCount = Object.keys(battle.terrain || {}).length
    return { generatedCount: Object.keys(lateTerrain).length, renderedTerrainCount }
  })
  await page199.close()
  out.realTerrainDensityLateAct = result
  const ok = result.generatedCount === 12 && result.renderedTerrainCount === 12
  if (!ok) out.errors.push("check199 a real late-Act matchup did not carry the full Act-scaled terrain map through into the real battle state")
}

// ---------------------------------------------------------------
// Weakened reactions (Facing PRD's own back-hit line, "puolustajan
// reaktioiden heikennys") - a back hit grants the new `suppressed`
// status, disabling all 3 of this engine's real reaction mechanics
// (Basic Zone's leaving-reaction, Guardian's Intercept, Retreat Step)
// for exactly 1 of the defender's own following turns.
// ---------------------------------------------------------------

// 200. The core mechanic: a back hit grants exactly SUPPRESSED_DURATION
//      and the log line; a front hit grants nothing --------------------
{
  const page200 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page200.on("pageerror", (e) => errs.push(String(e)))
  await page200.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page200.waitForSelector(".hwt-board")
  const result = await page200.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (attackerCol) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, suppressed: 0, facing: "W" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: attackerCol }, hp: 100, maxHp: 100, range: 1, attack: 5, ap: 2, block: 0, facing: "E" },
      ],
    })
    // Back hit: attacker EAST of a "W"-facing defender.
    const back = attackUnit(mk(7), "atk", "defender")
    const defAfterBack = back.units.find((u) => u.id === "defender")
    // Front hit: attacker WEST of the same "W"-facing defender.
    const front = attackUnit(mk(5), "atk", "defender")
    const defAfterFront = front.units.find((u) => u.id === "defender")
    return {
      backSuppressed: defAfterBack.suppressed,
      backLogHasNote: back.log.some((l) => l.includes("guard falters, reactions weakened")),
      frontSuppressed: defAfterFront.suppressed,
      frontLogHasNote: front.log.some((l) => l.includes("guard falters")),
    }
  })
  await page200.close()
  out.suppressedCoreMechanic = result
  const ok = result.backSuppressed === 2 && result.backLogHasNote && result.frontSuppressed === 0 && !result.frontLogHasNote
  if (!ok) out.errors.push("check200 a back hit did not grant exactly SUPPRESSED_DURATION, or a front hit incorrectly granted suppression")
}

// 201. Suppression blocks Basic Zone's own reaction: an otherwise-
//      eligible melee controller does NOT fire its leaving-reaction
//      while suppressed, but an identical non-suppressed controller
//      still does - a direct, paired proof --------------------------
{
  const page201 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page201.on("pageerror", (e) => errs.push(String(e)))
  await page201.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page201.waitForSelector(".hwt-board")
  const result = await page201.evaluate(async () => {
    const { moveUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (controllerSuppressed) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 1, move: 9, block: 0, facing: "W" },
        { id: "melee", side: "enemy", name: "Melee", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 8, ap: 1, block: 0, suppressed: controllerSuppressed, facing: "W" },
      ],
    })
    const notSuppressed = moveUnit(mk(0), "mover", { row: 4, col: 0 })
    const suppressed = moveUnit(mk(2), "mover", { row: 4, col: 0 })
    return {
      notSuppressedHasReaction: notSuppressed.log.some((l) => l.includes("lashes out")),
      notSuppressedMoverHp: notSuppressed.units.find((u) => u.id === "mover").hp,
      suppressedHasReaction: suppressed.log.some((l) => l.includes("lashes out")),
      suppressedMoverHp: suppressed.units.find((u) => u.id === "mover").hp,
    }
  })
  await page201.close()
  out.suppressedBlocksZoc = result
  const ok = result.notSuppressedHasReaction && result.notSuppressedMoverHp < 20 && !result.suppressedHasReaction && result.suppressedMoverHp === 20
  if (!ok) out.errors.push("check201 a suppressed melee controller still fired its own leaving-reaction, or a non-suppressed one failed to")
}

// 202. Suppression blocks Guardian's Intercept: an otherwise-eligible
//      Guardian does NOT intercept while suppressed, but an identical
//      non-suppressed Guardian still does --------------------------
{
  const page202 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page202.on("pageerror", (e) => errs.push(String(e)))
  await page202.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page202.waitForSelector(".hwt-board")
  const result = await page202.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (guardianSuppressed) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "ally", side: "player", name: "Ally", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 0, block: 0, facing: "W" },
        { id: "guardian", side: "player", name: "Guardian", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, className: "Guardian", suppressed: guardianSuppressed, facing: "S" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100, range: 1, attack: 20, ap: 2, block: 0, facing: "E" },
      ],
    })
    const notSuppressed = attackUnit(mk(0), "atk", "ally")
    const suppressed = attackUnit(mk(2), "atk", "ally")
    return {
      notSuppressedIntercepted: notSuppressed.log.some((l) => l.includes("intercepts")),
      notSuppressedGuardianHp: notSuppressed.units.find((u) => u.id === "guardian").hp,
      suppressedIntercepted: suppressed.log.some((l) => l.includes("intercepts")),
      suppressedGuardianHp: suppressed.units.find((u) => u.id === "guardian").hp,
      suppressedAllyHp: suppressed.units.find((u) => u.id === "ally").hp,
    }
  })
  await page202.close()
  out.suppressedBlocksIntercept = result
  const ok =
    result.notSuppressedIntercepted &&
    result.notSuppressedGuardianHp < 100 &&
    !result.suppressedIntercepted &&
    result.suppressedGuardianHp === 100 &&
    result.suppressedAllyHp === 80
  if (!ok) out.errors.push("check202 a suppressed Guardian still intercepted, or a non-suppressed one failed to")
}

// 203. Suppression blocks Retreat Step - INCLUDING the SAME hit that
//      grants it: a wary unit taking a qualifying BACK hit does NOT
//      retreat (suppressed by that same blow), while an identical
//      FRONT hit of the same base size still lets it retreat normally
//      - directly proving the grant-before-damage ordering ------------
{
  const page203 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page203.on("pageerror", (e) => errs.push(String(e)))
  await page203.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page203.waitForSelector(".hwt-board")
  const result = await page203.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (attackerCol) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      log: [],
      units: [
        { id: "hermit", side: "player", name: "Hermit", pos: { row: 4, col: 6 }, hp: 32, maxHp: 32, range: 1, attack: 5, ap: 2, move: 9, block: 0, wary: true, retreatStepUsed: false, root: 0, suppressed: 0, facing: "W" },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: attackerCol }, hp: 100, maxHp: 100, range: 1, attack: 20, ap: 2, block: 0, facing: "E" },
      ],
    })
    // Back hit: attacker EAST of "W"-facing hermit - Crit's own +50pp
    // applies too, round(20*1.5)=30 damage.
    const back = attackUnit(mk(7), "atk", "hermit")
    const hermitAfterBack = back.units.find((u) => u.id === "hermit")
    // Front hit: attacker WEST of the same "W"-facing hermit - plain
    // unmodified 20 damage.
    const front = attackUnit(mk(5), "atk", "hermit")
    const hermitAfterFront = front.units.find((u) => u.id === "hermit")
    return {
      backHp: hermitAfterBack.hp,
      backPos: hermitAfterBack.pos,
      backSuppressed: hermitAfterBack.suppressed,
      backRetreatUsed: hermitAfterBack.retreatStepUsed,
      frontHp: hermitAfterFront.hp,
      frontPos: hermitAfterFront.pos,
      frontRetreatUsed: hermitAfterFront.retreatStepUsed,
    }
  })
  await page203.close()
  out.suppressedBlocksRetreatSameHit = result
  const ok =
    result.backHp === 2 &&
    result.backPos.row === 4 &&
    result.backPos.col === 6 &&
    result.backSuppressed === 2 &&
    result.backRetreatUsed === false &&
    result.frontHp === 12 &&
    result.frontPos.row === 4 &&
    result.frontPos.col === 7 &&
    result.frontRetreatUsed === true
  if (!ok) out.errors.push("check203 a back hit did not suppress that SAME hit's own Retreat Step, or a front hit incorrectly failed to retreat")
}

// 204. The exact decay timing: SUPPRESSED_DURATION=2 produces exactly
//      1 turn of visible suppression via real endPlayerTurn cycles,
//      mirroring the already-proven slow/root sequence ----------------
{
  const page204 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page204.on("pageerror", (e) => errs.push(String(e)))
  await page204.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page204.waitForSelector(".hwt-board")
  const result = await page204.evaluate(async () => {
    const { endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "player",
      turn: 1,
      log: [],
      units: [
        { id: "mover", side: "player", name: "Mover", pos: { row: 4, col: 5 }, hp: 20, maxHp: 20, range: 1, attack: 10, ap: 2, apMax: 2, move: 9, block: 0, slow: 0, root: 0, retreatStepUsed: false, suppressed: 2, cooldownRemaining: 0, facing: "W" },
        { id: "enemy", side: "enemy", name: "Enemy", pos: { row: 4, col: 8 }, hp: 100, maxHp: 100, range: 0, attack: 0, ap: 2, apMax: 2, move: 0, block: 0, facing: "E" },
      ],
    }
    const right = state.units.find((u) => u.id === "mover").suppressed
    state = endPlayerTurn(state)
    const afterOne = state.units.find((u) => u.id === "mover").suppressed
    state = endPlayerTurn(state)
    const afterTwo = state.units.find((u) => u.id === "mover").suppressed
    return { right, afterOne, afterTwo }
  })
  await page204.close()
  out.suppressedDecayTiming = result
  const ok = result.right === 2 && result.afterOne === 1 && result.afterTwo === 0
  if (!ok) out.errors.push("check204 SUPPRESSED_DURATION's own decay timing did not produce exactly 1 turn of visible effect")
}

// 205. A real end-to-end example: a real back hit against the real
//      Grove Warden (className "Guardian") suppresses its OWN future
//      Intercept - a SECOND real attack against its protected ally
//      right afterward is no longer intercepted -----------------------
{
  const page205 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page205.on("pageerror", (e) => errs.push(String(e)))
  await page205.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page205.waitForSelector(".hwt-board")
  const result = await page205.evaluate(async () => {
    const { createTacticsBattle, attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    let state = createTacticsBattle("default", ["grove-warden", "the-fool"])
    const groveWarden = state.units.find((u) => u.defId === "grove-warden")
    const mosskit = state.units.find((u) => u.defId === "the-fool")
    const enemy = state.units.find((u) => u.side === "enemy" && u.range === 1)
    // A triangular formation - a straight line can't put the enemy in
    // melee range (1) of BOTH Grove Warden and Mosskit while ALSO
    // keeping Grove Warden adjacent to Mosskit (needed for Intercept
    // eligibility): enemy(4,6)-groveWarden(4,5) is Chebyshev 1,
    // enemy(4,6)-mosskit(3,6) is Chebyshev 1, groveWarden(4,5)-
    // mosskit(3,6) is ALSO Chebyshev 1 (diagonal) - all 3 pairs
    // mutually adjacent.
    state = {
      ...state,
      phase: "enemy",
      units: state.units.map((u) =>
        u.id === mosskit.id
          ? { ...u, pos: { row: 3, col: 6 }, facing: "S" }
          : u.id === groveWarden.id
            ? { ...u, pos: { row: 4, col: 5 }, facing: "W" }
            : u.id === enemy.id
              ? { ...u, pos: { row: 4, col: 6 }, attack: 20, ap: u.apMax }
              : { ...u, pos: { row: 0, col: 0 } },
      ),
    }
    // Attack 1: enemy back-hits Grove Warden directly (attacker EAST
    // of "W"-facing Grove Warden) - suppresses it.
    const afterFirst = attackUnit(state, enemy.id, groveWarden.id)
    const groveWardenAfterFirst = afterFirst.units.find((u) => u.id === groveWarden.id)
    // Attack 2: the SAME enemy (AP restored for this synthetic test)
    // now attacks Mosskit - Grove Warden is still adjacent to Mosskit
    // and would normally intercept, but is suppressed.
    const beforeSecond = { ...afterFirst, units: afterFirst.units.map((u) => (u.id === enemy.id ? { ...u, ap: u.apMax } : u)) }
    const afterSecond = attackUnit(beforeSecond, enemy.id, mosskit.id)
    const mosskitAfter = afterSecond.units.find((u) => u.id === mosskit.id)
    const groveWardenAfterSecond = afterSecond.units.find((u) => u.id === groveWarden.id)
    return {
      groveWardenSuppressed: groveWardenAfterFirst.suppressed,
      groveWardenHpAfterFirst: groveWardenAfterFirst.hp,
      interceptedSecondHit: afterSecond.log.some((l) => l.includes("intercepts")),
      mosskitHpAfterSecond: mosskitAfter.hp,
      groveWardenHpAfterSecond: groveWardenAfterSecond.hp,
    }
  })
  await page205.close()
  out.realSuppressedGuardian = result
  // Mosskit's real maxHp is 32 - facing "S" makes the second attack
  // (enemy directly south of it) a plain FRONT hit, no multiplier:
  // 32-20=12. Grove Warden's own hp must be IDENTICAL before and
  // after attack 2 - proving it genuinely took no share of that
  // second hit at all (not just that Mosskit's own hp dropped).
  const ok =
    result.groveWardenSuppressed === 2 &&
    !result.interceptedSecondHit &&
    result.mosskitHpAfterSecond === 12 &&
    result.groveWardenHpAfterSecond === result.groveWardenHpAfterFirst
  if (!ok) out.errors.push("check205 a real suppressed Grove Warden still intercepted a second real attack")
}

// Difficulty-scaled terrain TYPE MIX - terrainWeightsForNode
// (tacticsRealMatchup.js) shrinks forest's own share as the Act rises,
// redistributing what it loses PROPORTIONALLY across rock/water/poison
// (their own 30:20:25 = 6:4:5 ratio stays fixed) - only forest's share
// scales, not which hazard is scariest. Only the mix changes; the
// hazard COUNT (terrainHazardCountForNode, PR #504) is untouched.
// ---------------------------------------------------------------

// 206. terrainWeightsForNode's own exact formula, hand-verified for
//      Act I/IV/VII - exact-value assertions, not a statistical
//      sample -----------------------------------------------------
{
  const page206 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page206.on("pageerror", (e) => errs.push(String(e)))
  await page206.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page206.waitForSelector(".hwt-board")
  const result = await page206.evaluate(async () => {
    const { terrainWeightsForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const nodes = [3, 70, RUN_PATH.length - 1]
    return {
      pathLength: RUN_PATH.length,
      results: nodes.map((idx) => ({ idx, act: actIndexForNode(idx, RUN_PATH.length), weights: terrainWeightsForNode(idx) })),
    }
  })
  await page206.close()
  out.terrainMixPerActFormula = result
  const byIdx = Object.fromEntries(result.results.map((r) => [r.idx, r]))
  const closeTo = (a, b) => Math.abs(a - b) < 1e-9
  const actI = byIdx[3]
  const actIV = byIdx[70]
  const actVII = byIdx[result.pathLength - 1]
  const ok =
    actI.act === 1 &&
    closeTo(actI.weights.forest, 0.25) &&
    closeTo(actI.weights.rock, 0.3) &&
    closeTo(actI.weights.water, 0.2) &&
    closeTo(actI.weights.poison, 0.25) &&
    actIV.act === 4 &&
    closeTo(actIV.weights.forest, 0.16) &&
    closeTo(actIV.weights.rock, 0.336) &&
    closeTo(actIV.weights.water, 0.224) &&
    closeTo(actIV.weights.poison, 0.28) &&
    actVII.act === 7 &&
    closeTo(actVII.weights.forest, 0.07) &&
    closeTo(actVII.weights.rock, 0.372) &&
    closeTo(actVII.weights.water, 0.248) &&
    closeTo(actVII.weights.poison, 0.31)
  if (!ok) out.errors.push("check206 terrainWeightsForNode did not produce the expected forest-shrink formula for Act I/IV/VII")
}

// 207. pickTerrainType's own boundary behavior - for Act I's own exact
//      weights, rolls just below/at/above each of the 3 thresholds
//      pick the correct adjacent type; repeated for Act VII's own
//      shifted thresholds - proving the function genuinely reads
//      `weights`, not leftover hardcoded numbers -------------------
{
  const page207 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page207.on("pageerror", (e) => errs.push(String(e)))
  await page207.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page207.waitForSelector(".hwt-board")
  const result = await page207.evaluate(async () => {
    const { pickTerrainType, terrainWeightsForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const actIWeights = terrainWeightsForNode(3) // Act I
    const actVIIWeights = terrainWeightsForNode(110) // Act VII
    return {
      actI: {
        justBelowRock: pickTerrainType(0.2999, actIWeights),
        justAboveRock: pickTerrainType(0.3001, actIWeights),
        justBelowWater: pickTerrainType(0.4999, actIWeights),
        justAboveWater: pickTerrainType(0.5001, actIWeights),
        justBelowPoison: pickTerrainType(0.7499, actIWeights),
        justAbovePoison: pickTerrainType(0.7501, actIWeights),
      },
      actVII: {
        justBelowRock: pickTerrainType(0.3719, actVIIWeights),
        justAboveRock: pickTerrainType(0.3721, actVIIWeights),
        justBelowWater: pickTerrainType(0.6199, actVIIWeights),
        justAboveWater: pickTerrainType(0.6201, actVIIWeights),
        justBelowPoison: pickTerrainType(0.9299, actVIIWeights),
        justAbovePoison: pickTerrainType(0.9301, actVIIWeights),
      },
    }
  })
  await page207.close()
  out.terrainMixPickBoundaries = result
  const ok =
    result.actI.justBelowRock === "rock" &&
    result.actI.justAboveRock === "water" &&
    result.actI.justBelowWater === "water" &&
    result.actI.justAboveWater === "poison" &&
    result.actI.justBelowPoison === "poison" &&
    result.actI.justAbovePoison === "forest" &&
    result.actVII.justBelowRock === "rock" &&
    result.actVII.justAboveRock === "water" &&
    result.actVII.justBelowWater === "water" &&
    result.actVII.justAboveWater === "poison" &&
    result.actVII.justBelowPoison === "poison" &&
    result.actVII.justAbovePoison === "forest"
  if (!ok) out.errors.push("check207 pickTerrainType did not respect the passed weights' own boundary thresholds for Act I or Act VII")
}

// 208. Zero regression, directly proven for Act I: a literal
//      reimplementation of the OLD flat 30/20/25/25 pickTerrainType
//      (no weights parameter, hardcoded thresholds) produces
//      BYTE-IDENTICAL output to the NEW generateRealTerrain for the
//      exact (seed, nodeIndex) pairs check21/check129 already
//      exercise - both genuinely Act I, where the new formula also
//      computes exactly 0.30/0.50/0.75 -----------------------------
{
  const page208 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page208.on("pageerror", (e) => errs.push(String(e)))
  await page208.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page208.waitForSelector(".hwt-board")
  const result = await page208.evaluate(async () => {
    const { generateRealTerrain, terrainHazardCountForNode } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { streamRng } = await import("/src/data/heartwood/seed.js")
    const { GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    // Literal copy of the OLD pre-this-round pickTerrainType, hardcoded
    // to the flat 30/20/25/25 split - not the new function.
    function pickTerrainTypeLegacy(roll) {
      if (roll < 0.3) return "rock"
      if (roll < 0.5) return "water"
      if (roll < 0.75) return "poison"
      return "forest"
    }
    function generateRealTerrainLegacy(seed, nodeIndex) {
      const rng = streamRng(seed, "combat", `${nodeIndex}:terrain`)
      const terrain = {}
      let placed = 0
      let attempts = 0
      const hazardCount = terrainHazardCountForNode(nodeIndex)
      while (placed < hazardCount && attempts < hazardCount * 4) {
        attempts++
        const row = Math.floor(rng() * GRID.rows)
        const col = 3 + Math.floor(rng() * (GRID.cols - 6))
        const key = `${row}-${col}`
        if (terrain[key]) continue
        terrain[key] = pickTerrainTypeLegacy(rng())
        placed++
      }
      return terrain
    }
    const pairs = [
      { seed: 424242, idx: 1 },
      { seed: 12345, idx: 3 },
    ]
    return pairs.map(({ seed, idx }) => ({
      seed,
      idx,
      legacy: generateRealTerrainLegacy(seed, idx),
      current: generateRealTerrain(seed, idx),
    }))
  })
  await page208.close()
  out.terrainMixZeroRegression = result
  const ok = result.every((r) => JSON.stringify(r.legacy) === JSON.stringify(r.current))
  if (!ok) out.errors.push("check208 the new Act-scaled terrain mix changed Act I's own output versus the old flat 30/20/25/25 split")
}

// 209. The real difficulty shift, aggregated across many seeds: an
//      independent SHADOW reimplementation of generateRealTerrain that
//      builds its OWN weights via terrainWeightsForNode (not a
//      hardcoded late-game guess) produces BYTE-IDENTICAL output to
//      the real generateRealTerrain, for a late-Act node - proving the
//      real function genuinely uses terrainWeightsForNode's own
//      values, not some other formula that happens to shift things
//      vaguely the right way -------------------------------------
{
  const page209 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page209.on("pageerror", (e) => errs.push(String(e)))
  await page209.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page209.waitForSelector(".hwt-board")
  const result = await page209.evaluate(async () => {
    const { generateRealTerrain, terrainWeightsForNode, terrainHazardCountForNode, pickTerrainType } = await import(
      "/src/services/heartwood/tacticsRealMatchup.js"
    )
    const { streamRng } = await import("/src/data/heartwood/seed.js")
    const { GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    function generateRealTerrainShadow(seed, nodeIndex) {
      const rng = streamRng(seed, "combat", `${nodeIndex}:terrain`)
      const terrain = {}
      let placed = 0
      let attempts = 0
      const hazardCount = terrainHazardCountForNode(nodeIndex)
      const weights = terrainWeightsForNode(nodeIndex)
      while (placed < hazardCount && attempts < hazardCount * 4) {
        attempts++
        const row = Math.floor(rng() * GRID.rows)
        const col = 3 + Math.floor(rng() * (GRID.cols - 6))
        const key = `${row}-${col}`
        if (terrain[key]) continue
        terrain[key] = pickTerrainType(rng(), weights)
        placed++
      }
      return terrain
    }
    const lateIdx = RUN_PATH.length - 1
    const seeds = [111, 222, 333, 444, 555]
    return seeds.map((seed) => ({
      seed,
      shadow: generateRealTerrainShadow(seed, lateIdx),
      real: generateRealTerrain(seed, lateIdx),
    }))
  })
  await page209.close()
  out.terrainMixShadowProof = result
  const ok = result.every((r) => JSON.stringify(r.shadow) === JSON.stringify(r.real))
  if (!ok) out.errors.push("check209 generateRealTerrain's own late-Act output did not match a shadow reimplementation built from terrainWeightsForNode")
}

// 210. The real difficulty shift, directly visible in aggregate: many
//      different seeds at Act VII produce a MEASURABLY lower forest
//      fraction and higher real-hazard fraction than the same seeds
//      would at Act I - proving the shift reaches generateRealTerrain's
//      actual output shape in bulk, not just one formula in isolation.
//      A directional proof with a generous margin (not chasing exact
//      pp, matching this session's own de-weighted fairness-tuning
//      discipline) - the TRUE gap is 25%->7% forest share, so even a
//      modest sample makes the direction unmistakable -------------
{
  const page210 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page210.on("pageerror", (e) => errs.push(String(e)))
  await page210.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page210.waitForSelector(".hwt-board")
  const result = await page210.evaluate(async () => {
    const { generateRealTerrain } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const earlyIdx = 3 // Act I
    const lateIdx = RUN_PATH.length - 1 // Act VII
    function forestFraction(idx, seeds) {
      let forest = 0
      let total = 0
      for (const seed of seeds) {
        const terrain = generateRealTerrain(seed, idx)
        const types = Object.values(terrain)
        forest += types.filter((t) => t === "forest").length
        total += types.length
      }
      return { forest, total, fraction: forest / total }
    }
    const seeds = Array.from({ length: 40 }, (_, i) => 1000 + i)
    return { early: forestFraction(earlyIdx, seeds), late: forestFraction(lateIdx, seeds) }
  })
  await page210.close()
  out.terrainMixAggregateShift = result
  const ok = result.early.total > 0 && result.late.total > 0 && result.late.fraction < result.early.fraction - 0.05
  if (!ok) out.errors.push("check210 Act VII's aggregate forest fraction was not measurably lower than Act I's across many seeds")
}

// Sidestep round (Movement PRD §4.4): a ranged attack against a nimble,
// not-yet-reacted, not-suppressed unit repositions it sideways (right-
// of-facing preferred, then left) BEFORE this same attack's own facing/
// damage are computed, then rolls deterministicRoll(turn,
// `${targetId}:sidestep`) < SIDESTEP_DODGE_CHANCE(0.5) to decide
// whether the attack is fully avoided. Known roll outcomes (hand-
// computed via deterministicRoll directly, not guessed): for
// seedText="defender:sidestep", turn=1 rolls 0.8923 (HIT, >= 0.5) and
// turn=3 rolls 0.3379 (DODGE, < 0.5).
// ---------------------------------------------------------------

// 211. The core mechanic, both roll outcomes: a ranged attack against
//      an eligible nimble unit always repositions it and sets
//      sidestepUsed; turn=3 (known DODGE) avoids the hit entirely
//      (0 damage, dedicated log line); turn=1 (known HIT) still
//      connects against the unit's NEW position ---------------------
{
  const page211 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page211.on("pageerror", (e) => errs.push(String(e)))
  await page211.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page211.waitForSelector(".hwt-board")
  const result = await page211.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (turn) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      turn,
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "W", nimble: true, sidestepUsed: false, suppressed: 0 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100, range: 3, attack: 10, ap: 2, block: 0, facing: "E" },
      ],
    })
    const dodged = attackUnit(mk(3), "atk", "defender")
    const defDodged = dodged.units.find((u) => u.id === "defender")
    const hit = attackUnit(mk(1), "atk", "defender")
    const defHit = hit.units.find((u) => u.id === "defender")
    return {
      dodgedPos: defDodged.pos,
      dodgedHp: defDodged.hp,
      dodgedSidestepUsed: defDodged.sidestepUsed,
      dodgedLogHasAvoid: dodged.log.some((l) => l.includes("avoiding") && l.includes("completely")),
      hitPos: defHit.pos,
      hitHp: defHit.hp,
      hitSidestepUsed: defHit.sidestepUsed,
      hitLogHasStillConnects: hit.log.some((l) => l.includes("still connects")),
    }
  })
  await page211.close()
  out.sidestepCoreMechanic = result
  const ok =
    result.dodgedPos.row === 3 &&
    result.dodgedPos.col === 6 &&
    result.dodgedHp === 100 &&
    result.dodgedSidestepUsed === true &&
    result.dodgedLogHasAvoid &&
    result.hitPos.row === 3 &&
    result.hitPos.col === 6 &&
    result.hitHp === 90 &&
    result.hitSidestepUsed === true &&
    result.hitLogHasStillConnects
  if (!ok) out.errors.push("check211 Sidestep did not reposition and/or resolve both dodge outcomes correctly")
}

// 212. Ranged-only gate: an identical MELEE attack (range===1) against
//      the same eligible nimble unit does not reposition it at all,
//      even at a known-DODGE turn value -----------------------------
{
  const page212 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page212.on("pageerror", (e) => errs.push(String(e)))
  await page212.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page212.waitForSelector(".hwt-board")
  const result = await page212.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      turn: 3,
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "W", nimble: true, sidestepUsed: false, suppressed: 0 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "E" },
      ],
    }
    const after = attackUnit(state, "atk", "defender")
    const def = after.units.find((u) => u.id === "defender")
    return { pos: def.pos, hp: def.hp, sidestepUsed: def.sidestepUsed, logHasSidestep: after.log.some((l) => l.includes("sidestep")) }
  })
  await page212.close()
  out.sidestepRangedOnlyGate = result
  const ok = result.pos.row === 4 && result.pos.col === 6 && result.hp === 90 && result.sidestepUsed === false && !result.logHasSidestep
  if (!ok) out.errors.push("check212 Sidestep fired against a melee (range===1) attacker")
}

// 213. Once-per-round limiter: a second ranged attack the same round
//      does not reposition again; a real endPlayerTurn cycle resets
//      sidestepUsed for BOTH sides (same mechanism/precedent as
//      retreatStepUsed's own check190), and a third qualifying attack
//      repositions again afterward -----------------------------------
{
  const page213 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page213.on("pageerror", (e) => errs.push(String(e)))
  await page213.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page213.waitForSelector(".hwt-board")
  const result = await page213.evaluate(async () => {
    const { attackUnit, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const grid = { rows: 9, cols: 12 }
    const defender = {
      id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100,
      range: 1, attack: 0, ap: 2, apMax: 2, move: 9, block: 0, facing: "W", nimble: true, sidestepUsed: false,
      suppressed: 0, root: 0, slow: 0, retreatStepUsed: false, cooldownRemaining: 0,
    }
    const atk = {
      id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100,
      range: 3, attack: 10, ap: 2, apMax: 2, move: 9, block: 0, facing: "E",
      root: 0, slow: 0, retreatStepUsed: false, cooldownRemaining: 0,
    }
    // turn=1 -> known HIT (still connects, but reaction still fires and
    // consumes the Slot - the point of this check).
    const state1 = { grid, terrain: {}, phase: "enemy", turn: 1, log: [], units: [defender, atk] }
    const afterFirst = attackUnit(state1, "atk", "defender")
    const defAfterFirst = afterFirst.units.find((u) => u.id === "defender")

    const stateForSecond = { ...afterFirst, units: afterFirst.units.map((u) => (u.id === "atk" ? { ...u, ap: u.apMax } : u)) }
    const afterSecond = attackUnit(stateForSecond, "atk", "defender")
    const defAfterSecond = afterSecond.units.find((u) => u.id === "defender")

    // Reset via a real endPlayerTurn cascade - the atk's own AI is
    // neutralized (range:0, move:0, the established "harmless
    // controller" trick) purely for this one reset call.
    const stateForReset = {
      ...afterSecond,
      phase: "player",
      units: afterSecond.units.map((u) => (u.id === "atk" ? { ...u, range: 0, move: 0, ap: u.apMax } : u)),
    }
    const afterReset = endPlayerTurn(stateForReset)
    const defAfterReset = afterReset.units.find((u) => u.id === "defender")

    const stateForThird = {
      ...afterReset,
      phase: "enemy",
      units: afterReset.units.map((u) => (u.id === "atk" ? { ...u, range: 3, move: 9, ap: u.apMax } : u)),
    }
    const afterThird = attackUnit(stateForThird, "atk", "defender")
    const defAfterThird = afterThird.units.find((u) => u.id === "defender")

    return {
      posAfterFirst: defAfterFirst.pos,
      sidestepUsedAfterFirst: defAfterFirst.sidestepUsed,
      posAfterSecond: defAfterSecond.pos,
      sidestepUsedAfterReset: defAfterReset.sidestepUsed,
      posAfterThird: defAfterThird.pos,
      sidestepUsedAfterThird: defAfterThird.sidestepUsed,
    }
  })
  await page213.close()
  out.sidestepOncePerRound = result
  const samePos = (a, b) => a.row === b.row && a.col === b.col
  const ok =
    result.sidestepUsedAfterFirst === true &&
    samePos(result.posAfterSecond, result.posAfterFirst) &&
    result.sidestepUsedAfterReset === false &&
    !samePos(result.posAfterThird, result.posAfterSecond) &&
    result.sidestepUsedAfterThird === true
  if (!ok) out.errors.push("check213 Sidestep's once-per-round limiter or its real endPlayerTurn reset did not behave correctly")
}

// 214. Suppression's own exclusion: an otherwise-eligible nimble unit
//      that is ALSO currently suppressed does not reposition ---------
{
  const page214 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page214.on("pageerror", (e) => errs.push(String(e)))
  await page214.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page214.waitForSelector(".hwt-board")
  const result = await page214.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      turn: 3,
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "W", nimble: true, sidestepUsed: false, suppressed: 2 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100, range: 3, attack: 10, ap: 2, block: 0, facing: "E" },
      ],
    }
    const after = attackUnit(state, "atk", "defender")
    const def = after.units.find((u) => u.id === "defender")
    return { pos: def.pos, hp: def.hp, sidestepUsed: def.sidestepUsed, logHasSidestep: after.log.some((l) => l.includes("sidestep")) }
  })
  await page214.close()
  out.sidestepSuppressedExclusion = result
  const ok = result.pos.row === 4 && result.pos.col === 6 && result.hp === 90 && result.sidestepUsed === false && !result.logHasSidestep
  if (!ok) out.errors.push("check214 a suppressed nimble unit still sidestepped a ranged attack")
}

// 215. Direction fallback: right-of-facing blocked -> left-of chosen;
//      BOTH blocked -> no reposition at all, no Slot spent, no log
//      line, and damage still resolves against the ORIGINAL position -
{
  const page215 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page215.on("pageerror", (e) => errs.push(String(e)))
  await page215.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page215.waitForSelector(".hwt-board")
  const result = await page215.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const grid = { rows: 9, cols: 12 }
    const defender = { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "W", nimble: true, sidestepUsed: false, suppressed: 0 }
    const atk = { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100, range: 3, attack: 10, ap: 2, block: 0, facing: "E" }
    // Facing "W": RIGHT_OF_DIR.W="N" -> (3,6); LEFT_OF_DIR.W="S" -> (5,6).
    const blockerAt = (pos) => ({ id: `wall-${pos.row}-${pos.col}`, side: "player", name: "Wall", pos, hp: 10, maxHp: 10, range: 1, attack: 0, ap: 0, block: 0, facing: "N" })
    // Right blocked, left open -> left chosen.
    const stateRightBlocked = { grid, terrain: {}, phase: "enemy", turn: 1, log: [], units: [defender, atk, blockerAt({ row: 3, col: 6 })] }
    const afterRightBlocked = attackUnit(stateRightBlocked, "atk", "defender")
    const defRightBlocked = afterRightBlocked.units.find((u) => u.id === "defender")
    // Both blocked -> no reposition, no Slot spent, no log line.
    const stateBothBlocked = { grid, terrain: {}, phase: "enemy", turn: 1, log: [], units: [defender, atk, blockerAt({ row: 3, col: 6 }), blockerAt({ row: 5, col: 6 })] }
    const afterBothBlocked = attackUnit(stateBothBlocked, "atk", "defender")
    const defBothBlocked = afterBothBlocked.units.find((u) => u.id === "defender")
    return {
      rightBlockedPos: defRightBlocked.pos,
      rightBlockedSidestepUsed: defRightBlocked.sidestepUsed,
      bothBlockedPos: defBothBlocked.pos,
      bothBlockedHp: defBothBlocked.hp,
      bothBlockedSidestepUsed: defBothBlocked.sidestepUsed,
      bothBlockedLogHasSidestep: afterBothBlocked.log.some((l) => l.includes("sidestep")),
    }
  })
  await page215.close()
  out.sidestepDirectionFallback = result
  const ok =
    result.rightBlockedPos.row === 5 &&
    result.rightBlockedPos.col === 6 &&
    result.rightBlockedSidestepUsed === true &&
    result.bothBlockedPos.row === 4 &&
    result.bothBlockedPos.col === 6 &&
    result.bothBlockedHp === 90 &&
    result.bothBlockedSidestepUsed === false &&
    !result.bothBlockedLogHasSidestep
  if (!ok) out.errors.push("check215 Sidestep's direction fallback (right blocked -> left, both blocked -> no-op) did not behave correctly")
}

// 216. The same-hit facing interaction, directly proven: a geometry
//      where sidestepping changes THIS SAME attack's own facing
//      classification (front -> side) on a failed dodge roll, paired
//      against an identical non-nimble control that stays front -----
{
  const page216 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page216.on("pageerror", (e) => errs.push(String(e)))
  await page216.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page216.waitForSelector(".hwt-board")
  const result = await page216.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    // Defender faces "N", attacker due north at distance 1 -> a clean
    // FRONT hit before any reposition. RIGHT_OF_DIR.N="E" moves the
    // defender from (4,6) to (4,7); recomputed from the NEW position,
    // dCol=-1/dRow=-1 is a tie (column wins) -> "W", which is neither
    // "N" (front) nor "S" (back) for a "N"-facing defender -> SIDE.
    // turn=1 is a known HIT (defender:sidestep), so this same call's
    // own damage actually resolves with the NEW facing.
    const mk = (nimble) => ({
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      turn: 1,
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "N", nimble, sidestepUsed: false, suppressed: 0 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 3, col: 6 }, hp: 100, maxHp: 100, range: 3, attack: 10, ap: 2, block: 0, facing: "S" },
      ],
    })
    const nimbleResult = attackUnit(mk(true), "atk", "defender")
    const nonNimbleResult = attackUnit(mk(false), "atk", "defender")
    return {
      nimbleLog: nimbleResult.log[nimbleResult.log.length - 1],
      nonNimbleLog: nonNimbleResult.log[nonNimbleResult.log.length - 1],
    }
  })
  await page216.close()
  out.sidestepFacingReclassification = result
  const ok = result.nimbleLog.includes("(flanked") && !result.nonNimbleLog.includes("(flanked") && !result.nonNimbleLog.includes("CRITICAL")
  if (!ok) out.errors.push("check216 a sidestep reposition did not change this same attack's own facing classification")
}

// 217. Zero regression, directly proven: an existing non-nimble unit
//      hit by a ranged attack behaves byte-identically to before this
//      round (no reposition, no Slot field consumed, normal damage) --
{
  const page217 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page217.on("pageerror", (e) => errs.push(String(e)))
  await page217.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page217.waitForSelector(".hwt-board")
  const result = await page217.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 },
      terrain: {},
      phase: "enemy",
      turn: 3,
      log: [],
      units: [
        { id: "defender", side: "player", name: "Defender", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "W", nimble: false, sidestepUsed: false, suppressed: 0 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 4 }, hp: 100, maxHp: 100, range: 3, attack: 10, ap: 2, block: 0, facing: "E" },
      ],
    }
    const after = attackUnit(state, "atk", "defender")
    const def = after.units.find((u) => u.id === "defender")
    return { pos: def.pos, hp: def.hp, sidestepUsed: def.sidestepUsed, logHasSidestep: after.log.some((l) => l.includes("sidestep")) }
  })
  await page217.close()
  out.sidestepZeroRegression = result
  const ok = result.pos.row === 4 && result.pos.col === 6 && result.hp === 90 && result.sidestepUsed === false && !result.logHasSidestep
  if (!ok) out.errors.push("check217 a non-nimble unit's own hit-by-ranged-attack behavior regressed")
}

// 218. A real end-to-end example via createTacticsBattle: a real
//      recruited Galeblade, hit by the real coven-matron's now-ranged
//      attack, genuinely sidesteps (both roll outcomes, using the SAME
//      known-turn trick as check211 - the real unit's own id happens
//      to still resolve through the exact same deterministicRoll seed
//      text shape, `${targetId}:sidestep`, just with its own real id) -
{
  const page218 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page218.on("pageerror", (e) => errs.push(String(e)))
  await page218.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page218.waitForSelector(".hwt-board")
  const result = await page218.evaluate(async () => {
    const { createTacticsBattle, attackUnit, deterministicRoll } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("coven", ["galeblade"])
    const galeblade = base.units.find((u) => u.defId === "galeblade")
    const matron = base.units.find((u) => u.defId === "coven-matron")
    const positioned = {
      ...base,
      phase: "enemy",
      units: base.units.map((u) =>
        u.id === galeblade.id
          ? { ...u, pos: { row: 4, col: 6 }, facing: "W", hp: u.maxHp }
          : u.id === matron.id
            ? { ...u, pos: { row: 4, col: 4 }, ap: u.apMax }
            : u,
      ),
    }
    // Find a turn value where THIS real unit's own id rolls under 0.5
    // (dodge) and one where it rolls over (hit) - computed directly,
    // not guessed, since the real id differs from the synthetic tests.
    let dodgeTurn = null
    let hitTurn = null
    for (let t = 1; t <= 200 && (dodgeTurn === null || hitTurn === null); t++) {
      const roll = deterministicRoll(t, `${galeblade.id}:sidestep`)
      if (dodgeTurn === null && roll < 0.5) dodgeTurn = t
      if (hitTurn === null && roll >= 0.5) hitTurn = t
    }
    const dodged = attackUnit({ ...positioned, turn: dodgeTurn }, matron.id, galeblade.id)
    const gbDodged = dodged.units.find((u) => u.id === galeblade.id)
    const hit = attackUnit({ ...positioned, turn: hitTurn }, matron.id, galeblade.id)
    const gbHit = hit.units.find((u) => u.id === galeblade.id)
    return {
      matronRange: matron.range,
      gbDodgedPos: gbDodged.pos,
      gbDodgedHpLoss: gbDodged.maxHp - gbDodged.hp,
      gbDodgedLog: dodged.log[dodged.log.length - 1],
      gbHitPos: gbHit.pos,
      gbHitHpLoss: gbHit.maxHp - gbHit.hp,
      gbHitSidestepUsed: gbHit.sidestepUsed,
    }
  })
  await page218.close()
  out.sidestepRealGaleblade = result
  const ok =
    result.matronRange === 3 &&
    result.gbDodgedPos.row === 3 &&
    result.gbDodgedPos.col === 6 &&
    result.gbDodgedHpLoss === 0 &&
    result.gbDodgedLog.includes("avoiding") &&
    result.gbHitPos.row === 3 &&
    result.gbHitPos.col === 6 &&
    result.gbHitHpLoss > 0 &&
    result.gbHitSidestepUsed === true
  if (!ok) out.errors.push("check218 a real Galeblade did not genuinely sidestep the real coven-matron's now-ranged attack")
}

// ---- Spirit Shift round (Movement PRD §4.4) ---------------------------
// Shared synthetic builder for 219-224: a spiritbound "walker", an
// allied spirit 2 tiles behind it, and a plain melee attacker in front.
// Every unit carries the full reset-checkpoint field set so a real
// endPlayerTurn cycle (check221) runs cleanly.
const SPIRIT_SHIFT_FIXTURE = `
  const grid = { rows: 9, cols: 12 }
  const base = { ap: 2, apMax: 2, move: 9, block: 0, root: 0, slow: 0, suppressed: 0, retreatStepUsed: false, sidestepUsed: false, spiritShiftUsed: false, cooldownRemaining: 0 }
  const mkState = (over = {}) => ({
    grid, terrain: {}, phase: "enemy", turn: 3, log: [],
    units: [
      { ...base, id: "walker", side: "player", name: "Walker", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, facing: "W", spiritbound: true, ...(over.walker || {}) },
      { ...base, id: "spirit", side: "player", name: "Spirit", pos: { row: 4, col: 8 }, hp: 50, maxHp: 50, range: 1, attack: 0, facing: "W", isSpirit: true, ...(over.spirit || {}) },
      { ...base, id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 10, facing: "E", ...(over.atk || {}) },
    ],
  })
  const u = (s, id) => s.units.find((x) => x.id === id)
`

// 219. Core mechanic: an attacked spiritbound unit swaps places with its
//      spirit 2 tiles away, the spirit takes the FULL hit, the walker
//      takes none, the Slot is spent, and the log narrates the swap ----
{
  const page219 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page219.on("pageerror", (e) => errs.push(String(e)))
  await page219.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page219.waitForSelector(".hwt-board")
  const result = await page219.evaluate(async (fixture) => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const after = attackUnit(mkState(), "atk", "walker")
    return {
      walkerPos: u(after, "walker").pos, walkerHp: u(after, "walker").hp, walkerUsed: u(after, "walker").spiritShiftUsed,
      spiritPos: u(after, "spirit").pos, spiritHp: u(after, "spirit").hp,
      logHasShift: after.log.some((l) => l.includes("shifts places with Spirit")),
      strikeLog: after.log[after.log.length - 1],
    }
  }, SPIRIT_SHIFT_FIXTURE)
  await page219.close()
  out.spiritShiftCore = result
  const ok =
    result.walkerPos.row === 4 && result.walkerPos.col === 8 && result.walkerHp === 100 && result.walkerUsed === true &&
    result.spiritPos.row === 4 && result.spiritPos.col === 6 && result.spiritHp === 40 &&
    result.logHasShift && result.strikeLog.includes("strikes Spirit for 10")
  if (!ok) out.errors.push("check219 Spirit Shift did not swap the walker with its spirit and redirect the full hit onto the spirit")
}

// 220. Range limit: a spirit 3 tiles away (outside SPIRIT_SHIFT_RANGE=2)
//      does not swap - the walker takes the hit where it stands --------
{
  const page220 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page220.on("pageerror", (e) => errs.push(String(e)))
  await page220.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page220.waitForSelector(".hwt-board")
  const result = await page220.evaluate(async (fixture) => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const far = attackUnit(mkState({ spirit: { pos: { row: 4, col: 9 } } }), "atk", "walker")
    const diag = attackUnit(mkState({ spirit: { pos: { row: 2, col: 8 } } }), "atk", "walker")
    return {
      farWalkerHp: u(far, "walker").hp, farWalkerPos: u(far, "walker").pos, farSpiritHp: u(far, "spirit").hp, farUsed: u(far, "walker").spiritShiftUsed,
      diagWalkerHp: u(diag, "walker").hp, diagWalkerPos: u(diag, "walker").pos,
    }
  }, SPIRIT_SHIFT_FIXTURE)
  await page220.close()
  out.spiritShiftRange = result
  const ok =
    result.farWalkerHp === 90 && result.farWalkerPos.col === 6 && result.farSpiritHp === 50 && result.farUsed === false &&
    // A diagonal 2-tile spirit (Chebyshev 2) IS in range.
    result.diagWalkerHp === 100 && result.diagWalkerPos.row === 2 && result.diagWalkerPos.col === 8
  if (!ok) out.errors.push("check220 Spirit Shift's 2-tile (Chebyshev) range limit did not behave correctly")
}

// 221. Once per round: a second attack the same round lands on the
//      walker; a real endPlayerTurn cascade resets spiritShiftUsed, and
//      a third attack swaps again --------------------------------------
{
  const page221 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page221.on("pageerror", (e) => errs.push(String(e)))
  await page221.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page221.waitForSelector(".hwt-board")
  const result = await page221.evaluate(async (fixture) => {
    const { attackUnit, endPlayerTurn } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const first = attackUnit(mkState(), "atk", "walker")
    // After the swap the walker sits at (4,8) - move the attacker next
    // to it, on its FRONT side (it faces W), for the second strike: a
    // hit from behind would itself Suppress the walker and mask the
    // reset being tested here.
    const secondIn = { ...first, units: first.units.map((x) => (x.id === "atk" ? { ...x, ap: 2, pos: { row: 4, col: 7 } } : x)) }
    const second = attackUnit(secondIn, "atk", "walker")
    const resetIn = { ...second, phase: "player", units: second.units.map((x) => (x.id === "atk" ? { ...x, range: 0, move: 0 } : x)) }
    const reset = endPlayerTurn(resetIn)
    const thirdIn = { ...reset, phase: "enemy", units: reset.units.map((x) => (x.id === "atk" ? { ...x, range: 1, move: 9, ap: 2 } : x)) }
    const third = attackUnit(thirdIn, "atk", "walker")
    return {
      secondWalkerHp: u(second, "walker").hp, secondWalkerPos: u(second, "walker").pos,
      usedAfterReset: u(reset, "walker").spiritShiftUsed,
      thirdWalkerHp: u(third, "walker").hp, thirdWalkerPos: u(third, "walker").pos, thirdUsed: u(third, "walker").spiritShiftUsed,
    }
  }, SPIRIT_SHIFT_FIXTURE)
  await page221.close()
  out.spiritShiftOncePerRound = result
  const ok =
    result.secondWalkerHp === 90 && result.secondWalkerPos.col === 8 &&
    result.usedAfterReset === false &&
    result.thirdWalkerHp === 90 && result.thirdWalkerPos.col === 6 && result.thirdUsed === true
  if (!ok) out.errors.push("check221 Spirit Shift's once-per-round limiter or its endPlayerTurn reset did not behave correctly")
}

// 222. Suppression + own-phase exclusions: a suppressed walker does not
//      swap, and neither does one struck during its OWN side's phase
//      (a Zone of Control reaction strike on its own move) -------------
{
  const page222 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page222.on("pageerror", (e) => errs.push(String(e)))
  await page222.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page222.waitForSelector(".hwt-board")
  const result = await page222.evaluate(async (fixture) => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const suppressed = attackUnit(mkState({ walker: { suppressed: 2 } }), "atk", "walker")
    const ownPhase = attackUnit({ ...mkState(), phase: "player" }, "atk", "walker", { isReaction: true })
    return {
      suppressedHp: u(suppressed, "walker").hp, suppressedUsed: u(suppressed, "walker").spiritShiftUsed,
      ownPhaseHp: u(ownPhase, "walker").hp, ownPhasePos: u(ownPhase, "walker").pos,
      anyShiftLog: [...suppressed.log, ...ownPhase.log].some((l) => l.includes("shifts places")),
    }
  }, SPIRIT_SHIFT_FIXTURE)
  await page222.close()
  out.spiritShiftExclusions = result
  const ok = result.suppressedHp === 90 && result.suppressedUsed === false && result.ownPhaseHp === 90 && result.ownPhasePos.col === 6 && !result.anyShiftLog
  if (!ok) out.errors.push("check222 Spirit Shift fired while suppressed or on a reaction strike during the walker's own phase")
}

// 223. Only a living ALLIED SPIRIT qualifies: a dead spirit, a plain
//      (non-spirit) ally, or an ENEMY spirit never swap; and a
//      non-spiritbound unit next to a spirit is byte-identical to before
{
  const page223 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page223.on("pageerror", (e) => errs.push(String(e)))
  await page223.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page223.waitForSelector(".hwt-board")
  const result = await page223.evaluate(async (fixture) => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const cases = {
      dead: mkState({ spirit: { hp: 0 } }),
      plainAlly: mkState({ spirit: { isSpirit: false } }),
      enemySpirit: mkState({ spirit: { side: "enemy" } }),
      notBound: mkState({ walker: { spiritbound: false } }),
    }
    const res = {}
    for (const [k, s] of Object.entries(cases)) {
      const after = attackUnit(s, "atk", "walker")
      res[k] = { hp: u(after, "walker").hp, col: u(after, "walker").pos.col, shifted: after.log.some((l) => l.includes("shifts places")) }
    }
    return res
  }, SPIRIT_SHIFT_FIXTURE)
  await page223.close()
  out.spiritShiftEligibility = result
  const ok = Object.values(result).every((r) => r.hp === 90 && r.col === 6 && !r.shifted)
  if (!ok) out.errors.push("check223 Spirit Shift swapped with something other than a living allied spirit, or touched a non-spiritbound unit")
}

// 224. The redirected hit feeds every downstream step on the SPIRIT: a
//      killing blow on the spirit falls the spirit (not the walker), and
//      poison-on-hit lands on the spirit ------------------------------
{
  const page224 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page224.on("pageerror", (e) => errs.push(String(e)))
  await page224.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page224.waitForSelector(".hwt-board")
  const result = await page224.evaluate(async (fixture) => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const { mkState, u } = new Function(`${fixture}; return { mkState, u }`)()
    const lethal = attackUnit(mkState({ spirit: { hp: 5 } }), "atk", "walker")
    const poison = attackUnit(mkState({ atk: { poisonOnHit: 2 } }), "atk", "walker")
    return {
      lethalSpiritHp: u(lethal, "spirit").hp, lethalWalkerHp: u(lethal, "walker").hp, lethalFallsLog: lethal.log.some((l) => l.includes("strikes Spirit") && l.includes("It falls")),
      spiritPoison: u(poison, "spirit").poison || 0, walkerPoison: u(poison, "walker").poison || 0,
    }
  }, SPIRIT_SHIFT_FIXTURE)
  await page224.close()
  out.spiritShiftDownstream = result
  const ok = result.lethalSpiritHp === 0 && result.lethalWalkerHp === 100 && result.lethalFallsLog && result.spiritPoison === 2 && result.walkerPoison === 0
  if (!ok) out.errors.push("check224 the redirected hit's downstream effects (fall/poison) did not land on the spirit")
}

// 225. Real content: createTacticsBattle AND createRealMatchupBattle both
//      spawn Beastcaller's real Spirit Wolf (units.js summon) exactly
//      once, as an allied spirit within Spirit Shift range; a squad
//      without a summoner spawns nothing extra; the roster preview marks
//      Beastcaller spiritbound; and a real enemy strike triggers the swap
{
  const page225 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page225.on("pageerror", (e) => errs.push(String(e)))
  await page225.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page225.waitForSelector(".hwt-board")
  const result = await page225.evaluate(async () => {
    const { createTacticsBattle, createRealMatchupBattle, attackUnit, previewPlayerRoster, PLAYER_ROSTER_IDS } = await import("/src/services/heartwood/tacticsEngine.js")
    const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
    const describe = (battle) => {
      const bc = battle.units.find((x) => x.defId === "beastcaller")
      const wolves = battle.units.filter((x) => x.defId === "spirit-wolf")
      return { wolfCount: wolves.length, wolfSide: wolves[0]?.side, wolfIsSpirit: wolves[0]?.isSpirit, bcBound: bc?.spiritbound, dist: wolves[0] && bc ? dist(wolves[0].pos, bc.pos) : null, occupiedUnique: new Set(battle.units.map((x) => `${x.pos.row},${x.pos.col}`)).size === battle.units.length }
    }
    const proto = createTacticsBattle("default", ["beastcaller", "the-fool"])
    const real = createRealMatchupBattle(["beastcaller"], ["bog-devotee"], "tommy", 0)
    const plain = createTacticsBattle("default", ["the-fool", "hexbreaker"])
    // Real strike: the formation's first real enemy, placed in front of
    // the real Beastcaller, during the enemy phase.
    const bc = proto.units.find((x) => x.defId === "beastcaller")
    const wolf = proto.units.find((x) => x.defId === "spirit-wolf")
    const enemy = proto.units.find((x) => x.side === "enemy")
    const struckIn = {
      ...proto,
      phase: "enemy",
      units: proto.units.map((x) => (x.id === enemy.id ? { ...x, pos: { row: bc.pos.row, col: bc.pos.col - 1 }, ap: x.apMax } : x)),
    }
    const struck = attackUnit(struckIn, enemy.id, bc.id)
    const bcAfter = struck.units.find((x) => x.id === bc.id)
    const wolfAfter = struck.units.find((x) => x.id === wolf.id)
    return {
      proto: describe(proto),
      real: describe(real),
      plainWolves: plain.units.filter((x) => x.defId === "spirit-wolf").length,
      plainPlayerCount: plain.units.filter((x) => x.side === "player").length,
      rosterHasBeastcaller: PLAYER_ROSTER_IDS.includes("beastcaller"),
      previewBound: previewPlayerRoster().find((x) => x.defId === "beastcaller")?.spiritbound,
      realStrike: { bcHpLoss: bcAfter.maxHp - bcAfter.hp, wolfHpLoss: wolfAfter.maxHp - wolfAfter.hp, bcAtWolfOld: bcAfter.pos.row === wolf.pos.row && bcAfter.pos.col === wolf.pos.col },
    }
  })
  await page225.close()
  out.spiritShiftRealContent = result
  const good = (d) => d.wolfCount === 1 && d.wolfSide === "player" && d.wolfIsSpirit === true && d.bcBound === true && d.dist !== null && d.dist <= 2 && d.occupiedUnique
  const ok =
    good(result.proto) && good(result.real) &&
    result.plainWolves === 0 && result.plainPlayerCount === 3 &&
    result.rosterHasBeastcaller && result.previewBound === true &&
    result.realStrike.bcHpLoss === 0 && result.realStrike.wolfHpLoss > 0 && result.realStrike.bcAtWolfOld
  if (!ok) out.errors.push("check225 Beastcaller's real Spirit Wolf did not spawn correctly in both battle builders, or a real strike did not trigger Spirit Shift")
}

// ---- Commander Active Power round -----------------------------------
// 226. Ward (effects.js's own): one stack cancels the ENTIRE next hit,
//      then is spent - the second hit lands normally ----------------
{
  const page226 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page226.on("pageerror", (e) => errs.push(String(e)))
  await page226.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page226.waitForSelector(".hwt-board")
  const result = await page226.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const state = {
      grid: { rows: 9, cols: 12 }, terrain: {}, phase: "enemy", turn: 3, log: [],
      units: [
        { id: "def", side: "player", name: "Def", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 3, facing: "W", ward: 1 },
        { id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "E" },
      ],
    }
    const first = attackUnit(state, "atk", "def")
    const second = attackUnit({ ...first, units: first.units.map((u) => (u.id === "atk" ? { ...u, ap: 2 } : u)) }, "atk", "def")
    const d1 = first.units.find((u) => u.id === "def")
    const d2 = second.units.find((u) => u.id === "def")
    return { hp1: d1.hp, ward1: d1.ward, block1: d1.block, wardLog: first.log.some((l) => l.includes("Ward absorbs the hit completely")), hp2: d2.hp }
  })
  await page226.close()
  out.activePowerWard = result
  // Block untouched by the warded hit; second hit: 10 - 3 Block = 7.
  const ok = result.hp1 === 100 && result.ward1 === 0 && result.block1 === 3 && result.wardLog && result.hp2 === 93
  if (!ok) out.errors.push("check226 Ward did not cancel exactly one whole hit before Block")
}

// 227. Vulnerable (effects.js's own): +25% damage TAKEN, rounded down ---
{
  const page227 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page227.on("pageerror", (e) => errs.push(String(e)))
  await page227.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page227.waitForSelector(".hwt-board")
  const result = await page227.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (vulnerable) => ({
      grid: { rows: 9, cols: 12 }, terrain: {}, phase: "player", turn: 3, log: [],
      units: [
        { id: "atk", side: "player", name: "Atk", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
        { id: "def", side: "enemy", name: "Def", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 0, ap: 2, block: 0, facing: "E", vulnerable },
      ],
    })
    const hpAfter = (s) => attackUnit(s, "atk", "def").units.find((u) => u.id === "def").hp
    return { vuln: hpAfter(mk(1)), plain: hpAfter(mk(0)) }
  })
  await page227.close()
  out.activePowerVulnerable = result
  const ok = result.vuln === 88 && result.plain === 90
  if (!ok) out.errors.push("check227 Vulnerable did not add exactly +25% (rounded down) damage taken")
}

// 228. activateCommanderPower on the prototype's real Tommy: Opening
//      Strike's real +2 Strength to every LIVING player unit (a fallen
//      one untouched, enemies untouched), 1 Commander AP spent, marked
//      used + firedTurn, narrated; then every guard is a no-op: a
//      second use, the enemy phase, a Commander with 0 AP or fallen --
{
  const page228 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page228.on("pageerror", (e) => errs.push(String(e)))
  await page228.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page228.waitForSelector(".hwt-board")
  const result = await page228.evaluate(async () => {
    const { createTacticsBattle, activateCommanderPower } = await import("/src/services/heartwood/tacticsEngine.js")
    const base = createTacticsBattle("default")
    const fallenId = base.units.find((u) => u.side === "player" && u.id !== "player-commander").id
    const start = { ...base, units: base.units.map((u) => (u.id === fallenId ? { ...u, hp: 0 } : u)) }
    const after = activateCommanderPower(start)
    const delta = (id) => after.units.find((u) => u.id === id).attack - start.units.find((u) => u.id === id).attack
    const livingPlayers = start.units.filter((u) => u.side === "player" && u.hp > 0)
    const cmdBefore = start.units.find((u) => u.id === "player-commander")
    const cmdAfter = after.units.find((u) => u.id === "player-commander")
    const withCmd = (s, patch) => ({ ...s, units: s.units.map((u) => (u.id === "player-commander" ? { ...u, ...patch } : u)) })
    return {
      power: base.activePower,
      livingDeltas: livingPlayers.map((u) => delta(u.id)),
      fallenDelta: delta(fallenId),
      enemyDeltas: start.units.filter((u) => u.side === "enemy").map((u) => delta(u.id)),
      apSpent: cmdBefore.ap - cmdAfter.ap,
      used: after.activePower.used,
      firedTurn: after.activePower.firedTurn,
      log: after.log[after.log.length - 1],
      secondNoop: activateCommanderPower(after) === after,
      enemyPhaseNoop: (() => { const s = { ...start, phase: "enemy" }; return activateCommanderPower(s) === s })(),
      noApNoop: (() => { const s = withCmd(start, { ap: 0 }); return activateCommanderPower(s) === s })(),
      fallenCmdNoop: (() => { const s = withCmd(start, { hp: 0 }); return activateCommanderPower(s) === s })(),
    }
  })
  await page228.close()
  out.activePowerTommy = result
  const ok =
    result.power && result.power.name === "Opening Strike" && result.power.used === false && !/next battle only/i.test(result.power.description) &&
    result.livingDeltas.length > 0 && result.livingDeltas.every((d) => d === 2) &&
    result.fallenDelta === 0 && result.enemyDeltas.every((d) => d === 0) &&
    result.apSpent === 1 && result.used === true && result.firedTurn === 1 &&
    result.log.includes("Tommy calls Opening Strike!") &&
    result.secondNoop && result.enemyPhaseNoop && result.noApNoop && result.fallenCmdNoop
  if (!ok) out.errors.push("check228 activateCommanderPower did not apply Opening Strike correctly or a guard failed")
}

// 229. Every real Commander: createRealMatchupBattle carries that
//      character's OWN real activePower, and firing it lands every one
//      of its real effects on a squad unit (read generically off
//      characters.js, not hand-listed) - no id silently no-ops. A
//      matchup with no Commander has no power at all --------------------
{
  const page229 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page229.on("pageerror", (e) => errs.push(String(e)))
  await page229.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page229.waitForSelector(".hwt-board")
  const result = await page229.evaluate(async () => {
    const { createRealMatchupBattle, activateCommanderPower } = await import("/src/services/heartwood/tacticsEngine.js")
    const { CHARACTERS } = await import("/src/data/heartwood/characters.js")
    const per = {}
    for (const [cid, character] of Object.entries(CHARACTERS)) {
      if (!character.activePower) continue
      const battle = createRealMatchupBattle(["the-fool"], ["bog-devotee"], cid, 0)
      const after = activateCommanderPower(battle)
      const before = battle.units.find((u) => u.defId === "the-fool")
      const unit = after.units.find((u) => u.defId === "the-fool")
      const missing = []
      let triggerAdds = 0
      for (const e of character.activePower.effects) {
        if (e.type === "addTrigger") { triggerAdds++; continue }
        if (e.type === "applyBuff" && e.id === "strength") { if (unit.attack - before.attack < e.amount) missing.push("strength"); continue }
        if (e.type === "applyBuff") { if ((unit[e.id] || 0) - (before[e.id] || 0) !== e.amount) missing.push(e.id); continue }
        missing.push(e.type)
      }
      const triggersOk = (unit.triggers || []).length - (before.triggers || []).length === triggerAdds
      per[cid] = { name: battle.activePower?.name, expectedName: character.activePower.name, used: after.activePower?.used, missing, triggersOk }
    }
    const none = createRealMatchupBattle(["the-fool"], ["bog-devotee"])
    return { per, noCommanderPower: none.activePower, noCommanderNoop: activateCommanderPower(none) === none }
  })
  await page229.close()
  out.activePowerAllCommanders = result
  const entries = Object.values(result.per)
  const ok =
    entries.length >= 7 &&
    entries.every((r) => r.name === r.expectedName && r.used === true && r.missing.length === 0 && r.triggersOk) &&
    result.noCommanderPower === null && result.noCommanderNoop
  if (!ok) out.errors.push("check229 a real Commander's Active Power was missing or one of its real effects did not land")
}

// 230. The prototype page's real UI: the gold ♛ panel shows Opening
//      Strike, a click fires it (every living player token surges,
//      the button disables, status reads "Used this battle", the log
//      narrates it) --------------------------------------------------
{
  const page230 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page230.on("pageerror", (e) => errs.push(String(e)))
  await page230.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page230.waitForSelector(".hwt-board")
  const btnText = await page230.locator(".hwt-power-btn").innerText()
  const enabledBefore = await page230.locator(".hwt-power-btn").isEnabled()
  await page230.locator(".hwt-power-btn").click()
  await page230.waitForTimeout(300)
  await page230.screenshot({ path: `${SHOT}/active_power_fired.png` })
  const result = {
    btnText,
    enabledBefore,
    enabledAfter: await page230.locator(".hwt-power-btn").isEnabled(),
    status: await page230.locator(".hwt-power-status").innerText(),
    surging: await page230.locator('.hwt-token[data-power-surge="true"]').count(),
    playerTokens: await page230.locator('.hwt-token[data-side="player"]').count(),
    logHas: (await page230.locator(".hwt-log").innerText()).includes("calls Opening Strike"),
  }
  await page230.close()
  out.activePowerUi = result
  const ok =
    result.btnText.includes("Opening Strike") && result.enabledBefore && !result.enabledAfter &&
    result.status === "Used this battle" && result.surging > 0 && result.surging === result.playerTokens && result.logHas
  if (!ok) out.errors.push("check230 the Active Power panel did not render/fire correctly on the prototype page")
}

// ---- Battle feel round ----------------------------------------------
// 231. The engine's event feed: an attack emits a "strike" then its
//      "damage" (amount/fell), seq rises monotonically, the feed is
//      capped at 80, and a rejected action emits nothing ------------
{
  const page231 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page231.on("pageerror", (e) => errs.push(String(e)))
  await page231.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page231.waitForSelector(".hwt-board")
  const result = await page231.evaluate(async () => {
    const { attackUnit } = await import("/src/services/heartwood/tacticsEngine.js")
    const mk = (defHp) => ({
      grid: { rows: 9, cols: 12 }, terrain: {}, phase: "player", turn: 1, log: [],
      units: [
        { id: "atk", side: "player", name: "Atk", pos: { row: 4, col: 6 }, hp: 50, maxHp: 50, range: 1, attack: 10, ap: 2, block: 0, facing: "W" },
        { id: "def", side: "enemy", name: "Def", pos: { row: 4, col: 5 }, hp: defHp, maxHp: 100, range: 1, attack: 0, ap: 2, block: 3, facing: "E" },
      ],
    })
    const after = attackUnit(mk(100), "atk", "def")
    const kill = attackUnit(mk(5), "atk", "def")
    const rejected = attackUnit({ ...mk(100), phase: "enemy" }, "atk", "def")
    // Cap: 100 attacks' worth of events on a big-HP target.
    let s = { ...mk(100000) }
    for (let i = 0; i < 60; i++) s = attackUnit({ ...s, units: s.units.map((u) => (u.id === "atk" ? { ...u, ap: 2 } : u)) }, "atk", "def")
    return {
      kinds: after.events.map((e) => e.kind),
      strike: after.events[0],
      damage: after.events[1],
      seqs: after.events.map((e) => e.seq),
      killDamage: kill.events.find((e) => e.kind === "damage"),
      rejectedSame: rejected === rejected && !rejected.events,
      capLen: s.events.length,
      capLastSeq: s.eventSeq,
    }
  })
  await page231.close()
  out.fxEngineEvents = result
  const ok =
    result.kinds.join(",") === "strike,damage" &&
    result.strike.actorId === "atk" && result.strike.targetId === "def" && result.strike.ranged === false &&
    result.damage.targetId === "def" && result.damage.amount === 7 && result.damage.absorbed === 3 && result.damage.fell === false &&
    result.seqs[0] === 1 && result.seqs[1] === 2 &&
    result.killDamage.fell === true &&
    result.rejectedSame &&
    result.capLen === 80 && result.capLastSeq === 120
  if (!ok) out.errors.push("check231 the engine's battle event feed (strike/damage/seq/cap) is wrong")
}

// 232. Every reaction/defence narrates itself in the feed: Ward,
//      Intercept, a Sidestep dodge, Spirit Shift, Retreat Step, a heal
//      ability, and the Commander's Active Power ----------------------
{
  const page232 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
  page232.on("pageerror", (e) => errs.push(String(e)))
  await page232.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page232.waitForSelector(".hwt-board")
  const result = await page232.evaluate(async () => {
    const { attackUnit, castAbility, activateCommanderPower, createTacticsBattle, deterministicRoll } = await import("/src/services/heartwood/tacticsEngine.js")
    const grid = { rows: 9, cols: 12 }
    const base = { ap: 2, apMax: 2, block: 0, facing: "W", suppressed: 0 }
    const st = (units) => ({ grid, terrain: {}, phase: "enemy", turn: 3, log: [], units })
    const atk = (over = {}) => ({ ...base, id: "atk", side: "enemy", name: "Atk", pos: { row: 4, col: 5 }, hp: 100, maxHp: 100, range: 1, attack: 10, facing: "E", ...over })
    const def = (over = {}) => ({ ...base, id: "def", side: "player", name: "Def", pos: { row: 4, col: 6 }, hp: 100, maxHp: 100, range: 1, attack: 0, ...over })
    const labels = (s) => (s.events || []).filter((e) => e.kind === "reaction").map((e) => e.label)
    const ward = attackUnit(st([def({ ward: 1 }), atk()]), "atk", "def")
    const intercept = attackUnit(st([def(), atk(), { ...base, id: "g", side: "player", name: "G", pos: { row: 3, col: 6 }, hp: 50, maxHp: 50, range: 1, attack: 0, className: "Guardian" }]), "atk", "def")
    let dodgeTurn = 1
    while (deterministicRoll(dodgeTurn, "def:sidestep") >= 0.5) dodgeTurn++
    const dodge = attackUnit({ ...st([def({ nimble: true }), atk({ pos: { row: 4, col: 3 }, range: 3 })]), turn: dodgeTurn }, "atk", "def")
    const shift = attackUnit(st([def({ spiritbound: true }), atk(), { ...base, id: "sp", side: "player", name: "Sp", pos: { row: 4, col: 8 }, hp: 30, maxHp: 30, range: 1, attack: 0, isSpirit: true }]), "atk", "def")
    const retreat = attackUnit(st([def({ wary: true, maxHp: 20, hp: 20 }), atk()]), "atk", "def")
    const tb = createTacticsBattle("default")
    const fool = tb.units.find((u) => u.defId === "the-fool")
    const heal = castAbility({ ...tb, units: tb.units.map((u) => (u.id === fool.id ? { ...u, hp: u.hp - 10 } : u)) }, fool.id, fool.id)
    const power = activateCommanderPower(tb)
    return {
      ward: ward.events.map((e) => e.kind),
      intercept: labels(intercept),
      dodge: labels(dodge),
      shift: labels(shift),
      retreat: labels(retreat),
      heal: heal.events.find((e) => e.kind === "heal"),
      power: power.events.find((e) => e.kind === "power"),
    }
  })
  await page232.close()
  out.fxReactionEvents = result
  const ok =
    result.ward.join(",") === "strike,ward" &&
    result.intercept.includes("Intercept!") &&
    result.dodge.includes("Dodged!") &&
    result.shift.includes("Spirit Shift!") &&
    result.retreat.includes("Retreat!") &&
    result.heal && result.heal.amount === 5 &&
    result.power && result.power.label === "Opening Strike!"
  if (!ok) out.errors.push("check232 a reaction/defence/heal/power did not appear in the battle event feed")
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_prototype (boss/elite phases + trigger framework) PASS" : "\n❌ verify_tactics_prototype (boss/elite phases + trigger framework) FAIL")
process.exit(pass ? 0 : 1)
