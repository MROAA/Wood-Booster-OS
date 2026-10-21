import { test } from "node:test"

import assert from "node:assert/strict"

import { execFileSync } from "node:child_process"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import { buildSystemAtlas, validateSystems } from "../systemAtlas.js"

import { DEFAULT_PROJECT_ROOT } from "../../agents/runtime/registerAgents.js"



function git(root, ...args) {

    return execFileSync(
        "git",
        ["-C", root, "-c", "user.name=atlas-test", "-c", "user.email=atlas@test", "-c", "core.hooksPath=/dev/null", ...args],
        { encoding: "utf8" },
    )

}

async function write(root, files) {

    for (const [relative, content] of Object.entries(files)) {
        await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true })
        await fs.writeFile(path.join(root, relative), content)
    }

}

// Testirepo: vakaa haara "hearthwood-stable" ja kehityshaara "feat/new".
async function createRepo() {

    const root = await fs.mkdtemp(path.join(os.tmpdir(), "system-atlas-"))

    git(root, "init", "-q", "-b", "hearthwood-stable")

    await write(root, {
        "server/index.js": 'import "./routes/live.js"\n',
        "server/routes/live.js": "export default 1\n",
        "server/routes/live.test.js": "// test\n",
        "server/routes/orphan.js": "export default 2\n",
        "src/main.jsx": 'import "./pages/Home.jsx"\n',
        "src/pages/Home.jsx": "export default 3\n",
        "docs/plan.md": "# plan\n",
        "hooks/pre-commit": "python3 guard.py\n",
        "guard.py": "print(1)\n",
    })

    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "stable")

    git(root, "checkout", "-q", "-b", "feat/new")
    await write(root, {
        "server/index.js": 'import "./routes/live.js"\nimport "./routes/fresh.js"\n',
        "server/routes/fresh.js": "export default 4\n",
    })
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "dev")

    git(root, "checkout", "-q", "-b", "feat/elsewhere", "hearthwood-stable")
    await write(root, { "server/routes/elsewhere.js": "export default 5\n" })
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "elsewhere")

    git(root, "checkout", "-q", "hearthwood-stable")

    return root

}

const SYSTEMS = [
    { id: "live", name: "Live", project: "hq", domain: "business", code: ["server/routes/live.js", "src/pages/Home.jsx"] },
    { id: "fresh", name: "Fresh", project: "hq", domain: "business", code: ["server/routes/fresh.js"] },
    { id: "elsewhere", name: "Elsewhere", project: "hq", domain: "business", code: ["server/routes/elsewhere.js"] },
    { id: "orphan", name: "Orphan", project: "hq", domain: "business", code: ["server/routes/orphan.js"] },
    { id: "half", name: "Half", project: "hq", domain: "business", code: ["server/routes/live.js", "server/routes/gone.js"] },
    { id: "plan", name: "Plan", project: "hq", domain: "business", code: ["server/routes/planned.js"], docs: ["docs/plan.md"] },
    { id: "idea", name: "Idea", project: "hq", domain: "workshop", code: [] },
    { id: "guard", name: "Guard", project: "hq", domain: "trust", code: ["guard.py"], contains: [{ file: "hooks/pre-commit", text: "guard.py" }] },
    { id: "old", name: "Old", project: "hq", domain: "business", code: ["server/routes/live.js"], deprecated: true },
]

function statusOf(atlas, id) {

    const system = atlas.systems.find(item => item.id === id)

    return [system.status, system.reason, system.where]

}



test("on the stable branch: status comes from evidence, not from the list", async () => {

    const root = await createRepo()

    try {
        const atlas = await buildSystemAtlas({ root, systems: SYSTEMS })

        assert.equal(atlas.branch, "hearthwood-stable")

        assert.equal(atlas.stableRef, "hearthwood-stable")

        assert.deepEqual(statusOf(atlas, "live"), ["implemented", "loaded-and-stable", []])

        assert.deepEqual(statusOf(atlas, "fresh"), ["in-development", "other-branches", ["feat/new"]])

        assert.deepEqual(statusOf(atlas, "elsewhere"), ["in-development", "other-branches", ["feat/elsewhere"]])

        assert.deepEqual(statusOf(atlas, "orphan"), ["unknown", "not-wired", []])

        assert.deepEqual(statusOf(atlas, "half"), ["unknown", "partial", []])

        assert.deepEqual(statusOf(atlas, "plan"), ["planned", "docs-only", []])

        assert.deepEqual(statusOf(atlas, "idea"), ["unknown", "no-known-code", []])

        assert.deepEqual(statusOf(atlas, "guard"), ["implemented", "loaded-and-stable", []])

        assert.equal(statusOf(atlas, "old")[0], "deprecated")

        const live = atlas.systems.find(item => item.id === "live")

        assert.deepEqual(live.tests, { found: ["server/routes/live.test.js"], run: false })

        assert.equal(atlas.counts.implemented, 2)
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("on a development branch its own new code is in development, not implemented", async () => {

    const root = await createRepo()

    try {
        git(root, "checkout", "-q", "feat/new")

        const atlas = await buildSystemAtlas({ root, systems: SYSTEMS })

        assert.equal(atlas.branch, "feat/new")

        assert.deepEqual(statusOf(atlas, "fresh"), ["in-development", "this-branch", ["feat/new"]])

        assert.deepEqual(statusOf(atlas, "live"), ["implemented", "loaded-and-stable", []])
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("uncommitted changes are counted per system", async () => {

    const root = await createRepo()

    try {
        await fs.appendFile(path.join(root, "server/routes/live.js"), "// edit\n")

        const atlas = await buildSystemAtlas({ root, systems: SYSTEMS })

        assert.equal(atlas.systems.find(item => item.id === "live").uncommittedChanges, 1)

        assert.equal(atlas.systems.find(item => item.id === "fresh").uncommittedChanges, 0)
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("catalog entries with protected, absolute or escaping paths are rejected", () => {

    const { valid, rejected } = validateSystems([
        { id: "ok", name: "Ok", code: ["server/a.js"] },
        { id: "env", name: "Env", code: ["server/.env"] },
        { id: "db", name: "Db", code: ["server/prisma/dev.db"] },
        { id: "abs", name: "Abs", code: ["/etc/passwd"] },
        { id: "up", name: "Up", code: ["../outside.js"] },
        { id: "contains", name: "Contains", code: ["a.js"], contains: [{ file: ".env", text: "x" }] },
        { id: "nameless", code: ["a.js"] },
    ])

    assert.deepEqual(valid.map(item => item.id), ["ok"])

    assert.deepEqual(rejected, ["env", "db", "abs", "up", "contains", "nameless"])

})



test("the real HQ atlas finds core systems and never claims a test was run", async () => {

    const atlas = await buildSystemAtlas({ root: DEFAULT_PROJECT_ROOT })

    const byId = Object.fromEntries(atlas.systems.map(system => [system.id, system]))

    for (const id of ["dashboard", "projects", "customers", "dev-studio", "spacemonkey-chat", "spacemonkey-runtime"]) {
        assert.equal(byId[id].status, "implemented", id)
    }

    assert.equal(byId["product-design"].status, "unknown")

    assert.equal(byId["product-design"].reason, "no-known-code")

    assert.ok(["implemented", "in-development"].includes(byId["project-atlas"].status))

    assert.ok(atlas.systems.every(system => system.tests.run === false))

    assert.deepEqual(atlas.rejected, [])

    assert.ok(atlas.commit)

})
