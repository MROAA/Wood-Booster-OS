import test from "node:test"
import assert from "node:assert/strict"
import { brewPotion } from "./herbalism.js"

test("brewing consumes a herb and heals, capped at max HP", () => {
  const state = { units: { a: { hp: 8, hpMax: 10, satchel: { sunleaf: 1 } } } }
  const next = brewPotion(state, "a", "sunleaf")
  assert.equal(next.units.a.hp, 10)
  assert.equal(next.units.a.satchel.sunleaf, 0)
})
