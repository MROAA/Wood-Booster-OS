import { test } from "node:test"

import assert from "node:assert/strict"

import revertPullRequestSkill from "../skills/revertPullRequestSkill.js"



test("rejects missing prNumber", async () => {

    const result = await revertPullRequestSkill.execute({
        prNumber: null,
        originalTitle: "Lisää uusi sivu",
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_input")

})



test("rejects missing originalTitle", async () => {

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: null,
        toolBus: { execute: async () => ({ success: true }) },
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_input")

})



test("rejects a PR that is not merged", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "prView") {
                return { success: true, state: "OPEN", url: "https://example.com", mergeCommitSha: null }
            }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: "Lisää uusi sivu",
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "pr_not_merged")

})



test("rejects a merged PR with no merge commit SHA", async () => {

    const toolBus = {
        execute: async (id, input) => {
            if (input.action === "prView") {
                return { success: true, state: "MERGED", url: "https://example.com", mergeCommitSha: null }
            }

            throw new Error(`should not reach action: ${input.action}`)
        },
    }

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: "Lisää uusi sivu",
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "merge_commit_missing")

})



test("happy path: merge commit (2 parents) uses mainline revert and creates a PR", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "prView") {
                return {
                    success: true,
                    state: "MERGED",
                    url: "https://example.com/pull/142",
                    mergeCommitSha: "abc123",
                }
            }

            if (input.action === "fetch") return { success: true }

            if (input.action === "mergeParentCount") return { success: true, parentCount: 2 }

            if (input.action === "worktreeAdd") return { success: true }

            if (input.action === "revert") return { success: true }

            if (input.action === "push") return { success: true }

            if (input.action === "prCreate") {
                return {
                    success: true,
                    prUrl: "https://example.com/pull/143",
                    prNumber: 143,
                }
            }

            if (input.action === "worktreeRemove") return { success: true }

            throw new Error(`unexpected action: ${input.action}`)
        },
    }

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: "Lisää uusi sivu",
        toolBus,
    })

    assert.equal(result.success, true)

    assert.equal(result.prNumber, 143)

    const revertCall = calls.find(call => call.action === "revert")

    assert.ok(revertCall, "expected a revert call")

    assert.equal(revertCall.mainline, true)

    assert.equal(revertCall.sha, "abc123")

    const worktreeRemoveCall = calls.find(call => call.action === "worktreeRemove")

    assert.ok(worktreeRemoveCall, "expected worktreeRemove to run")

})



test("happy path: squash/rebase commit (1 parent) uses plain revert, no mainline flag", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "prView") {
                return {
                    success: true,
                    state: "MERGED",
                    url: "https://example.com/pull/142",
                    mergeCommitSha: "def456",
                }
            }

            if (input.action === "fetch") return { success: true }

            if (input.action === "mergeParentCount") return { success: true, parentCount: 1 }

            if (input.action === "worktreeAdd") return { success: true }

            if (input.action === "revert") return { success: true }

            if (input.action === "push") return { success: true }

            if (input.action === "prCreate") {
                return {
                    success: true,
                    prUrl: "https://example.com/pull/144",
                    prNumber: 144,
                }
            }

            if (input.action === "worktreeRemove") return { success: true }

            throw new Error(`unexpected action: ${input.action}`)
        },
    }

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: "Korjaa virhe",
        toolBus,
    })

    assert.equal(result.success, true)

    const revertCall = calls.find(call => call.action === "revert")

    assert.equal(revertCall.mainline, false)

})



test("worktreeRemove still runs when revert fails", async () => {

    const calls = []

    const toolBus = {
        execute: async (id, input) => {
            calls.push(input)

            if (input.action === "prView") {
                return {
                    success: true,
                    state: "MERGED",
                    url: "https://example.com/pull/142",
                    mergeCommitSha: "abc123",
                }
            }

            if (input.action === "fetch") return { success: true }

            if (input.action === "mergeParentCount") return { success: true, parentCount: 2 }

            if (input.action === "worktreeAdd") return { success: true }

            if (input.action === "revert") return { success: false, error: "conflict" }

            if (input.action === "worktreeRemove") return { success: true }

            throw new Error(`unexpected action: ${input.action}`)
        },
    }

    const result = await revertPullRequestSkill.execute({
        prNumber: 142,
        originalTitle: "Lisää uusi sivu",
        toolBus,
    })

    assert.equal(result.success, false)

    assert.equal(result.code, "revert_failed")

    const worktreeRemoveCall = calls.find(call => call.action === "worktreeRemove")

    assert.ok(worktreeRemoveCall, "expected worktreeRemove to still run in finally")

})
