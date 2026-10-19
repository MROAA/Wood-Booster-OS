import { chromium } from "playwright"

// Hearthwood HQ - the Studio's rooms front door (studioRooms.js /
// StudioHome.jsx). Read-only GETs go to whatever API answers on 3001;
// every write (POST/PUT/...) is blocked so this can never change files.
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const c = (ok, label, data) => { if (!ok) out.errors.push(data === undefined ? label : `${label} ${JSON.stringify(data)}`) }

const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
let blocked = 0
await ctx.route("http://localhost:3001/**", (route) => {
  if (route.request().method() !== "GET") { blocked++; return route.abort() }
  return route.continue()
})
const page = await ctx.newPage()
page.on("pageerror", (err) => errs.push(String(err)))
const go = async (qs = "") => {
  await page.goto(`http://localhost:${PORT}/hearthwood-studio${qs}`, { waitUntil: "domcontentloaded" })
  await page.locator('[data-testid="studio-nav"]').waitFor({ timeout: 20000 })
  await page.waitForTimeout(400)
}
const chips = () => page.locator("button[title]").evaluateAll((els) => els.map((el) => el.textContent.trim()))
const roomBar = () => page.locator('[data-testid="studio-room-bar"]').textContent().catch(() => null)

// 1. Opens on HQ: 8 rooms, 4 nav buttons, old tabs + history hidden.
await go()
const home = {
  title: await page.locator("h1").textContent(),
  rooms: await page.locator("[data-room]").count(),
  nav: await page.locator('[data-testid="studio-nav"] button').count(),
  moreTools: await page.locator('[data-testid="studio-more-tools"]').count(),
  history: await page.locator('[data-testid="studio-history"]').count(),
  hScroll: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  bottom: await page.evaluate(() => Math.round(document.querySelector('[data-testid="studio-home"]').getBoundingClientRect().bottom)),
}
await page.screenshot({ path: new URL("./shots/studio_home.png", import.meta.url).pathname })
out.home = home
c(home.title.includes("Hearthwood HQ") && home.rooms === 8 && home.nav === 4 && home.moreTools === 0 && home.history === 0 && !home.hScroll, "h1 HQ front door", home)

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

// 3. Heroes room: only hero lists, picture hint, no Story Timeline.
await page.locator('[data-room="heroes"] button', { hasText: "Change a hero's picture" }).click()
await page.waitForTimeout(400)
const heroes = { bar: await roomBar(), chips: await chips(), timeline: await page.getByRole("button", { name: /Story Timeline/ }).count() }
out.heroes = heroes
c(heroes.bar?.includes("Heroes") && heroes.bar.includes("Pick a hero on the left") && heroes.chips.length === coverage.heroTypes && heroes.chips.includes("Heroes") && !heroes.chips.includes("Enemies") && heroes.timeline === 0, "h3 heroes room", heroes)

// 4. Battlefield: "Make a new object" opens the form straight away.
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-room="battlefield"] button', { hasText: "Make a new object" }).click()
await page.waitForTimeout(400)
const bf = { form: await page.locator('[data-testid="add-battle-object-form"]').count(), bar: await roomBar(), chips: await chips() }
out.battlefield = bf
c(bf.form === 1 && bf.bar?.includes("Battlefield") && bf.chips.join() === "Battlefield Objects,Arenas", "h4 battlefield make-object", bf)
await page.screenshot({ path: new URL("./shots/studio_room_battlefield.png", import.meta.url).pathname })

// 5. Story: timeline + "Write a new event" opens the event form.
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-room="story"] button', { hasText: "Write a new event" }).click()
await page.waitForTimeout(400)
const story = { eventForm: await page.getByText("New Map Event").count(), timelineBtn: await page.getByRole("button", { name: /Story Timeline/ }).count() }
await page.locator('[data-testid="studio-room-bar"] button', { hasText: "Read the story in order" }).click()
await page.waitForTimeout(600)
story.timelineShown = await page.getByText(/story timeline|Act I/i).count()
out.story = story
c(story.eventForm === 1 && story.timelineBtn === 1 && story.timelineShown > 0, "h5 story room", story)

// 6. Look & Colours opens the theme panel; clicking a room title opens its list.
await page.locator('[data-testid="studio-nav-home"]').click()
await page.locator('[data-room="look"] button', { hasText: "Change colours & fonts" }).click()
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
