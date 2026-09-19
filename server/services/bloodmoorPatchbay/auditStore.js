/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * auditStore.js - a thin CRUD wrapper around the `BloodmoorPatch` Prisma
 * model. Ported verbatim from Hearthwood Patchbay's auditStore.js
 * (generic logic, only the model name differs) - (de)serialises the
 * JSON-string columns so callers only ever deal in real arrays/objects.
 *
 * Dependency-injected: pass the shared PrismaClient in.
 */

const JSON_COLUMNS = ["targetFiles", "editSpec", "backupPaths", "qaResult"]

function serialize(data) {

    if (!data) {

        return data

    }

    const out = { ...data }

    for (const column of JSON_COLUMNS) {

        if (!(column in out)) {

            continue

        }

        const value = out[column]

        if (value === undefined || value === null || typeof value === "string") {

            continue

        }

        out[column] = JSON.stringify(value)

    }

    return out

}

function deserialize(row) {

    if (!row) {

        return row

    }

    const out = { ...row }

    for (const column of JSON_COLUMNS) {

        if (typeof out[column] !== "string" || out[column] === "") {

            continue

        }

        try {

            out[column] = JSON.parse(out[column])

        } catch {
            // leave the raw string rather than throwing
        }

    }

    return out

}

/**
 * createAuditStore(prisma) -> {
 *   create(data), get(id), list({archived}), update(id, patch), markStatus(id, status)
 * }
 */
export function createAuditStore(prisma) {

    if (!prisma || !prisma.bloodmoorPatch) {

        throw new Error("createAuditStore: prisma client with a bloodmoorPatch model is required")

    }

    const model = prisma.bloodmoorPatch

    return {

        async create(data) {

            const row = await model.create({ data: serialize(data) })

            return deserialize(row)

        },

        async get(id) {

            const row = await model.findUnique({ where: { id: Number(id) } })

            return deserialize(row)

        },

        async list({ archived } = {}) {

            const where = {}

            if (typeof archived === "boolean") {

                where.archived = archived

            }

            const rows = await model.findMany({ where, orderBy: { createdAt: "desc" } })

            return rows.map(deserialize)

        },

        async update(id, patch) {

            const row = await model.update({ where: { id: Number(id) }, data: serialize(patch) })

            return deserialize(row)

        },

        async markStatus(id, status) {

            const row = await model.update({ where: { id: Number(id) }, data: { status } })

            return deserialize(row)

        },

    }
}

export default createAuditStore
