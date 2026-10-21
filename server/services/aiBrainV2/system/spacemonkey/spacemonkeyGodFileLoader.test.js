import { test } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { loadGodFiles } from "./spacemonkeyGodFileLoader.js"

const here = path.dirname(fileURLToPath(import.meta.url))

test("godfiles are read from next to the loader, not from a fixed checkout path", async () => {
  const originalLog = console.log
  const logged = []
  console.log = (...args) => logged.push(args)

  let result

  try {
    result = await loadGodFiles()
  } finally {
    console.log = originalLog
  }

  const directoryLine = logged.find(args => args[0] === "GODFILE DIRECTORY:")

  assert.equal(directoryLine[1], path.join(here, "godfiles"))
  assert.deepEqual(
    result.godfiles.map(file => file.file),
    [
      "01_IDENTITY_GODFILE.md",
      "02_PERSONALITY_GODFILE.md",
      "03_VALUES_GODFILE.md",
      "04_COMMUNICATION_GODFILE.md",
      "05_DECISION_GODFILE.md",
    ],
  )

  for (const file of result.godfiles) {
    assert.ok(file.data?.content?.length > 100, file.file)
  }
})
