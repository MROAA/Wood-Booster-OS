/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Inventory Git Helpers
 *
 * Vain lukevat git-kyselyt Atlasille ja agentti-inventaariolle: haara,
 * commit, keskeneräiset muutokset ja missä haaroissa polku on olemassa.
 * Mikään näistä ei muuta repositoriota.
 */

import { execFile, spawn } from "node:child_process"

import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const GIT_TIMEOUT_MS = 10000

// Porcelain-tulosteessa rivin alun välilyönti on merkitsevä (" M polku"),
// joten siitä poistetaan vain lopun tyhjät.
async function git(root, args, { keepLeading = false } = {}) {

    try {
        const { stdout } = await execFileAsync(
            "git",
            ["-C", root, ...args],
            { timeout: GIT_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 },
        )

        return keepLeading ? stdout.trimEnd() : stdout.trim()
    } catch {
        return null
    }

}

export async function gitStamp(root) {

    const [branch, commit] = await Promise.all([
        git(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
        git(root, ["rev-parse", "--short", "HEAD"]),
    ])

    return { branch, commit }

}

export async function resolveRef(root, ref) {

    return git(root, ["rev-parse", "--verify", "--short", `${ref}^{commit}`])

}

/**
 * Polut joissa on commitoimattomia muutoksia (git status --porcelain).
 */
export async function uncommittedPaths(root) {

    const output = await git(
        root,
        ["status", "--porcelain", "--untracked-files=all"],
        { keepLeading: true },
    )

    if (!output) {
        return []
    }

    return output
        .split("\n")
        .map(line => line.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""))
        .filter(Boolean)

}

/**
 * Paikalliset haarat, uusimmat ensin.
 */
export async function localBranches(root) {

    const output = await git(root, [
        "for-each-ref",
        "--sort=-committerdate",
        "--format=%(refname:short)",
        "refs/heads",
    ])

    return output ? output.split("\n").filter(Boolean) : []

}

/**
 * Tarkistaa yhdellä git-prosessilla, mitkä "ref:polku"-parit ovat
 * olemassa. Palauttaa Setin olemassa olevista pareista.
 */
export function existingRefPaths(root, pairs) {

    if (pairs.length === 0) {
        return Promise.resolve(new Set())
    }

    return new Promise(resolve => {
        const child = spawn("git", ["-C", root, "cat-file", "--batch-check"], {
            stdio: ["pipe", "pipe", "ignore"],
        })

        let output = ""

        const timer = setTimeout(() => child.kill("SIGKILL"), GIT_TIMEOUT_MS)

        child.stdout.on("data", chunk => {
            output += chunk
        })

        child.on("error", () => {
            clearTimeout(timer)
            resolve(new Set())
        })

        child.on("close", () => {
            clearTimeout(timer)

            const lines = output.split("\n")

            const found = new Set()

            pairs.forEach((pair, index) => {
                if (lines[index] && !lines[index].endsWith(" missing")) {
                    found.add(pair)
                }
            })

            resolve(found)
        })

        child.stdin.end(pairs.join("\n") + "\n")
    })

}
