import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Coverage wording against the herbalism fixture, where a real test file
// exists: a test that NAMES a function is "found (not run)"; one that only
// imports the same file proves nothing about the other functions.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
let ROOT
let explain

before(async () => {
  ROOT = await fs.mkdtemp(path.join(os.tmpdir(), "hearthwood-explain-"))
  await fs.cp(path.join(__dirname, "../spacemonkey-eval/fixture"), ROOT, { recursive: true })
  process.env.HEARTHWOOD_PROJECT_ROOT = ROOT
  ;({ buildVerifiedExplanation: explain } = await import("./hearthwoodVerifiedExplanation.js"))
})
after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await fs.rm(ROOT, { recursive: true, force: true })
})

async function source(symbol) {
  const filePath = "src/services/heartwood/herbalism.js"
  const content = await fs.readFile(path.join(ROOT, filePath), "utf8")
  const start = content.indexOf(`export function ${symbol}`)
  const end = content.indexOf("\n}\n", start) + 2
  return { symbol, filePath, source: content.slice(start, end) }
}

test("a found test is listed as existing but not run; same-file-only tests are kept apart", async () => {
  const e = await explain({ task: "Miten yrttijuoman keittäminen (brew potion) ja keräys (gather herb) toimivat?", verifiedSources: [await source("brewPotion"), await source("gatherHerb")] })
  assert.equal(e.status, "VERIFIED_FACTS")
  assert.deepEqual(e.coverage.found, [{ symbol: "brewPotion", file: "src/services/heartwood/herbalism.test.js" }])
  assert.deepEqual(e.coverage.notFound, ["gatherHerb"])
  assert.deepEqual(e.coverage.executed, [])
  assert.match(e.sections.coverage, /testit, jotka mainitsevat funktion \(ei ajettu\)/)
  assert.match(e.sections.coverage, /eivät todista näitä funktioita/)
  const flow = e.flow.find(step => step.caller === "endTurn")
  assert.equal(flow, undefined, "endTurn calls only one verified function: not a meeting point")
})
