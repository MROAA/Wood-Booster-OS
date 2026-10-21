import { test } from "node:test"

import assert from "node:assert/strict"

import ToolBus from "../../../toolbus/ToolBus.js"

import CapabilityRegistry from "../../../toolbus/CapabilityRegistry.js"

import SkillEngine from "../../../skills/SkillEngine.js"

import WorkflowEngine from "../../../workflows/WorkflowEngine.js"

import PluginManager from "../../PluginManager.js"

import { registerPythonDeveloperPlugin } from "../../PythonDeveloper/index.js"

import { registerHqAssistantPlugin } from "../index.js"

import hqAssistantCapabilities, {
    validateChatCapability,
} from "../capabilities/hqAssistantCapabilities.js"



const silent = { info() {}, warn() {} }

function createEngines() {

    const toolBus = new ToolBus({ logger: silent })

    const skillEngine = new SkillEngine({ logger: silent })

    const workflowEngine = new WorkflowEngine({ skillEngine, logger: silent })

    const pluginManager = new PluginManager({ logger: silent })

    const capabilityRegistry = new CapabilityRegistry({ logger: silent })

    return { toolBus, skillEngine, workflowEngine, pluginManager, capabilityRegistry }

}



test("every shipped chat capability passes validation", () => {

    for (const capability of hqAssistantCapabilities) {
        assert.deepEqual(validateChatCapability(capability), [], capability.id)
    }

})



test("validation rejects unsafe or incomplete descriptors", () => {

    const base = hqAssistantCapabilities[0]

    assert.ok(validateChatCapability({ ...base, access: "root" }).length > 0)

    assert.ok(validateChatCapability({ ...base, workspace: "everywhere" }).length > 0)

    assert.ok(validateChatCapability({ ...base, mutates: true }).length > 0, "read + mutates")

    assert.ok(validateChatCapability({ ...base, mutates: undefined }).length > 0)

    assert.ok(validateChatCapability({ ...base, workflows: [] }).length > 0)

    assert.ok(
        validateChatCapability({ ...base, workflows: undefined, agent: undefined }).length > 0,
        "an executor (workflows or agent) is required",
    )

    assert.deepEqual(
        validateChatCapability({ ...base, workflows: undefined, agent: "developer-agent" }),
        [],
    )

    assert.ok(validateChatCapability({ ...base, name: "" }).length > 0)

    assert.ok(validateChatCapability(null).length > 0)

})



test("registration wires tool, skills, workflows and HQ capabilities", () => {

    const engines = createEngines()

    registerPythonDeveloperPlugin(engines)

    registerHqAssistantPlugin(engines)

    assert.ok(engines.toolBus.has("hq-projects"))

    assert.ok(engines.skillEngine.has("hq-list-unfinished-projects"))

    assert.ok(engines.skillEngine.has("hq-summarize-project"))

    assert.ok(engines.skillEngine.has("inspect-python"))

    assert.ok(engines.pluginManager.has("hq-assistant"))

    const workflowIds = engines.workflowEngine.list().map(workflow => workflow.id)

    for (const capability of engines.capabilityRegistry.list()) {
        assert.equal(capability.workspace, "hq")

        assert.equal(capability.access, "observe")

        assert.equal(capability.mutates, false)

        assert.equal(capability.plugin, "hq-assistant")

        for (const workflowId of capability.workflows || []) {
            assert.ok(workflowIds.includes(workflowId), `${capability.id} -> ${workflowId}`)
        }
    }

    assert.deepEqual(
        engines.capabilityRegistry.list().map(capability => capability.id),
        [
            "hq.projects.unfinished",
            "hq.projects.summary",
            "dev.python.inspect",
            "dev.project.find-files",
            "spacemonkey.agents.inventory",
            "hq.atlas.overview",
        ],
    )

    assert.equal(engines.capabilityRegistry.get("dev.python.inspect").category, "development")

    assert.equal(engines.capabilityRegistry.get("hq.projects.unfinished").category, "business")

})



test("registration without a capability registry still registers the tools", () => {

    const engines = createEngines()

    registerHqAssistantPlugin({ ...engines, capabilityRegistry: null })

    assert.ok(engines.toolBus.has("hq-projects"))

})
