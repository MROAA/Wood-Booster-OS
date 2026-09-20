import { test } from "node:test"

import assert from "node:assert/strict"

import { extractPythonPublicNames, isVacuousPythonTest } from "./verifyProposedPythonChange.js"



test("extractPythonPublicNames finds module-level def/class names", () => {

    const code =
        "def laske_summa(a, b):\n" +
        "    return a + b\n\n" +
        "class Widget:\n" +
        "    pass\n\n" +
        "def _private_helper():\n" +
        "    pass\n"

    const names = extractPythonPublicNames(code)

    assert.equal(names.has("laske_summa"), true)
    assert.equal(names.has("Widget"), true)
    assert.equal(names.has("_private_helper"), false)

})



test("extractPythonPublicNames ignores indented (nested) def/class - only module-level counts", () => {

    const code =
        "class Outer:\n" +
        "    def method(self):\n" +
        "        pass\n\n" +
        "def top_level():\n" +
        "    def nested():\n" +
        "        pass\n"

    const names = extractPythonPublicNames(code)

    assert.equal(names.has("Outer"), true)
    assert.equal(names.has("top_level"), true)
    assert.equal(names.has("method"), false)
    assert.equal(names.has("nested"), false)

})



test("extractPythonPublicNames returns an empty set for code with no def/class at all", () => {

    const names = extractPythonPublicNames("print('just a script, no functions')")

    assert.equal(names.size, 0)

})



test("isVacuousPythonTest: false when the test references an actual public name", () => {

    const proposedCode = "def laske_summa(a, b):\n    return a + b\n"

    const testCode =
        "from target import laske_summa\n" +
        "import unittest\n" +
        "class T(unittest.TestCase):\n" +
        "    def test_it(self): self.assertEqual(laske_summa(1, 1), 2)\n"

    assert.equal(isVacuousPythonTest({ testCode, proposedCode }), false)

})



test("isVacuousPythonTest: true when the test never references any public name", () => {

    const proposedCode = "def laske_summa(a, b):\n    return a + b\n"

    const testCode =
        "import unittest\n" +
        "class T(unittest.TestCase):\n" +
        "    def test_unrelated(self): self.assertEqual(1 + 1, 2)\n"

    assert.equal(isVacuousPythonTest({ testCode, proposedCode }), true)

})



test("isVacuousPythonTest: false (cannot evaluate) when the proposed code has no def/class at all", () => {

    const proposedCode = "print('side effect only script')"

    const testCode = "import unittest\nclass T(unittest.TestCase):\n    def test_whatever(self): pass\n"

    assert.equal(isVacuousPythonTest({ testCode, proposedCode }), false)

})
