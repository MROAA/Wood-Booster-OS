import test from "node:test"
import assert from "node:assert/strict"
import { translateCondition, translateEffect, translateComputation, verifyHelpers, HELPERS } from "./hearthwoodConditionText.js"

const all = new Set(["kingAdjacent", "manaOn", "hasMana", "has", "gainMana"])
const say = (code, subject = "u", helpers = all) => translateCondition(code, { subject, helpers })

test("Guardian's seven eligibility conditions in plain Finnish", () => {
  assert.deepEqual([
    "u.side === target.side", "u.id !== target.id", "u.hp > 0", 'u.className === "Guardian"',
    "u.ap >= 1", "kingAdjacent(u.pos, target.pos)", "!(u.suppressed > 0)",
  ].map(code => say(code).text), [
    "Yksikkö on samalla puolella kuin kohde",
    "Yksikkö ei ole sama yksikkö kuin kohde",
    "Yksikkö on elossa",
    "Yksikkö on luokkaa Guardian",
    "Yksiköllä on vähintään 1 toimintapiste",
    "Yksikkö ja kohde ovat vierekkäisissä ruuduissa (myös vinottain), eivät samassa ruudussa",
    "Yksiköllä ei ole aktiivista Suppressed-vaikutusta",
  ])
})

test("Holy Power change and its stop conditions", () => {
  assert.equal(say("!manaOn(state)", null).text, "Pelissä ei ole resurssisääntöjä käytössä")
  assert.equal(say("!hasMana(t) || t.hp <= 0", null).text, "Jokin näistä: yksikkö (t) puuttuu tai sillä ei ole resurssimittaria; yksikkö (t) ei ole elossa")
  assert.match(translateEffect('return g.guard ? gainMana(state, guardianId, g.guard, "guard") : state', { helpers: all }).text, /saa resurssia määrän g\.guard \(resurssin yläraja rajoittaa lisäystä\)/)
})

test("poison conditions, computation and change", () => {
  assert.equal(say("!live || live.hp <= 0 || !(live.poison > 0)", null).text,
    "Jokin näistä: yksikkö (live) puuttuu; yksikkö (live) ei ole elossa; yksiköllä (live) ei ole myrkkyä (Poison)")
  assert.equal(translateComputation("const nextHp = Math.max(0, live.hp - stacks)").text, "nextHp = elämäpisteet miinus stacks, kuitenkin vähintään 0")
  assert.equal(translateEffect("next = setUnit(next, unit.id, { hp: nextHp, poison: stacks - 1 })", {}).text, "Asettaa yksikölle: elämäpisteet = nextHp, myrkkypinot = stacks - 1")
})

test("an unknown or unverified helper is never explained", () => {
  const unknown = say("samePos(u.pos, target.pos)")
  assert.equal(unknown.verified, false)
  assert.equal(unknown.text, null)
  assert.match(unknown.reason, /samePos.*ei ole luettu ja vahvistettu/)
  // a known helper whose source was NOT verified for this file stays code
  assert.equal(say("kingAdjacent(u.pos, target.pos)", "u", new Set()).verified, false)
  assert.equal(translateEffect("gainMana(state, id, 2, \"x\")", { helpers: new Set() }).verified, false)
  // an unknown field is not guessed, and one unknown part blocks the whole sentence
  assert.equal(say("u.mystery > 0").verified, false)
  assert.equal(say("u.hp > 0 && u.mystery > 0").verified, false)
})

test("a changed helper source is not accepted (fingerprint)", async () => {
  const fake = {
    "src/services/heartwood/targeting.js": "export function kingAdjacent(a, b) {\n  return true\n}\n",
    "src/services/heartwood/tacticsMana.js": HELPERS.manaOn.source,
  }
  const content = 'import { kingAdjacent } from "./targeting.js"\n'
  const verified = await verifyHelpers("src/services/heartwood/x.js", content, async file => fake[file] ?? null)
  assert.ok(!verified.has("kingAdjacent"), "changed body")
  assert.ok(!verified.has("manaOn"), "not imported by this file")
})

test("Intercept use is per enemy turn (reset in classPlayerTurnEnd, tacticsClasses.js:520)", () => {
  assert.equal(say("!u.interceptUsed").text, "Yksikkö ei ole vielä käyttänyt Interceptiä tämän vihollisvuoron aikana")
  assert.equal(say("u.interceptUsed").text, "Yksikkö on jo käyttänyt Interceptin tämän vihollisvuoron aikana")
})
