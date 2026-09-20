/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * server/routes/hearthwoodPatchbay.js
 *
 * The Phase 1 API surface. Same shape as every other route module here:
 * `export default function createXRouter(prisma)`, mounted
 * `app.use("/api", createHearthwoodPatchbayRouter(prisma))` in
 * server/index.js next to createHeartwoodAssistantRouter.
 *
 *   GET    /api/hearthwood-patchbay/entities?type=&q=
 *   GET    /api/hearthwood-patchbay/entity/:type/:id
 *   POST   /api/hearthwood-patchbay/preview
 *   POST   /api/hearthwood-patchbay/:id/apply
 *   POST   /api/hearthwood-patchbay/:id/revert
 *   GET    /api/hearthwood-patchbay          ?archived=
 *   GET    /api/hearthwood-patchbay/:id
 *   DELETE /api/hearthwood-patchbay/:id/preview
 *
 * A thrown error carrying `code:"requires_pr"` (or any `httpStatus`) is
 * mapped to that status; `requires_pr` also returns `allowedModes`.
 */

import express from "express"
import multer from "multer"

import { ENTITY_TYPES, HEARTHWOOD_STYLE_FILES } from "../services/hearthwoodPatchbay/paths.js"
import { createAuditStore } from "../services/hearthwoodPatchbay/auditStore.js"
import {
    listEntities,
    getEntity,
    listStyleRules,
} from "../services/hearthwoodPatchbay/entityReader.js"
import {
    preview as previewPatch,
    apply as applyPatchAction,
    revert as revertPatch,
    stopPreviewFor,
} from "../services/hearthwoodPatchbay/applyPatch.js"
import { runDoctor } from "../services/hearthwoodPatchbay/doctor.js"
import { startBalanceRun, getBalanceJob } from "../services/hearthwoodPatchbay/balanceRunner.js"
import { saveUploadedImage } from "../services/hearthwoodPatchbay/imageUpload.js"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
})

export default function createHearthwoodPatchbayRouter(prisma) {

    const router = express.Router()

    const store = createAuditStore(prisma)

    const BASE = "/hearthwood-patchbay"

    function sendError(res, error) {

        const status = Number.isInteger(error && error.httpStatus)
            ? error.httpStatus
            : 500

        if (status >= 500) {

            console.error("[hearthwood-patchbay]", error)

        }

        const payload = { error: error.message || "tuntematon virhe" }

        if (error.code) {

            payload.code = error.code

        }

        if (error.allowedModes) {

            payload.allowedModes = error.allowedModes

        }

        res.status(status).json(payload)
    }

    /* -------------------------------------------------------------- *
     * entity browser
     * -------------------------------------------------------------- */

    router.get(`${BASE}/entities`, async (req, res) => {

        try {

            const { type, q } = req.query

            if (!type || !ENTITY_TYPES[type]) {

                return res.status(400).json({
                    error: `tuntematon type "${type}"`,
                    knownTypes: Object.keys(ENTITY_TYPES),
                })
            }

            const data = await listEntities(String(type))

            let entities = data.entities

            if (q) {

                const needle = String(q).toLowerCase()

                entities = entities.filter(entity =>
                    String(entity.id || "").toLowerCase().includes(needle)
                    || String(entity.name || "").toLowerCase().includes(needle),
                )
            }

            res.json({
                type,
                file: data.file,
                exportName: data.exportName,
                entities,
            })

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * dashboard overview + universal search (Marc, 2026-09-20: "tahdon
     * paljon eri toiminnallisuuksia dev studioon" / "selkeä, yksinkertainen
     * ja tehokas" - picked "easier ways to find/use what's already
     * editable" over new game systems). Both loop every ENTITY_TYPES key
     * through the same cached `listEntities` the /entities route already
     * uses - cheap, since a type's read is cached by its data file's
     * mtime and only reparsed after a real edit.
     * -------------------------------------------------------------- */

    router.get(`${BASE}/overview`, async (req, res) => {

        try {

            const types = await Promise.all(
                Object.keys(ENTITY_TYPES).map(async type => {

                    try {

                        const data = await listEntities(type)

                        return { type, count: data.entities.length }

                    } catch (error) {

                        return { type, count: 0, error: error.message }

                    }
                }),
            )

            res.json({
                types,
                totalEntities: types.reduce((sum, entry) => sum + entry.count, 0),
            })

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/search`, async (req, res) => {

        try {

            const q = String(req.query.q || "").trim().toLowerCase()

            if (!q) {

                return res.json({ query: "", results: [] })

            }

            const perType = await Promise.all(
                Object.keys(ENTITY_TYPES).map(async type => {

                    try {

                        const data = await listEntities(type)

                        return data.entities
                            .filter(entity =>
                                String(entity.id || "").toLowerCase().includes(q)
                                || String(entity.name || "").toLowerCase().includes(q),
                            )
                            .map(entity => ({ type, id: entity.id, name: entity.name }))

                    } catch {

                        return []

                    }
                }),
            )

            const results = perType.flat().slice(0, 80)

            res.json({ query: q, results })

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/entity/:type/:id`, async (req, res) => {

        try {

            const { type, id } = req.params

            if (!ENTITY_TYPES[type]) {

                return res.status(400).json({ error: `tuntematon type "${type}"` })

            }

            const entity = await getEntity(String(type), String(id))

            if (!entity) {

                return res.status(404).json({ error: `entiteettiä ${type}/${id} ei löytynyt` })

            }

            res.json(entity)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * styles (Marc, 2026-09-20: "haluan muokata pelin visuaalista
     * ilmettä" - a Colors & Theme panel reads the .hw-root custom
     * properties through here, edits them via the same generic
     * { edits: [{selector, prop, value}] } shape /preview already
     * accepts for CSS)
     * -------------------------------------------------------------- */

    router.get(`${BASE}/styles`, async (req, res) => {

        try {

            const file = req.query.file
                ? String(req.query.file)
                : HEARTHWOOD_STYLE_FILES[0]

            if (!HEARTHWOOD_STYLE_FILES.includes(file)) {

                return res.status(400).json({
                    error: `tuntematon style-tiedosto "${file}"`,
                    knownFiles: HEARTHWOOD_STYLE_FILES,
                })
            }

            const data = await listStyleRules(file)

            res.json(data)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * image upload (saves the asset only - wiring it into an entity is
     * a normal preview/apply "setImportedImage" edit, see below)
     * -------------------------------------------------------------- */

    router.post(`${BASE}/upload-image`, upload.single("file"), async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({ error: "tiedosto puuttuu (kentän nimi: file)" })

            }

            const { type, entityId } = req.body || {}

            const result = saveUploadedImage({
                type,
                entityId,
                originalName: req.file.originalname,
                buffer: req.file.buffer,
            })

            res.status(201).json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * preview / apply / revert
     * -------------------------------------------------------------- */

    router.post(`${BASE}/preview`, async (req, res) => {

        try {

            const result = await previewPatch({ prisma, body: req.body || {} })

            res.status(201).json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.post(`${BASE}/:id/apply`, async (req, res) => {

        try {

            const id = Number(req.params.id)

            if (!Number.isInteger(id)) {

                return res.status(400).json({ error: "virheellinen id" })

            }

            const { applyMode, confirm, typedYes } = req.body || {}

            const row = await applyPatchAction({
                prisma,
                id,
                applyMode: applyMode || "live",
                confirm,
                typedYes,
            })

            res.json(row)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.post(`${BASE}/:id/revert`, async (req, res) => {

        try {

            const id = Number(req.params.id)

            if (!Number.isInteger(id)) {

                return res.status(400).json({ error: "virheellinen id" })

            }

            const result = await revertPatch({ prisma, id })

            res.json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * doctor (must be registered before the "${BASE}/:id" GET below,
     * or Express would match "doctor" as an :id and 400 on it)
     * -------------------------------------------------------------- */

    router.get(`${BASE}/doctor`, async (req, res) => {

        try {

            const result = await runDoctor()

            res.json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * balance test (on-demand fairness run, independent of any patch)
     * -------------------------------------------------------------- */

    router.post(`${BASE}/balance-test`, async (req, res) => {

        try {

            const { runs } = req.body || {}

            const result = await startBalanceRun({ runs })

            res.status(202).json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/balance-test`, async (req, res) => {

        try {

            res.json(getBalanceJob() || { status: "idle" })

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * history
     * -------------------------------------------------------------- */

    router.get(BASE, async (req, res) => {

        try {

            const { archived } = req.query

            const filter = archived === "true"
                ? { archived: true }
                : archived === "false"
                    ? { archived: false }
                    : {}

            const rows = await store.list(filter)

            res.json(rows)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/:id`, async (req, res) => {

        try {

            const id = Number(req.params.id)

            if (!Number.isInteger(id)) {

                return res.status(400).json({ error: "virheellinen id" })

            }

            const row = await store.get(id)

            if (!row) {

                return res.status(404).json({ error: "patchia ei löytynyt" })

            }

            res.json(row)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.delete(`${BASE}/:id/preview`, async (req, res) => {

        try {

            const result = await stopPreviewFor(Number(req.params.id))

            res.json(result || { stopped: false })

        } catch (error) {

            sendError(res, error)

        }
    })

    return router
}
