import { test } from "node:test"

import assert from "node:assert/strict"

import WordPressPublishTool from "../tools/wordPressPublishTool.js"



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



function jsonResponse(body) {

    return { json: async () => body }

}



test("returns credentials_not_configured and makes zero fetch calls when unset", () => withEnv(
    {
        WORDPRESS_BASE_URL: undefined,
        WORDPRESS_USERNAME: undefined,
        WORDPRESS_APPLICATION_PASSWORD: undefined,
    },
    async () => {

        let callCount = 0

        const tool = new WordPressPublishTool({
            fetchImpl: async () => {
                callCount += 1
                return jsonResponse({})
            },
        })

        const result = await tool.execute({
            title: "Otsikko",
            content: "Sisältö",
        })

        assert.equal(result.success, false)

        assert.equal(result.code, "credentials_not_configured")

        assert.equal(callCount, 0)

    },
))



test("dry run makes zero fetch calls and returns a fabricated success", async () => {

    let callCount = 0

    const tool = new WordPressPublishTool({
        fetchImpl: async () => {
            callCount += 1
            return jsonResponse({})
        },
    })

    const result = await tool.execute({
        title: "Otsikko",
        content: "Sisältö",
        dryRun: true,
    })

    assert.equal(result.success, true)

    assert.equal(result.dryRun, true)

    assert.equal(callCount, 0)

})



test("requires title and content outside dry run", () => withEnv(
    {
        WORDPRESS_BASE_URL: "https://example.com",
        WORDPRESS_USERNAME: "admin",
        WORDPRESS_APPLICATION_PASSWORD: "secret",
    },
    async () => {

        const tool = new WordPressPublishTool({
            fetchImpl: async () => jsonResponse({}),
        })

        const result = await tool.execute({ title: "", content: "" })

        assert.equal(result.success, false)

        assert.equal(result.code, "missing_content")

    },
))



test("successful create posts to wp-json/wp/v2/posts", () => withEnv(
    {
        WORDPRESS_BASE_URL: "https://example.com",
        WORDPRESS_USERNAME: "admin",
        WORDPRESS_APPLICATION_PASSWORD: "secret",
    },
    async () => {

        const calls = []

        const tool = new WordPressPublishTool({
            fetchImpl: async (url) => {

                calls.push(url.toString())

                return jsonResponse({
                    id: 42,
                    link: "https://example.com/?p=42",
                    status: "publish",
                })

            },
        })

        const result = await tool.execute({
            title: "Uusi projekti valmis",
            content: "Teksti tähän.",
        })

        assert.equal(result.success, true)

        assert.equal(result.postId, 42)

        assert.equal(result.permalink, "https://example.com/?p=42")

        assert.equal(calls.length, 1)

        assert.match(calls[0], /\/wp-json\/wp\/v2\/posts$/)

    },
))



test("existing wordpressPostId updates instead of creating", () => withEnv(
    {
        WORDPRESS_BASE_URL: "https://example.com",
        WORDPRESS_USERNAME: "admin",
        WORDPRESS_APPLICATION_PASSWORD: "secret",
    },
    async () => {

        const calls = []

        const tool = new WordPressPublishTool({
            fetchImpl: async (url) => {

                calls.push(url.toString())

                return jsonResponse({ id: 42, link: "x", status: "publish" })

            },
        })

        await tool.execute({
            title: "Päivitetty",
            content: "Teksti",
            wordpressPostId: "42",
        })

        assert.match(calls[0], /\/wp-json\/wp\/v2\/posts\/42$/)

    },
))



test("WordPress error body (no numeric id) is surfaced as wordpress_api_error", () => withEnv(
    {
        WORDPRESS_BASE_URL: "https://example.com",
        WORDPRESS_USERNAME: "admin",
        WORDPRESS_APPLICATION_PASSWORD: "secret",
    },
    async () => {

        const tool = new WordPressPublishTool({
            fetchImpl: async () => jsonResponse({
                code: "rest_cannot_create",
                message: "Sorry, you are not allowed to create posts.",
            }),
        })

        const result = await tool.execute({
            title: "Otsikko",
            content: "Sisältö",
        })

        assert.equal(result.success, false)

        assert.equal(result.code, "wordpress_api_error")

        assert.match(result.error, /not allowed to create posts/)

    },
))
