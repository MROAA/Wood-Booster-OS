import { test } from "node:test"

import assert from "node:assert/strict"

import {
    ALLOWED_SERVICES,
    HEALTH_ENDPOINTS,
    checkService,
    observeSystem,
    parseMeminfo,
} from "../systemObserver.js"

import { formatSystemStatus } from "../systemStatusText.js"

const GB = 1024 ** 3

const MEMINFO = [
    "MemTotal:       16000000 kB",
    "MemFree:          400000 kB",
    "MemAvailable:    3000000 kB",
    "SwapTotal:      16000000 kB",
    "SwapFree:        2000000 kB",
].join("\n")

function fakeDeps(overrides = {}) {

    const calls = { execFile: [], fetch: [], readFile: [] }

    const deps = {
        readFile: async file => {
            calls.readFile.push(file)

            if (file === "/proc/meminfo") return MEMINFO
            if (file === "/proc/100/status") return "Name:\tnode-MainThread\nVmRSS:\t  204800 kB\n"
            if (file === "/proc/101/status") return "Name:\tcode\nVmRSS:\t 1048576 kB\n"
            if (file === "/proc/102/status") return "Name:\tsshd\nVmRSS:\t 1000 kB\n"
            throw new Error("ENOENT")
        },
        readdir: async () => ["100", "101", "102", "self", "cpuinfo"],
        statfs: async () => ({ bavail: 100, bsize: GB, blocks: 500 }),
        execFile: async (command, args) => {
            calls.execFile.push([command, ...args])
            return "ActiveState=active\nSubState=running\nActiveEnterTimestamp=Wed 2026-10-21 13:06:59 EEST\n"
        },
        fetch: async url => {
            calls.fetch.push(url)
            return { status: 200, body: { cancel: async () => {} } }
        },
        loadavg: () => [1.5, 1.2, 1.0],
        uptime: () => 3600,
        runtimePulse: () => ({ platform: "linux", architecture: "x64", nodeVersion: "v26", cpuCount: 16, memory: {} }),
        gitStamp: async () => ({ branch: "feat/x", commit: "abc1234" }),
        uncommittedPaths: async () => ["a.js", "b.js"],
        ...overrides,
    }

    return { deps, calls }

}



test("meminfo is parsed into bytes, MemAvailable rather than MemFree", () => {

    assert.deepEqual(parseMeminfo(MEMINFO), {
        totalBytes: 16000000 * 1024,
        availableBytes: 3000000 * 1024,
        swapTotalBytes: 16000000 * 1024,
        swapFreeBytes: 2000000 * 1024,
    })

    assert.deepEqual(parseMeminfo(""), {
        totalBytes: null,
        availableBytes: null,
        swapTotalBytes: null,
        swapFreeBytes: null,
    })

})



test("only allowed services and endpoints are queried, with fixed arguments and no shell", async () => {

    const { deps, calls } = fakeDeps()

    const report = await observeSystem({ projectRoot: "/repo", workspaceRoot: "/ws", deps })

    assert.deepEqual(calls.execFile, [
        ["systemctl", "--user", "show", "wb-node", "-p", "ActiveState", "-p", "SubState", "-p", "ActiveEnterTimestamp"],
        ["systemctl", "show", "ollama", "-p", "ActiveState", "-p", "SubState", "-p", "ActiveEnterTimestamp"],
    ])

    assert.deepEqual(calls.fetch, HEALTH_ENDPOINTS.map(endpoint => endpoint.url))

    assert.deepEqual(report.services.map(service => [service.id, service.state]), [["wb-node", "active"], ["ollama", "active"]])

    assert.equal(report.disks.length, 2)

    assert.deepEqual(report.git, { branch: "feat/x", commit: "abc1234", uncommittedChanges: 2 })

})



test("an unknown service is refused before any command runs", async () => {

    const { deps, calls } = fakeDeps()

    for (const id of ["sshd", "wb-node; rm -rf /", "../ollama", ""]) {
        const result = await checkService(id, { deps })

        assert.deepEqual(result, { id, allowed: false, error: "unknown-service" })
    }

    assert.deepEqual(calls.execFile, [])

    assert.deepEqual(ALLOWED_SERVICES.map(service => service.id), ["wb-node", "ollama"])

})



test("processes are read by name and memory only, never command lines or environments", async () => {

    const { deps, calls } = fakeDeps()

    const report = await observeSystem({ projectRoot: "/repo", deps })

    assert.ok(calls.readFile.every(file => file === "/proc/meminfo" || /^\/proc\/\d+\/status$/.test(file)))

    assert.ok(!calls.readFile.some(file => /cmdline|environ/.test(file)))

    assert.deepEqual(
        report.processes.map(item => [item.label, item.count, item.rssBytes]),
        [["VS Code", 1, 1048576 * 1024], ["Node.js", 1, 204800 * 1024]],
    )

    assert.ok(!JSON.stringify(report).includes("sshd"), "unwatched processes are not reported")

})



test("warnings come from the measured values", async () => {

    const { deps } = fakeDeps({
        statfs: async () => ({ bavail: 10, bsize: GB, blocks: 500 }),
        execFile: async (command, args) =>
            args.includes("ollama") ? "ActiveState=failed\nSubState=failed\n" : "ActiveState=active\nSubState=running\n",
        fetch: async url => {
            if (url.includes("5173")) throw new TypeError("fetch failed")
            return { status: 200, body: null }
        },
    })

    const report = await observeSystem({ projectRoot: "/repo", deps })

    assert.deepEqual(
        report.warnings.map(warning => warning.code).sort(),
        ["endpoint-down", "high-swap", "low-disk", "service-not-active"],
    )

})



test("one failing source does not break the whole check", async () => {

    const { deps } = fakeDeps({
        readFile: async () => { throw new Error("no proc") },
        readdir: async () => { throw new Error("no proc") },
        statfs: async () => { throw new Error("no statfs") },
        execFile: async () => { throw new Error("no systemctl") },
        fetch: async () => { throw new TypeError("fetch failed") },
    })

    const report = await observeSystem({ projectRoot: "/repo", deps })

    assert.equal(report.memory.availableBytes, null)

    assert.deepEqual(report.services.map(service => service.state), ["unknown", "unknown"])

    assert.ok(report.endpoints.every(endpoint => endpoint.ok === false))

    assert.deepEqual(report.processes, [])

    assert.match(formatSystemStatus(report), /Koneen tila/)

})



test("the status text is plain Finnish with decimal commas", async () => {

    const { deps } = fakeDeps()

    const text = formatSystemStatus(await observeSystem({ projectRoot: "/repo", deps }))

    assert.match(text, /^Koneen tila \(luettu nyt, tavallisena käyttäjänä, ilman root-oikeuksia\):/)

    assert.match(text, /- Muisti: käytettävissä 2,9 \/ 15,3 Gt; swap käytössä 13,4 \/ 15,3 Gt/)

    assert.match(text, /- HQ-palvelin \(wb-node\): käynnissä/)

    assert.match(text, /- HQ-backend: vastaa \(200\)/)

    assert.match(text, /Git: haara feat\/x, commit abc1234, 2 commitoimatonta muutosta\./)

})



test("the real machine can be observed without root and without secrets", async () => {

    const report = await observeSystem({ projectRoot: process.cwd() })

    assert.ok(report.memory.totalBytes > 0)

    assert.ok(report.runtime.cpuCount > 0)

    const text = JSON.stringify(report)

    assert.ok(!/PATH=|HOME=|API_KEY|TOKEN=/.test(text))

    assert.notEqual(process.getuid?.(), 0, "tests do not run as root")

})
