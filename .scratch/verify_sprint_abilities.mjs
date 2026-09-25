// Abilities sprint: every deployable unit has an active ability + one
// check per NEW ability kind (synthetic states) + one UI check.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5444
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

// Engine checks, all inside the page (real Vite module graph).
const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const KINDS = ["aura-block", "heal", "burst", "dash", "cleave", "poison-strike", "root-shot", "push", "taunt-shout", "shield-ally", "rally"]
  const res = {}

  // Every non-summon unit (recruitable, evolved and fused) gets one.
  const missing = []
  for (const def of Object.values(UNITS)) {
    if (def.summonOnly) continue
    const b = E.createTacticsBattle("default", [def.id])
    const u = b.units.find((x) => x.defId === def.id)
    const a = u?.ability
    if (!a || !KINDS.includes(a.kind) || !(a.cost >= 1 && a.cost <= 2) || !(a.cooldown >= 1) || !E.describeAbility(a)) missing.push(def.id)
  }
  const commander = E.createTacticsBattle("default", ["swiftclaw"]).units.find((u) => u.id === "player-commander")
  res.allHaveAbility = { missing, commanderAbility: commander?.ability ?? null }

  // Synthetic board: one player unit + commander vs the 3 default enemies,
  // all repositioned by hand.
  function setup(defId, layout) {
    let s = E.createTacticsBattle("default", [defId])
    const p = s.units.find((u) => u.defId === defId && u.side === "player")
    const enemies = s.units.filter((u) => u.side === "enemy")
    const pos = { [p.id]: layout.p, "player-commander": layout.c || { row: 8, col: 11 } }
    enemies.forEach((e, i) => (pos[e.id] = layout.e[i] || { row: i * 4, col: 0 }))
    s = { ...s, terrain: {}, units: s.units.map((u) => (pos[u.id] ? { ...u, pos: pos[u.id], block: 0 } : { ...u, hp: 0 })) }
    return { s, p, e: enemies }
  }
  const get = (s, id) => s.units.find((u) => u.id === id)
  const labels = (s) => (s.events || []).filter((e) => e.kind === "reaction").map((e) => e.label)

  // dash
  {
    const { s, p, e } = setup("swiftclaw", { p: { row: 4, col: 10 }, e: [{ row: 4, col: 6 }, { row: 0, col: 0 }, { row: 8, col: 0 }] })
    const after = E.castAbility(s, p.id, e[0].id)
    const pu = get(after, p.id)
    res.dash = {
      name: p.ability.name, from: p.pos, to: pu.pos, adjacent: Math.max(Math.abs(pu.pos.row - 4), Math.abs(pu.pos.col - 6)) === 1,
      dmg: get(s, e[0].id).hp - get(after, e[0].id).hp, expected: p.attack + p.ability.bonus, ap: pu.ap, cd: pu.cooldownRemaining, labels: labels(after),
      tooFar: E.abilityTargets(setup("swiftclaw", { p: { row: 4, col: 11 }, e: [{ row: 4, col: 2 }] }).s, p.id).length,
    }
  }
  // cleave
  {
    const { s, p, e } = setup("grimtusk", { p: { row: 4, col: 5 }, e: [{ row: 4, col: 4 }, { row: 3, col: 3 }, { row: 8, col: 0 }] })
    const after = E.castAbility(s, p.id, e[0].id)
    res.cleave = {
      name: p.ability.name, main: get(s, e[0].id).hp - get(after, e[0].id).hp, splash: get(s, e[1].id).hp - get(after, e[1].id).hp,
      far: get(s, e[2].id).hp - get(after, e[2].id).hp, attack: p.attack, labels: labels(after),
    }
  }
  // poison-strike
  {
    const { s, p, e } = setup("rootfang", { p: { row: 4, col: 5 }, e: [{ row: 4, col: 4 }] })
    const after = E.castAbility(s, p.id, e[0].id)
    res.poison = { name: p.ability.name, amount: p.ability.amount, poison: get(after, e[0].id).poison, dmg: get(s, e[0].id).hp - get(after, e[0].id).hp, labels: labels(after) }
  }
  // root-shot
  {
    const { s, p, e } = setup("frostbind", { p: { row: 4, col: 5 }, e: [{ row: 4, col: 4 }] })
    const after = E.castAbility(s, p.id, e[0].id)
    res.root = { name: p.ability.name, root: get(after, e[0].id).root, reach: E.reachableTilesFor({ ...after, phase: "enemy" }, e[0].id).length, labels: labels(after) }
  }
  // push (free + blocked)
  {
    const { s, p, e } = setup("justice", { p: { row: 4, col: 5 }, e: [{ row: 4, col: 4 }] })
    const after = E.castAbility(s, p.id, e[0].id)
    const b = setup("justice", { p: { row: 4, col: 5 }, e: [{ row: 4, col: 4 }, { row: 4, col: 3 }] })
    const blocked = E.castAbility(b.s, p.id, e[0].id)
    res.push = {
      name: p.ability.name, to: get(after, e[0].id).pos, dmgFree: get(s, e[0].id).hp - get(after, e[0].id).hp,
      blockedPos: get(blocked, e[0].id).pos, dmgBlocked: get(b.s, e[0].id).hp - get(blocked, e[0].id).hp, bonus: p.ability.bonus, labels: labels(after),
    }
  }
  // taunt-shout
  {
    const { s, p, e } = setup("ironbark", { p: { row: 4, col: 5 }, c: { row: 3, col: 5 }, e: [{ row: 4, col: 4 }] })
    const noTaunt = { ...s, units: s.units.map((u) => (u.id === p.id ? { ...u, taunt: 0 } : u)) }
    const before = E.attackableTargets({ ...noTaunt, phase: "enemy" }, e[0].id).map((u) => u.id)
    const after = E.castAbility(noTaunt, p.id)
    const during = E.attackableTargets({ ...after, phase: "enemy" }, e[0].id).map((u) => u.id)
    const nextTurn = E.attackableTargets({ ...after, phase: "enemy", turn: after.turn + 1 }, e[0].id).map((u) => u.id)
    res.taunt = { name: p.ability.name, before, during, nextTurn, pid: p.id, block: get(after, p.id).block, amount: p.ability.amount, labels: labels(after) }
  }
  // shield-ally
  {
    const { s, p } = setup("thornguard", { p: { row: 4, col: 5 }, c: { row: 3, col: 5 }, e: [{ row: 0, col: 0 }] })
    const after = E.castAbility(s, p.id, "player-commander")
    const c = get(after, "player-commander")
    const farAlly = E.castAbility({ ...s, units: s.units.map((u) => (u.id === "player-commander" ? { ...u, pos: { row: 8, col: 11 } } : u)) }, p.id, "player-commander")
    res.shield = { name: p.ability.name, ward: c.ward, block: c.block, amount: p.ability.amount, farRejected: get(farAlly, p.id).ap === p.ap, labels: labels(after), events: (after.events || []).map((x) => x.kind) }
  }
  // rally
  {
    const { s, p } = setup("beastcaller", { p: { row: 4, col: 5 }, c: { row: 3, col: 5 }, e: [{ row: 0, col: 0 }] })
    const after = E.castAbility(s, p.id)
    res.rally = {
      name: p.ability.name, self: get(after, p.id).attack - get(s, p.id).attack,
      cmd: get(after, "player-commander").attack - get(s, "player-commander").attack, labels: labels(after),
    }
  }
  return res
})
out.engine = engine
const e = engine
const check = (ok, msg) => !ok && out.errors.push(msg)
check(e.allHaveAbility.missing.length === 0 && e.allHaveAbility.commanderAbility === null, "every deployable unit should have a valid ability (Commander none)")
check(e.dash.adjacent && e.dash.dmg === e.dash.expected && e.dash.ap === 0 && e.dash.cd === 3 && e.dash.labels.includes(`${e.dash.name}!`) && e.dash.tooFar === 0, "dash")
check(e.cleave.main === e.cleave.attack && e.cleave.splash === Math.ceil(e.cleave.attack / 2) && e.cleave.far === 0 && e.cleave.labels.includes(`${e.cleave.name}!`), "cleave")
check(e.poison.poison === e.poison.amount && e.poison.dmg > 0 && e.poison.labels.includes("Poisoned!"), "poison-strike")
check(e.root.root === 2 && e.root.reach === 0 && e.root.labels.includes("Rooted!"), "root-shot")
check(e.push.to.col === 3 && e.push.to.row === 4 && e.push.blockedPos.col === 4 && e.push.dmgBlocked === e.push.dmgFree + e.push.bonus && e.push.labels.includes("Knocked back!"), "push")
check(e.taunt.before.length === 2 && e.taunt.during.length === 1 && e.taunt.during[0] === e.taunt.pid && e.taunt.nextTurn.length === 2 && e.taunt.block === e.taunt.amount, "taunt-shout")
check(e.shield.ward === 1 && e.shield.block === e.shield.amount && e.shield.farRejected && e.shield.events.includes("ward"), "shield-ally")
check(e.rally.self === 1 && e.rally.cmd === 1 && e.rally.labels.includes(`${e.rally.name}!`), "rally")

// UI: pick Beastcaller in the squad picker, select it, fire its ability.
{
  await page.locator(".hwt-squad-select").nth(0).selectOption("beastcaller")
  await page.waitForTimeout(250)
  const token = page.locator('.hwt-token[data-side="player"]', { hasText: "Beastcaller" }).first()
  await token.click()
  await page.waitForTimeout(150)
  const btn = page.locator(".hwt-ability-btn")
  const label = await btn.innerText()
  const hint = await page.locator(".hwt-ability-hint").innerText()
  await btn.click()
  await page.waitForTimeout(300)
  const labelAfter = await btn.innerText().catch(() => "")
  const log = (await page.locator(".hwt-log p").allInnerTexts()).join("\n")
  out.ui = { label, hint, labelAfter, logHas: log.includes("Pack Call") }
  check(label.includes("Pack Call") && hint.includes("Strength") && labelAfter.includes("Recharging") && out.ui.logHas, "UI: Beastcaller's Pack Call via the ability button")
}
// UI: an enemy-targeted ability still arms targeting + casts (Hexbreaker).
{
  await page.locator(".hwt-token", { hasText: "Hexbreaker" }).first().click()
  await page.waitForTimeout(150)
  await page.locator(".hwt-ability-btn").click()
  await page.waitForTimeout(150)
  const hint = await page.locator(".hwt-ability-hint").innerText()
  out.ui.hexHint = hint
  check(hint === "Choose an enemy for Focused Shot.", "UI: Focused Shot hint")
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_abilities PASS" : "\n❌ verify_sprint_abilities FAIL")
process.exit(pass ? 0 : 1)
