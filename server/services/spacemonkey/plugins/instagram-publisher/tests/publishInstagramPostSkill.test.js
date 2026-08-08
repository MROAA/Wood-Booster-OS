import { test } from "node:test"

import assert from "node:assert/strict"

import publishInstagramPostSkill from "../skills/publishInstagramPostSkill.js"



function withEnv(vars, fn) {

    const original = {}

    for (const key of Object.keys(vars)) {

        original[key] = process.env[key]

        if (vars[key] === undefined) {

            delete process.env[key]

        } else {

            process.env[key] = vars[key]

        }

    }

    return (async () => {

        try {

            return await fn()

        } finally {

            for (const key of Object.keys(original)) {

                if (original[key] === undefined) {

                    delete process.env[key]

                } else {

                    process.env[key] = original[key]

                }

            }

        }

    })()

}



function fakePrisma({ draft, files = [] }) {

    return {
        socialPostDraft: {
            findUnique: async () => draft,
        },
        projectFile: {
            findMany: async () => files,
        },
    }

}



test("rejects a draft that is not approved", async () => {

    const prisma = fakePrisma({
        draft: { id: 1, status: "draft" },
    })

    const result = await publishInstagramPostSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "draft_not_approved")

})



test("rejects an approved draft with no selected media", async () => {

    const prisma = fakePrisma({
        draft: { id: 1, status: "approved", selectedFileIds: null },
    })

    const result = await publishInstagramPostSkill.execute({
        draftId: 1,
        prisma,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "no_media_selected")

})



test("requires PUBLIC_BASE_URL", () => withEnv(
    { PUBLIC_BASE_URL: undefined, INSTAGRAM_DRY_RUN: "true" },
    async () => {

        const prisma = fakePrisma({
            draft: {
                id: 1,
                status: "approved",
                selectedFileIds: JSON.stringify([1]),
                caption: "hi",
                hashtags: "#wood",
            },
            files: [
                {
                    id: 1,
                    projectId: 5,
                    storedName: "a.jpg",
                    mimeType: "image/jpeg",
                },
            ],
        })

        const result = await publishInstagramPostSkill.execute({
            draftId: 1,
            prisma,
            toolBus: { execute: async () => ({ success: true }) },
        })

        assert.equal(result.success, false)

        assert.equal(result.code, "public_base_url_missing")

    },
))



test("happy path: resolves media URLs and calls the tool via toolBus", () => withEnv(
    { PUBLIC_BASE_URL: "https://public.example.com", INSTAGRAM_DRY_RUN: "true" },
    async () => {

        const prisma = fakePrisma({
            draft: {
                id: 1,
                status: "approved",
                selectedFileIds: JSON.stringify([1]),
                caption: "Uusi projekti valmis",
                hashtags: "#puuseppä #woodbooster",
            },
            files: [
                {
                    id: 1,
                    projectId: 5,
                    storedName: "final.jpg",
                    mimeType: "image/jpeg",
                },
            ],
        })

        let toolInput = null

        const toolBus = {
            execute: async (id, input) => {
                toolInput = { id, input }
                return { success: true, mediaId: "m1", permalink: "https://instagram.com/p/x" }
            },
        }

        const result = await publishInstagramPostSkill.execute({
            draftId: 1,
            prisma,
            toolBus,
        })

        assert.equal(result.success, true)

        assert.equal(toolInput.id, "instagram-graph-publish")

        assert.equal(
            toolInput.input.mediaItems[0].url,
            "https://public.example.com/uploads/projects/5/final.jpg",
        )

        assert.equal(toolInput.input.mediaItems[0].type, "IMAGE")

        assert.match(toolInput.input.caption, /Uusi projekti valmis/)

        assert.match(toolInput.input.caption, /#puuseppä/)

    },
))



test("flags unreachable media when not in dry-run mode", () => withEnv(
    { PUBLIC_BASE_URL: "https://public.example.com", INSTAGRAM_DRY_RUN: undefined },
    async () => {

        const prisma = fakePrisma({
            draft: {
                id: 1,
                status: "approved",
                selectedFileIds: JSON.stringify([1]),
                caption: "hi",
                hashtags: "",
            },
            files: [
                {
                    id: 1,
                    projectId: 5,
                    storedName: "final.jpg",
                    mimeType: "image/jpeg",
                },
            ],
        })

        const originalFetch = global.fetch

        global.fetch = async () => ({ ok: false })

        try {

            const result = await publishInstagramPostSkill.execute({
                draftId: 1,
                prisma,
                toolBus: { execute: async () => ({ success: true }) },
            })

            assert.equal(result.success, false)

            assert.equal(result.code, "media_unreachable")

        } finally {

            global.fetch = originalFetch

        }

    },
))
