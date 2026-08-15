import { test } from "node:test"

import assert from "node:assert/strict"

import revertCodeChangeSkill from "../skills/revertCodeChangeSkill.js"

import { sha256 } from "../skills/writeCodeChangeSkill.js"

import { PROJECT_ROOT } from "../skills/projectSandbox.js"



test("rejects a missing draft", async () => {

    const result = await revertCodeChangeSkill.execute({
        draft: null,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_found")

})



test("rejects a draft that is not written", async () => {

    const result = await revertCodeChangeSkill.execute({
        draft: { id: 1, status: "approved" },
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_written")

})



test("rejects a path outside the project sandbox even if written", async () => {

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "../../etc/passwd",
            proposedCode: "hacked",
            backupPath: null,
        },
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "path_traversal_blocked")

})



test("refuses to restore when the live file no longer matches what was written", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") {
                return { success: true, content: "# Someone changed this after the write" }
            }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "README.md",
            proposedCode: "# What was actually written",
            backupPath: ".dev-studio-backups/README.md.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_write")

})



test("refuses to delete a new file when the live content no longer matches what was written", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") {
                return { success: true, content: "# Someone changed this after the write" }
            }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "docs/new-file.md",
            proposedCode: "# Brand new",
            backupPath: null,
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_write")

})



test("refuses when a file that existed right after the write has since been deleted (backup case)", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: false }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "README.md",
            proposedCode: "# What was actually written",
            backupPath: ".dev-studio-backups/README.md.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_write")

})



test("happy path: restores the backup content over the live file", async () => {

    const writtenContent = "# What was actually written"

    const backupContent = "# Original README before the write"

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

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "README.md",
            proposedCode: writtenContent,
            backupPath: ".dev-studio-backups/README.md.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "restored")

    const finalWrite = calls.find(
        call => call.action === "write" && call.content === backupContent,
    )

    assert.ok(finalWrite, "expected the backup content to be written back")

    assert.equal(finalWrite.file, `${PROJECT_ROOT}/README.md`)

})



test("happy path: deletes a file that was created by the write", async () => {

    const writtenContent = "# Brand new"

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") return { success: true, content: writtenContent }

            return { success: true }
        },
    }

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "docs/new-file.md",
            proposedCode: writtenContent,
            backupPath: null,
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "deleted")

    const deleteCall = calls.find(call => call.action === "delete")

    assert.ok(deleteCall, "expected a delete call")

    assert.equal(deleteCall.file, `${PROJECT_ROOT}/docs/new-file.md`)

    const writeCalls = calls.filter(call => call.action === "write")

    assert.equal(writeCalls.length, 0, "should never write when deleting")

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

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "docs/new-file.md",
            proposedCode: "# Brand new",
            backupPath: null,
        },
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.action, "already_absent")

    assert.equal(calls.length, 1, "should only check existence, nothing else")

})



test("backup file missing: fails loudly instead of silently succeeding", async () => {

    const writtenContent = "# What was actually written"

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

    const result = await revertCodeChangeSkill.execute({
        draft: {
            id: 1,
            status: "written",
            filePath: "README.md",
            proposedCode: writtenContent,
            backupPath: ".dev-studio-backups/README.md.2026-01-01T00-00-00-000Z.bak",
        },
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "backup_missing")

})
