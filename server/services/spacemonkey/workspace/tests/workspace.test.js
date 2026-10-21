import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import SpacemonkeyWorkspace, {
    SUBDIRECTORIES,
    defaultWorkspaceRoot,
    validateWorkspaceRoot,
} from "../SpacemonkeyWorkspace.js"



async function withWorkspace(options, run) {

    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "sm-workspace-"))

    const workspace = new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey"), ...options })

    try {
        await run(workspace, parent)
    } finally {
        await fs.rm(parent, { recursive: true, force: true })
    }

}

async function rejectsWith(promise, code) {

    await assert.rejects(promise, error => error.code === code)

}



test("the default root is XDG state, never inside the project", () => {

    assert.equal(
        defaultWorkspaceRoot({}, "/home/user"),
        "/home/user/.local/state/wood-booster-hq/spacemonkey",
    )

    assert.equal(
        defaultWorkspaceRoot({ XDG_STATE_HOME: "/srv/state" }, "/home/user"),
        "/srv/state/wood-booster-hq/spacemonkey",
    )

    assert.equal(
        defaultWorkspaceRoot({ XDG_STATE_HOME: "relative" }, "/home/user"),
        "/home/user/.local/state/wood-booster-hq/spacemonkey",
        "a relative XDG_STATE_HOME is ignored",
    )

    assert.equal(defaultWorkspaceRoot({ SPACEMONKEY_WORKSPACE_ROOT: "/tmp/sm" }, "/home/user"), "/tmp/sm")

})



test("a root inside the project, the home itself, / or a protected path is refused", () => {

    const options = { projectRoot: "/repo", home: "/home/user" }

    assert.ok(validateWorkspaceRoot("/repo/.spacemonkey", options).length > 0)

    assert.ok(validateWorkspaceRoot("/", options).length > 0)

    assert.ok(validateWorkspaceRoot("/home/user", options).length > 0)

    assert.ok(validateWorkspaceRoot("/home/user/.ssh/spacemonkey", options).length > 0)

    assert.ok(validateWorkspaceRoot("relative/path", options).length > 0)

    assert.deepEqual(validateWorkspaceRoot("/home/user/.local/state/wood-booster-hq/spacemonkey", options), [])

})



test("ensure creates the standard folders with owner-only permissions", async () => {

    await withWorkspace({}, async workspace => {
        const root = await workspace.ensure()

        for (const name of SUBDIRECTORIES) {
            const stat = await fs.stat(path.join(root, name))

            assert.ok(stat.isDirectory(), name)
        }

        assert.equal((await fs.stat(root)).mode & 0o777, 0o700)
    })

})



test("a workspace under the project root is refused before anything is created", async () => {

    const project = await fs.mkdtemp(path.join(os.tmpdir(), "sm-project-"))

    try {
        const workspace = new SpacemonkeyWorkspace({ root: path.join(project, "ws"), projectRoot: project })

        await rejectsWith(workspace.ensure(), "invalid-root")

        await assert.rejects(fs.stat(path.join(project, "ws")))
    } finally {
        await fs.rm(project, { recursive: true, force: true })
    }

})



test("allowed files can be written and read back, atomically and without overwrite", async () => {

    await withWorkspace({}, async workspace => {
        const written = await workspace.writeFile("reports/a.txt", "hei")

        assert.deepEqual(written, { path: "reports/a.txt", bytes: 3 })

        assert.equal(await workspace.readFile("reports/a.txt"), "hei")

        await rejectsWith(workspace.writeFile("reports/a.txt", "toinen"), "exists")

        await workspace.writeFile("reports/a.txt", "toinen", { overwrite: true })

        assert.equal(await workspace.readFile("reports/a.txt"), "toinen")

        const leftovers = (await fs.readdir(path.join(workspace.realRoot, "reports"))).filter(name => name.includes(".tmp-"))

        assert.deepEqual(leftovers, [])

        assert.equal((await fs.stat(path.join(workspace.realRoot, "reports/a.txt"))).mode & 0o777, 0o600)
    })

})



test("traversal, absolute, empty, NUL and protected paths are refused", async () => {

    await withWorkspace({}, async workspace => {
        await rejectsWith(workspace.writeFile("../escape.txt", "x"), "path-traversal")

        await rejectsWith(workspace.writeFile("reports/../../escape.txt", "x"), "path-traversal")

        await rejectsWith(workspace.writeFile("/etc/passwd", "x"), "absolute-path")

        await rejectsWith(workspace.writeFile("", "x"), "invalid-path")

        await rejectsWith(workspace.writeFile("a\0b", "x"), "invalid-path")

        await rejectsWith(workspace.writeFile("drafts/.env", "x"), "protected-path")

        await rejectsWith(workspace.writeFile("exports/server.key", "x"), "protected-path")

        await rejectsWith(workspace.readFile("../../etc/hostname"), "path-traversal")
    })

})



test("symlinks cannot lead out of the workspace", async () => {

    await withWorkspace({}, async (workspace, parent) => {
        const outside = path.join(parent, "outside")

        await fs.mkdir(outside)

        await fs.writeFile(path.join(outside, "notes.txt"), "muistiinpano")

        const root = await workspace.ensure()

        await fs.symlink(outside, path.join(root, "drafts", "door"))

        await fs.symlink(path.join(outside, "notes.txt"), path.join(root, "reports", "link.txt"))

        await rejectsWith(workspace.readFile("drafts/door/notes.txt"), "outside-workspace")

        await rejectsWith(workspace.writeFile("drafts/door/new.txt", "x"), "outside-workspace")

        await rejectsWith(workspace.readFile("reports/link.txt"), "symlink")

        await rejectsWith(workspace.writeFile("reports/link.txt", "x", { overwrite: true }), "symlink")

        await assert.rejects(fs.stat(path.join(outside, "new.txt")))

        assert.equal(await fs.readFile(path.join(outside, "notes.txt"), "utf8"), "muistiinpano")
    })

})



test("file size and total quota are enforced", async () => {

    await withWorkspace({ maxFileBytes: 10, maxTotalBytes: 25 }, async workspace => {
        await rejectsWith(workspace.writeFile("reports/big.txt", "x".repeat(11)), "file-too-large")

        await workspace.writeFile("reports/a.txt", "x".repeat(10))

        await workspace.writeFile("reports/b.txt", "x".repeat(10))

        await rejectsWith(workspace.writeFile("reports/c.txt", "x".repeat(10)), "quota-exceeded")

        assert.deepEqual(await workspace.usage(), { bytes: 20, files: 2, maxTotalBytes: 25 })
    })

})



test("tasks get their own folder, finish with a state, and can be removed", async () => {

    await withWorkspace({ now: () => new Date("2026-10-21T18:30:00.000Z") }, async workspace => {
        const task = await workspace.createTask({ kind: "system-status", label: "testi" })

        assert.match(task.id, /^20261021T183000Z-system-status-[0-9a-f]{8}$/)

        assert.equal((await workspace.readTask(task.id)).state, "open")

        await workspace.writeFile(workspace.taskPath(task.id, "report.md"), "raportti")

        const finished = await workspace.finishTask(task.id, { state: "done", summary: "ok" })

        assert.equal(finished.state, "done")

        assert.deepEqual((await workspace.listTasks()).map(item => item.id), [task.id])

        await workspace.removeTask(task.id)

        assert.deepEqual(await workspace.listTasks(), [])

        await rejectsWith(workspace.createTask({ kind: "../evil" }), "invalid-task-kind")

        assert.throws(() => workspace.taskPath("../../etc"), error => error.code === "invalid-task-id")
    })

})



test("a task left open by an interrupted run is marked interrupted, not deleted", async () => {

    await withWorkspace({}, async (first, parent) => {
        const task = await first.createTask({ kind: "system-status" })

        await first.writeFile(first.taskPath(task.id, "partial.json"), "{}")

        // Uusi käynnistys samalla juurella.
        const second = new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey") })

        await second.ensure()

        const recovered = await second.readTask(task.id)

        assert.equal(recovered.state, "interrupted")

        assert.equal(await second.readFile(second.taskPath(task.id, "partial.json")), "{}")
    })

})
