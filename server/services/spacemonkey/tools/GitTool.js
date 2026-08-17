/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Git Tool
 *
 * Kiinteämuotoiset git/gh-komennot execFile:lla - EI KOSKAAN
 * shell-tulkittua merkkijonoa, sama turvallisuuskuri kuin
 * runVerificationTestSkill.js:llä/runPythonTestSkill.js:llä. Jokainen
 * case tekee täsmälleen yhden execFile-kutsun kiinteällä
 * argumenttitaulukolla; polkuparametrit (repoRoot/worktreeDir) tulevat
 * aina kutsujalta laskettuina PROJECT_ROOTista + crypto.randomUUID():
 * stä, ei koskaan suoraan käyttäjän syötteestä.
 *
 * gh-komento on jo kirjautunut sisään käyttöjärjestelmän
 * avainrenkaaseen (ks. `gh auth status`) ja git delegoi HTTPS-
 * autentikoinnin sille (credential.https://github.com.helper), joten
 * mitään uutta tokenia ei tarvita - sama ketju jota Git Guardian
 * (backend/modules/git_guardian.py) käyttää jo onnistuneesti.
 */

import { execFile } from "node:child_process"

import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const GIT_TIMEOUT_MS = 15000

const NETWORK_TIMEOUT_MS = 30000

const MAX_BUFFER_BYTES = 1_000_000

const PR_URL_PATTERN = /\/pull\/(\d+)\s*$/

const GitTool = {

    id: "git",

    name: "Git Tool",

    description:
        "Fixed-shape git/gh CLI operations via execFile, never a " +
        "shell string.",

    async execute(input = {}) {

        const { action } = input

        try {

            switch (action) {

                case "fetch": {

                    const { repoRoot, ref } = input

                    await execFileAsync(
                        "git",
                        ["fetch", "origin", ref],
                        { cwd: repoRoot, timeout: NETWORK_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "worktreeAdd": {

                    const { repoRoot, worktreeDir, branch, baseRef } = input

                    await execFileAsync(
                        "git",
                        ["worktree", "add", worktreeDir, "-b", branch, baseRef],
                        { cwd: repoRoot, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "worktreeRemove": {

                    const { repoRoot, worktreeDir } = input

                    await execFileAsync(
                        "git",
                        ["worktree", "remove", "--force", worktreeDir],
                        { cwd: repoRoot, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "stageAll": {

                    const { worktreeDir } = input

                    await execFileAsync(
                        "git",
                        ["add", "-A"],
                        { cwd: worktreeDir, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "commit": {

                    const { worktreeDir, message } = input

                    await execFileAsync(
                        "git",
                        ["commit", "-m", message],
                        { cwd: worktreeDir, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "push": {

                    const { worktreeDir, branch } = input

                    await execFileAsync(
                        "git",
                        ["push", "-u", "origin", branch],
                        { cwd: worktreeDir, timeout: NETWORK_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                case "prCreate": {

                    const { worktreeDir, baseBranch, title, body } = input

                    const { stdout } = await execFileAsync(
                        "gh",
                        ["pr", "create", "--base", baseBranch, "--title", title, "--body", body],
                        { cwd: worktreeDir, timeout: NETWORK_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    const prUrl = stdout.trim().split("\n").pop().trim()

                    const numberMatch = prUrl.match(PR_URL_PATTERN)

                    return {
                        success: true,
                        prUrl,
                        prNumber: numberMatch ? Number(numberMatch[1]) : null,
                    }

                }

                case "prView": {

                    const { repoRoot, prNumber } = input

                    const { stdout } = await execFileAsync(
                        "gh",
                        ["pr", "view", String(prNumber), "--json", "state,url,mergeCommit,statusCheckRollup"],
                        { cwd: repoRoot, timeout: NETWORK_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    const parsed = JSON.parse(stdout)

                    return {
                        success: true,
                        state: parsed.state,
                        url: parsed.url,
                        mergeCommitSha: parsed.mergeCommit?.oid || null,
                        statusCheckRollup: parsed.statusCheckRollup || [],
                    }

                }

                case "mergeParentCount": {

                    const { repoRoot, sha } = input

                    const { stdout } = await execFileAsync(
                        "git",
                        ["rev-list", "--parents", "-n", "1", sha],
                        { cwd: repoRoot, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    const tokens = stdout.trim().split(/\s+/)

                    return { success: true, parentCount: tokens.length - 1 }

                }

                case "revert": {

                    const { worktreeDir, sha, mainline } = input

                    await execFileAsync(
                        "git",
                        mainline
                            ? ["revert", "--no-edit", "-m", "1", sha]
                            : ["revert", "--no-edit", sha],
                        { cwd: worktreeDir, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, env: process.env },
                    )

                    return { success: true }

                }

                default:

                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    }

            }

        } catch (error) {

            return {
                success: false,
                error: error.stderr?.toString().trim() || error.message,
            }

        }

    },

}

export default GitTool
