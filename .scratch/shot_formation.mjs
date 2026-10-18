// Pre-battle (formation) screen. usage: node .scratch/shot_formation.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload(); await page.waitForTimeout(1600)
await page.screenshot({ path: `${OUT}-1.png` })
const sc = page.locator(".hw-root").first(); await page.evaluate(() => { const r = [...document.querySelectorAll("*")].find((e) => e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== "visible"); if (r) r.scrollTop = 700 }); await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}-2.png` })
const startInView = await page.evaluate(() => { const b = document.querySelector(".hw-tactics-start").getBoundingClientRect(); return b.bottom <= innerHeight && b.top >= 0 }); console.log(JSON.stringify({ startInView, errs, docH: await page.evaluate(() => document.documentElement.scrollHeight), start: await page.locator(".hw-tactics-start").count(), text: (await page.evaluate(() => document.body.innerText)).slice(0, 200).replace(/\n/g, " | ") }))
await b.close()
