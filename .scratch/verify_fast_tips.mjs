// Fast hover explanations on the battlefield (FastTips.jsx).
// usage: PORT=5448 node .scratch/verify_fast_tips.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5448
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
await page.waitForTimeout(1500)

// two neighbouring terrain tiles with explanations
const pair = await page.evaluate(() => {
  const cells = [...document.querySelectorAll(".hwt-cell[title]")].filter((c) => c.dataset.terrain && c.dataset.terrain !== "path" && !c.querySelector(".hwt-token"))
  for (const a of cells) {
    const [r, c] = a.dataset.cell.split("-").map(Number)
    const n = cells.find((x) => x.dataset.cell === `${r}-${c + 1}` && x.title !== a.title)
    if (n) return { a: a.dataset.cell, b: n.dataset.cell, ta: a.title, tb: n.title }
  }
  return null
})
ok("found two neighbouring explained tiles", !!pair, JSON.stringify(pair))
const center = async (key) => {
  const bx = await page.locator(`.hwt-cell[data-cell="${key}"]`).boundingBox()
  return { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }
}
await page.mouse.move(3, 3)
const A = await center(pair.a)
const t0 = Date.now()
await page.mouse.move(A.x, A.y)
await page.waitForSelector('.hw-fast-tip[data-ready="true"]', { timeout: 2000 })
const shownMs = Date.now() - t0
const tipA = await page.locator(".hw-fast-tip").innerText()
const titleWhileOpen = await page.locator(`.hwt-cell[data-cell="${pair.a}"]`).getAttribute("title")
ok("tip appears fast (< 250 ms incl. test overhead)", shownMs < 250, `${shownMs} ms`)
ok("tip shows the tile's own explanation", tipA.trim() === pair.ta.trim(), tipA.slice(0, 80))
ok("native slow tooltip suppressed while hovering (title lifted)", titleWhileOpen === null)
const box = await page.locator(".hw-fast-tip").boundingBox()
ok("tip stays inside the 1536x864 screen", box.x >= 0 && box.y >= 0 && box.x + box.width <= 1536 && box.y + box.height <= 864, JSON.stringify(box))

const B = await center(pair.b)
await page.mouse.move(B.x, B.y)
await page.waitForTimeout(30)
const tipB = await page.locator(".hw-fast-tip").innerText()
ok("moving to the next tile switches the tip instantly", tipB.trim() === pair.tb.trim(), tipB.slice(0, 60))
ok("previous tile got its title back", (await page.locator(`.hwt-cell[data-cell="${pair.a}"]`).getAttribute("title")) === pair.ta)

await page.screenshot({ path: ".scratch/shots/fast_tip.png", clip: { x: Math.max(0, B.x - 300), y: Math.max(0, B.y - 200), width: 600, height: 400 } })
await page.mouse.move(3, 3)
await page.waitForTimeout(60)
ok("tip closes when the pointer leaves", (await page.locator(".hw-fast-tip").count()) === 0)
ok("both titles restored after leaving", (await page.locator(`.hwt-cell[data-cell="${pair.b}"]`).getAttribute("title")) === pair.tb)

// a small badge inside a token (unit details) also explains fast
const tokenTitle = await page.locator(".hwt-token[title]").first()
if (await tokenTitle.count()) {
  const tb = await tokenTitle.boundingBox()
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
  await page.waitForTimeout(150)
  ok("unit tokens explain fast too", (await page.locator('.hw-fast-tip[data-ready="true"]').count()) === 1)
  await page.mouse.move(3, 3)
}
// clicking still works (selecting a hero closes the tip, selection happens)
const hero = page.locator('.hwt-token[data-selectable="true"]').first()
await hero.hover()
await page.waitForTimeout(120)
await hero.click()
await page.waitForTimeout(300)
ok("clicking a hero still selects it, tip closes on click", (await page.locator('.hwt-token[data-selected="true"]').count()) === 1 && (await page.locator(".hw-fast-tip").count()) === 0)
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.info ? `  (${c.info})` : ""}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
