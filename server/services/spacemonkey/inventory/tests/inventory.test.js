import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import { buildImportGraph, specifiersOf } from "../importGraph.js"

import { buildAgentInventory } from "../agentInventory.js"

import AgentRuntime from "../../agents/runtime/AgentRuntime.js"

import registerAgents, { DEFAULT_PROJECT_ROOT } from "../../agents/runtime/registerAgents.js"



const silent = { info() {}, warn() {} }

async function createProject(files) {

    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-inventory-"))

    for (const [relative, content] of Object.entries(files)) {
        await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true })
        await fs.writeFile(path.join(root, relative), content)
    }

    return root

}



test("specifiersOf finds static, re-export, side-effect and literal dynamic imports", () => {

    const source = [
        'import a from "./a.js"',
        'import { b } from "../b.js"',
        'export { c } from "./c.js"',
        'import "./d.js"',
        'const e = await import("./e.js")',
        'import express from "express"',
        'const f = await import(name)',
    ].join("\n")

    assert.deepEqual(
        specifiersOf(source).sort(),
        ["../b.js", "./a.js", "./c.js", "./d.js", "./e.js"],
    )

})



test("the import graph follows real imports and never enters protected paths", async () => {

    const root = await createProject({
        "server/index.js": 'import "./routes/a.js"\nimport "./.env.js"\n',
        "server/routes/a.js": 'export { x } from "../services/b"\n',
        "server/services/b/index.js": "export const x = 1\n",
        "server/services/unused.js": "export const y = 2\n",
        "server/.env.js": 'import "./services/unused.js"\n',
    })

    try {
        const graph = await buildImportGraph({ root, entries: ["server/index.js"] })

        assert.deepEqual(
            [...graph].sort(),
            ["server/index.js", "server/routes/a.js", "server/services/b/index.js"],
        )
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("inventory marks agent classes the server never loads and skips Hearthwood files", async () => {

    const root = await createProject({
        "server/index.js": 'import "./services/agents/LiveAgent.js"\n',
        "server/services/agents/LiveAgent.js": "export class LiveAgent {}\n",
        "server/services/agents/DeadAgent.js": "export class DeadAgent {}\n",
        "server/services/hearthwoodThing.js": "export class GameAgent {}\n",
        "server/routes/heartwoodAssistant.js": "export class OtherAgent {}\n",
    })

    try {
        const inventory = await buildAgentInventory({ root })

        assert.deepEqual(
            inventory.agentClasses.map(item => [item.className, item.loadedByServer]),
            [["DeadAgent", false], ["LiveAgent", true]],
        )

        assert.equal(inventory.hearthwoodFilesSkipped, 2)

        assert.deepEqual(inventory.runtimeAgents, [])

        assert.deepEqual(inventory.chatPersonas.personas, [], "no registry, no invented personas")

        assert.deepEqual(inventory.staticClaims, [])
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("inventory of the real repository reflects the real runtime and code", async () => {

    const agentRuntime = registerAgents({
        agentRuntime: new AgentRuntime({ logger: silent }),
        logger: silent,
    })

    const inventory = await buildAgentInventory({ root: DEFAULT_PROJECT_ROOT, agentRuntime })

    assert.ok(inventory.commit, "commit stamp present")

    assert.ok(inventory.branch, "branch stamp present")

    const byId = Object.fromEntries(inventory.runtimeAgents.map(agent => [agent.id, agent]))

    assert.deepEqual(Object.keys(byId), ["developer-agent", "wordpress-agent", "instagram-agent"])

    for (const agent of inventory.runtimeAgents) {
        assert.equal(agent.sourceExists, true, agent.id)

        assert.equal(agent.loadedByServer, true, agent.id)
    }

    assert.equal(byId["developer-agent"].health.ready, true)

    assert.equal(byId["wordpress-agent"].health.ready, false)

    const personas = inventory.chatPersonas.personas

    assert.ok(personas.length >= 4)

    assert.ok(personas.every(persona => persona.mutates === false))

    const baseAgent = inventory.agentClasses.find(item => item.className === "BaseAgent")

    assert.equal(baseAgent.loadedByServer, false)

    assert.ok(inventory.hearthwoodFilesSkipped > 0)

})
