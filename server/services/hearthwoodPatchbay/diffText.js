/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * diffText.js
 *
 * One job: render a unified diff for the history row and the UI, using
 * the same `diff` library (`server/node_modules`) that
 * `server/routes/devStudio.js` already uses for the Dev Studio diff
 * view, so the two surfaces render identically.
 */

import { createPatch } from "diff"

/**
 * unifiedDiff(relPath, oldStr, newStr) -> string
 *
 * A standard unified patch with `relPath` as both the old and new file
 * label. Empty string when the two inputs are identical.
 */
export function unifiedDiff(relPath, oldStr, newStr) {

    const before = String(oldStr ?? "")

    const after = String(newStr ?? "")

    if (before === after) {

        return ""

    }

    return createPatch(String(relPath || "file"), before, after, "", "")
}

export default unifiedDiff
