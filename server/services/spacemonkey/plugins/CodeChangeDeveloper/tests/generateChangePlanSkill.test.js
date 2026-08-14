import { test } from "node:test"

import assert from "node:assert/strict"

import generateChangePlanSkill from "../skills/generateChangePlanSkill.js"



test("rejects a missing prompt", async () => {

    const result = await generateChangePlanSkill.execute({
        generateChangePlan: async () => ({ files: [], explanation: "" }),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_prompt")

})



test("passes through safe files unmarked", async () => {

    const result = await generateChangePlanSkill.execute({
        prompt: "lisää uusi sivu",
        generateChangePlan: async () => ({
            files: [
                { action: "create", filePath: "src/pages/NewPage.jsx", reason: "uusi sivu" },
                { action: "modify", filePath: "src/App.jsx", reason: "reitin lisäys" },
            ],
            explanation: "Lisätään uusi sivu ja sen reitti.",
        }),
    })

    assert.equal(result.success, true)

    assert.equal(result.files.length, 2)

    assert.equal(result.files[0].blocked, false)

    assert.equal(result.files[0].filePath, "src/pages/NewPage.jsx")

    assert.equal(result.files[1].blocked, false)

    assert.equal(result.explanation, "Lisätään uusi sivu ja sen reitti.")

})



test("flags a sensitive file in the plan as blocked instead of dropping the whole plan", async () => {

    const result = await generateChangePlanSkill.execute({
        prompt: "tee jotain",
        generateChangePlan: async () => ({
            files: [
                { action: "modify", filePath: "src/App.jsx", reason: "ok" },
                { action: "modify", filePath: "server/.env", reason: "väärä ehdotus" },
            ],
            explanation: "...",
        }),
    })

    assert.equal(result.success, true)

    assert.equal(result.files.length, 2)

    assert.equal(result.files[0].blocked, false)

    assert.equal(result.files[1].blocked, true)

    assert.equal(result.files[1].blockedCode, "sensitive_file_blocked")

})



test("flags a path-traversal attempt in the plan as blocked", async () => {

    const result = await generateChangePlanSkill.execute({
        prompt: "tee jotain",
        generateChangePlan: async () => ({
            files: [
                { action: "modify", filePath: "../../etc/passwd.js", reason: "väärä" },
            ],
            explanation: "...",
        }),
    })

    assert.equal(result.success, true)

    assert.equal(result.files[0].blocked, true)

    assert.equal(result.files[0].blockedCode, "path_traversal_blocked")

})
