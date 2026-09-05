/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * imageUpload.js
 *
 * Saves an uploaded image straight to src/assets/heartwood/<type>/ -
 * deliberately OUTSIDE the snapshot/backup/revert pipeline
 * (snapshot.js) that guards edits to the data files themselves. This
 * only ever adds a new, previously-nonexistent asset file; nothing
 * live is overwritten, and an unused upload (previewed but never
 * applied) is inert clutter, not a broken state - the actual risk
 * (the code that references it) still goes through the normal
 * preview/apply/revert cycle via the "setImportedImage" edit op.
 *
 *   saveUploadedImage({ type, entityId, originalName, buffer })
 *     -> { relativePath, importPath, filename }
 */

import fs from "node:fs"
import path from "node:path"

import { PROJECT_ROOT, ENTITY_TYPES, dataFilePathFor } from "./paths.js"

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])

const ASSETS_DIR = "src/assets/heartwood"

function httpError(message, status) {

    const error = new Error(message)

    error.httpStatus = status

    return error

}

function slugify(text) {

    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

}

export function saveUploadedImage({ type, entityId, originalName, buffer }) {

    if (!ENTITY_TYPES[type]) {

        throw httpError(`tuntematon tyyppi "${type}"`, 400)

    }

    if (!entityId) {

        throw httpError("entityId puuttuu", 400)

    }

    if (!buffer || buffer.length === 0) {

        throw httpError("tiedosto on tyhjä", 400)

    }

    const ext = path.extname(String(originalName || "")).toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(ext)) {

        throw httpError(
            `tiedostotyyppi "${ext || "?"}" ei ole tuettu (jpg/jpeg/png/webp/gif)`,
            400,
        )
    }

    const subdir = path.join(ASSETS_DIR, type)

    const absDir = path.join(PROJECT_ROOT, subdir)

    fs.mkdirSync(absDir, { recursive: true })

    const slug = slugify(entityId) || "kuva"

    let filename = `${slug}${ext}`

    let absPath = path.join(absDir, filename)

    let counter = 2

    while (fs.existsSync(absPath)) {

        filename = `${slug}-${counter}${ext}`
        absPath = path.join(absDir, filename)
        counter += 1

    }

    fs.writeFileSync(absPath, buffer)

    const relativePath = path.join(subdir, filename).split(path.sep).join("/")

    const dataFileDir = path.dirname(dataFilePathFor(type))

    let importPath = path.relative(dataFileDir, relativePath).split(path.sep).join("/")

    if (!importPath.startsWith(".")) {

        importPath = `./${importPath}`

    }

    return { relativePath, importPath, filename }

}

export default { saveUploadedImage }
