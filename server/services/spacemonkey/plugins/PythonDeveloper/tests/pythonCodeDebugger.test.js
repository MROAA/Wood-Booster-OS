import { test } from "node:test"

import assert from "node:assert/strict"

import { parseDebugText } from "../../../../pythonCodeDebugger.js"



test("parses title, diagnosis, and fenced python code block", () => {

    const text =
        "OTSIKKO: Korjattu NameError\n" +
        "DIAGNOOSI: Muuttujaa hello ei ole määritelty ennen käyttöä.\n" +
        "KOODI:\n" +
        "```python\n" +
        "hello = 'hi'\nprint(hello)\n" +
        "```"

    const result = parseDebugText(text)

    assert.equal(result.title, "Korjattu NameError")

    assert.equal(
        result.diagnosis,
        "Muuttujaa hello ei ole määritelty ennen käyttöä.",
    )

    assert.equal(result.code, "hello = 'hi'\nprint(hello)")

})



test("falls back to text after KOODI: when there is no fenced block", () => {

    const text =
        "OTSIKKO: Testi\nDIAGNOOSI: Ei ongelmia.\nKOODI:\nprint('hi')"

    const result = parseDebugText(text)

    assert.equal(result.title, "Testi")

    assert.equal(result.diagnosis, "Ei ongelmia.")

    assert.equal(result.code, "print('hi')")

})



test("strips the file-start sentinel line and preserves a leading triple-quote docstring (the real bug found live)", () => {

    // Havaittu live-testissä: kun tiedosto alkaa bare """-docstringillä,
    // malli sekoitti sen koodilohkon omaan ```-rajaan ja jätti
    // avaavan """:n kokonaan pois - py_compile hylkäsi tuloksen aina.
    // "# TIEDOSTO ALKAA TÄSTÄ" -merkkirivi ratkaisee tämän antamalla
    // mallille erillisen, ei-kolmoislainausmerkki-rivin ankkuriksi.
    const text =
        "OTSIKKO: Korjattu KeyError\n" +
        "DIAGNOOSI: Avain puuttui sanakirjasta.\n" +
        "KOODI:\n" +
        "```python\n" +
        "# TIEDOSTO ALKAA TÄSTÄ\n" +
        '"""\nModuulin docstring\n"""\n' +
        "import json\n" +
        "```"

    const result = parseDebugText(text)

    assert.equal(
        result.code,
        '"""\nModuulin docstring\n"""\nimport json',
    )

})
