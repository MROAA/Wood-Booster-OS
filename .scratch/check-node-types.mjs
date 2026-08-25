import { chromium } from "playwright"
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
const result = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const run = engine.startRun("tommy")
  const types = run.path.map((n, i) => n.type).filter((t, i) => run.path[i].type === "miniboss" || run.path[i].type === "boss")
  const indices = run.path.map((n, i) => (n.type === "miniboss" || n.type === "boss") ? i : null).filter(x => x !== null)
  return { types, indices, pathLength: run.path.length }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
