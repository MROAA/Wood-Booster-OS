/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * balanceRunner.js
 *
 * On-demand "Aja tasapainotesti" (plan's Balance-tuning flow, A5):
 * spawns/reuses a dedicated Vite dev server, runs the existing
 * `.scratch/heartwood-fairness-pass.mjs` "realistic bot" simulation
 * against it, and parses its per-commander win-rate summary.
 *
 * Deliberately NOT the full Phase 2 design (no before/after diff tied
 * to a specific patch, no auto-run on every balance-bearing apply) -
 * this is the standalone "Aja tasapainotesti" button the plan calls
 * out as useful on its own, independent of a patch. A single
 * module-level `job` - this tool is local/single-user (R8), so one
 * concurrent run is the right model, not a queue.
 *
 *   startBalanceRun({ runs }) -> { status: "running", runs }  (fire-and-forget)
 *   getBalanceJob() -> the current/last job snapshot, or null
 */

import path from "node:path"
import { spawn, execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT } from "./paths.js"

const execFileAsync = promisify(execFile)

// Same dedicated port the plan's Phase 2 smoke runner reserves (R3) -
// keeping balance runs off it too would just mean inventing a second
// number; reuse-if-already-serving covers both callers.
const PORT = 5199

const SCRIPT_PATH = path.join(PROJECT_ROOT, ".scratch", "heartwood-fairness-pass.mjs")

const SERVER_READY_TIMEOUT_MS = 20000

const MAX_RUN_TIMEOUT_MS = 15 * 60 * 1000

const MAX_BUFFER_BYTES = 16_000_000

let job = null

async function probe200(url, timeoutMs) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    return response.status === 200
  } catch {
    return false
  }
}

async function waitFor200(url, totalTimeoutMs) {
  const deadline = Date.now() + totalTimeoutMs

  while (Date.now() < deadline) {
    if (await probe200(url, 2000)) {
      return true
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return false
}

/**
 * Reuses a Vite dev server already serving /heartwood on PORT, else
 * spawns one. Returns { child } - child is null when reused (never
 * kill something we didn't start).
 */
async function ensureViteServer() {
  const heartwoodUrl = `http://localhost:${PORT}/heartwood`

  if (await probe200(heartwoodUrl, 1500)) {
    return { child: null }
  }

  const child = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: PROJECT_ROOT,
    stdio: "ignore",
  })

  const ready = await waitFor200(heartwoodUrl, SERVER_READY_TIMEOUT_MS)

  if (!ready) {
    child.kill("SIGTERM")
    throw new Error(`vite-esikatselupalvelin ei vastannut porttiin ${PORT} ajoissa`)
  }

  return { child }
}

/** Pulls the "=== per-commander win rate ... ===" block into rows. */
function parseWinRates(stdout) {
  const lines = String(stdout || "").split("\n")

  const rows = []

  let inSection = false

  for (const line of lines) {
    if (line.includes("per-commander win rate")) {
      inSection = true
      continue
    }

    if (!inSection) {
      continue
    }

    const match = line.match(/^(\S+):\s*(\d+)\/(\d+)\s*\((\d+)%\)/)

    if (match) {
      rows.push({
        character: match[1],
        wins: Number(match[2]),
        total: Number(match[3]),
        pct: Number(match[4]),
      })
      continue
    }

    if (line.trim() === "") {
      break
    }
  }

  return rows
}

export function getBalanceJob() {
  return job
}

export async function startBalanceRun({ runs = 25 } = {}) {
  if (job && job.status === "running") {
    throw Object.assign(new Error("tasapainotesti on jo käynnissä"), { httpStatus: 409 })
  }

  const runCount = Math.max(1, Math.min(200, Number(runs) || 25))

  job = { status: "running", runs: runCount, startedAt: new Date().toISOString() }

  void (async () => {
    let serverHandle = null

    try {
      serverHandle = await ensureViteServer()

      const { stdout } = await execFileAsync(
        process.execPath,
        [SCRIPT_PATH],
        {
          cwd: PROJECT_ROOT,
          timeout: MAX_RUN_TIMEOUT_MS,
          maxBuffer: MAX_BUFFER_BYTES,
          env: { ...process.env, PORT: String(PORT), RUNS: String(runCount) },
        },
      )

      job = {
        status: "done",
        runs: runCount,
        startedAt: job.startedAt,
        finishedAt: new Date().toISOString(),
        winRates: parseWinRates(stdout),
        raw: stdout,
      }
    } catch (error) {
      job = {
        status: "error",
        runs: runCount,
        startedAt: job.startedAt,
        finishedAt: new Date().toISOString(),
        error: String((error && (error.stderr || error.message)) || error),
      }
    } finally {
      if (serverHandle && serverHandle.child) {
        serverHandle.child.kill("SIGTERM")
      }
    }
  })()

  return { status: "running", runs: runCount }
}

export default { startBalanceRun, getBalanceJob }
