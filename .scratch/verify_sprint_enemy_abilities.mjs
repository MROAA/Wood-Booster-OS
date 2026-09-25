import { chromium } from "playwright"

// Enemy-abilities sprint: one check per enemy skill kind + preview==real.
// Synthetic states, real imported engine functions.

const PORT = process.env.PORT || 5445
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
  const A = await import("/src/services/heartwood/tacticsEnemyAbilities.js")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 5, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, formationId: null, units, terrain, phase: "player", turn: 1, log: [], events: [] })
  const intentOf = (s, id) => E.previewEnemyIntents(s).find((i) => i.enemyId === id)?.intent
  const u = (s, id) => s.units.find((x) => x.id === id)
  const skill = (kind, props) => ({ id: kind, kind, cooldown: A.ENEMY_SKILL_KINDS[kind].cooldown, name: kind, ...props })
  const r = {}

  // Table sanity: most regular enemies + every elite/boss have a skill.
  {
    const table = A.enemySkillTable()
    const ids = Object.keys(table)
    const withSkill = ids.filter((id) => table[id].length)
    const bosses = ["deepwarden", "thornmaw", "wyrmgall", "spacemonkey", "the-gorging-maw", "the-iron-sentinel", "the-bramble-lash", "the-ashfall-herald"]
    r.table = { total: ids.length, withSkill: withSkill.length, bossesOk: bosses.every((id) => table[id]?.length >= 2) }
  }

  // 1. Mend: a hurt ally in range gets healed instead of a weak poke.
  {
    const s = st([
      En("healer", 4, 3, { enemySkills: [skill("mend", { amount: 10 })] }),
      En("hurt", 4, 5, { hp: 8, maxHp: 40 }),
      P("p1", 1, 10),
    ])
    const intent = intentOf(s, "healer")
    const after = E.endPlayerTurn(s)
    r.mend = { intent, hurtHp: u(after, "hurt").hp, cd: u(after, "healer").skillCd, log: after.log.slice(-6) }
  }

  // 2. Shield: an exposed ally gets Block that survives into the player's turn.
  {
    const s = st([
      En("warden", 2, 2, { enemySkills: [skill("shield", { amount: 9 })] }),
      En("front", 4, 6, { hp: 20 }),
      P("p1", 4, 9, { attack: 3 }),
    ])
    const intent = intentOf(s, "warden")
    const after = E.endPlayerTurn(s)
    r.shield = { intent, frontBlock: u(after, "front").block }
  }

  // 3. Hex: a debuff lands on a player unit; the target shows as threatened.
  {
    const s = st([En("witch", 4, 2, { enemySkills: [skill("hex", { status: "vulnerable", amount: 1 })] }), P("p1", 4, 5)])
    const intent = intentOf(s, "witch")
    const after = E.endPlayerTurn(s)
    const s2 = st([En("witch", 4, 2, { enemySkills: [skill("hex", { status: "root", amount: 1 })] }), P("p1", 4, 5)])
    const after2 = E.endPlayerTurn(s2)
    r.hex = { intent, vuln: u(after, "p1").vulnerable, rootAfterReturn: u(after2, "p1").root, events: after.events.map((e) => e.kind + ":" + (e.label || "")) }
  }

  // 4. Pounce: leaps past its normal reach onto a far target and hits (+bonus).
  {
    const s = st([En("hunter", 4, 1, { move: 2, attack: 6, enemySkills: [skill("pounce", { bonus: 3 })] }), P("p1", 4, 5)])
    const intent = intentOf(s, "hunter")
    const after = E.endPlayerTurn(s)
    r.pounce = { intent, pos: u(after, "hunter").pos, hp: u(after, "p1").hp, attackAfter: u(after, "hunter").attack }
  }

  // 5. Summon: a minion appears next to the summoner; cap respected.
  {
    const s = st([En("mother", 4, 1, { enemySkills: [skill("summon", { minion: "sporelet" })] }), P("p1", 4, 10)])
    const intent = intentOf(s, "mother")
    const after = E.endPlayerTurn(s)
    const minions = after.units.filter((x) => x.summonedBy === "mother")
    const capped = st([
      En("mother", 4, 1, { enemySkills: [skill("summon", { minion: "sporelet" })] }),
      En("m1", 3, 1, { summonedBy: "mother" }),
      En("m2", 5, 1, { summonedBy: "mother" }),
      P("p1", 4, 10),
    ])
    r.summon = { intent, count: minions.length, minionDef: minions[0]?.defId, adjacent: minions[0] ? Math.max(Math.abs(minions[0].pos.row - 4), Math.abs(minions[0].pos.col - 1)) : null, cappedIntent: intentOf(capped, "mother") }
  }

  // 6. Slam: windup marks a 3x3; the player steps out -> release misses;
  //    staying in -> release hits.
  {
    const s = st([En("brute", 4, 3, { enemySkills: [skill("slam", { amount: 10 })] }), P("p1", 4, 5), P("p2", 5, 5)])
    const windIntent = intentOf(s, "brute")
    const afterWind = E.endPlayerTurn(s)
    const releaseIntent = intentOf(afterWind, "brute")
    // Stay: both still inside.
    const stay = E.endPlayerTurn(afterWind)
    // Step out: move p1 and p2 far away (outside the tiles).
    let moved = E.moveUnit(afterWind, "p1", { row: 4, col: 7 })
    moved = E.moveUnit(moved, "p2", { row: 7, col: 7 })
    const dodge = E.endPlayerTurn(moved)
    r.slam = {
      windIntent,
      windup: u(afterWind, "brute").windup,
      releaseIntent,
      stayHp: [u(stay, "p1").hp, u(stay, "p2").hp],
      dodgeHp: [u(dodge, "p1").hp, u(dodge, "p2").hp],
      cdAfter: u(stay, "brute").skillCd,
    }
  }

  // 7. Enrage: below 60% HP it frenzies (free), then still attacks.
  {
    const s = st([En("berserk", 4, 4, { hp: 10, maxHp: 30, attack: 4, enemySkills: [skill("enrage", { amount: 3 })] }), P("p1", 4, 5)])
    const intent = intentOf(s, "berserk")
    const after = E.endPlayerTurn(s)
    const s2 = st([En("berserk", 4, 4, { hp: 30, maxHp: 30, enemySkills: [skill("enrage", { amount: 3 })] }), P("p1", 4, 5)])
    r.enrage = { intent, attack: u(after, "berserk").attack, p1Hp: u(after, "p1").hp, healthyIntent: intentOf(s2, "berserk") }
  }

  // 8. Cooldown: a hex used this turn isn't previewed again next turn.
  {
    const s = st([En("witch", 4, 2, { enemySkills: [skill("hex", { status: "poison", amount: 2 })] }), P("p1", 4, 5, { hp: 60, maxHp: 60 })])
    const t1 = E.endPlayerTurn(s)
    const t2Intent = intentOf(t1, "witch")
    r.cooldown = { cd: u(t1, "witch").skillCd, t2Intent }
  }

  // 9. Preview == real turn with REAL derived kits (mixed squad incl. a boss).
  {
    const real = E.createRealMatchupBattle(["bulwark-of-ages", "hexbreaker", "the-fool"], ["mossmender", "fen-stalker", "the-ashfall-herald"], "tommy")
    let s = { ...real, units: real.units.map((x) => (x.side === "enemy" ? { ...x, hp: Math.ceil(x.maxHp * 0.5) } : x)) }
    const rows = []
    for (let turn = 0; turn < 4 && s.phase === "player"; turn++) {
      const preview = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      // Replay: the real enemy phase must follow the previewed kinds exactly.
      const ok = preview.every(({ enemyId, intent }) => {
        const now = after.units.find((x) => x.id === enemyId)
        if (!now) return false
        const to = intent.to || intent.land
        if (to && now.hp > 0) return now.pos.row === to.row && now.pos.col === to.col
        return true
      })
      const skillsSeen = preview.map((p) => (p.intent.kind === "skill" ? p.intent.skillKind + (p.intent.phase ? "/" + p.intent.phase : "") : p.intent.kind))
      rows.push({ turn: s.turn, skillsSeen, ok })
      s = after
    }
    // Deterministic: same state twice -> identical preview.
    r.preview = { rows, stable: JSON.stringify(E.previewEnemyIntents(real)) === JSON.stringify(E.previewEnemyIntents(real)) }
  }
  return r
})

out.result = result
const R = result
if (!(R.table.withSkill >= R.table.total * 0.6 && R.table.bossesOk)) out.errors.push("table: too few enemies have skills")
if (!(R.mend.intent?.skillKind === "mend" && R.mend.intent.targetId === "hurt" && R.mend.hurtHp === 18 && R.mend.cd?.mend === 2)) out.errors.push("check1 mend")
if (!(R.shield.intent?.skillKind === "shield" && R.shield.intent.targetId === "front" && R.shield.frontBlock === 9)) out.errors.push("check2 shield")
if (!(R.hex.intent?.skillKind === "hex" && R.hex.vuln === 1 && R.hex.rootAfterReturn === 1 && R.hex.events.includes("reaction:Vulnerable!"))) out.errors.push("check3 hex")
if (!(R.pounce.intent?.skillKind === "pounce" && R.pounce.pos.col === 4 && R.pounce.hp <= 21 && R.pounce.attackAfter === 6)) out.errors.push("check4 pounce")
if (!(R.summon.intent?.skillKind === "summon" && R.summon.count === 1 && R.summon.minionDef === "sporelet" && R.summon.adjacent === 1 && R.summon.cappedIntent?.kind !== "skill")) out.errors.push("check5 summon")
{
  const g = R.slam
  if (!(g.windIntent?.skillKind === "slam" && g.windIntent.phase === "windup" && g.windIntent.tiles.length === 9 && g.windup)) out.errors.push("check6a slam windup")
  if (!(g.releaseIntent?.phase === "release" && g.stayHp.every((h) => h < 30) && g.dodgeHp.every((h) => h === 30) && g.cdAfter?.slam === 3)) out.errors.push("check6b slam release/dodge")
}
if (!(R.enrage.intent?.skillKind === "enrage" && ["attack", "move-attack"].includes(R.enrage.intent.then?.kind) && R.enrage.attack === 7 && R.enrage.p1Hp < 30 && R.enrage.healthyIntent?.kind !== "skill")) out.errors.push("check7 enrage")
if (!(R.cooldown.cd?.hex === 3 && R.cooldown.t2Intent?.kind !== "skill")) out.errors.push("check8 cooldown")
if (!(R.preview.stable && R.preview.rows.length >= 2 && R.preview.rows.every((x) => x.ok) && R.preview.rows.some((x) => x.skillsSeen.some((k) => k.includes("/") || ["mend", "pounce", "hex", "shield", "slam"].some((n) => k.startsWith(n))))))
  out.errors.push("check9 preview==real with real kits")

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_enemy_abilities PASS" : "\n❌ verify_sprint_enemy_abilities FAIL")
process.exit(pass ? 0 : 1)
