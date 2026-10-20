import { test } from "node:test"
import assert from "node:assert/strict"

import {
  extractHearthwoodEvidence,
  validateHearthwoodEvidence,
  formatHearthwoodEvidence,
} from "./hearthwoodEvidenceValidator.js"

const FIXTURE_FILE = {
  filePath: "src/services/heartwood/fixtureSystem.js",
  content: [
    "export function computeFixtureValue(x) {",
    "  return x * 2",
    "}",
    "",
    "export const FIXTURE_LIMIT = 10",
  ].join("\n"),
}

test("extractHearthwoodEvidence finds exported functions and constants from real source", () => {
  const evidence = extractHearthwoodEvidence([FIXTURE_FILE])

  const symbols = evidence.map(item => item.symbol)
  assert.ok(symbols.includes("computeFixtureValue"))
  assert.ok(symbols.includes("FIXTURE_LIMIT"))
  assert.ok(evidence.every(item => item.filePath === FIXTURE_FILE.filePath))
})

test("a change-plan explanation that cites a real extracted symbol is considered valid", () => {
  const result = validateHearthwoodEvidence(
    "Ehdotus liittyy funktioon computeFixtureValue.",
    [FIXTURE_FILE],
  )

  assert.equal(result.valid, true)
  assert.ok(result.references.some(ref => ref.symbol === "computeFixtureValue"))
})

test("an explanation that never cites any real symbol is rejected, even if plausible-sounding", () => {
  const result = validateHearthwoodEvidence(
    "Ehdotus liittyy funktioon totallyFabricatedFunction.",
    [FIXTURE_FILE],
  )

  assert.equal(result.valid, false)
  assert.deepEqual(result.references, [])
  assert.match(result.reason, /ei viittaa/)
})

test("an empty code file set cannot be used as evidence at all", () => {
  const result = validateHearthwoodEvidence(
    "Ehdotus liittyy funktioon computeFixtureValue.",
    [],
  )

  assert.equal(result.valid, false)
  assert.match(result.reason, /ei löytynyt/)
})

test("formatHearthwoodEvidence lists every discovered symbol with its file", () => {
  const formatted = formatHearthwoodEvidence([FIXTURE_FILE])

  assert.match(formatted, /fixtureSystem\.js.*computeFixtureValue/)
})

test("formatHearthwoodEvidence reports explicitly when there is nothing to check", () => {
  const formatted = formatHearthwoodEvidence([])

  assert.equal(formatted, "Ei tarkistettavia lähdekoodiviitteitä.")
})
