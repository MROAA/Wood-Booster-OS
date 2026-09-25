import { chromium } from "playwright"
const S = process.argv[2]
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
const errs = []; p.on("pageerror", (e) => errs.push(String(e)))
await p.goto("http://localhost:5173/heartwood", { waitUntil: "domcontentloaded" })
await p.waitForSelector(".hw-commander-card", { timeout: 20000 })
await p.locator(".hw-commander-card").first().click()
await p.waitForTimeout(2500)
const phase = async () => p.evaluate(() => { const s = localStorage.getItem("heartwood-run-save-v1"); if (!s) return null; const r = JSON.parse(s).run; return { phase: r.phase, node: r.path?.[r.nodeIndex]?.type, engine: r.battle?.engine ?? null } })
for (let step = 0; step < 12; step++) {
  const st = await phase()
  const buttons = await p.locator("button:visible").allInnerTexts()
  console.log(step, JSON.stringify(st), buttons.slice(0, 14).map((t) => t.replace(/\s+/g, " ").slice(0, 30)).join(" | "))
  await p.screenshot({ path: `${S}/probe_${step}.png` })
  if (st?.phase === "battle") break
  // advance: prefer obvious continue-type buttons
  const order = ["Step through", "Start Battle", "Leave", "Continue", "Begin", "Next", "Skip", "Fight", "Onward", "Enter", "Close", "Got it", "OK"]
  let clicked = false
  for (const t of order) {
    const loc = p.locator("button:visible", { hasText: t }).first()
    if (await loc.count()) { await loc.click({ timeout: 2000 }).catch(() => {}); clicked = true; console.log("  clicked", t); break }
  }
  if (!clicked) { const any = p.locator("button:visible").first(); await any.click({ timeout: 2000 }).catch(() => {}); console.log("  clicked first") }
  await p.waitForTimeout(1500)
}
console.log("errors", errs.slice(0, 3))
await b.close()
