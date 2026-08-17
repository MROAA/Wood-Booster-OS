import { test } from "node:test"

import assert from "node:assert/strict"

import refactorPythonCodeSkill, {
    PROJECT_ROOT,
    resolveSafeFilePath,
} from "../skills/refactorPythonCodeSkill.js"



test("resolveSafeFilePath keeps relative .py paths inside the project root", () => {

    const resolved = resolveSafeFilePath("src/spacemonkey/spc_facade.py")

    assert.equal(
        resolved,
        `${PROJECT_ROOT}/src/spacemonkey/spc_facade.py`,
    )

})



test("resolveSafeFilePath rejects non-.py files", () => {

    assert.equal(resolveSafeFilePath("server/.env"), null)

    assert.equal(resolveSafeFilePath("package.json"), null)

})



test("resolveSafeFilePath rejects traversal and absolute escapes", () => {

    assert.equal(resolveSafeFilePath("../outside.py"), null)

    assert.equal(resolveSafeFilePath("/etc/passwd.py"), null)

})



test("rejects an unsafe file path before touching the file tool", async () => {

    const result = await refactorPythonCodeSkill.execute({
        filePath: "../../etc/passwd",
        toolBus: { execute: async () => ({ success: true, content: "" }) },
        refactorPythonCode: async () => ({
            title: "should not run",
            explanation: "",
            code: "",
        }),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "unsafe_file_path")

})



test("returns read_failed when the file tool cannot read the file", async () => {

    const result = await refactorPythonCodeSkill.execute({
        filePath: "spc.py",
        toolBus: {
            execute: async () => ({ success: false, error: "not found" }),
        },
        refactorPythonCode: async () => ({
            title: "should not run",
            explanation: "",
            code: "",
        }),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "read_failed")

})



test("happy path: reads via the file tool and returns title/explanation/code", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push({ id, input })
            return { success: true, content: "print('hello')" }
        },
    }

    const result = await refactorPythonCodeSkill.execute({
        filePath: "spc.py",
        toolBus,
        refactorPythonCode: async ({ code }) => ({
            title: "Refaktoroitu",
            explanation: `explained: ${code}`,
            code: `# refactored\n${code}`,
        }),
    })

    assert.equal(result.success, true)

    assert.equal(calls[0].input.action, "read")

    assert.equal(calls[0].input.file, `${PROJECT_ROOT}/spc.py`)

    assert.equal(result.title, "Refaktoroitu")

    assert.equal(result.explanation, "explained: print('hello')")

    assert.equal(result.code, "# refactored\nprint('hello')")

})



test("forwards an explicit model choice into the generator", async () => {

    const toolBus = {
        execute: async () => ({ success: true, content: "print('hello')" }),
    }

    let receivedModel = "not called"

    await refactorPythonCodeSkill.execute({
        filePath: "spc.py",
        model: "qwen2.5-coder:7b",
        toolBus,
        refactorPythonCode: async ({ model }) => {
            receivedModel = model
            return { title: "Refaktoroitu", explanation: "", code: "..." }
        },
    })

    assert.equal(receivedModel, "qwen2.5-coder:7b")

})



test("passes model through as undefined when none was chosen", async () => {

    const toolBus = {
        execute: async () => ({ success: true, content: "print('hello')" }),
    }

    let receivedModel = "not called"

    await refactorPythonCodeSkill.execute({
        filePath: "spc.py",
        toolBus,
        refactorPythonCode: async ({ model }) => {
            receivedModel = model
            return { title: "Refaktoroitu", explanation: "", code: "..." }
        },
    })

    assert.equal(receivedModel, undefined)

})
