// Mana sprint 2 ("mana is the core fun system"): per-hero ULTIMATES (a
// full bar, one per role: Unbreakable / Onslaught / Deadeye / Renewal /
// Mana Surge / Mana Storm), MANA LINK (support/healer/control pass their
// resource to an ally - combos), MANA WELLS (contested regen tiles with
// art), mana BURN / STEAL vs the new enemy ultimates, and 3 new resource
// relics (Wellspring Compass, Nullstone Shard, Echo Prism). Pure-engine
// checks + UI clicks with screenshots.
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
  const REL = await import("/src/data/heartwood/relics.js")
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
  // Synthetic board with mana ON (verify_mana_1's helper); `mana` overrides the start.
  function board(squad, place, { terrain = {}, relics = [] } = {}) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, mana: _mana, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    s = M.enableMana(s, relics)
    return {
      ...s,
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k || k.mana == null) return u
        return { ...u, mana: k.mana === "full" ? u.manaMax : k.mana }
      }),
    }
  }
  const full = (s, id) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, mana: u.manaMax } : u)) })
  const ult = () => ({ id: "cataclysm", name: "Cataclysm", icon: "☄", shape: "blast", radius: 1, range: 6, burn: 0, amount: 10, gain: 25 })
  const arm = (s, id) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ult: ult(), ultCharge: 100, ultArmed: { center: { row: 4, col: 9 }, tiles: [{ row: 4, col: 9 }], turn: 0 } } : u)) })

  // Sections 1-2 test the shared ROLE ultimates: per-class ultimates
  // (verify_class_ults.mjs) are switched off here and restored after.
  const savedClassUlts = { ...X.CLASS_ULTS }
  for (const k of Object.keys(X.CLASS_ULTS)) delete X.CLASS_ULTS[k]
  // 1 Every hero role has an ultimate (the Commander keeps its own Power) -------------------
  {
    const s = board(["the-chariot", "strength", "the-hermit", "the-fool"], { "the-chariot": { row: 1, col: 9 }, strength: { row: 3, col: 9 }, "the-hermit": { row: 5, col: 9 }, "the-fool": { row: 7, col: 9 } })
    const s2 = board(["ashenhorn", "the-magician"], { ashenhorn: { row: 1, col: 9 }, "the-magician": { row: 3, col: 9 } })
    r.ults = [...s.units, ...s2.units].filter((u) => u.side === "player" && u.hp > 0).map((u) => [u.defId, M.manaRole(u), X.heroUltInfo(u)?.id || null])
    const ids = new Set(r.ults.map((x) => x[2]))
    ok(["unbreakable", "onslaught", "deadeye", "renewal", "mana-surge", "mana-storm"].every((id) => ids.has(id)), "6 role ultimates", r.ults)
    ok(X.heroUltInfo(U(s, CMD)) === null, "the Commander has its own Power, not a hero ultimate")
    const fool = pid(s, "the-fool")
    ok(!X.heroUltReady(s, { ...U(s, fool), mana: U(s, fool).manaMax - 1 }) && X.heroUltReady(s, full(s, fool).units.find((u) => u.id === fool)), "needs a FULL bar")
    ok(!X.heroUltReady(s, { ...U(full(s, fool), fool), ap: 0 }), "needs 1 AP")
    ok(X.castHeroUltimate(s, fool) === s, "refused without a full bar")
  }

  // 2 Each ultimate does what it says ----------------------------------------------------------
  {
    // Unbreakable (tank): +12 Block self, +6 adjacent allies.
    let s = board(["the-chariot", "the-fool"], { "the-chariot": { row: 4, col: 9, mana: "full" }, "the-fool": { row: 4, col: 10 }, [E0]: { row: 0, col: 0 } })
    const ch = pid(s, "the-chariot")
    let a = X.castHeroUltimate(s, ch)
    ok(U(a, ch).block === 12 && U(a, pid(s, "the-fool")).block === 6 && U(a, ch).mana === 0 && U(a, ch).ap === U(s, ch).ap - 1, "Unbreakable: +12 / +6 Block, spends the bar + 1 AP")
    ok((a.events || []).some((e) => e.kind === "combo" && e.combo === "hero-ult" && /UNBREAKABLE/.test(e.label)), "ultimate callout")
    // Onslaught (melee): 2.5x on an adjacent enemy; nothing farther.
    s = board(["strength"], { strength: { row: 4, col: 6, mana: "full" }, [E0]: { row: 4, col: 5, hp: 80, maxHp: 80 }, [E1]: { row: 0, col: 0 } })
    const st = pid(s, "strength")
    ok(X.heroUltTargets(s, st).map((u) => u.id).join() === E0, "Onslaught targets adjacent enemies only")
    a = X.castHeroUltimate(s, st, E0)
    const basic = 80 - U(E.attackUnit(s, st, E0), E0).hp
    r.onslaught = { ult: 80 - U(a, E0).hp, basic }
    ok(r.onslaught.ult >= 1.8 * basic, "Onslaught hits for ~2x+ a basic attack (both with the full-bar bonuses)", r.onslaught)
    ok(X.castHeroUltimate(s, st, E1) === s, "refused on a target out of reach")
    // Deadeye (ranged): range + 1.
    s = board(["the-hermit"], { "the-hermit": { row: 4, col: 9, mana: "full" }, [E0]: { row: 4, col: 9 - (3 + 1), hp: 80, maxHp: 80 }, [E1]: { row: 4, col: 9 - 5 } })
    const he = pid(s, "the-hermit")
    const tg = X.heroUltTargets(s, he).map((u) => u.id)
    ok(tg.includes(E0) && !tg.includes(E1), "Deadeye reaches range + 1", tg)
    a = X.castHeroUltimate(s, he, E0)
    ok(U(a, E0).hp < 80 && U(a, he).mana === 0, "Deadeye lands")
    // Renewal (healer): heals within 3 + cures poison; not farther.
    s = board(["the-fool", "the-chariot", "strength"], { "the-fool": { row: 4, col: 9, mana: "full" }, "the-chariot": { row: 4, col: 7, hp: 10, poison: 3 }, strength: { row: 0, col: 2, hp: 10 }, [E0]: { row: 8, col: 0 } })
    a = X.castHeroUltimate(s, pid(s, "the-fool"))
    ok(U(a, pid(s, "the-chariot")).hp === 20 && U(a, pid(s, "the-chariot")).poison === 0 && U(a, pid(s, "strength")).hp === 10, "Renewal heals + cures within 3 tiles")
    // Mana Surge (support): allies within 3 gain resource - the combo enabler.
    s = board(["ashenhorn", "the-magician", "the-hermit"], { ashenhorn: { row: 4, col: 9, mana: "full" }, "the-magician": { row: 4, col: 7, mana: 0 }, "the-hermit": { row: 0, col: 1, mana: 0 }, [E0]: { row: 8, col: 0 } })
    a = X.castHeroUltimate(s, pid(s, "ashenhorn"))
    const mg = pid(s, "the-magician")
    r.surge = [U(a, mg).mana, U(a, pid(s, "the-hermit")).mana]
    ok(U(a, mg).mana >= 30 && U(a, pid(s, "the-hermit")).mana === 0, "Mana Surge: +30 to allies within 3", r.surge)
    // Mana Storm (control): 3x3 at the target: damage, burn, Slow, breaks an ultimate.
    s = board(["the-magician"], { "the-magician": { row: 4, col: 8, mana: "full" }, [E0]: { row: 4, col: 5 }, [E1]: { row: 5, col: 5 }, [E2]: { row: 4, col: 1 } })
    s = arm(s, E1)
    const mgc = pid(s, "the-magician")
    const before = [U(s, E0).mana, U(s, E1).hp]
    a = X.castHeroUltimate(s, mgc, E0)
    r.storm = { e0: [U(a, E0).hp, U(a, E0).slow, before[0], U(a, E0).mana], e1armed: !!U(a, E1).ultArmed, e2: U(a, E2).hp }
    ok(U(a, E0).hp === 36 && U(a, E0).slow > 0 && U(a, E1).hp === 36 && U(a, E2).hp === 40, "Mana Storm: 4 damage + Slow in a 3x3", r.storm)
    ok(!U(a, E1).ultArmed && (a.events || []).some((e) => e.combo === "ult-break"), "Mana Storm breaks a channeled enemy ultimate", r.storm)
  }

  Object.assign(X.CLASS_ULTS, savedClassUlts)

  // 3 Mana Link ---------------------------------------------------------------------------------
  {
    let s = board(["ashenhorn", "the-magician", "strength", "the-hermit"], {
      ashenhorn: { row: 4, col: 9, mana: 60 },
      "the-magician": { row: 4, col: 7, mana: 0 },
      strength: { row: 3, col: 9, mana: 0 },
      "the-hermit": { row: 0, col: 1, mana: 0 },
      [E0]: { row: 8, col: 0 },
    })
    const ash = pid(s, "ashenhorn")
    const mg = pid(s, "the-magician")
    const tg = X.manaLinkTargets(s, ash).map((u) => u.defId)
    ok(tg.includes("the-magician") && tg.includes("strength") && !tg.includes("the-hermit"), "Link targets: allies within 3", tg)
    ok(X.canLinkFrom(U(s, ash)) && !X.canLinkFrom(U(s, pid(s, "strength"))) && X.canLinkFrom(U(s, CMD)), "support/healer/control + the Commander can Link; a melee hero can't")
    let a = X.manaLink(s, ash, mg)
    ok(U(a, ash).mana === 60 - X.LINK_GIVE && U(a, mg).mana === X.LINK_GIVE && U(a, ash).ap === U(s, ash).ap, "Link: pay 20, ally +20, free (no AP)", [U(a, ash).mana, U(a, mg).mana])
    ok(X.manaLink(a, ash, pid(s, "strength")) === a, "once a turn")
    ok((a.events || []).some((e) => e.kind === "combo" && e.combo === "mana-link"), "Link callout")
    const next = E.endPlayerTurn(a)
    ok(!U(next, ash).linkUsed && X.manaLinkTargets(next, ash).length > 0, "usable again next turn")
    // Combo: Link fills an ally's bar -> its ultimate is ready.
    const nearly = { ...s, units: s.units.map((u) => (u.id === mg ? { ...u, mana: u.manaMax - 10 } : u)) }
    a = X.manaLink(nearly, ash, mg)
    ok(X.heroUltReady(a, U(a, mg)) && (a.events || []).some((e) => e.label === "Mana Link - FULL!"), "Link -> the ally's ULTIMATE is ready (combo)")
    // Small pools: the Rage hero receives in its own resource; a pip hero pays less.
    ok(X.linkCost({ manaMax: 5, mana: 5 }) < X.LINK_GIVE, "small pools pay a scaled cost")
  }

  // 4 Mana Wells ---------------------------------------------------------------------------------
  {
    const place = { "the-magician": { row: 4, col: 6, mana: 0, moved: true }, "the-hermit": { row: 6, col: 6, mana: 0, moved: true }, [E0]: { row: 0, col: 0 } }
    const s = board(["the-magician", "the-hermit"], place, { terrain: { "4-6": "manawell" } })
    const a = E.endPlayerTurn(s)
    const on = U(a, pid(s, "the-magician")).mana
    const plain = board(["the-magician", "the-hermit"], place)
    const off = U(E.endPlayerTurn(plain), pid(s, "the-magician")).mana
    r.wells = { on, off }
    ok(on - off === X.WELL_GAIN, "a hero starting its turn on a Mana Well gets +12", r.wells)
    const comp = board(["the-magician", "the-hermit"], place, { terrain: { "4-6": "manawell" }, relics: ["wellspring-compass"] })
    ok(U(E.endPlayerTurn(comp), pid(s, "the-magician")).mana - off === X.WELL_GAIN + 8, "Wellspring Compass: +8 more from a well")
    // Enemies on a well draw from it too (contested).
    const es = board(["the-magician"], { "the-magician": { row: 4, col: 9 }, [E0]: { row: 0, col: 0, mana: 0 } }, { terrain: { "0-0": "manawell" } })
    const esOff = board(["the-magician"], { "the-magician": { row: 4, col: 9 }, [E0]: { row: 0, col: 0, mana: 0 } })
    const eOn = U(E.previewEnemyIntents(es) && E.endPlayerTurn(es), E0).mana
    const eOff = U(E.endPlayerTurn(esOff), E0).mana
    ok(eOn > eOff, "an enemy on a well draws extra mana", [eOn, eOff])
  }

  // 5 Burn / steal vs enemy ultimates + relics ---------------------------------------------------
  {
    // Steal (Soul Debt) on a channeling enemy breaks it.
    let s = board(["hexmother"], { hexmother: { row: 4, col: 8, mana: "full" }, [E0]: { row: 4, col: 6 } })
    s = arm(s, E0)
    const hx = pid(s, "hexmother")
    const a = E.castAbility(s, hx, E0, "soul-debt")
    ok(a !== s && !U(a, E0).ultArmed, "a mana STEAL breaks a channeled ultimate")
    // Nullstone Shard: every hero hit eats the bar; breaks a channel.
    let n = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5, hp: 80, maxHp: 80 } }, { relics: ["nullstone-shard"] })
    n = { ...n, units: n.units.map((u) => (u.id === E0 ? { ...u, ult: ult(), ultCharge: 60, ultArmed: null } : u)) }
    const hit = E.attackUnit(n, pid(n, "strength"), E0)
    ok(U(hit, E0).ultCharge === 60 - 15, "Nullstone Shard: a hit drains 15 ultimate", U(hit, E0).ultCharge)
    const nArmed = arm(n, E0)
    ok(!U(E.attackUnit(nArmed, pid(n, "strength"), E0), E0).ultArmed, "Nullstone Shard: a hit breaks a channel")
    const plain = { ...n, manaRelic: M.relicManaFor([]) }
    ok(U(E.attackUnit(plain, pid(n, "strength"), E0), E0).ultCharge === 60, "without the relic a small hit doesn't touch the bar")
    // Echo Prism: 30% of the bar back after a hero ultimate; Link +10.
    const ep = board(["the-chariot", "ashenhorn", "the-magician"], { "the-chariot": { row: 4, col: 9, mana: "full" }, ashenhorn: { row: 2, col: 9, mana: 60 }, "the-magician": { row: 2, col: 8, mana: 0 }, [E0]: { row: 0, col: 0 } }, { relics: ["echo-prism"] })
    const ch = pid(ep, "the-chariot")
    const after = X.castHeroUltimate(ep, ch)
    ok(U(after, ch).mana === Math.round(U(ep, ch).manaMax * 0.3), "Echo Prism refunds 30% of the bar", U(after, ch).mana)
    const lk = X.manaLink(ep, pid(ep, "ashenhorn"), pid(ep, "the-magician"))
    ok(U(lk, pid(ep, "the-magician")).mana === X.LINK_GIVE + 10, "Echo Prism: Link gives +10 more")
    // Relics are real, offered, described.
    const pool = REL.relicPool().map((x) => x.id)
    ok(["wellspring-compass", "nullstone-shard", "echo-prism"].every((id) => REL.RELICS[id]?.mana && pool.includes(id) && REL.RELICS[id].description.length > 30), "3 new resource relics in the relic pool")
  }
  return { r, fails }
})
out.engine = engine.r
for (const f of engine.fails) out.errors.push(f)

// ---- UI ----------------------------------------------------------------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=100&squad=the-chariot,ashenhorn,the-fool,the-magician`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-the-fool-2"]').click()
  const btn = page.locator('.hwt-universal-btn[data-action="hero-ult"]')
  await btn.waitFor({ timeout: 5000 })
  const ready = await btn.getAttribute("data-ready")
  const label = await btn.innerText()
  const title = await btn.getAttribute("title")
  await page.screenshot({ path: `${SHOT_DIR}/mana_2_hero_ult_ready.png` })
  await btn.click()
  await page.waitForSelector(".hw-floating-number", { timeout: 3000 }).catch(() => {})
  const pops = await page.locator(".hw-floating-number").allInnerTexts()
  const after = await page.locator('.hwt-universal-btn[data-action="hero-ult"]').count() ? await page.locator('.hwt-universal-btn[data-action="hero-ult"]').isDisabled() : null
  out.ui = { ready, label, pops, after, title }
  if (!(ready === "true" && /Wellspring/.test(label) && /ULTIMATE ready/.test(label) && /WHOLE/.test(title))) out.errors.push("UI: hero ultimate button glows when the bar is full")
  if (!(pops.some((t) => /WELLSPRING/.test(t)) && after === true)) out.errors.push("UI: ultimate fires with a big callout, then needs a refill")
  await page.screenshot({ path: `${SHOT_DIR}/mana_2_hero_ult_fired.png` })
  // Targeted ultimate: the Controller's Mana Storm arms targeting (red targets).
  await page.locator('.hwt-token[data-unit-id="player-the-magician-3"]').click()
  const storm = page.locator('.hwt-universal-btn[data-action="hero-ult"]')
  const stormTitle = await storm.getAttribute("title")
  out.ui.stormTitle = stormTitle
  if (!/Mana Storm/.test(stormTitle)) out.errors.push("UI: control hero shows Mana Storm")
}
{
  // Mana Link: Ashenhorn links to the Controller.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=40&squad=the-chariot,ashenhorn,the-fool,the-magician`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-ashenhorn-1"]').click()
  const link = page.locator('.hwt-universal-btn[data-action="mana-link"]')
  await link.waitFor({ timeout: 5000 })
  const linkTitle = await link.getAttribute("title")
  await link.click()
  const healable = await page.locator('.hwt-cell[data-healable="true"]').count()
  await page.screenshot({ path: `${SHOT_DIR}/mana_2_link_targets.png` })
  const target = await page.locator('.hwt-cell[data-healable="true"] .hwt-token').first().getAttribute("data-unit-id")
  await page.locator('.hwt-cell[data-healable="true"]').first().click()
  await page.waitForSelector(".hw-floating-number", { timeout: 3000 }).catch(() => {})
  const pops = await page.locator(".hw-floating-number").allInnerTexts()
  const disabledAfter = await page.locator('.hwt-universal-btn[data-action="mana-link"]').isDisabled()
  out.ui.link = { linkTitle, healable, target, pops, disabledAfter }
  if (!(/free, once a turn/.test(linkTitle) && healable >= 1)) out.errors.push("UI: Mana Link highlights allies to receive")
  if (!(pops.some((t) => /Mana Link/i.test(t)) && disabledAfter)) out.errors.push("UI: Mana Link callout + once a turn")
  await page.screenshot({ path: `${SHOT_DIR}/mana_2_link_done.png` })
  // Non-support heroes don't get a Link button.
  await page.locator('.hwt-token[data-unit-id="player-the-chariot-0"]').click()
  if (await page.locator('.hwt-universal-btn[data-action="mana-link"]').count()) out.errors.push("UI: a tank has no Mana Link")
}
{
  // Mana Wells on the board: art + tooltip + legend.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?threat=2&rolls=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const wells = page.locator('.hwt-cell[data-terrain="manawell"]')
  const n = await wells.count()
  const title = n ? await wells.first().getAttribute("title") : ""
  const art = n ? await wells.first().getAttribute("style") : ""
  out.ui.wells = { n, title }
  if (!(n === 2 && /Mana Well/.test(title) && /\+12/.test(title) && /--hwt-art/.test(art))) out.errors.push("UI: Mana Well tiles with art + tooltip")
  await page.screenshot({ path: `${SHOT_DIR}/mana_2_wells.png` })
}
out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
