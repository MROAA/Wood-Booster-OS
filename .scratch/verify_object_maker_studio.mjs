import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"

// Object Maker - the Studio form end to end, WITHOUT touching the live
// Patchbay (port 3001 = the main checkout's server, which would write
// Marc's real files + the shared hearthwood-patchbay/live branch):
//   1. the real form in the browser; every 3001 call is mocked/blocked,
//      the /preview request body (the edit the form would apply) captured;
//   2. that exact edit through the real scripts/hearthwood-apply-edit.mjs;
//   3. the result written into THIS worktree, the game loads the new
//      object (tooltip/board), then the file is restored.
const PORT = process.env.PORT || 5445
const DATA = "src/data/heartwood/battleObjects.js"
const original = fs.readFileSync(DATA, "utf8")
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const e = out.errors
const c = (ok, label) => { if (!ok) e.push(label) }

const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
let previewBody = null
let blockedWrites = 0
await ctx.route("http://localhost:3001/**", async (route) => {
  const req = route.request()
  const url = req.url()
  if (url.includes("/hearthwood-patchbay/entity/battleObjects/")) {
    const id = url.split("/").pop()
    return id === "wasp-nest" ? route.fulfill({ json: { id, name: "Wasp nest" } }) : route.fulfill({ status: 404, json: { error: "not found" } })
  }
  if (url.endsWith("/hearthwood-patchbay/preview") && req.method() === "POST") {
    previewBody = req.postDataJSON()
    return route.fulfill({ status: 201, json: { patchId: "test", risk: { tier: "MEDIUM", reasons: [] }, diff: "+ (mocked)", targetFiles: [DATA], previewUrl: null, plannedEdits: previewBody.edits, rejectedOps: [] } })
  }
  if (req.method() !== "GET") {
    blockedWrites++
    return route.abort()
  }
  return route.fulfill({ status: 404, json: { error: "offline in test" } })
})
const page = await ctx.newPage()
page.on("pageerror", (err) => errs.push(String(err)))

await page.goto(`http://localhost:${PORT}/hearthwood-studio?type=battleObjects`, { waitUntil: "domcontentloaded" })
await page.locator('[data-testid="add-battle-object-open"]').waitFor({ timeout: 20000 })
const tryHref = await page.locator('[data-testid="battle-object-try"]').getAttribute("href")
await page.locator('[data-testid="add-battle-object-open"]').click()
const form = page.locator('[data-testid="add-battle-object-form"]')

// A built-in name and an existing name are refused in plain English.
await page.locator('[data-testid="battle-object-name"]').fill("Tree")
await page.locator('[data-testid="battle-object-preview-button"]').click()
const builtinMsg = await form.locator(".text-red-300").first().textContent()
await page.locator('[data-testid="battle-object-name"]').fill("Wasp nest")
await page.locator('[data-testid="battle-object-preview-button"]').click()
await page.waitForTimeout(300)
const dupMsg = await form.locator(".text-red-300").first().textContent()

// The real one: a healing lantern shrine.
await page.locator('[data-testid="battle-object-name"]').fill("Lantern Shrine")
await form.locator("button", { hasText: "🏮" }).click()
await page.locator('[data-testid="battle-object-effect"]').selectOption("healBurst")
const selects = form.locator("select")
await selects.nth(0).selectOption("6") // toughness: Sturdy
await selects.nth(2).selectOption("6") // strength: Strong
await selects.nth(3).selectOption("moss") // leaves
await selects.nth(4).selectOption("2") // 2 per battle
await form.locator("input").nth(1).fill("Old lanterns still glowing in the moss.")
const previewText = await page.locator('[data-testid="battle-object-preview"]').textContent()
const effectLine = await form.locator(".leading-snug").textContent()
await page.screenshot({ path: new URL("./shots/object_maker_form.png", import.meta.url).pathname })
await page.locator('[data-testid="battle-object-preview-button"]').click()
await page.waitForTimeout(600)
const panelShown = await page.getByText(/Apply|Hyväksy|Discard|Hylkää/i).count()
await page.screenshot({ path: new URL("./shots/object_maker_form_preview.png", import.meta.url).pathname })

out.form = { tryHref, builtinMsg, dupMsg, previewText, effectLine, panelShown, blockedWrites, previewBody }
c(tryHref === "/heartwood-tactics?objects=1", "s1 try-it link")
c(builtinMsg?.includes("built-in") && dupMsg?.includes("already have"), "s2 friendly name errors")
c(previewText?.includes("🏮") && effectLine?.includes("heals 6 HP"), "s3 live preview card")
const edit = previewBody?.edits?.[0]
c(previewBody?.type === "battleObjects" && previewBody.entityId === "lantern-shrine" && edit?.op === "addKey" && edit.key === "lantern-shrine" && edit.path[0] === "BATTLE_OBJECTS", "s4 addKey edit sent")
c(panelShown > 0, "s5 preview panel shows")

// 2. The exact edit through the Studio's own edit script.
let applied = null
if (edit) {
  const res = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-apply-edit.mjs"], { input: JSON.stringify({ filePath: DATA, exportName: "BATTLE_OBJECTS", edits: previewBody.edits }) }).toString())
  applied = { ok: res.ok, rejected: res.rejected }
  c(res.ok && !res.rejected?.length && res.proposedCode.includes('"lantern-shrine": {'), "s6 apply-edit script accepts it")
  // 3. Into this worktree's file -> the game picks it up.
  if (res.ok) {
    fs.writeFileSync(DATA, res.proposedCode)
    try {
      const read = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-read-entities.mjs", "--type", "battleObjects"]).toString())
      const ent = read.entities.find((x) => x.id === "lantern-shrine")
      out.studioReads = ent && Object.fromEntries(Object.entries(ent.fields).map(([k, v]) => [k, v.value]))
      c(out.studioReads?.hp === 6 && out.studioReads.onBreak === "healBurst" && out.studioReads.power === 6 && out.studioReads.perBattle === 2 && out.studioReads.icon === "🏮", "s7 Studio list reads the new object")
      const game = await browser.newContext({ viewport: { width: 1536, height: 864 } }).then((x) => x.newPage())
      game.on("pageerror", (err) => errs.push(String(err)))
      await game.goto(`http://localhost:${PORT}/heartwood-tactics?objects=1`, { waitUntil: "domcontentloaded" })
      await game.waitForSelector(".hwt-board", { timeout: 20000 })
      await game.waitForTimeout(800)
      const g = await game.evaluate(async () => {
        const O = await import("/src/services/heartwood/tacticsObjects.js")
        const cell = document.querySelector('.hwt-cell[data-object="lantern-shrine"]')
        return { def: O.OBJECTS["lantern-shrine"], onBoard: !!cell, title: cell?.getAttribute("title") || null, sprite: cell?.querySelector("[data-custom-object] text")?.textContent || null }
      })
      out.game = g
      c(g.def?.custom && g.def.hp === 6 && g.def.power === 6 && g.def.leaves === "moss" && g.onBoard && g.sprite === "🏮" && g.title?.startsWith("Lantern Shrine (6/6 HP)") && g.title.includes("heals 6 HP"), "s8 game loads + shows it")
      await game.close()
    } finally {
      fs.writeFileSync(DATA, original)
    }
  }
}
out.applied = applied
out.restored = fs.readFileSync(DATA, "utf8") === original
c(out.restored, "s9 data file restored")
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
