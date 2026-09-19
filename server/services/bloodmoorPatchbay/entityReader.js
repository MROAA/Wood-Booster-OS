/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * entityReader.js
 *
 * Read side. Bloodmoor's own `vite`/`magic-string` live only in ITS
 * node_modules, not this Express process's - so every parse runs in a
 * spawned subprocess, `tools/patchbay/read-entities.mjs`, invoked with
 * `cwd: PROJECT_ROOT` (Bloodmoor's own directory) so that subprocess
 * resolves its own dependencies correctly.
 *
 * Results are cached per data file, keyed by the file's mtimeMs.
 */

import path from "node:path"
import fs from "node:fs"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT, ENTITY_TYPES, dataFilePathFor } from "./paths.js"

const execFileAsync = promisify(execFile)

const READ_ENTITIES_SCRIPT = path.join(PROJECT_ROOT, "tools", "patchbay", "read-entities.mjs")

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 8_000_000

const entityCache = new Map()

function mtimeKey(absPath) {

    try {

        return String(fs.statSync(absPath).mtimeMs)

    } catch {

        return "missing"

    }
}

async function runScript(scriptPath, payload) {

    const child = execFileAsync(process.execPath, [scriptPath], {
        cwd: PROJECT_ROOT,
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
    })

    if (child.child && child.child.stdin) {

        child.child.stdin.write(JSON.stringify(payload))
        child.child.stdin.end()

    }

    let stdout = ""

    try {

        const result = await child

        stdout = result.stdout || ""

    } catch (error) {

        stdout = error.stdout || ""

        if (!stdout) {

            throw new Error(`bloodmoor patchbay script failed: ${error.message || error}`)

        }
    }

    let parsed

    try {

        parsed = JSON.parse(stdout)

    } catch {

        throw new Error("bloodmoor patchbay script produced non-JSON output")

    }

    if (parsed && parsed.error) {

        throw new Error(parsed.error)

    }

    return parsed
}

/**
 * listEntities(type) -> { file, exportName, kind, entities: [...] }
 */
export async function listEntities(type) {

    const entry = ENTITY_TYPES[type]

    if (!entry) {

        throw new Error(`unknown entity type: ${type}`)

    }

    const relPath = dataFilePathFor(type)

    const absPath = path.join(PROJECT_ROOT, relPath)

    const key = `${type}:${mtimeKey(absPath)}`

    if (entityCache.has(key)) {

        return entityCache.get(key)

    }

    const result = await runScript(READ_ENTITIES_SCRIPT, {
        file: relPath,
        exportName: entry.exportName,
        kind: entry.kind,
    })

    entityCache.set(key, result)

    for (const existing of [...entityCache.keys()]) {

        if (existing.startsWith(`${type}:`) && existing !== key) {

            entityCache.delete(existing)

        }
    }

    return result
}

/**
 * getEntity(type, id) -> { type, id, name, fields, complexKeys, source }
 */
export async function getEntity(type, id) {

    const list = await listEntities(type)

    const entity = list.entities.find(e => String(e.id) === String(id))

    if (!entity) {

        return null

    }

    let source = null

    try {

        const absPath = path.join(PROJECT_ROOT, list.file)

        const fileText = fs.readFileSync(absPath, "utf8")

        const [start, end] = entity.sourceRange || []

        if (Number.isInteger(start) && Number.isInteger(end)) {

            source = fileText.slice(start, end)

        }

    } catch {

        source = null

    }

    return {
        type,
        id: entity.id,
        name: entity.name,
        file: list.file,
        exportName: list.exportName,
        kind: list.kind,
        fields: entity.fields,
        complexKeys: entity.complexKeys,
        identifierKeys: entity.identifierKeys,
        sourceRange: entity.sourceRange,
        source,
    }
}

export default { listEntities, getEntity }
