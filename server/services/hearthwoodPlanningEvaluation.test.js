import { test, mock, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Independent planning evaluation on a small herbalism fixture game
// (server/spacemonkey-eval/fixture), deliberately unlike Guardian.
// The model is mocked: these tests check what the MACHINE verifies
// (source authenticity, plan quality, dependency claims), never whether
// a model would decide correctly — that needs ground truth (spacemonkey-eval).

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = path.join(__dirname, "../spacemonkey-eval/fixture")
const responses = []
const calls = []
let ROOT
let generator

before(async () => {
  ROOT = await fs.mkdtemp(path.join(os.tmpdir(), "hearthwood-plan-eval-"))
  await fs.cp(FIXTURE, ROOT, { recursive: true })
  // Weather rules live only in a file too large to read: insufficient evidence.
  await fs.writeFile(path.join(ROOT, "src/services/heartwood/weatherHerbs.js"),
    "// weather withers herbs\n" + "x".repeat(600000))
  process.env.HEARTHWOOD_PROJECT_ROOT = ROOT
  mock.module(path.join(__dirname, "ollamaClient.js"), {
    exports: {
      chatWithOllama: async args => {
        calls.push(args)
        if (!responses.length) throw new Error("test: no mocked response left")
        return responses.shift()
      },
    },
  })
  generator = await import("./hearthwoodChangePlanGenerator.js")
})

after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await fs.rm(ROOT, { recursive: true, force: true })
})

function plan(task, ...answers) {
  responses.length = 0
  responses.push(...answers)
  calls.length = 0
  return generator.generateHearthwoodChangePlan({ prompt: task })
}

const check = (result, id) => result.planQuality.checks.find(c => c.id === id).status

test("working mechanic: no-change gives zero files and no required changes", async () => {
  const result = await plan("Tarkista, kuluttaako yrttijuoman keittäminen (brew potion) yrtin ja parantaako se.",
    "PÄÄTÖS: NO_CHANGE_NEEDED\nSUUNNITELMA:\nSELITYS: Nykyinen toteutus: brewPotion vähentää yrtin ja " +
    "parantaa hpMax-rajaan asti. Epävarmuudet: muita parannuslähteitä ei tutkittu.")
  assert.equal(result.proposedDecision, "NO_CHANGE_NEEDED")
  assert.deepEqual(result.files, [])
  assert.deepEqual(result.planQuality.requiredChanges, [])
  assert.equal(check(result, "source-authenticity"), "verified")
  assert.equal(result.executionApproved, false)
})

test("missing mechanic: one justified file, follow-ups kept out of the change set", async () => {
  const result = await plan("Lisää yrttien keräämiseen (gather herb) pilaantuminen: yrtti katoaa kolmen vuoron jälkeen.",
    "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/herbalism.js | gatherHerb tallentaa keräysvuoron pilaantumista varten\n" +
    "- JATKO: näytä pilaantumisaika käyttöliittymässä\n" +
    "SELITYS: Nykyinen toteutus: gatherHerb lisää yrtin ilman aikaleimaa.\n" +
    "Todiste lähdekoodista:\n```\nexport function gatherHerb(state, unitId, herbId) {\n```\n" +
    "Ehdotettu muutos: tallenna vuoro. " +
    "Riippuvuudet: endTurn kutsuu gatherHerb. Testit: uusi testi pilaantumiselle. Riskit: satchel-rakenne muuttuu.")
  assert.equal(result.status, "plan_ready")
  assert.deepEqual(result.files.map(f => f.filePath), ["src/services/heartwood/herbalism.js"])
  assert.deepEqual(result.planQuality.requiredChanges.map(f => f.symbols), [["gatherHerb"]])
  assert.deepEqual(result.planQuality.followUps, ["näytä pilaantumisaika käyttöliittymässä"])
  assert.equal(check(result, "files-justified"), "verified")
  assert.equal(check(result, "model-sections"), "model-claimed")
  assert.equal(check(result, "model-correctness"), "not-verifiable-here")
  assert.notEqual(result.executionApproved, true)
})

test("dependency impact: only verified call sites, with exact lines and honest scope", async () => {
  const result = await plan("Korjaa yrttien keräys (gather herb): pino ylittää stackMax-rajan yhdellä.",
    "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/herbalism.js | gatherHerb vertailu count > stackMax sallii yhden liikaa\n" +
    "SELITYS: Nykyinen toteutus: gatherHerb hylkää vasta kun count > def.stackMax.\n" +
    "Todiste lähdekoodista:\n```\nif (count > def.stackMax) return state\n```\n" +
    "Ehdotettu muutos: >=. " +
    "Riippuvuudet: endTurn. Testit: rajatesti. Riskit: pieni.")
  const impact = result.planQuality.dependencyImpact
  const gather = impact.symbols.find(s => s.symbol === "gatherHerb")
  assert.equal(gather.definition.exported, true)
  assert.deepEqual(gather.callSites.map(c => [c.filePath, c.caller]),
    [["src/services/heartwood/turns.js", "endTurn"]])
  assert.equal(gather.interfaceRisk, true)
  for (const site of gather.callSites) {
    const line = (await fs.readFile(path.join(ROOT, site.filePath), "utf8")).split("\n")[site.line - 1]
    assert.match(line, /gatherHerb\(/, "every claimed call site is a real line")
  }
  // brewPotion has a test; gatherHerb only shares the file with one.
  assert.deepEqual(gather.existingTests, [])
  assert.deepEqual(gather.fileOnlyTests, ["src/services/heartwood/herbalism.test.js"])
  assert.deepEqual(impact.missingRegressionTests, ["src/services/heartwood/herbalism.js: gatherHerb"])
  assert.equal(check(result, "tests"), "missing")
  assert.match(impact.scope.limits, /ei ole koko projektin osalta täydellinen/)
})

test("multi-file change: each dependent file is justified by its own symbol", async () => {
  const result = await plan("Lisää jokaiselle yrtille (herbs) oma pilaantumisaika ja poista pilaantuneet vuoron lopussa (end turn).",
    "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/data/heartwood/herbs.js | HERBS saa kentän spoilTurns\n" +
    "- MUOKKAA: src/services/heartwood/turns.js | endTurn poistaa pilaantuneet yrtit\n" +
    "SELITYS: Nykyinen toteutus: HERBS ei tunne pilaantumista, endTurn vain kerää.\n" +
    "Todiste lähdekoodista:\n```\nexport function endTurn(state) {\n```\n" +
    "Ehdotettu muutos: kaksi tiedostoa. " +
    "Riippuvuudet: endTurn kutsuu gatherHerb. Testit: vuorotesti. Riskit: tallennusmuoto.")
  assert.deepEqual(result.planQuality.requiredChanges.map(f => [f.filePath, f.symbols]), [
    ["src/data/heartwood/herbs.js", ["HERBS"]],
    ["src/services/heartwood/turns.js", ["endTurn"]],
  ])
  assert.equal(check(result, "minimal"), "verified")
})

test("insufficient evidence: unreadable source is named, the result stays review-only", async () => {
  const result = await plan("Miten sää (weather) kuihduttaa yrttejä (herbs)?",
    "PÄÄTÖS: INSUFFICIENT_EVIDENCE\nSUUNNITELMA:\n" +
    "SELITYS: Mitä pitää vielä tutkia: sääjärjestelmän lähdettä ei luettu, HERBS ei mainitse säätä.")
  assert.equal(result.proposedDecision, "INSUFFICIENT_EVIDENCE")
  assert.deepEqual(result.files, [])
  assert.ok(result.evidenceReport.unknown.some(u => u.startsWith("src/services/heartwood/weatherHerbs.js")))
})

test("an invented symbol is refused after the retry", async () => {
  const forged = "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/herbalism.js | lisää spoilHerbsNow\n" +
    "SELITYS: Nykyinen toteutus: spoilHerbsNow hoitaa tämän jo osittain."
  await assert.rejects(plan("Lisää yrttien (herbs) pilaantuminen keräyksessä (gather).", forged, forged))
  assert.equal(calls.length, 2)
})

test("an unjustified extra file triggers a retry, and the clean answer is kept", async () => {
  const padded = "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/herbalism.js | gatherHerb rajan korjaus\n" +
    "- MUOKKAA: src/services/heartwood/lanterns.js | varmuuden vuoksi\n" +
    "SELITYS: Nykyinen toteutus: gatherHerb sallii yhden liikaa.\n" +
    "Todiste lähdekoodista:\n```\nif (count > def.stackMax) return state\n```\n" +
    "Ehdotettu muutos: korjaa vertailu."
  const clean = padded.replace("- MUOKKAA: src/services/heartwood/lanterns.js | varmuuden vuoksi\n", "")
  const result = await plan("Korjaa yrttien keräyksen (gather herb) pinoraja.", padded, clean)
  assert.equal(calls.length, 2)
  assert.match(calls[1].userMessage, /perusteettomia tiedostoja: src\/services\/heartwood\/lanterns\.js/)
  assert.deepEqual(result.files.map(f => f.filePath), ["src/services/heartwood/herbalism.js"])
})

test("an unjustified extra file twice is refused, never silently trimmed", async () => {
  const padded = "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
    "- MUOKKAA: src/services/heartwood/herbalism.js | gatherHerb rajan korjaus\n" +
    "- MUOKKAA: src/data/heartwood/herbs.js | siistitään samalla\n" +
    "SELITYS: Nykyinen toteutus: gatherHerb sallii yhden liikaa.\n" +
    "Todiste lähdekoodista:\n```\nif (count > def.stackMax) return state\n```\n"
  await assert.rejects(plan("Korjaa yrttien keräyksen (gather herb) pinoraja.", padded, padded),
    /perusteettomia tiedostoja: src\/data\/heartwood\/herbs\.js/)
})

test("no-change and insufficient evidence never carry files", async () => {
  const withFile = decision => `PÄÄTÖS: ${decision}\nSUUNNITELMA:\n` +
    "- MUOKKAA: src/services/heartwood/herbalism.js | brewPotion\n" +
    "SELITYS: Nykyinen toteutus: brewPotion toimii jo."
  for (const decision of ["NO_CHANGE_NEEDED", "INSUFFICIENT_EVIDENCE"]) {
    await assert.rejects(plan("Tarkista keittäminen (brew potion).", withFile(decision), withFile(decision)))
  }
})

const QUOTELESS = "PÄÄTÖS: CHANGE_REQUIRED\nSUUNNITELMA:\n" +
  "- MUOKKAA: src/services/heartwood/herbalism.js | gatherHerb rajan korjaus\n" +
  "SELITYS: Nykyinen toteutus: gatherHerb sallii yhden liikaa. Ehdotettu muutos: >=."
const quoted = line => QUOTELESS.replace(" Ehdotettu muutos:",
  `\nTodiste lähdekoodista:\n\`\`\`\n${line}\n\`\`\`\nEhdotettu muutos:`)

test("a change plan without a source quote gets a retry and the quoted answer is kept", async () => {
  const result = await plan("Korjaa yrttien keräyksen (gather herb) pinoraja.",
    QUOTELESS, quoted("if (count > def.stackMax) return state"))
  assert.equal(calls.length, 2)
  assert.match(calls[1].userMessage, /koodilainaus/i)
  assert.equal(check(result, "source-quotes"), "verified")
})

test("an inexact quote is never marked verified; the route gates still decide", async () => {
  const fabricated = quoted("if (count >= def.stackMax) return state")
  const result = await plan("Korjaa yrttien keräyksen (gather herb) pinoraja.", fabricated, fabricated)
  assert.equal(calls.length, 2)
  assert.equal(check(result, "source-quotes"), "failed")
  assert.notEqual(result.executionApproved, true)
})
