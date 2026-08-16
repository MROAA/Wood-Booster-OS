/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Python Code Pull Request Skill
 *
 * Python-vastine writeCodeChangePullRequestSkill.js:lle - kirjoittaa
 * yhden hyväksytyn Python-luonnoksen tuoreeseen, kertakäyttöiseen git
 * worktreehen, committaa, pushaa, ja avaa GitHub Pull Requestin. EI
 * KOSKAAN kirjoita Marcin elävään hakemistoon.
 *
 * Python-luonnokset ovat aina yksi tiedosto (ei monitiedostosuunnitelmia
 * tällä puolella), joten tämä ei tarvitse files-taulukkoa kuten
 * JS-puolen skilli - vain yksi filePath/code-pari.
 *
 * Polkuvalidointi käyttää resolveSafeFilePath:ia writePythonCodeSkill.js:stä
 * (GENERATED_PYTHON_DIR-juurinen absoluuttinen polku), mutta koska
 * GENERATED_PYTHON_DIR on PROJECT_ROOTin sisällä, se muunnetaan
 * PROJECT_ROOT-suhteelliseksi ennen worktree-juureen liittämistä - sama
 * suhteellinen polku toimii molemmissa juurissa.
 *
 * writePythonCodeSkill.js/writePythonCodeWorkflow.js EIVÄT muutu -
 * Historian Peruuta-nappi toimii ennallaan jokaiselle jo ennen tätä
 * ominaisuutta kirjoitetulle "written"-tilaiselle luonnokselle.
 */

import path from "node:path"

import crypto from "node:crypto"

import { resolveSafeFilePath } from "./writePythonCodeSkill.js"

import { PROJECT_ROOT } from "../../CodeChangeDeveloper/skills/projectSandbox.js"

import { resolveWorktreeDir } from "../../CodeChangeDeveloper/skills/worktreeSandbox.js"

import { buildBranchName, buildCommitMessage, buildPrBody } from "../../CodeChangeDeveloper/skills/pullRequestMessages.js"

function sha256(text) {

    return crypto
        .createHash("sha256")
        .update(text ?? "", "utf8")
        .digest("hex")

}

const writePythonCodePullRequestSkill = {

    id: "write-python-pull-request",

    name: "Write Python Pull Request",

    description:
        "Writes an approved Python draft into a fresh, ephemeral git " +
        "worktree, commits, pushes, and opens a GitHub PR via `gh` - " +
        "never writes into the live checkout.",

    async execute(context) {

        const { title, explanation, prompt, filePath, code, originalHash, toolBus } = context || {}

        const safePath = resolveSafeFilePath(filePath)

        if (!safePath) {

            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallitun generated-python-" +
                    "hakemiston sisällä.",
            }

        }

        const relativePath = path.relative(PROJECT_ROOT, safePath)

        const runId = crypto.randomUUID()

        const worktreeDir = resolveWorktreeDir(runId)

        const branch = buildBranchName(title)

        const fetchResult = await toolBus.execute("git", {
            action: "fetch",
            repoRoot: PROJECT_ROOT,
            ref: "development",
        })

        if (!fetchResult.success) {

            return {
                success: false,
                code: "fetch_failed",
                error: fetchResult.error,
            }

        }

        const worktreeResult = await toolBus.execute("git", {
            action: "worktreeAdd",
            repoRoot: PROJECT_ROOT,
            worktreeDir,
            branch,
            baseRef: "origin/development",
        })

        if (!worktreeResult.success) {

            return {
                success: false,
                code: "worktree_failed",
                error: worktreeResult.error,
            }

        }

        try {

            const targetPath = path.join(worktreeDir, relativePath)

            const existsResult = await toolBus.execute("file", {
                action: "exists",
                file: targetPath,
            })

            if (!existsResult?.success) {

                return {
                    success: false,
                    code: "exists_check_failed",
                    error: existsResult?.error || "Tiedoston olemassaolon tarkistus epäonnistui.",
                }

            }

            if (existsResult.exists) {

                const liveRead = await toolBus.execute("file", {
                    action: "read",
                    file: targetPath,
                })

                if (!liveRead?.success) {

                    return {
                        success: false,
                        code: "read_failed",
                        error: liveRead?.error || "Tiedoston luku epäonnistui.",
                    }

                }

                if (sha256(liveRead.content) !== originalHash) {

                    return {
                        success: false,
                        code: "file_changed_since_draft",
                        error: "Tiedosto on muuttunut sen jälkeen kun luonnos luotiin.",
                    }

                }

            } else if (originalHash !== null && originalHash !== undefined) {

                return {
                    success: false,
                    code: "file_changed_since_draft",
                    error: "Tiedosto on poistunut sen jälkeen kun luonnos luotiin.",
                }

            }

            const mkdirResult = await toolBus.execute("file", {
                action: "mkdir",
                file: path.dirname(targetPath),
            })

            if (!mkdirResult?.success) {

                return {
                    success: false,
                    code: "mkdir_failed",
                    error: mkdirResult?.error || "Hakemiston luonti epäonnistui.",
                }

            }

            const writeResult = await toolBus.execute("file", {
                action: "write",
                file: targetPath,
                content: code,
            })

            if (!writeResult?.success) {

                return {
                    success: false,
                    code: "write_failed",
                    error: writeResult?.error || "Tiedoston kirjoitus epäonnistui.",
                }

            }

            const stageResult = await toolBus.execute("git", {
                action: "stageAll",
                worktreeDir,
            })

            if (!stageResult.success) {

                return {
                    success: false,
                    code: "stage_failed",
                    error: stageResult.error,
                }

            }

            const commitResult = await toolBus.execute("git", {
                action: "commit",
                worktreeDir,
                message: buildCommitMessage({ title, explanation, prompt }),
            })

            if (!commitResult.success) {

                return {
                    success: false,
                    code: "commit_failed",
                    error: commitResult.error,
                }

            }

            const pushResult = await toolBus.execute("git", {
                action: "push",
                worktreeDir,
                branch,
            })

            if (!pushResult.success) {

                return {
                    success: false,
                    code: "push_failed",
                    error: pushResult.error,
                }

            }

            const prResult = await toolBus.execute("git", {
                action: "prCreate",
                worktreeDir,
                baseBranch: "development",
                title,
                body: buildPrBody({ title, explanation, prompt, fileCount: 1 }),
            })

            if (!prResult.success) {

                return {
                    success: false,
                    code: "pr_create_failed",
                    error: prResult.error,
                }

            }

            return {
                success: true,
                prUrl: prResult.prUrl,
                prNumber: prResult.prNumber,
                prBranch: branch,
            }

        } finally {

            await toolBus.execute("git", {
                action: "worktreeRemove",
                repoRoot: PROJECT_ROOT,
                worktreeDir,
            })

        }

    },

}

export default writePythonCodePullRequestSkill
