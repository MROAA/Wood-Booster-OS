import { test } from "node:test"

import assert from "node:assert/strict"

import { parseChangePlanText } from "../../../../changePlanGenerator.js"



test("parses a well-formed plan with mixed create/modify actions", () => {

    const text =
        "SUUNNITELMA:\n" +
        "- LUO: src/pages/NewPage.jsx | Uusi sivu jota pyyntö kuvaa\n" +
        "- MUOKKAA: src/App.jsx | Lisätään reitti\n" +
        "- MUOKKAA: src/components/layout/Sidebar.jsx | Lisätään linkki\n" +
        "SELITYS: Lisätään uusi sivu ja sen navigointi."

    const result = parseChangePlanText(text)

    assert.equal(result.files.length, 3)

    assert.deepEqual(result.files[0], {
        action: "create",
        filePath: "src/pages/NewPage.jsx",
        reason: "Uusi sivu jota pyyntö kuvaa",
    })

    assert.equal(result.files[1].action, "modify")

    assert.equal(result.files[2].filePath, "src/components/layout/Sidebar.jsx")

    assert.equal(result.explanation, "Lisätään uusi sivu ja sen navigointi.")

})



test("ignores lines that don't match the expected format", () => {

    const text =
        "Selvä, tässä on suunnitelma:\n" +
        "SUUNNITELMA:\n" +
        "- LUO: src/pages/NewPage.jsx | Uusi sivu\n" +
        "jotain ylimääräistä tekstiä tässä\n" +
        "SELITYS: Yksi tiedosto riittää."

    const result = parseChangePlanText(text)

    assert.equal(result.files.length, 1)

    assert.equal(result.files[0].filePath, "src/pages/NewPage.jsx")

})



test("returns an empty file list for text with no plan lines", () => {

    const result = parseChangePlanText("En ymmärtänyt pyyntöä.")

    assert.equal(result.files.length, 0)

})
