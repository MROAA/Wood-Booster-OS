import { test } from "node:test"

import assert from "node:assert/strict"

import writePythonCodeSkill, {
    GENERATED_PYTHON_DIR,
    resolveSafeFilePath,
    sha256,
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



test("happy path: new file - checks existence, mkdirs, and writes via the file tool, no backup", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "rename.py",
            code: "print('hi')",
            originalHash: null,
        },
    })

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push({ id, input })

            if (input.action === "exists") return { success: true, exists: false }

            return { success: true }
        },
    }

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.backupPath, null)

    assert.equal(calls[0].input.action, "exists")

    assert.equal(calls[1].input.action, "mkdir")

    assert.equal(calls[2].input.action, "write")

    assert.equal(calls[2].input.content, "print('hi')")

    assert.equal(
        calls[2].input.file,
        `${GENERATED_PYTHON_DIR}/rename.py`,
    )

})



test("happy path: overwriting an existing, unchanged file backs it up first", async () => {

    const originalContent = "print('old version')"

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "rename.py",
            code: "print('new version')",
            originalHash: sha256(originalContent),
        },
    })

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") return { success: true, content: originalContent }

            return { success: true }
        },
    }

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, true)

    assert.ok(result.backupPath.startsWith(".dev-studio-backups/"))

    const backupWrite = calls.find(
        call => call.action === "write" && call.content === originalContent,
    )

    assert.ok(backupWrite, "expected a backup write of the original content")

    const finalWrite = calls.find(
        call => call.action === "write" && call.content === "print('new version')",
    )

    assert.ok(finalWrite, "expected the final write of the new content")

})



test("refuses to overwrite when the live file has changed since the draft was created", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "rename.py",
            code: "print('new version')",
            originalHash: sha256("print('what the draft expected')"),
        },
    })

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") return { success: true, content: "print('someone changed this')" }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await writePythonCodeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_draft")

})
