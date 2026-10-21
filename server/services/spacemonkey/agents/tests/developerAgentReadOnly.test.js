import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import DeveloperAgent from "../developer/DeveloperAgent.js"

import DeveloperWorkflow from "../../workflows/developer/DeveloperWorkflow.js"

import FileSearchSkill from "../../skills/filesystem/FileSearchSkill.js"

import ProjectStructureAnalyzer from "../../skills/analyze/ProjectStructureAnalyzer.js"

import ProjectUnderstandingAnalyzer from "../../skills/analyze/ProjectUnderstandingAnalyzer.js"

import CodeIntelligenceAnalyzer from "../../skills/analyze/CodeIntelligenceAnalyzer.js"



const silent = { info() {}, warn() {} }

// Vakoojat: vain luku -polku ei saa koskaan kutsua näitä.
function forbidden(name, calls) {

    return {
        async execute() {
            calls.push(name)
            throw new Error(`${name} must not run in read-only mode`)
        },
    }

}

function createAgent(projectRoot) {

    const calls = []

    const workflow = new DeveloperWorkflow({
        analyzeSkill: forbidden("analyze", calls),
        fileSearchSkill: new FileSearchSkill({ logger: silent }),
        readFileSkill: forbidden("read-file", calls),
        approvalSkill: forbidden("approval", calls),
        secureWriteWorkflow: forbidden("write", calls),
        testRunnerSkill: forbidden("test-runner", calls),
        gitCommitSkill: forbidden("git-commit", calls),
        projectStructureAnalyzer: new ProjectStructureAnalyzer({ logger: silent }),
        projectUnderstandingAnalyzer: new ProjectUnderstandingAnalyzer({ logger: silent }),
        codeIntelligenceAnalyzer: new CodeIntelligenceAnalyzer({ logger: silent }),
        logger: silent,
    })

    const agent = new DeveloperAgent({ workflow, projectRoot, logger: silent })

    return { agent, calls }

}

async function createProject() {

    const root = await fs.mkdtemp(path.join(os.tmpdir(), "dev-agent-ro-"))

    const files = {
        "src/pages/Report.jsx": "export default 1\n",
        "server/routes/report.js": "export default 2\n",
        "server/.env": "SECRET=1\n",
        "server/report.key": "x\n",
        "server/prisma/report.db": "x\n",
    }

    for (const [relative, content] of Object.entries(files)) {
        await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true })
        await fs.writeFile(path.join(root, relative), content)
    }

    return root

}



test("observe mode lists matching files with roles and never touches write, test or commit", async () => {

    const root = await createProject()

    try {
        const { agent, calls } = createAgent(root)

        const result = await agent.execute({ access: "observe", search: "report" })

        assert.equal(result.success, true)

        assert.equal(result.readOnly, true)

        assert.equal(result.agent, "developer-agent")

        assert.deepEqual(
            result.files.map(file => file.path).sort(),
            ["server/routes/report.js", "src/pages/Report.jsx"],
        )

        assert.equal(result.hiddenProtected, 2, "report.key and report.db are hidden")

        assert.deepEqual(calls, [])
    } finally {
        await fs.rm(root, { recursive: true, force: true })
    }

})



test("observe mode ignores a directory chosen by the task", async () => {

    const root = await createProject()

    const elsewhere = await fs.mkdtemp(path.join(os.tmpdir(), "dev-agent-elsewhere-"))

    try {
        await fs.writeFile(path.join(elsewhere, "report-outside.txt"), "x")

        const { agent } = createAgent(root)

        const result = await agent.execute({
            access: "observe",
            search: "report",
            projectPath: elsewhere,
            directory: elsewhere,
        })

        assert.ok(result.files.every(file => !file.path.includes("outside")))
    } finally {
        await fs.rm(root, { recursive: true, force: true })

        await fs.rm(elsewhere, { recursive: true, force: true })
    }

})



test("observe mode rejects path-like or empty search terms", async () => {

    const { agent, calls } = createAgent(os.tmpdir())

    for (const search of ["../etc", "a", "", undefined, "x/y", "rm -rf"]) {
        const result = await agent.execute({ access: "observe", search })

        assert.equal(result.success, false, String(search))

        assert.equal(result.error, "invalid search term")
    }

    assert.deepEqual(calls, [])

})



test("health reports what the read-only path is missing", () => {

    assert.deepEqual(
        new DeveloperAgent({ logger: silent }).health(),
        { ready: false, missing: ["workflow.inspect", "projectRoot"] },
    )

    assert.deepEqual(createAgent("/tmp").agent.health(), { ready: true, missing: [] })

})
