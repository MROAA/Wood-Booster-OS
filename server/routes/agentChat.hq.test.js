/*
 * HQ-keskustelun reittitesti: oikea /api/agents-reititin, oikea
 * Spacemonkey Runtime Bootstrap (sama rekisteröinti kuin palvelimella)
 * ja Prisma-korvike joka kieltää kaikki projektitietojen kirjoitukset.
 *
 * Ollama osoitetaan suljettuun porttiin ENNEN moduulien latausta, joten
 * testi ei koskaan lataa kielimallia - se todistaa samalla, että
 * vain luku -työkalut toimivat ilman mallia ja että tavallinen
 * keskustelu kertoo puuttuvasta mallista selvästi.
 */
import { after, before, test } from "node:test"
import assert from "node:assert/strict"

process.env.OLLAMA_URL = "http://127.0.0.1:9"
process.env.AHMA_URL = "http://127.0.0.1:9"

const { default: fs } = await import("node:fs")
const { default: os } = await import("node:os")
const { default: path } = await import("node:path")

// Spacemonkeyn työtila väliaikaiseen hakemistoon, ei käyttäjän oikeaan.
const workspaceParent = fs.mkdtempSync(path.join(os.tmpdir(), "hq-route-ws-"))
process.env.SPACEMONKEY_WORKSPACE_ROOT = path.join(workspaceParent, "spacemonkey")

const { default: express } = await import("express")
const { default: createAgentChatRouter, runAgentChat } = await import("./agentChat.js")
const { startSpacemonkeyRuntimeBootstrap } = await import(
  "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"
)
const { createFakePrisma } = await import(
  "../services/spacemonkey/plugins/HqAssistant/tests/fakePrisma.js"
)

const fake = createFakePrisma({
  projects: [
    { id: 4, name: "Keittiön tasot", status: "Suunnittelu", openSteps: 2 },
    { id: 5, name: "Sauna", status: "Valmis", openSteps: 0 },
  ],
  allowWrites: ["conversation", "message"],
})

let server
let baseUrl

before(async () => {
  startSpacemonkeyRuntimeBootstrap({ logger: { info() {}, warn() {}, error() {} } })

  const app = express()
  app.use(express.json())
  app.use("/api/agents", createAgentChatRouter(fake.prisma))

  await new Promise(resolve => {
    server = app.listen(0, "127.0.0.1", resolve)
  })

  baseUrl = `http://127.0.0.1:${server.address().port}/api/agents`
})

after(() => {
  server?.close()
  fs.rmSync(workspaceParent, { recursive: true, force: true })
})

async function chat(message, extra = {}) {
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...extra }),
  })

  return { status: response.status, body: await response.json() }
}

function projectWrites() {
  return fake.writes.filter(write => !["conversation", "message"].includes(write.model))
}

test("HQ chat answers 'which projects are unfinished' from project data", async () => {
  const { status, body } = await chat("Mitkä projektini ovat keskeneräisiä?")

  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(body.mode, "spacemonkey")
  assert.match(body.answer, /Keittiön tasot/)
  assert.doesNotMatch(body.answer, /Sauna/)
  assert.equal(body.toolRun.capabilityId, "hq.projects.unfinished")
  assert.equal(body.toolRun.mutated, false)
  assert.deepEqual(body.actions, [])
  assert.deepEqual(projectWrites(), [])
})

test("a Python file check is routed to the read-only tool, not to a code change", async () => {
  const { body } = await chat("tarkista tiedosto agent.py")

  assert.notEqual(body.kind, "confirm_koodi")
  assert.equal(body.toolRun.capabilityId, "dev.python.inspect")
  assert.equal(body.toolRun.outcome, "ok-without-model")
  assert.match(body.answer, /Syntaksi: kunnossa/)
  assert.match(body.answer, /Ollama\) ei vastaa/)
})

test("a change request still goes to the existing confirmation flow", async () => {
  const { body } = await chat("korjaa tiedosto agent.py")

  assert.equal(body.kind, "confirm_koodi")
  assert.equal(body.toolRun, undefined)
})

test("ordinary chat says clearly that the language model is unavailable", async () => {
  const { status, body } = await chat("Kerro mitä kuuluu")

  assert.equal(status, 200)
  assert.equal(body.success, false)
  assert.match(body.answer, /kielimalli ei ole nyt käytettävissä/)
  assert.equal(body.modelStatus.reason, "ollama-unreachable")
})

test("an installed model that does not answer is reported, not shown as an empty reply", async () => {
  const result = await runAgentChat({
    message: "Kerro mitä kuuluu",
    prisma: fake.prisma,
    resolveModel: async () => ({ model: "qwen2.5-coder:7b", source: "installed" }),
  })

  assert.equal(result.body.success, false)
  assert.equal(result.body.reason, "chat model failed")
  assert.match(result.body.answer, /^Kielimalli qwen2\.5-coder:7b ei vastannut: /)
})

test("the capability list shows what Spacemonkey can do right now", async () => {
  const response = await fetch(`${baseUrl}/capabilities`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(
    body.capabilities.map(capability => [capability.id, capability.access, capability.health.ready]),
    [
      ["hq.projects.unfinished", "observe", true],
      ["hq.projects.summary", "observe", true],
      ["dev.python.inspect", "observe", true],
      ["dev.project.find-files", "observe", true],
      ["spacemonkey.agents.inventory", "observe", true],
      ["hq.atlas.overview", "observe", true],
      ["system.status.check", "workspace", true],
      ["spacemonkey.workspace.overview", "observe", true],
    ],
  )
})

test("the agent inventory is reachable from chat and as JSON", async () => {
  const { body } = await chat("Mitä agentteja sinulla on?")

  assert.equal(body.toolRun.capabilityId, "spacemonkey.agents.inventory")
  assert.match(body.answer, /Developer Agent: toimintakunnossa/)

  const response = await fetch(`${baseUrl}/inventory`)
  const json = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(
    json.inventory.runtimeAgents.map(agent => agent.id),
    ["developer-agent", "wordpress-agent", "instagram-agent"],
  )
})

test("a file search from chat runs a real Developer Agent task", async () => {
  const { body } = await chat("etsi tiedostot nimellä hqProjectsTool")

  assert.equal(body.toolRun.agentId, "developer-agent")
  assert.equal(body.toolRun.taskState, "succeeded")
  assert.match(body.answer, /hqProjectsTool\.js/)
})

test("the Atlas question answers from source evidence and adds the user's projects", async () => {
  const { body } = await chat("Mitä Wood-Booster HQ:ssa on rakennettu ja mitä projektissani tapahtuu?", {
    runtimeContext: {
      route: { pageName: "Projektit" },
      location: { pathname: "/projects" },
    },
  })

  assert.equal(body.toolRun.capabilityId, "hq.atlas.overview")
  assert.match(body.answer, /Toteutettu \(\d+\)/)
  assert.match(body.answer, /Projektinhallinta/)
  assert.match(body.answer, /Testattu: tässä haussa ei mitään/)
  assert.match(body.answer, /Projektisi:\nNäkymä nyt: Projektit \(\/projects\)\./)
  assert.match(body.answer, /Keittiön tasot/)
  assert.equal(body.toolRun.project.capabilityId, "hq.projects.unfinished")

  const response = await fetch(`${baseUrl}/atlas`)
  const json = await response.json()

  assert.equal(response.status, 200)
  assert.ok(json.atlas.systems.some(system => system.id === "projects" && system.status === "implemented"))
})

test("the machine status check runs for real without root and writes only to the workspace", async () => {
  const { body } = await chat("Tarkista koneen tila")

  assert.equal(body.toolRun.capabilityId, "system.status.check")
  assert.match(body.answer, /Koneen tila \(luettu nyt, tavallisena käyttäjänä, ilman root-oikeuksia\)/)
  assert.equal(body.toolRun.projectDataChanged, false)

  const reportFile = path.join(process.env.SPACEMONKEY_WORKSPACE_ROOT, body.toolRun.workspaceFiles[1])
  assert.match(fs.readFileSync(reportFile, "utf8"), /^Koneen tila/)
})

test("no project data was written during the whole chat session", () => {
  assert.deepEqual(projectWrites(), [])
  assert.ok(
    fake.calls.some(call => call.model === "message" && call.method === "create"),
    "chat history is still persisted as before",
  )
})
