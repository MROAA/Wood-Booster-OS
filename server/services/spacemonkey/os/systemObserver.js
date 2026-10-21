/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * System Observer (OS Operator, vain luku)
 *
 * Koneen ja HQ-palveluiden tila ilman root-oikeuksia:
 *
 * - perustiedot System Pulsen getRuntimePulse()-funktiosta (sama lähde
 *   kuin /api/system-pulse); käytettävissä oleva muisti ja swap
 *   /proc/meminfo:sta (os.freemem() aliarvioi Linuxissa käytettävissä
 *   olevan muistin)
 * - kuorma (loadavg) ja levytila (statfs) projektin ja työtilan levyiltä
 * - SALLITTUJEN palveluiden tila: systemctl show, kiinteät argumentit,
 *   ei shelliä, ei käyttäjän antamia yksikköjä
 * - SALLITUT terveysreitit: kiinteät paikalliset osoitteet, ei
 *   uudelleenohjauksia, vastauksen sisältöä ei lueta
 * - git-haara, commit ja commitoimattomat muutokset
 * - kehitysprosessit: /proc/<pid>/status -tiedostosta vain nimi ja
 *   muistinkäyttö, koottuna nimen mukaan. Komentorivejä ja
 *   ympäristömuuttujia ei koskaan lueta (niissä voi olla salaisuuksia).
 *
 * Mikään tästä ei muuta järjestelmää. Kaikki ulkoiset lukijat voi
 * korvata testissä (deps).
 */

import { execFile } from "node:child_process"

import fs from "node:fs/promises"

import os from "node:os"

import { promisify } from "node:util"

import { getRuntimePulse } from "../../aiBrainV2/services/systemPulse/runtimePulse.js"

import { gitStamp, uncommittedPaths } from "../inventory/git.js"

const execFileAsync = promisify(execFile)

export const ALLOWED_SERVICES = [
    { id: "wb-node", name: "HQ-palvelin (wb-node)", scope: "user" },
    { id: "ollama", name: "Ollama (kielimallit)", scope: "system" },
]

export const HEALTH_ENDPOINTS = [
    { id: "hq-backend", name: "HQ-backend", url: "http://127.0.0.1:3001/api/health" },
    { id: "ollama-api", name: "Ollama API", url: "http://127.0.0.1:11434/api/version" },
    { id: "hq-frontend", name: "HQ-käyttöliittymä (Vite)", url: "http://[::1]:5173/" },
]

// Avaimena /proc/<pid>/status -tiedoston Name-kenttä. Node nimeää
// pääsäikeensä "node-MainThread".
export const WATCHED_PROCESSES = {
    node: "Node.js",
    "node-MainThread": "Node.js",
    ollama: "Ollama",
    code: "VS Code",
    chrome: "Chrome",
    chromium: "Chromium",
    headless_shell: "Playwright-selain",
    python3: "Python",
}

const SERVICE_PROPERTIES = ["ActiveState", "SubState", "ActiveEnterTimestamp"]

const COMMAND_TIMEOUT_MS = 5000

const ENDPOINT_TIMEOUT_MS = 3000

const LOW_MEMORY_BYTES = 2 * 1024 ** 3

const HIGH_SWAP_RATIO = 0.75

const LOW_DISK_RATIO = 0.1

const defaultDeps = {
    readFile: path => fs.readFile(path, "utf8"),
    readdir: path => fs.readdir(path),
    statfs: path => fs.statfs(path),
    execFile: (command, args) =>
        execFileAsync(command, args, { timeout: COMMAND_TIMEOUT_MS }).then(result => result.stdout),
    fetch: (url, options) => fetch(url, options),
    loadavg: () => os.loadavg(),
    uptime: () => os.uptime(),
    runtimePulse: () => getRuntimePulse(),
    gitStamp,
    uncommittedPaths,
}

function parseMeminfo(text) {

    const values = {}

    for (const line of String(text).split("\n")) {
        const match = line.match(/^(\w+):\s+(\d+)\s*kB/)

        if (match) {
            values[match[1]] = Number(match[2]) * 1024
        }
    }

    return {
        totalBytes: values.MemTotal ?? null,
        availableBytes: values.MemAvailable ?? null,
        swapTotalBytes: values.SwapTotal ?? null,
        swapFreeBytes: values.SwapFree ?? null,
    }

}

function parseServiceShow(text) {

    const values = {}

    for (const line of String(text).split("\n")) {
        const index = line.indexOf("=")

        if (index > 0) {
            values[line.slice(0, index)] = line.slice(index + 1)
        }
    }

    return values

}

/**
 * Yhden sallitun palvelun tila. Tuntematon tunniste hylätään ennen kuin
 * mitään komentoa ajetaan.
 */
export async function checkService(id, { deps = defaultDeps } = {}) {

    const service = ALLOWED_SERVICES.find(item => item.id === id)

    if (!service) {
        return { id, allowed: false, error: "unknown-service" }
    }

    const args = [
        ...(service.scope === "user" ? ["--user"] : []),
        "show",
        service.id,
        ...SERVICE_PROPERTIES.flatMap(property => ["-p", property]),
    ]

    try {
        const values = parseServiceShow(await deps.execFile("systemctl", args))

        return {
            id: service.id,
            name: service.name,
            allowed: true,
            state: values.ActiveState || "unknown",
            subState: values.SubState || null,
            since: values.ActiveEnterTimestamp || null,
        }
    } catch (error) {
        return {
            id: service.id,
            name: service.name,
            allowed: true,
            state: "unknown",
            error: error.message,
        }
    }

}

async function checkEndpoint(endpoint, deps) {

    try {
        const response = await deps.fetch(endpoint.url, {
            method: "GET",
            redirect: "manual",
            signal: AbortSignal.timeout(ENDPOINT_TIMEOUT_MS),
        })

        await response.body?.cancel?.()

        return {
            id: endpoint.id,
            name: endpoint.name,
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
        }
    } catch (error) {
        return {
            id: endpoint.id,
            name: endpoint.name,
            ok: false,
            status: null,
            error: error.name === "TimeoutError" ? "timeout" : "unreachable",
        }
    }

}

async function readProcesses(deps) {

    const groups = {}

    let entries = []

    try {
        entries = await deps.readdir("/proc")
    } catch {
        return []
    }

    for (const entry of entries) {
        if (!/^\d+$/.test(entry)) {
            continue
        }

        let status

        try {
            status = await deps.readFile(`/proc/${entry}/status`)
        } catch {
            continue
        }

        const name = status.match(/^Name:\s+(\S+)/m)?.[1]

        if (!name || !WATCHED_PROCESSES[name]) {
            continue
        }

        const rssKb = Number(status.match(/^VmRSS:\s+(\d+)\s*kB/m)?.[1] || 0)

        const label = WATCHED_PROCESSES[name]

        groups[label] = groups[label] || { name, label, count: 0, rssBytes: 0 }
        groups[label].count += 1
        groups[label].rssBytes += rssKb * 1024
    }

    return Object.values(groups).sort((first, second) => second.rssBytes - first.rssBytes)

}

async function readDisk(label, path, deps) {

    try {
        const stat = await deps.statfs(path)

        return {
            label,
            freeBytes: stat.bavail * stat.bsize,
            totalBytes: stat.blocks * stat.bsize,
        }
    } catch {
        return { label, freeBytes: null, totalBytes: null }
    }

}

function warningsFor(report) {

    const warnings = []

    const { memory } = report

    if (memory.availableBytes !== null && memory.availableBytes < LOW_MEMORY_BYTES) {
        warnings.push({ code: "low-memory", text: "Käytettävissä olevaa muistia on alle 2 Gt." })
    }

    if (memory.swapTotalBytes > 0) {
        const used = (memory.swapTotalBytes - memory.swapFreeBytes) / memory.swapTotalBytes

        if (used > HIGH_SWAP_RATIO) {
            warnings.push({
                code: "high-swap",
                text: "Swapista on käytössä yli 75 % - raskaat ajot (build, selaintestit) kannattaa siirtää.",
            })
        }
    }

    for (const disk of report.disks) {
        if (disk.totalBytes && disk.freeBytes / disk.totalBytes < LOW_DISK_RATIO) {
            warnings.push({ code: "low-disk", text: `${disk.label}: levytilaa on alle 10 % jäljellä.` })
        }
    }

    for (const service of report.services) {
        if (service.state !== "active") {
            warnings.push({ code: "service-not-active", text: `${service.name}: tila ${service.state}.` })
        }
    }

    for (const endpoint of report.endpoints) {
        if (!endpoint.ok) {
            warnings.push({ code: "endpoint-down", text: `${endpoint.name} ei vastaa.` })
        }
    }

    return warnings

}

/**
 * Koko tilannekuva. Palauttaa aina raportin - yksittäisen lähteen
 * virhe näkyy sen kohdalla, ei kaada koko tarkistusta.
 */
export async function observeSystem({
    projectRoot,
    workspaceRoot = null,
    deps: overrides = {},
} = {}) {

    const deps = { ...defaultDeps, ...overrides }

    const pulse = deps.runtimePulse()

    const [meminfo, services, endpoints, processes, disks, stamp, dirty] = await Promise.all([
        deps.readFile("/proc/meminfo").then(parseMeminfo).catch(() => parseMeminfo("")),
        Promise.all(ALLOWED_SERVICES.map(service => checkService(service.id, { deps }))),
        Promise.all(HEALTH_ENDPOINTS.map(endpoint => checkEndpoint(endpoint, deps))),
        readProcesses(deps),
        Promise.all([
            readDisk("Projektin levy", projectRoot, deps),
            ...(workspaceRoot ? [readDisk("Työtilan levy", workspaceRoot, deps)] : []),
        ]),
        deps.gitStamp(projectRoot),
        deps.uncommittedPaths(projectRoot),
    ])

    const [load1, load5, load15] = deps.loadavg()

    const report = {
        checkedAt: new Date().toISOString(),
        runtime: {
            platform: pulse.platform,
            architecture: pulse.architecture,
            nodeVersion: pulse.nodeVersion,
            cpuCount: pulse.cpuCount,
            uptimeSeconds: Math.round(deps.uptime()),
        },
        load: { load1, load5, load15 },
        memory: {
            totalBytes: meminfo.totalBytes ?? pulse.memory?.total ?? null,
            availableBytes: meminfo.availableBytes,
            swapTotalBytes: meminfo.swapTotalBytes,
            swapFreeBytes: meminfo.swapFreeBytes,
        },
        disks,
        services,
        endpoints,
        processes,
        git: { branch: stamp.branch, commit: stamp.commit, uncommittedChanges: dirty.length },
    }

    report.warnings = warningsFor(report)

    return report

}

export { parseMeminfo }
