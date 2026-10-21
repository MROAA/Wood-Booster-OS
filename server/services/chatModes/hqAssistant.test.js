import { test } from "node:test"
import assert from "node:assert/strict"

import ToolBus from "../spacemonkey/toolbus/ToolBus.js"
import CapabilityRegistry from "../spacemonkey/toolbus/CapabilityRegistry.js"
import SkillEngine from "../spacemonkey/skills/SkillEngine.js"
import WorkflowEngine from "../spacemonkey/workflows/WorkflowEngine.js"
import PluginManager from "../spacemonkey/plugins/PluginManager.js"
import { registerPythonDeveloperPlugin } from "../spacemonkey/plugins/PythonDeveloper/index.js"
import { registerHqAssistantPlugin } from "../spacemonkey/plugins/HqAssistant/index.js"
import { createFakePrisma } from "../spacemonkey/plugins/HqAssistant/tests/fakePrisma.js"
import AgentRuntime from "../spacemonkey/agents/runtime/AgentRuntime.js"
import registerAgents, { DEFAULT_PROJECT_ROOT } from "../spacemonkey/agents/runtime/registerAgents.js"
import {
  checkCapabilityHealth,
  checkCapabilityPermission,
  describeHqCapabilities,
  planHqAssistantTurn,
  runHqAssistantTurn,
} from "./hqAssistant.js"

const silent = { info() {}, warn() {} }

function createEngines() {
  const toolBus = new ToolBus({ logger: silent })
  const skillEngine = new SkillEngine({ logger: silent })
  const workflowEngine = new WorkflowEngine({ skillEngine, logger: silent })
  const pluginManager = new PluginManager({ logger: silent })
  const capabilityRegistry = new CapabilityRegistry({ logger: silent })
  const agentRuntime = registerAgents({ agentRuntime: new AgentRuntime({ logger: silent }), logger: silent })
  const engines = {
    toolBus,
    skillEngine,
    workflowEngine,
    pluginManager,
    capabilityRegistry,
    agentRuntime,
    projectRoot: DEFAULT_PROJECT_ROOT,
  }

  registerPythonDeveloperPlugin(engines)
  registerHqAssistantPlugin(engines)

  return engines
}

const PROJECTS = [
  { id: 4, name: "Keittiön tasot", status: "Suunnittelu", openSteps: 2, deadline: new Date(2026, 10, 12) },
  { id: 5, name: "Sauna", status: "Valmis", openSteps: 0 },
]

const noModel = async () => ({ model: null, reason: "no-model", message: "Koneelle ei ole asennettu sopivaa kielimallia." })

test("planner picks the registered capability for plain Finnish questions", () => {
  const cases = [
    ["Mitkä projektini ovat keskeneräisiä?", "hq.projects.unfinished"],
    ["näytä avoimet projektit", "hq.projects.unfinished"],
    ["Mitkä projektit ovat kesken", "hq.projects.unfinished"],
    ["tee tästä yhteenveto", "hq.projects.summary"],
    ["Mikä on tämän projektin tilanne?", "hq.projects.summary"],
    ["Spacemonkey, tarkista tämän Python-tiedoston toimivuus.", "dev.python.inspect"],
    ["katselmoi tiedosto server/tools/foo.py", "dev.python.inspect"],
  ]

  for (const [text, capabilityId] of cases) {
    assert.equal(planHqAssistantTurn({ text })?.capabilityId, capabilityId, text)
  }

  assert.equal(
    planHqAssistantTurn({ text: "katselmoi tiedosto server/tools/foo.py" }).input.filePath,
    "server/tools/foo.py",
  )
})

test("planner leaves change requests and ordinary chat to the existing paths", () => {
  for (const text of [
    "korjaa tiedosto agent.py",
    "lisää keskeneräiseen projektiin tehtävä",
    "muuta projektin tila valmiiksi",
    "paranna tämän moduulin rakennetta",
    "Tilannekatsaus.",
    "Kerro vitsi",
    "",
  ]) {
    assert.equal(planHqAssistantTurn({ text }), null, text)
  }
})

test("permission allows only read capabilities of the HQ workspace", () => {
  const read = { id: "x", workspace: "hq", access: "observe", mutates: false, requiresApproval: false }

  assert.equal(checkCapabilityPermission(read).allowed, true)
  assert.equal(checkCapabilityPermission({ ...read, access: "project-draft" }).reason, "needs-write-access")
  assert.equal(checkCapabilityPermission({ ...read, access: "approved-execution" }).reason, "needs-write-access")
  assert.equal(checkCapabilityPermission({ ...read, access: "external-publishing" }).reason, "needs-write-access")
  assert.equal(checkCapabilityPermission({ ...read, access: "read" }).reason, "needs-write-access", "unknown level")
  assert.equal(checkCapabilityPermission({ ...read, mutates: true }).reason, "needs-write-access")
  assert.equal(checkCapabilityPermission({ ...read, requiresApproval: true }).reason, "needs-write-access")
  assert.equal(checkCapabilityPermission({ ...read, workspace: "hearthwood" }).reason, "other-workspace")
  assert.equal(checkCapabilityPermission({ ...read, enabled: false }).reason, "disabled")
  assert.equal(checkCapabilityPermission(null).reason, "not-registered")
})

test("unfinished projects come from the real tool path and nothing is written", async () => {
  const engines = createEngines()
  const { prisma, writes } = createFakePrisma({ projects: PROJECTS })

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "Mitkä projektini ovat keskeneräisiä?" }),
    prisma,
    engines,
  })

  assert.equal(result.status, 200)
  assert.equal(result.body.success, true)
  assert.match(result.body.answer, /Keskeneräisiä projekteja on 1/)
  assert.match(result.body.answer, /- Keittiön tasot \(#4\) - Suunnittelu, 2 avointa työvaihetta, takaraja 12\.11\.2026/)
  assert.doesNotMatch(result.body.answer, /Sauna/)
  assert.equal(result.body.toolRun.capabilityId, "hq.projects.unfinished")
  assert.equal(result.body.toolRun.access, "observe")
  assert.equal(result.body.toolRun.mutated, false)
  assert.equal(result.body.toolRun.outcome, "ok")
  assert.deepEqual(writes, [])
})

test("project summary uses the active project's real id", async () => {
  const engines = createEngines()
  const { prisma, calls } = createFakePrisma({
    details: {
      4: {
        id: 4,
        name: "Keittiön tasot",
        status: "Suunnittelu",
        customer: { name: "Asiakas Oy", company: null },
        workflowSteps: [
          { id: 1, title: "Mittaus", done: true },
          { id: 2, title: "Materiaalit", done: false },
        ],
        timelineTasks: [],
        quote: { quoteNumber: "T-12", status: "Avoin" },
        projectNotes: [],
        _count: { materials: 3, files: 1, projectNotes: 0 },
      },
    },
  })

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "tee tästä yhteenveto" }),
    runtimeContext: { activeProject: { id: 4, name: "Keittiön tasot" } },
    prisma,
    engines,
  })

  assert.equal(result.body.success, true)
  assert.match(result.body.answer, /Työvaiheet: 1\/2 tehty\. Avoimena: Materiaalit\./)
  assert.match(result.body.answer, /Tarjous: T-12, tila Avoin\./)
  assert.equal(result.body.toolRun.projectId, 4)
  assert.deepEqual(calls.find(call => call.method === "findUnique").args.where, { id: 4 })
})

test("summary without an open project asks for one instead of guessing", async () => {
  const engines = createEngines()
  const { prisma, calls } = createFakePrisma()

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "tee tästä yhteenveto" }),
    runtimeContext: { activeProject: {} },
    prisma,
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "needs-project")
  assert.match(result.body.answer, /Avaa projekti/)
  assert.equal(calls.length, 0)
})

test("an unregistered capability is handled without guessing", async () => {
  const result = await runHqAssistantTurn({
    plan: { capabilityId: "hq.quotes.send", input: {} },
    engines: createEngines(),
  })

  assert.equal(result.body.success, false)
  assert.equal(result.body.toolRun.outcome, "not-registered")
  assert.match(result.body.answer, /en arvaa vastausta/)
})

test("a registered capability that needs write access is refused in chat", async () => {
  const engines = createEngines()
  engines.capabilityRegistry.register({
    id: "hq.projects.update",
    name: "Projektin muutos",
    workspace: "hq",
    access: "approved-execution",
    mutates: true,
    requiresApproval: true,
    workflows: ["hq-list-unfinished-projects-workflow"],
    requires: ["database"],
  })

  const result = await runHqAssistantTurn({
    plan: { capabilityId: "hq.projects.update", input: {} },
    prisma: createFakePrisma().prisma,
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "denied")
  assert.equal(result.body.toolRun.mutated, false)
})

test("missing runtime or database makes the capability unavailable, not broken", async () => {
  const engines = createEngines()
  const capability = engines.capabilityRegistry.get("hq.projects.unfinished")

  assert.deepEqual(checkCapabilityHealth(capability, { engines, prisma: null }).missing, ["database"])
  assert.deepEqual(
    checkCapabilityHealth(capability, { engines: { ...engines, workflowEngine: null }, prisma: {} }).missing,
    ["spacemonkey-runtime", "workflow:hq-list-unfinished-projects-workflow"],
  )

  const result = await runHqAssistantTurn({
    plan: { capabilityId: "hq.projects.unfinished", input: {} },
    prisma: null,
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "unavailable")
  assert.match(result.body.answer, /database/)
})

test("python check works without a language model and says so", async () => {
  const engines = createEngines()
  let reviewCalls = 0

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "tarkista tiedosto agent.py" }),
    engines,
    deps: {
      resolveReviewModel: noModel,
      reviewPythonCode: async () => { reviewCalls += 1; return { review: "x" } },
    },
  })

  assert.equal(result.body.success, true)
  assert.match(result.body.answer, /Tarkistin tiedoston agent\.py \(vain luku\)/)
  assert.match(result.body.answer, /Syntaksi: kunnossa/)
  assert.match(result.body.answer, /Kielimallin katselmointia ei tehty: Koneelle ei ole asennettu/)
  assert.equal(result.body.toolRun.outcome, "ok-without-model")
  assert.equal(reviewCalls, 0)
})

test("python check uses the existing review workflow with the resolved model", async () => {
  const engines = createEngines()
  const seen = []

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "katselmoi agent.py" }),
    engines,
    deps: {
      resolveReviewModel: async () => ({ model: "kahnwong/poro-2:8b-it", source: "config" }),
      reviewPythonCode: async ({ code, model }) => {
        seen.push({ length: code.length, model })
        return { review: "Selkeä tiedosto." }
      },
    },
  })

  assert.equal(seen.length, 1)
  assert.equal(seen[0].model, "kahnwong/poro-2:8b-it")
  assert.ok(seen[0].length > 0)
  assert.match(result.body.answer, /kielimallin kahnwong\/poro-2:8b-it arvio, ei testattu tulos/)
  assert.match(result.body.answer, /Selkeä tiedosto\./)
  assert.equal(result.body.toolRun.model, "kahnwong/poro-2:8b-it")
})

test("a failing model keeps the checked facts and reports the failure", async () => {
  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "tarkista agent.py" }),
    engines: createEngines(),
    deps: {
      resolveReviewModel: async () => ({ model: "kahnwong/poro-2:8b-it" }),
      reviewPythonCode: async () => { throw new Error("Ollama ei vastannut 60 sekunnissa.") },
    },
  })

  assert.equal(result.body.success, true)
  assert.match(result.body.answer, /Syntaksi: kunnossa/)
  assert.match(result.body.answer, /katselmointi epäonnistui: Ollama ei vastannut 60 sekunnissa\./)
  assert.equal(result.body.toolRun.outcome, "ok-without-model")
})

test("python check refuses files outside the project or not .py", async () => {
  for (const text of ["tarkista ../../etc/shadow.py", "tarkista tiedosto /etc/passwd.py"]) {
    const result = await runHqAssistantTurn({
      plan: planHqAssistantTurn({ text }),
      engines: createEngines(),
      deps: { resolveReviewModel: noModel },
    })

    assert.equal(result.body.success, false, text)
    assert.equal(result.body.toolRun.code, "unsafe_file_path", text)
  }
})

test("python check without a path asks which file", async () => {
  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "tarkista tämän Python-tiedoston toimivuus" }),
    engines: createEngines(),
  })

  assert.equal(result.body.toolRun.outcome, "needs-file")
})

test("capability listing shows access level and health for the HQ workspace", () => {
  const engines = createEngines()
  const listed = describeHqCapabilities({ engines, prisma: createFakePrisma().prisma })

  assert.deepEqual(listed.map(item => item.id), [
    "hq.projects.unfinished",
    "hq.projects.summary",
    "dev.python.inspect",
    "dev.project.find-files",
    "spacemonkey.agents.inventory",
    "hq.atlas.overview",
  ])

  for (const item of listed) {
    assert.equal(item.access, "observe")
    assert.equal(item.permission.allowed, true)
    assert.equal(item.health.ready, true, item.id)
  }
})

test("planner sends file-name searches to the Developer Agent capability", () => {
  assert.deepEqual(planHqAssistantTurn({ text: "etsi tiedostot nimellä toolRunText" }), {
    capabilityId: "dev.project.find-files",
    input: { search: "toolRunText" },
  })
  assert.equal(planHqAssistantTurn({ text: "etsi tiedosto ../../etc/passwd" }).input.search, null)
  assert.equal(planHqAssistantTurn({ text: "etsi tiedosto" }).input.search, null)
})

test("file search runs through the Agent Runtime and the existing Developer Agent", async () => {
  const engines = createEngines()

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "etsi tiedostot nimellä toolRunText" }),
    engines,
  })

  assert.equal(result.body.success, true, result.body.answer)
  assert.match(result.body.answer, /Developer Agent löysi 2 tiedostoa, joiden nimessä on "toolRunText"/)
  assert.match(result.body.answer, /- src\/components\/ai\/toolRunText\.js \(/)
  assert.match(result.body.answer, /Tiedostojen sisältöä ei luettu\./)
  assert.equal(result.body.toolRun.agentId, "developer-agent")
  assert.equal(result.body.toolRun.taskState, "succeeded")
  assert.equal(result.body.toolRun.access, "observe")

  const task = engines.agentRuntime.getTask(result.body.toolRun.taskId)
  assert.deepEqual(task.history.map(entry => entry.state), ["queued", "running", "succeeded"])
})

test("file search never lists protected files such as .env", async () => {
  const result = await runHqAssistantTurn({
    plan: { capabilityId: "dev.project.find-files", input: { search: ".env" } },
    engines: createEngines(),
  })

  assert.doesNotMatch(result.body.answer, /^- .*\.env\b/m)
  assert.equal(result.body.toolRun.taskState, "succeeded")
})

test("file search without a search term asks for one and starts no task", async () => {
  const engines = createEngines()

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "etsi tiedosto" }),
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "needs-term")
  assert.deepEqual(engines.agentRuntime.listTasks(), [])
})

test("a missing agent runtime makes the agent capability unavailable", async () => {
  const engines = { ...createEngines(), agentRuntime: null }

  const result = await runHqAssistantTurn({
    plan: { capabilityId: "dev.project.find-files", input: { search: "agent" } },
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "unavailable")
  assert.match(result.body.answer, /agent-runtime/)
})

test("planner sends agent questions to the agent inventory", () => {
  for (const text of ["Mitä agentteja sinulla on?", "listaa aliagentit", "Mitkä agentit ovat käytössä"]) {
    assert.equal(planHqAssistantTurn({ text })?.capabilityId, "spacemonkey.agents.inventory", text)
  }
  assert.equal(planHqAssistantTurn({ text: "lisää uusi agentti" }), null)
})

test("the agent inventory answer comes from the runtime and code, with honest health", async () => {
  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "Mitä agentteja sinulla on?" }),
    engines: createEngines(),
  })

  assert.equal(result.body.success, true, result.body.answer)
  assert.match(result.body.answer, /Agent Runtime: 3 rekisteröityä agenttia/)
  assert.match(result.body.answer, /- Developer Agent: toimintakunnossa\. Kyvykkyys: Tiedostohaku projektista \(vain luku\); valittavissa keskustelusta/)
  assert.match(result.body.answer, /- WordPress Agent: EI toimintakunnossa \(puuttuu: planner, toolBus\)/)
  assert.match(result.body.answer, /Pluginit \(eivät agentteja\): .*python-developer/)
  assert.match(result.body.answer, /BaseAgent \(server\/services\/spacemonkey\/agents\/BaseAgent\.js\) ei lataudu palvelimessa/)
  assert.ok(result.body.toolRun.commit)
  assert.equal(result.body.toolRun.mutated, false)
})

test("an agent capability whose agent is not healthy is unavailable and starts no task", async () => {
  const engines = createEngines()

  engines.agentRuntime.health = () => ({ ready: false, missing: ["projectRoot"] })

  const result = await runHqAssistantTurn({
    plan: { capabilityId: "dev.project.find-files", input: { search: "agent" } },
    engines,
  })

  assert.equal(result.body.toolRun.outcome, "unavailable")
  assert.match(result.body.answer, /agent:developer-agent/)
  assert.deepEqual(engines.agentRuntime.listTasks(), [])
})

test("planner sends 'what has been built' questions to the Atlas", () => {
  assert.deepEqual(
    planHqAssistantTurn({ text: "Mitä Wood-Booster HQ:ssa on rakennettu ja mitä projektissani tapahtuu?" }),
    { capabilityId: "hq.atlas.overview", input: { withProject: true } },
  )
  assert.equal(planHqAssistantTurn({ text: "Mitä olen jo rakentanut?" }).capabilityId, "hq.atlas.overview")
  assert.equal(planHqAssistantTurn({ text: "Mitä Wood-Booster HQ osaa tällä hetkellä?" }).capabilityId, "hq.atlas.overview")
  assert.deepEqual(
    planHqAssistantTurn({ text: "Mitä projektissani tapahtuu?" }),
    { capabilityId: "hq.projects.summary", input: { fallbackToUnfinished: true } },
  )
  assert.equal(planHqAssistantTurn({ text: "osaatko laskea" }), null)
})

test("the Atlas answer separates implemented, in development and unknown, from evidence", async () => {
  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "Mitä Wood-Booster HQ:ssa on rakennettu?" }),
    engines: createEngines(),
  })

  assert.equal(result.body.success, true, result.body.answer)
  assert.match(result.body.answer, /^Wood-Booster HQ - mitä on rakennettu \(haara .+, commit [0-9a-f]+/)
  assert.match(result.body.answer, /Toteutettu \(\d+\) - koodi on olemassa, palvelin tai sovellus lataa sen/)
  assert.match(result.body.answer, /- Liiketoiminta: Dashboard, Projektinhallinta/)
  assert.match(result.body.answer, /Epävarma \(\d+\):\n(- .*\n)*- Tuotesuunnittelu: toteutusta ei tunneta/)
  assert.match(result.body.answer, /Human Approval Gateway: haarassa feat\/security-approval-gateway-phase1/)
  assert.match(result.body.answer, /Hearthwood on erillinen projekti/)
  assert.doesNotMatch(result.body.answer, /Projektisi:/)
  assert.ok(result.body.toolRun.commit)
})

test("with an open project the Atlas answer adds that project's summary and the current view", async () => {
  const { prisma, writes } = createFakePrisma({
    details: {
      4: {
        id: 4,
        name: "Keittiön tasot",
        status: "Suunnittelu",
        customer: null,
        workflowSteps: [{ id: 1, title: "Mittaus", done: false }],
        timelineTasks: [],
        quote: null,
        projectNotes: [],
        _count: { materials: 0, files: 0, projectNotes: 0 },
      },
    },
  })

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "Mitä HQ:ssa on rakennettu ja mitä projektissani tapahtuu?" }),
    runtimeContext: {
      activeProject: { id: 4 },
      route: { pageName: "Projekti" },
      location: { pathname: "/projects/4" },
    },
    prisma,
    engines: createEngines(),
  })

  assert.match(result.body.answer, /Projektisi:\nNäkymä nyt: Projekti \(\/projects\/4\)\.\nKeittiön tasot \(#4\) - tila: Suunnittelu/)
  assert.deepEqual(result.body.toolRun.project, {
    capabilityId: "hq.projects.summary",
    outcome: "ok",
    projectId: 4,
  })
  assert.deepEqual(writes, [])
})

test("'what is happening in my project' without an open project lists unfinished projects", async () => {
  const { prisma } = createFakePrisma({ projects: PROJECTS })

  const result = await runHqAssistantTurn({
    plan: planHqAssistantTurn({ text: "Mitä projektissani tapahtuu?" }),
    prisma,
    engines: createEngines(),
  })

  assert.equal(result.body.toolRun.capabilityId, "hq.projects.unfinished")
  assert.match(result.body.answer, /Keskeneräisiä projekteja on 1/)
})
