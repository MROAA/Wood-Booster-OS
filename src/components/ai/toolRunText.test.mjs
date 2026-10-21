import { test } from "node:test"
import assert from "node:assert/strict"

import { describeToolRun } from "./toolRunText.js"

test("a read-only run says what was used and that nothing changed", () => {
  const text = describeToolRun({
    capabilityId: "hq.projects.unfinished",
    name: "Keskeneräiset projektit",
    access: "observe",
    outcome: "ok",
    mutated: false,
    sources: ["Project", "ProjectWorkflowStep"],
  })

  assert.equal(text.summary, "Spacemonkey käytti: Keskeneräiset projektit · vain luku · mitään ei muutettu")
  assert.equal(text.sources, "Lähteet: Project, ProjectWorkflowStep")
})

test("a check without a model and a denied run are named honestly", () => {
  assert.match(
    describeToolRun({ name: "Python-tiedoston tarkistus", access: "observe", outcome: "ok-without-model", mutated: false }).summary,
    /ilman kielimallia · mitään ei muutettu$/,
  )
  assert.match(
    describeToolRun({ capabilityId: "hq.projects.update", outcome: "denied", mutated: false }).summary,
    /estetty - vaatisi kirjoitusoikeuden/,
  )
})

test("an unknown mutation state is never shown as 'nothing changed'", () => {
  assert.match(describeToolRun({ name: "X" }).summary, /muutokset tarkistettava$/)
})

test("no toolRun means no note", () => {
  assert.equal(describeToolRun(undefined), null)
  assert.equal(describeToolRun("x"), null)
})
