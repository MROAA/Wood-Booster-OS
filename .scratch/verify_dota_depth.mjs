import fs from "node:fs"

// Dota depth sprint (data/heartwood/itemBuilds.js, services/heartwood/
// itemForge.js + tacticsItems.js, gear.js fx riders, runEngine forge /
// build / charges, betweenFights camp craft, engine hooks): item tiers +
// recipes (forge at market / camp), build paths + shop highlighting,
// layered unlocks, every active (AP / mana / cooldown / uses), every enemy
// counter kit answered by its counter item, the QA hook, preview == real
// with actives, then a few UI checks with screenshots.
//
// Usage:  PORT=5451 node .scratch/verify_dota_depth.mjs          (logic + UI)
//         LOGIC_ONLY=1 node --import <asset-stub> .scratch/verify_dota_depth.mjs   (pure node, no browser)
const PORT = process.env.PORT || 5451
const SHOTS = process.env.SHOTS || ".scratch/shots"

// ---------------------------------------------------------------------------
// LOGIC - self-contained (runs in node, or in the page via page.evaluate).
// ---------------------------------------------------------------------------
async function logic(base) {
  const rt = await import(base + "/src/services/heartwood/runEngine.js")
  const te = await import(base + "/src/services/heartwood/tacticsEngine.js")
  const F = await import(base + "/src/services/heartwood/itemForge.js")
  const I = await import(base + "/src/services/heartwood/tacticsItems.js")
  const BF = await import(base + "/src/services/heartwood/betweenFights.js")
  const chaos = await import(base + "/src/services/heartwood/tacticsChaos.js")
  const cls = await import(base + "/src/services/heartwood/tacticsClasses.js")
  const { ITEMS } = await import(base + "/src/data/heartwood/items.js")
  const { CLASSES } = await import(base + "/src/data/heartwood/classes.js")
  const B = await import(base + "/src/data/heartwood/itemBuilds.js")
  const { buildRunTacticsBattle } = await import(base + "/src/services/heartwood/tacticsRealMatchup.js")
  const res = { fails: [], n: 0, notes: {} }
  const ok = (cond, label, data) => {
    res.n++
    if (!cond) res.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 500) : ""}`)
  }
  const actNode = (act) => rt.RUN_PATH.findIndex((n, i) => n.type === "battle" && n.formationId && rt.actIndexForNode(i, rt.RUN_PATH.length) === act)
  const hero = (key, defId, extra = {}) => ({ key, defId, upgradeLevel: 0, upgrades: [], ...extra })
  const it = (key, defId, owner = null, slot = null, extra = {}) => ({ key, defId, equippedTo: owner, slotIndex: slot, ...extra })
  const mk = (bench, items = [], act = 2, extra = {}) => {
    const idx = actNode(act)
    return {
      ...rt.startRun("tommy", null, { forcedSeed: 777 }),
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench,
      deployed: [...bench.map((e) => e.key), null, null, null, null].slice(0, 4),
      items,
      itemKeyCounter: 100,
      essence: 1000,
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
      ...extra,
    }
  }
  const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle
  const U = (b, pre) => b.units.find((u) => u.id.startsWith(pre))
  const place = (s, id, row, col, extra = {}) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, pos: { row, col }, ...extra } : u)) })
  const patch = (s, id, extra) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...extra } : u)) })
  // A clean test board: flat, no objective/rolls, everyone parked far away.
  const clean = (b) => {
    let far = 0
    return { ...b, terrain: {}, objective: null, phase: "player", noGraze: true, wallHp: {}, objHp: {}, units: b.units.map((u) => ({ ...u, pos: { row: 8, col: far++ }, ...(u.side === "enemy" ? { stun: 0 } : {}) })) }
  }
  const foes = (b) => b.units.filter((u) => u.side === "enemy")

  // --- A. The tree ----------------------------------------------------------
  {
    const recipes = F.allRecipes()
    ok(recipes.length === Object.keys(B.BUILD_RECIPES).length + 8, "A1 all recipes = 14 build + 8 legacy", recipes.length)
    const bad = Object.values(B.BUILD_RECIPES).filter((r) => !ITEMS[r.result] || r.parts.some((p) => !ITEMS[p]) || F.buildTierOf(r.result) <= Math.max(...r.parts.map(F.buildTierOf)))
    ok(!bad.length, "A2 every build recipe climbs a tier (parts < result)", bad.map((r) => r.id))
    const tiers = [1, 2, 3].map((t) => Object.values(ITEMS).filter((i) => i.buildTier === t).length)
    ok(tiers[0] >= 15 && tiers[1] >= 15 && tiers[2] === 5, "A3 tree: components / crafted / masterworks", tiers)
    ok(F.buildsInto("wind-seed").map((r) => r.result).sort().join() === "foxfire-charm,gale-bough", "A4 Wind Seed builds into Foxfire Charm + Gale Bough", F.buildsInto("wind-seed").map((r) => r.result))
    ok(F.madeFrom("heartoak-aegis")?.parts.join() === "ironbark-guard,unbinding-bell" && F.madeFrom("heartoak-aegis").cost === 100, "A5 Heartoak Aegis = Ironbark Guard + Unbinding Bell + 100")
    ok(F.componentsOf("heartoak-aegis").sort().join() === "buckler,buckler,padded-vest,unbinding-charm", "A6 full shopping list of a masterwork", F.componentsOf("heartoak-aegis"))
    const all38 = Object.keys(CLASSES).every((c) => {
      const n = F.buildPathsFor({ bench: [hero("x", "hexbreaker", { classId: c })], items: [] }, "x").length
      return n >= 2 && n <= 3
    })
    ok(all38 && Object.keys(CLASSES).length === 38, "A7 every one of the 38 classes gets 2-3 build paths")
    ok(F.buildPathsFor({ bench: [], items: [] }, "commander").map((p) => p.id).join() === "bulwark,wellspring,galewalker", "A8 the Commander has its own 3 paths")
    const pathItems = Object.values(B.BUILD_PATHS).flatMap((p) => p.items)
    ok(pathItems.every((id) => ITEMS[id]), "A9 every build path item exists")
  }

  // --- B. Forging ----------------------------------------------------------------
  {
    const a1 = mk([hero("b0", "hexbreaker")], [it(1, "wind-seed"), it(2, "lucky-charm"), it(3, "bone-dagger"), it(4, "bone-dagger")], 1)
    ok(rt.forgeItem(a1, "foxfire-charm") === a1 && /Act 2/.test(F.forgeBlocker(a1, "foxfire-charm", 1)), "B1 Act I: a crafted recipe is locked", F.forgeBlocker(a1, "foxfire-charm", 1))
    const legacy = rt.forgeItem(a1, "twin-fangs")
    ok(legacy.items.some((x) => x.defId === "twin-fangs") && !legacy.items.some((x) => x.defId === "bone-dagger") && legacy.essence === a1.essence, "B2 Act I: an old two-part recipe forges from the bag for free")
    const a2 = mk([hero("b0", "hexbreaker")], [it(1, "wind-seed"), it(2, "lucky-charm", "b0", 3)], 2)
    const f = rt.forgeItem(a2, "foxfire-charm")
    const made = f.items.find((x) => x.defId === "foxfire-charm")
    ok(made && f.items.length === 1 && f.essence === a2.essence - 50 && made.equippedTo === "b0" && made.slotIndex === 3 && f.recipesFound.includes("foxfire-charm"), "B3 Act II: forge uses both parts, pays 50, lands in the worn part's slot", { items: f.items, ess: f.essence })
    ok(rt.forgeItem({ ...a2, essence: 10 }, "foxfire-charm").items.length === 2, "B4 can't forge without the recipe cost")
    const missing = mk([hero("b0", "hexbreaker")], [it(1, "wind-seed")], 2)
    ok(rt.forgeItem(missing, "foxfire-charm") === missing && /Lucky Charm/.test(F.forgeBlocker(missing, "foxfire-charm", 2)), "B5 a missing part blocks (and says which)")
    const big = mk([hero("b0", "hexbreaker")], [it(1, "ironbark-guard"), it(2, "unbinding-bell")], 2)
    ok(rt.forgeItem(big, "heartoak-aegis") === big, "B6 Act II: masterworks are still locked")
    const big3 = rt.forgeItem({ ...big, ...mk([hero("b0", "hexbreaker")], big.items, 3) }, "heartoak-aegis")
    ok(big3.items.some((x) => x.defId === "heartoak-aegis"), "B7 Act III: Heartoak Aegis forged")
    // Camp craft: the tiered recipes are craftable at a camp too.
    let camp = BF.enterCampState({ ...a2, phase: "camp" })
    const opts = BF.campCraftOptions(camp, 2).map((r) => r.id)
    ok(opts.includes("foxfire-charm"), "B8 camp Craft lists a tiered recipe", opts)
    const crafted = rt.campCraft(camp, "foxfire-charm")
    ok(crafted.items.some((x) => x.defId === "foxfire-charm") && crafted.essence === camp.essence - 50 && BF.campActionsLeft(crafted) === BF.campActionsLeft(camp) - 1, "B9 camp Craft forges it and uses an action")
  }

  // --- C. Build paths + shop highlighting -------------------------------------------
  {
    let rs = mk([hero("b0", "hexbreaker"), hero("b1", "bulwark-of-ages")], [], 2)
    const paths = F.buildPathsFor(rs, "b0").map((p) => p.id)
    ok(paths.length >= 2, "C1 a hero has 2-3 build paths", paths)
    const pick = paths.find((p) => p === "galewalker") || paths[0]
    rs = rt.chooseHeroBuild(rs, "b0", pick)
    ok(rs.heroBuilds.b0 === pick && F.chosenBuildId(rs, "b0") === pick, "C2 choose a build path")
    ok(rt.chooseHeroBuild(rs, "b0", "nope") === rs, "C3 a path outside the class is refused")
    const want = F.wantedComponents(rs)
    const goalComps = new Set(B.BUILD_PATHS[pick].items.flatMap((i) => F.componentsOf(i)))
    ok(want.size > 0 && [...want.keys()].every((id) => goalComps.has(id)) && [...want.values()][0][0].ownerKey === "b0", "C4 the shop highlights exactly the chosen path's components", [...want.keys()])
    const someComp = [...want.keys()][0]
    const need = F.componentsOf(B.BUILD_PATHS[pick].items[0]).filter((c) => c === someComp).length
    const owned = { ...rs, items: Array.from({ length: 6 }, (_, i) => it(500 + i, someComp)) }
    ok(!F.wantedComponents(owned).has(someComp) && need >= 1, "C5 owning enough copies stops the highlight", someComp)
    ok(F.chooseBuild(rs, "b0", pick).heroBuilds.b0 === undefined, "C6 clicking the chosen path again clears it")
  }

  // --- D. Layered unlocks ----------------------------------------------------------
  {
    const offersAt = (act) => {
      const seen = new Set()
      for (let seed = 1; seed <= 120; seed++) {
        const rs = { ...mk([hero("b0", "hexbreaker")], [], act), seed, itemLocks: [] }
        for (const id of rt.freshItemShop(rs, actNode(act)).itemOffers) if (id) seen.add(id)
      }
      return seen
    }
    const lateComps = ["owl-feather", "wither-thorn", "reaping-sickle", "spellbreak-thorn"]
    const s1 = offersAt(1)
    const s2 = offersAt(2)
    ok(!lateComps.some((id) => s1.has(id)), "D1 Act I shop never stocks the Act II components", lateComps.filter((id) => s1.has(id)))
    ok(lateComps.some((id) => s2.has(id)), "D2 Act II shop stocks them", lateComps.filter((id) => s2.has(id)))
    ok(["glowdust-pouch", "sapling-salve", "moonwell-flask", "unbinding-charm", "bark-wedge"].some((id) => s1.has(id)), "D3 Act I shop has components + a few actives")
    ok(![...s1, ...s2].some((id) => ITEMS[id]?.buildTier >= 2 && B.BUILD_RECIPES[id]), "D4 crafted / masterwork items are never sold")
    ok(F.counterKitFor("bark-brute", 1)?.id === "ironbark" && !F.counterKitFor("mist-growler", 1) && F.counterKitFor("mist-growler", 2)?.id === "mist" && !F.counterKitFor("rune-warden", 2) && F.counterKitFor("rune-warden", 3)?.id === "runeshell", "D5 enemy kits open act by act")
    const read = F.counterReadFor(["rune-warden", "brood-mother", "bark-brute"], 3)
    ok(read.kits.length === 3 && F.bringText(read.bring) === "Bring: mana burn, dispel, area damage, armour shred", "D6 'Bring:' line for a fight", F.bringText(read.bring))
  }

  // --- E. Actives -------------------------------------------------------------------
  const actives = {}
  {
    const rs = mk([hero("b0", "hexbreaker"), hero("b1", "the-fool")], [
      it(1, "foxfire-charm", "b0", 0), it(2, "gale-bough", "b0", 1), it(3, "sapdrinker", "b0", 2), it(4, "whirlwind-seedstaff", "b0", 3), it(5, "heartoak-aegis", "b0", 4),
      it(6, "sapling-salve", "b1", 0), it(7, "moonwell-flask", "b1", 1), it(8, "glowdust-pouch", "b1", 2), it(9, "unbinding-charm", "b1", 3),
    ], 3)
    let b = clean(start(rs))
    const h = U(b, "player-hexbreaker")
    const f = U(b, "player-the-fool")
    ok(I.itemActivesOf(h).map((a) => a.id).join() === "foxfire-step,gale-push,mana-burn,cyclone-lift,heartoak-bark" && I.itemActivesOf(f).map((a) => a.id).join() === "salve,moonwell,glowdust,unbind", "E0 worn active items become action-bar entries", [I.itemActivesOf(h).map((a) => a.id), I.itemActivesOf(f).map((a) => a.id)])
    const [e1, e2] = foes(b)
    b = place(b, h.id, 4, 6, { mana: 100, manaMax: Math.max(100, h.manaMax || 0), ap: 2 })
    b = place(b, f.id, 4, 7, { mana: 0, ap: 2, hp: 10 })
    b = place(b, e1.id, 4, 4)
    b = place(b, e2.id, 2, 2)
    // Foxfire Step (blink)
    {
      const tiles = I.itemActiveTargets(b, h.id, "foxfire-step")
      ok(tiles.length > 10 && tiles.every((p) => Math.max(Math.abs(p.row - 4), Math.abs(p.col - 6)) <= 4), "E1 Foxfire Step: free tiles within 4", tiles.length)
      const s = I.castItemActive(b, h.id, "foxfire-step", "0-6")
      const u = U(s, h.id)
      ok(u.pos.row === 0 && u.pos.col === 6 && u.ap === 1 && u.mana === U(b, h.id).mana - I.activeManaCost(b, U(b, h.id), B.ITEM_ACTIVES["foxfire-step"]) && u.itemActives[0].cd === 3, "E2 blink moves 4 tiles, costs 1 AP + mana, recharge 3", { pos: u.pos, ap: u.ap, mana: u.mana, cd: u.itemActives[0].cd })
      ok(/Recharging/.test(I.itemActiveBlocker(s, u, "foxfire-step")) && I.castItemActive(s, h.id, "foxfire-step", "1-6") === s, "E3 recharging -> refused")
      ok(I.castItemActive(patch(b, h.id, { root: 1 }), h.id, "foxfire-step", "0-6").units.find((x) => x.id === h.id).pos.row === 4, "E4 rooted -> can't blink")
      ok(/AP/.test(I.itemActiveBlocker(b, { ...U(b, h.id), ap: 0 }, "foxfire-step")), "E5 no AP -> refused")
      ok(/Needs \d+/.test(I.itemActiveBlocker(b, { ...U(b, h.id), mana: 0 }, "foxfire-step")), "E6 no mana -> refused")
      // Cooldown ticks on the player's turn coming back.
      const back = te.endPlayerTurn(s)
      ok(back.phase !== "player" || U(back, h.id).itemActives[0].cd === 2, "E7 recharge counts down each turn", U(back, h.id)?.itemActives?.[0])
      actives.foxfire = true
    }
    // Gale Push (force)
    {
      const s = I.castItemActive(b, h.id, "gale-push", e1.id)
      const pos = U(s, e1.id).pos
      ok(pos.row === 4 && pos.col === 2 && U(s, h.id).itemActives[1].cd === 3, "E8 Gale Push throws a foe 2 tiles straight away", pos)
      const ally = I.castItemActive(b, h.id, "gale-push", f.id)
      ok(U(ally, f.id).pos.col === 9, "E9 ...or an ally out of danger", U(ally, f.id).pos)
    }
    // Sap Burn (mana burn)
    {
      const t0 = patch(b, e1.id, { mana: 30, ultCharge: 40, shell: 8, shellMax: 8, kit: "runeshell" })
      const s = I.castItemActive(t0, h.id, "mana-burn", e1.id)
      const e = U(s, e1.id)
      ok(e.mana < 30 && e.ultCharge === 15 && e.shell === 0 && e.shellBroken >= 1 && e.hp < U(t0, e1.id).hp, "E10 Sap Burn drains mana + ultimate, breaks the shell, hurts", { mana: e.mana, ult: e.ultCharge, shell: e.shell, hp: [U(t0, e1.id).hp, e.hp] })
    }
    // Cyclone Lift (lift)
    {
      const s = I.castItemActive(b, h.id, "cyclone-lift", e1.id)
      const e = U(s, e1.id)
      ok(e.lifted === 1 && e.stun >= 1, "E11 Cyclone Lift: lifted + loses its next turn")
      ok(!te.attackableTargets(place(s, f.id, 4, 5), f.id).some((u) => u.id === e1.id), "E12 a lifted foe can't be targeted")
      const hit = te.applyDamageWithBlock(s, e1.id, 10)
      ok(U(hit.next, e1.id).hp === e.hp, "E13 ...or hurt")
      const pv = te.previewEnemyIntents(s).find((x) => x.enemyId === e1.id)
      ok(pv?.intent.kind === "stunned", "E14 the telegraph shows it skipping its turn", pv)
      const after = te.endPlayerTurn(s)
      ok(after.phase !== "player" || (!(U(after, e1.id).lifted > 0) && U(after, e1.id).pos.col === 4), "E15 it did nothing and lands next turn", U(after, e1.id))
      ok(I.itemActiveTargets(patch(b, e1.id, { phases: [{}] }), h.id, "cyclone-lift").every((u) => u.id !== e1.id), "E16 bosses can't be lifted")
    }
    // Heartoak Bark (control immunity)
    {
      const rooted = patch(b, h.id, { root: 2, slow: 1, stun: 1 })
      const s = I.castItemActive(rooted, h.id, "heartoak-bark")
      const u = U(s, h.id)
      ok(u.root === 0 && u.slow === 0 && u.stun === 0 && u.ctrlImmune === 2 && u.ap === 2, "E17 Heartoak Bark (free) clears control, 2 turns immune", { root: u.root, imm: u.ctrlImmune, ap: u.ap })
      const hexed = I.scrubControl(patch(s, h.id, { root: 2, chill: 1 }))
      ok(U(hexed, h.id).root === 0 && U(hexed, h.id).chill === 0, "E18 control landing later is shed")
      ok(cls.immovable(u), "E19 ...and it can't be shoved")
      const shoved = chaos.knockback(s, e1.id, h.id, { row: 0, col: 1 }, 1)
      ok(U(shoved, h.id).pos.col === 6, "E20 knockback: stands firm")
    }
    // Salve (charges)
    {
      let s = I.castItemActive(b, f.id, "salve", f.id)
      ok(U(s, f.id).hp === 18 && U(s, f.id).ap === 1 && U(s, f.id).itemActives[0].charges === 2, "E21 Salve heals 8, 1 AP, 3 -> 2 uses")
      s = patch(s, f.id, { ap: 5 })
      s = I.castItemActive(s, f.id, "salve", f.id)
      s = I.castItemActive(s, f.id, "salve", h.id)
      ok(U(s, f.id).itemActives[0].charges === 0 && /Used up/.test(I.itemActiveBlocker(s, U(s, f.id), "salve")), "E22 out of uses -> refused")
      ok(I.chargesUsedIn(s)[6] === 3, "E23 spent uses are tracked for the run", I.chargesUsedIn(s))
      actives.salveState = s
    }
    // Moonwell Sip (free, once a turn)
    {
      const s = I.castItemActive(b, f.id, "moonwell")
      ok(U(s, f.id).mana > 0 && U(s, f.id).ap === 2, "E24 Moonwell Sip: free +mana", U(s, f.id).mana)
      ok(I.castItemActive(s, f.id, "moonwell") === s, "E25 once a turn")
    }
    // Glowdust (reveal) + Unbind (dispel)
    {
      const hid = patch(b, e1.id, { shroud: true, kit: "shroud" })
      const s = I.castItemActive(hid, f.id, "glowdust")
      ok(U(s, e1.id).revealed === 2 && U(s, f.id).itemActives[2].charges === 1, "E26 Glowdust reveals a hidden foe for 2 turns")
      b = patch(b, f.id, { mana: 50 })
      const shelled = patch(b, e1.id, { shell: 8, shellMax: 8, kit: "runeshell", ward: 1, regen: 3 })
      const d = I.castItemActive(shelled, f.id, "unbind", e1.id)
      ok(U(d, e1.id).shell === 0 && U(d, e1.id).shellBroken === 2 && U(d, e1.id).ward === 0 && U(d, e1.id).regen === 0, "E27 Unbind strips shell / Ward / Regen", U(d, e1.id))
      const ally = I.castItemActive(patch(b, h.id, { root: 2, weak: 2 }), f.id, "unbind", h.id)
      ok(U(ally, h.id).root === 0 && U(ally, h.id).weak === 0, "E28 Unbind frees an ally")
    }
    // Uses carry back to the run after the fight.
    {
      const won = { ...actives.salveState, phase: "won" }
      const after = rt.recordFightAftermath({ ...rs, phase: "battle" }, won)
      ok(!after.items.some((x) => x.key === 6), "E29 a Salve with no uses left is gone after the fight")
      const once = I.castItemActive(b, f.id, "glowdust")
      const after2 = rt.recordFightAftermath({ ...rs, phase: "battle" }, { ...once, phase: "won" })
      ok(after2.items.find((x) => x.key === 8)?.charges === 1, "E30 a half-used Glowdust keeps 1 use")
      const rb = start({ ...rs, items: after2.items })
      ok(U(rb, "player-the-fool").itemActives.find((a) => a.id === "glowdust").charges === 1, "E31 ...and brings 1 use into the next fight")
    }
    // Worldseed Scepter (class upgrade)
    {
      const plain = U(start(mk([hero("b0", "hexbreaker")], [], 3)), "player-hexbreaker")
      const sc = U(start(mk([hero("b0", "hexbreaker")], [it(1, "worldseed-scepter", "b0", 0)], 3)), "player-hexbreaker")
      const a = plain.ability
      const s2 = sc.ability
      ok(sc.scepter && s2.scepter && s2.cooldown === Math.max(0, a.cooldown - 1) && (typeof a.multiplier !== "number" || s2.multiplier > a.multiplier) && (sc.gearCheaper || 0) >= 20, "E32 Worldseed Scepter upgrades the signature skill", { a, s2, cheap: sc.gearCheaper })
      ok(!sc.classSkills?.length || sc.classSkills[0].cooldown <= plain.classSkills[0].cooldown, "E33 ...and the first class skill recharges sooner")
    }
  }

  // --- F. Counter kits vs their counter items ---------------------------------------
  {
    const base = (items = [], act = 3) => {
      const rs = mk([hero("b0", "bulwark-of-ages")], items, act)
      let b = clean(start(rs))
      const h = U(b, "player-bulwark")
      const [e1, e2] = foes(b)
      b = place(b, h.id, 4, 6, { ap: 2 })
      b = place(b, e1.id, 4, 5, { block: 0, ward: 0, bulwark: 0, evade: 0, revive: 0 })
      if (e2) b = place(b, e2.id, 3, 5, { block: 0, ward: 0, bulwark: 0, evade: 0, revive: 0 })
      return { b, h, e1, e2 }
    }
    const dmg = (b0, b1, id) => U(b0, id).hp - U(b1, id).hp
    // Ironbark vs Bark Wedge (shred)
    {
      const p = base()
      const armoured = patch(p.b, p.e1.id, { kit: "ironbark", armor: 2 })
      const plain = dmg(p.b, te.attackUnit(p.b, p.h.id, p.e1.id), p.e1.id)
      const vsArmour = dmg(armoured, te.attackUnit(armoured, p.h.id, p.e1.id), p.e1.id)
      ok(plain - vsArmour === 2, "F1 Ironbark: every hit 2 smaller", [plain, vsArmour])
      const q = base([it(1, "bark-wedge", "b0", 0)])
      const a2 = patch(q.b, q.e1.id, { kit: "ironbark", armor: 2 })
      const hit = te.attackUnit(a2, q.h.id, q.e1.id)
      ok(U(hit, q.e1.id).armor === 1, "F2 Bark Wedge strips 1 armour per hit", U(hit, q.e1.id).armor)
    }
    // Mist Veil vs Owl Feather / area / skills
    {
      const p = base()
      const misty = patch(p.b, p.e1.id, { kit: "mist", blurCharges: 2 })
      const miss = te.attackUnit(misty, p.h.id, p.e1.id)
      ok(U(miss, p.e1.id).hp === U(misty, p.e1.id).hp && U(miss, p.e1.id).blurCharges === 1 && U(miss, p.h.id).ap === 1, "F3 Mist Veil: the basic attack misses (AP spent)")
      const q = base([it(1, "owl-feather", "b0", 0)])
      const m2 = patch(q.b, q.e1.id, { kit: "mist", blurCharges: 2 })
      ok(U(te.attackUnit(m2, q.h.id, q.e1.id), q.e1.id).hp < U(m2, q.e1.id).hp, "F4 Owl Feather (true strike) cuts through")
      const r = base([it(1, "reaping-sickle", "b0", 0)])
      const m3 = patch(r.b, r.e2.id, { kit: "mist", blurCharges: 2 })
      const cl = te.attackUnit(m3, r.h.id, r.e1.id)
      ok(U(cl, r.e2.id).hp < U(m3, r.e2.id).hp && U(cl, r.e1.id).hp < U(m3, r.e1.id).hp, "F5 Reaping Sickle cleave hits the misty neighbour too (area)")
      const refill = I.itemPlayerTurnStart({ ...miss, phase: "player" })
      ok(U(refill, p.e1.id).blurCharges === B.COUNTER_KITS.mist.dodges, "F6 the Mist refills every turn")
    }
    // Mossbloom vs Wither Thorn (healing cut)
    {
      const p = base()
      let s = patch(p.b, p.e2.id, { kit: "bloom" })
      s = patch(s, p.e1.id, { hp: U(s, p.e1.id).maxHp - 10 })
      const healed = I.itemEnemyPhaseStart(s)
      ok(U(healed, p.e1.id).hp === U(s, p.e1.id).hp + B.COUNTER_KITS.bloom.heal, "F7 Mossbloom heals a wounded neighbour each enemy turn")
      const q = base([it(1, "wither-thorn", "b0", 0)])
      let w = patch(q.b, q.e2.id, { kit: "bloom" })
      w = patch(w, q.e1.id, { hp: U(w, q.e1.id).maxHp - 10 })
      w = te.attackUnit(w, q.h.id, q.e1.id)
      ok(U(w, q.e1.id).withered === 2, "F8 Wither Thorn hit Withers it")
      const noHeal = I.itemEnemyPhaseStart(w)
      ok(U(noHeal, q.e1.id).hp === U(w, q.e1.id).hp, "F9 a Withered foe can't be healed")
      const regen = te.endPlayerTurn(patch(w, q.e1.id, { regen: 3 }))
      ok(regen.phase === "lost" || U(regen, q.e1.id)?.hp <= U(w, q.e1.id).hp, "F10 ...not even by Regen")
    }
    // Seedcaller vs area
    {
      const p = base()
      let s = patch(p.b, p.e1.id, { kit: "seed" })
      s = { ...s, turn: 2 }
      const sprouted = I.itemEnemyPhaseStart(s)
      const seeds = sprouted.units.filter((u) => u.seedOf === p.e1.id)
      ok(seeds.length === 1 && seeds[0].name === "Seedling" && seeds[0].hp === seeds[0].maxHp, "F11 Seedcaller calls a (half-HP) Seedling on an even enemy turn", seeds.map((x) => x.id))
      ok(I.itemEnemyPhaseStart({ ...s, turn: 3 }).units.length === s.units.length, "F12 ...not on odd turns")
      let capped = sprouted
      for (const t of [4, 6, 8]) capped = I.itemEnemyPhaseStart({ ...capped, turn: t })
      ok(capped.units.filter((u) => u.seedOf === p.e1.id && u.hp > 0).length === 2, "F13 at most 2 Seedlings alive")
      const q = base([it(1, "reaping-sickle", "b0", 0)])
      let g = { ...patch(q.b, q.e1.id, { kit: "seed" }), turn: 2 }
      g = I.itemEnemyPhaseStart(g)
      const seed = g.units.find((u) => u.seedOf === q.e1.id)
      g = place(g, seed.id, 5, 5)
      const cut = te.attackUnit(g, q.h.id, q.e1.id)
      ok(U(cut, seed.id).hp < seed.hp, "F14 Reaping Sickle cleave cuts the Seedling next to its caller")
    }
    // Runeshell vs Spellbreak Thorn (mana burn) / Unbind (dispel)
    {
      const p = base()
      const sh = patch(p.b, p.e1.id, { kit: "runeshell", shell: 8, shellMax: 8 })
      const hit = te.applyDamageWithBlock(sh, p.e1.id, 5)
      ok(U(hit.next, p.e1.id).shell === 3 && U(hit.next, p.e1.id).hp === U(sh, p.e1.id).hp, "F15 Runeshell soaks damage")
      const regrow = I.itemEnemyPhaseStart(hit.next)
      ok(U(regrow, p.e1.id).shell === 8, "F16 ...and regrows each enemy turn")
      const q = base([it(1, "spellbreak-thorn", "b0", 0)])
      const s2 = patch(q.b, q.e1.id, { kit: "runeshell", shell: 8, shellMax: 8 })
      const cracked = te.attackUnit(s2, q.h.id, q.e1.id)
      ok(U(cracked, q.e1.id).shell === 0 && U(cracked, q.e1.id).shellBroken >= 1, "F17 Spellbreak Thorn hit cracks it")
      ok(U(I.itemEnemyPhaseStart(cracked), q.e1.id).shell === 0, "F18 a cracked shell doesn't regrow that turn")
    }
    // Shadowmoss vs Glowdust / Owl Lantern (reveal)
    {
      const rs = mk([hero("b0", "hexbreaker")], [it(1, "glowdust-pouch", "b0", 0)], 3)
      let b = clean(start(rs))
      const h = U(b, "player-hexbreaker")
      const e = foes(b)[0]
      b = place(b, h.id, 4, 6, { ap: 2 })
      b = place(b, e.id, 4, 3, { kit: "shroud", shroud: true })
      ok(!te.attackableTargets(b, h.id).some((u) => u.id === e.id), "F19 Shadowmoss: hidden from 3 tiles")
      ok(te.attackableTargets(place(place(b, e.id, 4, 5), h.id, 4, 6), h.id).some((u) => u.id === e.id) || h.range < 1, "F20 ...but not from the next tile")
      const lit = I.castItemActive(b, h.id, "glowdust")
      ok(te.attackableTargets(lit, h.id).some((u) => u.id === e.id), "F21 Glowdust reveals it - now a target")
      const lanternRs = mk([hero("b0", "hexbreaker")], [it(1, "owl-lantern", "b0", 0)], 3)
      let lb = clean(start(lanternRs))
      const lh = U(lb, "player-hexbreaker")
      lb = place(lb, lh.id, 4, 6, { ap: 2 })
      lb = place(lb, e.id, 4, 3, { kit: "shroud", shroud: true })
      ok(te.attackableTargets(lb, lh.id).some((u) => u.id === e.id), "F22 Owl Lantern bearer sees it", { range: lh.range, reveal: lh.gearReveal })
    }
    // Real battle at Act III: kits are applied from the formation, telegraph exact.
    {
      const rs = mk([hero("b0", "hexbreaker")], [], 3)
      const b = start(rs)
      const kits = foes(b).filter((u) => u.kit).map((u) => `${u.defId}:${u.kit}`)
      const expect = foes(b).map((u) => F.counterKitFor(u.defId, 3)?.id || null).filter(Boolean)
      ok(kits.length === expect.length, "F23 a real Act III fight gives its enemies their kits", { kits, expect })
      const qa = te.withLowEnemyHp(patch(b, foes(b)[0].id, { kit: "runeshell", shell: 8, shellMax: 8, armor: 2, blurCharges: 2, shroud: true }))
      const q0 = U(qa, foes(b)[0].id)
      ok(!q0.kit && !q0.shell && !q0.armor && !q0.blurCharges && !q0.shroud, "F24 QA hook (withLowEnemyHp) switches every kit off")
      const qaFirst = rt.startTacticsFormationBattle(rs, (st) => te.withLowEnemyHp(buildRunTacticsBattle(rs, st))).battle
      ok(!foes(qaFirst).some((u) => u.kit), "F25 QA applied inside the builder (the ?debugLowHp path) stays kit-free")
      res.notes.act3Kits = kits
    }
  }

  // --- G. Preview == real with active items + kits in play -------------------------
  {
    const rs = mk([hero("b0", "hexbreaker"), hero("b1", "bulwark-of-ages")], [it(1, "gale-bough", "b0", 0), it(2, "whirlwind-seedstaff", "b0", 1), it(3, "foxfire-charm", "b0", 2), it(4, "heartoak-aegis", "b1", 0)], 3)
    let s = start(rs)
    s = { ...s, units: s.units.map((u, i) => (u.side === "enemy" ? { ...u, kit: ["bloom", "seed", "runeshell", "mist"][i % 4], shell: 8, shellMax: 8, blurCharges: 2 } : u.side === "player" ? { ...u, mana: u.manaMax } : u)) }
    const rows = []
    for (let turn = 0; turn < 4 && s.phase === "player"; turn++) {
      const h = U(s, "player-hexbreaker")
      const w = U(s, "player-bulwark")
      // Use whatever active is ready this turn.
      if (h && h.hp > 0) {
        for (const id of ["cyclone-lift", "gale-push", "foxfire-step"]) {
          if (I.itemActiveBlocker(s, U(s, h.id), id)) continue
          const t = I.itemActiveTargets(s, h.id, id)
          const pick = id === "foxfire-step" ? `${t[0].row}-${t[0].col}` : t.find((u) => u.side === "enemy")?.id
          if (pick) s = I.castItemActive(s, h.id, id, pick)
        }
      }
      if (w && w.hp > 0 && !I.itemActiveBlocker(s, U(s, w.id), "heartoak-bark")) s = I.castItemActive(s, w.id, "heartoak-bark")
      if (s.phase !== "player") break
      const pv = te.previewEnemyIntents(s)
      const pv2 = te.previewEnemyIntents(s)
      const after = te.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const now = after.units.find((u) => u.id === enemyId)
        const was = s.units.find((u) => u.id === enemyId)
        let good = JSON.stringify(pv) === JSON.stringify(pv2)
        if (now && (intent.kind === "move" || intent.kind === "move-attack")) good = good && now.pos.row === intent.to.row && now.pos.col === intent.to.col
        if (now && was && intent.kind === "stunned") good = good && now.pos.row === was.pos.row && now.pos.col === was.pos.col
        rows.push({ turn, enemyId, kind: intent.kind, good })
      }
      // Seedlings called this enemy turn showed up in the preview too.
      const fresh = after.units.filter((u) => u.seedOf && !s.units.some((x) => x.id === u.id)).map((u) => u.id)
      rows.push({ turn, seeds: fresh.length, good: fresh.every((id) => pv.some((p) => p.enemyId === id)) })
      s = after
    }
    ok(rows.length >= 4 && rows.every((x) => x.good), "G1 preview == real with actives + kits over several turns", rows.filter((x) => !x.good).slice(0, 5))
    ok(rows.some((x) => x.kind === "stunned"), "G2 a lifted foe was telegraphed as skipping", rows.map((x) => x.kind))
    res.notes.previewRows = rows.length
  }
  return res
}

// ---------------------------------------------------------------------------
if (process.env.LOGIC_ONLY) {
  const res = await logic(process.cwd())
  console.log(JSON.stringify({ checks: res.n, fails: res.fails, notes: res.notes }, null, 1))
  process.exit(res.fails.length ? 1 : 0)
}

const { chromium } = await import("playwright")
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { fails: [], checks: 0 }
const check = (cond, label, data) => {
  out.checks++
  if (!cond) out.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 500) : ""}`)
}
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)
const res = await page.evaluate(logic, "")
out.checks += res.n
out.fails.push(...res.fails)

// ---------------------------------------------------------------------------
// UI - a saved run in the shop / a tactics fight, real clicks.
// ---------------------------------------------------------------------------
const flags = () => {
  localStorage.setItem("heartwood-autobattler-intro-seen", "1")
  localStorage.setItem("heartwood-story-intro-seen", "1")
  localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
  localStorage.setItem("heartwood-coach-enabled-v1", "false")
}
const readRun = () => page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
const seed = (spec) =>
  page.evaluate(
    async ({ flagsSrc, spec }) => {
      localStorage.clear()
      new Function(flagsSrc)()
      const rt = await import("/src/services/heartwood/runEngine.js")
      const idx = rt.RUN_PATH.findIndex((n, i) => (spec.type === "shop" ? n.type === "shop" : n.type === "battle" && n.formationId) && i > 0 && rt.actIndexForNode(i, rt.RUN_PATH.length) === spec.act)
      const rs = {
        ...rt.startRun("tommy", null, { forcedSeed: 424243 }),
        nodeIndex: idx,
        path: rt.RUN_PATH.slice(0, idx + 1),
        lastSeenAct: spec.act,
        ...spec.patch,
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(rs)))
      return idx
    },
    { flagsSrc: `(${flags.toString()})()`, spec },
  )

// UI-1: shop highlight + build path view + forge
{
  await seed({
    type: "shop",
    act: 2,
    patch: {
      phase: "shop",
      essence: 900,
      bench: [{ key: 10, defId: "hexbreaker", upgradeLevel: 0, upgrades: [] }],
      benchKeyCounter: 11,
      deployed: [10, null, null, null],
      items: [
        { key: 1, defId: "wind-seed", equippedTo: 10, slotIndex: 0 },
        { key: 2, defId: "lucky-charm", equippedTo: null, slotIndex: null },
      ],
      itemKeyCounter: 10,
      heroBuilds: { 10: "spellbreaker" },
      itemOffers: ["spellbreak-thorn", "padded-vest", "iron-blade"],
      itemLocks: [],
    },
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".hw-market-items-grid").waitFor({ timeout: 15000 })
  await page.waitForTimeout(400)
  const shop = await page.evaluate(() => ({
    wanted: [...document.querySelectorAll(".hw-market-items-grid .hw-item-card[data-wanted]")].map((e) => e.getAttribute("data-item-id")),
    into: document.querySelector('.hw-market-items-grid [data-item-id="spellbreak-thorn"] [data-builds-into]')?.textContent || "",
    tier: document.querySelector('.hw-market-items-grid [data-item-id="spellbreak-thorn"] .hw-item-tier')?.textContent || "",
  }))
  check(shop.wanted.includes("spellbreak-thorn") && shop.wanted.includes("iron-blade") && !shop.wanted.includes("padded-vest"), "U1 the shop highlights the chosen build's components", shop)
  check(/Sapdrinker/.test(shop.into) && /Component/.test(shop.tier), "U2 item card: tier + builds into", shop)
  await page.locator('.hw-market-items-grid [data-item-id="spellbreak-thorn"]').screenshot({ path: `${SHOTS}/dota-shop-highlight.png` }).catch(() => {})
  await page.screenshot({ path: `${SHOTS}/dota-shop.png` })
  await page.locator(".hw-squad-tab-btn").click()
  await page.locator('[data-gear-open="10"]').click()
  await page.locator("[data-build-path-view]").waitFor({ timeout: 5000 })
  const build = await page.evaluate(() => ({
    paths: [...document.querySelectorAll("[data-build-path]")].map((b) => b.getAttribute("data-build-path")),
    chosen: document.querySelector("[data-build-path-view]")?.getAttribute("data-chosen"),
    steps: [...document.querySelectorAll("[data-build-step]")].map((b) => b.getAttribute("data-build-step")),
    forge: [...document.querySelectorAll("[data-forge]")].map((b) => ({ id: b.getAttribute("data-forge"), disabled: b.disabled })),
  }))
  check(build.paths.length === 3 && build.chosen === "spellbreaker" && build.steps.join() === "sapdrinker,foxfire-charm,unbinding-bell", "U3 gear screen: build path view (3 paths, steps)", build)
  check(build.forge.some((f) => f.id === "foxfire-charm" && !f.disabled) && build.forge.some((f) => f.id === "sapdrinker" && f.disabled), "U4 forge ready only where every part is owned", build.forge)
  await page.locator(".hw-gear-screen").screenshot({ path: `${SHOTS}/dota-build-path.png` }).catch(() => page.screenshot({ path: `${SHOTS}/dota-build-path.png` }))
  await page.locator('[data-forge="foxfire-charm"]').click()
  await page.waitForTimeout(300)
  const run = await readRun()
  const made = run.items.find((x) => x.defId === "foxfire-charm")
  check(made && made.equippedTo === 10 && made.slotIndex === 0 && run.essence === 850 && !run.items.some((x) => x.defId === "wind-seed"), "U5 Forge click: Foxfire Charm into the hero's row, -50", { items: run.items, essence: run.essence })
  // Choosing another path updates the highlight.
  await page.locator('[data-build-path="marksman"]').click()
  await page.waitForTimeout(200)
  check((await readRun()).heroBuilds?.[10] === "marksman", "U6 choosing a build path is saved")
}

// UI-2: pre-fight threat panel ("Bring:") + a fight with item actives and kits
{
  await seed({
    type: "battle",
    act: 3,
    patch: {
      phase: "formation",
      essence: 300,
      bench: [{ key: "b0", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b0", null, null, null],
      items: [
        { key: 1, defId: "gale-bough", equippedTo: "b0", slotIndex: 0 },
        { key: 2, defId: "sapling-salve", equippedTo: "b0", slotIndex: 1 },
        { key: 3, defId: "glowdust-pouch", equippedTo: "b0", slotIndex: 2 },
      ],
      itemKeyCounter: 10,
    },
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".hw-tactics-start").waitFor({ timeout: 15000 })
  await page.waitForTimeout(400)
  const counter = await page.evaluate(() => {
    const el = document.querySelector("[data-counter-read]")
    return { text: el?.textContent || "", tags: el?.getAttribute("data-counter-read") || "" }
  })
  check(/Bring:/.test(counter.text) && counter.tags.length > 0, "U7 the pre-fight threat panel shows the enemy tricks + what to bring", counter)
  const tp = page.locator(".hw-threat-preview")
  if (await tp.count()) await tp.screenshot({ path: `${SHOTS}/dota-counter-tags.png` })
  else await page.screenshot({ path: `${SHOTS}/dota-counter-tags.png` })
  await page.locator(".hw-tactics-start").click()
  const begin = page.locator(".hwt-begin-battle")
  await begin.waitFor({ timeout: 5000 }).catch(() => {})
  if (await begin.count()) await begin.click()
  await page.waitForTimeout(500)
  await page.locator('.hwt-token[data-side="player"][data-unit-id^="player-hexbreaker"]').click()
  await page.waitForTimeout(300)
  const bar = await page.evaluate(() => ({
    actives: [...document.querySelectorAll("[data-item-active]")].map((b) => b.getAttribute("data-item-active")),
    kits: [...document.querySelectorAll("[data-kit-badge]")].map((b) => b.getAttribute("data-kit-badge")),
    panel: document.querySelector("[data-counter-panel]")?.textContent || "",
  }))
  check(bar.actives.join() === "gale-push,salve,glowdust", "U8 active items on the hero's action bar", bar)
  check(bar.kits.length > 0 && /Enemy tricks/.test(bar.panel), "U9 enemy kit badges + the Enemy tricks panel", bar)
  const kitTok = page.locator('.hwt-token:has([data-kit-badge])').first()
  const kitBox = await page.locator("[data-kit-badge]").first().boundingBox().catch(() => null)
  check(!!kitBox && kitBox.width > 4, "U9b a kit badge is visible on the enemy token", kitBox)
  await kitTok.screenshot({ path: `${SHOTS}/dota-kit-badge.png` }).catch(() => {})
  await page.locator(".hwt-universal-actions").screenshot({ path: `${SHOTS}/dota-active-bar.png` }).catch(() => page.screenshot({ path: `${SHOTS}/dota-active-bar.png` }))
  // Salve: arm, click the hero itself -> a use is spent.
  await page.locator('[data-item-active="salve"]').click()
  await page.locator('.hwt-token[data-side="player"][data-unit-id^="player-hexbreaker"]').click()
  await page.waitForTimeout(300)
  const uses = await page.locator('[data-item-active="salve"]').getAttribute("data-uses").catch(() => null)
  check(uses === "2", "U10 Salve via clicks: 3 -> 2 uses", uses)
  // Glowdust (free, self) fires straight away.
  await page.locator('[data-item-active="glowdust"]').click()
  await page.waitForTimeout(300)
  const dust = await page.locator('[data-item-active="glowdust"]').getAttribute("data-uses").catch(() => null)
  check(dust === "1", "U11 Glowdust (self) fires on click", dust)
}

check(errs.length === 0, "U12 no page errors", errs.slice(0, 3))
await browser.close()
console.log(JSON.stringify({ checks: out.checks, fails: out.fails, notes: res.notes }, null, 1))
process.exit(out.fails.length ? 1 : 0)
