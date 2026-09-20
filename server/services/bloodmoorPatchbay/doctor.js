/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * doctor.js
 *
 * A read-only health check for everything this Patchbay depends on.
 * Never writes, never blocks an apply - purely diagnostic for the
 * DoctorPanel button. Ported from Hearthwood Patchbay's doctor.js, with
 * the Git Guardian check dropped (that's a Wood-Booster-OS-specific
 * external service Bloodmoor doesn't use) and a check added for
 * Bloodmoor's own dev server, since applied changes only become visible
 * to Marc once that picks them up via its own HMR.
 *
 *   runDoctor() -> { checks: [{ name, ok, detail }], healthy }
 *
 * Ollama and the dev-server check are optional (degrade gracefully, see
 * nlEditPlanner.js) so their failure is reported but doesn't flip
 * `healthy` to false.
 */

import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT } from "./paths.js"

const execFileAsync = promisify(execFile)

const COMMAND_TIMEOUT_MS = 10000

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"

const BLOODMOOR_DEV_URL = process.env.BLOODMOOR_DEV_URL || "http://localhost:5180"

async function checkBalanceFile() {

    const abs = path.join(PROJECT_ROOT, "src/game/balance.js")

    const ok = fs.existsSync(abs)

    return { name: "balance.js", ok, detail: ok ? abs : `missing: ${abs}` }

}

async function checkGitStatus() {

    try {

        const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
            cwd: PROJECT_ROOT,
            timeout: COMMAND_TIMEOUT_MS,
        })

        const count = stdout.split("\n").filter(Boolean).length

        return { name: "Git status", ok: true, detail: `${count} changed file(s)` }

    } catch (error) {

        return { name: "Git status", ok: false, detail: error.message }

    }
}

async function checkCommandVersion(name, command, args) {

    try {

        const { stdout } = await execFileAsync(command, args, {
            cwd: PROJECT_ROOT,
            timeout: COMMAND_TIMEOUT_MS,
        })

        return { name, ok: true, detail: stdout.trim().split("\n")[0] }

    } catch (error) {

        return { name, ok: false, detail: error.message }

    }
}

async function checkOllama() {

    try {

        const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) })

        if (!response.ok) {

            return { name: "Ollama (NL edit box)", ok: false, detail: `HTTP ${response.status}` }

        }

        const data = await response.json()

        const count = Array.isArray(data.models) ? data.models.length : 0

        return { name: "Ollama (NL edit box)", ok: true, detail: `${count} model(s) available` }

    } catch {

        return { name: "Ollama (NL edit box)", ok: false, detail: "unreachable - sheet editor still works" }

    }
}

async function checkDevServer() {

    try {

        const response = await fetch(BLOODMOOR_DEV_URL, { signal: AbortSignal.timeout(4000) })

        return {
            name: "Bloodmoor dev server",
            ok: response.ok,
            detail: response.ok ? BLOODMOOR_DEV_URL : `HTTP ${response.status}`,
        }

    } catch {

        return {
            name: "Bloodmoor dev server",
            ok: false,
            detail: "unreachable - applied changes will only show once it's running",
        }

    }
}

export async function runDoctor() {

    const checks = await Promise.all([
        checkBalanceFile(),
        checkGitStatus(),
        checkCommandVersion("oxlint", "npx", ["oxlint", "--version"]),
        checkCommandVersion("vite", "npx", ["vite", "--version"]),
        checkOllama(),
        checkDevServer(),
    ])

    const REQUIRED = new Set(["balance.js", "Git status", "oxlint", "vite"])

    const healthy = checks.every(check => !REQUIRED.has(check.name) || check.ok)

    return { checks, healthy }

}

export default { runDoctor }
