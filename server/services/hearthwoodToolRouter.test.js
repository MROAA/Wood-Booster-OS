import { test } from "node:test"
import assert from "node:assert/strict"

import {
  routeHearthwoodRequest,
  listHearthwoodRoutes,
} from "./hearthwoodToolRouter.js"

test("missing or empty prompt is rejected without matching any skill", () => {
  const empty = routeHearthwoodRequest("")
  assert.equal(empty.success, false)
  assert.equal(empty.matched, false)
  assert.equal(empty.canExecuteAutomatically, false)

  const notAString = routeHearthwoodRequest(undefined)
  assert.equal(notAString.success, false)
  assert.equal(notAString.matched, false)
})

test("a clear code-analysis request routes to the Code Analyst and may run automatically", () => {
  const result = routeHearthwoodRequest(
    "Selvitä miten mana-järjestelmä toimii lähdekoodissa.",
  )

  assert.equal(result.success, true)
  assert.equal(result.matched, true)
  assert.equal(result.skill.id, "code-analysis")
  assert.equal(result.apiReady, true)
  assert.equal(result.canExecuteAutomatically, true)
})

test("a request matching a planned skill is routed but cannot execute automatically", () => {
  const result = routeHearthwoodRequest(
    "Suorita testaus ja regressioraportti pelille.",
  )

  assert.equal(result.matched, true)
  assert.equal(result.skill.id, "qa-testing")
  assert.equal(result.skill.status, "planned")
  assert.equal(result.canExecuteAutomatically, false)
  assert.match(result.message, /suunnitteilla/)
})

test("a request matching a planned skill with no endpoint cannot run automatically", () => {
  const result = routeHearthwoodRequest(
    "Miksaa taustamusiikki ja normalisoi äänenvoimakkuus.",
  )

  assert.equal(result.matched, true)
  assert.equal(result.skill.id, "audio-studio")
  assert.equal(result.canExecuteAutomatically, false)
})

test("a vague prompt with no strong signal is left unmatched rather than guessed", () => {
  const result = routeHearthwoodRequest("hei")

  assert.equal(result.success, true)
  assert.equal(result.matched, false)
  assert.equal(result.skill, null)
  assert.equal(result.canExecuteAutomatically, false)
})

test("listHearthwoodRoutes exposes one entry per registered route", () => {
  const routes = listHearthwoodRoutes()

  assert.ok(Array.isArray(routes))
  assert.ok(routes.length > 0)
  assert.ok(routes.some(route => route.skillId === "code-analysis"))
  assert.ok(routes.every(route => typeof route.reason === "string"))
})
