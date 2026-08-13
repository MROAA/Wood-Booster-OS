import { test } from "node:test"

import assert from "node:assert/strict"

import { parseGeneratedText } from "../../../../pythonCodeGenerator.js"



test("parses title and fenced python code block", () => {

    const text =
        "OTSIKKO: Tiedostojen nimeäminen pieniksi\n" +
        "KOODI:\n" +
        "```python\n" +
        "import os\nprint('hi')\n" +
        "```"

    const result = parseGeneratedText(text)

    assert.equal(result.title, "Tiedostojen nimeäminen pieniksi")

    assert.equal(result.code, "import os\nprint('hi')")

})



test("falls back to text after KOODI: when there is no fenced block", () => {

    const text = "OTSIKKO: Testi\nKOODI:\nprint('hi')"

    const result = parseGeneratedText(text)

    assert.equal(result.title, "Testi")

    assert.equal(result.code, "print('hi')")

})
