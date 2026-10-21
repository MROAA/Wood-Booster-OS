/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Inventory
 *
 * Mitä agentteja Spacemonkeylla oikeasti on. Jokainen tieto kerätään
 * lähteestään, ei käsin kirjoitetusta listasta:
 *
 * - Agent Runtime: rekisteröidyt agentit kuvauksineen ja agentin oma
 *   kuntotarkistus (runtime.describe()).
 * - Keskustelun agenttireititin: mitä "agentteja" agentRegistry.js
 *   väittää, mihin agentRouter.js oikeasti ohjaa ja millä on oma
 *   kontekstinrakentaja agentExecutor.js:ssä. Nämä ovat
 *   kehotepersoonia, eivät työkaluja käyttäviä agentteja.
 * - Pluginit: Plugin Managerista. Plugin ei ole agentti.
 * - Staattiset väitteet: moduulit jotka kertovat agenttien tilan ilman
 *   todisteita (esim. agentSystemIntelligence).
 * - Koodiskannaus: kaikki `class ...Agent` -luokat, ja latautuvatko ne
 *   palvelimessa (importGraph.js, lähtönä server/index.js).
 *
 * Hearthwoodin tiedostoja ei tutkita (erillinen projekti) - niistä
 * kerrotaan vain määrä.
 */

import fs from "node:fs/promises"

import path from "node:path"

import { pathToFileURL } from "node:url"

import { gitStamp } from "./git.js"

import { buildImportGraph } from "./importGraph.js"

import { isProtectedPath } from "../security/protectedPaths.js"

const SERVER_ENTRY = "server/index.js"

const PERSONA_ROUTER = "server/services/agentRouter.js"

const PERSONA_EXECUTOR = "server/services/agentExecutor.js"

const PERSONA_REGISTRY = "server/services/agentRegistry.js"

const FRONTEND_AGENT_MANIFEST = "src/services/agents/agentManifest.js"

const STATIC_AGENT_REPORT = "server/services/spacemonkey/modules/agentSystemIntelligence/index.js"

const SCAN_DIRECTORIES = ["server/services", "server/routes"]

const HEARTHWOOD_PATH = /(^|[/_-])(hearthwood|heartwood)/i

const AGENT_CLASS_PATTERN = /\bclass\s+([A-Z]\w*Agent)\b/g

async function exists(root, relative) {

    try {
        await fs.access(path.join(root, relative))
        return true
    } catch {
        return false
    }

}

async function readText(root, relative) {

    try {
        return await fs.readFile(path.join(root, relative), "utf8")
    } catch {
        return ""
    }

}

async function listSourceFiles(root, directory) {

    const files = []

    async function walk(relative) {
        let entries

        try {
            entries = await fs.readdir(path.join(root, relative), { withFileTypes: true })
        } catch {
            return
        }

        for (const entry of entries) {
            const child = path.join(relative, entry.name)

            if (isProtectedPath(child)) {
                continue
            }

            if (entry.isDirectory()) {
                await walk(child)
            } else if (entry.isFile() && /\.(m?js|jsx)$/.test(entry.name)) {
                files.push(child)
            }
        }
    }

    await walk(directory)

    return files

}

async function scanAgentClasses(root) {

    const found = []

    let hearthwoodFiles = 0

    for (const directory of SCAN_DIRECTORIES) {
        for (const file of await listSourceFiles(root, directory)) {
            if (HEARTHWOOD_PATH.test(file)) {
                hearthwoodFiles += 1
                continue
            }

            const source = await readText(root, file)

            AGENT_CLASS_PATTERN.lastIndex = 0

            let match

            while ((match = AGENT_CLASS_PATTERN.exec(source)) !== null) {
                found.push({ file, className: match[1] })
            }
        }
    }

    return { classes: found, hearthwoodFilesSkipped: hearthwoodFiles }

}

function quotedValues(source, pattern) {

    return [...new Set([...source.matchAll(pattern)].map(match => match[1]))]

}

async function describePersonas(root, loaded) {

    const [routerSource, executorSource, manifestSource] = await Promise.all([
        readText(root, PERSONA_ROUTER),
        readText(root, PERSONA_EXECUTOR),
        readText(root, FRONTEND_AGENT_MANIFEST),
    ])

    const routed = quotedValues(routerSource, /agent\s*:\s*"([a-z-]+)"/g)

    const withContext = quotedValues(executorSource, /case\s+"([a-z-]+)"/g)

    let claimed = []

    try {
        const registry = await import(pathToFileURL(path.join(root, PERSONA_REGISTRY)).href)

        claimed = registry.getAgents().map(agent => ({
            id: agent.id,
            name: agent.name,
            claimedStatus: agent.status,
        }))
    } catch {
        claimed = []
    }

    const ids = [...new Set([...claimed.map(item => item.id), ...routed])]

    return {
        kind: "chat-persona",
        note:
            "Kehotepersoonia: valitsevat vastauksen kontekstin, eivät " +
            "käytä työkaluja eivätkä muuta tietoja.",
        sources: {
            registry: PERSONA_REGISTRY,
            router: PERSONA_ROUTER,
            executor: PERSONA_EXECUTOR,
            frontendManifest: FRONTEND_AGENT_MANIFEST,
        },
        usedByServer: loaded.has(PERSONA_ROUTER),
        frontendManifestIds: quotedValues(manifestSource, /id:\s*"([a-z-]+)"/g),
        personas: ids.map(id => {
            const claim = claimed.find(item => item.id === id)

            return {
                id,
                name: claim?.name || id,
                claimedStatus: claim?.claimedStatus || null,
                routed: routed.includes(id),
                ownContext: withContext.includes(id),
                mutates: false,
            }
        }),
    }

}

async function describeStaticClaims(root, loaded) {

    const claims = []

    try {
        const module = await import(pathToFileURL(path.join(root, STATIC_AGENT_REPORT)).href)

        const state = module.getAgentSystemState?.() || null

        const report = module.createAgentSystemReport?.() || null

        claims.push({
            id: "agent-system-intelligence",
            source: STATIC_AGENT_REPORT,
            loadedByServer: loaded.has(STATIC_AGENT_REPORT),
            claims: {
                state: report?.agents?.state ?? state?.state ?? null,
                totalAgents: report?.agents?.totalAgents ?? null,
            },
            note: "Kiinteä raportti: tila ei perustu ajossa oleviin agentteihin.",
        })
    } catch {
        // moduulia ei ole tässä haarassa
    }

    return claims

}

function findOverlaps(runtimeAgents, plugins) {

    const pluginIds = new Set(plugins.map(plugin => plugin.id))

    const overlaps = []

    for (const agent of runtimeAgents) {
        for (const other of agent.overlapsWith || []) {
            overlaps.push({
                agentId: agent.id,
                with: other,
                withKind: pluginIds.has(other) ? "plugin" : "unknown",
            })
        }
    }

    return overlaps

}

/**
 * Kokoaa inventaarion. Kaikki riippuvuudet annetaan kutsujalta, jotta
 * testi voi käyttää omaa runtimea ja projektijuurta.
 */
export async function buildAgentInventory({
    root,
    agentRuntime = null,
    pluginManager = null,
    capabilityRegistry = null,
} = {}) {

    const absoluteRoot = path.resolve(root)

    const [stamp, loaded, scan] = await Promise.all([
        gitStamp(absoluteRoot),
        buildImportGraph({ root: absoluteRoot, entries: [SERVER_ENTRY] }),
        scanAgentClasses(absoluteRoot),
    ])

    const chatCapabilities = capabilityRegistry?.list?.() || []

    const runtimeAgents = []

    for (const agent of agentRuntime?.describe?.() || []) {
        const tests = []

        for (const testPath of agent.tests || []) {
            tests.push({ path: testPath, exists: await exists(absoluteRoot, testPath) })
        }

        runtimeAgents.push({
            ...agent,
            sourceExists: agent.source ? await exists(absoluteRoot, agent.source) : false,
            loadedByServer: agent.source ? loaded.has(agent.source) : false,
            selectableFromChat: chatCapabilities
                .filter(capability => capability.agent === agent.id)
                .map(capability => capability.id),
            tests,
        })
    }

    const plugins = [...(pluginManager?.plugins?.values?.() || [])].map(plugin => ({
        id: plugin.id,
        name: plugin.name,
        category: plugin.category,
        tools: plugin.tools || [],
        permissions: plugin.permissions || [],
        isAgent: false,
    }))

    const runtimeSources = new Set(runtimeAgents.map(agent => agent.source))

    return {
        root: absoluteRoot,
        branch: stamp.branch,
        commit: stamp.commit,
        indexedAt: new Date().toISOString(),
        serverEntry: SERVER_ENTRY,
        loadedFileCount: loaded.size,
        runtimeAgents,
        chatPersonas: await describePersonas(absoluteRoot, loaded),
        plugins,
        staticClaims: await describeStaticClaims(absoluteRoot, loaded),
        agentClasses: scan.classes.map(item => ({
            ...item,
            loadedByServer: loaded.has(item.file),
            registeredInRuntime: runtimeSources.has(item.file),
        })),
        hearthwoodFilesSkipped: scan.hearthwoodFilesSkipped,
        overlaps: findOverlaps(runtimeAgents, plugins),
    }

}
