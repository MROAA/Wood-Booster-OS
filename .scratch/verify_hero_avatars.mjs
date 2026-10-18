// Hero avatars + personalities (docs/hearthwood-hero-avatars-prd.md).
// usage: PORT=5199 node .scratch/verify_hero_avatars.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5199
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(e.message))
const results = []
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info })
const IDS = ["tommy", "aatos", "fenrir", "repo", "kaski", "louhi", "lehva"]

// 1. Pure: data + skin rules.
await page.goto(`http://localhost:${PORT}/heartwood`)
const pure = await page.evaluate(async (IDS) => {
  const H = await import("/src/data/heartwood/heroes.js")
  const C = (await import("/src/data/heartwood/characters.js")).CHARACTERS
  const S = await import("/src/services/heartwood/heroSkins.js")
  const everyCommanderDrawn = Object.values(C).every((c) => H.heroIdForArt(c.art) === c.id)
  const complete = IDS.every((id) => {
    const h = H.HEROES[id]
    return h && h.traits.length === 3 && h.persona && h.quirk && ["start", "joy", "hurt", "victory", "defeat"].every((k) => typeof h.lines[k] === "string" && h.lines[k].length > 3) && Object.values(h.skins).filter((s) => s.rare).length >= 1
  })
  const distinctLines = new Set(IDS.map((id) => H.HEROES[id].lines.start)).size === IDS.length
  const meta = { acorns: 50, heroSkins: undefined }
  const a = S.unlockHeroSkin(meta, "tommy", "ember")
  const poor = S.unlockHeroSkin({ acorns: 39 }, "tommy", "ember")
  const notRare = S.unlockHeroSkin(meta, "tommy", "default")
  const again = a && S.unlockHeroSkin(a, "tommy", "ember")
  const chooseUnowned = S.chooseHeroSkin(meta, "aatos", "aurora")
  const back = a && S.chooseHeroSkin(a, "tommy", "default")
  const forged = S.normalizeHeroSkins({ unlocked: [], chosen: { tommy: "ember", nobody: "x" } })
  return {
    everyCommanderDrawn, complete, distinctLines,
    unlock: a && a.acorns === 10 && a.heroSkins.chosen.tommy === "ember" && a.heroSkins.unlocked.includes("tommy:ember"),
    poor: poor === null, notRare: notRare === null, again: again === null, chooseUnowned: chooseUnowned === null,
    back: back && back.heroSkins.chosen.tommy === "default" && back.acorns === 10,
    forged: Object.keys(forged.chosen).length === 0,
    traits: { tommy: H.HEROES.tommy.traits, aatos: H.HEROES.aatos.traits, repo: H.HEROES.repo.traits, repoKind: H.HEROES.repo.kind, aatosKind: H.HEROES.aatos.kind },
  }
}, IDS)
ok("all 7 Commanders map to a drawn hero", pure.everyCommanderDrawn)
ok("each hero: 3 traits, persona, quirk, 5 voice lines, a rare look", pure.complete)
ok("every hero sounds different (distinct opening lines)", pure.distinctLines)
ok("Marc's canon: Repo is a fox + quick, Aatos a reindeer + funny, Tommy clever", pure.traits.repoKind === "fox" && pure.traits.aatosKind === "reindeer" && pure.traits.repo.includes("Quick") && pure.traits.aatos.includes("Funny") && pure.traits.tommy.includes("Clever"), JSON.stringify(pure.traits))
ok("skin unlock costs 40 Acorns and wears it", pure.unlock)
ok("skin rules: too poor / not rare / twice / unowned choose all refused", pure.poor && pure.notRare && pure.again && pure.chooseUnowned)
ok("switching back to the default look is free", pure.back)
ok("a hand-edited save can't wear a look it doesn't own", pure.forged)

// 2. Commander Select.
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, acorns: 100, chosenPerks: [], unlockedCommanders: ["kaski", "louhi", "lehva"], depth: 0, selectedDepth: 0 }))
  localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload()
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })
await page.waitForTimeout(600)
const sel = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".hw-commander-card")]
  return {
    n: cards.length,
    heroes: cards.map((c) => c.querySelector(".hw-commander-portrait .hwh-avatar")?.dataset.hero || c.querySelector(".hw-commander-portrait img[data-commander-image]")?.dataset.commanderImage || null),
    painted: cards.map((c) => c.querySelector(".hw-commander-portrait img[data-commander-image]")?.dataset.commanderImage).filter(Boolean),
    tommyDefaultThumb: !!document.querySelector('.hw-commander-look[data-skin-id="default"] img[data-commander-image="tommy"]'),
    roles: cards.map((c) => c.querySelector(".hw-commander-role")?.textContent || ""),
    traits: cards.filter((c) => c.querySelector(".hw-commander-traits")).length,
    looks: document.querySelectorAll(".hw-commander-looks").length,
    size: (() => { const r = cards[1].querySelector(".hwh-avatar").getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })(),
    nested: document.querySelectorAll(".hw-commander-card button").length,
  }
})
ok("7 Commander cards, each with its hero art", sel.n === 7 && sel.heroes.every(Boolean) && new Set(sel.heroes).size === 7, JSON.stringify(sel.heroes))
ok("Marc's own Tommy painting wins in the default look (card + looks thumbnail)", sel.painted.length === 1 && sel.painted[0] === "tommy" && sel.tommyDefaultThumb, JSON.stringify(sel.painted))
ok("role + energy chip and traits on every card", sel.roles.every((r) => r.includes("·")) && sel.traits === 7, JSON.stringify(sel.roles))
ok("hero portrait fills the 89px medallion", sel.size[0] >= 85 && sel.size[1] >= 85, JSON.stringify(sel.size))
ok("a looks row under every card, no button nested in a button", sel.looks === 7 && sel.nested === 0, `looks=${sel.looks} nested=${sel.nested}`)
await page.screenshot({ path: ".scratch/shots/hero_select.png" })
const tommyCard = page.locator(".hw-commander-card").filter({ hasText: "Tommy" })
await tommyCard.hover()
await page.waitForTimeout(250)
const hov = await tommyCard.evaluate((c) => ({ mood: c.querySelector(".hw-commander-portrait [data-mood]").dataset.mood, quote: c.querySelector(".hw-commander-tagline").textContent }))
ok("hover: Tommy smiles and speaks his own line", hov.mood === "joy" && hov.quote.includes("weak spots"), JSON.stringify(hov))
await page.screenshot({ path: ".scratch/shots/hero_select_hover.png", clip: { x: 0, y: 0, width: 1536, height: 864 } })
const tommySlot = page.locator(".hw-commander-slot").filter({ hasText: "Tommy" })
await tommySlot.locator('.hw-commander-look[data-skin-id="ember"]').click()
await page.waitForTimeout(300)
const bought = await page.evaluate(() => ({ meta: JSON.parse(localStorage.getItem("heartwood-meta-v1")), worn: document.querySelector('.hw-commander-slot .hw-commander-look[data-worn]')?.dataset.skinId, portraitSkin: document.querySelector(".hw-commander-portrait .hwh-avatar")?.dataset.skin }))
ok("buying Emberwhisker: -40 Acorns, saved, worn on the card", bought.meta.acorns === 60 && bought.meta.heroSkins?.chosen?.tommy === "ember" && bought.portraitSkin === "ember", JSON.stringify({ a: bought.meta.acorns, hs: bought.meta.heroSkins, p: bought.portraitSkin }))
await page.reload()
await page.waitForSelector(".hw-commander-card")
const persisted = await page.evaluate(() => document.querySelector(".hw-commander-portrait .hwh-avatar")?.dataset.skin)
ok("the chosen look survives a reload", persisted === "ember", persisted)

// 3. Battle: Commander token is the drawn hero, speaks at the start.
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(700)
const bt = await page.evaluate(() => {
  const tok = document.querySelector('.hwt-token[data-unit-id="player-commander"]')
  const av = tok?.querySelector(".hwh-avatar")
  const r = av?.getBoundingClientRect()
  return {
    hero: av?.dataset.hero, variant: av?.dataset.variant, skin: av?.dataset.skin, mood: av?.dataset.mood,
    size: r ? [Math.round(r.width), Math.round(r.height)] : null,
    bubble: tok?.querySelector(".hwh-bubble")?.textContent || null,
    others: document.querySelectorAll('.hwt-token[data-side="player"]:not([data-unit-id="player-commander"]) .hwh-avatar').length,
  }
})
ok("battle: the Commander token is drawn Tommy in his worn look", bt.hero === "tommy" && bt.variant === "battle" && bt.skin === "ember", JSON.stringify(bt))
ok("battle: Tommy says his opening line", bt.bubble && bt.bubble.includes("weak spots"), bt.bubble)
ok("battle: the drawn hero fills the token (>=40px)", bt.size && bt.size[0] >= 40, JSON.stringify(bt.size))
ok("battle: squad heroes keep their own art (only the Commander is drawn)", bt.others === 0)
await page.screenshot({ path: ".scratch/shots/hero_battle.png" })
// Back to the default look: the board shows Marc's painting, still speaking.
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  const m = JSON.parse(localStorage.getItem("heartwood-meta-v1"))
  m.heroSkins.chosen.tommy = "default"
  localStorage.setItem("heartwood-meta-v1", JSON.stringify(m))
})
await page.reload()
await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
if (await page.locator(".hwt-begin-battle").count()) await page.locator(".hwt-begin-battle").click()
await page.waitForTimeout(700)
const painted = await page.evaluate(() => {
  const tok = document.querySelector('.hwt-token[data-unit-id="player-commander"]')
  return { img: !!tok?.querySelector("img.hwh-painted"), drawn: !!tok?.querySelector(".hwh-avatar"), bubble: tok?.querySelector(".hwh-bubble")?.textContent || null }
})
ok("battle, default look: Marc's Tommy painting on the board, and Tommy still speaks", painted.img && !painted.drawn && painted.bubble && painted.bubble.includes("weak spots"), JSON.stringify(painted))
await page.screenshot({ path: ".scratch/shots/hero_battle_painted.png" })
const moods = await page.evaluate(async () => {
  const T = await import("/src/components/heartwood/HeroToken.jsx")
  const u = { hp: 50, maxHp: 60, side: "player", id: "player-commander", art: "fox" }
  return {
    id: T.heroIdOfUnit(u), notSquad: T.heroIdOfUnit({ ...u, id: "player-x-0" }), notEnemy: T.heroIdOfUnit({ ...u, side: "enemy" }),
    n: T.baseMood(u, { phase: "player", turn: 2 }), low: T.baseMood({ ...u, hp: 15 }, { phase: "player", turn: 2 }),
    won: T.baseMood({ ...u, hp: 5 }, { phase: "won" }), lost: T.baseMood(u, { phase: "lost" }), dead: T.baseMood({ ...u, hp: 0 }, { phase: "player" }),
    power: T.baseMood(u, { phase: "player", turn: 3, activePower: { firedTurn: 3 } }),
  }
})
ok("reaction moods: neutral / low HP hurt / won victory / lost + fallen defeat / power joy", moods.id === "repo" && moods.notSquad === null && moods.notEnemy === null && moods.n === "neutral" && moods.low === "hurt" && moods.won === "victory" && moods.lost === "defeat" && moods.dead === "defeat" && moods.power === "joy", JSON.stringify(moods))
ok("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "))

await b.close()
let fail = 0
for (const r of results) {
  if (!r.pass) fail++
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.info ? `  [${r.info}]` : ""}`)
}
console.log(`\n${results.length - fail}/${results.length} passed`)
process.exit(fail ? 1 : 0)
