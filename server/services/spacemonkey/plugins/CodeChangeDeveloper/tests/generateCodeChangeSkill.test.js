import { test } from "node:test"

import assert from "node:assert/strict"

import generateCodeChangeSkill from "../skills/generateCodeChangeSkill.js"



test("rejects a missing prompt", async () => {

    const result = await generateCodeChangeSkill.execute({
        filePath: "README.md",
        toolBus: { execute: async () => ({ success: true }) },
        generateCodeChange: async () => ({}),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_prompt")

})



test("rejects an unsafe file path before touching the tool bus", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)
            return { success: true }
        },
    }

    const result = await generateCodeChangeSkill.execute({
        prompt: "lisää kommentti",
        filePath: "../../etc/passwd",
        toolBus,
        generateCodeChange: async () => ({}),
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "path_traversal_blocked")

    assert.equal(calls.length, 0)

})



test("new file: exists=false skips read, passes null currentCode", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "exists") {
                return { success: true, exists: false }
            }

            throw new Error("should not read a file that does not exist")
        },
    }

    let receivedCurrentCode = "not called"

    const result = await generateCodeChangeSkill.execute({
        prompt: "luo uusi tiedosto",
        filePath: "docs/new-file.md",
        toolBus,
        generateCodeChange: async ({ currentCode }) => {
            receivedCurrentCode = currentCode
            return { title: "Uusi tiedosto", explanation: "...", code: "# Uusi" }
        },
    })

    assert.equal(result.success, true)

    assert.equal(result.originalCode, null)

    assert.equal(receivedCurrentCode, null)

})



test("existing file: reads current content and returns it alongside the proposal", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") {
                return { success: true, exists: true }
            }

            if (input.action === "read") {
                return { success: true, content: "# Old README" }
            }

            throw new Error(`unexpected action: ${input.action}`)
        },
    }

    const result = await generateCodeChangeSkill.execute({
        prompt: "lisää lause loppuun",
        filePath: "README.md",
        toolBus,
        generateCodeChange: async ({ currentCode }) => ({
            title: "Päivitys",
            explanation: "Lisätty lause.",
            code: `${currentCode}\nUusi lause.`,
        }),
    })

    assert.equal(result.success, true)

    assert.equal(result.originalCode, "# Old README")

    assert.equal(result.proposedCode, "# Old README\nUusi lause.")

})



test("forwards an explicit model choice into the generator", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") {
                return { success: true, exists: false }
            }

            throw new Error("should not read a file that does not exist")
        },
    }

    let receivedModel = "not called"

    await generateCodeChangeSkill.execute({
        prompt: "luo uusi tiedosto",
        filePath: "docs/new-file.md",
        model: "qwen2.5-coder:7b",
        toolBus,
        generateCodeChange: async ({ model }) => {
            receivedModel = model
            return { title: "Uusi tiedosto", explanation: "...", code: "# Uusi" }
        },
    })

    assert.equal(receivedModel, "qwen2.5-coder:7b")

})



test("passes model through as undefined when none was chosen, letting the generator's own default apply", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "exists") {
                return { success: true, exists: false }
            }

            throw new Error("should not read a file that does not exist")
        },
    }

    let receivedModel = "not called"

    await generateCodeChangeSkill.execute({
        prompt: "luo uusi tiedosto",
        filePath: "docs/new-file.md",
        toolBus,
        generateCodeChange: async ({ model }) => {
            receivedModel = model
            return { title: "Uusi tiedosto", explanation: "...", code: "# Uusi" }
        },
    })

    assert.equal(receivedModel, undefined)

})
