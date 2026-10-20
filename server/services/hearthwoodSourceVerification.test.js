import { test } from "node:test"
import assert from "node:assert/strict"

import { verifyHearthwoodSources } from "./hearthwoodSourceVerification.js"

const FIXTURE_FILE = {
  filePath: "src/services/heartwood/fixtureSystem.js",
  content: [
    "export function computeFixtureValue(x) {",
    "  return x * 2",
    "}",
    "",
    "function internalHelper(y) {",
    "  return y + 1",
    "}",
  ].join("\n"),
}

test("a genuinely defined function mentioned in the prompt is verified against the real source", () => {
  const result = verifyHearthwoodSources(
    "Miten computeFixtureValue toimii?",
    [FIXTURE_FILE],
  )

  assert.equal(result.missing.length, 0)
  assert.equal(result.verified.length, 1)
  assert.equal(result.verified[0].symbol, "computeFixtureValue")
  assert.equal(result.verified[0].filePath, FIXTURE_FILE.filePath)
  assert.match(result.verified[0].source, /function computeFixtureValue/)
})

test("a symbol that is never defined anywhere in the read files is reported missing, not fabricated", () => {
  const result = verifyHearthwoodSources(
    "Miten totallyMadeUpSymbol toimii?",
    [FIXTURE_FILE],
  )

  assert.deepEqual(result.verified, [])
  assert.ok(result.missing.includes("totallyMadeUpSymbol"))
})

test("a mentioned filename is not treated as a function symbol to verify", () => {
  // fixtureSystem.js itself is camelCase + has a dot, but it is a file
  // name, not a symbol — the prompt should not produce a false claim
  // that "fixtureSystem" is a verified or missing function.
  const result = verifyHearthwoodSources(
    "Miten fixtureSystem.js toimii?",
    [FIXTURE_FILE],
  )

  const symbols = [
    ...result.verified.map(item => item.symbol),
    ...result.missing,
  ]

  assert.ok(!symbols.includes("fixtureSystem"))
})

test("malformed codeFiles entries are skipped instead of throwing", () => {
  const result = verifyHearthwoodSources(
    "Miten computeFixtureValue toimii?",
    [null, { filePath: 123, content: FIXTURE_FILE.content }, FIXTURE_FILE],
  )

  assert.equal(result.verified.length, 1)
  assert.equal(result.verified[0].filePath, FIXTURE_FILE.filePath)
})

test("an empty or missing prompt verifies nothing and reports nothing missing", () => {
  const result = verifyHearthwoodSources("", [FIXTURE_FILE])

  assert.deepEqual(result.verified, [])
  assert.deepEqual(result.missing, [])
})
