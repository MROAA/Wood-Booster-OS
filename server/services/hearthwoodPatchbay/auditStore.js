/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * auditStore.js - a thin CRUD wrapper around the `HearthwoodPatch`
 * Prisma model. Its one job beyond plain Prisma calls is to (de)serialise
 * the JSON-string columns (`targetFiles`, `editSpec`, `backupPaths`,
 * `qaResult`) so callers only ever deal in real arrays/objects.
 *
 * Dependency-injected: pass the shared PrismaClient in. No module-level
 * Prisma import, so this file loads without a database or generated
 * client present (Phase 0 import smoke test).
 */

/** Columns stored as JSON text in SQLite. */
const JSON_COLUMNS = ["targetFiles", "editSpec", "backupPaths", "qaResult"]

/** Object -> row: stringify any JSON column that isn't already a string. */
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

/** Row -> object: parse any JSON column that is a non-empty string. */
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

            // Leave the raw string in place rather than throwing - a
            // corrupt row should still be readable in the history UI.

        }

    }

    return out
}

/**
 * createAuditStore(prisma) -> {
 *   create(data)            -> row (deserialised)
 *   get(id)                 -> row | null
 *   list({ archived } = {}) -> row[]   (newest first)
 *   update(id, patch)       -> row
 *   markStatus(id, status)  -> row
 * }
 */
export function createAuditStore(prisma) {

    if (!prisma || !prisma.hearthwoodPatch) {

        throw new Error(
            "createAuditStore: prisma client with a hearthwoodPatch model is required",
        )

    }

    const model = prisma.hearthwoodPatch

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

            const rows = await model.findMany({
                where,
                orderBy: { createdAt: "desc" },
            })

            return rows.map(deserialize)

        },

        async update(id, patch) {

            const row = await model.update({
                where: { id: Number(id) },
                data: serialize(patch),
            })

            return deserialize(row)

        },

        async markStatus(id, status) {

            const row = await model.update({
                where: { id: Number(id) },
                data: { status },
            })

            return deserialize(row)

        },

    }
}

export default createAuditStore
