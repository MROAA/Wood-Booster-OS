import { test } from "node:test"

import assert from "node:assert/strict"

import debugPythonCodeSkill, {
    PROJECT_ROOT,
    resolveSafeFilePath,
} from "../skills/debugPythonCodeSkill.js"



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

    const result = await debugPythonCodeSkill.execute({
        filePath: "../../etc/passwd",
        toolBus: { execute: async () => ({ success: true, content: "" }) },
        debugPythonCode: async () => ({
            title: "should not run",
            diagnosis: "",
            code: "",
        }),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "unsafe_file_path")

})



test("returns read_failed when the file tool cannot read the file", async () => {

    const result = await debugPythonCodeSkill.execute({
        filePath: "spc.py",
        toolBus: {
            execute: async () => ({ success: false, error: "not found" }),
        },
        debugPythonCode: async () => ({
            title: "should not run",
            diagnosis: "",
            code: "",
        }),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "read_failed")

})



test("happy path: passes filePath, content, and errorMessage through", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push({ id, input })
            return { success: true, content: "print('hello')" }
        },
    }

    const debugCalls = []

    const result = await debugPythonCodeSkill.execute({
        filePath: "spc.py",
        errorMessage: "NameError: hello is not defined",
        toolBus,
        debugPythonCode: async (args) => {
            debugCalls.push(args)
            return {
                title: "Korjausehdotus",
                diagnosis: "Muuttujaa ei ole määritelty.",
                code: "hello = 'hi'\nprint(hello)",
            }
        },
    })

    assert.equal(result.success, true)

    assert.equal(calls[0].input.action, "read")

    assert.equal(calls[0].input.file, `${PROJECT_ROOT}/spc.py`)

    assert.equal(debugCalls[0].code, "print('hello')")

    assert.equal(
        debugCalls[0].errorMessage,
        "NameError: hello is not defined",
    )

    assert.equal(result.title, "Korjausehdotus")

    assert.equal(result.diagnosis, "Muuttujaa ei ole määritelty.")

    assert.equal(result.code, "hello = 'hi'\nprint(hello)")

})
