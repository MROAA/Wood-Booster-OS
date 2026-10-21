import { test, mock, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import http from "node:http"
import { fileURLToPath } from "node:url"

import express from "express"

// This is the end-to-end proof that the Reliability Gate actually
// blocks the HTTP API, not just that the gate function returns the
// right verdict in isolation (see hearthwoodReliabilityGate.test.js
// for that). The only thing mocked here is the slow, non-deterministic
// Ollama call inside hearthwoodCodeAnalysis.js — the route handler and
// the Reliability Gate itself run for real, against a disposable
// fixture project root.

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REAL_FUNCTION_SOURCE =
  "export function computeFixtureValue(x) {\n  return x * 2\n}"

let FIXTURE_ROOT
let server
let baseUrl

function buildAnalysisResult({ fabricated }) {
  return {
    success: true,
    project: "hearthwood",
    mode: "code-analysis",
    model: "test-model",
    answer: fabricated
      ? "computeFixtureValue palauttaa aina täsmälleen luvun 42."
      : "computeFixtureValue kertoo annetun luvun kahdella.",
    verifiedSources: [
      {
        symbol: "computeFixtureValue",
        filePath: "src/services/heartwood/fixtureSystem.js",
        source: fabricated
          ? "function computeFixtureValue(x) { return 42 }"
          : REAL_FUNCTION_SOURCE,
        truncated: false,
      },
    ],
    dependencySources: [],
    // Verified Explanation V1 travels with the analysis; when the gate
    // blocks, it must be withheld exactly like the answer text.
    verifiedExplanation: { status: "VERIFIED_FACTS", text: fabricated ? "computeFixtureValue palauttaa 42 (keksitty)" : "ok" },
    unresolvedDependencies: [],
    missingSymbols: [],
    inspectedFiles: [
      { filePath: "src/services/heartwood/fixtureSystem.js", truncated: false },
    ],
    symbols: [],
    warning: "test fixture result",
  }
}

async function postJson(urlPath, body) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)
  return { status: response.status, body: payload }
}

before(async () => {
  FIXTURE_ROOT = await fs.mkdtemp(
    path.join(os.tmpdir(), "hearthwood-route-fixture-"),
  )

  await fs.mkdir(
    path.join(FIXTURE_ROOT, "src/services/heartwood"),
    { recursive: true },
  )

  await fs.writeFile(
    path.join(FIXTURE_ROOT, "src/services/heartwood/fixtureSystem.js"),
    REAL_FUNCTION_SOURCE,
  )

  process.env.HEARTHWOOD_PROJECT_ROOT = FIXTURE_ROOT

  mock.module(
    path.join(__dirname, "../services/hearthwoodCodeAnalysis.js"),
    {
      exports: {
        analyzeHearthwoodCode: async ({ prompt }) =>
          buildAnalysisResult({
            fabricated: String(prompt).includes("FABRICATE"),
          }),
      },
    },
  )

  // The change-planning endpoint does not run through
  // hearthwoodReliabilityGate.js at all (see the "remaining risk" test
  // below) — it only calls Ollama via changePlanGenerator's shared
  // chatWithOllama. Mock that so the plan test below is deterministic.
  mock.module(path.join(__dirname, "../services/ollamaClient.js"), {
    exports: {
      chatWithOllama: async () =>
        "SUUNNITELMA:\n" +
        "- MUOKKAA: src/services/heartwood/fixtureSystem.js | paranna laskentaa\n" +
        "SELITYS: Nykyinen toteutus käyttää funktiota computeFixtureValue kertoimella kaksi.",
    },
  })

  const { default: createHearthwoodDevStudioRouter } = await import(
    "./hearthwoodDevStudio.js"
  )

  const app = express()
  app.use(express.json())
  app.use("/api", createHearthwoodDevStudioRouter())

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await new Promise(resolve => server.close(resolve))
  await fs.rm(FIXTURE_ROOT, { recursive: true, force: true })
})

test("a genuine analysis passes the gate and the real answer reaches the client", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/analyze", {
    prompt: "GENUINE: selvitä computeFixtureValue",
  })

  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(body.reliability.decision, "CAUTION")
  assert.equal(body.reliability.sourceIntegrity, "verified")
  assert.ok(body.answer.includes("kahdella"))
})

test("a fabricated analysis is BLOCKed by the gate and the API returns 422, hiding the AI's text", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/analyze", {
    prompt: "FABRICATE: selvitä computeFixtureValue",
  })

  assert.equal(status, 422)
  assert.equal(body.success, false)
  assert.equal(body.reliability.decision, "BLOCK")
  assert.equal(body.reliability.sourceIntegrity, "failed")
  assert.ok(
    body.reliability.issues.some(issue => issue.code === "SOURCE_MISMATCH"),
  )

  // The fabricated answer text must never reach the client.
  assert.equal(body.answer, undefined)
  assert.equal(body.verifiedExplanation, undefined, "no explanation from rejected sources")
})

test("a missing prompt is rejected with 400 before any analysis runs", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/analyze", {})

  assert.equal(status, 400)
  assert.equal(body.success, false)
})

test("the tool router endpoint routes a clear request to the Code Analyst", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/route", {
    prompt: "Selvitä mana-järjestelmän toiminta lähdekoodista.",
  })

  assert.equal(status, 200)
  assert.equal(body.matched, true)
  assert.equal(body.skill.id, "code-analysis")
})

test("the tool router endpoint rejects a missing prompt with 400", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/route", {})

  assert.equal(status, 400)
  assert.equal(body.success, false)
})

test("the status endpoint reports the code-analysis capability", async () => {
  const response = await fetch(`${baseUrl}/api/hearthwood-dev/status`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.ok(body.capabilities.includes("code-analysis"))
})

test("the skills endpoint reports the full registry", async () => {
  const response = await fetch(`${baseUrl}/api/hearthwood-dev/skills`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.ok(body.total >= 1)
})

test("the image endpoint rejects an unknown action with 400", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/image", {
    action: "bogus",
    source: "public/spacemonkey.png",
  })

  assert.equal(status, 400)
  assert.equal(body.success, false)
})

test("the image endpoint rejects non-integer resize dimensions with 400", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/image", {
    action: "resize",
    source: "public/spacemonkey.png",
    width: 1.5,
    height: 10,
  })

  assert.equal(status, 400)
  assert.equal(body.success, false)
})

test("Insufficiently evidenced plans are rejected by final Safety Supervisor", async () => {
  const { status, body } = await postJson("/api/hearthwood-dev/plan", {
    prompt: "Paranna fixture-järjestelmän toteutusta.",
  })

  assert.equal(status, 422)
  assert.equal(body.success, false)
  assert.equal(body.executionApproved, false)
  assert.equal(body.safety?.decision, "BLOCK")
  assert.equal(body.safety?.allowedToDisplay, false)
  assert.ok(Array.isArray(body.safety?.issues))
  assert.ok(body.safety.issues.length > 0)
})
