import { chromium } from "playwright"

// Hearthwood HQ - the Studio's rooms front door (studioRooms.js /
// StudioHome.jsx) + the Story Writer. The page's hard-coded API
// (localhost:3001 = the MAIN checkout's server) is rerouted to API_PORT,
// a server started from THIS worktree; reads only - every POST is
// mocked (/preview, its body captured) or blocked, so no file changes.
const PORT = process.env.PORT || 5446
const API_PORT = process.env.API_PORT || 3446
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }

const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
let blocked = 0
let previewBody = null
await ctx.route("http://localhost:3001/**", (route) => {
  const req = route.request()
  if (req.method() === "POST" && req.url().endsWith("/hearthwood-patchbay/preview")) {
    previewBody = req.postDataJSON()
    return route.fulfill({ status: 201, json: { patchId: "t", risk: { tier: "MEDIUM", allowedModes: ["live"], reasons: [] }, diff: "+ (mocked)", targetFiles: [], previewUrl: null, plannedEdits: previewBody.edits, rejectedOps: [] } })
  }
  if (req.method() !== "GET") { blocked++; return route.abort() }
  return route.continue({ url: req.url().replace("localhost:3001", `localhost:${API_PORT}`) })
})
const page = await ctx.newPage()
page.on("pageerror", (err) => errs.push(String(err)))
const go = async (qs = "") => {
  await page.goto(`http://localhost:${PORT}/hearthwood-studio${qs}`, { waitUntil: "domcontentloaded" })
  await page.locator('[data-testid="studio-nav"]').waitFor({ timeout: 20000 })
  await page.waitForTimeout(400)
}
const chips = () => page.locator("button[title]").evaluateAll((els) => els.map((el) => el.textContent.trim()))
// Room cards open their extra buttons on hover, like the game's cards.
const roomAction = async (room, label) => {
  await page.locator(`[data-room="${room}"]`).hover()
  await page.waitForTimeout(350)
  await page.locator(`[data-room="${room}"] button`, { hasText: label }).click()
}
const roomBar = () => page.locator('[data-testid="studio-room-bar"]').textContent().catch(() => null)

// 1. Opens on HQ: 8 rooms, 4 nav buttons, old tabs + history hidden.
await go()
const home = {
  title: await page.getByRole("heading", { name: "Hearthwood HQ" }).textContent(),
  rooms: await page.locator("[data-room]").count(),
  nav: await page.locator('[data-testid="studio-nav"] button').count(),
  moreTools: await page.locator('[data-testid="studio-more-tools"]').count(),
  history: await page.locator('[data-testid="studio-history"]').count(),
  hScroll: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  bottom: await page.evaluate(() => Math.round(document.querySelector('[data-testid="studio-home"]').getBoundingClientRect().bottom)),
}
// Room counts: each card's number = the sum of its lists in /overview.
await page.locator('[data-testid="room-count-heroes"]').waitFor({ timeout: 10000 })
home.counts = await page.evaluate(async () => {
  const { STUDIO_ROOMS } = await import("/src/components/hearthwood-studio/studioRooms.js")
  const overview = await fetch("http://localhost:3001/api/hearthwood-patchbay/overview").then((r) => r.json())
  const by = Object.fromEntries(overview.types.map((t) => [t.type, t.count]))
  return STUDIO_ROOMS.map((room) => {
    const el = document.querySelector(`[data-testid="room-count-${room.id}"]`)
    const shown = el ? Number(el.textContent.replace(/[^0-9]/g, "")) : 0
    return { room: room.id, shown, expected: room.types.reduce((sum, t) => sum + (by[t] || 0), 0) }
  })
})
await page.locator('[data-room="heroes"]').hover()
await page.waitForTimeout(450)
home.heroBreakdown = await page.locator('[data-testid="room-breakdown-heroes"]').evaluate((el) => (Number(getComputedStyle(el).opacity) > 0.5 ? el.textContent : null))
await page.mouse.move(5, 5)
await page.waitForTimeout(300)
const extraShown = () => page.locator('[data-room="story"] .hw-reveal-more').last().evaluate((el) => Number(getComputedStyle(el).opacity) > 0.5 && el.getBoundingClientRect().height > 10)
home.storyBeforeHover = await extraShown()
await page.locator('[data-room="story"]').hover()
await page.waitForTimeout(450)
home.storyAfterHover = await extraShown()
home.purpose = await page.locator('[data-testid="studio-purpose"]').textContent()
await page.locator('[data-testid="studio-purpose"] button').click()
home.purposeFull = await page.locator('[data-testid="studio-purpose"]').textContent()
await page.screenshot({ path: new URL("./shots/studio_home.png", import.meta.url).pathname })
out.home = home
c(home.counts.every((x) => x.shown === x.expected) && home.counts.find((x) => x.room === "heroes").shown > 100 && home.heroBreakdown?.includes("Heroes"), "h0c room counts match the Studio + breakdown on hover", { counts: home.counts, breakdown: home.heroBreakdown })
c(home.storyBeforeHover === false && home.storyAfterHover === true, "h0b room details open on hover", { before: home.storyBeforeHover, after: home.storyAfterHover })
c(home.purpose?.includes("honest limits") && home.purposeFull?.includes("headquarters of its development"), "h0 purpose statement", home.purpose)
c(home.title.includes("Hearthwood HQ") && home.rooms === 9 && home.nav === 4 && home.moreTools === 0 && home.history === 0 && !home.hScroll, "h1 HQ front door", home)

// 2. Every Studio list lives in exactly one room.
const coverage = await page.evaluate(async () => {
  const { ALL_TYPES } = await import("/src/components/hearthwood-studio/entityTypes.js")
  const { STUDIO_ROOMS } = await import("/src/components/hearthwood-studio/studioRooms.js")
  const counts = {}
  for (const room of STUDIO_ROOMS) for (const t of room.types) counts[t] = (counts[t] || 0) + 1
  const missing = ALL_TYPES.map((e) => e.type).filter((t) => counts[t] !== 1)
  const unknown = Object.keys(counts).filter((t) => t !== "storyTimeline" && !ALL_TYPES.some((e) => e.type === t))
  const badActions = STUDIO_ROOMS.flatMap((r) => r.actions.filter((a) => (a.kind === "type" || a.kind === "add") && !r.types.includes(a.type)).map((a) => `${r.id}:${a.label}`))
  return { missing, unknown, badActions, heroTypes: STUDIO_ROOMS[0].types.length }
})
out.coverage = coverage
c(!coverage.missing.length && !coverage.unknown.length && !coverage.badActions.length, "h2 every list in exactly one room", coverage)

// 2b. The Story Writer: the First Song, chronological, line by line.
await roomAction("story", "Rewrite scenes & dialogue")
await page.waitForTimeout(900)
const sw = { bar: await roomBar(), badges: await page.locator("[data-chapter]").evaluateAll((els) => els.map((el) => el.textContent.trim())) }
await page.locator("[data-chapter]").first().click()
await page.locator('[data-testid="story-writer"]').waitFor({ timeout: 10000 })
sw.where = await page.locator('[data-testid="story-writer-where"]').textContent()
sw.lines = await page.locator('[data-testid="story-writer-line"]').count()
sw.narratorItalic = await page.locator('[data-testid="story-writer-line"]').nth(2).evaluate((el) => getComputedStyle(el).fontStyle)
sw.speaker0 = await page.locator('[data-testid="story-writer-dialogue"] input').first().inputValue()
sw.speaker2 = await page.locator('[data-testid="story-writer-dialogue"] input').nth(2).inputValue()
sw.fold = await page.locator('[data-testid="all-fields-fold"]').evaluate((el) => el.open).catch(() => null)
await page.locator('[data-testid="story-writer-line"]').first().fill("...You. You are not the rot.")
await page.locator('[data-testid="story-writer-dialogue"] input').nth(2).fill("Narrator")
sw.changed = await page.getByText(/2 changed/).count()
await page.screenshot({ path: new URL("./shots/story_writer.png", import.meta.url).pathname })
await page.locator('[data-testid="story-writer-preview"]').click()
await page.waitForTimeout(500)
sw.edits = previewBody?.edits
sw.previewType = previewBody?.type
await page.locator('[data-testid="story-writer-next"]').click()
await page.waitForTimeout(700)
sw.nextWhere = await page.locator('[data-testid="story-writer-where"]').textContent()
await page.locator('[data-testid="studio-room-bar"] button', { hasText: "Endings" }).click()
await page.waitForTimeout(700)
await page.locator('[data-testid="studio-room-bar"]').waitFor()
const firstEnding = page.locator("aside button, section button").filter({ hasText: "The Song Restored" }).first()
await firstEnding.click().catch(() => {})
await page.waitForTimeout(700)
sw.endingBoxes = await page.locator('[data-testid="story-writer"] textarea').count()
out.storyWriter = sw
const e0 = sw.edits?.find((x) => x.path.join() === "rootkeeper-gate,lines,0,1")
const e2 = sw.edits?.find((x) => x.path.join() === "rootkeeper-gate,lines,2,0")
c(sw.bar?.includes("Story") && sw.badges[0]?.startsWith("Chapter 1") && sw.badges.length === 9, "s1 scenes list chronological with chapters", sw.badges)
c(sw.where.includes("Chapter 1 of 7") && sw.lines === 5 && sw.speaker0 === "The Rootkeeper" && sw.speaker2 === "" && sw.narratorItalic === "italic" && sw.fold === false, "s2 script view", sw)
c(sw.changed === 1 && sw.previewType === "storyScenes" && sw.edits?.length === 2 && e0?.value === "...You. You are not the rot." && e2?.value === "Narrator", "s3 one preview, exact line paths", sw.edits)
c(sw.nextWhere.includes("Chapter 2 of 7") && sw.endingBoxes >= 5, "s4 next scene + endings", { next: sw.nextWhere, boxes: sw.endingBoxes })

// 2c. Campaign story: chapter events (chronological) + a commander's spoken lines.
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-testid="room-story"]').click()
await page.waitForTimeout(400)
await page.locator("button[title]", { hasText: "Chapter Events" }).click()
await page.waitForTimeout(800)
const ce = { badges: await page.locator("[data-chapter]").evaluateAll((els) => els.map((el) => el.getAttribute("data-chapter"))) }
await page.locator("[data-chapter]").first().click()
await page.locator('[data-testid="story-writer"]').waitFor({ timeout: 10000 })
ce.where = await page.locator('[data-testid="story-writer-where"]').textContent()
ce.boxes = await page.locator('[data-testid="story-writer"] textarea').count()
ce.hasWidow = await page.locator('[data-testid="story-writer"] textarea').evaluateAll((els) => els.some((el) => el.value.includes("The Rot took him in the spring")))
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-testid="room-heroes"]').click()
await page.waitForTimeout(400)
await page.locator("button[title]", { hasText: "Commanders & Their Lines" }).click()
await page.waitForTimeout(800)
await page.locator("aside button, section button").filter({ hasText: "tommy" }).first().click()
await page.locator('[data-testid="story-writer"]').waitFor({ timeout: 10000 })
ce.tommy = await page.locator('[data-testid="story-writer"] textarea').evaluateAll((els) => els.map((el) => el.value))
ce.tommyLabels = await page.locator('[data-testid="story-writer"] label').allTextContents()
out.campaign = ce
c(ce.badges.join() === "1,2,3,4,5,6,7" && ce.where.includes("Chapter 1 of 7") && ce.hasWidow && ce.boxes > 10, "s5 chapter events chronological", { badges: ce.badges, where: ce.where, boxes: ce.boxes })
c(ce.tommy.includes("Called it.") && ce.tommyLabels.some((l) => l.includes("When things go well")), "s6 commander lines", ce.tommy)

await page.locator('[data-testid="studio-nav-home"]').click()
await page.waitForTimeout(300)

// 3. Heroes room: only hero lists, picture hint, no Story Timeline.
await roomAction("heroes", "Change a hero's picture")
await page.waitForTimeout(400)
const heroes = { bar: await roomBar(), chips: await chips(), timeline: await page.getByRole("button", { name: /Story Timeline/ }).count() }
out.heroes = heroes
c(heroes.bar?.includes("Heroes") && heroes.bar.includes("Pick a hero on the left") && heroes.chips.length === coverage.heroTypes && heroes.chips.includes("Heroes") && !heroes.chips.includes("Enemies") && heroes.timeline === 0, "h3 heroes room", heroes)

// 4. Battlefield: "Make a new object" opens the form straight away.
await page.locator('[data-testid="studio-nav-home"]').click()
await roomAction("battlefield", "Make a new object")
await page.waitForTimeout(400)
const bf = { form: await page.locator('[data-testid="add-battle-object-form"]').count(), bar: await roomBar(), chips: await chips() }
out.battlefield = bf
c(bf.form === 1 && bf.bar?.includes("Battlefield") && [...bf.chips].sort().join() === "Arenas,Battlefield Objects", "h4 battlefield make-object", bf)
await page.screenshot({ path: new URL("./shots/studio_room_battlefield.png", import.meta.url).pathname })

// 5. Story: timeline + "Write a new event" opens the event form.
await page.locator('[data-testid="studio-nav-home"]').click()
await roomAction("story", "Write a new event")
await page.waitForTimeout(400)
const story = { eventForm: await page.getByText("New Map Event").count(), timelineBtn: await page.getByRole("button", { name: /Story Timeline/ }).count() }
await page.getByRole("button", { name: /Story Timeline/ }).click()
await page.waitForTimeout(600)
story.timelineShown = await page.getByText(/story timeline|Act I/i).count()
out.story = story
c(story.eventForm === 1 && story.timelineBtn === 1 && story.timelineShown > 0, "h5 story room", story)

// 6. Look & Colours opens the theme panel; clicking a room title opens its list.
await page.locator('[data-testid="studio-nav-home"]').click()
await roomAction("look", "Change colours & fonts")
await page.waitForTimeout(400)
const look = { bar: await roomBar(), more: await page.locator('[data-testid="studio-more-tools"]').count() }
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-testid="room-enemies"]').click()
await page.waitForTimeout(400)
look.enemiesChips = await chips()
look.enemiesBar = await roomBar()
out.look = look
c(look.bar?.includes("Look & Colours") && look.more === 0 && look.enemiesBar?.includes("Enemies"), "h6 look room + room title click", look)

// 7. Undo a change shows the history; More tools brings back every tab + list.
await page.locator('[data-testid="studio-nav-undo"]').click()
await page.waitForTimeout(300)
const undo = { history: await page.locator('[data-testid="studio-history"]').count(), text: await page.locator('[data-testid="studio-history"]').textContent().catch(() => "") }
await page.locator('[data-testid="studio-nav-more"]').click()
await page.locator('[data-testid="studio-more-tools"] button', { hasText: "Single" }).click()
await page.waitForTimeout(400)
undo.allChips = (await chips()).length
undo.roomBar = await page.locator('[data-testid="studio-room-bar"]').count()
out.undo = undo
c(undo.history === 1 && undo.text.includes("Revert") && undo.allChips >= 48 && undo.roomBar === 0, "h7 undo + more tools", undo)

// 8. A deep link from the game (?type=&id=) lands in the right room.
await go("?type=events")
const deep = { bar: await roomBar() }
out.deep = deep
c(deep.bar?.includes("Story"), "h8 deep link room", deep)

out.blockedWrites = blocked
out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
