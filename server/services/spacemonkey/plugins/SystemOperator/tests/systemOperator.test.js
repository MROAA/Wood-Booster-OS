import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import ToolBus from "../../../toolbus/ToolBus.js"

import CapabilityRegistry from "../../../toolbus/CapabilityRegistry.js"

import SkillEngine from "../../../skills/SkillEngine.js"

import WorkflowEngine from "../../../workflows/WorkflowEngine.js"

import PluginManager from "../../PluginManager.js"

import SpacemonkeyWorkspace from "../../../workspace/SpacemonkeyWorkspace.js"

import { registerSystemOperatorPlugin } from "../index.js"

import { validateChatCapability } from "../../../capabilities/chatCapability.js"

import systemOperatorCapabilities from "../capabilities/systemOperatorCapabilities.js"



const silent = { info() {}, warn() {} }

const observerDeps = {
    readFile: async file => {
        if (file === "/proc/meminfo") return "MemTotal: 1000 kB\nMemAvailable: 500 kB\nSwapTotal: 0 kB\nSwapFree: 0 kB\n"
        throw new Error("ENOENT")
    },
    readdir: async () => [],
    statfs: async () => ({ bavail: 1, bsize: 1024, blocks: 2 }),
    execFile: async () => "ActiveState=active\nSubState=running\n",
    fetch: async () => ({ status: 200, body: null }),
    gitStamp: async () => ({ branch: "b", commit: "c" }),
    uncommittedPaths: async () => [],
}

function createEngines() {

    const toolBus = new ToolBus({ logger: silent })

    const skillEngine = new SkillEngine({ logger: silent })

    const workflowEngine = new WorkflowEngine({ skillEngine, logger: silent })

    const pluginManager = new PluginManager({ logger: silent })

    const capabilityRegistry = new CapabilityRegistry({ logger: silent })

    const engines = { toolBus, skillEngine, workflowEngine, pluginManager, capabilityRegistry }

    registerSystemOperatorPlugin(engines)

    return engines

}



test("capabilities validate and register with honest access levels", () => {

    for (const capability of systemOperatorCapabilities) {
        assert.deepEqual(validateChatCapability(capability), [], capability.id)
    }

    const engines = createEngines()

    const byId = Object.fromEntries(engines.capabilityRegistry.list().map(item => [item.id, item]))

    assert.equal(byId["system.status.check"].access, "workspace")

    assert.equal(byId["system.status.check"].mutates, true)

    assert.equal(byId["spacemonkey.workspace.overview"].access, "observe")

    assert.equal(byId["spacemonkey.workspace.overview"].mutates, false)

    assert.ok(engines.toolBus.has("system-observer"))

    assert.ok(engines.toolBus.has("spacemonkey-workspace"))

    assert.ok(engines.pluginManager.has("system-operator"))

})



test("the status workflow writes its report only inside the workspace task folder", async () => {

    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "sm-operator-"))

    try {
        const workspace = new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey") })

        const engines = createEngines()

        const result = await engines.workflowEngine.execute("check-system-status-workflow", {
            toolBus: engines.toolBus,
            workspace,
            projectRoot: parent,
            observerDeps,
        })

        const skill = result.results[0]

        assert.equal(skill.success, true, skill.error)

        assert.deepEqual(
            skill.files.map(file => path.basename(file)),
            ["system-status.json", "system-status.md"],
        )

        assert.ok(skill.files.every(file => file.startsWith(`tasks/${skill.taskId}/`)))

        const task = await workspace.readTask(skill.taskId)

        assert.equal(task.state, "done")

        assert.match(await workspace.readFile(skill.files[1]), /^Koneen tila/)

        const outside = (await fs.readdir(parent)).filter(name => name !== "spacemonkey")

        assert.deepEqual(outside, [], "nothing is written outside the workspace")
    } finally {
        await fs.rm(parent, { recursive: true, force: true })
    }

})



test("the workspace tool refuses unknown actions and a missing workspace", async () => {

    const engines = createEngines()

    assert.equal(
        (await engines.toolBus.execute("spacemonkey-workspace", { action: "rm" }, { workspace: {} })).code,
        "unknown_action",
    )

    assert.equal(
        (await engines.toolBus.execute("spacemonkey-workspace", { action: "usage" }, {})).code,
        "workspace_missing",
    )

    assert.equal(
        (await engines.toolBus.execute("system-observer", { action: "service", serviceId: "sshd" })).code,
        "unknown_service",
    )

})
