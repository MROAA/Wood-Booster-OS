import { test } from "node:test"

import assert from "node:assert/strict"

import { deriveCheckStatusSummary } from "./deriveCheckStatusSummary.js"



test("empty rollup is 'none', not an error - legitimate for doc-only or pre-feature PRs", () => {

    assert.equal(deriveCheckStatusSummary([]), "none")

    assert.equal(deriveCheckStatusSummary(null), "none")

    assert.equal(deriveCheckStatusSummary(undefined), "none")

})



test("all CheckRun entries completed successfully -> 'passing'", () => {

    const rollup = [
        { status: "COMPLETED", conclusion: "SUCCESS" },
        { status: "COMPLETED", conclusion: "NEUTRAL" },
        { status: "COMPLETED", conclusion: "SKIPPED" },
    ]

    assert.equal(deriveCheckStatusSummary(rollup), "passing")

})



test("a still-running CheckRun -> 'pending', even if another already failed", () => {

    const rollup = [
        { status: "COMPLETED", conclusion: "FAILURE" },
        { status: "IN_PROGRESS", conclusion: null },
    ]

    assert.equal(deriveCheckStatusSummary(rollup), "pending")

})



test("a failing CheckRun with nothing pending -> 'failing'", () => {

    const rollup = [
        { status: "COMPLETED", conclusion: "SUCCESS" },
        { status: "COMPLETED", conclusion: "FAILURE" },
    ]

    assert.equal(deriveCheckStatusSummary(rollup), "failing")

})



test("legacy StatusContext shape (state field, no status/conclusion) is handled", () => {

    assert.equal(
        deriveCheckStatusSummary([{ state: "SUCCESS" }]),
        "passing",
    )

    assert.equal(
        deriveCheckStatusSummary([{ state: "PENDING" }]),
        "pending",
    )

    assert.equal(
        deriveCheckStatusSummary([{ state: "ERROR" }]),
        "failing",
    )

})



test("mixed CheckRun and StatusContext entries in the same rollup", () => {

    const rollup = [
        { status: "COMPLETED", conclusion: "SUCCESS" },
        { state: "SUCCESS" },
    ]

    assert.equal(deriveCheckStatusSummary(rollup), "passing")

    const mixedFailing = [
        { status: "COMPLETED", conclusion: "SUCCESS" },
        { state: "FAILURE" },
    ]

    assert.equal(deriveCheckStatusSummary(mixedFailing), "failing")

})
