import { test } from "node:test"

import assert from "node:assert/strict"

import writePythonCodeSkill, {
    GENERATED_PYTHON_DIR,
    resolveSafeFilePath,
} from "../skills/writePythonCodeSkill.js"



function fakePrisma({ draft }) {

    return {
        pythonCodeDraft: {
            findUnique: async () => draft,
        },
    }

}



test("rejects a draft that is not approved", async () => {

    const prisma = fakePrisma({
        draft: { id: 1, status: "draft" },
    })

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_approved")

})



test("rejects a path that escapes the generated-python directory", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "../../etc/passwd",
            code: "print('hi')",
        },
    })

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "unsafe_file_path")

})



test("resolveSafeFilePath keeps relative paths inside the base dir", () => {

    const resolved = resolveSafeFilePath("scripts/rename.py")

    assert.equal(
        resolved,
        `${GENERATED_PYTHON_DIR}/scripts/rename.py`,
    )

})



test("resolveSafeFilePath rejects traversal and absolute escapes", () => {

    assert.equal(resolveSafeFilePath("../outside.py"), null)

    assert.equal(resolveSafeFilePath("/etc/passwd"), null)

})



test("happy path: mkdirs and writes via the file tool", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "rename.py",
            code: "print('hi')",
        },
    })

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push({ id, input })
            return { success: true }
        },
    }

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(calls[0].input.action, "mkdir")

    assert.equal(calls[1].input.action, "write")

    assert.equal(calls[1].input.content, "print('hi')")

    assert.equal(
        calls[1].input.file,
        `${GENERATED_PYTHON_DIR}/rename.py`,
    )

})
