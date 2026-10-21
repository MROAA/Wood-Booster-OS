/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Import Graph
 *
 * Mitkä tiedostot palvelin oikeasti lataa: kulkee staattiset ja
 * kirjaimelliset dynaamiset importit (import "./x", import("./x"),
 * export ... from "./x") annetuista lähtötiedostoista alkaen. Vain
 * suhteelliset polut seurataan; paketit (express, node:fs) eivät ole
 * projektin tiedostoja. Lukee tiedostoja, ei suorita niitä.
 *
 * Rajoitus: muuttujasta muodostettua dynaamista importia ei voi
 * seurata - tällainen tiedosto näkyy "ei ladattu" -tilassa, joten
 * tulos on alaraja, ei yläraja.
 */

import fs from "node:fs/promises"

import path from "node:path"

import { isProtectedPath } from "../security/protectedPaths.js"

const SPECIFIER_PATTERNS = [
    /(?:^|[\s;])(?:import|export)\s[^'"`;]*?\sfrom\s*["']([^"']+)["']/g,
    /(?:^|[\s;])import\s*["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
]

const RESOLVE_SUFFIXES = ["", ".js", ".mjs", ".jsx", "/index.js"]

const MAX_FILE_BYTES = 1000000

function specifiersOf(source) {

    const found = new Set()

    for (const pattern of SPECIFIER_PATTERNS) {
        pattern.lastIndex = 0

        let match

        while ((match = pattern.exec(source)) !== null) {
            found.add(match[1])
        }
    }

    return [...found].filter(specifier => specifier.startsWith("."))

}

async function resolveFile(fromFile, specifier, root) {

    const base = path.resolve(path.dirname(fromFile), specifier)

    for (const suffix of RESOLVE_SUFFIXES) {
        const candidate = base + suffix

        if (!candidate.startsWith(root + path.sep)) {
            return null
        }

        try {
            const stat = await fs.stat(candidate)

            if (stat.isFile()) {
                return candidate
            }
        } catch {
            // seuraava pääte
        }
    }

    return null

}

/**
 * Palauttaa Setin projektijuuren suhteellisia polkuja, jotka ovat
 * saavutettavissa entries-tiedostoista.
 */
export async function buildImportGraph({ root, entries }) {

    const absoluteRoot = path.resolve(root)

    const reached = new Set()

    const queue = entries.map(entry => path.resolve(absoluteRoot, entry))

    while (queue.length > 0) {
        const file = queue.shift()

        const relative = path.relative(absoluteRoot, file)

        if (reached.has(relative) || isProtectedPath(relative)) {
            continue
        }

        let source

        try {
            const stat = await fs.stat(file)

            if (!stat.isFile() || stat.size > MAX_FILE_BYTES) {
                continue
            }

            source = await fs.readFile(file, "utf8")
        } catch {
            continue
        }

        reached.add(relative)

        for (const specifier of specifiersOf(source)) {
            const resolved = await resolveFile(file, specifier, absoluteRoot)

            if (resolved) {
                queue.push(resolved)
            }
        }
    }

    return reached

}

export { specifiersOf }
