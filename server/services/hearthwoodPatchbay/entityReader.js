/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * entityReader.js
 *
 * Read side of the Patchbay. The Express process cannot resolve
 * `vite`/`magic-string` (they live in the repo-root node_modules only),
 * so every parse runs in a spawned repo-root script and this module is
 * just a typed, cached wrapper around that subprocess.
 *
 * `execFile(process.execPath, [script, "--type", type])` - fixed
 * argument shape, never a shell string, with a timeout and a maxBuffer
 * cap (same safe envelope as runVerificationTestSkill.js).
 *
 * Results are cached per data file, keyed by the file's mtimeMs, so a
 * hot path (browsing the entity list) doesn't respawn Node on every
 * request but a real edit (which changes mtime) is picked up at once.
 */

import path from "node:path"
import fs from "node:fs"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import {
    PROJECT_ROOT,
    ENTITY_TYPES,
    dataFilePathFor,
    HEARTHWOOD_STYLE_FILES,
} from "./paths.js"

const execFileAsync = promisify(execFile)

const READ_ENTITIES_SCRIPT = path.join(
    PROJECT_ROOT,
    "scripts",
    "hearthwood-read-entities.mjs",
)

const READ_STYLES_SCRIPT = path.join(
    PROJECT_ROOT,
    "scripts",
    "hearthwood-read-styles.mjs",
)

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 8_000_000

const entityCache = new Map()

const styleCache = new Map()

function mtimeKey(absPath) {

    try {

        return String(fs.statSync(absPath).mtimeMs)

    } catch {

        return "missing"

    }
}

async function runScript(scriptPath, args, stdinPayload) {

    const child = execFileAsync(process.execPath, [scriptPath, ...args], {
        cwd: PROJECT_ROOT,
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
    })

    if (child.child && child.child.stdin) {

        if (stdinPayload !== undefined) {

            child.child.stdin.write(JSON.stringify(stdinPayload))

        }

        child.child.stdin.end()

    }

    let stdout = ""

    try {

        const result = await child

        stdout = result.stdout || ""

    } catch (error) {

        // The scripts print a JSON { error } to stdout and exit 1 on a
        // parse failure - prefer that structured message.
        stdout = error.stdout || ""

        if (!stdout) {

            throw new Error(
                `hearthwood script failed: ${error.message || error}`,
            )
        }
    }

    let parsed

    try {

        parsed = JSON.parse(stdout)

    } catch {

        throw new Error("hearthwood script produced non-JSON output")

    }

    if (parsed && parsed.error) {

        throw new Error(parsed.error)

    }

    return parsed
}

/**
 * listEntities(type) -> { type, file, exportName, entities: [...] }
 */
export async function listEntities(type) {

    if (!ENTITY_TYPES[type]) {

        throw new Error(`unknown entity type: ${type}`)

    }

    const relPath = dataFilePathFor(type)

    const absPath = path.join(PROJECT_ROOT, relPath)

    const key = `${type}:${mtimeKey(absPath)}`

    if (entityCache.has(key)) {

        return entityCache.get(key)

    }

    const result = await runScript(READ_ENTITIES_SCRIPT, ["--type", type])

    entityCache.set(key, result)

    // Keep the cache small - only the newest key per type matters.
    for (const existing of [...entityCache.keys()]) {

        if (existing.startsWith(`${type}:`) && existing !== key) {

            entityCache.delete(existing)

        }
    }

    return result
}

/**
 * getEntity(type, id) -> { type, id, name, fields, complexKeys, source }
 * `source` is the exact substring the entity occupies in its data file.
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
        fields: entity.fields,
        complexKeys: entity.complexKeys,
        identifierKeys: entity.identifierKeys,
        sourceRange: entity.sourceRange,
        source,
    }
}

/**
 * listStyleRules(file?) -> { file, rules: [{ selector, declarations }] }
 */
export async function listStyleRules(file = HEARTHWOOD_STYLE_FILES[0]) {

    const absPath = path.join(PROJECT_ROOT, file)

    const key = `${file}:${mtimeKey(absPath)}`

    if (styleCache.has(key)) {

        return styleCache.get(key)

    }

    const result = await runScript(READ_STYLES_SCRIPT, ["--file", file])

    styleCache.set(key, result)

    for (const existing of [...styleCache.keys()]) {

        if (existing.startsWith(`${file}:`) && existing !== key) {

            styleCache.delete(existing)

        }
    }

    return result
}

/**
 * getStyleRule(selector, prop, file?) -> the single matching declaration
 * record { selector, prop, value, valueRange } or null.
 */
export async function getStyleRule(
    selector,
    prop,
    file = HEARTHWOOD_STYLE_FILES[0],
) {

    const { rules } = await listStyleRules(file)

    const want = String(selector || "").replace(/\s+/g, " ").trim()

    for (const rule of rules) {

        if (rule.selector.replace(/\s+/g, " ").trim() !== want) {

            continue

        }

        const decl = rule.declarations.find(d => d.prop === prop)

        if (decl) {

            return { selector: rule.selector, ...decl }

        }
    }

    return null
}

export default { listEntities, getEntity, listStyleRules, getStyleRule }
