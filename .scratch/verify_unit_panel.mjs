// Unit panel under the battlefield + "clicking a unit switches to it".
// usage: PORT=5451 node .scratch/verify_unit_panel.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5451
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
await page.waitForTimeout(1500)
await page.mouse.move(3, 3)
const panel = () =>
  page.evaluate(() => {
    const p = document.querySelector(".hwt-unit-panel")
    if (!p) return null
    return { id: p.dataset.unitPanel, side: p.dataset.side, mode: p.dataset.mode, skills: p.querySelectorAll(".hwt-skill-btn").length, ability: p.querySelectorAll(".hwt-ability-btn").length, atk: p.querySelector('[data-stat="atk"] b')?.textContent, hp: p.querySelector('[data-stat="hp"] b')?.textContent }
  })
const posOf = (id) => page.evaluate((id) => document.querySelector(`.hwt-token[data-unit-id="${id}"]`)?.parentElement.dataset.cell, id)

// 1. Deployment, nothing selected: the panel is there with a hero.
const p1 = await panel()
ok("deployment: panel is always there, showing a hero", p1 && p1.side === "player" && p1.mode === "auto", JSON.stringify(p1))

// 2. Deployment: hero A selected, clicking hero B switches to B - no swap.
const heroes = await page.$$eval('.hwt-token[data-side="player"][data-selectable="true"]', (els) => els.map((e) => e.dataset.unitId))
const [A, B] = heroes
const posA = await posOf(A)
const posB = await posOf(B)
await page.locator(`.hwt-token[data-unit-id="${A}"]`).click()
await page.waitForTimeout(250)
await page.locator(`.hwt-token[data-unit-id="${B}"]`).click()
await page.waitForTimeout(350)
const selB = await page.evaluate((B) => document.querySelector(`.hwt-token[data-unit-id="${B}"]`)?.dataset.selected, B)
ok("deployment: clicking another hero selects it, nobody moves", selB === "true" && (await posOf(A)) === posA && (await posOf(B)) === posB, JSON.stringify({ selB, posA, nowA: await posOf(A), posB, nowB: await posOf(B) }))
const p2 = await panel()
ok("deployment: the panel follows the selection", p2.id === B && p2.mode === "selected", JSON.stringify(p2))
await page.keyboard.press("Escape")

// 3. Player turn: select a hero - its skills and signature are in the panel.
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(2200)
await page.locator(`.hwt-token[data-unit-id="${A}"]`).click()
await page.waitForTimeout(400)
await page.mouse.move(3, 3)
const p3 = await panel()
const sideSkills = await page.locator(".hwt-panel .hwt-skill-bar, .hwt-panel .hwt-ability-panel").count()
ok("selected hero: skills / signature live in the panel (moved out of the side panel)", p3.mode === "selected" && p3.skills + p3.ability > 0 && sideSkills === 0, JSON.stringify({ p3, sideSkills }))
const unitA = await page.evaluate(async (A) => { const t = document.querySelector(`.hwt-token[data-unit-id="${A}"]`); return t.innerText }, A)
ok("stat tiles show the unit's numbers", /\d/.test(p3.atk) && /\d+\/\d+/.test(p3.hp.replace(/\s/g, "")), JSON.stringify({ atk: p3.atk, hp: p3.hp }))
const cols = await page.evaluate(() => getComputedStyle(document.querySelector(".hwt-up-stats")).gridTemplateColumns.split(" ").length)
ok("stats sit in a tidy 4-column grid", cols === 4, `cols=${cols}`)
// hovering an enemy while a hero is selected keeps the hero (actions stay put)
const enemy = await page.$eval('.hwt-token[data-side="enemy"]', (e) => e.dataset.unitId)
await page.locator(`.hwt-token[data-unit-id="${enemy}"]`).hover()
await page.waitForTimeout(200)
const p4 = await panel()
ok("with a hero selected, hovering an enemy does NOT pull the panel away", p4.id === A, JSON.stringify(p4))
// a skill button still works from the panel (arming highlights)
if (p3.skills) {
  const btn = page.locator(".hwt-unit-panel .hwt-skill-btn:not([disabled])").first()
  if (await btn.count()) {
    const apBefore = await page.locator('.hwt-unit-panel [data-stat="ap"] b').textContent()
    await btn.click()
    await page.waitForTimeout(250)
    const armed = await page.locator('.hwt-unit-panel .hwt-skill-btn[data-active="true"]').count()
    const apAfter = await page.locator('.hwt-unit-panel [data-stat="ap"] b').textContent().catch(() => apBefore)
    ok("a skill button in the panel responds (arms targeting or casts)", armed > 0 || apAfter !== apBefore, JSON.stringify({ armed, apBefore, apAfter }))
    await page.keyboard.press("Escape")
  }
}

// 4. Nothing selected: hovering an enemy peeks at it; clicking it inspects it.
await page.locator(".hwt-end-turn").scrollIntoViewIfNeeded()
await page.mouse.move(3, 3)
await page.evaluate(() => document.querySelector('.hwt-cell[data-cell="0-5"]')?.click())
await page.waitForTimeout(250)
await page.locator(`.hwt-token[data-unit-id="${enemy}"]`).hover()
await page.waitForTimeout(250)
const p5 = await panel()
ok("nothing selected: hovering an enemy shows it in the panel", p5.id === enemy && p5.side === "enemy" && p5.mode === "peek", JSON.stringify(p5))
await page.locator(`.hwt-token[data-unit-id="${enemy}"]`).click()
await page.waitForTimeout(250)
await page.mouse.move(3, 3)
await page.waitForTimeout(150)
const p6 = await panel()
ok("clicking an enemy (out of reach) inspects it", p6.id === enemy && p6.mode === "inspect" && p6.skills === 0, JSON.stringify(p6))

// 5. Pop-up style: details fold until hovered.
const pop = await page.evaluate(() => {
  const what = document.querySelector(".hwt-unit-panel .hwt-up-id .hwt-selected-role-what")
  const mana = document.querySelector(".hwt-unit-panel .hwt-up-pop")
  return { whatH: what ? what.getBoundingClientRect().height : -1, manaDisplay: mana ? getComputedStyle(mana).display : "none-el" }
})
ok("pop-up: role explanation folded, resource details hidden until hover", pop.whatH < 2 && (pop.manaDisplay === "none" || pop.manaDisplay === "none-el"), JSON.stringify(pop))
await page.locator(".hwt-unit-panel .hwt-up-id").hover()
await page.waitForTimeout(450)
const whatOpen = await page.evaluate(() => document.querySelector(".hwt-unit-panel .hwt-up-id .hwt-selected-role-what").getBoundingClientRect().height)
ok("pop-up: hovering the name block opens the role explanation", whatOpen > 6, `h=${whatOpen}`)
const manaTile = page.locator('.hwt-unit-panel [data-stat="mana"]')
if (await manaTile.count()) {
  await manaTile.hover()
  await page.waitForTimeout(250)
  const shown = await page.evaluate(() => getComputedStyle(document.querySelector(".hwt-unit-panel .hwt-up-pop")).display)
  ok("pop-up: hovering the resource tile opens its breakpoints and rules", shown === "block", shown)
}
await page.screenshot({ path: ".scratch/shots/unit_panel_fight.png", fullPage: true })
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
