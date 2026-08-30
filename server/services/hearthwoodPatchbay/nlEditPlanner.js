/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * nlEditPlanner.js
 *
 * Marc's primary input path: a plain-Finnish instruction -> concrete
 * edit ops. Uses the local model only (`qwen2.5-coder:7b` via
 * `generateWithOllama` - no JSON mode), so everything about the output
 * is treated as hostile:
 *
 *   1. the prompt carries ONLY the target entity's small field JSON
 *      (from getEntity) plus the instruction - never the file;
 *   2. a strict "reply with ONLY a JSON object" directive;
 *   3. first `{` .. matching last `}` is extracted, then JSON.parse in
 *      a try/catch;
 *   4. HARD VALIDATOR - every `edits[].path` must resolve to an existing
 *      scalar field on the entity, or the op is moved to `rejected`
 *      with a reason. Un-validated ops are never returned.
 *
 * planEdits() never throws for a model problem - Ollama down, bad JSON
 * and every-op-rejected all come back as a normal result with an empty
 * `edits` array and a populated `rejected` array.
 */

import { generateWithOllama } from "../ollamaClient.js"
import { getEntity } from "./entityReader.js"

const MODEL = "qwen2.5-coder:7b"

function buildPrompt({ entity, instruction }) {

    const fieldsJson = JSON.stringify(
        Object.fromEntries(
            Object.entries(entity.fields || {}).map(
                ([key, meta]) => [key, meta.value],
            ),
        ),
        null,
        2,
    )

    return [
        "You are a data-editing assistant for a game balance tool.",
        "You are given ONE game entity's current scalar fields and a",
        "change request in Finnish. Produce the minimal set of field",
        "edits that satisfies the request.",
        "",
        `Entity id: ${entity.id}`,
        "Current scalar fields (JSON):",
        fieldsJson,
        "",
        `Change request: ${instruction}`,
        "",
        "Rules:",
        "- Only edit fields that already exist in the JSON above.",
        "- Each edit sets one field to one new scalar value",
        "  (number, string or boolean).",
        `- path is always [\"${entity.id}\", \"<fieldName>\"].`,
        "- Do NOT invent new fields. Do NOT touch arrays or objects.",
        "",
        "Reply with ONLY a JSON object, no prose, no code fence:",
        `{\"edits\":[{\"path\":[\"${entity.id}\",\"maxHp\"],\"op\":\"set\",\"value\":40}]}`,
    ].join("\n")
}

/** first `{` .. matching last `}` -> parsed object, or null. */
function extractJsonObject(text) {

    const raw = String(text || "")

    const first = raw.indexOf("{")

    const last = raw.lastIndexOf("}")

    if (first === -1 || last === -1 || last <= first) {

        return null

    }

    try {

        return JSON.parse(raw.slice(first, last + 1))

    } catch {

        return null

    }
}

/**
 * planEdits({ type, entityId, instruction }) -> {
 *   edits:    validated ops (may be []),
 *   rejected: [{ path?, op?, reason }],
 *   model, raw
 * }
 */
export async function planEdits({ type, entityId, instruction }) {

    const entity = await getEntity(type, entityId)

    if (!entity) {

        return {
            edits: [],
            rejected: [{ reason: `entity ${type}/${entityId} not found` }],
            model: MODEL,
            raw: null,
        }
    }

    const scalarKeys = new Set(Object.keys(entity.fields || {}))

    const prompt = buildPrompt({ entity, instruction })

    const llm = await generateWithOllama({ prompt, model: MODEL })

    if (!llm || !llm.success) {

        return {
            edits: [],
            rejected: [{
                reason:
                    "paikallinen malli ei vastannut "
                    + `(${llm && llm.error ? llm.error : "ollama unavailable"})`,
            }],
            model: MODEL,
            raw: null,
        }
    }

    const parsed = extractJsonObject(llm.response)

    if (!parsed || !Array.isArray(parsed.edits)) {

        return {
            edits: [],
            rejected: [{
                reason:
                    "mallin vastauksesta ei saatu jäsennettyä "
                    + "kelvollista { edits: [...] } -oliota",
            }],
            model: MODEL,
            raw: llm.response,
        }
    }

    const edits = []

    const rejected = []

    for (const candidate of parsed.edits) {

        if (!candidate || typeof candidate !== "object") {

            rejected.push({ reason: " op ei ole olio" })
            continue

        }

        let opPath = Array.isArray(candidate.path) ? candidate.path.slice() : null

        if (!opPath || opPath.length === 0) {

            // model may have emitted just the field name
            if (typeof candidate.field === "string") {

                opPath = [entity.id, candidate.field]

            } else {

                rejected.push({ path: candidate.path || null, reason: "path puuttuu" })
                continue

            }
        }

        // Normalise: ensure the entity id is the first segment.
        if (String(opPath[0]) !== String(entity.id)) {

            opPath = [entity.id, ...opPath]

        }

        if (opPath.length !== 2) {

            rejected.push({
                path: opPath,
                reason:
                    "vain olemassa olevan skalaarikentän suora muutos on "
                    + "sallittu (taulukot/oliot vaativat koko tiedoston muokkauksen)",
            })
            continue

        }

        const fieldKey = String(opPath[1])

        if (!scalarKeys.has(fieldKey)) {

            rejected.push({
                path: opPath,
                reason: `kenttää "${fieldKey}" ei ole entiteetin skalaarikentissä`,
            })
            continue

        }

        const value = candidate.value

        const valueType = value === null ? "null" : typeof value

        if (!["number", "string", "boolean"].includes(valueType)) {

            rejected.push({
                path: opPath,
                reason: `arvo ei ole skalaari (${valueType})`,
            })
            continue

        }

        edits.push({ path: opPath, op: "set", value })

    }

    return {
        edits,
        rejected,
        model: MODEL,
        raw: llm.response,
    }
}

export default planEdits
