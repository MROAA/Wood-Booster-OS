/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * System Atlas (Project Atlas, Sprint 2)
 *
 * Mitä Wood-Booster HQ:ssa on rakennettu - laskettuna todisteista,
 * ei kirjoitettuna käsin. hqSystems.js kertoo mistä katsoa; tämä
 * tiedosto päättelee tilan:
 *
 *   implemented     koodi on olemassa, palvelin tai sovellus lataa sen
 *                   (tai muu todiste kytkennästä), ja se on vakaassa
 *                   haarassa
 *   in-development  koodi on vain tässä kehityshaarassa tai muissa
 *                   paikallisissa haaroissa
 *   planned         ei koodia, mutta suunnitelmadokumentti on repossa
 *   deprecated      merkitty vanhentuneeksi
 *   unknown         todisteet eivät riitä (osa koodista puuttuu, koodia
 *                   ei ladata, tai toteutusta ei tunneta)
 *
 * "Verified" (testattu) annetaan vain ajetusta testistä. Atlas ei aja
 * testejä, joten se kertoo vain mitä testitiedostoja löytyy.
 *
 * Kaikki git-kyselyt ovat vain lukevia. Tiedostojen sisältöä luetaan
 * vain import-graafia ja "contains"-todisteita varten, eikä koskaan
 * suojatuista poluista.
 */

import fs from "node:fs/promises"

import path from "node:path"

import { buildImportGraph } from "./importGraph.js"

import {
    existingRefPaths,
    gitStamp,
    localBranches,
    resolveRef,
    uncommittedPaths,
} from "./git.js"

import HQ_SYSTEMS from "./hqSystems.js"

import { isProtectedPath } from "../security/protectedPaths.js"

const SERVER_ENTRY = "server/index.js"

const APP_ENTRY = "src/main.jsx"

const STABLE_REFS = ["hearthwood-stable", "main"]

const MAX_BRANCHES_LISTED = 3

const TEST_FILE_PATTERN = /\.test\.(m?js|jsx)$/

const STATUSES = ["implemented", "in-development", "planned", "deprecated", "unknown"]

function isSafeRelativePath(value) {

    return typeof value === "string" &&
        value.length > 0 &&
        !path.isAbsolute(value) &&
        !value.split(/[\\/]/).includes("..") &&
        !isProtectedPath(value)

}

/**
 * Luettelon kohdat joissa on vaarallinen tai suojattu polku hylätään.
 */
export function validateSystems(systems) {

    const valid = []

    const rejected = []

    for (const system of systems) {
        const paths = [
            ...(system.code || []),
            ...(system.docs || []),
            ...(system.contains || []).map(item => item.file),
        ]

        if (!system.id || !system.name || !paths.every(isSafeRelativePath)) {
            rejected.push(system.id || "(no id)")
            continue
        }

        valid.push(system)
    }

    return { valid, rejected }

}

async function statOf(root, relative) {

    try {
        return await fs.stat(path.join(root, relative))
    } catch {
        return null
    }

}

async function findTests(root, relative, stat) {

    if (!stat) {
        return []
    }

    if (stat.isFile()) {
        // Testi jonka nimi alkaa tiedoston nimellä (agentChat.hq.test.js,
        // agentRuntime.test.js), samassa hakemistossa tai lähimmässä
        // tests-kansiossa.
        const parsed = path.parse(relative)

        const base = parsed.name.toLowerCase() + "."

        const directories = [
            parsed.dir,
            path.join(parsed.dir, "tests"),
            path.join(path.dirname(parsed.dir), "tests"),
        ]

        const found = []

        for (const directory of directories) {
            let entries = []

            try {
                entries = await fs.readdir(path.join(root, directory))
            } catch {
                continue
            }

            for (const name of entries) {
                if (TEST_FILE_PATTERN.test(name) && name.toLowerCase().startsWith(base)) {
                    found.push(path.join(directory, name))
                }
            }
        }

        return found
    }

    const found = []

    async function walk(directory, depth) {
        if (depth > 4 || isProtectedPath(directory)) {
            return
        }

        let entries

        try {
            entries = await fs.readdir(path.join(root, directory), { withFileTypes: true })
        } catch {
            return
        }

        for (const entry of entries) {
            const child = path.join(directory, entry.name)

            if (entry.isDirectory()) {
                await walk(child, depth + 1)
            } else if (TEST_FILE_PATTERN.test(entry.name)) {
                found.push(child)
            }
        }
    }

    await walk(relative, 0)

    return found

}

function isLoaded(graphs, relative, stat) {

    if (!stat) {
        return false
    }

    if (stat.isFile()) {
        return graphs.some(graph => graph.has(relative))
    }

    const prefix = relative + path.sep

    return graphs.some(graph => [...graph].some(file => file.startsWith(prefix)))

}

async function containsAll(root, checks = []) {

    if (checks.length === 0) {
        return null
    }

    for (const check of checks) {
        try {
            const text = await fs.readFile(path.join(root, check.file), "utf8")

            if (!text.includes(check.text)) {
                return false
            }
        } catch {
            return false
        }
    }

    return true

}

/**
 * Kokoaa HQ:n Atlasin annetusta projektijuuresta. Kaikki todisteet
 * leimataan haaralla ja commitilla.
 */
export async function buildSystemAtlas({
    root,
    systems = HQ_SYSTEMS,
    stableRefs = STABLE_REFS,
} = {}) {

    const absoluteRoot = path.resolve(root)

    const { valid, rejected } = validateSystems(systems)

    const [stamp, serverGraph, appGraph, dirty, branches] = await Promise.all([
        gitStamp(absoluteRoot),
        buildImportGraph({ root: absoluteRoot, entries: [SERVER_ENTRY] }),
        buildImportGraph({ root: absoluteRoot, entries: [APP_ENTRY] }),
        uncommittedPaths(absoluteRoot),
        localBranches(absoluteRoot),
    ])

    let stableRef = null

    let stableCommit = null

    for (const ref of stableRefs) {
        stableCommit = await resolveRef(absoluteRoot, ref)

        if (stableCommit) {
            stableRef = ref
            break
        }
    }

    const onStableBranch = stamp.branch && stamp.branch === stableRef

    const graphs = [serverGraph, appGraph]

    const results = []

    // Kerätään ensin kaikki git-tarkistukset kahteen erään.
    const evidence = []

    for (const system of valid) {
        const code = []

        for (const relative of system.code || []) {
            const stat = await statOf(absoluteRoot, relative)

            code.push({
                path: relative,
                exists: Boolean(stat),
                loaded: isLoaded(graphs, relative, stat),
                tests: await findTests(absoluteRoot, relative, stat),
            })
        }

        const docs = []

        for (const relative of system.docs || []) {
            docs.push({ path: relative, exists: Boolean(await statOf(absoluteRoot, relative)) })
        }

        evidence.push({
            system,
            code,
            docs,
            contains: await containsAll(absoluteRoot, system.contains),
        })
    }

    const stablePairs = stableRef && !onStableBranch
        ? evidence.flatMap(item =>
            item.code.filter(entry => entry.exists).map(entry => `${stableRef}:${entry.path}`),
        )
        : []

    const otherBranches = branches.filter(name => name !== stamp.branch && name !== stableRef)

    const missingPrimary = evidence
        .filter(item => item.code.length > 0 && item.code.every(entry => !entry.exists))
        .map(item => item.code[0].path)

    const branchPairs = otherBranches.flatMap(name =>
        missingPrimary.map(relative => `${name}:${relative}`),
    )

    const [onStable, inBranches] = await Promise.all([
        existingRefPaths(absoluteRoot, stablePairs),
        existingRefPaths(absoluteRoot, branchPairs),
    ])

    for (const { system, code, docs, contains } of evidence) {
        const present = code.filter(entry => entry.exists)

        const wired = present.some(entry => entry.loaded) || contains === true

        let status = "unknown"

        let reason = null

        let where = []

        if (code.length === 0) {
            reason = "no-known-code"
        } else if (present.length === 0) {
            where = otherBranches
                .filter(name => inBranches.has(`${name}:${code[0].path}`))
                .slice(0, MAX_BRANCHES_LISTED)

            if (where.length > 0) {
                status = "in-development"
                reason = "other-branches"
            } else if (docs.some(doc => doc.exists)) {
                status = "planned"
                reason = "docs-only"
            } else {
                reason = "not-found"
            }
        } else if (present.length < code.length) {
            reason = "partial"
        } else if (!wired) {
            reason = "not-wired"
        } else if (system.deprecated) {
            status = "deprecated"
        } else if (
            onStableBranch ||
            present.every(entry => onStable.has(`${stableRef}:${entry.path}`))
        ) {
            status = "implemented"
            reason = "loaded-and-stable"
        } else {
            status = "in-development"
            reason = "this-branch"
            where = stamp.branch ? [stamp.branch] : []
        }

        const prefixes = code.map(entry => entry.path)

        results.push({
            id: system.id,
            name: system.name,
            project: system.project,
            domain: system.domain,
            purpose: system.purpose,
            status,
            reason,
            where,
            code,
            missing: code.filter(entry => !entry.exists).map(entry => entry.path),
            docs,
            tests: {
                found: [...new Set(code.flatMap(entry => entry.tests))],
                run: false,
            },
            uncommittedChanges: dirty.filter(file =>
                prefixes.some(prefix => file === prefix || file.startsWith(prefix + "/")),
            ).length,
        })
    }

    const counts = Object.fromEntries(STATUSES.map(name => [name, 0]))

    for (const result of results) {
        counts[result.status] += 1
    }

    return {
        root: absoluteRoot,
        branch: stamp.branch,
        commit: stamp.commit,
        stableRef,
        stableCommit,
        indexedAt: new Date().toISOString(),
        serverFiles: serverGraph.size,
        appFiles: appGraph.size,
        rejected,
        counts,
        systems: results,
        hearthwood: {
            separateProject: true,
            note: "Hearthwood on erillinen projekti, eikä HQ:n Atlas kartoita sitä.",
        },
    }

}

export { STATUSES }
