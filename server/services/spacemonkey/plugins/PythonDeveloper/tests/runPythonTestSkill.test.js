import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs/promises"

import path from "node:path"

import crypto from "node:crypto"

import runPythonTestSkill from "../skills/runPythonTestSkill.js"

import { resolveVerificationRunDir } from "../../CodeChangeDeveloper/skills/verificationSandbox.js"



async function writeFixtureTest(runId, testSource) {

    const runDir = resolveVerificationRunDir(runId)

    await fs.mkdir(runDir, { recursive: true })

    const testFilePath = path.join(runDir, "target_test.py")

    await fs.writeFile(testFilePath, testSource, "utf8")

    return testFilePath

}



test("short-circuits when skipped is true, never touches the filesystem", async () => {

    const result = await runPythonTestSkill.execute({
        skipped: true,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "skipped")

})



test("rejects a call missing runId/testFilePath", async () => {

    const result = await runPythonTestSkill.execute({})

    assert.equal(result.success, false)

    assert.equal(result.code, "missing_verification_run")

})



test("passing test: reports passed and cleans up the scratch dir", async () => {

    const runId = crypto.randomUUID()

    const testFilePath = await writeFixtureTest(
        runId,
        "import unittest\n\n" +
        "class TrivialTest(unittest.TestCase):\n" +
        "    def test_trivially_true(self):\n" +
        "        self.assertEqual(1 + 1, 2)\n\n" +
        "if __name__ == \"__main__\":\n" +
        "    unittest.main()\n",
    )

    const result = await runPythonTestSkill.execute({
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
        "import unittest\n\n" +
        "class DeliberatelyFalseTest(unittest.TestCase):\n" +
        "    def test_deliberately_false(self):\n" +
        "        self.assertEqual(1 + 1, 3)\n\n" +
        "if __name__ == \"__main__\":\n" +
        "    unittest.main()\n",
    )

    const result = await runPythonTestSkill.execute({
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
        "import unittest\nimport time\n\n" +
        "class NeverResolvesTest(unittest.TestCase):\n" +
        "    def test_never_resolves(self):\n" +
        "        time.sleep(10)\n\n" +
        "if __name__ == \"__main__\":\n" +
        "    unittest.main()\n",
    )

    const result = await runPythonTestSkill.execute({
        runId,
        testFilePath,
        skipped: false,
        timeoutMsOverride: 500,
    })

    assert.equal(result.success, true)

    assert.equal(result.testStatus, "timeout")

    const runDir = resolveVerificationRunDir(runId)

    await assert.rejects(fs.access(runDir))

})
