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

  assert.match(e.sections.summary, /`attackUnit` käyttää löydettyjä osia/)
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
  assert.match(e.sections.coverage, /Tarkistetut hakemistot: src\/data\/heartwood/)
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
