import { test } from "node:test"

import assert from "node:assert/strict"

import publishWordPressPostSkill from "../skills/publishWordPressPostSkill.js"



function fakePrisma(draft) {

    return {
        blogPostDraft: {
            findUnique: async () => draft,
        },
    }

}



test("rejects a draft that does not exist", async () => {

    const result = await publishWordPressPostSkill.execute({
        draftId: 1,
        prisma: fakePrisma(null),
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_found")

})



test("rejects a draft that is not approved", async () => {

    const result = await publishWordPressPostSkill.execute({
        draftId: 1,
        prisma: fakePrisma({ id: 1, status: "draft" }),
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_approved")

})



test("happy path: passes draft fields through to the toolBus", async () => {

    const draft = {
        id: 1,
        status: "approved",
        title: "Uusi projekti valmis",
        content: "Teksti tähän.",
        excerpt: null,
        wordpressPostStatus: "publish",
        wordpressPostId: null,
    }

    let toolInput = null

    const toolBus = {
        execute: async (id, input) => {
            toolInput = { id, input }
            return { success: true, postId: 42, permalink: "https://example.com/?p=42" }
        },
    }

    const result = await publishWordPressPostSkill.execute({
        draftId: 1,
        prisma: fakePrisma(draft),
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(toolInput.id, "wordpress-rest-publish")

    assert.equal(toolInput.input.title, "Uusi projekti valmis")

    assert.equal(toolInput.input.content, "Teksti tähän.")

    assert.equal(toolInput.input.wordpressPostId, null)

})



test("republish path passes the existing wordpressPostId through", async () => {

    const draft = {
        id: 1,
        status: "approved",
        title: "Päivitetty",
        content: "Teksti",
        excerpt: null,
        wordpressPostStatus: "publish",
        wordpressPostId: "42",
    }

    let toolInput = null

    const toolBus = {
        execute: async (id, input) => {
            toolInput = input
            return { success: true, postId: 42, permalink: "x" }
        },
    }

    await publishWordPressPostSkill.execute({
        draftId: 1,
        prisma: fakePrisma(draft),
        toolBus,
    })

    assert.equal(toolInput.wordpressPostId, "42")

})
