// Class ultimates batch 1 (Marc 2026-10-14: "as complex as Dota"): the 8
// most-used classes get their OWN ultimate instead of the shared role one -
// Guardian Aegis of Ages, Warden Grove Sanctum, Juggernaut Unstoppable,
// Bruiser Earthshatter, Striker Flurry, Executioner Culling Blade,
// Artillery Meteor Barrage, Healer Wellspring. Pure-engine checks + one UI
// click with screenshots.
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5451
const SHOT_DIR = process.env.SHOT_DIR || new URL("./shots", import.meta.url).pathname
await mkdir(SHOT_DIR, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 30000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const X = await import("/src/services/heartwood/tacticsUltimates.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const CMD = "player-commander"
  const U = (s, id) => s.units.find((u) => u.id === id)
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  // Same synthetic board as verify_mana_2, classes kept.
  function board(squad, place) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain: {},
      wallHp: {},
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, mana: _mana, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [], block: 0 } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    s = M.enableMana(s, [])
    return {
      ...s,
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k || k.mana == null) return u
        return { ...u, mana: k.mana === "full" ? u.manaMax : k.mana }
      }),
    }
  }
  const spent = (a, s, id) => U(a, id).mana === 0 && U(a, id).ap === U(s, id).ap - 1
  const ultEvent = (a, re) => (a.events || []).some((e) => e.kind === "combo" && e.combo === "hero-ult" && re.test(e.label))

  // 1 Each of the 8 classes has its own ultimate --------------------------------------------
  {
    const heroes = { temperance: "aegis-of-ages", justice: "grove-sanctum", "the-chariot": "unstoppable", strength: "earthshatter", "the-hierophant": "flurry", "the-hanged-man": "culling-blade", "the-tower": "meteor-barrage", "the-fool": "wellspring" }
    r.map = {}
    for (const [def, want] of Object.entries(heroes)) {
      const s = board([def], { [def]: { row: 4, col: 9 }, [E0]: { row: 0, col: 0 } })
      const u = U(s, pid(s, def))
      r.map[def] = [u.classId, X.heroUltInfo(u)?.id || null]
      ok(X.heroUltInfo(u)?.id === want, `${def} gets ${want}`, r.map[def])
    }
    // A class without its own ultimate keeps the role one (the Buffer -> Mana Surge).
    const s = board(["ashenhorn"], { ashenhorn: { row: 4, col: 9 }, [E0]: { row: 0, col: 0 } })
    ok(X.heroUltInfo(U(s, pid(s, "ashenhorn")))?.id === "mana-surge", "other classes keep their role ultimate")
  }

  // 2 Each does what it says ----------------------------------------------------------------
  {
    // Aegis of Ages: +8 self, +5 Block and a Ward to heroes within 2; nothing farther.
    let s = board(["temperance", "the-fool", "strength"], { temperance: { row: 4, col: 9, mana: "full" }, "the-fool": { row: 4, col: 7 }, strength: { row: 0, col: 2 }, [E0]: { row: 8, col: 0 } })
    let g = pid(s, "temperance")
    let a = X.castHeroUltimate(s, g)
    const fool = U(a, pid(s, "the-fool"))
    r.aegis = [U(a, g).block, fool.block, fool.ward, U(a, pid(s, "strength")).block]
    ok(U(a, g).block === 8 && fool.block === 5 && fool.ward >= 1 && U(a, pid(s, "strength")).block === 0 && spent(a, s, g), "Aegis of Ages: +8 self, +5 Block + Ward within 2", r.aegis)
    ok(ultEvent(a, /AEGIS OF AGES/), "Aegis callout")

    // Grove Sanctum: roots enemies within 2, +4 Block to heroes within 2 (itself too).
    s = board(["justice", "the-fool"], { justice: { row: 4, col: 9, mana: "full" }, "the-fool": { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 4, col: 3 } })
    g = pid(s, "justice")
    a = X.castHeroUltimate(s, g)
    r.sanctum = [U(a, E0).root, U(a, E1).root || 0, U(a, g).block, U(a, pid(s, "the-fool")).block]
    ok(U(a, E0).root > 0 && !(U(a, E1).root > 0) && U(a, g).block === 4 && U(a, pid(s, "the-fool")).block === 4 && spent(a, s, g), "Grove Sanctum: roots within 2 + 4 Block", r.sanctum)

    // Unstoppable: cures itself, +6 Block, +3 attack.
    s = board(["the-chariot"], { "the-chariot": { row: 4, col: 9, mana: "full", poison: 3, root: 2, slow: 2 }, [E0]: { row: 0, col: 0 } })
    g = pid(s, "the-chariot")
    a = X.castHeroUltimate(s, g)
    r.unstoppable = [U(a, g).poison, U(a, g).root, U(a, g).slow, U(a, g).block, U(a, g).attack - U(s, g).attack]
    ok(!U(a, g).poison && !U(a, g).root && !U(a, g).slow && U(a, g).block === 6 && U(a, g).attack === U(s, g).attack + 3 && spent(a, s, g), "Unstoppable: cures, +6 Block, +3 attack", r.unstoppable)

    // Earthshatter: every ADJACENT enemy takes 1.5x and is Stunned; 2 tiles away untouched.
    s = board(["strength"], { strength: { row: 4, col: 6, mana: "full" }, [E0]: { row: 4, col: 5 }, [E1]: { row: 5, col: 7 }, [E2]: { row: 4, col: 3 } })
    g = pid(s, "strength")
    a = X.castHeroUltimate(s, g)
    const dmg = Math.round(U(s, g).attack * 1.5)
    r.shatter = { dmg, e0: [U(a, E0).hp, U(a, E0).stun], e1: [U(a, E1).hp, U(a, E1).stun], e2: U(a, E2).hp }
    ok(U(a, E0).hp === 40 - dmg && U(a, E1).hp === 40 - dmg && U(a, E0).stun > 0 && U(a, E1).stun > 0 && U(a, E2).hp === 40 && spent(a, s, g), "Earthshatter: 1.5x + Stun to adjacent enemies only", r.shatter)

    // Flurry: three hits on one adjacent enemy - more than a basic attack x2.
    s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6, mana: "full" }, [E0]: { row: 4, col: 5, hp: 120, maxHp: 120 }, [E1]: { row: 0, col: 0 } })
    g = pid(s, "the-hierophant")
    ok(X.heroUltTargets(s, g).map((u) => u.id).join() === E0, "Flurry targets adjacent enemies only")
    a = X.castHeroUltimate(s, g, E0)
    const basic = 120 - U(E.attackUnit(s, g, E0), E0).hp
    r.flurry = { ult: 120 - U(a, E0).hp, basic, hits: (a.events || []).filter((e) => e.kind === "damage" && e.targetId === E0).length }
    ok(r.flurry.ult >= 2 * basic && spent(a, s, g), "Flurry: 3 strikes, 2x+ a basic attack", r.flurry)

    // Culling Blade: below 35% dies outright (+1 AP back); above it, a 1.5x hit.
    s = board(["the-hanged-man"], { "the-hanged-man": { row: 4, col: 6, mana: "full" }, [E0]: { row: 4, col: 5, hp: 13, maxHp: 40, block: 5 }, [E1]: { row: 5, col: 5 } })
    g = pid(s, "the-hanged-man")
    a = X.castHeroUltimate(s, g, E0)
    r.cull = { e0: U(a, E0).hp, ap: [U(s, g).ap, U(a, g).ap] }
    ok(U(a, E0).hp <= 0 && U(a, g).ap === U(s, g).ap && U(a, g).mana === 0, "Culling Blade executes below 35% and refunds the AP", r.cull)
    a = X.castHeroUltimate(s, g, E1)
    r.cull.e1 = U(a, E1).hp
    ok(U(a, E1).hp > 0 && U(a, E1).hp < 40 && U(a, g).ap === U(s, g).ap - 1, "Culling Blade: a normal hit above 35%, no refund", r.cull)

    // Meteor Barrage: 3x3 around the target at range +1: damage + Burn.
    s = board(["the-tower"], { "the-tower": { row: 4, col: 9, mana: "full" }, [E0]: { row: 4, col: 5 }, [E1]: { row: 5, col: 4 }, [E2]: { row: 4, col: 2 } })
    g = pid(s, "the-tower")
    r.meteorReach = [U(s, g).range, X.heroUltTargets(s, g).map((u) => u.id)]
    const target = X.heroUltTargets(s, g)[0]?.id
    a = target ? X.castHeroUltimate(s, g, target) : s
    r.meteor = { target, e0: U(a, E0).hp, e1: U(a, E1).hp, e2: U(a, E2).hp, burn: [U(a, E0).burn, U(a, E1).burn] }
    ok(target === E0 && U(a, E0).hp < 40 && U(a, E1).hp < 40 && U(a, E2).hp === 40 && U(a, E0).burn > 0 && spent(a, s, g), "Meteor Barrage: 3x3 damage + Burn, not beyond", { ...r.meteor, reach: r.meteorReach })

    // Wellspring: heal 8 + cure ALL ailments within 3; nothing farther.
    s = board(["the-fool", "the-chariot", "strength"], { "the-fool": { row: 4, col: 9, mana: "full" }, "the-chariot": { row: 4, col: 7, hp: 10, poison: 3, root: 2, cursed: 1 }, strength: { row: 0, col: 2, hp: 10 }, [E0]: { row: 8, col: 0 } })
    a = X.castHeroUltimate(s, pid(s, "the-fool"))
    const ch = U(a, pid(s, "the-chariot"))
    r.well = [ch.hp, ch.poison, ch.root, ch.cursed, U(a, pid(s, "strength")).hp]
    ok(ch.hp === 18 && !ch.poison && !ch.root && !ch.cursed && U(a, pid(s, "strength")).hp === 10, "Wellspring: +8 and cures everything within 3", r.well)
  }
  return { r, fails }
})
out.engine = engine.r
for (const f of engine.fails) out.errors.push(f)

// ---- UI: the Juggernaut's button shows its own ultimate and fires it ---------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=100&squad=the-chariot,ashenhorn,the-fool,the-magician`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-the-chariot-0"]').click()
  const btn = page.locator('.hwt-universal-btn[data-action="hero-ult"]')
  await btn.waitFor({ timeout: 5000 })
  const label = await btn.innerText()
  const title = await btn.getAttribute("title")
  await page.screenshot({ path: `${SHOT_DIR}/class_ults_ready.png` })
  await btn.click()
  await page.waitForSelector(".hw-floating-number", { timeout: 3000 }).catch(() => {})
  const pops = await page.locator(".hw-floating-number").allInnerTexts()
  out.ui = { label, title, pops }
  if (!(/Unstoppable/.test(label) && /\+3 attack/.test(title))) out.errors.push("UI: Juggernaut button shows Unstoppable")
  if (!pops.some((t) => /UNSTOPPABLE/.test(t))) out.errors.push("UI: Unstoppable fires with a big callout")
  await page.screenshot({ path: `${SHOT_DIR}/class_ults_fired.png` })
}
out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
