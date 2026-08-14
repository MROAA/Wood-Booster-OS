import { test } from "node:test"

import assert from "node:assert/strict"

import writeCodeChangeSkill, { sha256 } from "../skills/writeCodeChangeSkill.js"

import { PROJECT_ROOT } from "../skills/projectSandbox.js"



function fakePrisma({ draft }) {

    return {
        codeChangeDraft: {
            findUnique: async () => draft,
        },
    }

}



test("rejects a draft that is not approved", async () => {

    const prisma = fakePrisma({
        draft: { id: 1, status: "draft" },
    })

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_approved")

})



test("rejects a path outside the project sandbox even if approved", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "../../etc/passwd",
            proposedCode: "hacked",
            originalHash: null,
        },
    })

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "path_traversal_blocked")

})



test("refuses to write when the live file changed since the draft was generated", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "README.md",
            proposedCode: "# New content",
            originalHash: sha256("# Content when drafted"),
        },
    })

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") {
                return { success: true, content: "# Someone changed this already" }
            }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_draft")

})



test("refuses to write when a file that existed at draft time has since been deleted", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "README.md",
            proposedCode: "# New content",
            originalHash: sha256("# It existed before"),
        },
    })

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") return { success: true, exists: false }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "file_changed_since_draft")

})



test("happy path: backs up the old content, then writes the new content", async () => {

    const originalContent = "# Original README"

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "README.md",
            proposedCode: "# Updated README",
            originalHash: sha256(originalContent),
        },
    })

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: true }

            if (input.action === "read") {
                return { success: true, content: originalContent }
            }

            return { success: true }
        },
    }

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, true)

    const backupWrite = calls.find(
        call => call.action === "write" && call.content === originalContent,
    )

    assert.ok(backupWrite, "expected a backup write of the original content")

    assert.ok(
        backupWrite.file.includes("/.dev-studio-backups/"),
        "backup should be written under .dev-studio-backups/",
    )

    const finalWrite = calls.find(
        call => call.action === "write" && call.content === "# Updated README",
    )

    assert.ok(finalWrite, "expected the final write of the proposed content")

    assert.equal(finalWrite.file, `${PROJECT_ROOT}/README.md`)

    assert.equal(result.backupPath.startsWith(".dev-studio-backups/"), true)

})



test("new file: no backup attempted when the file does not exist yet", async () => {

    const prisma = fakePrisma({
        draft: {
            id: 1,
            status: "approved",
            filePath: "docs/new-file.md",
            proposedCode: "# Brand new",
            originalHash: null,
        },
    })

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") return { success: true, exists: false }

            return { success: true }
        },
    }

    const result = await writeCodeChangeSkill.execute({
        draftId: 1,
        prisma,
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.backupPath, null)

    const writeCalls = calls.filter(call => call.action === "write")

    assert.equal(writeCalls.length, 1)

    assert.equal(writeCalls[0].content, "# Brand new")

})
