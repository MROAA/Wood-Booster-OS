import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import FileTool from "../../../tools/FileTool.js"

import { isValidPythonSyntax } from "../../../../pythonSyntaxValidator.js"

import inspectPythonCodeSkill, {
    describePythonCode,
} from "../skills/inspectPythonCodeSkill.js"

import { PROJECT_ROOT } from "../skills/reviewPythonCodeSkill.js"



const realToolBus = {
    execute: (id, input) => FileTool.execute(input),
}



test("describePythonCode lists functions, classes, imports and TODOs", () => {

    const facts = describePythonCode([
        "import os",
        "from pathlib import Path",
        "",
        "class Board:",
        "    def place(self):  # TODO: rules",
        "        pass",
        "",
        "async def main():",
        "    pass",
    ].join("\n"))

    assert.equal(facts.lines, 9)

    assert.deepEqual(facts.functions, ["place", "main"])

    assert.deepEqual(facts.classes, ["Board"])

    assert.deepEqual(facts.imports, ["os", "pathlib"])

    assert.equal(facts.todoCount, 1)

})



test("rejects non-.py files and traversal before reading anything", async () => {

    let reads = 0

    const toolBus = { execute: async () => { reads += 1; return { success: true, content: "" } } }

    for (const filePath of ["server/.env", "../outside.py", "/etc/passwd.py", undefined]) {
        const result = await inspectPythonCodeSkill.execute({ filePath, toolBus })

        assert.equal(result.success, false)

        assert.equal(result.code, "unsafe_file_path")
    }

    assert.equal(reads, 0)

})



test("rejects a .py symlink inside the project that points outside it", async () => {

    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "hq-inspect-outside-"))

    const insideDir = await fs.mkdtemp(path.join(PROJECT_ROOT, ".hq-inspect-test-"))

    try {
        const target = path.join(outsideDir, "secret.py")

        await fs.writeFile(target, "TOKEN = 'x'\n")

        await fs.symlink(target, path.join(insideDir, "link.py"))

        const result = await inspectPythonCodeSkill.execute({
            filePath: path.relative(PROJECT_ROOT, path.join(insideDir, "link.py")),
            toolBus: realToolBus,
        })

        assert.equal(result.success, false)

        assert.equal(result.code, "unsafe_file_path")
    } finally {
        await fs.rm(insideDir, { recursive: true, force: true })

        await fs.rm(outsideDir, { recursive: true, force: true })
    }

})



test("inspects a real project file with the real File Tool and syntax check", async () => {

    const result = await inspectPythonCodeSkill.execute({
        filePath: "agent.py",
        toolBus: realToolBus,
        isValidPythonSyntax,
    })

    assert.equal(result.success, true, result.error)

    assert.equal(result.relativePath, "agent.py")

    assert.equal(result.syntaxValid, true)

    assert.ok(result.lines > 0)

})



test("reports a syntax error without running the file", async () => {

    const result = await inspectPythonCodeSkill.execute({
        filePath: "broken.py",
        toolBus: { execute: async () => ({ success: true, content: "def broken(:\n    pass\n" }) },
        isValidPythonSyntax,
    })

    assert.equal(result.success, true)

    assert.equal(result.syntaxValid, false)

})



test("without a syntax checker the result says 'unknown', not 'valid'", async () => {

    const result = await inspectPythonCodeSkill.execute({
        filePath: "x.py",
        toolBus: { execute: async () => ({ success: true, content: "x = 1\n" }) },
    })

    assert.equal(result.syntaxValid, null)

})



test("a read failure and an oversized file are controlled errors", async () => {

    const failed = await inspectPythonCodeSkill.execute({
        filePath: "missing.py",
        toolBus: realToolBus,
    })

    assert.equal(failed.code, "read_failed")

    const huge = await inspectPythonCodeSkill.execute({
        filePath: "huge.py",
        toolBus: { execute: async () => ({ success: true, content: "#".repeat(600000) }) },
    })

    assert.equal(huge.code, "file_too_large")

})
