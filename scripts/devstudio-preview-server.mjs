#!/usr/bin/env node
/*
 * Dev Studion live-esikatselun (Phase 7, osa C) itsenäinen Vite-
 * kehityspalvelin. Käynnistetään lapsiprosessina server/services/devStudio/
 * previewServer.js:stä - EI koskaan suoraan komentoriviltä muussa
 * tarkoituksessa.
 *
 * Elää repon juuressa (ei server/-hakemiston sisällä) jotta se ratkaisee
 * "vite"/"@vitejs/plugin-react"/"@tailwindcss/vite" -riippuvuudet juuren
 * node_modulesista, samalla tavalla kuin oikea `npm run dev` tekisi.
 *
 * Kättely: vanhempi kirjoittaa YHDEN JSON-rivin stdiniin heti
 * käynnistyksen jälkeen: {"files": [...], "preferredPort": number}.
 * Tämä prosessi vastaa YHDELLÄ JSON-rivillä stdoutiin kun palvelin on
 * valmis: {"type": "ready", "port": number} tai epäonnistuessaan
 * {"type": "error", "error": string}.
 *
 * Myöhemmät päivitykset (esim. Marc pyytää tarkistusta kesken
 * esikatselun) EIVÄT kulje enää stdinin kautta - ne menevät suoraan
 * tämän jo käynnissä olevan palvelimen omaan HTTP-päätepisteeseen
 * (POST /__devstudio-preview/update), jonka devstudioPreviewOverlayPlugin
 * rekisteröi alla.
 */

import { createServer } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import path from "node:path"

import fs from "node:fs/promises"

import readline from "node:readline"

import { fileURLToPath } from "node:url"

import { createOverlayStore } from "../server/services/devStudio/previewOverlay.js"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ROOT = path.resolve(currentDirectory, "..")

const HARNESS_INDEX_HTML_PATH = path.join(
    PROJECT_ROOT,
    "src",
    "devstudio-preview",
    "index.html",
)

function readRequestBody(request) {

    return new Promise((resolve, reject) => {

        let raw = ""

        request.on("data", chunk => {
            raw += chunk
        })

        request.on("end", () => resolve(raw))

        request.on("error", reject)

    })

}

function devstudioPreviewOverlayPlugin(store) {

    return {
        name: "devstudio-preview-overlay",
        enforce: "pre",

        resolveId(source, importer) {

            return store.resolveCandidate(source, importer)

        },

        load(id) {

            const content = store.get(id)

            return content === undefined ? null : content

        },

        configureServer(server) {

            server.middlewares.use("/__devstudio-preview/update", async (request, response) => {

                if (request.method !== "POST") {

                    response.statusCode = 405
                    response.end()

                    return

                }

                try {

                    const raw = await readRequestBody(request)

                    const body = JSON.parse(raw || "{}")

                    store.setFiles(body.files || [])

                    server.moduleGraph.invalidateAll()

                    server.ws.send({ type: "full-reload" })

                    response.setHeader("Content-Type", "application/json")
                    response.end(JSON.stringify({ ok: true }))

                } catch (error) {

                    response.statusCode = 400
                    response.end(JSON.stringify({ ok: false, error: error.message }))

                }

            })

            // Viten omien sisäisten middlewarejen (asset- ja moduulipyynnöt)
            // JÄLKEEN ajettava SPA-varapalautus - siksi tämä palautetaan
            // funktiona sen sijaan että middlewares.use kutsuttaisiin
            // suoraan täällä. appType: "custom" (ks. alempana) poistaa Viten
            // oman index.html-käsittelyn kokonaan käytöstä, joten tämä on
            // ainoa paikka joka palauttaa minkäänlaista HTML:ää.
            return () => {

                server.middlewares.use(async (request, response, next) => {

                    if (request.method !== "GET" || !request.headers.accept?.includes("text/html")) {

                        next()

                        return

                    }

                    try {

                        const rawHtml = await fs.readFile(HARNESS_INDEX_HTML_PATH, "utf8")

                        const html = await server.transformIndexHtml(request.url, rawHtml)

                        response.setHeader("Content-Type", "text/html")
                        response.end(html)

                    } catch (error) {

                        next(error)

                    }

                })

            }

        },

    }

}

async function readInitMessage() {

    const rl = readline.createInterface({ input: process.stdin })

    const firstLine = await new Promise(resolve => {
        rl.once("line", resolve)
    })

    rl.close()

    return JSON.parse(firstLine)

}

async function main() {

    let initMessage

    try {

        initMessage = await readInitMessage()

    } catch {

        console.log(JSON.stringify({ type: "error", error: "Virheellinen alustusviesti." }))

        process.exitCode = 1

        return

    }

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles(initMessage.files || [])

    let server

    try {

        server = await createServer({
            root: PROJECT_ROOT,
            base: "./",
            configFile: false,
            appType: "custom",
            plugins: [
                react(),
                tailwindcss(),
                devstudioPreviewOverlayPlugin(store),
            ],
            server: {
                host: "127.0.0.1",
                port: initMessage.preferredPort || 0,
                strictPort: false,
            },
        })

        await server.listen()

    } catch (error) {

        console.log(JSON.stringify({ type: "error", error: error.message }))

        process.exitCode = 1

        return

    }

    const address = server.httpServer?.address()

    const port = typeof address === "object" && address ? address.port : null

    if (!port) {

        console.log(JSON.stringify({ type: "error", error: "Esikatselupalvelimen portin selvitys epäonnistui." }))

        await server.close()

        process.exitCode = 1

        return

    }

    console.log(JSON.stringify({ type: "ready", port }))

    async function shutdown() {

        try {

            await server.close()

        } finally {

            process.exit(0)

        }

    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)

}

main().catch(error => {

    console.log(JSON.stringify({ type: "error", error: error.message }))

    process.exitCode = 1

})
