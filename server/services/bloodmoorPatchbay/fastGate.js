/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * fastGate.js
 *
 * The synchronous QA gate that blocks the apply response: `oxlint
 * <changed files>` then a throwaway `vite build`, both run FROM
 * Bloodmoor's own directory against Bloodmoor's own node_modules/
 * package.json - not Wood-Booster-OS's. Same safe execFile envelope
 * (fixed argv, timeout, maxBuffer, truncation) as Hearthwood Patchbay's
 * fastGate.js.
 *
 *   runFastGate({ changedFiles }) -> { lint: {ok,output}, build: {ok,output} }
 */

import os from "node:os"
import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT } from "./paths.js"

const execFileAsync = promisify(execFile)

const MAX_BUFFER_BYTES = 16_000_000

const MAX_OUTPUT_CHARS = 20000

const LINT_TIMEOUT_MS = 120000

const BUILD_TIMEOUT_MS = 180000

function truncate(text) {

    const value = String(text || "")

    return value.length <= MAX_OUTPUT_CHARS
        ? value
        : value.slice(0, MAX_OUTPUT_CHARS) + "\n... (output truncated)"

}

async function runCommand(command, args, timeout) {

    try {

        const { stdout, stderr } = await execFileAsync(command, args, {
            cwd: PROJECT_ROOT,
            timeout,
            maxBuffer: MAX_BUFFER_BYTES,
            env: process.env,
        })

        return { ok: true, output: truncate(`${stdout}\n${stderr}`.trim()) }

    } catch (error) {

        const combined = `${error.stdout || ""}\n${error.stderr || ""}`.trim()

        return { ok: false, output: truncate(combined || error.message || "command failed") }

    }
}

export async function runFastGate({ changedFiles = [] } = {}) {

    const files = (Array.isArray(changedFiles) ? changedFiles : [changedFiles])
        .map(f => String(f))
        .filter(Boolean)

    const lint = files.length > 0
        ? await runCommand("npx", ["oxlint", ...files], LINT_TIMEOUT_MS)
        : { ok: true, output: "(no changed files to lint)" }

    const tmpDir = path.join(os.tmpdir(), `bm-fg-${randomUUID()}`)

    let build

    try {

        build = await runCommand(
            "npx",
            ["vite", "build", "--outDir", tmpDir, "--emptyOutDir", "--logLevel", "warn"],
            BUILD_TIMEOUT_MS,
        )

    } finally {

        try {

            fs.rmSync(tmpDir, { recursive: true, force: true })

        } catch {
            // best effort
        }
    }

    return { lint, build }

}

export default runFastGate
