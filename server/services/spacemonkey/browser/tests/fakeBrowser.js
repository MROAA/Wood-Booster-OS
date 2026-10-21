/**
 * Testien Playwright-korvike: sivut kuvataan etukäteen (otsikot,
 * linkit, sivun lataamat pyynnöt). Toteuttaa vain ne API:n osat joita
 * BrowserOperator käyttää, ja kirjaa mitä selaimelle tehtiin.
 */

export function createFakeLauncher(site, { failLaunch = false } = {}) {

    const log = { launched: 0, contexts: [], closedBrowser: false, closedContexts: 0, routedRequests: [] }

    const launcher = async () => {
        if (failLaunch) {
            throw new Error("no browser")
        }

        log.launched += 1

        return {
            async newContext(options) {
                log.contexts.push(options)

                let routeHandler = null

                const context = {
                    async route(pattern, handler) {
                        routeHandler = handler
                    },
                    async newPage() {
                        return createPage(site, () => routeHandler, log)
                    },
                    async close() {
                        log.closedContexts += 1
                    },
                }

                return context
            },
            async close() {
                log.closedBrowser = true
            },
        }
    }

    return { launcher, log }

}

function createPage(site, getRoute, log) {

    const listeners = {}

    let currentUrl = "about:blank"

    const mainFrame = { url: () => currentUrl }

    function emit(event, payload) {
        for (const listener of listeners[event] || []) {
            listener(payload)
        }
    }

    async function request(url, method = "GET") {
        let outcome = "continue"

        await getRoute()({
            request: () => ({ url: () => url, method: () => method }),
            continue: async () => { outcome = "continue" },
            abort: async () => { outcome = "abort" },
        })

        log.routedRequests.push({ url, method, outcome })

        if (outcome === "abort") {
            emit("requestfailed", { url: () => url, failure: () => ({ errorText: "net::ERR_BLOCKED_BY_CLIENT" }) })
        }

        return outcome
    }

    function pageOf() {
        return site.pages[new URL(currentUrl).pathname] || { headings: [], links: [] }
    }

    async function navigate(url) {
        const outcome = await request(url)

        if (outcome === "abort") {
            throw new Error("net::ERR_BLOCKED_BY_CLIENT")
        }

        currentUrl = url

        emit("framenavigated", mainFrame)

        const current = pageOf()

        for (const extra of current.requests || []) {
            const status = await request(extra.url, extra.method || "GET")

            if (status === "continue" && extra.status >= 400) {
                emit("response", { status: () => extra.status, url: () => extra.url })
            }
        }

        for (const text of current.consoleErrors || []) {
            emit("console", { type: () => "error", text: () => text })
        }

        for (const message of current.pageErrors || []) {
            emit("pageerror", new Error(message))
        }
    }

    function headingLocator(options) {
        const match = () => pageOf().headings.filter(heading =>
            heading.level === options.level &&
            (!options.name || heading.text === options.name),
        )

        const locator = {
            first: () => locator,
            async waitFor() {
                if (match().length === 0) {
                    throw new Error(`Timeout waiting for heading level ${options.level}`)
                }
            },
            async innerText() {
                return match()[0].text
            },
            async allInnerTexts() {
                return match().map(heading => heading.text)
            },
        }

        return locator
    }

    function linkLocator(selector) {
        const prefix = selector.match(/^a\[href\^="(.+)"\]$/)[1]

        const matches = () => pageOf().links.filter(link => link.href.startsWith(prefix))

        const nth = index => ({
            async waitFor() {
                if (!matches()[index]) {
                    throw new Error(`Timeout waiting for link ${index}`)
                }
            },
            async innerText() {
                return matches()[index].text
            },
            async getAttribute() {
                return matches()[index].href
            },
            async click() {
                await navigate(new URL(matches()[index].href, currentUrl).href)
            },
        })

        return {
            first: () => nth(0),
            nth,
            async count() {
                return matches().length
            },
        }
    }

    return {
        on(event, listener) {
            listeners[event] = [...(listeners[event] || []), listener]
        },
        mainFrame: () => mainFrame,
        url: () => currentUrl,
        async goto(url) {
            await navigate(url)
        },
        getByRole(role, options) {
            if (role !== "heading") {
                throw new Error(`fake supports headings only, got ${role}`)
            }
            return headingLocator(options)
        },
        locator: linkLocator,
        async waitForURL(predicate) {
            if (!predicate(currentUrl)) {
                throw new Error(`Timeout waiting for URL, at ${currentUrl}`)
            }
        },
        async screenshot() {
            return Buffer.from("PNGDATA")
        },
    }

}

export const PROJECT_SITE = {
    pages: {
        "/projects": {
            headings: [{ level: 1, text: "Projektit" }],
            links: [
                { href: "/projects/35", text: "WP-plugin-testi\nSuunnittelu" },
                { href: "/projects/38", text: "Aurora-pöytä\nSuunnittelu" },
            ],
            requests: [
                { url: "http://localhost:3001/api/projects?token=abc" },
                { url: "https://fonts.googleapis.com/css2?family=Inter" },
                { url: "http://localhost:3001/api/projects/35", method: "DELETE" },
            ],
        },
        "/projects/35": {
            headings: [{ level: 1, text: "Wood-Booster HQ" }, { level: 1, text: "WP-plugin-testi" }],
            links: [],
            requests: [{ url: "http://localhost:3001/api/projects/35" }],
        },
    },
}
