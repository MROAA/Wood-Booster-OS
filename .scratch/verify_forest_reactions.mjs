// Battlefield piece 4 - the forest answers the fight (forestReactions.js).
// usage: PORT=5449 node .scratch/verify_forest_reactions.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5449
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(e.message))
const checks = []
const ok = (name, pass, info = "") => checks.push({ name, pass: !!pass, info })
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424256 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
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
await page.waitForTimeout(2500)

// 1. Every reaction draws its pieces and cleans them up.
const each = await page.evaluate(async () => {
  const R = await import("/src/components/heartwood/forestReactions.js")
  const B = await import("/src/data/heartwood/battleBiomes.js")
  const colours = B.biomeForBattle({}).detail.colours
  const out = {}
  const at = { x: 700, y: 450 }
  for (const kind of R.REACTION_KINDS) {
    R.forestReact(kind, at, colours, "leaves")
    out[kind] = [...document.querySelectorAll(".hwt-fr")].map((e) => e.dataset.fr)
    await new Promise((r) => setTimeout(r, 1700))
    out[kind + ":left"] = document.querySelectorAll(".hwt-fr").length
  }
  return { kinds: R.REACTION_KINDS, out }
})
const expect = { hit: ["leaf", "dust"], heal: ["ring", "flower"], root: ["root"], frost: ["rime", "crystal"], fire: ["glow", "ember"], poison: ["spore"], rustle: ["leaf"], dust: ["dust"], spirit: ["wisp"] }
ok("all 9 reactions exist", Object.keys(expect).every((k) => each.kinds.includes(k)), each.kinds.join(","))
for (const [k, parts] of Object.entries(expect)) {
  ok(`${k}: draws ${parts.join(" + ")} and cleans up (<1.7 s)`, parts.every((p) => each.out[k]?.includes(p)) && each.out[k + ":left"] === 0, `${JSON.stringify([...new Set(each.out[k])])} left=${each.out[k + ":left"]}`)
}

// 2. Performance cap + reduced motion.
const cap = await page.evaluate(async () => {
  const R = await import("/src/components/heartwood/forestReactions.js")
  for (let i = 0; i < 60; i++) R.forestReact("hit", { x: 600, y: 400 }, null)
  const peak = document.querySelectorAll(".hwt-fr").length
  await new Promise((r) => setTimeout(r, 1500))
  document.documentElement.classList.add("hw-reduce-motion")
  R.forestReact("heal", { x: 600, y: 400 }, null)
  const reduced = document.querySelectorAll(".hwt-fr").length
  document.documentElement.classList.remove("hw-reduce-motion")
  return { peak, reduced }
})
ok("live particles capped (spamming 60 hits stays <= 90)", cap.peak <= 90, `peak=${cap.peak}`)
ok("reduced motion: no reactions at all", cap.reduced === 0, `n=${cap.reduced}`)

// 3. In a real fight: play turns and record what the ground answered.
await page.evaluate(() => {
  window.__fr = []
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains("hwt-fr")) window.__fr.push(n.dataset.fr) }).observe(document.body, { childList: true, subtree: true })
})
// move a hero into the grass/moss/leaves if one is reachable, then end turns
const moved = await page.evaluate(() => {
  const hero = document.querySelector('.hwt-token[data-selectable="true"]')
  if (!hero) return null
  hero.click()
  return true
})
await page.waitForTimeout(400)
const target = await page.evaluate(() => {
  const c = [...document.querySelectorAll('.hwt-cell[data-move-band]')].find((x) => ["bush", "moss", "leaves", "forest"].includes(x.dataset.terrain) && !x.querySelector(".hwt-token"))
  return c ? c.dataset.cell : null
})
if (moved && target) {
  await page.locator(`.hwt-cell[data-cell="${target}"]`).click()
  await page.waitForTimeout(1200)
}
const rustled = await page.evaluate(() => window.__fr.filter((k) => k === "blade" || k === "leaf").length)
ok("stepping into grass / moss / leaves rustles it", target && rustled > 0, `target=${target} parts=${rustled}`)
for (let turn = 0; turn < 6; turn++) {
  const btn = page.locator(".hwt-end-turn")
  if (!(await btn.count()) || !(await btn.isEnabled())) break
  await btn.click()
  await page.waitForTimeout(4200)
  const seen = await page.evaluate(() => window.__fr.includes("dust") && window.__fr.includes("leaf"))
  if (seen) break
}
const fr = await page.evaluate(() => window.__fr)
ok("in a real fight, enemy blows puff leaves and dust off the ground", fr.includes("leaf") && fr.includes("dust"), JSON.stringify([...new Set(fr)]))
await page.screenshot({ path: ".scratch/shots/forest_reactions_fight.png" })
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
