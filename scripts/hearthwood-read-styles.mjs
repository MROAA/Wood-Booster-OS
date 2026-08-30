/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * scripts/hearthwood-read-styles.mjs
 *
 * Pure stdin/argv-JSON -> stdout-JSON. NEVER writes disk.
 *
 * Parses a Hearthwood stylesheet with `postcss` (repo-root
 * node_modules) and lists every rule as
 * { selector, declarations: [ { prop, value, valueRange: [start, end] } ] }.
 *
 * postcss exposes real absolute character offsets on
 * `decl.source.start.offset` / `decl.source.end.offset` (verified on this
 * repo's heartwood.css - the numbers are byte-ish string offsets, not
 * line/col only). `start.offset` points at the first char of the
 * property; the value's own range is derived deterministically as
 *   valueStart = decl.source.start.offset
 *              + decl.prop.length
 *              + decl.raws.between.length      (the ":" + any whitespace)
 *   valueEnd   = valueStart + (decl.raws.value?.raw ?? decl.value).length
 * so the apply script can splice ONLY the declaration's value text and
 * leave the property, the colon, whitespace, `!important` and the
 * trailing `;` byte-identical.
 *
 * Usage:
 *   node scripts/hearthwood-read-styles.mjs
 *   echo '{"file":"src/components/heartwood/heartwood.css"}' | node ...
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import postcss from "postcss"

import { PROJECT_ROOT } from "../server/services/hearthwoodPatchbay/paths.js"

const DEFAULT_FILE = "src/components/heartwood/heartwood.css"

function readStdin() {

    try {

        const raw = fs.readFileSync(0, "utf8").trim()

        return raw ? JSON.parse(raw) : {}

    } catch {

        return {}

    }
}

function parseArgv(argv) {

    const out = {}

    for (let i = 0; i < argv.length; i += 1) {

        if (argv[i] === "--file") {

            out.file = argv[i + 1]
            i += 1

        }
    }

    return out
}

/**
 * Compute a declaration's value range as absolute source offsets.
 * Returns [start, end] or null if postcss gave no usable offset.
 */
export function declValueRange(decl) {

    const start = decl.source
        && decl.source.start
        && typeof decl.source.start.offset === "number"
        ? decl.source.start.offset
        : null

    if (start == null) {

        return null

    }

    const between = typeof decl.raws.between === "string"
        ? decl.raws.between
        : ": "

    const rawValue = decl.raws.value && typeof decl.raws.value.raw === "string"
        ? decl.raws.value.raw
        : decl.value

    const valueStart = start + decl.prop.length + between.length

    const valueEnd = valueStart + rawValue.length

    return [valueStart, valueEnd]
}

export function readStyles(input) {

    const relPath = input.file
        ? String(input.file).replace(/^[/\\]+/, "")
        : DEFAULT_FILE

    const absPath = path.join(PROJECT_ROOT, relPath)

    const source = fs.readFileSync(absPath, "utf8")

    const root = postcss.parse(source, { from: absPath })

    const rules = []

    root.walkRules(rule => {

        const declarations = []

        rule.walkDecls(decl => {

            const range = declValueRange(decl)

            declarations.push({
                prop: decl.prop,
                value: decl.value,
                important: Boolean(decl.important),
                valueRange: range,
            })
        })

        rules.push({
            selector: rule.selector,
            declarations,
        })
    })

    return {
        file: relPath,
        rules,
    }
}

function isMain() {

    const invoked = process.argv[1]

    if (!invoked) {

        return false

    }

    return path.resolve(invoked) === path.resolve(new URL(import.meta.url).pathname)
}

if (isMain()) {

    try {

        const input = { ...readStdin(), ...parseArgv(process.argv.slice(2)) }

        process.stdout.write(JSON.stringify(readStyles(input)))
    } catch (error) {

        process.stdout.write(JSON.stringify({ error: String(error && error.message || error) }))

        process.exitCode = 1

    }
}
