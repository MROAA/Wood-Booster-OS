import { test, mock, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Ollama times out and there is NOTHING verified to show: the user gets a
// clear error with a retry hint - never an empty or invented "answer".
// A temp copy of the herbalism fixture plus a data-only file (no function).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
let ROOT
let analyze

before(async () => {
  ROOT = await fs.mkdtemp(path.join(os.tmpdir(), "hearthwood-fallback-"))
  await fs.cp(path.join(__dirname, "../spacemonkey-eval/fixture"), ROOT, { recursive: true })
  await fs.writeFile(path.join(ROOT, "src/data/heartwood/moonstones.js"), "// Moonstone colours.\nexport const MOONSTONE_COLOURS = { pale: 1, deep: 2 }\n")
  process.env.HEARTHWOOD_PROJECT_ROOT = ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: {
      chatWithOllama: async () => {
        throw new Error("Ollama ei vastannut 60 sekunnissa.")
      },
    },
  })
  ;({ analyzeHearthwoodCode: analyze } = await import("./hearthwoodCodeAnalysis.js"))
})
after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await fs.rm(ROOT, { recursive: true, force: true })
})

test("timeout without any verified source: an understandable error, try again later", async () => {
  const run = analyze({ prompt: "Mitä MOONSTONE_COLOURS moonstone colours sisältää?" })
  await assert.rejects(run, error => {
    assert.equal(error.code, "OLLAMA_TIMEOUT_NO_VERIFIED_FACTS")
    assert.equal(error.message, "Ollama ei vastannut ajoissa, eikä lähdekoodista löytynyt vahvistettuja havaintoja näytettäväksi. Yritä myöhemmin uudelleen.")
    return true
  })
})

test("timeout with a verified fixture function: the fallback works outside the real game too", async () => {
  const result = await analyze({ prompt: "Miten brewPotion keittää yrttijuoman?" })
  assert.equal(result.modelStatus, "timeout")
  assert.ok(result.verifiedSources.some(item => item.symbol === "brewPotion"))
  assert.equal(result.verifiedExplanation.status, "VERIFIED_FACTS")
  assert.match(result.verifiedExplanation.sections.notice, /^Ollama ei vastannut ajoissa\./)
})
