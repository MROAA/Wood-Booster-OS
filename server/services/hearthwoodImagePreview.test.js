import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { serveHearthwoodImagePreview } from "./hearthwoodImagePreview.js"

// Unlike hearthwoodProjectRoot.js, this module computes its own
// PROJECT_ROOT directly from import.meta.url and ignores
// HEARTHWOOD_PROJECT_ROOT. That means these tests write real files
// under THIS worktree's own .hearthwood-media/previews/ folder (never
// the real game project, and never outside this checkout), and clean
// up everything they create.

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

const PREVIEW_DIR = path.join(
  PROJECT_ROOT,
  ".hearthwood-media",
  "previews",
)

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const VALID_PNG = Buffer.concat([
  PNG_SIGNATURE,
  Buffer.from("fixture-not-a-real-png-body"),
])

const VALID_NAME = "studio-room-aaaaaaaaaaaa.png"
const FAKE_PNG_NAME = "studio-room-bbbbbbbbbbbb.png"
const OUTSIDE_LINK_NAME = "studio-room-cccccccccccc.png"

let outsideFile

function fakeRequest(filename) {
  return { params: { filename } }
}

function fakeResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      return this
    },
    setHeader(key, value) {
      this.headers[key] = value
    },
  }
}

before(async () => {
  await fs.mkdir(PREVIEW_DIR, { recursive: true })

  await fs.writeFile(
    path.join(PREVIEW_DIR, VALID_NAME),
    VALID_PNG,
  )

  // Correct name pattern, correct location, but not actually a PNG.
  await fs.writeFile(
    path.join(PREVIEW_DIR, FAKE_PNG_NAME),
    "this is not a png",
  )

  outsideFile = path.join(PROJECT_ROOT, ".hearthwood-media", "outside-the-preview-dir.png")
  await fs.writeFile(outsideFile, VALID_PNG)

  await fs.symlink(
    outsideFile,
    path.join(PREVIEW_DIR, OUTSIDE_LINK_NAME),
  )
})

after(async () => {
  await fs.rm(path.join(PREVIEW_DIR, VALID_NAME), { force: true })
  await fs.rm(path.join(PREVIEW_DIR, FAKE_PNG_NAME), { force: true })
  await fs.rm(path.join(PREVIEW_DIR, OUTSIDE_LINK_NAME), { force: true })
  await fs.rm(outsideFile, { force: true })
})

test("a correctly named, correctly located PNG is served with the right headers", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(fakeRequest(VALID_NAME), response)

  assert.equal(response.statusCode, 200)
  assert.equal(response.headers["Content-Type"], "image/png")
  assert.ok(Buffer.from(response.body).subarray(0, 8).equals(PNG_SIGNATURE))
})

test("a filename that does not match the safe pattern is rejected before touching disk", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(
    fakeRequest("not-a-valid-name.png"),
    response,
  )

  assert.equal(response.statusCode, 400)
})

test("a path-traversal filename is rejected by the safe-name pattern", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(
    fakeRequest("../../../etc/passwd-aaaaaaaaaaaa.png"),
    response,
  )

  assert.equal(response.statusCode, 400)
})

test("a well-formed name that does not exist on disk is a 404, not a 500", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(
    fakeRequest("missing-file-dddddddddddd.png"),
    response,
  )

  assert.equal(response.statusCode, 404)
})

test("a symlink inside the preview folder that points outside it is rejected", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(
    fakeRequest(OUTSIDE_LINK_NAME),
    response,
  )

  assert.equal(response.statusCode, 403)
})

test("a file with the right name and location but the wrong magic bytes is rejected", async () => {
  const response = fakeResponse()
  await serveHearthwoodImagePreview(
    fakeRequest(FAKE_PNG_NAME),
    response,
  )

  assert.equal(response.statusCode, 415)
})
