import { chromium } from "playwright"

// Sprint 3 lane: element combos (tacticsElements.js). One check per combo,
// element application from an ability / a relic trigger / an enemy skill,
// AI combo awareness, preview==real with elements, and the UI (token
// icons, combo callout + tile flash + shake, help panel).
const PORT = process.env.PORT || 5447
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
const out = { errors: [] }
const check = (ok, name) => { if (!ok) out.errors.push(name) }

await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const X = await import("/src/services/heartwood/tacticsElements.js")
  const A = await import("/src/services/heartwood/tacticsEnemyAbilities.js")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
    burn: 0, chill: 0, frozen: 0, entangle: 0, frosty: false, wary: false, haste: false, dampen: 0, evade: 0, perks: [],
    cooldownRemaining: 0, ability: null, xpGained: undefined,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, defId: id, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 5, baseAttack: 5, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units) => ({ ...base, formationId: null, objective: null, units, terrain: {}, phase: "player", turn: 1, log: [], events: [], eventSeq: 0 })
  const u = (s, id) => s.units.find((x) => x.id === id)
  const combos = (s) => (s.events || []).filter((e) => e.kind === "combo").map((e) => e.combo)
  const ab = (kind, extra = {}) => ({ id: kind, name: kind, kind, cost: 1, cooldown: 2, ...extra })
  const burnTrigger = { trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 }, source: "Test Ember Relic" }
  const r = {}

  // 1. Toxic Blaze from an ABILITY: poison-strike onto a burning enemy.
  {
    const s = st([P("p1", 4, 6, { ability: ab("poison-strike", { amount: 2 }) }), En("e1", 4, 5, { burn: 2 }), En("e2", 3, 5), En("far", 8, 0)])
    const a = E.castAbility(s, "p1", "e1")
    r.toxic = { combos: combos(a), e1: [u(a, "e1").hp, u(a, "e1").burn, u(a, "e1").poison], e2: u(a, "e2").hp, far: u(a, "far").hp, log: a.log.slice(-2) }
  }
  // 2. Freeze from a Frost ability (Frostbinder root-shot adds Chill), then Shatter.
  {
    const s = st([
      P("p1", 4, 7, { className: "Frostbinder", range: 3, ability: ab("root-shot") }),
      P("p2", 4, 6),
      En("e1", 4, 5, { chill: 1 }),
      En("far", 8, 0),
    ])
    const a = E.castAbility(s, "p1", "e1")
    const hpFrozen = u(a, "e1").hp
    const b = E.attackUnit(a, "p2", "e1")
    r.freeze = { combosA: combos(a), frozen: u(a, "e1").frozen, chill: u(a, "e1").chill, hpFrozen, combosB: combos(b).slice(combos(a).length),
      shatterDmg: hpFrozen - u(b, "e1").hp, frozenAfter: u(b, "e1").frozen, log: b.log.slice(-2) }
  }
  // 3. Frozen enemy loses its turn; the preview shows it.
  {
    const s = st([P("p1", 4, 6), En("e1", 4, 5, { frozen: 1 })])
    const intent = E.previewEnemyIntents(s).find((i) => i.enemyId === "e1")?.intent
    const a = E.endPlayerTurn(s)
    r.frozenSkip = { intent, p1: u(a, "p1").hp, frozen: u(a, "e1").frozen }
  }
  // 4. Steam from a RELIC trigger: burn onto a chilled enemy.
  {
    const s = st([P("p1", 4, 6, { triggers: [burnTrigger] }), En("e1", 4, 5, { chill: 1 }), En("e2", 3, 5), En("far", 8, 0)])
    const a = E.attackUnit(s, "p1", "e1")
    r.steam = { combos: combos(a), e1: [u(a, "e1").weak, u(a, "e1").burn, u(a, "e1").chill], e2Weak: u(a, "e2").weak, farWeak: u(a, "far").weak }
  }
  // 5. Wildfire: Nature (Marksman root-shot entangles) then Fire relic hit.
  {
    const s = st([
      P("p1", 4, 7, { className: "Marksman", range: 3, ability: ab("root-shot") }),
      P("p2", 4, 6, { triggers: [burnTrigger] }),
      En("e1", 4, 5), En("e2", 5, 4), En("far", 8, 0),
    ])
    const a = E.castAbility(s, "p1", "e1")
    const b = E.attackUnit(a, "p2", "e1")
    r.wildfire = { entangle: u(a, "e1").entangle, combos: combos(b), e1: [u(b, "e1").entangle, u(b, "e1").burn], e2Burn: u(b, "e2").burn, farBurn: u(b, "far").burn }
  }
  // 6. Rot: poison onto an entangled enemy.
  {
    const s = st([P("p1", 4, 6, { ability: ab("poison-strike", { amount: 2 }) }), En("e1", 4, 5, { entangle: 2 }), En("far", 8, 0)])
    const a = E.castAbility(s, "p1", "e1")
    r.rot = { combos: combos(a), maxHp: u(a, "e1").maxHp, entangle: u(a, "e1").entangle, poison: u(a, "e1").poison }
  }
  // 7. ENEMY skill: Chill hex freezes an already-chilled player (AI prefers
  //    the combo target), and the frozen player loses its next turn.
  {
    const hex = { id: "element-hex", kind: "hex", cooldown: 3, status: "chill", amount: 1, name: "Rime Gale" }
    const s = st([P("p1", 4, 9), P("p2", 4, 8, { chill: 1 }), En("e1", 4, 6, { enemySkills: [hex], attack: 1 })])
    const intent = E.previewEnemyIntents(s).find((i) => i.enemyId === "e1")?.intent
    const a = E.endPlayerTurn(s)
    r.enemyHex = { intent: intent && { kind: intent.skillKind, status: intent.status, target: intent.targetId }, p2: [u(a, "p2").frozen, u(a, "p2").ap, u(a, "p2").chill],
      logHas: a.log.some((l) => l.includes("frozen solid")), combos: combos(a) }
  }
  // 8. Enemy Burn hex onto a poisoned player -> Toxic Blaze on the squad.
  {
    const hex = { id: "element-hex", kind: "hex", cooldown: 3, status: "burn", amount: 2, name: "Ember Spit" }
    const s = st([P("p1", 4, 9, { poison: 3 }), En("e1", 4, 6, { enemySkills: [hex], attack: 1 })])
    const a = E.endPlayerTurn(s)
    r.enemyBurn = { combos: combos(a), p1: [u(a, "p1").burn, u(a, "p1").poison] }
  }
  // 9. Tables: real kits carry element hexes; abilities are tagged.
  {
    const t = A.enemySkillTable()
    r.tables = {
      herald: t["the-ashfall-herald"].map((k) => k.status).filter(Boolean),
      siren: t["drowned-siren"].map((k) => k.status).filter(Boolean),
      frostbinder: X.abilityElement({ className: "Frostbinder", ability: { kind: "root-shot" } }),
      diviner: X.abilityElement({ className: "Diviner", ability: { kind: "burst" } }),
      healer: X.abilityElement({ className: "Oracle", ability: { kind: "heal" } }),
    }
  }
  // 10. Preview == real with elements in play (real kits incl. element hexes).
  {
    const real = E.createRealMatchupBattle(["bulwark-of-ages", "hexbreaker", "the-fool"], ["drowned-siren", "emberwrack", "wraithgale"], "tommy")
    let s = { ...real, units: real.units.map((x) => (x.side === "player" ? { ...x, chill: 1, poison: x.id.includes("fool") ? 2 : 0 } : x)) }
    const rows = []
    for (let turn = 0; turn < 4 && s.phase === "player"; turn++) {
      const preview = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      const ok = preview.every(({ enemyId, intent }) => {
        const now = after.units.find((x) => x.id === enemyId)
        if (!now) return false
        const to = intent.to || intent.land
        if (to && now.hp > 0) return now.pos.row === to.row && now.pos.col === to.col
        return true
      })
      rows.push({ turn: s.turn, kinds: preview.map((p) => (p.intent.kind === "skill" ? `${p.intent.skillKind}:${p.intent.status || ""}` : p.intent.kind)), ok, combos: combos(after).length })
      s = after
    }
    r.preview = { rows, stable: JSON.stringify(E.previewEnemyIntents(real)) === JSON.stringify(E.previewEnemyIntents(real)) }
  }
  return r
})
out.result = R

check(R.toxic.combos.includes("toxic-blaze") && R.toxic.e1[0] === 30 - 5 - 4 && R.toxic.e1[1] === 0 && R.toxic.e1[2] === 0 && R.toxic.e2 === 28 && R.toxic.far === 30, "1 toxic blaze (ability)")
check(R.freeze.combosA.includes("freeze") && R.freeze.frozen === 1 && R.freeze.chill === 0 && R.freeze.combosB.includes("shatter") && R.freeze.shatterDmg === 7 && R.freeze.frozenAfter === 0, "2 freeze + shatter")
check(R.frozenSkip.intent?.kind === "stunned" && R.frozenSkip.intent.frozen === true && R.frozenSkip.p1 === 30 && R.frozenSkip.frozen === 0, "3 frozen enemy skips turn (preview + real)")
check(R.steam.combos.includes("steam") && R.steam.e1.join() === "1,0,0" && R.steam.e2Weak === 1 && R.steam.farWeak === 0, "4 steam (relic)")
check(R.wildfire.entangle === 2 && R.wildfire.combos.includes("wildfire") && R.wildfire.e1[0] === 0 && R.wildfire.e1[1] >= 2 && R.wildfire.e2Burn === R.wildfire.e1[1] && R.wildfire.farBurn === 0, "5 wildfire")
check(R.rot.combos.includes("rot") && R.rot.maxHp === 26 && R.rot.entangle === 0 && R.rot.poison === 2, "6 rot")
check(R.enemyHex.intent?.kind === "hex" && R.enemyHex.intent.status === "chill" && R.enemyHex.intent.target === "p2" && R.enemyHex.p2.join() === "0,0,0" && R.enemyHex.logHas && R.enemyHex.combos.includes("freeze"), "7 enemy chill hex freezes (AI picks combo target)")
check(R.enemyBurn.combos.includes("toxic-blaze") && R.enemyBurn.p1.join() === "0,0", "8 enemy burn hex -> toxic blaze on squad")
check(R.tables.herald.includes("burn") && R.tables.siren.includes("chill") && R.tables.frostbinder?.element === "frost" && R.tables.diviner?.element === "fire" && R.tables.healer === null, "9 source tables")
check(R.preview.stable && R.preview.rows.length >= 2 && R.preview.rows.every((x) => x.ok) && R.preview.rows.some((x) => x.kinds.some((k) => k.includes("chill") || k.includes("burn"))), "10 preview==real with element hexes")

// ---- UI: inject a state into the prototype page via its React hook ----
const ui = await page.evaluate(async () => {
  const X = await import("/src/services/heartwood/tacticsElements.js")
  const board = document.querySelector(".hwt-board")
  const key = Object.keys(board).find((k) => k.startsWith("__reactFiber$"))
  let f = board[key]
  while (f && f.type?.name !== "HeartwoodTactics") f = f.return
  if (!f) return { err: "no fiber" }
  const battleHook = f.memoizedState.next // hook 0 = objectiveChoice, hook 1 = battle
  const cur = battleHook.memoizedState
  const enemy = cur.units.find((u) => u.side === "enemy")
  const other = cur.units.find((u) => u.side === "enemy" && u.id !== enemy.id)
  let s = { ...cur, units: cur.units.map((u) => (u.id === enemy.id ? { ...u, chill: 1, entangle: 2 } : u.id === other?.id ? { ...u, burn: 3 } : u)) }
  battleHook.queue.dispatch(s)
  await new Promise((res) => setTimeout(res, 300))
  const icons = [...document.querySelectorAll(".hwt-element-badge")].map((el) => `${el.dataset.status}:${el.title.slice(0, 40)}`)
  // Now a Wildfire lands on `enemy` (fire onto an entangled unit is checked first vs chill? no: Steam wins over Wildfire).
  s = X.applyElement(s, enemy.id, "poison", 2) // Rot (entangled + poison)
  s = X.applyElement(s, other.id, "poison", 2) // Toxic Blaze (burning + poison) - big: shake
  battleHook.queue.dispatch(s)
  const seen = { combo: [], shake: false, flash: false }
  for (let i = 0; i < 20; i++) {
    await new Promise((res) => setTimeout(res, 60))
    for (const el of document.querySelectorAll(".hw-floating-number--combo")) if (!seen.combo.includes(el.textContent)) seen.combo.push(el.textContent)
    if (document.querySelector(".hwt-board.hw-stage-shake")) seen.shake = true
    if (document.querySelector(".hwt-cell.hwt-combo-flash")) seen.flash = true
  }
  return { icons, seen }
})
out.ui = ui
check(ui.icons?.some((t) => t.startsWith("chill:") && t.includes("Frost")) && ui.icons.some((t) => t.startsWith("entangle:")) && ui.icons.some((t) => t.startsWith("burn:")), "UI: element icons + tooltips")
check(ui.seen?.combo.some((t) => /rot/i.test(t)) && ui.seen.combo.some((t) => /toxic blaze/i.test(t)) && ui.seen.shake && ui.seen.flash, "UI: combo callout + shake + tile flash")

await page.locator(".hwt-element-help-btn").click()
const help = await page.locator(".hwt-element-help-body li").allTextContents()
out.ui.help = help.length
check(help.length === 6 && help.some((t) => t.includes("Shatter")) && help.some((t) => t.includes("Wildfire")), "UI: Element combos help panel")
await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/elements.png" }).catch(() => {})

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_elements PASS" : "\n❌ verify_sprint_elements FAIL")
process.exit(pass ? 0 : 1)
