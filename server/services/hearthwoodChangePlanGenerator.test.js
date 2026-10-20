import { test, mock, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// The model is mocked; the real Hearthwood source is read (read-only).
// Proves the whole chain without Ollama: the prompt fits the model's
// context, carries the real Guardian evidence, and a no-change answer
// stays a review-only candidate with zero files and zero approvals.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REAL_ENGINE = path.join(__dirname, "../../src/services/heartwood/tacticsEngine.js")
const GUARDIAN_TASK =
  "Tutki Hearthwoodin Guardian-luokan Intercept ja Holy Power -resurssikertymä. " +
  "Selvitä oikeasta lähdekoodista, onko mekaniikka jo toteutettu. Älä muuta tiedostoja."

const calls = []
const responses = []
const DEFAULT_RESPONSE = "PÄÄTÖS: NO_CHANGE_NEEDED\nSUUNNITELMA:\n" +
  "SELITYS: Nykyinen toteutus: attackUnit kutsuu eligibleGuardian ja onGuard antaa resurssia. " +
  "Epävarmuudet: pelitestiä ei ajettu."
let generator

before(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: {
      chatWithOllama: async args => {
        calls.push(args)
        return responses.shift() ?? DEFAULT_RESPONSE
      },
    },
  })
  generator = await import("./hearthwoodChangePlanGenerator.js")
})

test("oversized prompts are refused, never silently truncated", () => {
  assert.throws(() => generator.assertPromptFits("x".repeat(30000), "task"), /ei mahdu/)
  assert.ok(generator.assertPromptFits("x".repeat(9000), "task") <= generator.PLAN_CONTEXT_TOKENS)
})

test("Guardian task: prompt fits, carries real evidence, no-change stays review-only", async t => {
  try {
    await fs.access(REAL_ENGINE)
  } catch {
    t.skip("Hearthwood game source not present in this checkout")
    return
  }

  const plan = await generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK })
  const sent = calls.at(-1)

  assert.equal(sent.numCtx, generator.PLAN_CONTEXT_TOKENS)
  for (const symbol of ["attackUnit", "eligibleGuardian", "onGuard"]) {
    assert.match(sent.systemPrompt, new RegExp(symbol))
  }
  assert.match(sent.systemPrompt, /PÄÄTÖS TEHTÄVÄN ALUSSA/)

  assert.equal(plan.status, "human_review_required")
  assert.equal(plan.proposedDecision, "NO_CHANGE_NEEDED")
  assert.deepEqual(plan.files, [])
  assert.equal(plan.executionApproved, false)
  assert.equal(plan.interpretationVerified, false)
  const refs = plan.evidence.references.map(r => r.symbol)
  assert.ok(refs.includes("onGuard") && refs.includes("attackUnit"))
})

test("a copied answer template is not accepted as reasoning", () => {
  assert.equal(generator.isPlaceholderExplanation("Mitä pitää vielä tutkia: ...\nEpävarmuudet: ..."), true)
  assert.equal(generator.isPlaceholderExplanation(""), true)
  assert.equal(generator.isPlaceholderExplanation(
    "Mitä pitää vielä tutkia: attackUnit-funktion loppuosa jäi lukematta, joten Intercept-haaraa ei nähty."), false)
})

async function realSourcePresent(t) {
  try {
    await fs.access(REAL_ENGINE)
    return true
  } catch {
    t.skip("Hearthwood game source not present in this checkout")
    return false
  }
}

test("the prompt carries machine-verified call facts of the mechanic", async t => {
  if (!(await realSourcePresent(t))) return
  const plan = await generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK })
  const prompt = calls.at(-1).systemPrompt
  assert.match(prompt, /VAHVISTETUT LÄHDEFAKTAT/)
  assert.match(prompt, /tacticsEngine\.js:\d+ attackUnit kutsuu onGuard/)
  const report = plan.evidenceReport
  assert.ok(report.sourceFacts.some(f => f.symbol === "attackUnit" && f.callee === "onGuard"))
  assert.deepEqual(report.testedBehaviour, [])
  assert.ok(report.inference.strongReferences.includes("onGuard"))
  assert.equal(report.qualityNote, null)
  assert.ok(report.unknown.length > 0, "excerpt-only reads are listed as unknown")
})

test("no-change resting only on a side source is flagged, still never approved", async t => {
  if (!(await realSourcePresent(t))) return
  responses.push("PÄÄTÖS: NO_CHANGE_NEEDED\nSUUNNITELMA:\n" +
    "SELITYS: Nykyinen toteutus: CLASS_AFFINITY määrittää Guardianin värit, joten Intercept on valmis. Epävarmuudet: ei.")
  const plan = await generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK })
  assert.equal(plan.status, "human_review_required")
  assert.equal(plan.executionApproved, false)
  assert.deepEqual(plan.evidenceReport.inference.strongReferences, [])
  assert.ok(plan.evidenceReport.inference.weakReferences.includes("CLASS_AFFINITY"))
  assert.match(plan.evidenceReport.qualityNote, /sivulähteisiin/)
})

test("insufficient evidence stays review-only and names what is unknown", async t => {
  if (!(await realSourcePresent(t))) return
  responses.push("PÄÄTÖS: INSUFFICIENT_EVIDENCE\nSUUNNITELMA:\n" +
    "SELITYS: Mitä pitää vielä tutkia: attackUnit-funktion Stalwart-haara ja pelitesti puuttuvat.")
  const plan = await generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK })
  assert.equal(plan.proposedDecision, "INSUFFICIENT_EVIDENCE")
  assert.deepEqual(plan.files, [])
  assert.equal(plan.executionApproved, false)
  assert.ok(plan.evidenceReport.unknown.length > 0)
})

test("change required goes through the existing plan gates and is not approved", async t => {
  if (!(await realSourcePresent(t))) return
  responses.push("PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/tacticsMana.js | onGuard rajaa kertymän\n" +
    "SELITYS: Nykyinen toteutus: onGuard antaa resurssia.\n" +
    "Todiste lähdekoodista:\n```\nexport function onGuard(state, guardianId) {\n```\n" +
    "Ehdotettu muutos: lisää raja. Epävarmuudet: testit.")
  const plan = await generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK })
  assert.equal(plan.status, "plan_ready")
  assert.equal(plan.files[0].filePath, "src/services/heartwood/tacticsMana.js")
  assert.notEqual(plan.executionApproved, true)
  assert.ok(plan.evidenceReport.inference.strongReferences.includes("onGuard"))
})

test("an invented file or symbol is still refused", async t => {
  if (!(await realSourcePresent(t))) return
  const forged = "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/notReal.js | keksitty\n" +
    "SELITYS: interceptHolyGain hoitaa tämän."
  responses.push(forged, forged)
  await assert.rejects(generator.generateHearthwoodChangePlan({ prompt: GUARDIAN_TASK }))
})
