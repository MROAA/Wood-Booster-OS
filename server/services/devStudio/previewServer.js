import { spawn } from "node:child_process"

import path from "node:path"

import readline from "node:readline"

import fs from "node:fs/promises"

import { PROJECT_ROOT } from "../spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js"

import { computePreviewTarget } from "./previewRouteInference.js"

/*
 * Dev Studion live-esikatselun (Phase 7, osa C) prosessinhallinta.
 *
 * Vain YKSI esikatseluprosessi kerrallaan koko taustapalvelimelle -
 * uuden esikatselun käynnistys tappaa aina edellisen ensin. Tämä on
 * tarkoituksellista: Marc esikatselee aina yhtä asiaa kerrallaan, ja
 * kone pyörittää jo Ollamaa + oikeaa dev-palvelinta + oikeaa
 * taustapalvelinta samaan aikaan - ei ole järkeä pitää useampaa
 * kevyttä Vite-prosessia auki "varalta".
 *
 * Ei väylästöä liikenteen todelliseen tarkkailuun esikatseluvälilehdeltä
 * (selain puhuu suoraan lapsi-Viten kanssa, ei tämän taustapalvelimen
 * kautta) - "jouten olo" approksimoidaan siis yksinkertaisella
 * ajastimella joka nollautuu aina kun jokin tämän moduulin reitti
 * koskee kyseiseen esikatseluun (käynnistys, päivitys tai
 * tilankysely).
 */

const PREVIEW_SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts", "devstudio-preview-server.mjs")

const APP_JSX_PATH = path.join(PROJECT_ROOT, "src", "App.jsx")

const READY_TIMEOUT_MS = 20000

const IDLE_TIMEOUT_MS = 10 * 60 * 1000

let current = null

// current = { setId, child, port, files, url, idleTimer }

function clearIdleTimer() {

    if (current?.idleTimer) {

        clearTimeout(current.idleTimer)

    }

}

function scheduleIdleStop() {

    clearIdleTimer()

    if (!current) {

        return

    }

    current.idleTimer = setTimeout(() => {

        stopPreview().catch(() => {})

    }, IDLE_TIMEOUT_MS)

}

async function stopPreview() {

    if (!current) {

        return { stopped: false }

    }

    clearIdleTimer()

    const child = current.child

    current = null

    try {

        child.kill("SIGTERM")

    } catch {

        // prosessi voi olla jo kuollut - ei väliä

    }

    return { stopped: true }

}

function getPreviewStatus(setId) {

    if (!current || current.setId !== setId) {

        return { running: false }

    }

    scheduleIdleStop()

    return {
        running: true,
        port: current.port,
        url: current.url,
    }

}

async function computeUrlForFiles(files, port) {

    // Jos suunnitelma itse muokkaa App.jsx:ää (esim. "lisää uusi sivu" -
    // pyyntö, joka sekä luo sivun että lisää sille reitin), reittipäättely
    // käyttää EHDOTETTUA App.jsx-sisältöä levyllä olevan sijaan - juuri
    // tämä ehdotettu sisältö on se mitä ylikirjoitus tarjoaa selaimelle
    // esikatselun aikana, joten juuri lisätty reitti on jo "olemassa"
    // esikatselun näkökulmasta vaikka sitä ei ole vielä kirjoitettu levylle.
    const appJsxOverride = files.find(file => file.filePath === "src/App.jsx")

    const appJsxSource = appJsxOverride
        ? appJsxOverride.proposedCode
        : await fs.readFile(APP_JSX_PATH, "utf8")

    const target = computePreviewTarget({ files, appJsxSource, port })

    return target?.url || `http://127.0.0.1:${port}/`

}

async function startPreview({ setId, files }) {

    await stopPreview()

    const url = await new Promise((resolve, reject) => {

        const child = spawn(process.execPath, [PREVIEW_SCRIPT_PATH], {
            cwd: PROJECT_ROOT,
            stdio: ["pipe", "pipe", "pipe"],
        })

        const rl = readline.createInterface({ input: child.stdout })

        let settled = false

        const timeout = setTimeout(() => {

            if (settled) {

                return

            }

            settled = true

            rl.close()

            child.kill("SIGTERM")

            reject(new Error("Esikatselupalvelin ei käynnistynyt ajoissa."))

        }, READY_TIMEOUT_MS)

        rl.on("line", async line => {

            if (settled) {

                return

            }

            let message

            try {

                message = JSON.parse(line)

            } catch {

                return

            }

            if (message.type === "ready") {

                settled = true

                clearTimeout(timeout)

                let resolvedUrl

                try {

                    resolvedUrl = await computeUrlForFiles(files, message.port)

                } catch {

                    resolvedUrl = `http://127.0.0.1:${message.port}/`

                }

                current = {
                    setId,
                    child,
                    port: message.port,
                    files,
                    url: resolvedUrl,
                }

                scheduleIdleStop()

                resolve(resolvedUrl)

                return

            }

            if (message.type === "error") {

                settled = true

                clearTimeout(timeout)

                child.kill("SIGTERM")

                reject(new Error(message.error || "Esikatselupalvelin epäonnistui."))

            }

        })

        child.stderr.on("data", chunk => {

            console.error("[devstudio-preview]", chunk.toString())

        })

        child.on("exit", () => {

            if (current?.child === child) {

                current = null

            }

            if (!settled) {

                settled = true

                clearTimeout(timeout)

                reject(new Error("Esikatselupalvelin sulkeutui käynnistyksen aikana."))

            }

        })

        child.stdin.write(JSON.stringify({ files, preferredPort: 0 }) + "\n")

    })

    return { url, port: current?.port }

}

async function updatePreview({ setId, files }) {

    if (!current || current.setId !== setId) {

        return { updated: false, reason: "no_active_preview_for_set" }

    }

    try {

        const response = await fetch(
            `http://127.0.0.1:${current.port}/__devstudio-preview/update`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files }),
            },
        )

        if (!response.ok) {

            return { updated: false, reason: "update_endpoint_error" }

        }

        current.files = files

        current.url = await computeUrlForFiles(files, current.port)

        scheduleIdleStop()

        return { updated: true, url: current.url }

    } catch (error) {

        return { updated: false, reason: error.message }

    }

}

// Estää orvon lapsiprosessin jos taustapalvelin itse käynnistyy uudelleen
// (esim. nodemon tai Marcin oma manuaalinen restart) kesken esikatselun.
process.on("exit", () => {

    if (current?.child) {

        try {

            current.child.kill("SIGTERM")

        } catch {

            // ei väliä, prosessi on joka tapauksessa kuolemassa

        }

    }

})

export {
    startPreview,
    stopPreview,
    updatePreview,
    getPreviewStatus,
}
