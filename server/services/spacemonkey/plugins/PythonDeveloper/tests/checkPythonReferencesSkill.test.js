import { test } from "node:test"

import assert from "node:assert/strict"

import checkPythonReferencesSkill, {
    extractDotRelativeImports,
    extractBareImportNames,
} from "../skills/checkPythonReferencesSkill.js"



test("extractDotRelativeImports finds dot-relative from-imports", () => {

    const code = "from . import helpers\nfrom .pkg import thing\nimport os\n"

    const found = extractDotRelativeImports(code)

    assert.equal(found.length, 2)
    assert.ok(found.some(line => line.includes("from . import helpers")))
    assert.ok(found.some(line => line.includes("from .pkg import thing")))

})



test("extractBareImportNames finds both 'import x' and 'from x import y' names", () => {

    const code = "import os\nfrom requests import get\nimport totally_fake_module\n"

    const names = extractBareImportNames(code)

    assert.ok(names.includes("os"))
    assert.ok(names.includes("requests"))
    assert.ok(names.includes("totally_fake_module"))

})



function fakeToolBus(existingFiles) {

    return {
        async execute(toolId, { action, file }) {

            if (toolId === "file" && action === "exists") {

                return { success: true, exists: existingFiles.has(file) }

            }

            return { success: false }

        },
    }

}



test("execute flags a dot-relative import unconditionally", async () => {

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "from .helpers import do_thing\n",
        toolBus: fakeToolBus(new Set()),
    })

    assert.equal(result.success, true)
    assert.equal(result.unresolvedReferences.length, 1)
    assert.ok(result.unresolvedReferences[0].includes("from .helpers import do_thing"))

})



test("execute never flags stdlib imports", async () => {

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "import os\nimport sys\nimport json\n",
        toolBus: fakeToolBus(new Set()),
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("execute never flags a known third-party package", async () => {

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "import requests\n",
        toolBus: fakeToolBus(new Set()),
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("execute flags a bare import that doesn't resolve to a real generated-python file", async () => {

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "import totally_fake_module\n",
        toolBus: fakeToolBus(new Set()),
    })

    assert.deepEqual(result.unresolvedReferences, ["totally_fake_module"])

})



test("execute does not flag a bare import that resolves to a real file in generated-python/", async () => {

    const path = await import("node:path")

    const { GENERATED_PYTHON_DIR } = await import("../skills/writePythonCodeSkill.js")

    const existingPath = path.join(GENERATED_PYTHON_DIR, "helpers.py")

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "import helpers\n",
        toolBus: fakeToolBus(new Set([existingPath])),
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("execute returns an empty array when proposedCode or toolBus is missing", async () => {

    assert.deepEqual(
        (await checkPythonReferencesSkill.execute({ proposedCode: null, toolBus: fakeToolBus(new Set()) })).unresolvedReferences,
        [],
    )

    assert.deepEqual(
        (await checkPythonReferencesSkill.execute({ proposedCode: "import os\n", toolBus: null })).unresolvedReferences,
        [],
    )

})



test("execute swallows a toolBus failure and returns an empty array instead of throwing", async () => {

    const throwingToolBus = {
        async execute() {
            throw new Error("boom")
        },
    }

    const result = await checkPythonReferencesSkill.execute({
        proposedCode: "import totally_fake_module\n",
        toolBus: throwingToolBus,
    })

    assert.equal(result.success, true)
    assert.deepEqual(result.unresolvedReferences, [])

})
