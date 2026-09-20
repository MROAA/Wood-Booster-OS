/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * server/routes/bloodmoorPatchbay.js
 *
 * Same shape as every other route module: `export default function
 * createXRouter(prisma)`, mounted `app.use("/api", createBloodmoorPatchbayRouter(prisma))`.
 *
 *   GET    /api/bloodmoor-patchbay/entities?type=&q=
 *   GET    /api/bloodmoor-patchbay/entity/:type/:id
 *   POST   /api/bloodmoor-patchbay/preview
 *   POST   /api/bloodmoor-patchbay/:id/apply
 *   POST   /api/bloodmoor-patchbay/:id/revert
 *   GET    /api/bloodmoor-patchbay/doctor
 *   GET    /api/bloodmoor-patchbay          ?archived=
 *   GET    /api/bloodmoor-patchbay/:id
 *
 * A thrown error carrying `httpStatus`/`code` is mapped accordingly.
 */

import express from "express"

import { ENTITY_TYPES } from "../services/bloodmoorPatchbay/paths.js"
import { createAuditStore } from "../services/bloodmoorPatchbay/auditStore.js"
import { listEntities, getEntity } from "../services/bloodmoorPatchbay/entityReader.js"
import {
    preview as previewPatch,
    apply as applyPatchAction,
    revert as revertPatch,
} from "../services/bloodmoorPatchbay/applyPatch.js"
import { runDoctor } from "../services/bloodmoorPatchbay/doctor.js"

export default function createBloodmoorPatchbayRouter(prisma) {

    const router = express.Router()

    const store = createAuditStore(prisma)

    const BASE = "/bloodmoor-patchbay"

    function sendError(res, error) {

        const status = Number.isInteger(error && error.httpStatus) ? error.httpStatus : 500

        if (status >= 500) {

            console.error("[bloodmoor-patchbay]", error)

        }

        const payload = { error: error.message || "unknown error" }

        if (error.code) {

            payload.code = error.code

        }

        if (error.riskTier) {

            payload.riskTier = error.riskTier

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
                    error: `unknown type "${type}"`,
                    knownTypes: Object.keys(ENTITY_TYPES),
                })
            }

            const data = await listEntities(String(type))

            let entities = data.entities

            if (q) {

                const needle = String(q).toLowerCase()

                entities = entities.filter(entity =>
                    String(entity.id || "").toLowerCase().includes(needle)
                    || String(entity.name || "").toLowerCase().includes(needle))

            }

            res.json({ type, file: data.file, exportName: data.exportName, kind: data.kind, entities })

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/entity/:type/:id`, async (req, res) => {

        try {

            const { type, id } = req.params

            if (!ENTITY_TYPES[type]) {

                return res.status(400).json({ error: `unknown type "${type}"` })

            }

            const entity = await getEntity(String(type), String(id))

            if (!entity) {

                return res.status(404).json({ error: `entity ${type}/${id} not found` })

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

                return res.status(400).json({ error: "invalid id" })

            }

            const { confirm, typedYes } = req.body || {}

            const row = await applyPatchAction({ prisma, id, confirm, typedYes })

            res.json(row)

        } catch (error) {

            sendError(res, error)

        }
    })

    router.post(`${BASE}/:id/revert`, async (req, res) => {

        try {

            const id = Number(req.params.id)

            if (!Number.isInteger(id)) {

                return res.status(400).json({ error: "invalid id" })

            }

            const result = await revertPatch({ prisma, id })

            res.json(result)

        } catch (error) {

            sendError(res, error)

        }
    })

    /* -------------------------------------------------------------- *
     * doctor (must be registered before "${BASE}/:id" below)
     * -------------------------------------------------------------- */

    router.get(`${BASE}/doctor`, async (req, res) => {

        try {

            res.json(await runDoctor())

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

            const filter = archived === "true" ? { archived: true } : archived === "false" ? { archived: false } : {}

            res.json(await store.list(filter))

        } catch (error) {

            sendError(res, error)

        }
    })

    router.get(`${BASE}/:id`, async (req, res) => {

        try {

            const id = Number(req.params.id)

            if (!Number.isInteger(id)) {

                return res.status(400).json({ error: "invalid id" })

            }

            const row = await store.get(id)

            if (!row) {

                return res.status(404).json({ error: "patch not found" })

            }

            res.json(row)

        } catch (error) {

            sendError(res, error)

        }
    })

    return router

}
