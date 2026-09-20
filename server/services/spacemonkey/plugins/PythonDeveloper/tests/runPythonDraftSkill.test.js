import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import runPythonDraftSkill from "../skills/runPythonDraftSkill.js"

import { resolveVerificationRunDir } from "../../CodeChangeDeveloper/skills/verificationSandbox.js"



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

                await fs.writeFile(input.file, input.content, "utf8")

                return { success: true }

            }

            throw new Error(`unexpected toolBus action: ${input.action}`)

        },
    }

}



test("prints to stdout: reports passed with the output, cleans up the scratch dir", async () => {

    const toolBus = fakeToolBus()

    const result = await runPythonDraftSkill.execute({
        draftCode: "print('hei maailma')",
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



test("raises an exception: reports failed with stderr, still cleans up", async () => {

    const toolBus = fakeToolBus()

    const result = await runPythonDraftSkill.execute({
        draftCode: "raise ValueError('boom')",
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "failed")

    assert.ok(result.output.includes("ValueError"))

})



test("runaway script: killed at the timeout, reports timeout, still cleans up", async () => {

    const toolBus = fakeToolBus()

    const result = await runPythonDraftSkill.execute({
        draftCode: "import time\ntime.sleep(10)\n",
        toolBus,
        timeoutMsOverride: 500,
    })

    assert.equal(result.success, true)

    assert.equal(result.status, "timeout")

})



test("never writes the draft's code into the real project tree", async () => {

    const toolBus = fakeToolBus()

    await runPythonDraftSkill.execute({
        draftCode: "print('sandboxed')",
        toolBus,
    })

    const writeCall = toolBus.calls.find(call => call.action === "write")

    assert.ok(writeCall.file.includes(".dev-studio-verification"))

})
