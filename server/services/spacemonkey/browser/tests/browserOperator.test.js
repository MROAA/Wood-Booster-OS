import { after, test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs"

import os from "node:os"

import path from "node:path"

import { appUrl, isAllowedRequest, isAllowedUrl } from "../browserPolicy.js"

import { runBrowserScenario, safeUrl } from "../BrowserOperator.js"

import { getScenario, listScenarios } from "../scenarios.js"

import SpacemonkeyWorkspace from "../../workspace/SpacemonkeyWorkspace.js"

import { PROJECT_SITE, createFakeLauncher } from "./fakeBrowser.js"



const parents = []

after(() => {

    for (const parent of parents) {
        fs.rmSync(parent, { recursive: true, force: true })
    }

})

async function workspaceWithTask() {

    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "sm-browser-"))

    parents.push(parent)

    const workspace = new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey") })

    const task = await workspace.createTask({ kind: "ui-check" })

    return { workspace, taskId: task.id }

}

const enoughMemory = async () => ({ ok: true, availableBytes: 8 * 1024 ** 3 })



test("only HQ's local development origins are allowed, read-only", () => {

    for (const url of [
        "http://localhost:5173/projects",
        "http://[::1]:5173/",
        "http://localhost:3001/api/projects",
        "http://127.0.0.1:3001/api/health",
    ]) {
        assert.equal(isAllowedUrl(url), true, url)
    }

    for (const url of [
        "http://localhost:11434/api/tags",
        "http://localhost:9443/",
        "http://169.254.169.254/latest/meta-data",
        "http://192.168.1.1/",
        "https://fonts.googleapis.com/css",
        "file:///etc/passwd",
        "http://user:pass@localhost:5173/",
        "javascript:alert(1)",
        "not a url",
    ]) {
        assert.equal(isAllowedUrl(url), false, url)
    }

    assert.equal(isAllowedRequest({ url: "http://localhost:3001/api/projects", method: "GET" }), true)

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        assert.equal(isAllowedRequest({ url: "http://localhost:3001/api/projects/1", method }), false, method)
    }

})



test("scenario paths stay inside the app origin", () => {

    assert.equal(appUrl("/projects"), "http://localhost:5173/projects")

    for (const value of ["https://evil.example/", "//evil.example/x", "projects", "", null]) {
        assert.equal(appUrl(value), null, String(value))
    }

    assert.deepEqual(listScenarios().map(item => item.id), ["projects-view"])

    assert.equal(getScenario("toString"), null)

    assert.equal(getScenario("../x"), null)

})



test("the projects scenario passes on a working page and saves screenshots in the task folder", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const { launcher, log } = createFakeLauncher(PROJECT_SITE)

    const report = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher,
        memoryGuard: enoughMemory,
    })

    assert.equal(report.ok, true, JSON.stringify(report.steps))

    assert.deepEqual(report.steps.map(step => step.ok), [true, true, true, true, true, true, true, true])

    assert.equal(report.steps[3].detail, 2, "two project links counted")

    assert.equal(report.steps[6].detail, "WP-plugin-testi")

    assert.deepEqual(report.screenshots, [`tasks/${taskId}/projects.png`, `tasks/${taskId}/project-details.png`])

    assert.equal(await workspace.readFile(report.screenshots[0]), "PNGDATA")

    assert.deepEqual(log.contexts, [{
        acceptDownloads: false,
        serviceWorkers: "block",
        viewport: { width: 1280, height: 800 },
        locale: "fi-FI",
    }])

    assert.equal(log.closedContexts, 1)

    assert.equal(log.closedBrowser, true)

})



test("writes and outside requests are blocked, recorded without query strings, and not reported as failures", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const { launcher, log } = createFakeLauncher(PROJECT_SITE)

    const report = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher,
        memoryGuard: enoughMemory,
    })

    assert.deepEqual(report.blockedRequests, [
        { url: "https://fonts.googleapis.com/css2", method: "GET" },
        { url: "http://localhost:3001/api/projects/35", method: "DELETE" },
    ])

    assert.ok(log.routedRequests.some(item => item.method === "DELETE" && item.outcome === "abort"))

    assert.deepEqual(report.failedRequests, [])

    assert.ok(!JSON.stringify(report).includes("token=abc"))

    assert.equal(safeUrl("http://localhost:3001/api/x?secret=1#h"), "http://localhost:3001/api/x")

})



test("a failing step stops the run, later steps are skipped and the browser is still closed", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const site = { pages: { "/projects": { headings: [{ level: 1, text: "Väärä otsikko" }], links: [] } } }

    const { launcher, log } = createFakeLauncher(site)

    const report = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher,
        memoryGuard: enoughMemory,
    })

    assert.equal(report.ok, false)

    assert.deepEqual(report.steps.map(step => step.ok), [true, false, null, null, null, null, null, null])

    assert.equal(report.steps[2].detail, "ohitettu")

    assert.equal(log.closedBrowser, true)

})



test("page errors fail the run and console errors are reported", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const site = structuredClone(PROJECT_SITE)

    site.pages["/projects"].pageErrors = ["TypeError: projects.map is not a function"]

    site.pages["/projects"].consoleErrors = ["Failed to load resource"]

    site.pages["/projects/35"].requests = [{ url: "http://localhost:3001/api/projects/35", status: 500 }]

    const { launcher } = createFakeLauncher(site)

    const report = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher,
        memoryGuard: enoughMemory,
    })

    assert.equal(report.ok, false)

    assert.deepEqual(report.pageErrors, ["TypeError: projects.map is not a function"])

    assert.deepEqual(report.consoleErrors, ["Failed to load resource"])

    assert.deepEqual(report.failedRequests, [{ url: "http://localhost:3001/api/projects/35", status: 500 }])

})



test("low memory refuses to start a browser at all", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const { launcher, log } = createFakeLauncher(PROJECT_SITE)

    const report = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher,
        memoryGuard: async () => ({ ok: false, availableBytes: 1024 ** 3 }),
    })

    assert.equal(report.error, "low-memory")

    assert.equal(log.launched, 0)

})



test("a missing browser, an unknown scenario, a timeout and a cancel are reported, never thrown", async () => {

    const { workspace, taskId } = await workspaceWithTask()

    const missing = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher: createFakeLauncher(PROJECT_SITE, { failLaunch: true }).launcher,
        memoryGuard: enoughMemory,
    })

    assert.equal(missing.ok, false)

    assert.equal(missing.error, "no browser")

    const unknown = await runBrowserScenario({ scenario: null, workspace, taskId })

    assert.equal(unknown.error, "unknown-scenario")

    const slow = {
        pages: PROJECT_SITE.pages,
    }

    const { launcher: slowLauncher, log } = createFakeLauncher(slow)

    const hanging = async () => {
        const browser = await slowLauncher()

        return {
            ...browser,
            newContext: async () => new Promise(() => {}),
        }
    }

    const timedOut = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher: hanging,
        memoryGuard: enoughMemory,
        totalTimeoutMs: 30,
    })

    assert.equal(timedOut.error, "timeout")

    assert.equal(log.closedBrowser, true)

    const controller = new AbortController()

    controller.abort()

    const cancelled = await runBrowserScenario({
        scenario: getScenario("projects-view"),
        workspace,
        taskId,
        launcher: createFakeLauncher(PROJECT_SITE).launcher,
        memoryGuard: enoughMemory,
        signal: controller.signal,
    })

    assert.equal(cancelled.ok, false)

    assert.equal(cancelled.error, "cancelled")

})
