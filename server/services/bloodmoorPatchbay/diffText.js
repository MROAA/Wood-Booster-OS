/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * diffText.js
 *
 * One job: render a unified diff for the history row and the UI, using
 * the same `diff` library the generic Dev Studio and Hearthwood Patchbay
 * already use, so all three render identically. Ported verbatim from
 * hearthwoodPatchbay/diffText.js - no project-specific logic here.
 */

import { createPatch } from "diff"

/**
 * unifiedDiff(relPath, oldStr, newStr) -> string
 * Empty string when the two inputs are identical.
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
