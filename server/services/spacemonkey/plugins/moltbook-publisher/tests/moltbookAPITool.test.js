import { test } from "node:test"

import assert from "node:assert/strict"

import MoltbookAPITool from "../tools/moltbookAPITool.js"



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



function jsonResponse(body, { ok = true, status = 200 } = {}) {

    return { ok, status, json: async () => body }

}



test("createPost returns credentials_not_configured and makes zero fetch calls when unset", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: undefined },
    async () => {

        let callCount = 0

        const tool = new MoltbookAPITool({
            fetchImpl: async () => {
                callCount += 1
                return jsonResponse({})
            },
        })

        const result = await tool.createPost({ title: "T", content: "C" })

        assert.equal(result.success, false)

        assert.equal(result.code, "credentials_not_configured")

        assert.equal(callCount, 0)

    },
))



test("createPost dry run makes zero fetch calls and returns a fabricated success", async () => {

    let callCount = 0

    const tool = new MoltbookAPITool({
        fetchImpl: async () => {
            callCount += 1
            return jsonResponse({})
        },
    })

    const result = await tool.createPost({
        title: "T",
        content: "C",
        dryRun: true,
    })

    assert.equal(result.success, true)

    assert.equal(result.dryRun, true)

    assert.equal(callCount, 0)

})



test("createPost requires title and content outside dry run", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const tool = new MoltbookAPITool({
            fetchImpl: async () => jsonResponse({}),
        })

        const result = await tool.createPost({ title: "", content: "" })

        assert.equal(result.success, false)

        assert.equal(result.code, "missing_content")

    },
))



test("createPost posts to /posts with Bearer auth and returns the post id", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const calls = []

        const tool = new MoltbookAPITool({
            fetchImpl: async (url, options) => {

                calls.push({ url: url.toString(), options })

                return jsonResponse({
                    success: true,
                    post: { id: "abc123" },
                })

            },
        })

        const result = await tool.createPost({
            title: "Hello Moltbook!",
            content: "My first post!",
        })

        assert.equal(result.success, true)

        assert.equal(result.postId, "abc123")

        assert.equal(calls.length, 1)

        assert.match(calls[0].url, /\/api\/v1\/posts$/)

        assert.equal(calls[0].options.headers.Authorization, "Bearer key")

        assert.equal(
            JSON.parse(calls[0].options.body).submolt_name,
            "general",
        )

    },
))



test("createPost surfaces a Moltbook API error (non-ok response)", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const tool = new MoltbookAPITool({
            fetchImpl: async () => jsonResponse(
                { success: false, code: "rate_limited", error: "Too many posts, try again later." },
                { ok: false, status: 429 },
            ),
        })

        const result = await tool.createPost({ title: "T", content: "C" })

        assert.equal(result.success, false)

        assert.equal(result.code, "rate_limited")

        assert.match(result.error, /Too many posts/)

    },
))



test("getFeed builds sort/limit/filter query params", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const calls = []

        const tool = new MoltbookAPITool({
            fetchImpl: async (url) => {

                calls.push(url.toString())

                return jsonResponse({ success: true, posts: [{ id: "1" }], next_cursor: "xyz" })

            },
        })

        const result = await tool.getFeed({ sort: "new", limit: 10, filter: "following" })

        assert.equal(result.success, true)

        assert.equal(result.posts.length, 1)

        assert.equal(result.nextCursor, "xyz")

        assert.match(calls[0], /\/api\/v1\/feed\?sort=new&limit=10&filter=following$/)

    },
))



test("execute() dispatches by action for ToolBus compatibility", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const tool = new MoltbookAPITool({
            fetchImpl: async () => jsonResponse({ success: true, posts: [] }),
        })

        const result = await tool.execute({ action: "get_posts" })

        assert.equal(result.success, true)

        const unknown = await tool.execute({ action: "does_not_exist" })

        assert.equal(unknown.success, false)

        assert.equal(unknown.code, "unknown_action")

    },
))



// Real challenge text captured from a live Moltbook API response
// (POST /posts, 2026-08-09) - deliberately noisy (mixed case, doubled
// letters, stray brackets) by Moltbook's own design.
const REAL_CHALLENGE_TEXT =
    "A] LoO bS tEr- Um] ClAw] ExE rTs^ ThIrRrTy FyVeee NooOtOnS ]+ [AnD] " +
    "ThE/ OtHeR ClA w~ ExErT s TwEnTy- TwO NooOtOnS, UhMm] WhAt{ Is }ThE " +
    "ToTaL FoR cE?"



test("createPost solves a pending verification challenge and calls /verify", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const calls = []

        const tool = new MoltbookAPITool({
            fetchImpl: async (url, options) => {

                calls.push(url.toString())

                if (url.toString().endsWith("/posts")) {

                    return jsonResponse({
                        success: true,
                        post: {
                            id: "abc123",
                            verification: {
                                verification_code: "moltbook_verify_xyz",
                                challenge_text: REAL_CHALLENGE_TEXT,
                                expires_at: "2026-08-09 20:32:18+00",
                            },
                        },
                    })

                }

                assert.match(url.toString(), /\/verify$/)

                assert.equal(
                    JSON.parse(options.body).answer,
                    "57.00",
                )

                return jsonResponse({ success: true })

            },
        })

        const result = await tool.createPost({
            title: "Hello Moltbook!",
            content: "My first post!",
        })

        assert.equal(result.success, true)

        assert.equal(result.verification.status, "verified")

        assert.equal(result.verification.answer, "57.00")

        assert.equal(calls.length, 2)

    },
))



test("createPost reports an unsolved verification challenge without failing the post itself", () => withEnv(
    { MOLTBOOK_AGENT_API_KEY: "key" },
    async () => {

        const tool = new MoltbookAPITool({
            fetchImpl: async () => jsonResponse({
                success: true,
                post: {
                    id: "abc123",
                    verification: {
                        verification_code: "moltbook_verify_xyz",
                        challenge_text: "completely unparseable gibberish",
                        expires_at: "2026-08-09 20:32:18+00",
                    },
                },
            }),
        })

        const result = await tool.createPost({
            title: "Hello Moltbook!",
            content: "My first post!",
        })

        assert.equal(result.success, true)

        assert.equal(result.verification.status, "unsolved")

        assert.equal(result.verification.code, "verification_challenge_unparseable")

    },
))
