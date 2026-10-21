/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Browser Operator (Playwright)
 *
 * Ajaa yhden ennalta määritellyn käyttöliittymäskenaarion
 * (scenarios.js) eristetyssä selaimessa ja palauttaa todennettavan
 * raportin:
 *
 * - oma selain ja uusi BrowserContext jokaiselle tehtävälle: ei
 *   käyttäjän profiilia, ei tallennettuja kirjautumisia, ei latauksia,
 *   ei service workereita
 * - jokainen pyyntö kulkee browserPolicy.js:n läpi: vain HQ:n
 *   paikalliset osoitteet ja vain lukevat metodit. Muut estetään ja
 *   kirjataan (osoite ilman kyselyosaa).
 * - ei sivun sisäistä JavaScriptin suoritusta: askeleet käyttävät
 *   saavutettavia rooleja, otsikoita ja linkkejä
 * - konsolivirheet, sivun virheet, epäonnistuneet pyynnöt ja estetyt
 *   pyynnöt raportoidaan; kuvakaappaukset tallennetaan Spacemonkeyn
 *   työtilan tehtäväkansioon
 * - muistivahti ennen käynnistystä: selainta ei käynnistetä, jos
 *   käytettävissä olevaa muistia on liian vähän (koneella on kaatunut
 *   VS Code muistipaineessa)
 * - askel- ja kokonaisaikaraja, keskeytys AbortSignalilla, ja selain
 *   suljetaan aina - myös virheessä
 *
 * Playwright ladataan vasta käytettäessä. Testit antavat oman
 * launcher-funktion.
 */

import fs from "node:fs/promises"

import {
    DEFAULT_APP_ORIGIN,
    appUrl,
    isAllowedRequest,
    isAllowedUrl,
} from "./browserPolicy.js"

const DEFAULT_STEP_TIMEOUT_MS = 10000

const DEFAULT_TOTAL_TIMEOUT_MS = 60000

const MIN_AVAILABLE_BYTES = 2.5 * 1024 ** 3

const MAX_RECORDED = 25

const MAX_TEXT = 300

class BrowserUnavailableError extends Error {}

class ScenarioAbortedError extends Error {}

function safeUrl(url) {

    try {
        const parsed = new URL(url)

        return `${parsed.origin}${parsed.pathname}`
    } catch {
        return String(url).slice(0, 100)
    }

}

function record(list, item) {

    if (list.length < MAX_RECORDED) {
        list.push(item)
    }

}

async function defaultLauncher() {

    let playwright

    try {
        playwright = await import("playwright")
    } catch (error) {
        throw new BrowserUnavailableError(`Playwright ei ole käytettävissä: ${error.message}`)
    }

    return playwright.chromium.launch({
        headless: true,
        args: ["--disable-dev-shm-usage"],
    })

}

async function defaultMemoryGuard() {

    try {
        const meminfo = await fs.readFile("/proc/meminfo", "utf8")

        const availableKb = Number(meminfo.match(/^MemAvailable:\s+(\d+)\s*kB/m)?.[1])

        const availableBytes = availableKb * 1024

        return { ok: availableBytes >= MIN_AVAILABLE_BYTES, availableBytes, minBytes: MIN_AVAILABLE_BYTES }
    } catch {
        return { ok: true, availableBytes: null, minBytes: MIN_AVAILABLE_BYTES }
    }

}

const STEP_RUNNERS = {

    async open({ page, step, origin, timeout }) {

        const url = appUrl(step.path, origin)

        if (!url) {
            throw new Error(`Polku ${step.path} ei kelpaa.`)
        }

        await page.goto(url, { waitUntil: "domcontentloaded", timeout })

        return step.path

    },

    async heading({ page, step, timeout }) {

        const options = { level: step.level }

        if (step.name) {
            options.name = step.name
            options.exact = true
        }

        const heading = page.getByRole("heading", options).first()

        await heading.waitFor({ state: "visible", timeout })

        return (await heading.innerText()).trim().slice(0, MAX_TEXT)

    },

    async countLinks({ page, step, timeout }) {

        const links = page.locator(`a[href^="${step.hrefPrefix}"]`)

        await links.first().waitFor({ state: "visible", timeout })

        const count = await links.count()

        if (count < step.min) {
            throw new Error(`Linkkejä ${count}, odotettiin vähintään ${step.min}.`)
        }

        return count

    },

    async clickLink({ page, step, state, timeout }) {

        const link = page.locator(`a[href^="${step.hrefPrefix}"]`).nth(step.index)

        await link.waitFor({ state: "visible", timeout })

        state.clickedLinkText = (await link.innerText()).trim()

        const href = await link.getAttribute("href")

        await link.click({ timeout })

        return href

    },

    async expectPath({ page, step, timeout }) {

        const pattern = new RegExp(step.pattern)

        await page.waitForURL(url => pattern.test(new URL(String(url)).pathname), { timeout })

        return new URL(page.url()).pathname

    },

    // Klikatun linkin ensimmäinen rivi (projektikortissa projektin nimi)
    // pitää näkyä otsikkona. Haku saavutettavalla nimellä odottaa, että
    // asynkronisesti latautuva sisältö ehtii näkyviin - pelkkä
    // ensimmäinen otsikko olisi sovelluksen yläpalkki.
    async headingInClickedLink({ page, step, state, timeout }) {

        const expected = String(state.clickedLinkText || "")
            .split("\n")
            .map(line => line.trim())
            .find(Boolean)

        if (!expected) {
            throw new Error("Klikatussa linkissä ei ollut tekstiä.")
        }

        const heading = page.getByRole("heading", { level: step.level, name: expected, exact: true }).first()

        try {
            await heading.waitFor({ state: "visible", timeout })
        } catch {
            throw new Error(`Otsikkoa "${expected.slice(0, 100)}" ei näkynyt.`)
        }

        return expected.slice(0, MAX_TEXT)

    },

    async screenshot({ page, step, workspace, taskId, report }) {

        const image = await page.screenshot({ type: "png" })

        const written = await workspace.writeFile(
            workspace.taskPath(taskId, `${step.name}.png`),
            image,
        )

        report.screenshots.push(written.path)

        return written.path

    },

}

function attachObservers({ page, report, state }) {

    page.on("console", message => {
        if (message.type() === "error") {
            record(report.consoleErrors, message.text().slice(0, MAX_TEXT))
        }
    })

    page.on("pageerror", error => {
        record(report.pageErrors, String(error?.message || error).slice(0, MAX_TEXT))
    })

    page.on("requestfailed", request => {
        const reason = request.failure()?.errorText || "failed"

        if (!state.blockedUrls.has(request.url())) {
            record(report.failedRequests, { url: safeUrl(request.url()), error: reason })
        }
    })

    page.on("response", response => {
        if (response.status() >= 400) {
            record(report.failedRequests, { url: safeUrl(response.url()), status: response.status() })
        }
    })

    page.on("framenavigated", frame => {
        const url = frame.url()

        if (frame === page.mainFrame() && url !== "about:blank" && !isAllowedUrl(url)) {
            record(report.blockedNavigations, safeUrl(url))
        }
    })

}

/**
 * Ajaa skenaarion ja palauttaa raportin. Ei heitä poikkeusta kutsujalle:
 * virheet näkyvät raportissa (ok: false, error).
 */
export async function runBrowserScenario({
    scenario,
    workspace,
    taskId,
    origin = DEFAULT_APP_ORIGIN,
    launcher = defaultLauncher,
    memoryGuard = defaultMemoryGuard,
    stepTimeoutMs = DEFAULT_STEP_TIMEOUT_MS,
    totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS,
    signal = null,
} = {}) {

    const report = {
        scenarioId: scenario?.id || null,
        scenarioName: scenario?.name || null,
        ok: false,
        error: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        isolation: "uusi selain ja BrowserContext, ei profiilia, vain lukevat pyynnöt HQ:n paikallisiin osoitteisiin",
        steps: [],
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        blockedRequests: [],
        blockedNavigations: [],
        screenshots: [],
        memory: null,
    }

    if (!scenario) {
        report.error = "unknown-scenario"
        report.finishedAt = new Date().toISOString()
        return report
    }

    const memory = await memoryGuard()

    report.memory = memory

    if (!memory.ok || signal?.aborted) {
        report.error = memory.ok ? "cancelled" : "low-memory"
        report.finishedAt = new Date().toISOString()
        return report
    }

    let browser = null

    let context = null

    let timer = null

    const state = { clickedLinkText: null, blockedUrls: new Set() }

    const run = async () => {
        browser = await launcher()

        context = await browser.newContext({
            acceptDownloads: false,
            serviceWorkers: "block",
            viewport: { width: 1280, height: 800 },
            locale: "fi-FI",
        })

        await context.route("**/*", route => {
            const request = route.request()

            const url = request.url()

            if (url.startsWith("data:") || url.startsWith("blob:")) {
                return route.continue()
            }

            if (isAllowedRequest({ url, method: request.method() })) {
                return route.continue()
            }

            state.blockedUrls.add(url)

            record(report.blockedRequests, { url: safeUrl(url), method: request.method() })

            return route.abort("blockedbyclient")
        })

        const page = await context.newPage()

        attachObservers({ page, report, state })

        let failed = false

        for (const [index, step] of scenario.steps.entries()) {
            if (failed) {
                report.steps.push({ index, action: step.action, ok: null, detail: "ohitettu" })
                continue
            }

            if (signal?.aborted) {
                throw new ScenarioAbortedError("cancelled")
            }

            const runner = STEP_RUNNERS[step.action]

            try {
                if (!runner) {
                    throw new Error(`Tuntematon askel: ${step.action}`)
                }

                const detail = await runner({
                    page,
                    step,
                    state,
                    origin,
                    workspace,
                    taskId,
                    report,
                    timeout: stepTimeoutMs,
                })

                report.steps.push({ index, action: step.action, ok: true, detail })
            } catch (error) {
                failed = true

                report.steps.push({
                    index,
                    action: step.action,
                    ok: false,
                    detail: String(error?.message || error).split("\n")[0].slice(0, MAX_TEXT),
                })
            }
        }
    }

    try {
        await Promise.race([
            run(),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new ScenarioAbortedError("timeout")), totalTimeoutMs)
            }),
            new Promise((_, reject) => {
                signal?.addEventListener("abort", () => reject(new ScenarioAbortedError("cancelled")), { once: true })
            }),
        ])

        report.ok =
            report.steps.length === scenario.steps.length &&
            report.steps.every(step => step.ok === true) &&
            report.pageErrors.length === 0 &&
            report.blockedNavigations.length === 0
    } catch (error) {
        report.ok = false
        report.error = error instanceof BrowserUnavailableError
            ? "browser-unavailable"
            : error instanceof ScenarioAbortedError
                ? error.message
                : String(error?.message || error).slice(0, MAX_TEXT)
    } finally {
        clearTimeout(timer)

        await context?.close().catch(() => {})

        await browser?.close().catch(() => {})

        report.finishedAt = new Date().toISOString()
    }

    return report

}

export { MIN_AVAILABLE_BYTES, safeUrl }
