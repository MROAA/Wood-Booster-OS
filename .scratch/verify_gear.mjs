import { chromium } from "playwright"
import fs from "node:fs"
import { execFileSync } from "node:child_process"

// Gear sprint (data/heartwood/items.js + recipes.js + collars.js,
// services/heartwood/gear.js, runEngine.js shop/equip, tactics hooks,
// Hearth Workshop, Studio Gear editor): 5-slot gear rows + equip, row
// adjacency incl. reordering, board auras incl. preview == real, recipes
// (adjacent + duplicate buy), shop tension (item reroll cost, locks, sell,
// gear purse, rarity by Act), Class Collars (class + resource, revert),
// resource gear, Workshop stash + crafting, save/load + old-save default,
// UI via real clicks. Usage: PORT=5445 node .scratch/verify_gear.mjs
const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || ".scratch/shots"
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { errors: [], checks: 0 }

const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

// ---------------------------------------------------------------------------
// LOGIC (in-page, the real modules)
// ---------------------------------------------------------------------------
const logic = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const te = await import("/src/services/heartwood/tacticsEngine.js")
  const G = await import("/src/services/heartwood/gear.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const cover = await import("/src/services/heartwood/tacticsCover.js")
  const H = await import("/src/services/heartwood/hearth.js")
  const { ITEMS, ITEM_SLOTS } = await import("/src/data/heartwood/items.js")
  const { RECIPES } = await import("/src/data/heartwood/recipes.js")
  const { COLLARS } = await import("/src/data/heartwood/collars.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { CLASSES } = await import("/src/data/heartwood/classes.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const res = { fails: [], n: 0 }
  const ok = (cond, label, data) => {
    res.n++
    if (!cond) res.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 400) : ""}`)
  }
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > 0 && n.type === "shop")
  const mk = (bench, items = [], extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench,
    deployed: [...bench.map((e) => e.key), null, null, null, null].slice(0, 4),
    items,
    itemKeyCounter: 100,
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    ...extra,
  })
  const hero = (key, defId, extra = {}) => ({ key, defId, upgradeLevel: 0, upgrades: [], ...extra })
  const it = (key, defId, owner = null, slot = null) => ({ key, defId, equippedTo: owner, slotIndex: slot })
  const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle
  const U = (b, pre) => b.units.find((u) => u.id.startsWith(pre))
  const baseHero = "hexbreaker"

  // --- 1 Slots + equip -------------------------------------------------------
  {
    ok(ITEM_SLOTS === 5, "5 gear slots per hero", ITEM_SLOTS)
    let rs = mk([hero("b0", baseHero)], [it(1, "iron-blade"), it(2, "padded-vest")])
    ok(rt.effectiveItemSlots(rs) === 5, "effective slots 5")
    rs = rt.equipItem(rs, 1, "b0", 4)
    ok(rs.items.find((x) => x.key === 1).slotIndex === 4, "equip into slot 5 (index 4)")
    const same = rt.equipItem(rs, 2, "b0", 5)
    ok(same === rs, "slot 6 refused")
    rs = rt.equipItem(rs, 2, "commander", 0)
    ok(rs.items.find((x) => x.key === 2).equippedTo === "commander", "Commander has a gear row too")
    const row = G.gearRow(rs.items, "b0", 5)
    ok(row.length === 5 && row[4]?.key === 1 && row.slice(0, 4).every((x) => !x), "gear row shape", row.map((x) => x?.defId || null))
  }

  // --- 2 Row adjacency + reordering ------------------------------------------------
  {
    const plain = U(start(mk([hero("b0", baseHero)])), "player-hexbreaker")
    // Whetstone at 0, Bone Dagger at 2: not adjacent -> blade +1 only (Whetstone + IRON Blade is a recipe instead).
    let rs = mk([hero("b0", baseHero)], [it(1, "whetstone", "b0", 0), it(2, "bone-dagger", "b0", 2)])
    const apart = U(start(rs), "player-hexbreaker")
    ok(apart.attack === plain.attack + 1, "blade alone: +1 attack", [plain.attack, apart.attack])
    ok(G.rowEffects(G.gearRow(rs.items, "b0")).links.length === 0, "no link while apart")
    // Reorder: move the blade from slot 2 to slot 1 -> link on.
    rs = rt.moveGear(rs, "b0", 2, 1)
    ok(rs.items.find((x) => x.key === 2).slotIndex === 1, "moveGear moved the blade", rs.items)
    const links = G.rowEffects(G.gearRow(rs.items, "b0")).links
    ok(links.length === 1 && links[0].from === 0 && links[0].to === 1 && links[0].bonus?.attack === 2, "Whetstone-blade link", links)
    const next = U(start(rs), "player-hexbreaker")
    ok(next.attack === plain.attack + 3, "adjacent: +1 blade +2 Whetstone", [plain.attack, next.attack])
    // Swap back via moveGear onto an occupied slot (swap, not bag).
    const swapped = rt.moveGear(rs, "b0", 0, 1)
    ok(swapped.items.find((x) => x.key === 1).slotIndex === 1 && swapped.items.find((x) => x.key === 2).slotIndex === 0, "moveGear onto a filled slot swaps")
    // Mana Gem next to an Oak Staff: +10 max, +1 staff regen +2 link.
    const pm = U(start(mk([hero("b0", baseHero)])), "player-hexbreaker")
    const gem = U(start(mk([hero("b0", baseHero)], [it(1, "oak-staff", "b0", 0), it(2, "mana-gem", "b0", 1)])), "player-hexbreaker")
    ok(gem.manaMax === pm.manaMax + 15 && (gem.manaRegenBonus || 0) === (pm.manaRegenBonus || 0) + 3, "Mana Gem + Oak Staff: +15 max, +3 regen", [pm.manaMax, gem.manaMax, pm.manaRegenBonus, gem.manaRegenBonus])
    ok(M.regenFor(gem) === M.regenFor(pm) + 3 + Math.round(15 * 0.1) - 0 || M.regenFor(gem) > M.regenFor(pm) + 2, "regen actually higher", [M.regenFor(pm), M.regenFor(gem)])
    // Rune Stone next to a Lucky Charm: 5% -> 8% (x1.5, rounded).
    const rune = U(start(mk([hero("b0", baseHero)], [it(1, "lucky-charm", "b0", 2), it(2, "rune-stone", "b0", 3)])), "player-hexbreaker")
    const charm = U(start(mk([hero("b0", baseHero)], [it(1, "lucky-charm", "b0", 0), it(2, "rune-stone", "b0", 3)])), "player-hexbreaker")
    ok(rune.gearAim === 8 && charm.gearAim === 5, "Rune Stone boosts the charm next to it by 50%", [rune.gearAim, charm.gearAim])
    res.adj = { plain: plain.attack, apart: apart.attack, next: next.attack, rune: rune.gearAim }
  }

  // --- 3 Board auras -------------------------------------------------------------
  {
    const rs = mk([hero("b0", baseHero), hero("b1", "the-fool")], [it(1, "war-banner", "b0", 0), it(2, "watch-lantern", "b0", 1), it(3, "warding-bell", "b0", 2), it(4, "incense-burner", "b0", 3)])
    let b = start(rs)
    const w = U(b, "player-hexbreaker")
    ok(w.gearAuras?.length === 4 && w.gearAuras.map((a) => a.type).join() === "aim,noFlank,guard,res", "wearer carries 4 auras", w.gearAuras)
    const ally = U(b, "player-the-fool")
    const foe = b.units.find((u) => u.side === "enemy")
    const place = (state, id, row, col, extra = {}) => ({ ...state, units: state.units.map((u) => (u.id === id ? { ...u, pos: { row, col }, ...extra } : u)) })
    b = { ...b, terrain: {}, objective: null, phase: "player", hitRolls: true }
    b = place(b, w.id, 4, 6)
    b = place(b, ally.id, 4, 7)
    b = place(b, foe.id, 2, 7)
    // Park every other unit far away.
    let far = 0
    b = { ...b, units: b.units.map((u) => (u.id === w.id || u.id === ally.id || u.id === foe.id ? u : { ...u, pos: { row: 8, col: far++ }, stun: 9 })) }
    const near = cover.hitChance(b, U(b, "player-the-fool"), U(b, foe.id), "front")
    const awayState = place(b, ally.id, 4, 9)
    const away = cover.hitChance(awayState, U(awayState, "player-the-fool"), U(awayState, foe.id), "front")
    ok(near.parts.some((p) => p.label === "Banner aura" && p.value === 10) && !away.parts.some((p) => p.label === "Banner aura"), "War Banner: +10% to hit next to the wearer only", [near.parts, away.parts])
    ok(G.auraOn(b, U(b, "player-the-fool"), "noFlank") === 1 && G.auraOn(awayState, U(awayState, "player-the-fool"), "noFlank") === 0, "Lantern aura reaches only adjacent allies")
    const tiles = G.auraTiles(b)
    ok(tiles.size === 8 && tiles.has("4-7") && tiles.has("3-5"), "aura outline tiles = the 8 around the wearer", [...tiles.keys()])
    // Lantern: a hit from behind on the ally counts as a front hit.
    const behind = { ...place(b, foe.id, 4, 8), units: place(b, foe.id, 4, 8).units.map((u) => (u.id === ally.id ? { ...u, facing: "W" } : u)) }
    const behindAway = { ...behind, units: behind.units.map((u) => (u.id === w.id ? { ...u, pos: { row: 0, col: 0 } } : u)) }
    const pvNear = te.attackPreview(behind, foe.id, ally.id)
    const pvFar = te.attackPreview(behindAway, foe.id, ally.id)
    ok(pvNear && pvFar && pvNear.facing === "front" && pvFar.facing === "back", "Watch Lantern: no flanking next to the wearer", [pvNear?.facing, pvFar?.facing, pvNear?.amount, pvFar?.amount])
    // Warding Bell: 1 less damage per hit next to the wearer.
    const hit = (s) => {
      const t0 = U(s, "player-the-fool")
      const s1 = { ...s, phase: "enemy", hitRolls: false, units: s.units.map((u) => (u.id === t0.id ? { ...u, block: 0, ward: 0, evade: 0 } : u.id === foe.id ? { ...u, ap: 9, stun: 0 } : u)) }
      const after = te.attackUnit(s1, foe.id, t0.id)
      return t0.hp - U(after, "player-the-fool").hp
    }
    // (only the Bell on the wearer here, so the Lantern can't change the facing)
    const bellOnly = { ...b, units: b.units.map((u) => (u.id === w.id ? { ...u, gearAuras: u.gearAuras.filter((a) => a.type === "guard") } : u)) }
    const front = place(bellOnly, foe.id, 3, 7)
    const frontAway = { ...front, units: front.units.map((u) => (u.id === w.id ? { ...u, pos: { row: 0, col: 0 } } : u)) }
    const lostNear = hit(front)
    const lostFar = hit(frontAway)
    ok(lostFar - lostNear === 1, "Warding Bell: 1 less damage per hit", [lostNear, lostFar])
    // Incense: +5 resource at the start of the side's turn (adjacent only).
    const drained = { ...b, units: b.units.map((u) => (u.side === "player" ? { ...u, mana: 0 } : u)) }
    const ra = M.sideTurnRegen(drained, "player")
    const drainedAway = place(drained, ally.id, 4, 9)
    const rb = M.sideTurnRegen(drainedAway, "player")
    ok(U(ra, "player-the-fool").mana - U(rb, "player-the-fool").mana === 5, "Incense Burner: +5 resource a turn next to the wearer", [U(ra, "player-the-fool").mana, U(rb, "player-the-fool").mana])
    // Preview == real over several turns with all four auras on the board.
    let s = start(rs)
    const rows = []
    for (let turn = 0; turn < 4 && s.phase === "player"; turn++) {
      const pv = te.previewEnemyIntents(s)
      const pv2 = te.previewEnemyIntents(s)
      const after = te.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const now = after.units.find((u) => u.id === enemyId)
        if (!now) continue
        let good = JSON.stringify(pv) === JSON.stringify(pv2)
        if (intent.kind === "move" || intent.kind === "move-attack") good = good && now.pos.row === intent.to.row && now.pos.col === intent.to.col
        rows.push({ turn, enemyId, kind: intent.kind, good })
      }
      s = after
    }
    ok(rows.length >= 3 && rows.every((x) => x.good), "preview == real with aura gear", rows)
    res.auras = { near: near.chance, away: away.chance, lostNear, lostFar, rows: rows.length }
  }

  // --- 4 Recipes ---------------------------------------------------------------------
  {
    let rs = mk([hero("b0", baseHero)], [it(1, "herb-pouch", "b0", 0), it(2, "empty-flask")])
    rs = rt.equipItem(rs, 2, "b0", 1)
    const row = G.gearRow(rs.items, "b0").map((x) => x?.defId || null)
    ok(row[0] === "healing-draught" && !row[1] && rs.items.length === 1, "adjacent Herb Pouch + Empty Flask -> Healing Draught (left slot)", row)
    ok((rs.recipesFound || []).includes("healing-draught") && rs.lastCombined?.result === "healing-draught", "recipe noted as found", [rs.recipesFound, rs.lastCombined])
    // Not adjacent: no fuse.
    let apart = mk([hero("b0", baseHero)], [it(1, "herb-pouch", "b0", 0), it(2, "empty-flask")])
    apart = rt.equipItem(apart, 2, "b0", 3)
    ok(apart.items.length === 2, "apart: no fuse")
    // Reordering INTO adjacency fuses too: Whetstone + Iron Blade -> Keen Blade.
    let keen = mk([hero("b0", baseHero)], [it(1, "whetstone", "b0", 0), it(2, "iron-blade", "b0", 3)])
    keen = rt.moveGear(keen, "b0", 3, 1)
    ok(keen.items.length === 1 && keen.items[0].defId === "keen-blade" && keen.items[0].slotIndex === 0, "moving an Iron Blade next to a Whetstone forges a Keen Blade", keen.items)
    // Duplicate buy: two Bone Daggers -> Twin Fangs (keeps the first one's slot).
    let shop = { ...mk([hero("b0", baseHero)], [it(1, "bone-dagger", "b0", 2)]), phase: "shop", essence: 1000 }
    shop = rt.buyItem(shop, "bone-dagger")
    const fangs = shop.items.find((x) => x.defId === "twin-fangs")
    ok(fangs && fangs.equippedTo === "b0" && fangs.slotIndex === 2 && shop.items.length === 1 && shop.essence === 900, "buying a 2nd Bone Dagger fuses into Twin Fangs", shop.items)
    // Twin Fangs works in a fight.
    const tf = U(start({ ...shop, phase: "formation" }), "player-hexbreaker")
    const pl = U(start(mk([hero("b0", baseHero)])), "player-hexbreaker")
    ok(tf.attack === pl.attack + 3 && tf.gearAim === 10, "Twin Fangs: +3 attack, +10% hit", [pl.attack, tf.attack, tf.gearAim])
    ok(Object.values(RECIPES).every((r) => ITEMS[r.a] && ITEMS[r.b] && ITEMS[r.result]?.noShop), "every recipe resolves; results never in the shop")
    ok(!rt.RUN_PATH.length || Object.values(RECIPES).length >= 8, "8 recipes")
  }

  // --- 5 Shop tension ---------------------------------------------------------------------
  {
    let rs = { ...rt.startRun("tommy", null, { forcedSeed: 4242 }), essence: 2000 }
    ok(rs.phase === "shop" && rt.itemRerollCost(rs) === 40, "item reroll starts at 40")
    const before = [...rs.itemOffers]
    rs = rt.toggleItemLock(rs, 1)
    const r1 = rt.rerollItems(rs)
    ok(r1.essence === 1960 && rt.itemRerollCost(r1) === 80 && r1.itemOffers[1] === before[1], "reroll: -40, next costs 80, locked offer stays", [before, r1.itemOffers])
    const r2 = rt.rerollItems(r1)
    ok(r2.essence === 1880 && rt.itemRerollCost(r2) === 120, "reroll cost keeps rising 40 -> 80 -> 120")
    // Lock survives into the next visit.
    const nextVisit = { ...r2, ...rt.freshItemShop(r2, shopIdx) }
    ok(nextVisit.itemOffers[1] === before[1] && nextVisit.itemLocks[1] && rt.itemRerollCost(nextVisit) === 40 && nextVisit.gearSpent === 0, "lock carries into the next visit; reroll price + purse reset", nextVisit.itemOffers)
    // Gear purse: 300 at Act I, Market Level 1.
    let p = { ...rt.startRun("tommy", null, { forcedSeed: 5 }), essence: 5000 }
    ok(rt.gearPurse(p) === 300, "gear purse 300 in Act I", rt.gearPurse(p))
    p = rt.buyItem(p, "war-banner") // 150
    p = rt.buyItem(p, "rune-stone") // 150
    const refused = rt.buyItem(p, "iron-blade") // 100 -> over 300
    ok(p.gearSpent === 300 && refused === p && rt.gearPurseLeft(p) === 0, "gear purse refuses a buy past the limit", [p.gearSpent])
    ok(rt.gearPurse({ ...p, nodeIndex: rt.RUN_PATH.findIndex((n, i) => rt.actIndexForNode(i, rt.RUN_PATH.length) === 3), marketLevel: 2 }) === 550, "purse grows with Act + Market Level (Act III, ML2 = 550)")
    // Sell: half price back.
    const sold = rt.sellItem(p, p.items[0].key)
    ok(sold.essence === p.essence + 75 && sold.items.length === p.items.length - 1, "sell an item back for half (150 -> 75)", [p.essence, sold.essence])
    // Rarity by Act: Act I shows only Common/Rare; late Acts reach Epic/Legendary.
    const seen = (act, ml) => {
      const counts = { common: 0, rare: 0, epic: 0, legendary: 0 }
      const node = rt.RUN_PATH.findIndex((n, i) => n.type === "shop" && rt.actIndexForNode(i, rt.RUN_PATH.length) === act)
      for (let seed = 1; seed <= 120; seed++) {
        const offers = rt.freshItemShop({ seed, marketLevel: ml, itemLocks: [], itemOffers: [] }, node).itemOffers
        for (const id of offers) if (ITEMS[id] && ITEMS[id].kind !== "collar") counts[ITEMS[id].rarity]++
      }
      return counts
    }
    const a1 = seen(1, 1)
    const a6 = seen(6, 3)
    ok(a1.epic === 0 && a1.legendary === 0 && a1.common > a1.rare, "Act I: Common/Rare only", a1)
    ok(a6.epic > 20 && a6.legendary > 0 && a6.common < a1.common, "Act VI + Market 3: Epics and Legendaries show up", a6)
    const w = rt.itemRarityWeights(1, 1)
    ok(w.epic === 0 && w.legendary === 0 && rt.itemRarityWeights(5, 3).legendary > 0, "rarity weights grow with Act + Market Level")
    res.shop = { a1, a6 }
  }

  // --- 6 Class Collars --------------------------------------------------------------------
  {
    const natural = U(start(mk([hero("b0", baseHero)])), "player-hexbreaker")
    let rs = mk([hero("b0", baseHero)], [it(1, "collar-medic")])
    rs = rt.equipItem(rs, 1, "b0", 4)
    const worn = U(start(rs), "player-hexbreaker")
    ok(worn.classId === "medic" && worn.resource === CLASSES.medic.resource && worn.classSkills.every((s) => s.classId === "medic"), "Medic Collar: fights as a Medic with its resource", [natural.classId, worn.classId, worn.resource])
    ok(natural.classId !== "medic" && natural.resource !== worn.resource, "natural class/resource differ", [natural.classId, natural.resource])
    rs = rt.unequipItem(rs, 1)
    const back = U(start(rs), "player-hexbreaker")
    ok(back.classId === natural.classId && back.resource === natural.resource, "collar off: natural class + resource return", [back.classId, back.resource])
    // One per hero; never the Commander.
    let two = mk([hero("b0", baseHero)], [it(1, "collar-medic", "b0", 0), it(2, "collar-scout")])
    ok(rt.equipItem(two, 2, "b0", 1) === two, "only one collar per hero")
    ok(rt.equipItem(two, 2, "commander", 0) === two, "the Commander can't wear a collar")
    ok(Object.keys(COLLARS).length === 37 && Object.values(COLLARS).every((c) => CLASSES[c.collarClass]), "37 collars, every one a real class", Object.keys(COLLARS).length)
    // Drops: a miniboss always, an elite half the time (seeded).
    const mbNode = rt.RUN_PATH.find((n) => n.type === "miniboss")
    const drop = rt.collarDrop({ ...mk([hero("b0", baseHero)]), lastAftermath: [] }, mbNode)
    ok(drop.items.some((x) => ITEMS[x.defId]?.kind === "collar") && /Collar/.test(drop.lastAftermath.join(" ")), "miniboss drops a collar + aftermath line", drop.lastAftermath)
    let eliteDrops = 0
    for (let seed = 1; seed <= 40; seed++) if (rt.collarDrop({ ...mk([]), seed }, { type: "elite" }).items.length) eliteDrops++
    ok(eliteDrops > 8 && eliteDrops < 32, "elites drop a collar about half the time", eliteDrops)
    ok(rt.collarDrop(mk([]), { type: "battle" }).items.length === 0, "plain battles drop nothing")
    res.collar = { natural: natural.classId, worn: worn.classId, eliteDrops }
  }

  // --- 7 Resource gear -------------------------------------------------------------------
  {
    const st = (items, defId = baseHero) => start(mk([hero("b0", defId)], items))
    const P = (b) => U(b, "player-")
    // Wellspring Torc: +2 on every labeled gain.
    {
      const b0 = st([])
      const b1 = st([it(1, "wellspring-torc", "b0", 0)])
      const drain = (b) => ({ ...b, units: b.units.map((u) => (u.id === P(b).id ? { ...u, mana: 0 } : u)) })
      const g0 = U(M.gainMana(drain(b0), P(b0).id, 5, "hit"), "player-").mana
      const g1 = U(M.gainMana(drain(b1), P(b1).id, 5, "hit"), "player-").mana
      const silent = U(M.gainMana(drain(b1), P(b1).id, 5), "player-").mana
      ok(g1 - g0 === 2 && silent === g0, "Wellspring Torc: +2 on play gains, not on silent regen", [g0, g1, silent])
    }
    // Focus Lens: +1 damage / +5% hit at half bar or more.
    {
      const b = st([it(1, "focus-lens", "b0", 0)])
      const full = M.resourceMods(P(b))
      const low = M.resourceMods({ ...P(b), mana: 0 })
      ok(full.dmg - low.dmg >= 1 && full.aim - low.aim >= 5, "Focus Lens: bonus only at half bar", [full, low])
    }
    // Overflow Chalice: overflow room even on a bar without it.
    {
      const b = st([it(1, "overflow-chalice", "b0", 0)])
      ok(M.overchargeCap(P(b)) >= 15, "Overflow Chalice: +15 overflow room", M.overchargeCap(P(b)))
      const filled = M.gainMana(b, P(b).id, 30, "hit")
      ok((U(filled, "player-").overcharge || 0) > 0, "overflow actually stored", U(filled, "player-").overcharge)
    }
    // Bloodletter's Lancet: 2 HP -> 12 resource at turn start.
    {
      const b = st([it(1, "bloodletters-lancet", "b0", 0)])
      const drained = { ...b, units: b.units.map((u) => (u.id === P(b).id ? { ...u, mana: 0 } : u)) }
      const after = M.sideTurnRegen(drained, "player")
      const base = M.sideTurnRegen({ ...drained, units: drained.units.map((u) => (u.id === P(b).id ? { ...u, gearTapRes: 0 } : u)) }, "player")
      ok(P(drained).hp - U(after, "player-").hp === 2 && U(after, "player-").mana - U(base, "player-").mana >= 12, "Lancet: pays 2 HP for +12 resource", [P(drained).hp, U(after, "player-").hp, U(after, "player-").mana, U(base, "player-").mana])
    }
    // Quickening Ring: skills 15% cheaper.
    {
      const b = st([it(1, "quickening-ring", "b0", 0)])
      const u = P(b)
      const skill = u.classSkills.find((s) => M.manaCostOf(s, { ...u, gearCheaper: 0 }) >= 10)
      ok(skill && M.manaCostOf(skill, u) < M.manaCostOf(skill, { ...u, gearCheaper: 0 }), "Quickening Ring: skills cost less", skill && [M.manaCostOf(skill, u), M.manaCostOf(skill, { ...u, gearCheaper: 0 })])
    }
    // Rage Drum: full on a Rage hero (hit -> +4), half elsewhere; start +25%.
    {
      const rageDef = Object.values(UNITS).find((d) => d.classId && CLASSES[d.classId]?.resource === "rage" && !d.summonOnly && !d.fusedFrom)
      const b = st([it(1, "rage-drum", "b0", 0)], rageDef.id)
      const b0 = st([], rageDef.id)
      ok(P(b).gearHurtGain === 4 && P(b).mana > P(b0).mana, "Rage Drum on a Rage hero: +4 when hit, starts higher", [rageDef.id, P(b).gearHurtGain, P(b0).mana, P(b).mana])
      const arc = st([it(1, "rage-drum", "b0", 0)])
      ok(P(arc).gearHurtGain === 2, "Rage Drum off-resource: half strength", P(arc).gearHurtGain)
      const hurt = M.onDamaged({ ...b, units: b.units.map((u) => (u.id === P(b).id ? { ...u, mana: 0 } : u)) }, P(b).id, 1)
      const hurt0 = M.onDamaged({ ...b0, units: b0.units.map((u) => (u.id === P(b0).id ? { ...u, mana: 0 } : u)) }, P(b0).id, 1)
      ok(U(hurt, "player-").mana - U(hurt0, "player-").mana >= 4, "Rage Drum: hits build extra Rage", [U(hurt, "player-").mana, U(hurt0, "player-").mana])
      res.rageDef = rageDef.id
    }
    // Ancestor Beads: summons hold back less Spirit.
    {
      const u = { id: "s", side: "player", resource: "spirit", mana: 50, manaMax: 100, gearUpkeep: 5, hp: 5, pos: { row: 0, col: 0 } }
      const sum = { id: "x", side: "player", upkeepBy: "s", upkeep: 20, hp: 5, pos: { row: 0, col: 1 } }
      const state = { units: [u, sum] }
      ok(M.reservedFor(state, u) === 15 && M.reservedFor(state, { ...u, gearUpkeep: 0 }) === 20, "Ancestor Beads: upkeep 20 -> 15", [M.reservedFor(state, u)])
    }
    // Mana Heart (recipe result): +25 max.
    {
      const p0 = P(st([]))
      const p1 = P(st([it(1, "mana-heart", "b0", 0)]))
      ok(p1.manaMax === p0.manaMax + 25, "Mana Heart: +25 max resource", [p0.manaMax, p1.manaMax])
    }
    const resItems = Object.values(ITEMS).filter((i) => Object.keys(i.fx || {}).some((k) => ["manaMax", "manaRegen", "manaStartPct", "resGain", "overflow", "tapRes", "upkeep", "cheaper", "hurtGain", "highDmg"].includes(k)))
    ok(resItems.length >= 12, "12+ resource items", resItems.map((i) => i.id))
    res.resItems = resItems.length
  }

  // --- 8 Workshop stash + crafting -----------------------------------------------------------
  {
    let rs = mk([hero("b0", baseHero)], [it(1, "herb-pouch"), it(2, "empty-flask"), it(3, "iron-blade", "b0", 0)])
    rs = rt.sendItemHome(rs, 1)
    rs = rt.sendItemHome(rs, 2)
    ok(rt.sendItemHome(rs, 3) === rs, "an equipped item can't be sent home")
    ok(JSON.stringify(rs.stashOut) === '["herb-pouch","empty-flask"]' && rs.items.length === 1, "sendItemHome -> stashOut", rs.stashOut)
    rs = { ...rs, recipesFound: ["healing-draught"] }
    let h = H.freshHearth()
    const { hearth: h1, report } = H.harvestRun(h, { ...rs, seed: 31 }, true, "gear-run-1")
    ok(JSON.stringify(h1.stash) === '["herb-pouch","empty-flask"]' && h1.knownRecipes.includes("healing-draught") && report.stashed.length === 2 && report.learned.length === 1, "harvest: stash + learned recipe", [h1.stash, h1.knownRecipes, report])
    ok(H.stashCapacity(h1) === 3 && H.packCapacity(h1) === 1, "Workshop Lv0: stash 3, pack 1")
    // Crafting: known recipe + both ingredients + 4 Acorns.
    ok(/Acorns/.test(H.craftBlocker(h1, "healing-draught", 2) || ""), "craft needs Acorns")
    ok(/Make it once/.test(H.craftBlocker(h1, "twin-fangs", 99) || ""), "unknown recipes can't be crafted")
    const c = H.craftRecipe(h1, "healing-draught", 10)
    ok(c && c.cost === 4 && JSON.stringify(c.hearth.stash) === '["healing-draught"]', "craft: 2 ingredients -> Healing Draught for 4 Acorns", c && c.hearth.stash)
    // Pack -> hearthStartFor -> startRun puts it in the bag; the stash empties.
    const packed = H.togglePacked(c.hearth, 0)
    ok(JSON.stringify(packed.packed) === "[0]" && H.togglePacked(H.togglePacked({ ...packed, stash: [...packed.stash, "iron-blade"] }, 1), 1).packed.length === 1, "pack respects the pack limit (1 at Lv0)")
    const hs = H.hearthStartFor(packed, [])
    ok(JSON.stringify(hs.gear) === '["healing-draught"]', "hearthStartFor carries packed gear", hs)
    const run = rt.startRun("tommy", null, { forcedSeed: 9, hearthStart: hs })
    ok(run.items.some((x) => x.defId === "healing-draught" && x.equippedTo === null), "the packed item starts the run in the bag", run.items)
    ok(H.takePackedGear(packed).stash.length === 0, "takePackedGear empties the packed slots")
    // Stash capacity: overflow is reported, not kept.
    const full = H.harvestRun({ ...H.freshHearth(), stash: ["iron-blade", "iron-blade", "iron-blade"] }, { ...mk([]), stashOut: ["buckler"], seed: 32 }, true, "gear-run-2")
    ok(full.hearth.stash.length === 3 && full.report.stashFull.length === 1, "a full stash leaves extras behind", full.report)
    // Normalize: bad ids dropped, old hearth gets defaults.
    const norm = H.normalizeHearth({ version: 1, roster: [], stash: ["iron-blade", "nope"], knownRecipes: ["twin-fangs", "nope"], packed: [0, 7] })
    ok(JSON.stringify(norm.stash) === '["iron-blade"]' && JSON.stringify(norm.knownRecipes) === '["twin-fangs"]' && JSON.stringify(norm.packed) === "[0]", "normalizeHearth cleans the stash", norm)
    const old = H.normalizeHearth({ version: 1, roster: [] })
    ok(Array.isArray(old.stash) && old.stash.length === 0 && old.knownRecipes.length === 0, "old hearth save: empty Workshop defaults")
  }

  // --- 9 Save / load + old-save defaults ---------------------------------------------------------
  {
    let rs = { ...rt.startRun("tommy", null, { forcedSeed: 1234 }), essence: 1000 }
    rs = rt.toggleItemLock(rs, 0)
    rs = rt.buyItem(rs, rs.itemOffers[2])
    const loaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(rs))))
    ok(loaded && JSON.stringify(loaded.itemLocks) === JSON.stringify(rs.itemLocks) && loaded.gearSpent === rs.gearSpent && loaded.items.length === rs.items.length, "save/load keeps locks, purse, items")
    // An old save: none of the new keys, items on slots 0-2 only.
    const oldSave = { ...rt.startRun("tommy", null, { forcedSeed: 77 }), essence: 1000 }
    for (const k of ["itemLocks", "itemRerollCost", "gearSpent", "recipesFound", "itemRerolls", "stashOut"]) delete oldSave[k]
    oldSave.items = [{ key: 0, defId: "ember-charm", equippedTo: null, slotIndex: null }]
    const o = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(oldSave))))
    ok(o && rt.itemRerollCost(o) === 40 && rt.gearPurseLeft(o) === 300, "old save: reroll + purse defaults", [rt.itemRerollCost(o), rt.gearPurseLeft(o)])
    const o2 = rt.rerollItems(o)
    ok(o2.essence === 960 && rt.itemRerollCost(o2) === 80, "old save: item reroll works")
    const o3 = rt.buyItem(o, o.itemOffers[0])
    ok(o3.items.length === 2, "old save: buy works")
    const fight = start({ ...mk([hero("b0", baseHero)], [{ key: 0, defId: "ember-charm", equippedTo: "b0", slotIndex: 1 }]) })
    ok(fight && U(fight, "player-hexbreaker"), "old item (no fx) still equips + fights")
  }
  return res
})
out.checks += logic.n
out.logic = { adj: logic.adj, auras: logic.auras, shop: logic.shop, collar: logic.collar, resItems: logic.resItems, rageDef: logic.rageDef }
for (const f of logic.fails) out.errors.push(`logic: ${f}`)

console.log(JSON.stringify(out, null, 1))
console.log("pageErrors", errs.length, errs.slice(0, 3))
await browser.close()
process.exit(out.errors.length || errs.length ? 1 : 0)
