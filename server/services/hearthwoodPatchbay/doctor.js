/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * doctor.js
 *
 * A read-only health check for everything Patchbay depends on, ported
 * from Marc's Python prototype's doctor() list (README.md's concept
 * table). Never writes, never blocks an apply - purely diagnostic for
 * the DoctorPanel button in Hearthwood Studio.
 *
 *   runDoctor() -> { checks: [{ name, ok, detail }], healthy }
 *
 * `healthy` is true only when every check that CAN fail the tool
 * (data dir, oxlint, vite) passes - Ollama and Git Guardian are
 * optional dependencies (NL box / snapshot degrade gracefully without
 * them, see nlEditPlanner.js / snapshot.js) so their failure is
 * reported but does not flip `healthy` to false.
 */

import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT, HEARTHWOOD_DATA_DIR } from "./paths.js"

const execFileAsync = promisify(execFile)

const COMMAND_TIMEOUT_MS = 10000

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"

const GIT_GUARDIAN_URL = "http://127.0.0.1:8002/api/gitguardian/restore-points"

async function checkDataDir() {
  const dir = path.join(PROJECT_ROOT, HEARTHWOOD_DATA_DIR)

  const ok = fs.existsSync(dir) && fs.statSync(dir).isDirectory()

  return { name: "Pelidata (src/data/heartwood)", ok, detail: ok ? dir : `puuttuu: ${dir}` }
}

async function checkGitStatus() {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
      cwd: PROJECT_ROOT,
      timeout: COMMAND_TIMEOUT_MS,
    })

    const count = stdout.split("\n").filter(Boolean).length

    // Raportoiva, ei koskaan estävä (R6) - likainen puu on Marcin
    // normaalitila.
    return { name: "Git-tila", ok: true, detail: `${count} muuttunutta tiedostoa` }
  } catch (error) {
    return { name: "Git-tila", ok: false, detail: error.message }
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
      return { name: "Ollama (omin sanoin -laatikko)", ok: false, detail: `HTTP ${response.status}` }
    }

    const data = await response.json()
    const count = Array.isArray(data.models) ? data.models.length : 0

    return { name: "Ollama (omin sanoin -laatikko)", ok: true, detail: `${count} mallia saatavilla` }
  } catch (error) {
    return { name: "Ollama (omin sanoin -laatikko)", ok: false, detail: "ei tavoitettavissa - kenttäeditori toimii silti" }
  }
}

async function checkGitGuardian() {
  try {
    const response = await fetch(GIT_GUARDIAN_URL, { signal: AbortSignal.timeout(4000) })

    if (!response.ok) {
      return { name: "Git Guardian (varmuuskopiot)", ok: false, detail: `HTTP ${response.status}` }
    }

    const points = await response.json()

    return {
      name: "Git Guardian (varmuuskopiot)",
      ok: true,
      detail: `${Array.isArray(points) ? points.length : 0} palautuspistettä`,
    }
  } catch {
    return { name: "Git Guardian (varmuuskopiot)", ok: false, detail: "ei tavoitettavissa - .bak-tiedostot suojaavat silti" }
  }
}

export async function runDoctor() {
  const checks = await Promise.all([
    checkDataDir(),
    checkGitStatus(),
    checkCommandVersion("oxlint", "npx", ["oxlint", "--version"]),
    checkCommandVersion("vite", "npx", ["vite", "--version"]),
    checkOllama(),
    checkGitGuardian(),
  ])

  const REQUIRED = new Set(["Pelidata (src/data/heartwood)", "Git-tila", "oxlint", "vite"])

  const healthy = checks.every(check => !REQUIRED.has(check.name) || check.ok)

  return { checks, healthy }
}

export default { runDoctor }
