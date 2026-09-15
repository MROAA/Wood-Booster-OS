import { chromium } from "playwright"

const PORT = 5174
const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
page.on("pageerror", e => errors.push(`pageerror: ${e}`))
page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`) })

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Hearthwood Studio", { timeout: 15000 })
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/hwstudio-1-empty.png" })

// pick rotwood-husk from Enemies (default tab)
await page.getByPlaceholder("Hae nimellä tai id:llä...").fill("rotwood-husk")
await page.waitForTimeout(600)
const entityButton = page.locator("button", { hasText: "Rotwood Husk" })
await entityButton.first().waitFor({ state: "visible", timeout: 8000 })
await entityButton.first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/hwstudio-2-selected.png" })

const maxHpBefore = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".font-mono")]
  const row = rows.find(el => el.parentElement?.textContent?.includes("maxHp"))
  return row ? row.textContent : null
})
console.log("maxHp before:", maxHpBefore)

// NL instruction
await page.getByPlaceholder(/Esim\./).fill("tee tästä vihollisesta hieman kovempi, nosta maxHp 70:een")
await page.getByRole("button", { name: "Esikatsele muutos" }).click()
await page.waitForSelector("text=Suunnitellut muutokset:", { timeout: 30000 }).catch(() => {})
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/hwstudio-3-preview.png" })

const riskText = await page.locator("text=/^(LOW|MEDIUM|HIGH|CRITICAL)$/").first().textContent().catch(() => null)
console.log("risk tier:", riskText)

const rejectedVisible = await page.locator("text=Näitä ei voitu tehdä automaattisesti").isVisible().catch(() => false)
console.log("rejected ops shown:", rejectedVisible)

const applyBtn = page.getByRole("button", { name: /Vahvista ja sovella/ })
const applyEnabled = await applyBtn.isEnabled().catch(() => false)
console.log("apply button enabled:", applyEnabled)

if (applyEnabled) {
  await applyBtn.click()
  await page.waitForSelector("text=/Sovelletaan/", { timeout: 5000 }).catch(() => {})
  await page.waitForSelector("text=Historia", { timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/hwstudio-4-applied.png" })

  // expand first history row
  const firstHistoryRow = page.locator("div.rounded-xl.border").filter({ hasText: "tee tästä" }).first()
  if (await firstHistoryRow.count()) {
    await firstHistoryRow.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: "/tmp/hwstudio-5-history-expanded.png" })

    const revertBtn = page.getByRole("button", { name: "Peruuta" })
    if (await revertBtn.count()) {
      page.once("dialog", d => d.accept())
      await revertBtn.first().click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: "/tmp/hwstudio-6-reverted.png" })
    }
  }
}

console.log("\n=== errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")

await browser.close()
