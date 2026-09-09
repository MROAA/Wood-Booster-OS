import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - seed engine + named RNG streams (feat/hearthwood-seed-engine).
// seed.js's streamRng is distribution-preserving mulberry32 -> no balance
// change -> the fairness pass is a smoke check; these assertions are the
// gate. The real property under test: every run-prep roll is a PURE
// function of persisted runState fields, so a save/reload reproduces the
// exact next roll (check 4).

const PORT = process.env.PORT || 5358
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hearthwood-seed-engine/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const seed = await import("/src/data/heartwood/seed.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const { formatSeed, parseSeed, streamRng, hashStr, SEED_STREAMS } = seed
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION,
    rerollShop, rerollRelicOffers,
  } = engine
  const out = { errors: [] }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const roundTrip = (rs) => deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))

  // 1. formatSeed / parseSeed
  {
    const sweep = [0, 1, 255, 4096, 0x1a2b3c4d, 0x7fffffff, 0xffffffff, 123456789]
    const rt = sweep.every((n) => parseSeed(formatSeed(n)) === (n >>> 0))
    const tolerant =
      parseSeed("hw-1a2b-3c4d") === 0x1a2b3c4d &&
      parseSeed("1A2B3C4D") === 0x1a2b3c4d &&
      parseSeed("  hw 1a2b 3c4d ") === 0x1a2b3c4d &&
      parseSeed("HW-1A2B-3C4D") === 0x1a2b3c4d &&
      parseSeed("ff") === 255 &&
      parseSeed("HW-FF") === 255
    const rejects =
      parseSeed("") === null &&
      parseSeed("   ") === null &&
      parseSeed("zzzz") === null &&
      parseSeed("HW-12-34-GG") === null &&
      parseSeed("123456789") === null && // 9 hex digits -> too long
      parseSeed(null) === null &&
      parseSeed(12345) === null
    const fmt = formatSeed(0x1a2b3c4d) === "HW-1A2B-3C4D" && formatSeed(0) === "HW-0000-0000"
    out.seedFormat = { rt, tolerant, rejects, fmt }
    if (!(rt && tolerant && rejects && fmt)) out.errors.push("check1 formatSeed/parseSeed")
  }

  // 2. streamRng quality / independence / determinism
  {
    const S = 0xabcdef01
    const gen = () => streamRng(S, "shop", 7)
    const draws = []
    { const g = gen(); for (let i = 0; i < 100000; i++) draws.push(g()) }
    const mean = draws.reduce((a, b) => a + b, 0) / draws.length
    const inRange = draws.every((x) => x >= 0 && x < 1)
    const buckets = new Array(10).fill(0)
    draws.forEach((x) => buckets[Math.min(9, Math.floor(x * 10))]++)
    const chi = buckets.reduce((a, c) => a + (c - 10000) ** 2 / 10000, 0)

    // determinism: same (seed,stream,salt) -> identical sequence
    const a1 = []; { const g = streamRng(S, "loot", 3); for (let i = 0; i < 40; i++) a1.push(g()) }
    const a2 = []; { const g = streamRng(S, "loot", 3); for (let i = 0; i < 40; i++) a2.push(g()) }
    const deterministic = eq(a1, a2)

    // independence: different stream / salt -> different sequence, ~0 corr
    const b = []; { const g = streamRng(S, "loot", 4); for (let i = 0; i < 40; i++) b.push(g()) }
    const c = []; { const g = streamRng(S, "item", 3); for (let i = 0; i < 40; i++) c.push(g()) }
    const independent = !eq(a1, b) && !eq(a1, c) && !eq(b, c)
    const corr = (() => {
      const n = a1.length
      const ma = a1.reduce((s, x) => s + x, 0) / n
      const mb = b.reduce((s, x) => s + x, 0) / n
      let num = 0, da = 0, db = 0
      for (let i = 0; i < n; i++) { const xa = a1[i] - ma, xb = b[i] - mb; num += xa * xb; da += xa * xa; db += xb * xb }
      return Math.abs(num / Math.sqrt(da * db))
    })()

    const hashOk = hashStr("a") !== hashStr("b") && (hashStr("x") >>> 0) === hashStr("x")
    const streamsOk = Array.isArray(SEED_STREAMS) && SEED_STREAMS.includes("shop") && SEED_STREAMS.includes("combat")
    out.streamRng = { mean: +mean.toFixed(4), inRange, chi: +chi.toFixed(1), deterministic, independent, corr: +corr.toFixed(3), hashOk, streamsOk }
    if (!(inRange && deterministic && independent && Math.abs(mean - 0.5) < 0.01 && chi < 40 && corr < 0.35 && hashOk && streamsOk)) out.errors.push("check2 streamRng quality")
  }

  // 3. seeded-run reproducibility
  {
    const a = startRun("tommy", null, { forcedSeed: 12345 })
    const b = startRun("tommy", null, { forcedSeed: 12345 })
    const same = a.seed === 12345 && eq(a.shopOffers, b.shopOffers) && eq(a.itemOffers, b.itemOffers) && eq(a.battlePool, b.battlePool)
    // a different seed should give different shop offers (retry once on the
    // astronomically-unlikely tie)
    let different = false
    for (const s of [999, 4242, 777]) {
      const c = startRun("tommy", null, { forcedSeed: s })
      if (!eq(a.shopOffers, c.shopOffers)) { different = true; break }
    }
    out.reproducible = { same, different }
    if (!(same && different)) out.errors.push("check3 seeded reproducibility")
  }

  // 4. RELOAD DETERMINISM — a roll is a pure fn of persisted state
  {
    const S = 0x5eed1234
    const r0 = startRun("tommy", null, { forcedSeed: S })
    const r1 = rerollShop({ ...r0, essence: 9999 })
    const r2 = rerollShop({ ...r1, essence: 9999 })
    const rerollsDiffer = !eq(r0.shopOffers, r1.shopOffers) && !eq(r1.shopOffers, r2.shopOffers)

    const r2round = roundTrip(r2)
    const restoredOk = r2round != null
    const nextFromLive = rerollShop({ ...r2, essence: 9999 }).shopOffers
    const nextFromReload = rerollShop({ ...r2round, essence: 9999 }).shopOffers
    const shopReloadStable = eq(nextFromLive, nextFromReload)

    // relic offers: rerollRelicOffers bumps runState.relicRerolls and the
    // salt, so each fresh three differs, reproducibly across a reload.
    const rrBase = { ...r0, essence: 99999 }
    const rr1 = rerollRelicOffers(rrBase)
    const rr2 = rerollRelicOffers(rr1)
    const relicRerollsCount = rr1.relicRerolls === 1 && rr2.relicRerolls === 2
    const relicOffersDiffer = !eq(rr1.relicOffers, rr2.relicOffers)
    const rr2round = roundTrip(rr2)
    const relicReloadStable =
      rr2round != null &&
      eq(rerollRelicOffers({ ...rr2, essence: 99999 }).relicOffers, rerollRelicOffers({ ...rr2round, essence: 99999 }).relicOffers)

    out.reloadDeterminism = { rerollsDiffer, restoredOk, shopReloadStable, relicRerollsCount, relicOffersDiffer, relicReloadStable }
    if (!(rerollsDiffer && restoredOk && shopReloadStable && relicRerollsCount && relicOffersDiffer && relicReloadStable)) out.errors.push("check4 reload determinism")
  }

  // 5. relicRerolls key + save compat
  {
    const fresh = startRun("tommy")
    const initZero = fresh.relicRerolls === 0
    const versionUnchanged = RUN_SAVE_VERSION === 3
    // round-trip with a populated value
    const populated = roundTrip({ ...fresh, relicRerolls: 4 })
    const lossless = populated != null && populated.relicRerolls === 4
    // an old v3 save with NO relicRerolls key still deserializes + works
    const legacyRun = (() => { const r = startRun("tommy"); delete r.relicRerolls; return r })()
    const legacy = deserializeRun({ version: 3, savedAt: Date.now(), run: JSON.parse(JSON.stringify(legacyRun)) })
    let legacyWorks = false
    try {
      const bumped = rerollRelicOffers({ ...legacy, essence: 99999 })
      legacyWorks = legacy != null && legacy.relicRerolls === undefined && bumped.relicRerolls === 1 && Array.isArray(bumped.relicOffers)
    } catch (e) { out.errors.push("check5 legacy throw: " + e.message) }
    out.saveCompat = { initZero, versionUnchanged, lossless, legacyWorks }
    if (!(initZero && versionUnchanged && lossless && legacyWorks)) out.errors.push("check5 relicRerolls/save compat")
  }

  // 6. no distribution drift — seeded opening shop spreads like random
  {
    const first = {}
    for (let i = 0; i < 600; i++) {
      const s = (Math.random() * 0x7fffffff) >>> 0
      const rs = startRun("tommy", null, { forcedSeed: s })
      const id = rs.shopOffers[0]
      first[id] = (first[id] || 0) + 1
    }
    const distinct = Object.keys(first).length
    const maxShare = Math.max(...Object.values(first)) / 600
    // commons pool is well over a dozen; no single unit should dominate
    out.distribution = { distinct, maxShare: +maxShare.toFixed(3) }
    if (!(distinct >= 8 && maxShare < 0.35)) out.errors.push("check6 distribution drift")
  }

  // 7. commander-select path — a typed seed string -> that exact run
  {
    const str = "HW-1234-ABCD"
    const n = parseSeed(str)
    const viaMeta = startRun("aatos", null, { forcedSeed: n, chosenPerks: [] })
    const direct = startRun("aatos", null, { forcedSeed: n })
    const ok = viaMeta.seed === n && eq(viaMeta.shopOffers, direct.shopOffers) && formatSeed(viaMeta.seed) === str
    out.commanderPath = { ok, n }
    if (!ok) out.errors.push("check7 commander-select seed path")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshots — commander-select seed field, shop rail, run-end seed
try {
  await page.click(".hw-commander-seed-toggle")
  await page.fill("#hw-seed-input", "HW-1234-ABCD")
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${SHOT}/seed_commander_select.png` })
} catch (e) { console.log("shot1 skip:", e.message) }

await browser.close()

const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_seed_engine PASS" : "\n❌ verify_seed_engine FAIL")
process.exit(pass ? 0 : 1)
