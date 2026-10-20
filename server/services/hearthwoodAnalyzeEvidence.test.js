import { test, mock, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// A question in plain words (no function names) used to verify nothing,
// so the unchanged Reliability Gate blocked every answer (EVIDENCE_COUNT).
// The reader's relevant functions are now verified from the real files.
// Model mocked; real game source read-only; the gate itself is unchanged.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REAL_ENGINE = path.join(__dirname, "../../src/services/heartwood/tacticsEngine.js")
let analyze
let audit

before(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: { chatWithOllama: async () => "VASTAUS: onGuard antaa Guardianille resurssia, kun se ottaa iskun liittolaisen puolesta." },
  })
  ;({ analyzeHearthwoodCode: analyze } = await import("./hearthwoodCodeAnalysis.js"))
  ;({ auditHearthwoodAnalysis: audit } = await import("./hearthwoodReliabilityGate.js"))
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

test("a plain-language question gets verified sources and passes the unchanged gate", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Miten Guardianin Intercept kasvattaa Holy Poweria?" })
  const symbols = result.verifiedSources.map(item => item.symbol)
  assert.ok(symbols.includes("onGuard"), symbols.join(","))
  assert.ok(result.verifiedSources.every(item => item.source.length <= 8000))
  const gate = await audit(result)
  assert.ok(!gate.issues.some(issue => issue.code === "EVIDENCE_COUNT"), JSON.stringify(gate.issues))
  assert.equal(gate.sourceIntegrity, "verified", JSON.stringify(gate.issues))
})

test("a function named in the question but absent is still reported missing", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Miten interceptHolyGainNow toimii Guardianilla?" })
  assert.ok(result.missingSymbols.includes("interceptHolyGainNow"))
  assert.ok(!result.verifiedSources.some(item => item.symbol === "interceptHolyGainNow"))
})

// --- negative cases: the fix must never let a wrong source through -------

test("a tampered (invented) source text is refused by the unchanged gate", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Miten Guardianin Intercept kasvattaa Holy Poweria?" })
  const forged = {
    ...result,
    verifiedSources: result.verifiedSources.map((item, index) => index === 0
      ? { ...item, source: item.source.replace(/\{/, "{ grantInfiniteHolyPower()\n") }
      : item),
  }
  const gate = await audit(forged)
  assert.notEqual(gate.sourceIntegrity, "verified")
  assert.notEqual(gate.decision, "CAUTION")
})

test("a real function claimed in the wrong file is refused", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Miten Guardianin Intercept kasvattaa Holy Poweria?" })
  const moved = { ...result, verifiedSources: result.verifiedSources.map(item => ({ ...item, filePath: "src/data/heartwood/classes.js" })) }
  const gate = await audit(moved)
  assert.notEqual(gate.sourceIntegrity, "verified")
})

test("no verified source at all is still blocked (EVIDENCE_COUNT)", async () => {
  const gate = await audit({ success: true, verifiedSources: [], dependencySources: [], answer: "x" })
  assert.ok(gate.issues.some(issue => issue.code === "EVIDENCE_COUNT"))
  assert.notEqual(gate.decision, "CAUTION")
})

test("the asked mechanic's functions win over loosely matching ones (call chain first)", async t => {
  if (!(await realSource(t))) return
  // "kykyä" (ability) used to pull enemy-skill functions to the top and
  // the long attackUnit used up a place: Intercept's own functions were lost.
  const result = await analyze({ prompt: "Tutki Guardianin Intercept-kykyä ja Holy Poweria oikeasta pelikoodista. Kerro miten ne toimivat ja mitkä testit niitä kattavat. Älä muuta tiedostoja." })
  const symbols = result.verifiedSources.map(item => item.symbol)
  assert.ok(symbols.includes("onGuard"), symbols.join(","))
  assert.ok(symbols.includes("eligibleGuardian"), symbols.join(","))
  const gate = await audit(result)
  assert.equal(gate.sourceIntegrity, "verified", JSON.stringify(gate.issues))
})

test("acceptance question: Intercept's own functions, verbatim from the real files", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia Hearthwoodin oikeasta lähdekoodista. Kerro, miten kyky toimii, milloin Holy Poweria syntyy ja mitkä testit kattavat toiminnon. Älä muuta tiedostoja." })
  const symbols = result.verifiedSources.map(item => item.symbol)
  for (const symbol of ["onGuard", "eligibleGuardian"]) assert.ok(symbols.includes(symbol), symbols.join(","))
  for (const item of result.verifiedSources) {
    const real = await fs.readFile(path.join(__dirname, "../..", item.filePath), "utf8")
    assert.ok(real.includes(item.source), `${item.symbol} is verbatim in ${item.filePath}`)
  }
  assert.equal((await audit(result)).sourceIntegrity, "verified")
})

test("a different mechanic in plain Finnish finds its own functions (not tuned to Guardian)", async t => {
  if (!(await realSource(t))) return
  const result = await analyze({ prompt: "Miten myrkky toimii taistelussa?" })
  assert.ok(result.verifiedSources.some(item => /poison/i.test(item.symbol)), result.verifiedSources.map(item => item.symbol).join(","))
})
