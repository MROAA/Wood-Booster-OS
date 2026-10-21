import { test } from "node:test"

import assert from "node:assert/strict"

import { ACCESS_LEVELS, isAccessAllowed, isAccessLevel } from "../accessLevels.js"

import { isProtectedPath } from "../protectedPaths.js"



test("there are exactly the six V6 access levels", () => {

    assert.deepEqual(Object.keys(ACCESS_LEVELS), [
        "observe",
        "workspace",
        "project-draft",
        "approved-execution",
        "privileged-os",
        "external-publishing",
    ])

    assert.equal(ACCESS_LEVELS.observe.mutates, false)

    assert.equal(isAccessLevel("read"), false)

    assert.equal(isAccessLevel("toString"), false)

})



test("access levels are not a staircase: each level must be allowed by name", () => {

    assert.equal(isAccessAllowed("observe", ["observe"]), true)

    assert.equal(isAccessAllowed("observe", ["external-publishing"]), false)

    assert.equal(isAccessAllowed("workspace", ["privileged-os"]), false)

    assert.equal(isAccessAllowed("external-publishing", ["privileged-os"]), false)

    assert.equal(isAccessAllowed("privileged-os", ["observe", "workspace"]), false)

    assert.equal(isAccessAllowed("root", ["root"]), false)

})



test("secrets, keys, databases, backups and dependency folders are protected", () => {

    for (const filePath of [
        ".env",
        "server/.env",
        "server/.env.local",
        "/home/marc/.ssh/id_ed25519",
        "certs/server.pem",
        "server/prisma/dev.db",
        "config/credentials.json",
        "data/api-token.txt",
        "backups/2026-10-21/dump.sql",
        "node_modules/express/index.js",
        ".git/config",
        "/home/marc/.hearthwood-security/notes.md",
    ]) {
        assert.equal(isProtectedPath(filePath), true, filePath)
    }

})



test("ordinary source files are not protected", () => {

    for (const filePath of [
        "server/index.js",
        "src/components/ai/ChatPanel.jsx",
        "server/services/devStudio/gitGuardianBackup.js",
        "server/services/tokenizer.js",
        "docs/spacemonkey/HQ_ASSISTANT_SPRINT1.md",
    ]) {
        assert.equal(isProtectedPath(filePath), false, filePath)
    }

    assert.equal(isProtectedPath(""), false)

})
