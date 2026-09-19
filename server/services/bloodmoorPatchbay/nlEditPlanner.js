/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * nlEditPlanner.js
 *
 * Plain-language instruction -> concrete edit ops, same local-model
 * approach as Hearthwood Patchbay's nlEditPlanner.js (`qwen2.5-coder:7b`
 * via the shared `generateWithOllama`, no JSON mode - everything about
 * the model's output is treated as hostile and re-validated):
 *
 *   1. the prompt carries ONLY the target entity's small field JSON
 *      (from getEntity) plus the instruction - never the file;
 *   2. a strict "reply with ONLY a JSON object" directive;
 *   3. first `{` .. matching last `}` is extracted, then JSON.parse in
 *      a try/catch;
 *   4. HARD VALIDATOR - every edit's path must resolve to an existing
 *      scalar field on the entity, or it's moved to `rejected`.
 *
 * planEdits() never throws for a model problem.
 */

import { generateWithOllama } from "../ollamaClient.js"
import { getEntity } from "./entityReader.js"

const MODEL = "qwen2.5-coder:7b"

function buildPrompt({ entity, instruction }) {

    const fieldsJson = JSON.stringify(
        Object.fromEntries(
            Object.entries(entity.fields || {}).map(([key, meta]) => [key, meta.value]),
        ),
        null,
        2,
    )

    return [
        "You are a data-editing assistant for a game balance tool.",
        "You are given ONE game entity's current scalar fields and a",
        "change request. Produce the minimal set of field edits that",
        "satisfies the request.",
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
        `{\"edits\":[{\"path\":[\"${entity.id}\",\"baseDamage\"],\"op\":\"set\",\"value\":15}]}`,
    ].join("\n")

}

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
 *   edits, rejected: [{ path?, op?, reason }], model, raw
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
                reason: `local model did not respond (${llm && llm.error ? llm.error : "ollama unavailable"})`,
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
                reason: "could not parse a valid { edits: [...] } object from the model's response",
            }],
            model: MODEL,
            raw: llm.response,
        }
    }

    const edits = []

    const rejected = []

    for (const candidate of parsed.edits) {

        if (!candidate || typeof candidate !== "object") {

            rejected.push({ reason: "op is not an object" })
            continue

        }

        let opPath = Array.isArray(candidate.path) ? candidate.path.slice() : null

        if (!opPath || opPath.length === 0) {

            if (typeof candidate.field === "string") {

                opPath = [entity.id, candidate.field]

            } else {

                rejected.push({ path: candidate.path || null, reason: "path is missing" })
                continue

            }
        }

        if (String(opPath[0]) !== String(entity.id)) {

            opPath = [entity.id, ...opPath]

        }

        if (opPath.length !== 2) {

            rejected.push({
                path: opPath,
                reason: "only a direct edit of an existing scalar field is allowed",
            })
            continue

        }

        const fieldKey = String(opPath[1])

        if (!scalarKeys.has(fieldKey)) {

            rejected.push({ path: opPath, reason: `"${fieldKey}" is not one of this entity's scalar fields` })
            continue

        }

        const value = candidate.value

        const valueType = value === null ? "null" : typeof value

        if (!["number", "string", "boolean"].includes(valueType)) {

            rejected.push({ path: opPath, reason: `value is not a scalar (${valueType})` })
            continue

        }

        edits.push({ path: opPath, op: "set", value })

    }

    return { edits, rejected, model: MODEL, raw: llm.response }

}

export default planEdits
