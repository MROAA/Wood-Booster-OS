import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

// listHearthwoodProjectFiles / findHearthwoodProjectFiles also read
// PROJECT_ROOT from the environment at import time, so they get the
// same disposable-fixture treatment as the Reliability Gate.

let listHearthwoodProjectFiles
let findHearthwoodProjectFiles
let FIXTURE_ROOT

async function writeFixtureFile(relativePath, content = "// fixture\n") {
  const absolute = path.join(FIXTURE_ROOT, relativePath)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, content)
}

before(async () => {
  FIXTURE_ROOT = await fs.mkdtemp(
    path.join(os.tmpdir(), "hearthwood-explorer-fixture-"),
  )

  await writeFixtureFile(
    "src/pages/HearthwoodAllowedPage.jsx",
    "export function HearthwoodAllowedPage() { return null }",
  )

  await writeFixtureFile(
    "src/pages/UnrelatedPage.jsx",
    "export function UnrelatedPage() { return null }",
  )

  await writeFixtureFile(
    "server/routes/hearthwoodAllowedRoute.js",
    "export function hearthwoodAllowedRoute() {}",
  )

  await writeFixtureFile(
    "server/routes/unrelatedRoute.js",
    "export function unrelatedRoute() {}",
  )

  await writeFixtureFile(
    "src/services/heartwood/manaSystem.js",
    "export const MANA_BASE = 10\nexport function regenMana() {}",
  )

  await writeFixtureFile(
    "src/services/heartwood/unrelatedThing.js",
    "export function unrelatedThing() {}",
  )

  await writeFixtureFile(
    "src/services/heartwood/notes.txt",
    "this is not source code",
  )

  await writeFixtureFile(
    "src/services/heartwood/node_modules/junk-package/index.js",
    "export function shouldNeverBeListed() {}",
  )

  process.env.HEARTHWOOD_PROJECT_ROOT = FIXTURE_ROOT

  ;({ listHearthwoodProjectFiles, findHearthwoodProjectFiles } =
    await import("./hearthwoodProjectExplorer.js"))
})

after(async () => {
  delete process.env.HEARTHWOOD_PROJECT_ROOT
  await fs.rm(FIXTURE_ROOT, { recursive: true, force: true })
})

test("src/pages files are only listed when their name mentions hearthwood/heartwood", async () => {
  const files = await listHearthwoodProjectFiles()

  assert.ok(files.includes("src/pages/HearthwoodAllowedPage.jsx"))
  assert.ok(!files.includes("src/pages/UnrelatedPage.jsx"))
})

test("server/routes files are only listed when their name mentions hearthwood/heartwood", async () => {
  const files = await listHearthwoodProjectFiles()

  assert.ok(files.includes("server/routes/hearthwoodAllowedRoute.js"))
  assert.ok(!files.includes("server/routes/unrelatedRoute.js"))
})

test("files inside src/services/heartwood are listed regardless of file name", async () => {
  const files = await listHearthwoodProjectFiles()

  assert.ok(files.includes("src/services/heartwood/manaSystem.js"))
  assert.ok(files.includes("src/services/heartwood/unrelatedThing.js"))
})

test("non source-code extensions are excluded even inside an allowed folder", async () => {
  const files = await listHearthwoodProjectFiles()

  assert.ok(!files.includes("src/services/heartwood/notes.txt"))
})

test("node_modules is never scanned, even nested inside an allowed folder", async () => {
  const files = await listHearthwoodProjectFiles()

  assert.ok(
    !files.some(file => file.includes("node_modules")),
  )
})

test("findHearthwoodProjectFiles ranks a topically relevant file above an unrelated one", async () => {
  const result = await findHearthwoodProjectFiles(
    "Selvitä mana-järjestelmän toiminta.",
    5,
  )

  const paths = result.matches.map(match => match.filePath)

  assert.ok(paths.includes("src/services/heartwood/manaSystem.js"))
  assert.equal(paths[0], "src/services/heartwood/manaSystem.js")
})
