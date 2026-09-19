/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * riskModel.js - classify a proposed change into a risk tier and the
 * gate it must pass. Pure function, no I/O. Same shape as Hearthwood
 * Patchbay's riskModel.js: tiers are decided by REAL paths (engine
 * files, critical list) and by the SHAPE of the edit, never by filename
 * keywords. Worst tier wins.
 */

import {
    CRITICAL_FILES,
    ENGINE_FILES,
    ALLOWED_TREE_PREFIXES,
    ARRAY_FIELD_NAMES,
} from "./paths.js"

const TIER_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

const ARRAY_FIELD_SET = new Set(ARRAY_FIELD_NAMES)

function normalizeRel(filePath) {

    return String(filePath || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .replace(/^\/+/, "")

}

function maxTier(a, b) {

    return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b

}

function bumpOne(tier) {

    if (tier === "LOW") return "MEDIUM"

    if (tier === "MEDIUM") return "HIGH"

    return tier

}

function isInsideAllowedTree(rel) {

    return ALLOWED_TREE_PREFIXES.some(prefix => rel.startsWith(prefix))

}

function isEnginePath(rel) {

    return ENGINE_FILES.includes(rel)

}

function isNumericSegment(segment) {

    if (typeof segment === "number") {

        return Number.isInteger(segment) && segment >= 0

    }

    return typeof segment === "string" && /^\d+$/.test(segment)

}

/**
 * classifyRisk({ targetFiles, editSpec }) -> {
 *   tier, reasons, requiresConfirm, requiresTypeYes, allowedModes,
 * }
 */
export function classifyRisk({ targetFiles = [], editSpec = {} } = {}) {

    const reasons = []

    const files = (Array.isArray(targetFiles) ? targetFiles : [targetFiles])
        .map(normalizeRel)
        .filter(Boolean)

    const isWholeFile = editSpec != null && editSpec.mode === "wholeFile"

    const ops = editSpec != null && Array.isArray(editSpec.ops) ? editSpec.ops : []

    let tier = "LOW"

    for (const rel of files) {

        if (CRITICAL_FILES.includes(rel)) {

            tier = maxTier(tier, "CRITICAL")
            reasons.push(`critical file: ${rel}`)
            continue

        }

        if (!isInsideAllowedTree(rel)) {

            tier = maxTier(tier, "CRITICAL")
            reasons.push(`outside the allowed tree (src/**): ${rel}`)
            continue

        }

        if (isEnginePath(rel)) {

            tier = maxTier(tier, "HIGH")
            reasons.push(`touches game engine code: ${rel.split("/").pop()}`)
            continue

        }

    }

    if (!isWholeFile) {

        if (ops.length >= 2) {

            tier = maxTier(tier, "MEDIUM")
            reasons.push(`multiple changes at once (${ops.length} ops)`)

        }

        for (const op of ops) {

            const opPath = Array.isArray(op && op.path) ? op.path : []

            if (op && op.op === "addKey") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("adds a new key (new content)")

            }

            if (op && op.op === "addField") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("adds a new field to an existing entity")

            }

            if (op && op.op === "removeField") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("removes a field - check nothing else references it")

            }

            if (op && op.op === "removeKey") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("removes a whole entity - check nothing else references it")

            }

            if (op && op.op === "setRaw") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("replaces a complex field raw (structural change)")

            }

            if (opPath.some(isNumericSegment)) {

                tier = maxTier(tier, "MEDIUM")
                reasons.push(`edits an array element: ${opPath.join(".")}`)

            }

            const arrayField = opPath.find(segment => ARRAY_FIELD_SET.has(String(segment)))

            if (arrayField !== undefined) {

                tier = maxTier(tier, "MEDIUM")
                reasons.push(`edits an array field "${arrayField}"`)

            }

        }

    }

    if (isWholeFile) {

        const before = tier

        tier = bumpOne(tier)

        reasons.push(
            tier !== before
                ? `whole-file replacement raises the risk tier (${before} -> ${tier})`
                : "whole-file replacement",
        )

    }

    if (reasons.length === 0) {

        reasons.push("a single scalar field change on an existing key")

    }

    const requiresTypeYes = tier === "CRITICAL"

    const requiresConfirm = tier !== "LOW"

    const allowedModes = (tier === "HIGH" || tier === "CRITICAL") ? [] : ["live"]

    return { tier, reasons, requiresConfirm, requiresTypeYes, allowedModes }

}

export default classifyRisk
