// Dev helper: evaluate a JS snippet (file arg) inside the vite page.
import { chromium } from "playwright"
import { readFileSync } from "node:fs"
const PORT = process.env.PORT || 5445
const code = readFileSync(process.argv[2], "utf8")
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board", { timeout: 30000 })
  const r = await page.evaluate(`(async () => { ${code} })()`)
  console.log(JSON.stringify(r, null, 1))
  if (errs.length) console.log("PAGE ERRORS", errs)
} finally {
  await browser.close()
}
