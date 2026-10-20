import test from "node:test"
import assert from "node:assert/strict"
import { verifyHearthwoodSources } from "./hearthwoodSourceVerification.js"

const content = [
  "export function onShield(state) {",
  "  return state",
  "}",
  "",
  "export function hugeThing(state) {",
  ...Array.from({ length: 400 }, () => "  state = state + 1 // padding padding padding"),
  "}",
].join("\n")
const files = [{ filePath: "src/services/heartwood/pool.js", content: "(excerpt only)" }]

test("reader candidates are extracted from the full file content", () => {
  const result = verifyHearthwoodSources("Miten suojaus toimii?", files, {
    candidates: [{ symbol: "onShield", filePath: "src/services/heartwood/pool.js", content }],
  })
  assert.deepEqual(result.verified.map(item => [item.symbol, item.origin]), [["onShield", "reader"]])
  assert.equal(result.verified[0].source, "export function onShield(state) {\n  return state\n}")
})

test("candidates that are not real functions, too large or malformed are skipped, never 'missing'", () => {
  const result = verifyHearthwoodSources("Miten suojaus toimii?", files, {
    candidates: [
      { symbol: "notThere", filePath: "src/services/heartwood/pool.js", content },
      { symbol: "hugeThing", filePath: "src/services/heartwood/pool.js", content },
      { symbol: 42, filePath: "x", content },
      null,
    ],
  })
  assert.deepEqual(result.verified, [])
  assert.deepEqual(result.missing, [])
})

test("a symbol the user named but that does not exist is still reported missing", () => {
  const result = verifyHearthwoodSources("Miten grantInfinitePower toimii?", files, {
    candidates: [{ symbol: "onShield", filePath: "src/services/heartwood/pool.js", content }],
  })
  assert.deepEqual(result.missing, ["grantInfinitePower"])
  assert.equal(result.verified.length, 1)
})

test("at most four candidates are taken", () => {
  const many = Array.from({ length: 9 }, () => ({ symbol: "onShield", filePath: "src/services/heartwood/pool.js", content }))
  assert.equal(verifyHearthwoodSources("x", files, { candidates: many }).verified.length, 1, "duplicates collapse")
})
