import { test } from "node:test"

import assert from "node:assert/strict"

import writeCodeChangePullRequestSkill from "../skills/writeCodeChangePullRequestSkill.js"



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



test("requests a Git Guardian backup exactly once for a multi-file write, not once per file", async t => {

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

    const result = await writeCodeChangePullRequestSkill.execute({
        title: "Testimuutos",
        explanation: "",
        prompt: "testi",
        files: [
            { filePath: "src/a.js", proposedCode: "console.log('a')", originalHash: null },
            { filePath: "src/b.js", proposedCode: "console.log('b')", originalHash: null },
        ],
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(fetchCalls.length, 1)

    assert.equal(fetchCalls[0].url, "http://127.0.0.1:8002/api/gitguardian/backup")

    const writeCalls = toolBus.calls.filter(call => call.action === "write")

    assert.equal(writeCalls.length, 2, "expected both files to have been written")

})
