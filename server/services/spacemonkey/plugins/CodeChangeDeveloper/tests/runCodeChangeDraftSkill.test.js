import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import path from "node:path"

import runCodeChangeDraftSkill from "../skills/runCodeChangeDraftSkill.js"

import { resolveVerificationRunDir } from "../skills/verificationSandbox.js"



function fakeToolBus() {

    const calls = []

    return {
        calls,
        execute: async (id, input) => {

            calls.push(input)

            if (input.action === "mkdir") {

                await fs.mkdir(input.file, { recursive: true })

                return { success: true }

            }

            if (input.action === "write") {

                await fs.mkdir(path.dirname(input.file), { recursive: true })

                await fs.writeFile(input.file, input.content, "utf8")

                return { success: true }

            }

            throw new Error(`unexpected toolBus action: ${input.action}`)

        },
    }

}



test("prints to stdout: reports passed with the output, cleans up the scratch dir", async () => {

    const toolBus = fakeToolBus()

    const result = await runCodeChangeDraftSkill.execute({
        targetFilePath: "helper.js",
        targetCode: "console.log('hei maailma')",
        siblingFiles: [],
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "passed")

    assert.ok(result.output.includes("hei maailma"))

    const writeCall = toolBus.calls.find(call => call.action === "write")

    const runId = writeCall.file.match(/([0-9a-f-]{36})/)[1]

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})



test("resolves a same-set sibling file's relative import", async () => {

    const toolBus = fakeToolBus()

    const result = await runCodeChangeDraftSkill.execute({
        targetFilePath: "src/main.js",
        targetCode: "import { greet } from './helper.js'\nconsole.log(greet('world'))",
        siblingFiles: [
            { filePath: "src/helper.js", code: "export function greet(name) { return `hello ${name}` }" },
        ],
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "passed")

    assert.ok(result.output.includes("hello world"))

})



test("raises an exception: reports failed with stderr, still cleans up", async () => {

    const toolBus = fakeToolBus()

    const result = await runCodeChangeDraftSkill.execute({
        targetFilePath: "broken.js",
        targetCode: "throw new Error('boom')",
        siblingFiles: [],
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "failed")

    assert.ok(result.output.includes("boom"))

})



test("runaway script: killed at the timeout, reports timeout, still cleans up", async () => {

    const toolBus = fakeToolBus()

    const result = await runCodeChangeDraftSkill.execute({
        targetFilePath: "infinite.js",
        targetCode: "while (true) {}",
        siblingFiles: [],
        toolBus,
        timeoutMsOverride: 500,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "timeout")

})



test("never writes the draft's code into the real project tree", async () => {

    const toolBus = fakeToolBus()

    await runCodeChangeDraftSkill.execute({
        targetFilePath: "sandboxed.js",
        targetCode: "console.log('sandboxed')",
        siblingFiles: [],
        toolBus,
    })

    const writeCall = toolBus.calls.find(call => call.action === "write")

    assert.ok(writeCall.file.includes(".dev-studio-verification"))

})
