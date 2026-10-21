import { chromium } from "playwright"

// Sprint 4 / PRD V1.0 - Hearthwood Dev Studio workstation: three panels,
// tabs, Studio Home, Spacemonkey side panel, unsaved-work warning, restore.
// The page runs from THIS worktree's Vite (PORT). Reads (GET) go to the
// live backend on :3001; every write is mocked (/preview, Spacemonkey) or
// blocked, so no game file can change. Screenshots go to SHOTS.
const PORT = process.env.PORT || 5447
const SHOTS = process.env.SHOTS || "."
const browser = await chromium.launch()
const errors = []
const lines = []
const check = (ok, label, data) => {
  const line = `${ok ? "ok  " : "FAIL"} ${label}${data === undefined ? "" : ` ${JSON.stringify(data)}`}`
  lines.push(line)
  console.log(line)
  if (!ok) errors.push(label)
}

const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
let blocked = 0
let previews = 0
const devCalls = []
const port3002 = []
const PLAN = {
  success: true, status: "plan_ready", explanation: "Nykyinen toteutus: onGuard antaa resurssia.", executionApproved: false,
  files: [{ action: "modify", filePath: "src/services/heartwood/tacticsMana.js", reason: "onGuard rajaa kertymän" }],
  planQuality: {
    requiredChanges: [{ action: "modify", filePath: "src/services/heartwood/tacticsMana.js", reason: "onGuard rajaa kertymän", symbols: ["onGuard"] }],
    followUps: ["näytä kertymä käyttöliittymässä"],
    dependencyImpact: { symbols: [{ symbol: "onGuard", filePath: "src/services/heartwood/tacticsMana.js", callSites: [{}], affectedFiles: ["src/services/heartwood/tacticsEngine.js"], interfaceRisk: true }], missingRegressionTests: ["src/services/heartwood/tacticsMana.js: onGuard"], scope: { filesScanned: 274, limits: "Vain sallitut lähdehakemistot." } },
    checks: [{ id: "files-justified", status: "verified", detail: "ok" }],
  },
}
await ctx.route("http://127.0.0.1:3002/**", route => { port3002.push(route.request().url()); return route.abort() })
await ctx.route("http://localhost:3001/**", route => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/preview")) {
    previews += 1
    return route.fulfill({ status: 201, json: { patchId: "t1", risk: { tier: "LOW", allowedModes: ["live"], reasons: [] }, diff: "+ (mocked)", targetFiles: [], previewUrl: null, plannedEdits: [], rejectedOps: [] } })
  }
  if (req.method() === "POST" && req.url().includes("/hearthwood-dev/")) {
    const endpoint = req.url().split("/hearthwood-dev/")[1]
    const body = req.postDataJSON()
    devCalls.push({ endpoint, prompt: body.prompt })
    if (endpoint === "route") {
      const skill = /suunnittele/i.test(body.prompt) ? "change-planning" : "code-analysis"
      return route.fulfill({ json: { success: true, matched: true, apiReady: true, skill: { id: skill } } })
    }
    if (endpoint === "analyze" && /ESTÄ/.test(body.prompt)) {
      return route.fulfill({ status: 422, json: { success: false, error: "Lähdetarkistus epäonnistui. AI-vastausta ei näytetä.", reliability: { issues: [{ code: "EVIDENCE_COUNT" }] } } })
    }
    if (endpoint === "analyze") return route.fulfill({ json: {
      success: true,
      answer: "Funktion onGuard määritelmä löytyy (vanha luettelo).",
      unverifiedInterpretation: "VALHE: testit kattavat kaiken",
      verifiedExplanation: { status: "VERIFIED_FACTS", sections: {
        summary: "**Lyhyesti**\n- `attackUnit` käyttää löydettyjä osia: `onGuard` (tacticsEngine.js:2428).",
        details: "**`onGuard`** (tacticsMana.js, rivit 1004–1010)\n- Lopettaa muuttamatta mitään, jos `!manaOn(state)` (rivi 1005)",
        coverage: "**Testikattavuus**\n- Suoritettuja testejä: ei yhtään – tämä analyysi ei aja testejä.",
        uncertainties: "**Epävarmuudet**\n- attackUnit: funktiosta näytetään vain todennetut kutsurivit.",
      } },
    } })
    if (endpoint === "plan") return route.fulfill({ json: PLAN })
  }
  if (req.method() !== "GET") { blocked += 1; return route.abort() }
  return route.continue()
})

const page = await ctx.newPage()
page.on("pageerror", err => errors.push(`pageerror: ${err}`))
const go = async (qs = "") => {
  await page.goto(`http://localhost:${PORT}/hearthwood-studio${qs}`, { waitUntil: "domcontentloaded" })
  await page.locator('[data-testid="studio-workspace"]').waitFor({ timeout: 30000 })
  await page.waitForTimeout(600)
}
const tabTitles = () => page.locator('[data-testid="workspace-tabs"] .hws-tab-title').allTextContents()
const activeTitle = () => page.locator('[data-testid="workspace-tabs"] .hws-tab.is-active .hws-tab-title').textContent()
const visiblePanel = 'section[role="tabpanel"]:not([hidden])'
const HOME = "Studion etusivu"
const QA = "Testaus ja QA"

// --- fresh start: three panels ------------------------------------------
await go()
await page.evaluate(() => localStorage.clear())
await go()
check(JSON.stringify(await tabTitles()) === JSON.stringify([HOME]), "fresh start: only the pinned Studio Home tab", await tabTitles())
const box = sel => page.locator(sel).boundingBox()
const nav = await box('[data-testid="workspace-nav"]')
const aside = await box('[data-testid="assistant-panel"]')
check(nav && Math.abs(nav.width - 220) <= 2, "left navigation ~220 px", nav?.width)
check(aside && Math.abs(aside.width - 380) <= 2, "Spacemonkey panel ~380 px on the right", aside?.width)
check(nav.x < aside.x, "navigation left of Spacemonkey")
check(await page.locator('[data-testid="spacemonkey-assistant"] img').getAttribute("src").then(src => /Spacemonkey/i.test(src)), "original Spacemonkey avatar")
check(await page.locator('[data-testid="continue-none"]').isVisible(), "Continue developing: honest empty state")
await page.locator('[data-testid="overview-changes"] .hws-stat-value').waitFor({ timeout: 15000 })
const overview = await page.locator('[data-testid="project-overview"]').innerText()
check(/pelissä/.test(overview) && /kohdetta \d+ listassa/.test(overview), "Project overview shows real counts (Finnish)", overview.replace(/\s+/g, " ").slice(0, 260))
check(!/Ei saatavilla/.test(overview), "every overview source answered")
const suggestions = await page.locator('[data-testid="spacemonkey-suggestions"]').innerText()
check(/Havainto/.test(suggestions) || /Ei ehdotuksia/.test(suggestions), "suggestions show their real observation (or say there are none)", suggestions.replace(/\s+/g, " ").slice(0, 200))
await page.screenshot({ path: `${SHOTS}/studio_home_1920.png` })

// --- navigation + tabs ---------------------------------------------------
await page.locator('[data-testid="nav-room-heroes"]').click()
await page.waitForTimeout(800)
check((await tabTitles()).length === 2 && (await activeTitle()) === "Heroes", "left nav opens Heroes in a new tab", await tabTitles())
check(await page.locator('[data-testid="nav-room-heroes"]').getAttribute("aria-current") === "page", "nav marks the active workspace")
await page.locator('[data-testid="nav-tool-qa"]').click()
await page.waitForTimeout(800)
check(await page.locator('[data-testid="studio-qa"]').isVisible() && (await activeTitle()) === QA, "Testing & QA opens with the real checks")
await page.locator('[data-testid="nav-room-heroes"]').click()
await page.waitForTimeout(400)
check((await tabTitles()).length === 3 && (await activeTitle()) === "Heroes", "re-opening Heroes activates its existing tab", await tabTitles())

// --- a tab keeps its state; Spacemonkey keeps its draft and sees context ---
await page.locator(`${visiblePanel} [data-card]`).first().waitFor({ timeout: 20000 })
const heroId = await page.locator(`${visiblePanel} [data-card]`).first().getAttribute("data-card")
await page.locator(`${visiblePanel} [data-card]`).first().click()
await page.locator(`${visiblePanel} [data-testid="entity-title"]`).waitFor({ timeout: 20000 })
const heroName = (await page.locator(`${visiblePanel} [data-testid="entity-title"]`).textContent()).trim()
await page.waitForTimeout(300)
check((await activeTitle()) === heroName, "tab title follows the picked hero", { title: await activeTitle(), heroName })
const contextText = await page.locator('[data-testid="assistant-context"]').innerText()
check(contextText.includes("Heroes") && contextText.includes(heroName), "Spacemonkey sees the open editor and the picked hero", contextText)
await page.locator('[data-testid="assistant-input"]').fill("luonnos joka ei saa kadota")
await page.getByRole("tab", { name: QA }).click()
check(!(await page.locator('[data-testid="assistant-context"]').innerText()).includes(heroName), "context follows the active tab")
await page.getByRole("tab", { name: heroName }).click()
check((await page.locator('[data-testid="assistant-input"]').inputValue()) === "luonnos joka ei saa kadota", "Spacemonkey draft survives tab switches")
check((await page.locator(`${visiblePanel} [data-testid="entity-title"]`).textContent()).trim() === heroName, "switching tabs keeps the open hero")

// --- Spacemonkey: analysis, blocked, plan --------------------------------
await page.locator('[data-testid="assistant-input"]').fill("Miten tämän sankarin kyvyt toimivat?")
await page.locator('[data-testid="assistant-send"]').click()
await page.waitForFunction(() => document.querySelector('[data-testid="assistant-stage"]')?.dataset.stage === "done", null, { timeout: 15000 })
const routeCall = devCalls.find(c => c.endpoint === "route")
const analyzeCall = devCalls.find(c => c.endpoint === "analyze")
check(routeCall && !routeCall.prompt.includes("Studion konteksti"), "routing sees only the user's words", routeCall?.prompt)
check(analyzeCall && analyzeCall.prompt.includes(`units/${heroId}`), "analysis receives the real editor context", analyzeCall?.prompt)
const lastMessage = page.locator('[data-testid="assistant-log"] .hws-msg').last()
check((await lastMessage.innerText()).includes("käyttää löydettyjä osia"), "verified explanation is the main answer")
check(!(await lastMessage.innerText()).includes("vanha luettelo"), "the old function list is not the main answer")
check(await lastMessage.locator('[data-testid="explanation-coverage"]').isVisible(), "test coverage is visible")
check(!(await lastMessage.locator('[data-testid="explanation-details"]').evaluate(el => el.open)), "details folded by default")
check(!(await lastMessage.locator('[data-testid="explanation-uncertainties"]').evaluate(el => el.open)), "uncertainties folded by default")
check(!(await page.locator('[data-testid="assistant-panel"]').innerText()).includes("VALHE"), "the unverified model interpretation is never shown")
await page.locator('[data-testid="assistant-input"]').fill("ESTÄ tämä")
await page.locator('[data-testid="assistant-send"]').click()
await page.waitForFunction(() => document.querySelector('[data-testid="assistant-stage"]')?.dataset.stage === "blocked", null, { timeout: 15000 })
check(/Estetty turvallisuustarkistuksessa/.test(await page.locator('[data-testid="assistant-stage"]').innerText()), "a gate block is shown as blocked, not as an answer")
await page.locator('[data-testid="assistant-input"]').fill("Suunnittele Guardianille raja")
await page.locator('[data-testid="assistant-send"]').click()
await page.waitForFunction(() => document.querySelector('[data-testid="assistant-stage"]')?.dataset.stage === "approval", null, { timeout: 15000 })
const planText = await page.locator('[data-testid="assistant-plan"]').last().innerText()
check(/ei toteutettu/i.test(planText) && /tacticsMana\.js/.test(planText) && /Jatkoideat/i.test(planText) && /Testitarpeet/i.test(planText), "plan card: files, follow-ups, tests, never 'done'", planText.replace(/\s+/g, " ").slice(0, 240))
check(!(await page.locator('[data-testid="assistant-stage"]').innerText()).match(/Toteutetaan|Testataan|Valmis/), "no stage claims the plan was carried out")
await page.screenshot({ path: `${SHOTS}/studio_editor_1920.png` })

// --- resize Spacemonkey --------------------------------------------------
await page.locator('[data-testid="assistant-resizer"]').focus()
for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowLeft")
const wider = (await box('[data-testid="assistant-panel"]')).width
check(Math.abs(wider - 428) <= 2, "keyboard widens the Spacemonkey panel", wider)

// --- unsaved work ----------------------------------------------------------
const nl = page.locator(`${visiblePanel} textarea`).last()
await nl.fill("make this hero a little stronger")
await nl.locator("xpath=following::button[1]").click()
await page.waitForTimeout(800)
check(previews === 1, "preview request went out (mocked)", previews)
check(await page.locator(".hws-tab.is-active .hws-tab-dirty").count() === 1, "tab shows the unsaved-preview mark")
await page.locator(".hws-tab.is-active [data-testid=workspace-tab-close]").click()
check(await page.locator('[data-testid="unsaved-close-dialog"]').isVisible(), "closing asks first")
await page.locator('[data-testid="unsaved-close-cancel"]').click()
check((await tabTitles()).includes(heroName), "cancel keeps the tab")
await page.locator(".hws-tab.is-active [data-testid=workspace-tab-close]").click()
await page.locator('[data-testid="unsaved-close-confirm"]').click()
await page.waitForTimeout(300)
check(!(await tabTitles()).includes(heroName), "confirm closes it", await tabTitles())

// --- keyboard on tabs ------------------------------------------------------
await page.locator('[data-testid="workspace-tab-home"]').focus()
await page.keyboard.press("ArrowRight")
check(await page.evaluate(() => document.activeElement?.getAttribute("role")) === "tab" && (await activeTitle()) !== HOME, "arrow keys move between tabs")

// --- restore after restart -------------------------------------------------
const before = await tabTitles()
const beforeActive = await activeTitle()
await go()
check(JSON.stringify(await tabTitles()) === JSON.stringify(before), "open tabs come back after reload", { before, after: await tabTitles() })
check((await activeTitle()) === beforeActive, "active tab comes back", await activeTitle())
check(Math.abs((await box('[data-testid="assistant-panel"]')).width - 428) <= 2, "Spacemonkey width comes back")
await page.locator('[data-testid="workspace-tab-home"]').click()
check(await page.locator('[data-testid="continue-last-editor"]').isVisible(), "Continue developing offers the last editor")

// --- hostile storage + old deep link ---------------------------------------
await page.evaluate(() => {
  localStorage.setItem("hws.workspace.v1", '{"v":1,"tabs":[{"location":{"view":"<img src=x onerror=alert(1)>"}},{"location":{"view":"single","type":"units","id":"' + "x".repeat(900) + '"}}],"active":0}')
  localStorage.setItem("hws.layout.v1", '{"assistantWidth":99999,"navCollapsed":"yes"}')
})
await go()
check(JSON.stringify(await tabTitles()) === JSON.stringify([HOME, "Heroes"]), "invalid stored tabs are dropped", await tabTitles())
check((await box('[data-testid="assistant-panel"]')).width <= 600 && (await box('[data-testid="workspace-nav"]')).width > 100, "invalid layout values are clamped / ignored")
await page.evaluate(() => localStorage.setItem("hws.workspace.v1", "{broken"))
await go(`?type=units&id=${heroId}`)
check((await tabTitles()).length === 2 && (await activeTitle()) === heroName, "broken storage ignored; old deep link opens its tab", await tabTitles())

// --- unsaved form text (never previewed) is protected ----------------------
await page.locator('[data-testid="nav-room-heroes"]').click()
await page.waitForTimeout(600)
await page.locator(`${visiblePanel} [data-card]`).nth(1).click()
await page.locator(`${visiblePanel} [data-testid="entity-title"]`).waitFor({ timeout: 20000 })
const formHero = (await page.locator(`${visiblePanel} [data-testid="entity-title"]`).textContent()).trim()
// the hero's own Name field (not the list's search box): the input whose value is the name
const nameIndex = await page.locator(`${visiblePanel} input`).evaluateAll((els, name) => els.findIndex(el => el.value === name), formHero)
const nameInput = page.locator(`${visiblePanel} input`).nth(nameIndex)
await nameInput.fill(`${formHero} (typed, not saved)`)
await page.waitForTimeout(300)
check(await page.locator(".hws-tab.is-active .hws-tab-dirty").count() === 1, "typed form text marks the tab (no preview needed)")
const askBeforeLeaving = () => page.evaluate(() => {
  const event = new Event("beforeunload", { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
})
check(await askBeforeLeaving(), "leaving the page with unsaved form text asks first (beforeunload is cancelled)")
const P = page
check((await P.locator(`${visiblePanel} input`).nth(nameIndex).inputValue()).includes("typed, not saved"), "the typed text is still there")

// a tab with unsaved work is never unloaded; clean ones re-open where they were
for (const sel of ["nav-room-skills", "nav-room-enemies", "nav-room-battlefield", "nav-room-lore", "nav-room-market", "nav-tool-dashboard"]) {
  await P.locator(`[data-testid="${sel}"]`).click()
  await P.waitForTimeout(500)
}
await P.getByRole("tab", { name: formHero }).click()
await P.waitForTimeout(400)
check((await P.locator(`${visiblePanel} input`).nth(nameIndex).inputValue()).includes("typed, not saved"), "unsaved tab kept in memory while 6 others opened")
const unloaded = await P.locator('section[role="tabpanel"][data-mounted="no"]').count()
check(unloaded > 0, "older clean tabs are unloaded to save memory", unloaded)
await P.getByRole("tab", { name: "Taidot ja mana" }).or(P.getByRole("tab", { name: /Class|Skill/ })).first().click().catch(() => {})
await P.getByRole("tab", { name: heroName }).click().catch(() => {})
await P.waitForTimeout(800)
if (await P.getByRole("tab", { name: heroName }).count()) {
  await P.locator(`${visiblePanel} [data-testid="entity-title"]`).waitFor({ timeout: 20000 })
  check((await P.locator(`${visiblePanel} [data-testid="entity-title"]`).textContent()).trim() === heroName, "an unloaded tab re-opens at the same entry")
}
// discard the typed text so the next steps start clean
await P.getByRole("tab", { name: formHero }).click()
await P.locator(".hws-tab.is-active [data-testid=workspace-tab-close]").click()
check(await P.locator('[data-testid="unsaved-close-dialog"]').isVisible(), "closing a tab with typed text asks first")
await P.locator('[data-testid="unsaved-close-confirm"]').click()

// --- StoryWriter keeps its own drafts across a reload ------------------------
await P.locator('[data-testid="nav-room-story"]').click()
await P.locator(`${visiblePanel} [data-card]`).first().waitFor({ timeout: 20000 })
await P.locator(`${visiblePanel} [data-card]`).first().click()
await P.locator(`${visiblePanel} [data-testid="story-writer"]`).waitFor({ timeout: 20000 })
const line = P.locator(`${visiblePanel} [data-testid="story-writer"] textarea`).first()
const original = await line.inputValue()
await line.fill(`${original} [luonnos]`)
await P.waitForTimeout(500)
await P.reload({ waitUntil: "domcontentloaded" })
await P.locator(`${visiblePanel} [data-testid="story-writer"]`).waitFor({ timeout: 30000 })
check((await P.locator(`${visiblePanel} [data-testid="story-writer"] textarea`).first().inputValue()).endsWith("[luonnos]"), "StoryWriter draft comes back after a reload in its tab")
check(await P.locator(`${visiblePanel} [data-testid="story-writer-restored"]`).count() === 1, "and says it was restored")
await P.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("hw-story-draft:")).forEach(k => localStorage.removeItem(k)))

const boxP = sel => P.locator(sel).boundingBox()
// --- smaller screen: nothing disappears ------------------------------------
await P.setViewportSize({ width: 1280, height: 800 })
await P.waitForTimeout(300)
check((await boxP('[data-testid="workspace-nav"]')).width <= 60, "narrow: navigation collapses to runes")
check(await P.locator('[data-testid="assistant-input"]').isVisible(), "narrow: Spacemonkey still reachable")
await P.locator('[data-testid="toggle-assistant"]').click()
check(await P.locator('[data-testid="assistant-panel"]').isHidden(), "Spacemonkey can be hidden")
await P.locator('[data-testid="toggle-assistant"]').click()
check(await P.locator('[data-testid="assistant-log"]').innerText().then(text => text.length > 0), "and comes back with its conversation")
await P.screenshot({ path: `${SHOTS}/studio_1280.png` })

check(port3002.length === 0, "nothing goes to the dead port 3002", port3002)
check(blocked === 0, "no unexpected write request", blocked)
console.log(errors.length ? `\nFAILED: ${errors.length}\n${errors.join("\n")}` : "\nALL OK")
await browser.close()
process.exit(errors.length ? 1 : 0)
