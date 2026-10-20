import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  inspectHearthwoodImage,
  resizeHearthwoodImage,
} from "./hearthwoodImageService.js"

// hearthwoodImageService.js shells out to the real
// hearthwoodImageTool.py (PIL-based). The input-validation tests below
// never reach the subprocess. The two "real tool" tests do invoke the
// actual Python process, against a disposable 1x1 PNG placed inside
// this worktree's own public/ folder (an allowed source dir for the
// tool) — never the real game project.

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

const FIXTURE_RELATIVE = "public/__spacemonkey-test-fixture.png"
const FIXTURE_ABSOLUTE = path.join(PROJECT_ROOT, FIXTURE_RELATIVE)

// Smallest possible valid 1x1 transparent PNG.
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
)

before(async () => {
  await fs.writeFile(FIXTURE_ABSOLUTE, ONE_PIXEL_PNG)
})

after(async () => {
  await fs.rm(FIXTURE_ABSOLUTE, { force: true })
})

test("inspecting without a source path rejects before any subprocess runs", async () => {
  await assert.rejects(() => inspectHearthwoodImage(undefined))
  await assert.rejects(() => inspectHearthwoodImage(""))
})

test("resizing to non-integer dimensions rejects before any subprocess runs", async () => {
  await assert.rejects(
    () =>
      resizeHearthwoodImage({
        source: FIXTURE_RELATIVE,
        width: 1.5,
        height: 10,
      }),
    /kokonaislukuja/,
  )
})

test("the real image tool reports correct dimensions for a genuine allowed image", async () => {
  const result = await inspectHearthwoodImage(FIXTURE_RELATIVE)

  assert.equal(result.success, true)
  assert.equal(result.width, 1)
  assert.equal(result.height, 1)
})

test("the real image tool refuses to inspect a path outside the allowed source folders", async () => {
  const outside = path.join(PROJECT_ROOT, "package.json")

  await assert.rejects(
    () => inspectHearthwoodImage(path.relative(PROJECT_ROOT, outside)),
  )
})
