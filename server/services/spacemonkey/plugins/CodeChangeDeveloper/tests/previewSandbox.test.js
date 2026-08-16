import { test } from "node:test"

import assert from "node:assert/strict"

import { resolveSafePreviewFilePath } from "../skills/previewSandbox.js"



test("allows a normal src/ page file", () => {

    const result = resolveSafePreviewFilePath("src/pages/DevStudio.jsx")

    assert.equal(result.ok, true)

})



test("rejects a server/ file even though it's a valid project path", () => {

    const result = resolveSafePreviewFilePath("server/routes/devStudio.js")

    assert.equal(result.ok, false)

    assert.equal(result.code, "outside_preview_scope")

})



test("rejects a root-level file outside src/", () => {

    const result = resolveSafePreviewFilePath("package.json")

    assert.equal(result.ok, false)

    assert.equal(result.code, "outside_preview_scope")

})



test("still rejects path traversal before the scope check ever runs", () => {

    const result = resolveSafePreviewFilePath("../../../etc/passwd")

    assert.equal(result.ok, false)

    assert.equal(result.code, "path_traversal_blocked")

})
