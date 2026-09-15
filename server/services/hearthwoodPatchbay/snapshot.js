/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * snapshot.js
 *
 * The three-layer protection around every live apply (plan A2):
 *
 *  1. awaitableGitGuardianBackup() - whole-tree checkpoint on the
 *     `git-guardian/backups` branch. Awaited (unlike the fire-and-forget
 *     helper in devStudio) so the returned ref can be stored on the
 *     patch row. Every error -> null, non-fatal.
 *
 *  2. writeWithBackup() / revertFromBackup() - the per-file `.bak`. Runs
 *     the real writeCodeChangeSkill / revertCodeChangeSkill against a
 *     synthetic in-memory draft, so the Patchbay gets the exact same
 *     sha256 conflict guard + timestamped backup + sandbox re-check as
 *     the generic Dev Studio.
 *
 *  3. commitToLiveBranch() / commitRevertToLiveBranch() - a commit on
 *     `hearthwood-patchbay/live` built with git plumbing in a TEMP index
 *     file (GIT_INDEX_FILE), so HEAD, the real index and Marc's dirty
 *     working tree are never touched. Adapted from
 *     backend/modules/git_guardian.py::_commit_snapshot_to_backup_branch
 *     but surgical: only the patch's own files are swapped into HEAD's
 *     tree, nothing is `git add -A`'d.
 */

import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT } from "./paths.js"
import writeCodeChangeSkill, {
    sha256,
} from "../spacemonkey/plugins/CodeChangeDeveloper/skills/writeCodeChangeSkill.js"
import revertCodeChangeSkill from "../spacemonkey/plugins/CodeChangeDeveloper/skills/revertCodeChangeSkill.js"

const execFileAsync = promisify(execFile)

const LIVE_BRANCH = "hearthwood-patchbay/live"

const GG_BASE = "http://127.0.0.1:8002/api/gitguardian"

/* ------------------------------------------------------------------ *
 * 1. Git Guardian
 * ------------------------------------------------------------------ */

/**
 * awaitableGitGuardianBackup() -> { ref } | null
 * POSTs a backup, then reads the newest restore point. Any failure
 * (service down, non-2xx, parse error) resolves to null and logs a
 * warning - it is an extra safety net, never a blocker.
 */
export async function awaitableGitGuardianBackup() {

    try {

        const backupResponse = await fetch(`${GG_BASE}/backup`, { method: "POST" })

        if (!backupResponse.ok) {

            console.warn(
                "[hearthwood-patchbay] git guardian backup non-2xx:",
                backupResponse.status,
            )

            return null
        }

        const pointsResponse = await fetch(`${GG_BASE}/restore-points`)

        if (!pointsResponse.ok) {

            return null

        }

        const points = await pointsResponse.json()

        if (!Array.isArray(points) || points.length === 0) {

            return null

        }

        const newest = points[points.length - 1]

        return { ref: newest.commit || newest.build || null }

    } catch (error) {

        console.warn(
            "[hearthwood-patchbay] git guardian backup unreachable:",
            error.message,
        )

        return null
    }
}

/* ------------------------------------------------------------------ *
 * 2. per-file .bak via the real skills
 * ------------------------------------------------------------------ */

/**
 * writeWithBackup({ toolBus, filePath, proposedCode, liveContent })
 * -> { filePath, backupPath }
 *
 * `filePath` is repo-relative. `liveContent` is the current on-disk text
 * (its sha256 becomes the draft's originalHash, so a concurrent change
 * is rejected instead of silently clobbered).
 */
export async function writeWithBackup({
    toolBus,
    filePath,
    proposedCode,
    liveContent,
}) {

    if (!toolBus) {

        throw new Error("writeWithBackup: toolBus is required")

    }

    const draft = {
        status: "approved",
        filePath,
        proposedCode,
        originalHash: sha256(liveContent ?? ""),
    }

    const result = await writeCodeChangeSkill.execute({ draft, toolBus })

    if (!result || !result.success) {

        throw new Error(
            `writeWithBackup failed (${result && (result.code || result.error)})`,
        )
    }

    return { filePath, backupPath: result.backupPath }
}

/**
 * revertFromBackup({ toolBus, filePath, proposedCode, backupPath })
 * -> the skill result
 *
 * `proposedCode` must equal what is currently on disk (the applied
 * text) - revertCodeChangeSkill sha256-guards it before restoring the
 * `.bak`.
 */
export async function revertFromBackup({
    toolBus,
    filePath,
    proposedCode,
    backupPath,
}) {

    if (!toolBus) {

        throw new Error("revertFromBackup: toolBus is required")

    }

    const draft = {
        status: "written",
        filePath,
        proposedCode,
        backupPath: backupPath ?? null,
    }

    const result = await revertCodeChangeSkill.execute({ draft, toolBus })

    if (!result || !result.success) {

        throw new Error(
            `revertFromBackup failed (${result && (result.code || result.error)})`,
        )
    }

    return result
}

/* ------------------------------------------------------------------ *
 * 3. git-plumbing commit on hearthwood-patchbay/live
 * ------------------------------------------------------------------ */

async function git(args, extraEnv) {

    const { stdout } = await execFileAsync("git", args, {
        cwd: PROJECT_ROOT,
        env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
        maxBuffer: 8_000_000,
    })

    return stdout.trim()
}

async function resolveLiveTip() {

    try {

        return await git(["rev-parse", "--verify", `refs/heads/${LIVE_BRANCH}`])

    } catch {

        const head = await git(["rev-parse", "HEAD"])

        await git(["update-ref", `refs/heads/${LIVE_BRANCH}`, head])

        return head
    }
}

/**
 * Build a commit on `hearthwood-patchbay/live` whose tree is HEAD's tree
 * with each `files[]` entry replaced by a blob of its CURRENT on-disk
 * content. HEAD / index / working tree are untouched (temp index only).
 * Returns the new commit sha.
 */
async function commitFilesToLiveBranch({ files, message }) {

    const relFiles = (Array.isArray(files) ? files : [files])
        .map(f => String(f).replace(/\\/g, "/").replace(/^\.\//, ""))
        .filter(Boolean)

    if (relFiles.length === 0) {

        throw new Error("commitToLiveBranch: no files")

    }

    const tip = await resolveLiveTip()

    const tmpIndex = path.join(os.tmpdir(), `hw-patchbay-idx-${randomUUID()}`)

    const env = {
        GIT_INDEX_FILE: tmpIndex,
        GIT_AUTHOR_NAME: "Hearthwood Patchbay",
        GIT_AUTHOR_EMAIL: "patchbay@wood-booster.local",
        GIT_COMMITTER_NAME: "Hearthwood Patchbay",
        GIT_COMMITTER_EMAIL: "patchbay@wood-booster.local",
    }

    try {

        // Seed the temp index from HEAD's tree.
        await git(["read-tree", "HEAD"], env)

        for (const rel of relFiles) {

            const abs = path.join(PROJECT_ROOT, rel)

            const blob = await git(["hash-object", "-w", "--", abs])

            await git(
                ["update-index", "--add", "--cacheinfo", `100644,${blob},${rel}`],
                env,
            )
        }

        const tree = await git(["write-tree"], env)

        const newCommit = await git(
            ["commit-tree", tree, "-p", tip, "-m", message],
            env,
        )

        await git(["update-ref", `refs/heads/${LIVE_BRANCH}`, newCommit])

        return newCommit

    } finally {

        try {

            fs.rmSync(tmpIndex, { force: true })

        } catch {

            // best effort

        }
    }
}

/**
 * commitToLiveBranch({ files, summary, code }) -> sha
 */
export async function commitToLiveBranch({ files, summary, code }) {

    const message =
        `patchbay: ${summary || "change"}`
        + (code ? ` [${code}]` : "")

    return commitFilesToLiveBranch({ files, message })
}

/**
 * commitRevertToLiveBranch({ files, summary, code }) -> sha
 * The files must already hold their reverted content on disk.
 */
export async function commitRevertToLiveBranch({ files, summary, code }) {

    const message =
        `patchbay revert: ${summary || "change"}`
        + (code ? ` [${code}]` : "")

    return commitFilesToLiveBranch({ files, message })
}

export default {
    awaitableGitGuardianBackup,
    writeWithBackup,
    revertFromBackup,
    commitToLiveBranch,
    commitRevertToLiveBranch,
}
