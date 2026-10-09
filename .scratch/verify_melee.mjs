// Melee rework: tanks (Provoke taunt the AI obeys + preview, Shield Wall =
// half cover, Bodyguard + Intercept, push/hook off cover, Bastion stance)
// and melee DPS (gap closers that reach the flank, flank damage, Combo
// finisher, kill chains, Assassin Vanish), ENGAGED shooters lose Aim /
// Overwatch, enemy melee AI engages shooters, UI badges + screenshot.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const SHOT_DIR = process.env.SHOT_DIR || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 30000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const CV = await import("/src/services/heartwood/tacticsCover.js")
  const RG = await import("/src/services/heartwood/tacticsRanged.js")
  const CF = await import("/src/services/heartwood/tacticsClasses.js")
  const C = await import("/src/data/heartwood/classes.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }
  const CMD = "player-commander"
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const U = (s, id) => s.units.find((u) => u.id === id)
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  const set = (s, id, patch) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) })
  function board(squad, place, terrain = {}, { mana = true, rolls = false } = {}) {
    let s = E.createTacticsBattle("default", squad)
    const all = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      units: s.units.map((u) => {
        const k = all[u.id] || all[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, mana: m, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    if (rolls) s = CV.withHitRolls(s)
    if (!mana) return s
    s = M.enableMana(s)
    return { ...s, units: s.units.map((u) => ((all[u.id] || all[u.defId])?.mana != null ? { ...u, mana: (all[u.id] || all[u.defId]).mana } : u)) }
  }
  const far = { [E0]: { row: 0, col: 0 }, [E1]: { row: 1, col: 0 }, [E2]: { row: 2, col: 0 } }

  // 1 Kits: every melee class has its rework skills (max 3 + signature) ----------
  {
    const kit = (c) => C.CLASSES[c].skills.map((k) => k.id)
    r.kits = Object.fromEntries(["guardian", "warden", "juggernaut", "bruiser", "striker", "duelist", "assassin", "executioner"].map((c) => [c, kit(c)]))
    ok(kit("guardian").includes("provoke") && kit("warden").includes("bastion") && kit("juggernaut").includes("hook") && kit("striker").includes("finishing-blow") && kit("duelist").includes("lunge") && kit("assassin").includes("vanish") && kit("executioner").includes("leap"), "new melee skills", r.kits)
    ok(Object.values(C.CLASSES).every((c) => c.skills.length <= 3), "max 3 class skills per class")
    ok(Object.values(C.CLASSES).every((c) => c.skills.every((k) => k.upgrades?.A && k.upgrades?.B)), "every skill has A/B upgrades")
  }

  // 2 Provoke: AI must attack the tank; preview == real -----------------------------
  {
    const place = { "bulwark-of-ages": { row: 4, col: 6 }, "the-fool": { row: 6, col: 5, hp: 3 }, [E0]: { row: 4, col: 4, attack: 4 }, [E1]: { row: 6, col: 4, attack: 4, range: 1 }, [E2]: { row: 0, col: 0 } }
    const s = board(["bulwark-of-ages", "the-fool"], place)
    const g = pid(s, "bulwark-of-ages")
    const f = pid(s, "the-fool")
    const before = E.previewEnemyIntents(s).find((i) => i.enemyId === E0).intent
    const p = E.castAbility(s, g, null, "provoke")
    ok(U(p, E0).provoked === 1 && U(p, E1).provoked === 1 && U(p, E0).provokedBy === g, "enemies within 2 are Provoked", [U(p, E0).provoked, U(p, E1).provoked])
    ok(U(p, g).mana === 0 && U(p, g).block === 2, "Provoke costs 1 Holy, +2 Block")
    const pv = E.previewEnemyIntents(p)
    const after = E.endPlayerTurn(p)
    const hits = after.log.filter((l) => /(strikes|grazes) .* for \d/.test(l))
    r.provoke = { before: [before.kind, before.targetId], intents: pv.map((x) => [x.enemyId, x.intent.kind, x.intent.targetId]), hits }
    ok(before.targetId === f, "without Provoke the enemy goes for the wounded healer", r.provoke.before)
    ok(pv.filter((x) => x.enemyId !== E2).every((x) => !x.intent.targetId || x.intent.targetId === g), "every provoked enemy's intent targets the Guardian", r.provoke)
    ok(hits.length >= 1 && hits.every((l) => l.includes(U(s, g).name) && !l.includes(` ${U(s, f).name} for`)), "the real enemy turn hits only the Guardian", hits)
    ok(U(after, f).hp === U(p, f).hp, "the healer is untouched")
  }

  // 3 Shield Wall = half cover for allies behind the tank --------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 6, mana: 3 }, "the-fool": { row: 4, col: 7 }, [E0]: { row: 4, col: 2, range: 5 }, ...{ [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } } }, {}, { rolls: true })
    const g = pid(s, "bulwark-of-ages")
    const f = pid(s, "the-fool")
    const before = CV.hitChance(s, U(s, E0), U(s, f))
    const w = E.castAbility(s, g, null, "shield-wall")
    const after = CV.hitChance(w, U(w, E0), U(w, f))
    r.wall = { before: before.chance, after: after.chance, parts: after.parts.map((p) => p.label), block: [U(w, g).block, U(w, f).block], holy: U(w, g).mana }
    ok(before.cover === 0 && after.cover === 1 && after.parts.some((p) => /Shield Wall/.test(p.label)), "ally behind the Shield Wall has HALF cover", r.wall)
    ok(U(w, g).block === 3 + 1 && U(w, f).block === 2 + 1 && U(w, g).mana === 0, "ALL-IN 3 Holy: +1 Block each beyond 2", r.wall)
    const side = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 6, mana: 3 }, "the-fool": { row: 3, col: 7 }, [E0]: { row: 4, col: 2, range: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, {}, { rolls: true })
    const w2 = E.castAbility(side, g, null, "shield-wall")
    ok(CV.hitChance(w2, U(w2, E0), U(w2, f)).cover === 0, "only the side the tank stands on")
  }

  // 4 Bodyguard + Intercept --------------------------------------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 7, mana: 0 }, "the-fool": { row: 4, col: 6 }, [E0]: { row: 4, col: 5, attack: 8 }, [E1]: { row: 3, col: 5, attack: 8, range: 1 }, [E2]: { row: 0, col: 0 } })
    const g = pid(s, "bulwark-of-ages")
    const f = pid(s, "the-fool")
    const en = { ...s, phase: "enemy" }
    const a1 = E.attackUnit(en, E0, f)
    r.icp = { fool: U(s, f).hp - U(a1, f).hp, guard: U(s, g).hp - U(a1, g).hp, holy: U(a1, g).mana, used: U(a1, g).interceptUsed }
    ok(r.icp.fool >= 4 && r.icp.fool <= 5 && r.icp.guard >= 4 && r.icp.guard <= 5 && r.icp.holy === 1 && r.icp.used, "Intercept: the Guardian takes half (+1 Holy)", r.icp)
    const a2 = E.attackUnit(a1, E1, f)
    ok(U(a1, f).hp - U(a2, f).hp >= 8 && U(a2, g).hp === U(a1, g).hp, "Intercept once per enemy turn")
    const bg = E.castAbility(s, g, f, "guard")
    const a3 = E.attackUnit({ ...bg, phase: "enemy" }, E0, f)
    const a4 = E.attackUnit(a3, E1, f)
    ok(U(s, g).hp - U(a4, g).hp >= 8 && U(s, g).hp - U(a4, g).hp <= 10 && U(a4, g).mana === 1 + 2, "Bodyguard: every hit on the guarded ally is shared (+1 Holy each)", [U(a4, g).hp, U(a4, g).mana])
  }

  // 5 Push / Hook enemies off their cover --------------------------------------------
  {
    // E0 shelters behind a rock to its north; the push sends it west, away from it.
    const s2 = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { "3-5": "rock" })
    const b = pid(s2, "strength")
    const coverBefore = CV.coverAgainst(s2, U(s2, E0).pos, { row: 1, col: 5 })
    const push = E.castAbility(s2, b, E0, "shoulder-check")
    const coverAfter = CV.coverAgainst(push, U(push, E0).pos, { row: 1, col: 5 })
    r.push = { from: U(s2, E0).pos, to: U(push, E0).pos, coverBefore, coverAfter, rage: U(push, b).mana }
    ok(coverBefore === 2 && coverAfter === 0 && U(push, b).mana >= 10, "Shoulder Check knocks the enemy out of its cover (free, builds Rage)", r.push)
    const j = board(["the-chariot"], { "the-chariot": { row: 4, col: 8, mana: 30 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { "4-4": "rock" })
    const jid = pid(j, "the-chariot")
    const hk = E.castAbility(j, jid, E0, "hook")
    r.hook = { to: U(hk, E0).pos, hp: U(hk, E0).hp, cover: CV.coverAgainst(hk, U(hk, E0).pos, { row: 4, col: 10 }) }
    ok(U(hk, E0).pos.col === 7 && U(hk, E0).hp < 40, "Hook drags the enemy 2 tiles toward the Juggernaut and hits it", r.hook)
  }

  // 6 Bastion stance -------------------------------------------------------------------
  {
    const s = board(["justice"], { justice: { row: 4, col: 6, mana: 0 }, [E0]: { row: 4, col: 5, attack: 10 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const w = pid(s, "justice")
    const plain = U(s, w).hp - U(E.attackUnit({ ...s, phase: "enemy" }, E0, w), w).hp
    const b = E.castAbility(s, w, null, "bastion")
    const hit = U(b, w).hp - U(E.attackUnit({ ...b, phase: "enemy" }, E0, w), w).hp
    r.bastion = { plain, hit, block: U(b, w).block, holy: U(b, w).mana, moves: E.reachableTilesFor(b, w).length }
    ok(U(b, w).bastion === 1 && E.reachableTilesFor(b, w).length === 0, "Bastion: can't move", r.bastion)
    ok(hit <= Math.floor(Math.max(0, 10 - 2) / 2) && hit < plain, "Bastion: half damage (+2 Block)", r.bastion)
    ok(U(b, w).mana === 1, "Bastion builds 1 Holy")
  }

  // 7 Gap closer reaches the flank + flank damage --------------------------------------
  {
    const s = board(["the-lovers"], { "the-lovers": { row: 4, col: 8 }, [E0]: { row: 4, col: 6, facing: "E" }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const d = pid(s, "the-lovers")
    const l = E.castAbility(s, d, E0, "lunge")
    r.lunge = { pos: U(l, d).pos, combo: U(l, d).mana, hp: U(l, E0).hp }
    ok(U(l, d).pos.col === 5 && U(l, d).mana === 3, "Lunge lands BEHIND the enemy (back hit, +3 Combo)", r.lunge)
    // Melee flank damage: +1 side, +2 back over a front hit.
    const atk = (facing) => 40 - U(E.attackUnit(board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6 }, [E0]: { row: 4, col: 5, facing }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, {}, { mana: true }), pid(board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6 } }), "the-hierophant"), E0), E0).hp
    r.flank = { front: atk("E"), side: atk("N"), back: atk("W") }
    ok(r.flank.side > r.flank.front && r.flank.back > r.flank.side, "melee flank/back hits deal more", r.flank)
    // Shadow Step: behind the enemy.
    const a = board(["knights-leap"], { "knights-leap": { row: 4, col: 9 }, [E0]: { row: 4, col: 6, facing: "E" }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const as = pid(a, "knights-leap")
    ok(U(E.castAbility(a, as, E0, "shadow-step"), as).pos.col === 5, "Shadow Step: behind the target")
  }

  // 8 Kill chains -----------------------------------------------------------------------
  {
    const s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6, mana: 5 }, [E0]: { row: 4, col: 5, hp: 3 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const c = pid(s, "the-hierophant")
    const fb = E.castAbility(s, c, E0, "finishing-blow")
    ok(U(fb, E0).hp <= 0 && U(fb, c).ap === U(s, c).ap - 1 + 1, "Finishing Blow kill refunds 1 AP", U(fb, c).ap)
    const x = board(["the-hanged-man"], { "the-hanged-man": { row: 4, col: 9, mana: 20 }, [E0]: { row: 4, col: 6, hp: 2 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const xid = pid(x, "the-hanged-man")
    const lp = E.castAbility(x, xid, E0, "leap")
    r.leap = { pos: U(lp, xid).pos, free: U(lp, xid).freeStep, ap: U(lp, xid).ap, dead: U(lp, E0).hp <= 0 }
    ok(r.leap.dead && r.leap.free === 1 && r.leap.ap === 2, "Leap closes 3 tiles; kill = free move (+ Momentum AP)", r.leap)
    const mv = E.moveUnit(lp, xid, { row: 5, col: 7 })
    ok(U(mv, xid).ap === r.leap.ap, "the free move costs no AP", U(mv, xid).ap)
  }

  // 9 Assassin Vanish ----------------------------------------------------------------
  {
    const place = { "knights-leap": { row: 4, col: 8, mana: 60 }, "the-fool": { row: 7, col: 10 }, [E0]: { row: 4, col: 3, range: 6, attack: 4 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }
    const s = board(["knights-leap", "the-fool"], place)
    const a = pid(s, "knights-leap")
    const v = E.castAbility(s, a, null, "vanish")
    ok(U(v, a).stealth === 1 && U(v, a).mana === 20, "Vanish costs 40 Shadow", U(v, a).mana)
    const enemyPhase = { ...v, phase: "enemy" }
    ok(E.attackUnit(enemyPhase, E0, a) === enemyPhase, "a far shooter can't target the Vanished hero")
    ok(CF.hiddenFrom(U(v, a), U(v, E0)) && !CF.hiddenFrom(U(v, a), { ...U(v, E0), pos: { row: 4, col: 6 } }), "within 2 tiles it is seen")
    const pv = E.previewEnemyIntents(v).find((i) => i.enemyId === E0).intent
    ok(pv.targetId !== a, "AI picks another target", pv)
    const hitAfter = 40 - U(E.attackUnit(set(v, E0, { pos: { row: 4, col: 7 } }), a, E0), E0).hp
    const hitPlain = 40 - U(E.attackUnit(set(set(s, a, { mana: 20 }), E0, { pos: { row: 4, col: 7 } }), a, E0), E0).hp
    ok(hitAfter === hitPlain + 2, "its next hit deals +2", [hitPlain, hitAfter])
  }

  // 10 Engaged shooters ---------------------------------------------------------------
  {
    const s = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 8 }, [E0]: { row: 4, col: 7, range: 1, attack: 3 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const rg = pid(s, "bishops-slash")
    ok(RG.isEngaged(s, U(s, rg)), "a shooter next to an enemy fighter is ENGAGED")
    ok(E.overwatchAction(s, rg) === s, "engaged: no Overwatch")
    const aim = U(s, rg).rangedKit.find((k) => k.id === "aim")
    ok(!CF.classSkillUsable(s, U(s, rg), aim), "engaged: no Aim")
    const free = set(s, E0, { pos: { row: 0, col: 3 } })
    ok(!RG.isEngaged(free, U(free, rg)) && E.overwatchAction(free, rg) !== free && CF.classSkillUsable(free, U(free, rg), aim), "free again once the fighter is gone")
    // Enemy shooters too: an engaged enemy archer won't go on Overwatch.
    const es = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5, range: 4, attack: 2 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const esE = { ...es, phase: "enemy" }
    ok(RG.isEngaged(es, U(es, E0)) && E.overwatchAction(esE, E0) === esE, "an engaged enemy shooter can't go on Overwatch either")
  }

  // 11 Melee AI: engages your shooters; enemy warriors spend Rage ------------------------
  {
    // E1 (melee) can reach a free tile next to the ranger or next to the bruiser, equally far.
    const s = board(["strength", "bishops-slash"], { strength: { row: 2, col: 6 }, "bishops-slash": { row: 6, col: 6 }, [E1]: { row: 4, col: 3, range: 1, attack: 3, move: 2 }, [E0]: { row: 0, col: 0 }, [E2]: { row: 8, col: 0 } })
    const pv = E.previewEnemyIntents(s).find((i) => i.enemyId === E1).intent
    const after = E.endPlayerTurn(s)
    const pos = U(after, E1).pos
    const rgPos = U(s, pid(s, "bishops-slash")).pos
    r.engageAi = { intent: pv, pos }
    ok(Math.max(Math.abs(pos.row - rgPos.row), Math.abs(pos.col - rgPos.col)) <= 3 && pos.row >= 4, "enemy melee heads for the shooter", r.engageAi)
    // Enemy warrior: slam costs Rage - none at 0, cast at 40.
    const slam = { id: "slam", kind: "slam", cooldown: 3, amount: 6, name: "Ground Slam" }
    const mk = (m) => board(["strength", "bulwark-of-ages", "the-fool"], { strength: { row: 4, col: 6 }, "bulwark-of-ages": { row: 5, col: 6 }, "the-fool": { row: 3, col: 6 }, [CMD]: { row: 4, col: 7 }, [E1]: { row: 4, col: 4, range: 1, enemySkills: [slam], mana: m }, [E0]: { row: 0, col: 0 }, [E2]: { row: 8, col: 0 } })
    const w0 = mk(0)
    ok(U(w0, E1).resource === "rage", "enemy warrior uses Rage")
    ok(!M.canAfford(U(w0, E1), slam) && M.canAfford(U(mk(40), E1), slam), "enemy skills cost Rage")
    const i0 = E.previewEnemyIntents(w0).find((i) => i.enemyId === E1).intent
    const i40 = E.previewEnemyIntents(mk(40)).find((i) => i.enemyId === E1).intent
    r.slam = [i0.skillKind || i0.kind, i40.skillKind || i40.kind]
    ok(i0.skillKind !== "slam" && i40.skillKind === "slam", "enemy Slam needs 25 Rage", r.slam)
  }

  // 12 Preview == real through a melee-heavy fight ------------------------------------------
  {
    let s = M.enableMana(E.createRealMatchupBattle(["bulwark-of-ages", "strength", "the-lovers", "knights-leap"], ["sapling-attendant", "hoardling", "bonewarden"], "tommy"))
    const g = s.units.find((u) => u.defId === "bulwark-of-ages").id
    const rows = []
    for (let turn = 0; turn < 5 && s.phase === "player"; turn++) {
      if (turn === 1) s = E.castAbility(s, g, null, "provoke")
      const pv = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const now = U(after, enemyId)
        if (!now) continue
        let good = true
        if (intent.kind === "move" || intent.kind === "move-attack") good = now.pos.row === intent.to.row && now.pos.col === intent.to.col
        rows.push({ turn, enemyId, kind: intent.skillKind || intent.kind, good })
      }
      s = after
    }
    r.preview = rows.length
    ok(rows.length > 4 && rows.every((x) => x.good), "preview == real (melee kit)", rows.filter((x) => !x.good))
  }

  r.fails = fails
  return r
})
out.engine = engine
out.errors.push(...engine.fails)

// --- UI: a tank taunting -------------------------------------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&front=1&squad=bulwark-of-ages,strength,the-lovers,bishops-slash`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"]').click()
  await page.waitForSelector('.hwt-skill-btn[data-skill-id="provoke"]')
  const enabled = await page.locator('.hwt-skill-btn[data-skill-id="provoke"]').isEnabled()
  await page.locator('.hwt-skill-btn[data-skill-id="provoke"]').click()
  await page.waitForTimeout(600)
  const badges = await page.locator('.hwt-melee-badge[data-mark="provoked"]').count()
  const intents = await page.locator('.hwt-token[data-side="enemy"] .hwt-intent-badge').evaluateAll((els) => els.map((e) => e.getAttribute("title")))
  out.ui = { enabled, badges, intents }
  if (!enabled || badges < 1) out.errors.push("UI: Provoke button + Provoked badges")
  if (!intents.some((t) => /Grovewarden|Bulwark|Ironwood|Ages/i.test(t || "")) && !intents.length) out.errors.push("UI: enemy intents shown")
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${SHOT_DIR}/melee_taunt.png` })
}

out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
