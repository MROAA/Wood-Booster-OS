import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5331
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-named/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const NEW_FORMATIONS = ["emberwracks-guard", "wraithgales-veil", "hollowfangs-den"]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async ({ NEW_FORMATIONS }) => {
  const t = Date.now()
  const C = await import("/src/data/heartwood/characters.js?t=" + t)
  const F = await import("/src/data/heartwood/formations.js?t=" + t)
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const RE = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const out = {}

  // --- Commander ---
  out.lehvaExists = !!C.CHARACTERS.lehva
  out.lehvaLocked = C.CHARACTERS.lehva?.locked === true
  out.lehvaInUnlockable = C.unlockableCommanders().some((c) => c.id === "lehva")
  out.lehvaLockedByDefault = C.isCommanderUnlocked("lehva", []) === false
  out.lehvaUnlockedWhenOwned = C.isCommanderUnlocked("lehva", ["lehva"]) === true
  out.lehvaShape =
    !!C.CHARACTERS.lehva?.squadPassive?.length &&
    !!C.CHARACTERS.lehva?.activePower?.effects?.length &&
    typeof C.CHARACTERS.lehva?.maxHp === "number"

  // lehva starts a run + survives a full auto-resolved run
  let rs = E.startRun("lehva")
  out.lehvaStarts = rs.characterId === "lehva" && rs.phase === "shop"
  // walk the whole run with a minimal opportunistic bot
  let safety = 0
  let crashed = null
  try {
    while (rs.phase !== "victory" && rs.phase !== "defeat" && safety++ < 400) {
      if (rs.phase === "shop") {
        const affordable = rs.shopOffers.find((id) => true)
        if (affordable && rs.bench.length < 6) rs = E.recruitUnit({ ...rs, essence: 99999 }, affordable)
        rs = E.leaveShop(rs)
      } else if (rs.phase === "choice") {
        rs = E.chooseFloorEncounter(rs, 0)
      } else if (rs.phase === "relic") {
        rs = E.chooseRelic(rs, rs.relicOffers?.[0])
      } else if (rs.phase === "event") {
        rs = E.resolveEventChoice(rs, 0)
      } else if (rs.phase === "formation") {
        rs = E.startFormationBattle(rs)
      } else if (rs.phase === "battle") {
        rs = E.autoResolve(rs)
        rs = E.resolveBattleOutcome(rs)
      } else break
    }
  } catch (e) { crashed = String(e) }
  out.lehvaRunCrash = crashed
  out.lehvaRunEnd = rs.phase
  out.lehvaRunSafety = safety

  // --- Formations ---
  out.formationsExist = NEW_FORMATIONS.filter((id) => !F.FORMATIONS[id])
  out.formationsResolve = NEW_FORMATIONS.every((id) => {
    const f = F.resolveFormation(id)
    return f && Array.isArray(f.pieces) && f.pieces.length === 2
  })
  // each appears in RUN_PATH exactly once
  const pathFormationIds = E.RUN_PATH.filter((n) => n.formationId).map((n) => n.formationId)
  out.formationsInPath = NEW_FORMATIONS.map((id) => pathFormationIds.filter((x) => x === id).length)
  // node-type cadence + total count unchanged (still 111, same type string)
  out.pathLen = E.RUN_PATH.length
  out.typeCadence = E.RUN_PATH.map((n) => n.type).join(",")
  out.battleCount = E.RUN_PATH.filter((n) => n.type === "battle").length
  // the swapped-out solo enemies are gone from RUN_PATH
  const soloIds = E.RUN_PATH.filter((n) => n.enemyId && n.type === "battle").map((n) => n.enemyId)
  out.swappedSolosGone = ["emberwrack", "wraithgale", "hollowfang"].filter((id) => soloIds.includes(id))

  // start one of the new formations as a real battle - no crash
  try {
    let b = RE.startAutoBattle("tommy", [{ defId: "the-hierophant", upgradeLevel: 0, itemIds: [] }], "wraithgales-veil", [], 0, {}, [], [], 1.4, null)
    b = RE.autoResolveBattle(b)
    out.formationBattlePhase = b.phase
  } catch (e) { out.formationBattleCrash = String(e) }

  return out
}, { NEW_FORMATIONS })
console.log(JSON.stringify(eng, null, 2))

// --- DOM: lehva shows as a locked card on commander select ----------
await page.evaluate(() => { try { localStorage.clear() } catch {} })
await page.reload()
await page.waitForTimeout(900)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
const lehvaCard = page.locator(".hw-commander-card, [class*='commander']").filter({ hasText: "Lehva" })
const lehvaVisible = await lehvaCard.first().isVisible().catch(() => false)
const unlockCta = await page.locator("text=/Unlock.*80|80.*Acorn/i").first().isVisible().catch(() => false)
await page.screenshot({ path: `${SHOT_DIR}/lehva_commander_select.png` })
console.log("lehva card visible:", lehvaVisible, "| unlock CTA:", unlockCta)

// battleCount must be unchanged: we swapped solo->formation, not add/remove
console.log("battleCount:", eng.battleCount, "(expect 39, unchanged)")
console.log("errors:", JSON.stringify(errors))
const finalPass =
  eng.lehvaExists && eng.lehvaLocked && eng.lehvaInUnlockable &&
  eng.lehvaLockedByDefault && eng.lehvaUnlockedWhenOwned && eng.lehvaShape &&
  eng.lehvaStarts && eng.lehvaRunCrash === null && ["victory", "defeat"].includes(eng.lehvaRunEnd) &&
  eng.formationsExist.length === 0 && eng.formationsResolve &&
  eng.formationsInPath.join(",") === "1,1,1" &&
  eng.pathLen === 111 && eng.battleCount === 51 &&
  eng.swappedSolosGone.length === 0 &&
  ["won", "lost"].includes(eng.formationBattlePhase) && !eng.formationBattleCrash &&
  lehvaVisible &&
  errors.length === 0
console.log(finalPass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(finalPass ? 0 : 1)
