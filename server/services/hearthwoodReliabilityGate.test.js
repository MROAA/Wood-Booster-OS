import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

// The gate reads PROJECT_ROOT from an environment variable at import
// time (see hearthwoodProjectRoot.js), so we point it at a disposable
// fixture tree instead of touching the real project. This lets every
// test below exercise the real file-reading and symlink-resolution
// logic without any risk to real source files.

let auditHearthwoodAnalysis
let FIXTURE_ROOT
let OUTSIDE_ROOT

const REAL_FUNCTION_SOURCE =
  "export function computeFixtureValue(x) {\n  return x * 2\n}"

before(async () => {
  FIXTURE_ROOT = await fs.mkdtemp(
    path.join(os.tmpdir(), "hearthwood-gate-fixture-"),
  )

  OUTSIDE_ROOT = await fs.mkdtemp(
    path.join(os.tmpdir(), "hearthwood-gate-outside-"),
  )

  await fs.mkdir(
    path.join(FIXTURE_ROOT, "src/services/heartwood"),
    { recursive: true },
  )

  await fs.mkdir(
    path.join(FIXTURE_ROOT, "server"),
    { recursive: true },
  )

  await fs.writeFile(
    path.join(FIXTURE_ROOT, "src/services/heartwood/fixtureSystem.js"),
    REAL_FUNCTION_SOURCE,
  )

  // Exists on disk and is a genuine function, but lives outside every
  // allowed folder — must still be rejected.
  await fs.writeFile(
    path.join(FIXTURE_ROOT, "server/secretFixture.js"),
    "export function secretFixtureFn() {\n  return 1\n}",
  )

  // A file larger than the gate's MAX_FILE_BYTES limit.
  await fs.writeFile(
    path.join(FIXTURE_ROOT, "src/services/heartwood/hugeFixture.js"),
    "export function hugeFixtureFn() {\n" +
      `  return "${"x".repeat(520000)}"\n` +
      "}",
  )

  // A symlink that sits inside an allowed folder but resolves outside
  // the project root entirely.
  await fs.writeFile(
    path.join(OUTSIDE_ROOT, "outside.js"),
    'export function outsideFn() {\n  return "nope"\n}',
  )

  await fs.symlink(
    path.join(OUTSIDE_ROOT, "outside.js"),
    path.join(FIXTURE_ROOT, "src/services/heartwood/escapeLink.js"),
  )

  process.env.HEARTHWOOD_PROJECT_ROOT = FIXTURE_ROOT

  ;({ auditHearthwoodAnalysis } = await import(
    "./hearthwoodReliabilityGate.js"
  ))
})

after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await fs.rm(FIXTURE_ROOT, { recursive: true, force: true })
  await fs.rm(OUTSIDE_ROOT, { recursive: true, force: true })
})

test("a genuine, verbatim source reference passes with CAUTION / verified, never higher", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "computeFixtureValue kertoo luvun kahdella.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "computeFixtureValue",
        source: REAL_FUNCTION_SOURCE,
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "CAUTION")
  assert.equal(result.sourceIntegrity, "verified")
  assert.equal(result.issues.length, 0)
  assert.equal(result.checkedSources.length, 1)
  assert.equal(result.checkedSources[0].symbol, "computeFixtureValue")
  assert.equal(result.checkedSources[0].filePath, "src/services/heartwood/fixtureSystem.js")

  // The gate must never claim to have verified the AI's wording, only
  // the raw existence of the cited source.
  assert.equal(result.interpretationVerified, false)
})

test("a genuine dependency-source reference also passes", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "Riippuvuus vahvistettu.",
    verifiedSources: [],
    dependencySources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "computeFixtureValue",
        excerpt: REAL_FUNCTION_SOURCE,
      },
    ],
  })

  assert.equal(result.decision, "CAUTION")
  assert.equal(result.sourceIntegrity, "verified")
  assert.equal(result.checkedSources[0].kind, "dependency")
})

test("a fabricated snippet that does not appear in the real file is BLOCKed", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "computeFixtureValue palauttaa aina 42.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "computeFixtureValue",
        source: "function computeFixtureValue(x) { return 42 }",
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.equal(result.sourceIntegrity, "failed")
  assert.equal(result.checkedSources.length, 0)
  assert.ok(result.issues.some(issue => issue.code === "SOURCE_MISMATCH"))
})

test("a symbol that is not actually contained in its own cited snippet is BLOCKed", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "totallyMadeUpName löytyy lähdekoodista.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "totallyMadeUpName",
        source: REAL_FUNCTION_SOURCE,
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "SOURCE_MISMATCH"))
})

test("a file that genuinely exists but sits outside every allowed folder is rejected", async () => {
  const realSource = await fs.readFile(
    path.join(FIXTURE_ROOT, "server/secretFixture.js"),
    "utf8",
  )

  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "secretFixtureFn palauttaa ykkösen.",
    verifiedSources: [
      {
        filePath: "server/secretFixture.js",
        symbol: "secretFixtureFn",
        source: realSource,
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "INVALID_SOURCE"))
})

test("a path-traversal file path is rejected even though it starts with an allowed prefix", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "Jotain.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/../../../../etc/passwd.js",
        symbol: "anything",
        source: "function anything() {}",
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "INVALID_SOURCE"))
})

test("a symlink inside an allowed folder that resolves outside the project root is rejected", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "outsideFn palauttaa merkkijonon.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/escapeLink.js",
        symbol: "outsideFn",
        source: 'export function outsideFn() {\n  return "nope"\n}',
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "SOURCE_UNREADABLE"))
})

test("a file larger than the size limit is rejected rather than read", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "hugeFixtureFn palauttaa merkkijonon.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/hugeFixture.js",
        symbol: "hugeFixtureFn",
        source: "export function hugeFixtureFn()",
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "SOURCE_UNREADABLE"))
})

test("zero sources to check is BLOCKed (nothing to verify is not the same as verified)", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "Ei lähteitä.",
    verifiedSources: [],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "EVIDENCE_COUNT"))
})

test("an upstream analysis that did not succeed is BLOCKed before any source is checked", async () => {
  const result = await auditHearthwoodAnalysis({ success: false })

  assert.equal(result.decision, "BLOCK")
  assert.equal(result.sourceIntegrity, "failed")
  assert.equal(result.issues[0].code, "ANALYSIS_FAILED")
})

test("a missing analysis object entirely is BLOCKed, not thrown", async () => {
  const result = await auditHearthwoodAnalysis(null)

  assert.equal(result.decision, "BLOCK")
})

test("the AI claiming a verified symbol is missing is caught as a contradiction and BLOCKed", async () => {
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer: "Funktiota computeFixtureValue ei löydy lähdekoodista.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "computeFixtureValue",
        source: REAL_FUNCTION_SOURCE,
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "CONTRADICTORY_CLAIM"))
  assert.equal(result.contradictions.length, 1)
  assert.equal(result.contradictions[0].symbol, "computeFixtureValue")
})

test("the gate is a strict backstop: hedging language next to an absence claim does not excuse a contradiction", async () => {
  // Only the upstream code-analysis step softens wording around
  // partial/truncated snippets (removeContradictoryMissingClaims in
  // hearthwoodCodeAnalysis.js). The gate itself has no such exemption,
  // so it must still BLOCK if a genuine "ei löydy" + symbol line
  // reaches it, regardless of nearby hedging words.
  const result = await auditHearthwoodAnalysis({
    success: true,
    answer:
      "computeFixtureValue ei löydy lähdekoodista, koska katkelma on osittainen.",
    verifiedSources: [
      {
        filePath: "src/services/heartwood/fixtureSystem.js",
        symbol: "computeFixtureValue",
        source: REAL_FUNCTION_SOURCE,
      },
    ],
    dependencySources: [],
  })

  assert.equal(result.decision, "BLOCK")
  assert.ok(result.issues.some(issue => issue.code === "CONTRADICTORY_CLAIM"))
})
