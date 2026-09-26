import { chromium } from "playwright"

// Smarter-enemies sprint: focused checks for the scored enemy AI in
// tacticsEngine.js (decideEnemyIntent/applyEnemyIntent). Synthetic states,
// real imported engine functions.

const PORT = process.env.PORT || 5442
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
const out = { errors: [] }

await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const result = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, ap: 2, apMax: 2, regen: 0, strength: 0,
    // Enemy-abilities sprint: isolate the base AI from the template def's skill kit.
    enemySkills: [],
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 5, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, phase: "player", turn: 1, log: [], events: [] })
  const intentOf = (s, id) => E.previewEnemyIntents(s).find((i) => i.enemyId === id)?.intent
  const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
  const r = {}

  // 1. Kill priority: a Warded 5-HP unit (can't die) vs a killable 6-HP one;
  //    and the Commander over an identical plain unit.
  {
    const s = st([En("e1", 4, 5, { attack: 6, move: 1 }), P("warded", 4, 6, { hp: 5, ward: 1 }), P("soft", 3, 6, { hp: 6 })])
    const s2 = st([En("e1", 4, 5, { attack: 3, move: 1 }), P("plain", 3, 6), P("player-commander", 5, 6)])
    r.kill = { a: intentOf(s, "e1"), b: intentOf(s2, "e1") }
  }

  // 2. Flank: melee two tiles away from a W-facing target picks a back tile.
  {
    const s = st([En("e1", 2, 4, { attack: 5, move: 2 }), P("p1", 4, 5, { move: 1 })])
    const intent = intentOf(s, "e1")
    const after = E.runEnemyTurn({ ...s, phase: "enemy" })
    r.flank = { intent, hpAfter: after.units.find((u) => u.id === "p1").hp }
  }

  // 3. Ranged: stuck next to melee -> shoots then steps away; far away -> attacks from max range.
  {
    const s = st([En("archer", 4, 5, { range: 3, move: 2, hp: 20, maxHp: 20 }), P("p1", 4, 6, { attack: 3, move: 1 })])
    const intent = intentOf(s, "archer")
    const after = E.runEnemyTurn({ ...s, phase: "enemy" })
    const a = after.units.find((u) => u.id === "archer")
    const p = after.units.find((u) => u.id === "p1")
    const s2 = st([En("archer", 4, 1, { range: 3, move: 2 }), P("p1", 4, 5)])
    const intent2 = intentOf(s2, "archer")
    r.ranged = { intent, archerPos: a.pos, archerDist: dist(a.pos, p.pos), p1Hp: p.hp, intent2, dist2: intent2.to ? dist(intent2.to, { row: 4, col: 5 }) : null }
  }

  // 4. Poison: a whole column of poison between enemy and target - it stops short.
  {
    const terrain = {}
    for (let row = 0; row < 9; row++) terrain[`${row}-4`] = "poison"
    const s = st([En("e1", 4, 2, { move: 2 }), P("p1", 4, 8)], terrain)
    const intent = intentOf(s, "e1")
    const after = E.runEnemyTurn({ ...s, phase: "enemy" })
    const e = after.units.find((u) => u.id === "e1")
    r.poison = { intent, endTerrain: terrain[`${e.pos.row}-${e.pos.col}`] || "path", enemyPoison: e.poison }
  }

  // 5. Preview == real turn: mixed squad (melee, ranged, boss) incl. terrain.
  {
    const terrain = { "3-6": "poison", "5-6": "rock" }
    const s = st(
      [
        En("brute", 4, 4, { attack: 6 }),
        En("archer", 2, 7, { range: 3, hp: 20, maxHp: 20 }),
        En("boss", 6, 3, { hp: 80, maxHp: 80, attack: 8, phases: [{ at: 0.5 }] }),
        P("player-commander", 4, 8, { hp: 25 }),
        P("p2", 2, 8, { hp: 12, maxHp: 20, attack: 3 }),
        P("p3", 6, 9, { range: 3 }),
      ],
      terrain,
    )
    const preview = E.previewEnemyIntents(s)
    const previewAgain = E.previewEnemyIntents(s)
    const after = E.runEnemyTurn({ ...s, phase: "enemy" })
    const rows = preview.map(({ enemyId, intent }) => {
      const before = s.units.find((u) => u.id === enemyId)
      const now = after.units.find((u) => u.id === enemyId)
      const moved = now.pos.row !== before.pos.row || now.pos.col !== before.pos.col
      let ok = true
      if (intent.kind === "move" || intent.kind === "move-attack") ok = now.pos.row === intent.to.row && now.pos.col === intent.to.col
      else if (intent.kind === "attack" && !intent.retreat) ok = !moved
      else if (intent.kind === "hold") ok = !moved
      if (intent.targetId) {
        const tb = s.units.find((u) => u.id === intent.targetId).hp
        const ta = after.units.find((u) => u.id === intent.targetId).hp
        ok = ok && ta < tb
      }
      return { enemyId, intent, pos: now.pos, ok }
    })
    // Stunned enemy (relic stun) previews as skipping and really doesn't move;
    // spent AP (after its last turn) is refreshed in the preview.
    const st2 = st([En("e1", 4, 4, { stun: 1 }), En("e2", 2, 4, { ap: 0 }), P("p1", 4, 6), P("p2", 2, 6)])
    const pv2 = E.previewEnemyIntents(st2)
    const after2 = E.endPlayerTurn(st2)
    const e1After = after2.units.find((u) => u.id === "e1")
    const p2After = after2.units.find((u) => u.id === "p2")
    r.preview = {
      rows,
      stable: JSON.stringify(preview) === JSON.stringify(previewAgain),
      stun: { pv2, e1Pos: e1After.pos, p2Hp: p2After.hp },
    }
  }
  return r
})

out.result = result
{
  const { a, b } = result.kill
  if (!(a?.kind === "attack" && a.targetId === "soft" && b?.targetId === "player-commander")) out.errors.push("check1 kill/commander priority wrong")
}
{
  const { intent, hpAfter } = result.flank
  if (!(intent?.kind === "move-attack" && intent.to.col === 6 && hpAfter < 30)) out.errors.push("check2 melee did not flank to the back")
}
{
  const g = result.ranged
  if (!(g.intent?.kind === "attack" && g.intent.retreat && g.archerDist >= 2 && g.p1Hp < 30)) out.errors.push("check3a ranged did not shoot-then-step-away")
  if (!(g.intent2?.kind === "move-attack" && g.dist2 === 3)) out.errors.push("check3b ranged did not attack from max range")
}
{
  const g = result.poison
  if (!(g.intent?.kind === "move" && g.endTerrain !== "poison" && g.enemyPoison === 0)) out.errors.push("check4 enemy walked onto poison")
}
{
  const g = result.preview
  if (!(g.stable && g.rows.length === 3 && g.rows.every((x) => x.ok))) out.errors.push("check5 preview did not match the real enemy turn")
  const s = g.stun
  const e2Intent = s.pv2.find((i) => i.enemyId === "e2")?.intent
  if (!(s.pv2[0]?.intent.kind === "stunned" && s.e1Pos.col === 4 && e2Intent?.kind === "move-attack" && s.p2Hp < 30)) {
    out.errors.push("check5b stunned/spent-AP preview did not match the real turn")
  }
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_enemy_ai PASS" : "\n❌ verify_sprint_enemy_ai FAIL")
process.exit(pass ? 0 : 1)
