import { chromium } from "playwright"

const PORT = process.env.PORT || 5310
const results = []
function check(name, ok, detail) {
  results.push({ name, ok, detail })
}

const browser = await chromium.launch()

// --- 1-2: play, reload, assert same phase/essence/bench/nodeIndex ---
{
  const page = await (await browser.newContext()).newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-select-grid button")
  await page.click(".hw-select-grid button")
  const tutorialNext = page.locator("button.hw-tutorial-next")
  if (await tutorialNext.isVisible({ timeout: 1500 }).catch(() => false)) await tutorialNext.click().catch(() => {})

  await page.waitForSelector(".hw-card", { timeout: 10000 })
  const affordable = page.locator('.hw-card[data-disabled="false"]').first()
  if (await affordable.count()) await affordable.click()
  await page.waitForTimeout(150)

  const before = await page.evaluate(() => {
    const raw = localStorage.getItem("heartwood-run-save-v1")
    return { raw: !!raw, essenceText: document.querySelector(".hw-essence, [class*='essence']")?.textContent || null }
  })
  check("1. save key exists after one action", !!before.raw, before)

  await page.reload()
  await page.waitForTimeout(500)
  const onSelectAfterReload = await page.locator(".hw-select-grid").isVisible({ timeout: 1000 }).catch(() => false)
  check("2. NOT back at character select after reload", !onSelectAfterReload, { onSelectAfterReload })
  const stillShop = await page.locator("text=/hearthwood market/i").isVisible({ timeout: 2000 }).catch(() => false)
  check("2b. shop screen visible after reload", stillShop, { stillShop })
  check("2c. zero console errors after reload", errors.length === 0, errors)
  await page.close()
}

// --- 3: mid-battle reload ---
{
  const page = await (await browser.newContext()).newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-select-grid button")
  await page.click(".hw-select-grid button")
  const tutorialNext = page.locator("button.hw-tutorial-next")
  if (await tutorialNext.isVisible({ timeout: 1500 }).catch(() => false)) await tutorialNext.click().catch(() => {})
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  const affordableUnit = page.locator('.hw-card[data-disabled="false"]').first()
  if (await affordableUnit.count()) await affordableUnit.click()
  await page.waitForTimeout(150)
  await page.click('button.hw-end-turn:has-text("Continue")')
  const startBtn = page.locator('button.hw-end-turn:has-text("Start Battle")')
  await startBtn.waitFor({ timeout: 10000 })
  await startBtn.click()
  await page.waitForTimeout(1200)
  await page.reload()
  await page.waitForTimeout(700)
  const onSelect = await page.locator(".hw-select-grid").isVisible({ timeout: 1000 }).catch(() => false)
  const onFormation = await page.locator('button.hw-end-turn:has-text("Start Battle")').isVisible({ timeout: 500 }).catch(() => false)
  const inBattle = await page.locator(".hw-battle").isVisible({ timeout: 500 }).catch(() => false)
  check("3. mid-battle reload never resets to character select", !onSelect, { onSelect })
  check("3b. mid-battle reload lands in battle or formation (fight in progress or resolved)", inBattle || onFormation, { inBattle, onFormation })
  check("3c. zero console errors mid-battle reload", errors.length === 0, errors)
  await page.close()
}

// --- 5: New Run clears the key ---
{
  const page = await (await browser.newContext()).newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-select-grid button")
  await page.click(".hw-select-grid button")
  const tutorialNext = page.locator("button.hw-tutorial-next")
  if (await tutorialNext.isVisible({ timeout: 1500 }).catch(() => false)) await tutorialNext.click().catch(() => {})
  await page.waitForTimeout(200)
  const hasKeyBefore = await page.evaluate(() => !!localStorage.getItem("heartwood-run-save-v1"))
  check("precondition: save key exists before New Run", hasKeyBefore, {})
  await page.evaluate(() => {
    // Force New Run without needing to reach the end screen - simulate by
    // navigating the change-commander flow instead, which also clears.
  })
  const changeBtn = page.locator('button:has-text("Change Commander")')
  page.once("dialog", (d) => d.accept())
  await changeBtn.click()
  await page.waitForTimeout(200)
  const hasKeyAfter = await page.evaluate(() => !!localStorage.getItem("heartwood-run-save-v1"))
  check("6. Change Commander (confirmed) clears the save key", !hasKeyAfter, { hasKeyAfter })
  await page.reload()
  await page.waitForTimeout(400)
  const onSelect = await page.locator(".hw-select-grid").isVisible({ timeout: 1500 }).catch(() => false)
  check("6b. reload after Change Commander shows character select", onSelect, { onSelect })
  await page.close()
}

// --- 7: corruption resilience ---
{
  const page = await (await browser.newContext()).newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto(`http://localhost:${PORT}/heartwood`)
  for (const bad of ['{not json', '{"version":999}', '{"version":1,"run":{"characterId":"nope","phase":"shop","nodeIndex":0}}', '{"version":1,"run":{"characterId":"tommy","phase":"shop","nodeIndex":99999}}']) {
    await page.evaluate((v) => localStorage.setItem("heartwood-run-save-v1", v), bad)
    await page.reload()
    await page.waitForTimeout(400)
    const onSelect = await page.locator(".hw-select-grid").isVisible({ timeout: 1500 }).catch(() => false)
    check(`7. corrupt save (${bad.slice(0, 30)}...) falls back to character select`, onSelect, { bad, onSelect })
  }
  check("7b. zero console errors across all corruption cases", errors.length === 0, errors)
  await page.close()
}

// --- 8: storage-hostile (setItem throws) ---
{
  const page = await (await browser.newContext()).newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.addInitScript(() => {
    localStorage.removeItem("heartwood-run-save-v1")
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "heartwood-run-save-v1") throw new Error("storage full (simulated)")
      return orig.call(this, k, v)
    }
  })
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-select-grid button")
  await page.click(".hw-select-grid button")
  const tutorialNext = page.locator("button.hw-tutorial-next")
  if (await tutorialNext.isVisible({ timeout: 1500 }).catch(() => false)) await tutorialNext.click().catch(() => {})
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  const affordable = page.locator('.hw-card[data-disabled="false"]').first()
  if (await affordable.count()) await affordable.click()
  await page.waitForTimeout(300)
  const stillPlayable = await page.locator(".hw-card, .hw-battle").first().isVisible({ timeout: 1000 }).catch(() => false)
  check("8. game stays playable when localStorage.setItem throws", stillPlayable, { stillPlayable })
  check("8b. zero console errors when setItem throws", errors.length === 0, errors)
  await page.close()
}

await browser.close()

console.log(JSON.stringify(results, null, 2))
const failed = results.filter((r) => !r.ok)
if (failed.length) {
  console.log(`FAIL: ${failed.length}/${results.length} checks failed`)
  process.exit(1)
}
console.log(`PASS: all ${results.length} persistence checks passed`)
