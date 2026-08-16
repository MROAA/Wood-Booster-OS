import { test } from "node:test"

import assert from "node:assert/strict"

import checkCodeReferencesSkill from "../skills/checkCodeReferencesSkill.js"



test("returns no unresolved references when proposedCode is missing", async () => {

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: null,
        filePath: "src/pages/Foo.jsx",
        toolBus: { execute: async () => { throw new Error("should not be called") } },
    })

    assert.equal(result.success, true)

    assert.deepEqual(result.unresolvedReferences, [])

})



test("ignores npm package imports (non-relative specifiers)", async () => {

    const toolBus = {
        execute: async () => ({ success: true, exists: false }),
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: "import React from 'react'\nimport { useState } from 'react'",
        filePath: "src/pages/Foo.jsx",
        toolBus,
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("does not flag a relative import that actually exists on disk", async () => {

    const toolBus = {
        execute: async (id, input) => ({
            success: true,
            exists: input.file.endsWith("math.js"),
        }),
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: "import { multiply } from './math.js'",
        filePath: "src/services/foo.js",
        toolBus,
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("flags a relative import that resolves to nothing on disk", async () => {

    const toolBus = {
        execute: async () => ({ success: true, exists: false }),
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: "import { multiply } from './math.js'",
        filePath: "src/services/foo.js",
        toolBus,
    })

    assert.deepEqual(result.unresolvedReferences, ["./math.js"])

})



test("does not flag a reference to a sibling file in the same plan, even before it's written", async () => {

    const toolBus = {
        execute: async () => ({ success: true, exists: false }),
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: "import HelperCard from './HelperCard.jsx'",
        filePath: "src/pages/NewPage.jsx",
        toolBus,
        siblingFilePaths: ["src/pages/HelperCard.jsx"],
    })

    assert.deepEqual(result.unresolvedReferences, [])

})



test("flags multiple unresolved references independently", async () => {

    const toolBus = {
        execute: async (id, input) => ({
            success: true,
            exists: input.file.endsWith("real.js"),
        }),
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode:
            "import { a } from './real.js'\n" +
            "import { b } from './fake1.js'\n" +
            "import { c } from '../also/fake2'\n",
        filePath: "src/services/foo.js",
        toolBus,
    })

    assert.deepEqual(
        result.unresolvedReferences.sort(),
        ["../also/fake2", "./fake1.js"].sort(),
    )

})



test("never throws even if toolBus itself throws", async () => {

    const toolBus = {
        execute: async () => { throw new Error("boom") },
    }

    const result = await checkCodeReferencesSkill.execute({
        proposedCode: "import { x } from './y.js'",
        filePath: "src/services/foo.js",
        toolBus,
    })

    assert.equal(result.success, true)

})
