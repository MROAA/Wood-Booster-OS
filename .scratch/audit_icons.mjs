import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const cardArt = await import("/src/components/heartwood/cardArt.jsx")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")

  // GLYPHS isn't exported directly, but every glyph name used by
  // CardGlyph resolves via its own internal map - probe indirectly by
  // rendering isn't feasible headlessly here, so instead collect every
  // icon/art string actually used across the data files and report
  // them for a manual cross-check against cardArt.jsx's known map,
  // plus flag anything obviously malformed (empty string, non-string).
  function collect(defs, field) {
    return Object.entries(defs)
      .filter(([, d]) => !d.fusedFrom) // skip auto-generated Tier 2s, same base art
      .map(([id, d]) => [id, d[field]])
  }

  return {
    unitArt: collect(UNITS, "art"),
    enemyArt: collect(ENEMIES, "art"),
    itemIcon: collect(ITEMS, "icon"),
    relicIcon: collect(RELICS, "icon"),
  }
})

console.log("errors:", errors)
await browser.close()

const KNOWN_GLYPHS = new Set([
  "leaf", "spark", "moonGlyph", "root", "rune", "flame", "husk", "troll", "warden",
  "barkBrute", "mistGrowler", "drownedSiren", "bloomrotStalker", "rootbindThicket",
  "spacemonkeyBoss", "sword", "shield", "heart", "drawIcon", "cat", "reindeer", "wolf",
  "fox", "emberStag", "grovekeeper", "stormwing", "stoneheart", "forgehowl",
  "strength", "justice", "death", "temperance", "judgement", "entropy",
])

const problems = []
for (const [group, entries] of Object.entries(result)) {
  for (const [id, value] of entries) {
    if (typeof value !== "string" || !value) {
      problems.push(`${group} "${id}": missing/invalid art-icon field ("${value}")`)
    } else if (!KNOWN_GLYPHS.has(value) && !/^https?:|\.(jpg|png|jpeg|webp)$/.test(value)) {
      // Some units use a real portrait image path instead of a glyph
      // name - that's fine (UnitCard.jsx has a separate `image` field
      // path), only flag values that are neither a known glyph NOR
      // clearly an image reference.
      problems.push(`${group} "${id}": art/icon "${value}" not in the known glyph list (check for a typo)`)
    }
  }
}

console.log(JSON.stringify(problems, null, 2))
if (problems.length === 0 && errors.length === 0) {
  console.log("PASS: no obviously broken art/icon references")
  process.exit(0)
} else {
  console.log(`REVIEW: ${problems.length} flagged (may include false positives from image-path units)`)
  process.exit(problems.length > 0 || errors.length > 0 ? 1 : 0)
}
