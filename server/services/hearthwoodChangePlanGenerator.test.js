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
let generator

before(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: {
      chatWithOllama: async args => {
        calls.push(args)
        return "PÄÄTÖS: NO_CHANGE_NEEDED\nSUUNNITELMA:\n" +
          "SELITYS: Nykyinen toteutus: attackUnit kutsuu eligibleGuardian ja onGuard antaa resurssia. " +
          "Epävarmuudet: pelitestiä ei ajettu."
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
