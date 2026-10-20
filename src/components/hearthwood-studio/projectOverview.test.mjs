// node --test src/components/hearthwood-studio/projectOverview.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { summarizeContent, summarizeChanges, summarizeHealth, summarizeSpacemonkey, suggestNextSteps } from "./projectOverview.js"

test("missing or broken sources give null, never a made-up number", () => {
  for (const bad of [null, undefined, {}, { types: "x" }, { message: "error" }]) assert.equal(summarizeContent(bad), null)
  assert.equal(summarizeContent({ types: [{ type: "units", count: 0 }] }), null)
  assert.equal(summarizeChanges({ message: "boom" }), null)
  assert.equal(summarizeHealth({ message: "boom" }), null)
  assert.equal(summarizeSpacemonkey({ success: false }), null)
  assert.equal(summarizeSpacemonkey(null), null)
})

test("content totals come from the real counts", () => {
  const result = summarizeContent({ types: [{ type: "units", count: 149 }, { type: "enemies", count: 99 }, { type: "x", count: "7" }] }, t => t.toUpperCase())
  assert.deepEqual(result, { total: 248, lists: 2, top: [{ label: "UNITS", count: 149 }, { label: "ENEMIES", count: 99 }] })
})

test("changes: in-game vs previews, each change's own check, latest change", () => {
  const rows = [
    { status: "qa_passed", summary: "old", updatedAt: "2026-10-19T10:00:00Z" },
    { status: "qa_failed", summary: "new", updatedAt: "2026-10-20T10:00:00Z" },
    { status: "previewing", summary: "draft", updatedAt: "2026-10-21T10:00:00Z" },
    { status: "reverted", summary: "undone", updatedAt: "2026-10-22T10:00:00Z" },
  ]
  const result = summarizeChanges(rows)
  assert.equal(result.inGame, 2)
  assert.equal(result.checksPassed, 1)
  assert.equal(result.checksFailed, 1)
  assert.equal(result.waitingPreviews, 1)
  assert.equal(result.latest.summary, "new", "a preview or an undone change is not the latest change in the game")
  assert.equal(summarizeChanges([]).latest, null)
})

test("health lists failing checks by name; Spacemonkey says it never runs on its own", () => {
  assert.deepEqual(summarizeHealth({ healthy: true, checks: [{ name: "a", ok: true }] }), { healthy: true, checks: 1, failing: [] })
  assert.deepEqual(summarizeHealth({ healthy: true, checks: [{ name: "Ollama", ok: false }] }), { healthy: false, checks: 1, failing: ["Ollama"] })
  assert.deepEqual(summarizeSpacemonkey({ success: true, capabilities: ["a", "b"], toolRouter: { automaticExecution: false } }), { capabilities: 2, automaticExecution: false })
})

test("suggestions rest only on real observations and never claim approval", () => {
  assert.deepEqual(suggestNextSteps({}), [])
  assert.deepEqual(suggestNextSteps({ changes: null, health: null }), [])
  assert.deepEqual(suggestNextSteps({ changes: { checksFailed: 0, waitingPreviews: 0 }, health: { healthy: true, failing: [] } }), [])
  const steps = suggestNextSteps({ changes: { checksFailed: 2, waitingPreviews: 14 }, health: { healthy: false, failing: ["Ollama"] } })
  assert.deepEqual(steps.map(s => s.id), ["failed-checks", "health", "previews"])
  for (const step of steps) {
    for (const field of ["title", "why", "basis", "benefit", "approval", "view"]) assert.ok(step[field], `${step.id}.${field}`)
  }
  assert.match(steps[2].basis, /14/)
  assert.match(steps[1].basis, /Ollama/)
})
