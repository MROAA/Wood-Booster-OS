import { test } from "node:test"

import assert from "node:assert/strict"

import generateVerificationTestSkill, {
    classifyTestability,
} from "../skills/generateVerificationTestSkill.js"



test("classifyTestability: plain .js and .ts are testable", () => {

    assert.equal(classifyTestability("server/services/mathUtils.js").testable, true)

    assert.equal(classifyTestability("server/services/mathUtils.ts").testable, true)

})



test("classifyTestability: .jsx/.tsx honestly skip with a reason", () => {

    const jsx = classifyTestability("src/pages/DevStudio.jsx")

    assert.equal(jsx.testable, false)

    assert.match(jsx.reason, /käyttöliittymäkomponentti/)

    const tsx = classifyTestability("src/pages/DevStudio.tsx")

    assert.equal(tsx.testable, false)

    assert.match(tsx.reason, /käyttöliittymäkomponentti/)

})



test("classifyTestability: .py skips with a reason", () => {

    const result = classifyTestability("scripts/tool.py")

    assert.equal(result.testable, false)

    assert.match(result.reason, /Python/)

})



test("classifyTestability: non-code files skip with a generic reason", () => {

    const result = classifyTestability("README.md")

    assert.equal(result.testable, false)

    assert.ok(result.reason.length > 0)

})



test("skips a .jsx file without ever touching the tool bus", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)
            return { success: true }
        },
    }

    const result = await generateVerificationTestSkill.execute({
        prompt: "lisää nappi",
        filePath: "src/pages/DevStudio.jsx",
        proposedCode: "export default function DevStudio() { return null }",
        toolBus,
        generateVerificationTest: async () => {
            throw new Error("should not be called for a skipped file type")
        },
    })

    assert.equal(result.success, true)

    assert.equal(result.skipped, true)

    assert.ok(result.skippedReason.length > 0)

    assert.equal(calls.length, 0)

})



test("writes target + test files into the sandboxed scratch dir for a testable file", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)
            return { success: true }
        },
    }

    const result = await generateVerificationTestSkill.execute({
        prompt: "lisää funktio add(a, b)",
        filePath: "server/services/mathUtils.js",
        proposedCode: "export function add(a, b) { return a + b }",
        toolBus,
        generateVerificationTest: async ({ prompt, proposedCode, filePath }) => {
            assert.equal(prompt, "lisää funktio add(a, b)")
            assert.equal(filePath, "server/services/mathUtils.js")
            assert.ok(proposedCode.includes("add"))

            return {
                title: "add() testi",
                explanation: "Tarkistaa että add(2, 3) palauttaa 5.",
                code:
                    "import test from \"node:test\"\n" +
                    "import assert from \"node:assert/strict\"\n" +
                    "import { add } from \"./target.mjs\"\n" +
                    "test(\"add\", () => { assert.equal(add(2, 3), 5) })",
            }
        },
    })

    assert.equal(result.success, true)

    assert.equal(result.skipped, false)

    assert.ok(result.runId)

    assert.ok(result.testFilePath.endsWith("target.test.mjs"))

    const mkdirCall = calls.find(call => call.action === "mkdir")

    assert.ok(mkdirCall, "expected an mkdir call")

    const targetWrite = calls.find(
        call => call.action === "write" && call.file.endsWith("target.mjs") && !call.file.endsWith("target.test.mjs"),
    )

    assert.ok(targetWrite, "expected the proposed code to be written to target.mjs")

    assert.equal(targetWrite.content, "export function add(a, b) { return a + b }")

    const testWrite = calls.find(
        call => call.action === "write" && call.file.endsWith("target.test.mjs"),
    )

    assert.ok(testWrite, "expected the generated test to be written to target.test.mjs")

    assert.ok(testWrite.content.includes("add(2, 3)"))

})
