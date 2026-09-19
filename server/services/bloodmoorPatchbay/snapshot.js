/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * snapshot.js
 *
 * The safety net around every applied edit. Two layers (Hearthwood
 * Patchbay has a third, a whole-tree Git Guardian checkpoint - that's a
 * Wood-Booster-OS-specific external service tied to ITS repo, so it's
 * dropped here rather than faked):
 *
 *  1. writeWithBackup() / revertFromBackup() - a per-file timestamped
 *     `.bak` under Bloodmoor's own `.bloodmoor-patchbay-backups/`
 *     (outside src/, .gitignore'd), with a sha256 conflict guard so a
 *     concurrent change to the live file is rejected rather than
 *     silently clobbered. Direct fs, no Spacemonkey toolBus involved -
 *     editing a data file doesn't need the AI orchestration runtime to
 *     be up.
 *
 *  2. commitToLiveBranch() / commitRevertToLiveBranch() - a commit on
 *     `bloodmoor-patchbay/live` built with git plumbing in a TEMP index
 *     file (GIT_INDEX_FILE), run inside Bloodmoor's OWN repository, so
 *     HEAD, the real index and any in-progress working-tree edits there
 *     are never touched. Every applied patch is therefore also a real
 *     commit Marc can inspect with `git log` from Bloodmoor's own
 *     directory, independent of the .bak files.
 */

import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import crypto from "node:crypto"
import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT } from "./paths.js"
import { resolveSafeProjectFilePath, BACKUP_DIR_NAME } from "./sandbox.js"

const execFileAsync = promisify(execFile)

const LIVE_BRANCH = "bloodmoor-patchbay/live"

export function sha256(text) {

    return crypto.createHash("sha256").update(text ?? "", "utf8").digest("hex")

}

function buildBackupRelativePath(relativePath) {

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    return path.join(BACKUP_DIR_NAME, `${relativePath}.${timestamp}.bak`)

}

/* ------------------------------------------------------------------ *
 * 1. per-file .bak with a conflict guard
 * ------------------------------------------------------------------ */

/**
 * writeWithBackup({ filePath, proposedCode, liveContent }) -> { filePath, backupPath }
 * `liveContent` is the content the proposal was built against - if the
 * file on disk no longer matches it, the write is rejected instead of
 * silently overwriting a change made since the preview.
 */
export async function writeWithBackup({ filePath, proposedCode, liveContent }) {

    const check = resolveSafeProjectFilePath(filePath)

    if (!check.ok) {

        throw new Error(`writeWithBackup: path rejected by sandbox (${check.code})`)

    }

    let currentOnDisk = ""

    try {

        currentOnDisk = fs.readFileSync(check.absolutePath, "utf8")

    } catch {

        currentOnDisk = ""

    }

    if (sha256(currentOnDisk) !== sha256(liveContent ?? "")) {

        throw new Error(
            `writeWithBackup: ${check.relativePath} has changed on disk since this patch was previewed - `
            + "refusing to overwrite, please preview again",
        )
    }

    const backupRel = buildBackupRelativePath(check.relativePath)

    const backupAbs = path.join(PROJECT_ROOT, backupRel)

    fs.mkdirSync(path.dirname(backupAbs), { recursive: true })

    fs.writeFileSync(backupAbs, currentOnDisk, "utf8")

    fs.writeFileSync(check.absolutePath, proposedCode ?? "", "utf8")

    return { filePath: check.relativePath, backupPath: backupRel }

}

/**
 * revertFromBackup({ filePath, proposedCode, backupPath }) -> { filePath }
 * `proposedCode` must equal what is currently on disk (the applied
 * text) - guarded by sha256 before restoring the `.bak`.
 */
export async function revertFromBackup({ filePath, proposedCode, backupPath }) {

    const check = resolveSafeProjectFilePath(filePath)

    if (!check.ok) {

        throw new Error(`revertFromBackup: path rejected by sandbox (${check.code})`)

    }

    if (!backupPath) {

        throw new Error("revertFromBackup: no backupPath on record for this patch")

    }

    const currentOnDisk = fs.readFileSync(check.absolutePath, "utf8")

    if (sha256(currentOnDisk) !== sha256(proposedCode ?? "")) {

        throw new Error(
            `revertFromBackup: ${check.relativePath} does not match the applied text - refusing to revert`,
        )
    }

    const backupAbs = path.join(PROJECT_ROOT, backupPath)

    const backupContent = fs.readFileSync(backupAbs, "utf8")

    fs.writeFileSync(check.absolutePath, backupContent, "utf8")

    return { filePath: check.relativePath }

}

/* ------------------------------------------------------------------ *
 * 2. git-plumbing commit on bloodmoor-patchbay/live
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

async function commitFilesToLiveBranch({ files, message }) {

    const relFiles = (Array.isArray(files) ? files : [files])
        .map(f => String(f).replace(/\\/g, "/").replace(/^\.\//, ""))
        .filter(Boolean)

    if (relFiles.length === 0) {

        throw new Error("commitToLiveBranch: no files")

    }

    const tip = await resolveLiveTip()

    const tmpIndex = path.join(os.tmpdir(), `bm-patchbay-idx-${randomUUID()}`)

    const env = {
        GIT_INDEX_FILE: tmpIndex,
        GIT_AUTHOR_NAME: "Bloodmoor Patchbay",
        GIT_AUTHOR_EMAIL: "patchbay@wood-booster.local",
        GIT_COMMITTER_NAME: "Bloodmoor Patchbay",
        GIT_COMMITTER_EMAIL: "patchbay@wood-booster.local",
    }

    try {

        await git(["read-tree", "HEAD"], env)

        for (const rel of relFiles) {

            const abs = path.join(PROJECT_ROOT, rel)

            const blob = await git(["hash-object", "-w", "--", abs])

            await git(["update-index", "--add", "--cacheinfo", `100644,${blob},${rel}`], env)

        }

        const tree = await git(["write-tree"], env)

        const newCommit = await git(["commit-tree", tree, "-p", tip, "-m", message], env)

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

export async function commitToLiveBranch({ files, summary, code }) {

    const message = `patchbay: ${summary || "change"}` + (code ? ` [${code}]` : "")

    return commitFilesToLiveBranch({ files, message })

}

export async function commitRevertToLiveBranch({ files, summary, code }) {

    const message = `patchbay revert: ${summary || "change"}` + (code ? ` [${code}]` : "")

    return commitFilesToLiveBranch({ files, message })

}

export default {
    writeWithBackup,
    revertFromBackup,
    commitToLiveBranch,
    commitRevertToLiveBranch,
}
