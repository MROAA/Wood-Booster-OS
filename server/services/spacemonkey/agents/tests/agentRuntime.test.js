import { test } from "node:test"

import assert from "node:assert/strict"

import AgentRuntime from "../runtime/AgentRuntime.js"

import registerAgents from "../runtime/registerAgents.js"



const silent = { info() {}, warn() {} }

function fakeAgent(id, {
    ready = true,
    run = async task => ({ success: true, echoed: task.search }),
    withHealth = true,
} = {}) {

    const agent = {
        id,
        name: id,
        calls: [],
        async execute(task) {
            agent.calls.push(task)
            return run(task)
        },
    }

    if (withHealth) {
        agent.health = () => ({ ready, missing: ready ? [] : ["dependency"] })
    }

    return agent

}

function descriptor(capabilityId, access = "observe", extra = {}) {

    return {
        workspaces: ["hq"],
        capabilities: [{ id: capabilityId, access }],
        ...extra,
    }

}



test("the three existing agents are registered with descriptors and honest health", () => {

    const runtime = registerAgents({
        agentRuntime: new AgentRuntime({ logger: silent }),
        logger: silent,
    })

    const described = runtime.describe()

    assert.deepEqual(
        described.map(agent => agent.id),
        ["developer-agent", "wordpress-agent", "instagram-agent"],
    )

    const byId = Object.fromEntries(described.map(agent => [agent.id, agent]))

    assert.equal(byId["developer-agent"].health.ready, true)

    assert.deepEqual(byId["wordpress-agent"].health, { ready: false, missing: ["planner", "toolBus"] })

    assert.deepEqual(byId["instagram-agent"].health, { ready: false, missing: ["planner", "toolBus"] })

    assert.equal(byId["developer-agent"].mutates, false)

    assert.equal(byId["wordpress-agent"].mutates, true)

})



test("an agent without a health check is never assumed ready", () => {

    const runtime = new AgentRuntime({ logger: silent })

    runtime.register(fakeAgent("silent", { withHealth: false }), descriptor("x.read"))

    assert.equal(runtime.health("silent").ready, null)

    assert.equal(runtime.select({ capabilityId: "x.read" }).code, "not-ready")

})



test("selection is by capability, deterministic, and skips unhealthy agents", () => {

    const runtime = new AgentRuntime({ logger: silent })

    runtime.register(fakeAgent("broken", { ready: false }), descriptor("x.read"))

    runtime.register(fakeAgent("first"), descriptor("x.read"))

    runtime.register(fakeAgent("second"), descriptor("x.read"))

    for (let round = 0; round < 3; round += 1) {
        const selection = runtime.select({ capabilityId: "x.read", workspace: "hq" })

        assert.equal(selection.agent.id, "first")

        assert.deepEqual(selection.reasons.map(item => item.reason), ["not-ready"])
    }

})



test("selection refuses other workspaces, unknown capabilities and disallowed access levels", () => {

    const runtime = new AgentRuntime({ logger: silent })

    runtime.register(fakeAgent("publisher"), descriptor("x.publish", "external-publishing"))

    runtime.register(fakeAgent("reader"), descriptor("x.read"))

    assert.equal(runtime.select({ capabilityId: "x.read", workspace: "hearthwood" }).code, "other-workspace")

    assert.equal(runtime.select({ capabilityId: "nope" }).code, "no-agent-for-capability")

    assert.equal(runtime.select({}).code, "capability-missing")

    assert.equal(runtime.select({ capabilityId: "x.publish" }).code, "access-not-allowed")

    assert.equal(
        runtime.select({ capabilityId: "x.publish", allowedAccess: ["privileged-os"] }).code,
        "access-not-allowed",
        "levels are not a staircase",
    )

    assert.equal(
        runtime.select({ capabilityId: "x.publish", allowedAccess: ["external-publishing"] }).agent.id,
        "publisher",
    )

})



test("a descriptor capability with an unknown access level is dropped", () => {

    const runtime = new AgentRuntime({ logger: silent })

    runtime.register(fakeAgent("odd"), descriptor("x.root", "root"))

    assert.deepEqual(runtime.describe()[0].capabilities, [])

    assert.equal(runtime.select({ capabilityId: "x.root" }).code, "no-agent-for-capability")

})



test("run records queued -> running -> succeeded and passes the access level", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    const agent = fakeAgent("reader")

    runtime.register(agent, descriptor("x.read"))

    const task = await runtime.run({ capabilityId: "x.read", workspace: "hq", input: { search: "abc" } })

    assert.equal(task.state, "succeeded")

    assert.equal(task.agentId, "reader")

    assert.deepEqual(task.result, { success: true, echoed: "abc" })

    assert.deepEqual(task.history.map(entry => entry.state), ["queued", "running", "succeeded"])

    assert.equal(agent.calls[0].access, "observe")

    assert.ok(agent.calls[0].signal instanceof AbortSignal)

})



test("a missing agent gives a rejected task, not a crash", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    const task = await runtime.run({ capabilityId: "x.missing" })

    assert.equal(task.state, "rejected")

    assert.equal(task.error, "no-agent-for-capability")

})



test("an agent failure and a thrown error both end as failed", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    runtime.register(
        fakeAgent("soft", { run: async () => ({ success: false, error: "no files" }) }),
        descriptor("x.soft"),
    )

    runtime.register(
        fakeAgent("hard", { run: async () => { throw new Error("boom") } }),
        descriptor("x.hard"),
    )

    const soft = await runtime.run({ capabilityId: "x.soft" })

    const hard = await runtime.run({ capabilityId: "x.hard" })

    assert.deepEqual([soft.state, soft.error], ["failed", "no files"])

    assert.deepEqual([hard.state, hard.error], ["failed", "boom"])

})



test("a slow agent times out, its signal is aborted and a late result is ignored", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    let seenSignal = null

    runtime.register(
        fakeAgent("slow", {
            run: task => {
                seenSignal = task.signal
                return new Promise(resolve => setTimeout(() => resolve({ success: true }), 200))
            },
        }),
        descriptor("x.slow"),
    )

    const task = await runtime.run({ capabilityId: "x.slow", timeoutMs: 30 })

    assert.equal(task.state, "timed-out")

    assert.equal(seenSignal.aborted, true)

    await new Promise(resolve => setTimeout(resolve, 250))

    assert.equal(runtime.getTask(task.id).state, "timed-out")

})



test("a running task can be cancelled and stays cancelled", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    let release = null

    let seenSignal = null

    runtime.register(
        fakeAgent("waiting", {
            run: task => {
                seenSignal = task.signal
                return new Promise(resolve => { release = resolve })
            },
        }),
        descriptor("x.wait"),
    )

    const pending = runtime.run({ capabilityId: "x.wait", timeoutMs: 5000 })

    await new Promise(resolve => setImmediate(resolve))

    const [running] = runtime.listTasks()

    assert.equal(running.state, "running")

    assert.equal(runtime.cancel(running.id), true)

    assert.equal(seenSignal.aborted, true, "the agent is told to stop")

    release({ success: true })

    const task = await pending

    assert.equal(task.state, "cancelled")

    assert.equal(runtime.cancel(running.id), false, "a finished task cannot be cancelled again")

})



test("the original keyword find/execute API still works", async () => {

    const runtime = new AgentRuntime({ logger: silent })

    const agent = fakeAgent("legacy")

    agent.canHandle = task => JSON.stringify(task).includes("legacy")

    runtime.register(agent)

    assert.equal(runtime.find({ type: "legacy job" }).id, "legacy")

    assert.deepEqual(await runtime.execute({ type: "none" }), {
        success: false,
        error: "No suitable agent found.",
        task: { type: "none" },
    })

    assert.deepEqual(runtime.summary(), { totalAgents: 1, agents: ["legacy"] })

})



test("task history is bounded", async () => {

    const runtime = new AgentRuntime({ logger: silent, maxTaskHistory: 3 })

    runtime.register(fakeAgent("reader"), descriptor("x.read"))

    for (let index = 0; index < 5; index += 1) {
        await runtime.run({ capabilityId: "x.read" })
    }

    assert.equal(runtime.listTasks().length, 3)

})
