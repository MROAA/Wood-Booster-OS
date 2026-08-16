import { test } from "node:test"

import assert from "node:assert/strict"

import { slugify, buildBranchName, buildCommitMessage, buildPrBody } from "../skills/pullRequestMessages.js"



test("slugify lowercases and replaces non-alphanumeric runs with a single dash", () => {

    assert.equal(slugify("Lisää uusi sivu!"), "lis-uusi-sivu")

})



test("slugify strips leading/trailing dashes and falls back for empty input", () => {

    assert.equal(slugify(""), "muutos")
    assert.equal(slugify("   "), "muutos")

})



test("slugify truncates very long titles to 50 characters", () => {

    const long = "a".repeat(100)

    assert.equal(slugify(long).length, 50)

})



test("buildBranchName prefixes with devstudio/ and appends a short random suffix", () => {

    const branch = buildBranchName("Lisää uusi sivu")

    assert.match(branch, /^devstudio\/lis-uusi-sivu-[0-9a-f]{8}$/)

})



test("buildBranchName produces a different suffix each call, avoiding retry collisions", () => {

    const first = buildBranchName("sama otsikko")
    const second = buildBranchName("sama otsikko")

    assert.notEqual(first, second)

})



test("buildCommitMessage prefers explanation over prompt as the body", () => {

    const message = buildCommitMessage({
        title: "Lisää uusi sivu",
        explanation: "Selitys tähän",
        prompt: "alkuperäinen pyyntö",
    })

    assert.equal(message, "Lisää uusi sivu\n\nSelitys tähän")

})



test("buildCommitMessage falls back to prompt when explanation is missing", () => {

    const message = buildCommitMessage({
        title: "Otsikko",
        explanation: null,
        prompt: "pyyntö",
    })

    assert.equal(message, "Otsikko\n\npyyntö")

})



test("buildPrBody pluralizes the file count correctly and never uses the Claude Code trailer", () => {

    const singleFile = buildPrBody({ title: "x", explanation: "y", prompt: "z", fileCount: 1 })
    const multiFile = buildPrBody({ title: "x", explanation: "y", prompt: "z", fileCount: 3 })

    assert.match(singleFile, /1 tiedosto muutettu\./)
    assert.match(multiFile, /3 tiedostoa muutettu\./)

    assert.ok(!singleFile.includes("Co-Authored-By"))
    assert.ok(singleFile.includes("Dev Studio"))

})
