import { chromium } from "playwright"

// Breeding & lineage at the Hearth's Nest (services/heartwood/hearth.js
// breedHeroes / hatchling / kinship + HearthScreen's Nest + family tree).
// Logic checks drive the REAL modules via page.evaluate import; the UI
// check uses real clicks. Usage: PORT=5445 node .scratch/verify_breeding.mjs
const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || ".scratch/shots"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const fail = (m) => out.errors.push(m)

const page = await browser.newContext({ viewport: { width: 1500, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const H = await import("/src/services/heartwood/hearth.js")
  const LV = await import("/src/services/heartwood/unitLevels.js")
  const MD = await import("/src/data/heartwood/mutations.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const res = {}
  const u = (hid, defId, extra = {}) => ({ hid, defId, xp: 0, age: 1, runs: 1, upgradeLevel: 0, upgrades: [], perks: [], skillUpgrades: {}, ...extra })
  // Two heroes of DIFFERENT classes (support Mosskit + spellblade Hexbreaker).
  const A = u(1, "the-fool", { xp: 30, perks: ["bark", "swift"], mutations: ["extra-eye", "mossy-hide", "glass-bones"] })
  const B = u(2, "hexbreaker", { xp: 16, perks: ["edge"] })
  const base = (extra = {}) => H.normalizeHearth({ version: 1, runs: 3, nextHid: 10, roster: [A, B], elders: [], rooms: { nest: 1 }, furniture: [], ...extra })

  // --- A: cost + cooldown + blockers.
  const h0 = base()
  const noNest = H.normalizeHearth({ ...h0, rooms: { nest: 0 } })
  const b1 = H.breedHeroes(h0, 1, 2, 100)
  res.A = {
    noNest: H.breedBlocker(noNest, 1, 2, 100),
    cost: b1?.cost,
    costLv2: H.breedCost({ ...h0, rooms: { ...h0.rooms, nest: 2 } }),
    poor: H.breedHeroes(h0, 1, 2, 5),
    rosterAfter: b1?.hearth.roster.length,
    bred: b1?.hearth.roster.filter((x) => x.bredRun === 3).map((x) => x.hid),
    again: H.breedHeroes(b1.hearth, 1, 2, 100),
    againReason: H.breedBlocker(b1.hearth, 1, 2, 100),
    afterRun: !!H.breedHeroes({ ...b1.hearth, runs: 4 }, 1, 2, 100),
    fullReason: H.breedBlocker(base({ roster: [A, B, u(3, "the-fool"), u(4, "the-fool")] }), 1, 2, 100),
  }
  // Elders can breed too.
  const withElder = base({ roster: [A], elders: [B] })
  res.A.elder = !!H.breedHeroes(withElder, 1, 2, 100)

  // --- B: the hatchling inherits a blend of both parents, deterministically.
  const child = b1.child
  const again = H.hatchling(h0, 1, 2)
  const classA = LV.heroClassId(A)
  const classB = LV.heroClassId(B)
  const resA = LV.heroResourceId(A)
  const resB = LV.heroResourceId(B)
  res.B = {
    child,
    same: JSON.stringify(again) === JSON.stringify(child),
    defOk: [A.defId, B.defId].includes(child.defId),
    classOk: [classA, classB].includes(LV.heroClassId(child)),
    classA, classB, resA, resB,
    lv1: LV.levelForXp(child.xp) === 1 && child.age === 0,
    gen: child.generation,
    parents: child.parents,
    perksFromParents: child.inheritedPerks.every((p) => A.perks.includes(p) || B.perks.includes(p)),
    traitCount: (child.inheritedPerks.length + Object.keys(child.inheritedUpgrades).length),
    affinityOk: [resA, resB].includes(child.affinity?.resource) && !!(child.affinity?.max || child.affinity?.regen),
  }
  // Over many seeds: lead parent varies, cross-class happens rarely,
  // parent mutations pass on ~40%, a 2nd-generation child is generation 2.
  let leadA = 0, cross = 0, inherited = 0, total = 0, mutKids = 0
  for (let seed = 1; seed <= 200; seed++) {
    const c = H.hatchling({ ...h0, seed }, 1, 2)
    total++
    if (c.defId === A.defId) leadA++
    const natural = LV.heroClassId({ defId: c.defId })
    if (LV.heroClassId(c) !== natural) cross++
    inherited += c.mutations.filter((m) => A.mutations.includes(m)).length
    if (c.mutations.length) mutKids++
  }
  res.B.stats = { leadA, cross, inheritRate: inherited / (total * 3), mutKids }
  // Grandchild generation
  const g = b1.hearth
  const b2 = H.breedHeroes({ ...g, runs: 4 }, child.hid, 1, 100)
  res.B.grandGen = b2?.child.generation
  // Skill branch inheritance: a parent with a skill branch of the child's class.
  const tree = LV.skillTreeFor(UNITS["the-fool"])
  const sk = tree[0]
  const P = u(5, "the-fool", { skillUpgrades: { [sk.id]: "B" } })
  const Q = u(6, "the-fool", { skillUpgrades: { [sk.id]: "A" } })
  const hb = base({ roster: [P, Q] })
  let branchKids = 0
  for (let seed = 1; seed <= 40; seed++) if (Object.keys(H.hatchling({ ...hb, seed }, 5, 6).inheritedUpgrades).includes(sk.id)) branchKids++
  res.B.branchKids = branchKids

  // --- C: inbreeding - kinship + bad-mutation risk.
  const fam = H.normalizeHearth({
    version: 1, runs: 5, nextHid: 30, rooms: { nest: 1 },
    roster: [
      u(11, "the-fool", { parents: [1, 2], generation: 1 }),
      u(12, "hexbreaker", { parents: [1, 2], generation: 1 }), // full sibling of 11
      u(13, "the-fool", { parents: [1, 3], generation: 1 }), // half sibling of 11
      u(14, "the-fool", { parents: [11, 7], generation: 2 }), // child of 11
      u(15, "hexbreaker", { parents: [12, 8], generation: 2 }), // cousin of 14
      u(20, "hexbreaker"), // stranger
    ],
    lineage: { 1: { name: "Old One", defId: "the-fool", parents: null }, 2: { name: "Old Two", defId: "hexbreaker", parents: null }, 3: { name: "Old Three", defId: "the-fool", parents: null } },
  })
  res.C = {
    siblings: H.kinship(fam, 11, 12), halfSib: H.kinship(fam, 11, 13), parentChild: H.kinship(fam, 11, 14),
    cousins: H.kinship(fam, 14, 15), strangers: H.kinship(fam, 11, 20),
    riskSib: H.badMutationChance(fam, 11, 12), riskStranger: H.badMutationChance(fam, 11, 20),
    riskSibLv2: H.badMutationChance({ ...fam, rooms: { ...fam.rooms, nest: 2 } }, 11, 12),
    label: H.kinLabel(H.kinship(fam, 11, 12)),
  }
  const isBad = (id) => MD.MUTATIONS[id]?.kind === "bad"
  let badSib = 0, badStr = 0
  for (let seed = 1; seed <= 200; seed++) {
    if (H.hatchling({ ...fam, seed }, 11, 12).mutations.some(isBad)) badSib++
    if (H.hatchling({ ...fam, seed }, 11, 20).mutations.some(isBad)) badStr++
  }
  res.C.badSib = badSib
  res.C.badStr = badStr
  const tree2 = H.familyTree(fam, 14)
  res.C.tree = { parents: tree2.parents.map((p) => p.name), grand: tree2.parents[0]?.parents.map((p) => p.name) }

  // --- D: a hatchling's traits apply in a tactics fight (via the veteran path).
  const crossKid = { ...child, hid: 50, classId: classA === LV.heroClassId({ defId: child.defId }) ? classB : classA, bias: { hp: 3, attack: 1 }, affinity: { resource: LV.heroResourceId({ defId: child.defId, classId: classA === LV.heroClassId({ defId: child.defId }) ? classB : classA }), max: 10 }, inheritedPerks: ["swift"], inheritedUpgrades: {}, mutations: [] }
  const plainKid = { ...child, hid: 51, classId: undefined, bias: null, affinity: null, inheritedPerks: [], inheritedUpgrades: {}, mutations: [] }
  const fight = (kid) => {
    const hh = H.normalizeHearth({ version: 1, runs: 1, nextHid: 60, roster: [kid], rooms: {} })
    const hs = H.hearthStartFor(hh, [kid.hid])
    let rs = rt.startRun("tommy", null, { forcedSeed: 4321, hearthStart: hs })
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    rs = { ...rs, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length) }
    const vet = rs.bench.find((e) => e.hearthId === kid.hid)
    const slot = rs.deployed.indexOf(vet.key)
    const st = rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s))
    const tu = st.battle.units.find((x) => x.id === `player-${kid.defId}-${rs.deployed.filter((k) => k !== null && rs.bench.some((e) => e.key === k)).indexOf(vet.key)}`)
    return { vet, slot, unit: tu && { classId: tu.classId, maxHp: tu.maxHp, attack: tu.attack, move: tu.move, manaMax: tu.manaMax, resource: tu.resource, perks: tu.perks } }
  }
  const fc = fight(crossKid)
  const fp = fight(plainKid)
  res.D = { cross: fc.unit, plain: fp.unit, vetFields: { classId: fc.vet.classId, bias: fc.vet.bias, affinity: fc.vet.affinity, inheritedPerks: fc.vet.inheritedPerks } }

  // --- E: save/load + old-save defaults.
  localStorage.removeItem(H.HEARTH_KEY)
  H.saveHearth(b1.hearth)
  const loaded = H.loadHearth()
  localStorage.setItem(H.HEARTH_KEY, JSON.stringify({ version: 1, runs: 2, nextHid: 3, roster: [{ hid: 1, defId: "the-fool", xp: 3 }], rooms: { barracks: 1 } }))
  const old = H.loadHearth()
  res.E = {
    childBack: JSON.stringify(loaded.roster.find((x) => x.hid === child.hid)) === JSON.stringify(b1.hearth.roster.find((x) => x.hid === child.hid)),
    lineageBack: Object.keys(loaded.lineage).length, births: loaded.births, lastBirth: loaded.lastBirth?.hid,
    old: { nest: old.rooms.nest, seed: old.seed, births: old.births, lineage: Object.keys(old.lineage).length, mut: old.roster[0].mutations, ip: old.roster[0].inheritedPerks, parents: old.roster[0].parents, gen: old.roster[0].generation },
  }
  localStorage.removeItem(H.HEARTH_KEY)
  return res
})
out.logic = r

const { A, B, C, D, E } = r
if (!(A.noNest === "Build the Nest first." && A.cost === 10 && A.costLv2 === 6 && A.poor === null && A.rosterAfter === 3 && A.bred.join() === "1,2" && A.again === null && /one hatchling per run/.test(A.againReason) && A.afterRun && /Barracks are full/.test(A.fullReason) && A.elder))
  fail("A: pairing cost / cooldown / blockers wrong")
if (!(B.same && B.defOk && B.classOk && B.lv1 && B.gen === 1 && B.parents.join() === "1,2" && B.perksFromParents && B.traitCount >= 1 && B.affinityOk))
  fail("B: hatchling does not blend its parents deterministically")
if (!(B.stats.leadA > 60 && B.stats.leadA < 140 && B.stats.cross > 0 && B.stats.cross < 70 && B.stats.inheritRate > 0.28 && B.stats.inheritRate < 0.52 && B.grandGen === 2 && B.branchKids > 5))
  fail(`B: inheritance odds off ${JSON.stringify(B.stats)} grandGen=${B.grandGen} branchKids=${B.branchKids}`)
if (!(C.siblings === 0.5 && C.halfSib === 0.25 && C.parentChild === 0.5 && C.cousins === 0.125 && C.strangers === 0 && C.riskSib > C.riskStranger && C.riskSibLv2 < C.riskSib && C.label === "Close family" && C.badSib > C.badStr * 2))
  fail("C: inbreeding kinship / bad-mutation risk wrong")
if (!(C.tree.parents.length === 2 && C.tree.grand?.length === 2))
  fail("C: family tree (parents + grandparents) wrong")
if (!(D.cross && D.plain && D.cross.classId === D.vetFields.classId && D.cross.classId !== D.plain.classId && D.cross.maxHp === D.plain.maxHp + 3 && D.cross.attack === D.plain.attack + 1 && D.cross.perks.includes("swift") && D.cross.move === D.plain.move + 1 && D.cross.manaMax > 0))
  fail("D: hatchling traits (cross-class, bias, inherited perk, affinity) not applied in the fight")
if (!(E.childBack && E.lineageBack === 3 && E.births === 1 && E.lastBirth === B.child.hid && E.old.nest === 0 && E.old.seed === 7919 && E.old.births === 0 && E.old.lineage === 0 && E.old.mut.length === 0 && E.old.ip.length === 0 && E.old.parents === null && E.old.gen === 0))
  fail("E: save/load or old-save defaults wrong")

// --- F: UI - the Nest: pick two close relatives, see the risk, pair them,
// the hatchling appears; its family tree opens on its card.
{
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, acorns: 100, chosenPerks: [], unlockedCommanders: [] }))
    const u = (hid, defId, xp, extra = {}) => ({ hid, defId, xp, age: 2, runs: 2, upgradeLevel: 0, upgrades: [], perks: [], skillUpgrades: {}, ...extra })
    localStorage.setItem("hearthwood-hearth-v1", JSON.stringify({
      version: 1, runs: 4, nextHid: 20,
      roster: [
        u(11, "the-fool", 16, { name: "Moss", parents: [1, 2], generation: 1, perks: ["bark"], mutations: ["extra-eye", "mossy-hide"] }),
        u(12, "hexbreaker", 30, { name: "Fen", parents: [1, 2], generation: 1, perks: ["edge"], mutations: ["ember-blood"] }),
        u(3, "the-fool", 7),
      ],
      elders: [u(1, "the-fool", 45, { age: 6 })],
      lineage: { 1: { name: "Old Bramble (Mosskit)", defId: "the-fool", parents: null }, 2: { name: "Ash (Hexbreaker)", defId: "hexbreaker", parents: null } },
      memorial: [], rooms: { nest: 1, barracks: 1 }, furniture: [], permadeath: true,
    }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator("[data-hearth-open]").click()
  await page.locator("[data-screen=hearth]").waitFor({ timeout: 8000 })
  const ui = {}
  ui.nest = await page.locator("[data-hearth-nest]").getAttribute("data-level")
  ui.parents = await page.locator("[data-nest-parent]").count()
  ui.breedDisabled0 = await page.locator("[data-nest-breed]").isDisabled()
  await page.locator("[data-nest-parent='11']").click()
  await page.locator("[data-nest-parent='12']").click()
  ui.kin = await page.locator("[data-nest-preview] b").innerText()
  ui.risk = await page.locator("[data-nest-risk]").innerText()
  ui.cardBadges = await page.locator("[data-hearth-unit='11'] .hw-mut-badge").count()
  await page.locator("[data-hearth-nest]").scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/breeding_nest_pick.png` })
  await page.locator("[data-nest-breed]").click()
  ui.birth = await page.locator("[data-nest-birth]").innerText().catch(() => "")
  ui.roster = await page.locator("[data-hearth-unit]").count()
  const stored = await page.evaluate(() => ({ h: JSON.parse(localStorage.getItem("hearthwood-hearth-v1")), m: JSON.parse(localStorage.getItem("heartwood-meta-v1")) }))
  ui.acorns = stored.m.acorns
  const kid = stored.h.roster.find((x) => x.hid === 20)
  ui.kid = kid && { parents: kid.parents, generation: kid.generation, name: kid.name }
  ui.tiredDisabled = await page.locator("[data-nest-parent='11']").isDisabled()
  await page.locator("[data-hearth-family='20']").click()
  ui.tree = await page.locator("[data-family='20']").innerText()
  ui.treeNodes = await page.locator("[data-family='20'] [data-family-node]").count()
  await page.locator("[data-hearth-unit='20']").scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/breeding_lineage.png` })
  out.ui = ui
  if (!(ui.nest === "1" && ui.parents === 4 && ui.breedDisabled0 && ui.kin === "Close family" && parseInt(ui.risk) >= 35 && ui.cardBadges === 2))
    fail("F: Nest picker / kinship preview / mutation badges wrong")
  if (!(/hatched/.test(ui.birth) && ui.roster === 4 && ui.acorns === 90 && ui.kid?.generation === 2 && ui.kid.parents.join() === "11,12" && ui.tiredDisabled))
    fail("F: pairing via clicks did not produce the hatchling / charge Acorns / start the cooldown")
  if (!(ui.treeNodes === 7 && /Ash/.test(ui.tree) && /Fen/.test(ui.tree) && /Moss/.test(ui.tree)))
    fail("F: family tree on the hatchling's card wrong")
}

out.pageErrors = errs
if (errs.length) fail(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
