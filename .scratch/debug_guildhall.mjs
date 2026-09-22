import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
page.on("console", (m) => console.log("[console]", m.text()))
page.on("pageerror", (e) => console.log("[pageerror]", e))
await page.goto("http://localhost:5185/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(() => {
  localStorage.removeItem("heartwood-run-save-v1")
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
const cards = await page.$$eval(".hw-commander-card", (els) => els.map((e) => ({
  locked: e.getAttribute("data-locked"),
  disabled: e.disabled,
  name: e.querySelector(".hw-commander-name")?.textContent,
})))
console.log("cards:", JSON.stringify(cards))
await page.click(".hw-commander-card:not([data-locked='true'])")
await page.waitForTimeout(1500)
console.log("body classes present:", await page.evaluate(() => document.querySelector(".hw-guildhall") ? "guildhall present" : "guildhall NOT present, current screen root class: " + document.querySelector("[data-screen], .hw-root")?.className))
await browser.close()
