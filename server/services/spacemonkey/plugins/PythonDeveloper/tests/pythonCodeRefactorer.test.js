import { test } from "node:test"

import assert from "node:assert/strict"

import { parseRefactoredText } from "../../../../pythonCodeRefactorer.js"



test("parses title, explanation, and fenced python code block", () => {

    const text =
        "OTSIKKO: Siistitty tiedostonkäsittely\n" +
        "SELITYS: Nimettiin muuttujat selkeämmin ja lisättiin docstring.\n" +
        "KOODI:\n" +
        "```python\n" +
        "import os\nprint('hi')\n" +
        "```"

    const result = parseRefactoredText(text)

    assert.equal(result.title, "Siistitty tiedostonkäsittely")

    assert.equal(
        result.explanation,
        "Nimettiin muuttujat selkeämmin ja lisättiin docstring.",
    )

    assert.equal(result.code, "import os\nprint('hi')")

})



test("falls back to text after KOODI: when there is no fenced block", () => {

    const text = "OTSIKKO: Testi\nSELITYS: Ei muutoksia.\nKOODI:\nprint('hi')"

    const result = parseRefactoredText(text)

    assert.equal(result.title, "Testi")

    assert.equal(result.explanation, "Ei muutoksia.")

    assert.equal(result.code, "print('hi')")

})
