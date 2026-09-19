/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * sandbox.js
 *
 * Bloodmoor's own path-safety guard - same shape and same checks as
 * Hearthwood/the generic Dev Studio's projectSandbox.js
 * (server/services/spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js),
 * but a separate module, parameterized to Bloodmoor's own PROJECT_ROOT.
 * Deliberately NOT sharing or modifying the existing sandbox: that one's
 * hardcoded root protects Hearthwood and the generic Dev Studio, and
 * Bloodmoor living at a different absolute path entirely is exactly the
 * case it's designed to reject.
 */

import path from "node:path"

import { PROJECT_ROOT, ALLOWED_TREE_PREFIXES } from "./paths.js"

const BLOCKED_DIR_SEGMENTS = new Set(["node_modules", ".git", ".bloodmoor-patchbay-backups"])

const BLOCKED_FILENAME_PATTERNS = [
    /^\.env(\..+)?$/i,
    /\.pem$/i,
    /\.key$/i,
    /^credentials/i,
    /^secrets/i,
    /^id_rsa/i,
]

const ALLOWED_EXTENSIONS = new Set([".js", ".jsx", ".json", ".css", ".html"])

export const BACKUP_DIR_NAME = ".bloodmoor-patchbay-backups"

/**
 * resolveSafeProjectFilePath(filePath) -> { ok, absolutePath, relativePath }
 * | { ok: false, code }
 */
export function resolveSafeProjectFilePath(filePath) {

    if (!filePath) {

        return { ok: false, code: "missing_file_path" }

    }

    const relative = String(filePath).replace(/^[/\\]+/, "")

    const resolved = path.resolve(PROJECT_ROOT, relative)

    const withinBase =
        resolved === PROJECT_ROOT
        || resolved.startsWith(PROJECT_ROOT + path.sep)

    if (!withinBase) {

        return { ok: false, code: "path_traversal_blocked" }

    }

    const relativeFromRoot = path.relative(PROJECT_ROOT, resolved)

    const segments = relativeFromRoot.split(path.sep)

    if (segments.some(segment => BLOCKED_DIR_SEGMENTS.has(segment))) {

        return { ok: false, code: "blocked_directory" }

    }

    if (!ALLOWED_TREE_PREFIXES.some(prefix => relativeFromRoot.replace(/\\/g, "/").startsWith(prefix))) {

        return { ok: false, code: "outside_allowed_tree" }

    }

    const baseName = path.basename(resolved)

    if (BLOCKED_FILENAME_PATTERNS.some(pattern => pattern.test(baseName))) {

        return { ok: false, code: "sensitive_file_blocked" }

    }

    const extension = path.extname(baseName).toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(extension)) {

        return { ok: false, code: "extension_not_allowed" }

    }

    return { ok: true, absolutePath: resolved, relativePath: relativeFromRoot }

}

export default { PROJECT_ROOT, BACKUP_DIR_NAME, resolveSafeProjectFilePath }
