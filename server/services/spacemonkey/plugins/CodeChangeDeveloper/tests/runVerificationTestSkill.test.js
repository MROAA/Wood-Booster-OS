import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import path from "node:path"

import crypto from "node:crypto"

import runVerificationTestSkill from "../skills/runVerificationTestSkill.js"

import { resolveVerificationRunDir } from "../skills/verificationSandbox.js"



async function writeFixtureTest(runId, testSource) {

    const runDir = resolveVerificationRunDir(runId)

    await fs.mkdir(runDir, { recursive: true })

    const testFilePath = path.join(runDir, "target.test.mjs")

    await fs.writeFile(testFilePath, testSource, "utf8")

    return testFilePath

}



test("short-circuits when skipped is true, never touches the filesystem", async () => {

    const result = await runVerificationTestSkill.execute({
        skipped: true,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "skipped")

})



test("rejects a call missing runId/testFilePath", async () => {

    const result = await runVerificationTestSkill.execute({})

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_verification_run")

})



test("passing test: reports passed and cleans up the scratch dir", async () => {

    const runId = crypto.randomUUID()

    const testFilePath = await writeFixtureTest(
        runId,
        "import test from \"node:test\"\n" +
        "import assert from \"node:assert/strict\"\n" +
        "test(\"trivially true\", () => { assert.equal(1 + 1, 2) })\n",
    )

    const result = await runVerificationTestSkill.execute({
        runId,
        testFilePath,
        skipped: false,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "passed")

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})



test("failing test: reports failed with output, still cleans up", async () => {

    const runId = crypto.randomUUID()

    const testFilePath = await writeFixtureTest(
        runId,
        "import test from \"node:test\"\n" +
        "import assert from \"node:assert/strict\"\n" +
        "test(\"deliberately false\", () => { assert.equal(1 + 1, 3) })\n",
    )

    const result = await runVerificationTestSkill.execute({
        runId,
        testFilePath,
        skipped: false,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "failed")

    assert.ok(result.testOutput.length > 0)

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})



test("runaway test: killed at the timeout, reports timeout, still cleans up", async () => {

    const runId = crypto.randomUUID()

    // Pelkkä "new Promise(() => {})" (ei mitään pitämässä
    // tapahtumasilmukkaa käynnissä) EI riitä tuottamaan todellista
    // jumiutumista luotettavasti kaikilla Node-versioilla - Node
    // 20:n testiajuri tunnistaa tällaisen "roikkuvan" promisen
    // nopeasti (~50ms, virhe "Promise resolution is still pending
    // but the event loop has already resolved") ja peruu testin itse
    // ennen kuin execFile:n oma timeout ehtisi koskaan laueta, jolloin
    // skilli näkee normaalin epäonnistumisen eikä killed-tilaa -
    // havaittu ensimmäisissä oikeissa GitHub Actions -ajoissa (Node
    // 20.20.2), ei toistunut paikallisesti (Node 26). Oikea, aidosti
    // pitkäkestoinen ajastin pitää tapahtumasilmukan kiireisenä niin
    // ettei Node voi päätellä sen olevan koskaan ratkeamaton, joten
    // execFile:n oma timeout ehtii aina laueta ensin.
    const testFilePath = await writeFixtureTest(
        runId,
        "import test from \"node:test\"\n" +
        "test(\"never resolves\", () => new Promise(resolve => setTimeout(resolve, 60000)))\n",
    )

    const result = await runVerificationTestSkill.execute({
        runId,
        testFilePath,
        skipped: false,
        timeoutMsOverride: 3000,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "timeout")

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})
