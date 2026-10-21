import { after, test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs"

import os from "node:os"

import path from "node:path"

import ToolBus from "../../../toolbus/ToolBus.js"

import CapabilityRegistry from "../../../toolbus/CapabilityRegistry.js"

import SkillEngine from "../../../skills/SkillEngine.js"

import WorkflowEngine from "../../../workflows/WorkflowEngine.js"

import PluginManager from "../../PluginManager.js"

import SpacemonkeyWorkspace from "../../../workspace/SpacemonkeyWorkspace.js"

import { registerSystemOperatorPlugin } from "../../SystemOperator/index.js"

import { registerBrowserOperatorPlugin } from "../index.js"

import { PROJECT_SITE, createFakeLauncher } from "../../../browser/tests/fakeBrowser.js"



const silent = { info() {}, warn() {} }

const parents = []

after(() => {

    for (const parent of parents) {
        fs.rmSync(parent, { recursive: true, force: true })
    }

})

function setup() {

    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "sm-browser-plugin-"))

    parents.push(parent)

    const toolBus = new ToolBus({ logger: silent })

    const skillEngine = new SkillEngine({ logger: silent })

    const workflowEngine = new WorkflowEngine({ skillEngine, logger: silent })

    const engines = {
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager: new PluginManager({ logger: silent }),
        capabilityRegistry: new CapabilityRegistry({ logger: silent }),
    }

    registerSystemOperatorPlugin(engines)

    registerBrowserOperatorPlugin(engines)

    return { ...engines, workspace: new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey") }) }

}

function endpointDeps(down = []) {

    const calls = []

    return {
        calls,
        deps: {
            fetch: async url => {
                calls.push(url)

                if (down.some(port => url.includes(port))) {
                    throw new TypeError("fetch failed")
                }

                return { status: 200, body: null }
            },
        },
    }

}

const enoughMemory = async () => ({ ok: true, availableBytes: 8 * 1024 ** 3 })



test("the capability registers at workspace level with a validated descriptor", () => {

    const engines = setup()

    const capability = engines.capabilityRegistry.get("browser.ui.check")

    assert.equal(capability.access, "workspace")

    assert.equal(capability.plugin, "browser-operator")

    assert.ok(engines.toolBus.has("browser-operator"))

})



test("a full UI check: services respond, the browser runs, report and screenshots land in the task folder", async () => {

    const engines = setup()

    const { launcher, log } = createFakeLauncher(PROJECT_SITE)

    const { deps, calls } = endpointDeps()

    const result = await engines.workflowEngine.execute("run-ui-check-workflow", {
        toolBus: engines.toolBus,
        workspace: engines.workspace,
        scenarioId: "projects-view",
        browserRuntime: { launcher, memoryGuard: enoughMemory },
        observerDeps: deps,
    })

    const skill = result.results[0]

    assert.equal(skill.success, true, skill.error)

    assert.equal(skill.report.ok, true)

    assert.deepEqual(calls, ["http://[::1]:5173/", "http://127.0.0.1:3001/api/health"])

    assert.deepEqual(
        skill.files.map(file => path.basename(file)),
        ["projects.png", "project-details.png", "ui-check.json", "ui-check.md"],
    )

    assert.match(await engines.workspace.readFile(`tasks/${skill.taskId}/ui-check.md`), /LÄPÄISTY \(8\/8 askelta\)/)

    assert.equal((await engines.workspace.readTask(skill.taskId)).state, "done")

    assert.equal(log.closedBrowser, true)

})



test("when HQ's UI does not respond, no browser is started and the task is marked failed", async () => {

    const engines = setup()

    const { launcher, log } = createFakeLauncher(PROJECT_SITE)

    const { deps } = endpointDeps(["5173"])

    const result = await engines.workflowEngine.execute("run-ui-check-workflow", {
        toolBus: engines.toolBus,
        workspace: engines.workspace,
        scenarioId: "projects-view",
        browserRuntime: { launcher, memoryGuard: enoughMemory },
        observerDeps: deps,
    })

    const skill = result.results[0]

    assert.equal(skill.success, false)

    assert.equal(skill.code, "service_down")

    assert.match(skill.error, /HQ-käyttöliittymä \(Vite\)/)

    assert.equal(log.launched, 0)

    assert.equal((await engines.workspace.readTask(skill.taskId)).state, "failed")

})



test("an unknown scenario or endpoint is refused by the tools", async () => {

    const engines = setup()

    const unknown = await engines.toolBus.execute(
        "browser-operator",
        { action: "run-scenario", scenarioId: "https://evil.example", taskId: "x" },
        { workspace: engines.workspace },
    )

    assert.equal(unknown.code, "unknown_scenario")

    const endpoints = await engines.toolBus.execute(
        "system-observer",
        { action: "endpoints", endpointIds: ["portainer"] },
        { observerDeps: endpointDeps().deps },
    )

    assert.deepEqual(endpoints.endpoints, [{ id: "portainer", allowed: false, ok: false, error: "unknown-endpoint" }])

})
