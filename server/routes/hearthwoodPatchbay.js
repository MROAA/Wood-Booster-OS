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

import { ENTITY_TYPES } from "../services/hearthwoodPatchbay/paths.js"
import { createAuditStore } from "../services/hearthwoodPatchbay/auditStore.js"
import {
    listEntities,
    getEntity,
} from "../services/hearthwoodPatchbay/entityReader.js"
import {
    preview as previewPatch,
    apply as applyPatchAction,
    revert as revertPatch,
    stopPreviewFor,
} from "../services/hearthwoodPatchbay/applyPatch.js"

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
