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

    const testFilePath = await writeFixtureTest(
        runId,
        "import test from \"node:test\"\n" +
        "test(\"never resolves\", () => new Promise(() => {}))\n",
    )

    const result = await runVerificationTestSkill.execute({
        runId,
        testFilePath,
        skipped: false,
        // 500ms riitti paikallisesti mutta osoittautui liian
        // niukaksi marginaaliksi hitaammalla/kuormitetummalla CI-
        // ajurilla (node --test:n oma käynnistys + sisäkkäisen
        // testiprosessin haarautuminen ehti viedä lähes koko ajan,
        // jolloin execFile:n killed-lippu ei asettunut luotettavasti
        // ennen 500ms:n umpeutumista) - havaittu ensimmäisessä
        // oikeassa GitHub Actions -ajossa.
        timeoutMsOverride: 3000,
    })

    console.log("DIAGNOSTIC runaway testOutput:", JSON.stringify(result.testOutput))

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "timeout")

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})
