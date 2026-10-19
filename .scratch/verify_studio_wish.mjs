import { chromium } from "playwright"

// Hearthwood HQ "What do you want to make or change today?" end to end.
// Reads go to the real Studio API (API_PORT, default 3001); EVERY write is
// mocked or blocked - "Add to the development list" is captured, not saved.
const PORT = process.env.PORT || 5448
const API_PORT = process.env.API_PORT || 3001
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
let taskBody = null
let blocked = 0
await ctx.route("http://localhost:3001/**", (route) => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/heartwood/tasks")) {
    taskBody = req.postDataJSON()
    return route.fulfill({ status: 201, json: { id: 999, ...taskBody } })
  }
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue({ url: req.url().replace("localhost:3001", `localhost:${API_PORT}`) })
})
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
const home = async () => {
  await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
  await page.locator('[data-testid="studio-wish-input"]').waitFor({ timeout: 20000 })
}
const ask = async (text) => {
  await page.locator('[data-testid="studio-wish-input"]').fill(text)
  await page.locator('[data-testid="studio-wish-ask"]').click()
  await page.locator('[data-testid="studio-wish-answer"]').waitFor({ timeout: 15000 })
  await page.waitForTimeout(150)
  return { kind: await page.locator('[data-testid="studio-wish-answer"]').getAttribute("data-kind"), text: await page.locator('[data-testid="studio-wish-answer"]').textContent() }
}
const bar = () => page.locator('[data-testid="studio-room-bar"]').textContent().catch(() => null)

// 1. A picture wish opens Tommy, in the Heroes room, with the hint.
await home()
const w1 = await ask("vaihda Tommyn kuva")
await page.screenshot({ path: new URL("./shots/studio_wish_open.png", import.meta.url).pathname })
await page.locator('[data-testid="studio-wish-go"]').click()
await page.waitForTimeout(900)
w1.bar = await bar()
w1.title = await page.locator("section .text-sm.font-semibold").first().textContent().catch(() => null)
out.w1 = w1
c(w1.kind === "open" && w1.text.includes("Tommy") && w1.bar?.includes("Heroes") && w1.bar.includes("picture"), "w1 picture wish opens the hero", w1)

// 2. A change wish opens the enemy with the words already in the AI box.
await home()
const w2 = await ask("make the Rotwood Husk tougher")
await page.locator('[data-testid="studio-wish-go"]').click()
await page.waitForTimeout(1200)
w2.bar = await bar()
w2.aiBox = await page.locator("textarea").evaluateAll((els) => els.map((el) => el.value).find((v) => v.includes("tougher")) || null)
out.w2 = w2
c(w2.kind === "change" && w2.text.includes("nothing is saved before you press") && w2.bar?.includes("Enemies") && w2.aiBox === "make the Rotwood Husk tougher", "w2 change wish -> AI box prefilled", w2)

// 3. A form wish opens the form already open.
await home()
const w3 = await ask("tee uusi tapahtuma metsään")
await page.locator('[data-testid="studio-wish-go"]').click()
await page.waitForTimeout(800)
w3.form = await page.getByText("New Map Event", { exact: true }).count()
out.w3 = w3
c(w3.kind === "add" && w3.form === 1, "w3 new event -> form open", w3)

// 4. Something the Studio can't do: honest limits + the development list.
await home()
const w4 = await ask("luo uusi pelattava metsänhenkiluokka jolla on jäätaikoja")
await page.locator('[data-testid="studio-wish-add"]').click()
await page.locator('[data-testid="studio-wish-saved"]').waitFor({ timeout: 5000 }).catch(() => {})
w4.saved = await page.locator('[data-testid="studio-wish-saved"]').textContent().catch(() => null)
await page.screenshot({ path: new URL("./shots/studio_wish_limits.png", import.meta.url).pathname })
out.w4 = { ...w4, taskBody }
c(w4.kind === "needsCode" && w4.text.includes("can't do a new hero class yet") && w4.text.includes("38 existing classes") && w4.saved?.includes("#999") && taskBody?.category === "studio-request" && taskBody.status === "backlog" && taskBody.title.includes("metsänhenkiluokka"), "w4 limits told + request listed", out.w4)

// 5. Colours -> Look & Colours; nonsense -> says it didn't understand.
await home()
const w5 = await ask("muuta pelin värejä lämpimämmiksi")
await page.locator('[data-testid="studio-wish-go"]').click()
await page.waitForTimeout(600)
w5.bar = await bar()
await home()
const w6 = await ask("hmm")
out.w5 = w5
out.w6 = w6
c(w5.kind === "view" && w5.bar?.includes("Look & Colours"), "w5 colours", w5)
c(w6.kind === "unclear" && w6.text.includes("couldn't tell"), "w6 unclear is said plainly", w6)

out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 && blocked === 0 ? "ALL PASS" : "FAIL")
