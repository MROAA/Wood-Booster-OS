import { test } from "node:test"

import assert from "node:assert/strict"

import { isValidPythonSyntax } from "../../../../pythonSyntaxValidator.js"



test("accepts valid Python", async () => {

    const result = await isValidPythonSyntax(
        "def hello():\n    print('hi')\n",
    )

    assert.equal(result, true)

})



test("rejects an unterminated triple-quoted string (the real bug found live)", async () => {

    const result = await isValidPythonSyntax(
        "ConfigLoader Module\n\nLataa konfiguraatiot.\n\"\"\"\n\nimport json\n",
    )

    assert.equal(result, false)

})



test("rejects empty input", async () => {

    assert.equal(await isValidPythonSyntax(""), false)

    assert.equal(await isValidPythonSyntax("   "), false)

})



test("rejects obviously broken syntax", async () => {

    const result = await isValidPythonSyntax("def broken(:\n    pass")

    assert.equal(result, false)

})
