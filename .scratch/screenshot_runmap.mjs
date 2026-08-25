import { chromium } from "playwright"

const PORT = process.env.PORT || 5310
const shotDir = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-heartwood-taunt/.scratch/shots"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")

await page.waitForSelector(".hw-run-map", { timeout: 10000 })
await page.waitForTimeout(600)
await page.screenshot({ path: `${shotDir}/runmap-shop.png` })
console.log("Shop screen with RunMap captured")

console.log("errors:", errors)
await browser.close()
process.exit(errors.length === 0 ? 0 : 1)
