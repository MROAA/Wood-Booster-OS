import { test } from "node:test"

import assert from "node:assert/strict"

import {
    PROJECT_ROOT,
    resolveSafeProjectFilePath,
} from "../skills/projectSandbox.js"



test("allows a normal relative source file inside the project", () => {

    const result = resolveSafeProjectFilePath("src/pages/DevStudio.jsx")

    assert.equal(result.ok, true)

    assert.equal(
        result.absolutePath,
        `${PROJECT_ROOT}/src/pages/DevStudio.jsx`,
    )

    assert.equal(result.relativePath, "src/pages/DevStudio.jsx")

})



test("rejects path traversal that escapes the project root", () => {

    const result = resolveSafeProjectFilePath("../../../etc/passwd")

    assert.equal(result.ok, false)

    assert.equal(result.code, "path_traversal_blocked")

})



test("neutralizes a leading-slash absolute path instead of escaping the root", () => {

    // A leading "/" is stripped before resolving, so "/etc/passwd"
    // becomes "etc/passwd" relative to PROJECT_ROOT - it never
    // escapes, it just has no allowed extension.
    const result = resolveSafeProjectFilePath("/etc/passwd")

    assert.equal(result.ok, false)

    assert.equal(result.code, "extension_not_allowed")

})



test("rejects traversal hidden behind a leading slash", () => {

    const result = resolveSafeProjectFilePath("/../../etc/passwd.js")

    assert.equal(result.ok, false)

    assert.equal(result.code, "path_traversal_blocked")

})



test("rejects node_modules", () => {

    const result = resolveSafeProjectFilePath(
        "node_modules/react/package.json",
    )

    assert.equal(result.ok, false)

    assert.equal(result.code, "blocked_directory")

})



test("rejects .git", () => {

    const result = resolveSafeProjectFilePath(".git/config")

    assert.equal(result.ok, false)

    assert.equal(result.code, "blocked_directory")

})



test("rejects the plugin's own backup directory as a write target", () => {

    const result = resolveSafeProjectFilePath(
        ".dev-studio-backups/foo.js.bak",
    )

    assert.equal(result.ok, false)

    assert.equal(result.code, "blocked_directory")

})



test("rejects the plugin's own verification scratch directory as a write target", () => {

    const result = resolveSafeProjectFilePath(
        ".dev-studio-verification/some-run-id/target.mjs",
    )

    assert.equal(result.ok, false)

    assert.equal(result.code, "blocked_directory")

})



test("rejects sensitive filenames", () => {

    assert.equal(
        resolveSafeProjectFilePath("server/.env").code,
        "sensitive_file_blocked",
    )

    assert.equal(
        resolveSafeProjectFilePath(".env.production").code,
        "sensitive_file_blocked",
    )

    assert.equal(
        resolveSafeProjectFilePath("secrets.json").code,
        "sensitive_file_blocked",
    )

    assert.equal(
        resolveSafeProjectFilePath("id_rsa").code,
        "sensitive_file_blocked",
    )

})



test("rejects disallowed extensions", () => {

    const result = resolveSafeProjectFilePath("server/prisma/dev.db")

    assert.equal(result.ok, false)

    assert.equal(result.code, "extension_not_allowed")

})



test("rejects a missing file path", () => {

    const result = resolveSafeProjectFilePath("")

    assert.equal(result.ok, false)

    assert.equal(result.code, "missing_file_path")

})
