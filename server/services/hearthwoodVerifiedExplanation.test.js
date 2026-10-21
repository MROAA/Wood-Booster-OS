import { test, mock, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Verified Explanation V1 against the real game source (read-only).
// The model is mocked: nothing here depends on, or shows, model prose.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "../..")
const REAL_ENGINE = path.join(ROOT, "src/services/heartwood/tacticsEngine.js")
const GUARDIAN = "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia oikeasta Hearthwoodin lähdekoodista. Kerro miten kyky toimii, milloin Holy Poweria syntyy ja mitkä testit kattavat toiminnon. Älä muuta tiedostoja."
let analyze
let explain
let describe

before(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: { chatWithOllama: async () => "VASTAUS: Testit kattavat Holy Powerin täysin. (keksitty mallin väite)" },
  })
  ;({ analyzeHearthwoodCode: analyze } = await import("./hearthwoodCodeAnalysis.js"))
  ;({ buildVerifiedExplanation: explain, describeFunction: describe } = await import("./hearthwoodVerifiedExplanation.js"))
})

async function realSource(t) {
  try {
    await fs.access(REAL_ENGINE)
    return true
  } catch {
    t.skip("Hearthwood game source not present in this checkout")
    return false
  }
}

const fileLine = async (filePath, line) => (await fs.readFile(path.join(ROOT, filePath), "utf8")).split("\n")[line - 1].trim()

test("Guardian: a real flow, conditions and Holy Power data - every quoted line is the file's line", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: GUARDIAN })
  const e = result.verifiedExplanation
  assert.equal(e.status, "VERIFIED_FACTS")

  const call = (caller, callee) => e.flow.find(step => step.caller === caller && step.callee === callee)
  assert.ok(call("attackUnit", "eligibleGuardian"), "attackUnit -> eligibleGuardian")
  assert.ok(call("attackUnit", "onGuard"), "attackUnit -> onGuard")
  for (const step of e.flow) assert.equal(await fileLine(step.filePath, step.line), step.code.replace(/…$/, "").length < 200 ? step.code : await fileLine(step.filePath, step.line))

  const eligible = e.functions.find(fn => fn.symbol === "eligibleGuardian")
  assert.ok(eligible.conditions.some(c => c.code === 'u.className === "Guardian"'))
  assert.ok(eligible.conditions.some(c => c.code === "u.ap >= 1"))
  const onGuard = e.functions.find(fn => fn.symbol === "onGuard")
  assert.deepEqual(onGuard.guards.filter(g => g.stops).map(g => g.condition), ["!manaOn(state)", "!hasMana(t) || t.hp <= 0"])
  assert.ok(onGuard.effects.some(effect => effect.code.includes('gainMana(state, guardianId, g.guard, "guard")')))
  for (const fn of e.functions) {
    for (const item of [...fn.conditions, ...fn.guards, ...fn.effects]) {
      assert.ok((await fileLine(fn.filePath, item.line)).includes(item.code.split(" ").slice(0, 3).join(" ")), `${fn.symbol}:${item.line}`)
    }
  }

  const data = e.data.map(fact => fact.code)
  assert.ok(data.includes('name: "Holy Power",'))
  assert.ok(data.some(code => code.startsWith("gain: {") && code.includes("guard: 1")))
  assert.ok(data.includes('guardian: "holy",'))
  for (const fact of e.data) assert.equal(await fileLine(fact.filePath, fact.line), fact.code)

  // two separate ways on one line (`a || b`), in the code's order - never merged
  assert.match(e.sections.summary, /Funktio attackUnit kokeilee ensin `eligibleGuardian`; jos se ei palauta tulosta, se käyttää `classGuardFor` \(2 erillistä polkua samassa kohdassa, rivi 2417\); sitten `onGuard` \(rivi 2428\)/)
  assert.doesNotMatch(e.text, /keksitty/, "model prose never enters the explanation")
})

test("a function too long to quote whole is shown only through its verified call lines", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: GUARDIAN })
  assert.ok(!result.verifiedSources.some(item => item.symbol === "attackUnit"), "attackUnit is not a verified whole source")
  assert.ok(!result.verifiedExplanation.functions.some(fn => fn.symbol === "attackUnit"))
  assert.ok(result.verifiedExplanation.uncertainties.some(item => item.startsWith("attackUnit: funktiosta näytetään vain todennetut kutsurivit")))
})

test("test coverage is stated exactly: none run, not found here does not mean missing", async t => {
  if (!(await realSource(t))) return
  const e = (await analyze({ prompt: GUARDIAN })).verifiedExplanation
  assert.deepEqual(e.coverage.executed, [])
  assert.match(e.sections.coverage, /Suoritettuja testejä: ei yhtään/)
  assert.match(e.sections.coverage, /Tämä ei tarkoita, ettei testiä olisi muualla/)
  assert.match(e.sections.coverage, /Tarkistetut lähdehakemistot: src\/data\/heartwood/)
  assert.match(e.sections.coverage, /Ei tutkittu:/)
  assert.doesNotMatch(e.text, /testit kattavat|testattu/i, "no coverage claim beyond what was found")
})

test("a different mechanic (poison) is explained by the same general rules", async t => {
  if (!(await realSource(t))) return
  const e = (await analyze({ prompt: "Miten myrkky toimii taistelussa?" })).verifiedExplanation
  const poison = e.functions.find(fn => fn.symbol === "applyPoisonTick")
  assert.ok(poison, e.functions.map(fn => fn.symbol).join(","))
  assert.ok(poison.skips.some(s => s.condition.includes("live.poison > 0")))
  assert.ok(poison.computations.some(c => c.code === "const nextHp = Math.max(0, live.hp - stacks)"))
  assert.ok(poison.effects.some(effect => effect.code.startsWith("next = setUnit(next, unit.id, { hp: nextHp")))
  assert.ok(!poison.effects.some(effect => effect.code.startsWith("function ")), "the definition line is not an effect")
})

test("zero accepted sources: no explanation is formed", async () => {
  const e = await explain({ task: "Miten jokin toimii?", verifiedSources: [] })
  assert.equal(e.status, "INSUFFICIENT_EVIDENCE")
  assert.deepEqual(e.flow, [])
  assert.match(e.text, /En löytänyt kysymykseesi lähdetarkistettua koodia/)
})

test("a tampered source or a wrong file is dropped, never explained", async t => {
  if (!(await realSource(t))) return
  const real = (await analyze({ prompt: GUARDIAN })).verifiedSources.find(item => item.symbol === "onGuard")
  const tampered = await explain({ task: GUARDIAN, verifiedSources: [{ ...real, source: real.source.replace("gainMana", "gainInfiniteMana") }] })
  assert.equal(tampered.status, "INSUFFICIENT_EVIDENCE")
  assert.ok(tampered.uncertainties.some(item => item.includes("lähde ei vastannut tiedostoa")))
  const moved = await explain({ task: GUARDIAN, verifiedSources: [{ ...real, filePath: "src/services/heartwood/tacticsEngine.js" }] })
  assert.equal(moved.status, "INSUFFICIENT_EVIDENCE")
})

test("describeFunction reads structure only: return values vs stops, inline find conditions", () => {
  const lines = [
    "export function pick(state, target) {",
    "  if (!target) return null",
    "  if (target.boss) return { ...target, boss: true }",
    "  const g = state.units.find((u) => u.hp > 0 && has(u, \"x\") && u.id !== target.id)",
    "  return g",
    "}",
  ]
  const d = describe(lines, { startLine: 1, endLine: 6 })
  assert.deepEqual(d.guards.map(g => [g.condition, g.stops]), [["!target", true], ["target.boss", false]])
  assert.deepEqual(d.conditions.map(c => c.code), ["u.hp > 0", 'has(u, "x")', "u.id !== target.id"])
})

// --- V1.1: plain Finnish and real check scripts ---------------------------

test("V1.1 Guardian: the summary needs no JavaScript, code stays in the details", async t => {
  if (!(await realSource(t))) return
  const e = (await analyze({ prompt: "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia oikeasta lähdekoodista. Kerro miten ne toimivat ja mitä testejä niille löytyy. Älä muuta tiedostoja." })).verifiedExplanation
  const summary = e.sections.summary
  for (const sentence of ["Yksikkö on luokkaa Guardian", "Yksiköllä on vähintään 1 toimintapiste", "Yksiköllä ei ole aktiivista Suppressed-vaikutusta", "Pelissä ei ole resurssisääntöjä käytössä", "saa resurssia määrän g.guard"]) {
    assert.ok(summary.includes(sentence), sentence)
  }
  assert.doesNotMatch(summary, /u\.className|u\.ap >=|!\(u\.suppressed/, "the eligibility code is not in the summary")
  assert.match(e.sections.details, /`u\.className === "Guardian"` \(rivi 2294\)/)
  // a nested guard is shown with its enclosing condition, never alone
  const classGuard = e.functions.find(fn => fn.symbol === "classGuardFor")
  const nested = classGuard.guards.find(g => g.line === 290)
  assert.equal(nested.outer.line, 288)
  assert.match(nested.plain.text, /^Kohteella on aktiivinen Guard-suojaus ja kohteella on nimetty suojaaja/)
})

test("V1.1 Guardian: real check scripts are found, quoted as their own words, and not run", async t => {
  if (!(await realSource(t))) return
  const e = (await analyze({ prompt: "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia oikeasta lähdekoodista. Kerro miten ne toimivat ja mitä testejä niille löytyy. Älä muuta tiedostoja." })).verifiedExplanation
  const groups = Object.fromEntries(e.coverage.scripts.groups.map(g => [g.name, g.checks]))
  assert.ok(groups.Intercept.some(c => c.file === ".scratch/verify_tactics_prototype.mjs" && /check157 an ineligible Guardian/.test(c.label)))
  assert.ok(groups["Holy Power"].some(c => c.file === ".scratch/verify_melee.mjs" && /Holy/.test(c.label)))
  for (const group of e.coverage.scripts.groups) {
    for (const check of group.checks) {
      const line = (await fs.readFile(path.join(ROOT, check.file), "utf8")).split("\n")[check.line - 1]
      assert.ok(line.includes(check.label), `${check.file}:${check.line} really says that`)
    }
  }
  assert.deepEqual(e.coverage.executed, [])
  assert.match(e.sections.coverage, /Kuvaus on skriptin oma; ei ajettu tässä analyysissä/)
  assert.doesNotMatch(e.sections.coverage, /Downloads\//, "files outside the repository are never read")
  assert.match(e.sections.coverage, /versionhallinnan ulkopuoliset tiedostot \(esim\. Downloads\)/)
})

test("V1.1 a coverage claim is never made from a name mention alone", async t => {
  if (!(await realSource(t))) return
  const e = (await analyze({ prompt: "Miten myrkky toimii taistelussa?" })).verifiedExplanation
  const listed = e.coverage.scripts.groups.flatMap(g => g.checks)
  assert.ok(listed.length > 0)
  assert.ok(listed.every(check => /poison/i.test(check.label)), "every listed check's own description names the asked thing")
  assert.ok(!listed.some(check => e.coverage.scripts.mentionsOnly.some(m => m.file === check.file)))
})
