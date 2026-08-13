import { test } from "node:test"

import assert from "node:assert/strict"

import InstagramGraphAPITool from "../tools/instagramGraphAPITool.js"



function jsonResponse(body, ok = true, status = 200) {

    return {
        ok,
        status,
        json: async () => body,
    }

}



function withCredentials(fn) {

    const original = {
        INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID,
        META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
        META_USER_ACCESS_TOKEN: process.env.META_USER_ACCESS_TOKEN,
    }

    process.env.INSTAGRAM_USER_ID = "ig-user-1"

    process.env.META_PAGE_ACCESS_TOKEN = "page-token"

    delete process.env.META_USER_ACCESS_TOKEN

    try {

        return fn()

    } finally {

        process.env.INSTAGRAM_USER_ID = original.INSTAGRAM_USER_ID

        process.env.META_PAGE_ACCESS_TOKEN = original.META_PAGE_ACCESS_TOKEN

        process.env.META_USER_ACCESS_TOKEN = original.META_USER_ACCESS_TOKEN

    }

}



test("returns credentials_not_configured and makes zero fetch calls when unset", async () => {

    const original = {
        INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID,
        META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
        META_USER_ACCESS_TOKEN: process.env.META_USER_ACCESS_TOKEN,
    }

    delete process.env.INSTAGRAM_USER_ID

    delete process.env.META_PAGE_ACCESS_TOKEN

    delete process.env.META_USER_ACCESS_TOKEN

    let callCount = 0

    const tool = new InstagramGraphAPITool({
        fetchImpl: async () => {
            callCount += 1
            return jsonResponse({})
        },
    })

    const result = await tool.execute({
        mediaItems: [{ url: "https://example.com/a.jpg", type: "IMAGE" }],
        caption: "hi",
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "credentials_not_configured")

    assert.equal(callCount, 0)

    process.env.INSTAGRAM_USER_ID = original.INSTAGRAM_USER_ID

    process.env.META_PAGE_ACCESS_TOKEN = original.META_PAGE_ACCESS_TOKEN

    process.env.META_USER_ACCESS_TOKEN = original.META_USER_ACCESS_TOKEN

})



test("dry run makes zero fetch calls and returns a fabricated success", async () => {

    let callCount = 0

    const tool = new InstagramGraphAPITool({
        fetchImpl: async () => {
            callCount += 1
            return jsonResponse({})
        },
    })

    const result = await tool.execute({
        mediaItems: [{ url: "https://example.com/a.jpg", type: "IMAGE" }],
        caption: "hi",
        dryRun: true,
    })

    assert.equal(result.success, true)

    assert.equal(result.dryRun, true)

    assert.equal(callCount, 0)

})



test("single image: creates one container, then publishes", () => withCredentials(async () => {

    const calls = []

    const tool = new InstagramGraphAPITool({
        fetchImpl: async (url) => {

            calls.push(url.toString())

            if (url.toString().includes("/media_publish")) {

                return jsonResponse({ id: "published-1" })

            }

            return jsonResponse({ id: "container-1" })

        },
    })

    const result = await tool.execute({
        mediaItems: [{ url: "https://example.com/a.jpg", type: "IMAGE" }],
        caption: "hi",
    })

    assert.equal(result.success, true)

    assert.equal(result.mediaId, "published-1")

    assert.equal(calls.length, 3)

    assert.match(calls[0], /\/ig-user-1\/media$/)

    assert.match(calls[1], /\/ig-user-1\/media_publish$/)

    assert.match(calls[2], /\/published-1\?/)

}))



test("carousel: creates a container per item plus a wrapping container", () => withCredentials(async () => {

    const calls = []

    let containerIndex = 0

    const tool = new InstagramGraphAPITool({
        fetchImpl: async (url) => {

            const urlString = url.toString()

            calls.push(urlString)

            if (urlString.includes("/media_publish")) {

                return jsonResponse({ id: "published-1" })

            }

            if (urlString.includes("/published-1")) {

                return jsonResponse({ permalink: "https://instagram.com/p/x" })

            }

            containerIndex += 1

            return jsonResponse({ id: `container-${containerIndex}` })

        },
    })

    const result = await tool.execute({
        mediaItems: [
            { url: "https://example.com/a.jpg", type: "IMAGE" },
            { url: "https://example.com/b.jpg", type: "IMAGE" },
            { url: "https://example.com/c.jpg", type: "IMAGE" },
        ],
        caption: "hi",
    })

    assert.equal(result.success, true)

    // 3 child containers + 1 carousel container + 1 publish + 1 permalink lookup
    assert.equal(calls.length, 6)

}))



test("graph API error is surfaced as graph_api_error", () => withCredentials(async () => {

    const tool = new InstagramGraphAPITool({
        fetchImpl: async () => jsonResponse(
            { error: { message: "Invalid OAuth access token." } },
            false,
            400,
        ),
    })

    const result = await tool.execute({
        mediaItems: [{ url: "https://example.com/a.jpg", type: "IMAGE" }],
        caption: "hi",
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "graph_api_error")

    assert.match(result.error, /Invalid OAuth access token/)

}))



test("too many media items is rejected before any fetch call", () => withCredentials(async () => {

    let callCount = 0

    const tool = new InstagramGraphAPITool({
        fetchImpl: async () => {
            callCount += 1
            return jsonResponse({})
        },
    })

    const mediaItems = Array.from({ length: 11 }, (_, index) => ({
        url: `https://example.com/${index}.jpg`,
        type: "IMAGE",
    }))

    const result = await tool.execute({ mediaItems, caption: "hi" })

    assert.equal(result.success, false)

    assert.equal(result.code, "too_many_media_items")

    assert.equal(callCount, 0)

}))
