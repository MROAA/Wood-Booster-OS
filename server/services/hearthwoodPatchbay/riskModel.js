/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * riskModel.js - classify a proposed change into a risk tier and the
 * gate it must pass. Pure function, no I/O. Implements plan section A4:
 * tiers are decided by REAL paths (engine dir, save file, critical list)
 * and by the SHAPE of the edit, never by filename keywords.
 *
 * Worst tier wins: every target file and every edit op is checked, and
 * the highest tier any of them produces is the result.
 */

import {
    CRITICAL_FILES,
    HEARTHWOOD_ENGINE_PATHS,
    ALLOWED_TREE_PREFIXES,
    ARRAY_FIELD_NAMES,
    HEARTHWOOD_DATA_DIR,
} from "./paths.js"

const TIER_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

const ARRAY_FIELD_SET = new Set(ARRAY_FIELD_NAMES)

/** Normalise a repo-relative path: forward slashes, no leading ./ or /. */
function normalizeRel(filePath) {

    return String(filePath || "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .replace(/^\/+/, "")
}

/** Higher of two tiers. */
function maxTier(a, b) {

    return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b
}

/** One step up the ladder (LOW->MEDIUM->HIGH), capped below CRITICAL. */
function bumpOne(tier) {

    if (tier === "LOW") {

        return "MEDIUM"

    }

    if (tier === "MEDIUM") {

        return "HIGH"

    }

    return tier
}

function isInsideAllowedTree(rel) {

    return ALLOWED_TREE_PREFIXES.some(prefix => rel.startsWith(prefix))
}

function isEnginePath(rel) {

    return HEARTHWOOD_ENGINE_PATHS.includes(rel)
}

function isHeartwoodComponent(rel) {

    return rel.startsWith("src/components/heartwood/") && rel.endsWith(".jsx")
}

/**
 * Any stylesheet under src/** (in practice
 * src/components/heartwood/heartwood.css). CSS edits are MEDIUM minimum:
 * `vite build` cannot see a visual regression, so a colour/size tweak
 * still has to go through preview + confirm.
 */
function isStyleFile(rel) {

    return rel.startsWith("src/") && rel.endsWith(".css")
}

function isHeartwoodDataFile(rel) {

    return rel.startsWith(`${HEARTHWOOD_DATA_DIR}/`) && rel.endsWith(".js")
}

/** A path segment that addresses an array element (numeric index). */
function isNumericSegment(segment) {

    if (typeof segment === "number") {

        return Number.isInteger(segment) && segment >= 0

    }

    return typeof segment === "string" && /^\d+$/.test(segment)
}

/**
 * classifyRisk({ targetFiles, editSpec }) -> {
 *   tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   reasons: string[],          // human-readable, Finnish ok
 *   requiresConfirm: boolean,   // UI must get an explicit confirm
 *   requiresTypeYes: boolean,   // UI must make the user type YES
 *   allowedModes: ("live" | "pr")[],
 * }
 *
 * targetFiles - repo-relative path strings the change would write.
 * editSpec    - { ops: [{ path, op, value }, ...] } or { mode: "wholeFile" }.
 */
export function classifyRisk({ targetFiles = [], editSpec = {} } = {}) {

    const reasons = []

    const files = (Array.isArray(targetFiles) ? targetFiles : [targetFiles])
        .map(normalizeRel)
        .filter(Boolean)

    const isWholeFile = editSpec != null && editSpec.mode === "wholeFile"

    const ops = editSpec != null && Array.isArray(editSpec.ops)
        ? editSpec.ops
        : []

    let tier = "LOW"

    // ---- structural checks: one per target file, worst wins ----

    for (const rel of files) {

        if (CRITICAL_FILES.includes(rel)) {

            tier = maxTier(tier, "CRITICAL")
            reasons.push(`kriittinen tiedosto: ${rel}`)
            continue

        }

        if (!isInsideAllowedTree(rel)) {

            tier = maxTier(tier, "CRITICAL")
            reasons.push(
                `sijaitsee sallitun puun (src/**, .scratch/**) ulkopuolella: ${rel}`,
            )
            continue

        }

        if (isEnginePath(rel)) {

            tier = maxTier(tier, "HIGH")
            reasons.push(`koskee pelimoottoria: ${rel.split("/").pop()}`)
            continue

        }

        if (isStyleFile(rel)) {

            tier = maxTier(tier, "MEDIUM")
            reasons.push(
                "CSS-muutos: vain esikatselu paljastaa ulkoasuvirheen",
            )
            continue

        }

        if (isHeartwoodComponent(rel)) {

            tier = maxTier(tier, "MEDIUM")
            reasons.push(`koskee Hearthwood-komponenttia: ${rel.split("/").pop()}`)

        }

    }

    // ---- edit-shape checks (only meaningful for op-based edits) ----

    if (!isWholeFile) {

        if (ops.length >= 2) {

            tier = maxTier(tier, "MEDIUM")
            reasons.push(`useita muutoksia kerralla (${ops.length} operaatiota)`)

        }

        for (const op of ops) {

            const path = Array.isArray(op && op.path) ? op.path : []

            if (op && op.op === "addKey") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("lisää uuden avaimen (uutta sisältöä)")

            }

            if (op && op.op === "addField") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("lisää uuden kentän olemassa olevaan entiteettiin")

            }

            if (op && op.op === "removeField") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("poistaa kentän - tarkista ettei mikään muu viittaa siihen")

            }

            if (op && op.op === "removeKey") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("poistaa koko entiteetin - tarkista ettei mikään muu viittaa siihen")

            }

            if (op && op.op === "setImportedImage") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("vaihtaa kuvan (uusi import-lause tiedoston alkuun)")

            }

            if (op && op.op === "setRaw") {

                tier = maxTier(tier, "MEDIUM")
                reasons.push("korvaa monimutkaisen kentän raakana (rakenteellinen muutos)")

            }

            if (path.some(isNumericSegment)) {

                tier = maxTier(tier, "MEDIUM")
                reasons.push(`muokkaa taulukon alkiota: ${path.join(".")}`)

            }

            const arrayField = path.find(
                segment => ARRAY_FIELD_SET.has(String(segment)),
            )

            if (arrayField !== undefined) {

                tier = maxTier(tier, "MEDIUM")
                reasons.push(`muokkaa taulukkokenttää "${arrayField}"`)

            }

        }

    }

    // ---- whole-file edits bump the computed tier one level ----
    // (LOW->MEDIUM, MEDIUM->HIGH; never downgrades an already
    //  HIGH/CRITICAL result, never escalates to CRITICAL.)

    if (isWholeFile) {

        const before = tier

        tier = bumpOne(tier)

        if (tier !== before) {

            reasons.push(
                `koko tiedoston korvaus nostaa riskiluokkaa (${before} -> ${tier})`,
            )

        } else {

            reasons.push("koko tiedoston korvaus (whole-file)")

        }

    }

    if (reasons.length === 0) {

        reasons.push(
            "yksi skalaarikentän muutos olemassa olevaan avaimeen data-tiedostossa",
        )

    }

    const requiresTypeYes = tier === "CRITICAL"

    const requiresConfirm = tier === "MEDIUM"
        || tier === "HIGH"
        || tier === "CRITICAL"

    const allowedModes = (tier === "HIGH" || tier === "CRITICAL")
        ? ["pr"]
        : ["live", "pr"]

    return {
        tier,
        reasons,
        requiresConfirm,
        requiresTypeYes,
        allowedModes,
    }
}

export default classifyRisk
