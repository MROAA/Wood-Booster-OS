import { chromium } from "playwright"

// Battlefield piece 3 - the living forest RULES (docs/hearthwood-battlefield-plan.md §3).
// Moss heals + is a firebreak, dry leaves flare, roots snag, runestone,
// glowcap healing spores, heavy impacts crush ground (break-down chains),
// spells strike the forest, biome dressing generator, AI, telegraph, UI.
// usage: PORT=5447 node .scratch/verify_forest_rules.mjs
const PORT = process.env.PORT || 5447
const browser = await chromium.launch()
const errs = []
const page = await browser.newContext({ viewport: { width: 1536, height: 864 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const O = await import("/src/services/heartwood/tacticsObjects.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const F = await import("/src/services/heartwood/tacticsForest.js")
  const Cv = await import("/src/services/heartwood/tacticsCover.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const C = await import("/src/data/heartwood/classes.js")
  const ART = await import("/src/components/heartwood/TerrainArt.jsx")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, classPassive: null, classSkills: [], ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
    haste: false, spiritbound: false, guardian: false, wary: false, burn: 0, chill: 0, frozen: 0, entangle: 0, ability: null,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 8, baseAttack: 8, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, wallHp: {}, objHp: {}, objFire: {}, objChill: {}, tileTimers: {}, phase: "player", turn: 1, log: [], events: [], eventSeq: 0, relicIds: [] })
  const u = (s, id) => s.units.find((x) => x.id === id)
  const idle = () => En("idle", 8, 0, { move: 0, hp: 99, maxHp: 99, attack: 0 })
  const res = {}
  const NEW = ["moss", "leaves", "roots", "branches", "gravel", "stone", "glowcap"]

  // 0. Every new piece: rule, player text, art.
  res.data = NEW.map((t) => ({ t, rule: !!T.TERRAIN[t], info: !!T.TERRAIN_INFO[t]?.text, art: !!ART.terrainArtStyle(t) }))
  res.objects = { stone: O.OBJECTS.stone?.hp, glowcap: O.OBJECTS.glowcap?.hp }

  // 1. Moss heals 1 at the end of each side's turn; full HP gets nothing.
  {
    const s = st([P("p", 4, 9, { hp: 20 }), P("full", 2, 9), En("e", 4, 2, { hp: 20, move: 0, attack: 0 }), idle()], { "4-9": "moss", "2-9": "moss", "4-2": "moss" })
    const t1 = E.endPlayerTurn(s)
    res.moss = { p: u(t1, "p").hp, full: u(t1, "full").hp, e: u(t1, "e").hp, healEvents: t1.events.filter((ev) => ev.kind === "heal").length }
  }
  // 2. Moss is damp: fire next to it doesn't spread in; grass beside does catch.
  {
    let s = st([P("p", 8, 11), idle()], { "4-5": "bush", "4-6": "moss", "4-7": "bush" })
    s = O.igniteGround(s, { row: 4, col: 5 })
    const t1 = E.endPlayerTurn(s)
    res.damp = { lit: s.terrain["4-5"], moss: t1.terrain["4-6"], warn: [...O.fireSpreadTargets(s)] }
    // direct fire DOES burn moss
    res.damp.direct = O.igniteGround(st([idle()], { "2-2": "moss" }), { row: 2, col: 2 }).terrain["2-2"]
  }
  // 3. Dry leaves FLARE across every connected leaf tile at once.
  {
    const s = st([P("p", 4, 6), En("e", 4, 7, { move: 0, attack: 0 }), idle()], { "4-5": "leaves", "4-6": "leaves", "4-7": "leaves", "3-7": "leaves", "6-6": "leaves" })
    const f = O.igniteGround(s, { row: 4, col: 5 })
    res.flare = {
      tiles: ["4-5", "4-6", "4-7", "3-7"].map((k) => f.terrain[k]),
      separate: f.terrain["6-6"],
      p: 30 - u(f, "p").hp,
      e: 30 - u(f, "e").hp,
      timer: f.tileTimers["4-6"],
      event: f.events.some((ev) => ev.kind === "object" && ev.fx === "flare" && ev.tiles.length === 4),
    }
    const after = E.endPlayerTurn(f)
    res.flare.ash = after.terrain["4-6"]
  }
  // 4. Fire spreads into roots / log / branches / stump / grass (not moss).
  {
    let s = st([P("p", 8, 11), idle()], { "4-5": "roots", "4-6": "log", "4-7": "branches", "3-6": "stump", "5-6": "bush" })
    s = O.igniteGround(s, { row: 4, col: 6 })
    const t1 = E.endPlayerTurn(s)
    res.spread = { roots: t1.terrain["4-5"], branches: t1.terrain["4-7"], stump: t1.terrain["3-6"], bush: t1.terrain["5-6"], logRevert: s.tileTimers["4-6"].revert }
  }
  // 5. Roots: cost 2 to enter, ending a move there snags (no more moving this turn).
  {
    // a wall of roots, so there is no way round
    const s = st([P("p", 4, 9, { move: 2 }), idle()], Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((row) => [`${row}-8`, "roots"])))
    const reach = E.reachableTilesFor(s, "p")
    const moved = E.moveUnit(s, "p", { row: 4, col: 8 })
    const after = E.reachableTilesFor(moved, "p")
    const next = E.endPlayerTurn(moved)
    res.roots = {
      enterable: reach.some((t) => t.row === 4 && t.col === 8),
      beyond: reach.some((t) => t.row === 4 && t.col === 7),
      root: u(moved, "p").root,
      snagEvent: moved.events.some((ev) => ev.label === "Snagged!"),
      stuck: after.length === 0,
      freeNextTurn: next.phase === "player" ? E.reachableTilesFor(next, "p").length > 0 : "phase " + next.phase,
    }
  }
  // 6. Glowcap: any hit pops it - heals every unit in the 3x3 (both sides), leaves moss.
  {
    const s = st([P("p", 4, 9, { hp: 20 }), P("q", 3, 7, { hp: 29 }), En("e", 5, 7, { hp: 10, move: 0, attack: 0 }), En("far", 4, 4, { hp: 10, move: 0, attack: 0 }), idle()], { "4-8": "glowcap" })
    const b = E.attackWall(s, "p", { row: 4, col: 8 })
    res.glowcap = { tile: b.terrain["4-8"], p: u(b, "p").hp, q: u(b, "q").hp, e: u(b, "e").hp, far: u(b, "far").hp, bloom: b.events.some((ev) => ev.fx === "bloom") }
  }
  // 7. Runestone: 10 HP, FULL cover, cracks to rubble; rubble crushes to gravel.
  {
    const s = st([P("a", 4, 9, { range: 3 }), En("e", 4, 6), idle()], { "4-7": "stone" })
    let hit = s
    const hps = []
    for (let i = 0; i < 2; i++) {
      hit = O.damageObject(hit, { row: 4, col: 7 }, 5)
      hps.push(hit.terrain["4-7"] === "stone" ? O.objectHpAt(hit, { row: 4, col: 7 }) : hit.terrain["4-7"])
    }
    res.stone = { cover: Cv.coverAgainst(s, { row: 4, col: 6 }, { row: 4, col: 9 }), hps, gravel: O.crushTiles(hit, [{ row: 4, col: 7 }]).terrain["4-7"] }
  }
  // 8. Heavy impacts: spore blast crushes; fire blast ignites burnables + cracks rocks.
  {
    const ground = { "3-6": "leaves", "3-7": "log", "3-8": "rock", "5-6": "moss", "5-8": "rubble" }
    const spore = E.attackWall(st([P("a", 4, 10, { range: 3 }), idle()], { "4-7": "sporepod", ...ground }), "a", { row: 4, col: 7 })
    const boom = E.attackWall(st([P("a", 4, 10, { range: 3 }), idle()], { "4-7": "barrel", ...ground }), "a", { row: 4, col: 7 })
    res.impact = {
      spore: ["3-6", "3-7", "3-8", "5-6", "5-8"].map((k) => spore.terrain[k] || "path"),
      sporeUnderPool: spore.tileTimers["3-7"]?.revert,
      boom: ["3-6", "3-7", "3-8", "5-6", "5-8"].map((k) => boom.terrain[k] || "path"),
      boomLeafRevert: boom.tileTimers["3-6"]?.revert,
    }
  }
  // 9. A rolling boulder flattens what it rolls over.
  {
    const s = st([P("p", 4, 9), En("e", 4, 3, { move: 0, attack: 0 }), idle()], { "4-8": "boulder", "4-7": "bush", "4-6": "leaves", "4-5": "rock" })
    const b = E.attackWall(s, "p", { row: 4, col: 8 })
    res.roll = { at: Object.entries(b.terrain).find(([, t]) => t === "boulder")?.[0], tiles: ["4-7", "4-6", "4-5"].map((k) => b.terrain[k] || "path") }
  }
  // 10. Spells strike the forest (direct + through the real cast path).
  {
    const terr = { "4-5": "tree", "3-6": "leaves", "5-5": "water", "4-7": "stone", "5-6": "log" }
    const quake = O.forestSpellStrike(st([P("p", 4, 6), idle()], terr), "earthshatter", { row: 4, col: 6 }, { row: 4, col: 6 }, 1)
    const meteor = O.forestSpellStrike(st([P("p", 8, 11), idle()], terr), "meteor-barrage", { row: 4, col: 6 }, { row: 8, col: 11 }, 1)
    const frost = O.forestSpellStrike(st([P("p", 8, 11), idle()], terr), "frozen-ground", { row: 4, col: 6 }, { row: 8, col: 11 }, 1)
    res.spell = {
      quakeTree: quake.terrain["4-5"], quakeStoneHp: O.objectHpAt(quake, { row: 4, col: 7 }), quakeLog: quake.terrain["5-6"], quakeLeaves: quake.terrain["3-6"] || "path",
      meteorLeaves: meteor.terrain["3-6"], meteorTreeBurning: meteor.terrain["4-5"] === "tree" ? O.isBurning(meteor, { row: 4, col: 5 }) : meteor.terrain["4-5"],
      frostWater: frost.terrain["5-5"],
      unknownNoop: (() => { const s0 = st([idle()], terr); return O.forestSpellStrike(s0, "no-such-spell", { row: 4, col: 6 }) === s0 })(),
    }
    // real cast: a Warden's Thorn Boundary (self, radius 2) chips the tree 2 tiles away
    const thorn = C.CLASSES.warden.skills.find((x) => x.id === "thorn-boundary")
    const w = P("w", 4, 7, { classId: "warden", classSkills: [{ ...thorn, classId: "warden" }], classCds: {} })
    const cs = st([w, En("e", 2, 7, { move: 0, attack: 0 }), idle()], { "4-5": "tree" })
    const cast = E.castAbility(cs, "w", null, "thorn-boundary")
    res.spell.realCast = { changed: cast !== cs, treeHp: O.objectHpAt(cast, { row: 4, col: 5 }) }
  }
  // 10b. Saboteur's charge: one blow = one break-down step (wall -> rubble,
  //      NOT straight on to gravel); a log beside it splinters to branches.
  {
    const s0 = { ...st([P("p", 8, 11), En("e", 0, 0, { move: 0, attack: 0, hp: 99, maxHp: 99 }), idle()], { "4-6": "wall", "5-6": "log", "3-5": "rubble" }), classCharges: [{ row: 4, col: 5, ownerId: "p", damage: 4 }] }
    const t1 = E.endPlayerTurn(s0)
    res.charge = { wall: t1.terrain["4-6"], log: t1.terrain["5-6"] || "path", rubble: t1.terrain["3-5"] || "path" }
  }
  // 11. Generator: biome dressing on open middle tiles, deterministic, crossable, base kept.
  {
    let found = new Set()
    let bad = 0
    let nonDet = 0
    let cut = 0
    let baseChanged = 0
    let total = 0
    for (let seed = 1; seed <= 60; seed++) {
      for (const idx of [0, 5, 12, 30]) {
        const t = RM.generateRealTerrain(seed * 7919, idx)
        const b = RM.generateBaseTerrain(seed * 7919, idx)
        total++
        for (const [key, type] of Object.entries(t)) {
          if (!b[key] && NEW.includes(type)) {
            found.add(type)
            const col = Number(key.split("-")[1])
            if (col < 3 || col > E.GRID.cols - 4) bad++
          }
        }
        for (const [key, type] of Object.entries(b)) if (t[key] !== type) baseChanged++
        if (!T.sidesConnected(t, E.GRID)) cut++
        if (seed <= 6 && JSON.stringify(t) !== JSON.stringify(RM.generateRealTerrain(seed * 7919, idx))) nonDet++
      }
    }
    res.gen = { found: [...found].sort(), bad, nonDet, cut, baseChanged, total }
  }
  // 12. AI: roots and leaves beside fire are bad places to stop.
  {
    const s = st([idle()], { "4-5": "roots", "4-6": "leaves", "4-7": "fire" })
    res.ai = { roots: O.aiObjectTilePenalty(s, { row: 4, col: 5 }), leavesByFire: O.aiObjectTilePenalty(s, { row: 4, col: 6 }), has: O.hasObjects(st([idle()], { "1-1": "roots" })) }
  }
  return res
})

const checks = []
const ok = (name, pass, info = "") => checks.push({ name, pass: !!pass, info })
ok("every new forest piece has a rule, player text and art", r.data.every((d) => d.rule && d.info && d.art), JSON.stringify(r.data.filter((d) => !(d.rule && d.info && d.art))))
ok("runestone 10 HP, glowcap 1 HP", r.objects.stone === 10 && r.objects.glowcap === 1)
ok("moss heals 1 at turn end (both sides), not above max", r.moss.p === 21 && r.moss.full === 30 && r.moss.e === 21, JSON.stringify(r.moss))
ok("moss is a firebreak, but direct fire burns it", r.damp.lit === "fire" && r.damp.moss === "moss" && r.damp.direct === "fire" && !r.damp.warn.includes("4-6"), JSON.stringify(r.damp))
ok("dry leaves flare across the connected clump only, 2 dmg each, 1 turn, then ash", r.flare.tiles.every((t) => t === "fire") && r.flare.separate === "leaves" && r.flare.p === 2 && r.flare.e === 2 && r.flare.timer?.turns === 1 && r.flare.event && r.flare.ash === "ash", JSON.stringify(r.flare))
ok("fire spreads into roots, branches, stumps and grass; a burning log becomes ash", r.spread.roots === "fire" && r.spread.branches === "fire" && r.spread.stump === "fire" && r.spread.bush === "fire" && r.spread.logRevert === "ash", JSON.stringify(r.spread))
ok("roots cost 2, snag on arrival, free again next turn", r.roots.enterable && !r.roots.beyond && r.roots.root === 1 && r.roots.snagEvent && r.roots.stuck && r.roots.freeNextTurn === true, JSON.stringify(r.roots))
ok("glowcap pops: +4 to everyone in the 3x3 (capped), far units untouched, moss left", r.glowcap.tile === "moss" && r.glowcap.p === 24 && r.glowcap.q === 30 && r.glowcap.e === 14 && r.glowcap.far === 10 && r.glowcap.bloom, JSON.stringify(r.glowcap))
ok("runestone: FULL cover, 10 -> 5 -> rubble -> gravel", r.stone.cover === 2 && r.stone.hps[0] === 5 && r.stone.hps[1] === "rubble" && r.stone.gravel === "gravel", JSON.stringify(r.stone))
ok("spore blast crushes: leaves->ground, log->branches (under its poison pool), rock->rubble, moss->ground, rubble->gravel", JSON.stringify(r.impact.spore) === JSON.stringify(["path", "poison", "rubble", "path", "gravel"]) && r.impact.sporeUnderPool === "branches", JSON.stringify(r.impact))
ok("fire blast: leaves + log + moss catch fire, rocks crack, rubble -> gravel", r.impact.boom[0] === "fire" && r.impact.boom[1] === "fire" && r.impact.boom[2] === "rubble" && r.impact.boom[3] === "fire" && r.impact.boom[4] === "gravel" && r.impact.boomLeafRevert === "ash", JSON.stringify(r.impact))
ok("a rolling boulder flattens grass and leaves, cracks rocks", r.roll.at === "4-4" && JSON.stringify(r.roll.tiles) === JSON.stringify(["path", "path", "rubble"]), JSON.stringify(r.roll))
ok("earthshatter fells the tree, cracks the stone, splinters the log, scatters leaves", r.spell.quakeTree === "stump" && r.spell.quakeStoneHp === 4 && r.spell.quakeLog === "branches" && r.spell.quakeLeaves === "path", JSON.stringify(r.spell))
ok("meteor barrage fells the tree and burns the ground (leaves, stump); frozen ground freezes water; unknown spell = no-op", r.spell.meteorLeaves === "fire" && r.spell.meteorTreeBurning === "fire" && r.spell.frostWater === "ice" && r.spell.unknownNoop, JSON.stringify(r.spell))
ok("explosive charge: wall -> rubble (one step), log -> branches, old rubble -> gravel", r.charge.wall === "rubble" && r.charge.log === "branches" && r.charge.rubble === "gravel", JSON.stringify(r.charge))
ok("a real Warden Thorn Boundary cast chips a tree 2 tiles away (6 -> 4)", r.spell.realCast.changed && r.spell.realCast.treeHp === 4, JSON.stringify(r.spell.realCast))
ok("generator scatters all 5 forest pieces from the biome", ["glowcap", "leaves", "moss", "roots", "stone"].every((t) => r.gen.found.includes(t)), JSON.stringify(r.gen.found))
ok("forest pieces stay in the middle columns, maps stay crossable + deterministic, base layout untouched", r.gen.bad === 0 && r.gen.cut === 0 && r.gen.nonDet === 0 && r.gen.baseChanged === 0, JSON.stringify(r.gen))
ok("AI avoids stopping in roots and in dry leaves beside fire", r.ai.roots === 4 && r.ai.leavesByFire >= 12 && r.ai.has, JSON.stringify(r.ai))

// UI: a real run fight shows the forest pieces with art, tooltip and legend.
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload()
await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(1500)
const ui = await page.evaluate(() => {
  const cells = [...document.querySelectorAll(".hwt-cell[data-terrain]")]
  const pick = (t) => cells.find((c) => c.dataset.terrain === t)
  const kinds = ["moss", "leaves", "roots", "stone", "glowcap"]
  return {
    present: kinds.filter((t) => pick(t)),
    art: kinds.filter((t) => pick(t) && pick(t).dataset.art === t),
    sprites: ["stone", "glowcap"].filter((t) => pick(t)?.querySelector(`[data-art-object="${t}"]`)),
    titles: kinds.filter((t) => pick(t)?.title?.length > 20),
    legend: [...document.querySelectorAll(".hwt-terrain-legend-item")].map((x) => x.dataset.kind),
  }
})
ok("real fight: forest pieces appear with their art and tooltips", ui.present.length >= 3 && ui.art.length === ui.present.length && ui.titles.length === ui.present.length, JSON.stringify(ui))
ok("real fight: object sprites render (runestone / glowcap present ones)", ui.sprites.length === ui.present.filter((t) => t === "stone" || t === "glowcap").length, JSON.stringify(ui))
ok("terrain legend lists the forest pieces on the field", ui.present.every((t) => ui.legend.includes(t)), JSON.stringify(ui.legend))
await page.locator(".hwt-board").screenshot({ path: ".scratch/shots/forest_rules_board.png" })
ok("0 page errors", errs.length === 0, errs.join(" | "))
await browser.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
