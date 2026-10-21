/*
 * Oikea Chromium-ajo HQ:n kehityskäyttöliittymää vastaan (vain lukevat
 * pyynnöt). Ei ajeta oletuksena, koska se vaatii käynnissä olevan
 * käyttöliittymän (localhost:5173) ja backendin sekä vapaata muistia:
 *
 *   SPACEMONKEY_BROWSER_TESTS=1 node --test services/spacemonkey/browser/tests/realBrowser.e2e.test.js
 *
 * Ilman muuttujaa testi näkyy tuloksissa ohitettuna, ei läpäistynä.
 */
import { after, test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs"

import os from "node:os"

import path from "node:path"

import { runBrowserScenario } from "../BrowserOperator.js"

import { getScenario } from "../scenarios.js"

import SpacemonkeyWorkspace from "../../workspace/SpacemonkeyWorkspace.js"

const enabled = process.env.SPACEMONKEY_BROWSER_TESTS === "1"

const parent = enabled ? fs.mkdtempSync(path.join(os.tmpdir(), "sm-browser-e2e-")) : null

after(() => {

    if (parent) {
        fs.rmSync(parent, { recursive: true, force: true })
    }

})

test(
    "real Chromium: the projects view opens a real project and shows the same project",
    { skip: enabled ? false : "set SPACEMONKEY_BROWSER_TESTS=1 (needs the HQ dev UI and free memory)" },
    async () => {
        const workspace = new SpacemonkeyWorkspace({ root: path.join(parent, "spacemonkey") })

        const task = await workspace.createTask({ kind: "ui-check" })

        const report = await runBrowserScenario({
            scenario: getScenario("projects-view"),
            workspace,
            taskId: task.id,
        })

        assert.equal(report.error, null, report.error)

        assert.equal(report.ok, true, JSON.stringify(report.steps, null, 1))

        assert.deepEqual(report.pageErrors, [])

        assert.equal(report.screenshots.length, 2)

        assert.ok(report.blockedRequests.every(request => !request.url.startsWith("http://localhost:3001") || request.method !== "GET"))
    },
)
