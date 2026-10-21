import { test, mock, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Verified Explanation V1.1.2 against the real game source (read-only):
// Guardian's two protection paths from different wordings, side hits kept
// out of the explanation, and the answer when Ollama times out.
// The model is mocked; `model` switches what it does per test.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "../..")
const REAL_ENGINE = path.join(ROOT, "src/services/heartwood/tacticsEngine.js")
const MARC = "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia. Selitä tavallisella suomen kielellä, milloin Guardian voi suojata liittolaista, milloin Holy Power lisääntyy ja mitä testejä näille toiminnoille löytyy. Älä muuta mitään tiedostoja."
const MODEL_PROSE = "VASTAUS: Testit kattavat Holy Powerin täysin. (keksitty mallin väite)"

let model = async () => MODEL_PROSE
let analyze
let audit
let anchors
let NOTICE

before(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: { chatWithOllama: (...args) => model(...args) },
  })
  ;({ analyzeHearthwoodCode: analyze, MODEL_TIMEOUT_NOTICE: NOTICE } = await import("./hearthwoodCodeAnalysis.js"))
  ;({ auditHearthwoodAnalysis: audit } = await import("./hearthwoodReliabilityGate.js"))
  ;({ nameAnchors: anchors } = await import("./hearthwoodVerifiedExplanation.js"))
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

const fileLine = async (file, line) => (await fs.readFile(path.join(ROOT, file), "utf8")).split("\n")[line - 1].trim()
const timeout = async () => {
  throw new Error("Ollama ei vastannut 60 sekunnissa.")
}

test("both Guardian protection paths are found, however the question is worded", async t => {
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  for (const prompt of [
    MARC,
    "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia oikeasta lähdekoodista. Kerro miten ne toimivat ja mitä testejä niille löytyy. Älä muuta tiedostoja.",
    "Milloin Guardian suojaa liittolaista?",
    "Miten Intercept toimii?",
    "Selitä miten Guardianin suojaus toimii.",
    "Milloin suojelija ottaa iskun liittolaisen puolesta?",
  ]) {
    const result = await analyze({ prompt })
    const verified = result.verifiedSources.map(item => item.symbol)
    assert.ok(verified.includes("eligibleGuardian"), `${prompt} -> ${verified}`)
    assert.ok(verified.includes("classGuardFor"), `${prompt} -> ${verified}`)
  }
})

test("the two paths are explained separately, in the code's order", async t => {
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  const e = (await analyze({ prompt: MARC })).verifiedExplanation
  const summary = e.sections.summary
  assert.match(summary, /kokeilee ensin `eligibleGuardian`; jos se ei palauta tulosta, se käyttää `classGuardFor` \(2 erillistä polkua samassa kohdassa, rivi 2417\)/)
  assert.match(summary, /\*\*eligibleGuardian\*\* – polku 1\nHyväksyy yksikön vain, kun kaikki nämä pätevät:\n- Yksikkö on samalla puolella kuin kohde/)
  assert.match(summary, /\*\*classGuardFor\*\* – polku 2 \(käytetään, jos `eligibleGuardian` ei palauta tulosta\)/)
  // each path keeps its own conditions: Stalwart only in path 2, the class name only in path 1
  const one = summary.slice(summary.indexOf("**eligibleGuardian**"), summary.indexOf("**classGuardFor**"))
  const two = summary.slice(summary.indexOf("**classGuardFor**"), summary.indexOf("**onGuard**"))
  assert.match(one, /Yksikkö on luokkaa Guardian/)
  assert.doesNotMatch(one, /Stalwart|Interceptiä/)
  assert.match(two, /Yksikön luokkapassiivi on Stalwart/)
  assert.match(two, /Yksikkö ei ole vielä käyttänyt Interceptiä tämän vihollisvuoron aikana/)
  assert.doesNotMatch(two, /luokkaa Guardian/)
  // code order inside path 2: the Guard return (290), the stop (292), then the Intercept search (293)
  assert.ok(two.indexOf("Palauttaa tuloksen suoraan") < two.indexOf("Lopettaa ilman tulosta") && two.indexOf("Lopettaa ilman tulosta") < two.indexOf("Hyväksyy yksikön"))
  for (const step of e.flow) assert.equal(await fileLine(step.filePath, step.line), step.code)
})

test("side hits are kept out of the explanation; the Holy Power link is stated with its limits", async t => {
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  const e = (await analyze({ prompt: MARC })).verifiedExplanation
  const side = e.functions.filter(fn => fn.unlinked).map(fn => fn.symbol)
  for (const symbol of side) {
    assert.doesNotMatch(e.sections.summary, new RegExp(`\\*\\*${symbol}\\*\\*`), `${symbol} is not part of what happens`)
    assert.match(e.sections.details, new RegExp(`\\*\\*${symbol}\\*\\* \\([^)]*\\) – sivuosuma`))
  }
  if (side.length) assert.match(e.sections.details, /\*\*Muut löydetyt kohdat\*\*/)
  assert.ok(!e.data.some(fact => fact.filePath.endsWith("signatures.js")), "a Bulwark row is not Holy Power's definition")
  const guardianHoly = e.data.find(fact => fact.code === 'guardian: "holy",')
  assert.ok(guardianHoly, "the Guardian -> holy data line is shown")
  assert.equal(await fileLine(guardianHoly.filePath, guardianHoly.line), guardianHoly.code)
  assert.ok(e.uncertainties.some(item => /kentässä gain .* on myös block, heal.*vain kohdan guard/.test(item)))
  assert.match(e.sections.summary, /ei ole todennettu/)
  for (const fact of e.data) assert.equal(await fileLine(fact.filePath, fact.line), fact.code)
})

test("Finnish forms of one name are one test group; different names never merge", async t => {
  assert.deepEqual(anchors("Tutki Guardianin Intercept-kykyä. Milloin Guardian voi suojata? Entä Guardiania?"), ["Guardian", "Intercept"])
  assert.deepEqual(anchors("Vertaa Guardian ja Guard toisiinsa."), ["Guardian", "Guard"])
  assert.deepEqual(anchors("Vertaa Guardianin ja Wardenin suojausta."), ["Guardianin", "Wardenin"])
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  const e = (await analyze({ prompt: MARC })).verifiedExplanation
  assert.deepEqual(e.coverage.scripts.groups.map(group => group.name), ["Guardian", "Intercept", "Holy Power"])
})

test("test coverage keeps four levels apart: found, related check, run, passed", async t => {
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  const e = (await analyze({ prompt: MARC })).verifiedExplanation
  assert.match(e.sections.coverage, /- Skripti löytyi: kyllä, \d+ skriptiä/)
  assert.match(e.sections.coverage, /- Skripti sisältää asiaan liittyvän tarkistuksen: kyllä, \d+ tarkistuksen kuvausta/)
  assert.match(e.sections.coverage, /- Skriptin suoritus vahvistettu: ei/)
  assert.match(e.sections.coverage, /- Testin onnistuminen vahvistettu: ei/)
  assert.deepEqual(e.coverage.executed, [])
  assert.doesNotMatch(Object.values(e.sections).join("\n"), /läpäis|passed|onnistui/i)
})

test("Ollama timeout: verified findings only, clearly marked, through the same gate", async t => {
  if (!(await realSource(t))) return
  model = timeout
  const result = await analyze({ prompt: MARC })
  assert.equal(result.success, true)
  assert.equal(result.modelStatus, "timeout")
  assert.equal(result.fallback.reason, "OLLAMA_TIMEOUT")
  assert.equal(NOTICE, "Ollama ei vastannut ajoissa. Alla näytetään vain lähdekoodista vahvistetut havainnot. Analyysi voi olla puutteellinen.")
  assert.equal(result.fallback.notice, NOTICE)
  assert.equal(result.verifiedExplanation.sections.notice, NOTICE)
  assert.equal(result.unverifiedInterpretation, null)
  // the route's reliability gate judges it like any other analysis
  const reliability = await audit(result)
  assert.equal(reliability.decision, "CAUTION")
  assert.equal(reliability.sourceIntegrity, "verified")
  // nothing but re-checked source lines: every flow line and data line is the file's line
  const e = result.verifiedExplanation
  assert.equal(e.status, "VERIFIED_FACTS")
  for (const step of e.flow) assert.equal(await fileLine(step.filePath, step.line), step.code)
  for (const fact of e.data) assert.equal(await fileLine(fact.filePath, fact.line), fact.code)
  for (const fn of e.functions) {
    for (const item of [...fn.conditions, ...fn.guards, ...fn.effects]) {
      assert.ok((await fileLine(fn.filePath, item.line)).includes(item.code), `${fn.symbol}:${item.line}`)
    }
  }
  // it is not presented as a full AI analysis
  assert.doesNotMatch(JSON.stringify(e.sections), /keksitty mallin väite/)
  assert.doesNotMatch(e.sections.summary, /AI-analyysi/)
})

test("any other model error still fails the analysis (no silent fallback)", async t => {
  if (!(await realSource(t))) return
  model = async () => {
    throw new Error("Ollama-yhteys epäonnistui (http://localhost:11434): fetch failed")
  }
  await assert.rejects(analyze({ prompt: MARC }), /Ollama-yhteys epäonnistui/)
  model = async () => {
    throw new Error("Ollama ei vastannut 60 sekunnissa. Lisäksi jotain muuta")
  }
  await assert.rejects(analyze({ prompt: MARC }), /Lisäksi jotain muuta/)
})

test("a model that answers: no fallback, its prose still never shown", async t => {
  if (!(await realSource(t))) return
  model = async () => MODEL_PROSE
  const result = await analyze({ prompt: MARC })
  assert.equal(result.modelStatus, "answered")
  assert.equal(result.fallback, null)
  assert.equal(result.verifiedExplanation.sections.notice, undefined)
  assert.doesNotMatch(JSON.stringify(result.verifiedExplanation), /keksitty mallin väite/)
})
