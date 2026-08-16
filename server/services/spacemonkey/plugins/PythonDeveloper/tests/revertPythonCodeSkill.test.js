import { test } from "node:test"

import assert from "node:assert/strict"

import revertPythonCodeSkill from "../skills/revertPythonCodeSkill.js"

import { GENERATED_PYTHON_DIR } from "../skills/writePythonCodeSkill.js"



test("rejects a missing draft", async () => {

    const result = await revertPythonCodeSkill.execute({
        draft: null,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_found")

})



test("rejects a draft that is not written", async () => {

    const result = await revertPythonCodeSkill.execute({
        draft: { id: 1, status: "approved" },
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_written")

})



test("rejects a path outside the generated-python sandbox even if written", async () => {

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "../../etc/passwd",
            code: "hacked",
            backupPath: null,
        },
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "unsafe_file_path")

})



test("refuses to restore when the live file no longer matches what was written", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") return { success: true, content: "someone changed this" }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "rename.py",
            code: "print('what was written')",
            backupPath: ".dev-studio-backups/generated-python/rename.py.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_write")

})



test("happy path: restores the backup content over the live file", async () => {

    const writtenContent = "print('what was written')"

    const backupContent = "print('original content')"

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") {
                return {
                    success: true,
                    content: input.file.includes(".dev-studio-backups")
                        ? backupContent
                        : writtenContent,
                }
            }

            return { success: true }
        },
    }

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "rename.py",
            code: writtenContent,
            backupPath: ".dev-studio-backups/generated-python/rename.py.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "restored")

    const finalWrite = calls.find(
        call => call.action === "write" && call.content === backupContent,
    )

    assert.ok(finalWrite, "expected the backup content to be written back")

    assert.equal(finalWrite.file, `${GENERATED_PYTHON_DIR}/rename.py`)

})



test("happy path: deletes a file that was created by the write (no backup)", async () => {

    const writtenContent = "print('brand new')"

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") return { success: true, content: writtenContent }

            return { success: true }
        },
    }

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "rename.py",
            code: writtenContent,
            backupPath: null,
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "deleted")

    const deleteCall = calls.find(call => call.action === "delete")

    assert.ok(deleteCall)

    const writeCalls = calls.filter(call => call.action === "write")

    assert.equal(writeCalls.length, 0)

})



test("new file already absent: benign success, no filesystem mutation", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: false }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "rename.py",
            code: "print('brand new')",
            backupPath: null,
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "already_absent")

    assert.equal(calls.length, 1)

})



test("backup file missing: fails loudly instead of silently succeeding", async () => {

    const writtenContent = "print('what was written')"

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") {
                return {
                    success: true,
                    exists: !input.file.includes(".dev-studio-backups"),
                }
            }

            if (input.action === "read") return { success: true, content: writtenContent }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertPythonCodeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "rename.py",
            code: writtenContent,
            backupPath: ".dev-studio-backups/generated-python/rename.py.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "backup_missing")

})
