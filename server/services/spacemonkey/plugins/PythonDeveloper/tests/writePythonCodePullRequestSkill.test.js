import { test } from "node:test"

import assert from "node:assert/strict"

import writePythonCodePullRequestSkill from "../skills/writePythonCodePullRequestSkill.js"



function fakeToolBus() {

    const calls = []

    return {
        calls,
        execute: async (id, input) => {

            calls.push({ id, ...input })

            if (input.action === "exists") return { success: true, exists: false }

            if (input.action === "prCreate") {

                return { success: true, prUrl: "https://github.com/x/y/pull/1", prNumber: 1 }

            }

            return { success: true }

        },
    }

}



test("requests a Git Guardian backup exactly once before writing, and a normal write still succeeds if the backup request fails", async t => {

    const fetchCalls = []

    const originalFetch = global.fetch

    global.fetch = async (url, options) => {

        fetchCalls.push({ url, options })

        throw new Error("git guardian service unreachable (simulated)")

    }

    t.after(() => {

        global.fetch = originalFetch

    })

    const toolBus = fakeToolBus()

    const result = await writePythonCodePullRequestSkill.execute({
        title: "Testimuutos",
        explanation: "",
        prompt: "testi",
        filePath: "rename.py",
        code: "print('hi')",
        originalHash: null,
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(fetchCalls.length, 1)

    assert.equal(fetchCalls[0].url, "http://127.0.0.1:8002/api/gitguardian/backup")

    assert.equal(fetchCalls[0].options.method, "POST")

    const writeCallIndex = toolBus.calls.findIndex(call => call.action === "write")

    assert.ok(writeCallIndex >= 0, "expected a write call to have happened")

})
