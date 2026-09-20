/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Code Change Pull Request Skill
 *
 * Kirjoittaa yhden tai useamman hyväksytyn tiedostoehdotuksen tuoreeseen,
 * kertakäyttöiseen git worktreehen, committaa, pushaa, ja avaa GitHub
 * Pull Requestin `gh`:n kautta - EI KOSKAAN kirjoita Marcin elävään,
 * käynnissä olevaan hakemistoon (PROJECT_ROOT). Toimii sekä yhden
 * tiedoston (CodeChangeDraft) että monen tiedoston (CodeChangeDraftSet)
 * tapauksessa - kutsuja antaa aina `files`-taulukon (yksittäisen
 * luonnoksen tapauksessa yhden alkion taulukko).
 *
 * WorkflowEngine ei koskaan ketjuta skillien tuloksia (jokainen skilli
 * saa saman contextin) - siksi tämä yksi skilli tekee koko
 * worktree->kirjoitus->commit->push->PR-ketjun sisäisesti, ei useaa
 * pientä skilliä.
 *
 * Kaikki-tai-ei-mitään: jos yhdenkin tiedoston polku ei kelpaa tai sen
 * kirjoitus epäonnistuu (esim. ristiriita elävän tiedoston kanssa),
 * mitään ei committoida - worktree hylätään ja poistetaan.
 *
 * writeCodeChangeSkill.js/writeCodeChangeWorkflow.js EIVÄT muutu
 * tämän myötä - ne pysyvät ennallaan, jotta Historian Peruuta-nappi
 * toimii täsmälleen kuten ennen jokaiselle jo ennen tätä ominaisuutta
 * kirjoitetulle "written"-tilaiselle rivillle.
 */

import path from "node:path"

import crypto from "node:crypto"

import { resolveSafeProjectFilePath, PROJECT_ROOT } from "./projectSandbox.js"

import { resolveWorktreeDir } from "./worktreeSandbox.js"

import { buildBranchName, buildCommitMessage, buildPrBody } from "./pullRequestMessages.js"

import { triggerGitGuardianBackup } from "../../../../devStudio/gitGuardianBackup.js"

function sha256(text) {

    return crypto
        .createHash("sha256")
        .update(text ?? "", "utf8")
        .digest("hex")

}

const writeCodeChangePullRequestSkill = {

    id: "write-code-change-pull-request",

    name: "Write Code Change Pull Request",

    description:
        "Writes one or more approved file drafts into a fresh, " +
        "ephemeral git worktree, commits, pushes, and opens a GitHub " +
        "PR via `gh` - never writes into the live checkout. " +
        "All-or-nothing: if any file fails validation or write, " +
        "nothing is committed or pushed.",

    async execute(context) {

        const { title, explanation, prompt, files, toolBus } = context || {}

        if (!files?.length) {

            return {
                success: false,
                code: "no_files",
                error: "Ei kirjoitettavia tiedostoja.",
            }

        }

        const validated = []

        for (const file of files) {

            const check = resolveSafeProjectFilePath(file.filePath)

            if (!check.ok) {

                return {
                    success: false,
                    code: check.code,
                    error: `Tiedostopolku ei kelpaa: ${file.filePath}`,
                }

            }

            validated.push({ ...file, relativePath: check.relativePath })

        }

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

            triggerGitGuardianBackup()

            for (const file of validated) {

                const targetPath = path.join(worktreeDir, file.relativePath)

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

                    if (sha256(liveRead.content) !== file.originalHash) {

                        return {
                            success: false,
                            code: "file_changed_since_draft",
                            error: `Tiedosto on muuttunut: ${file.filePath}`,
                        }

                    }

                } else if (file.originalHash !== null && file.originalHash !== undefined) {

                    return {
                        success: false,
                        code: "file_changed_since_draft",
                        error: `Tiedosto on poistunut: ${file.filePath}`,
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
                    content: file.proposedCode,
                })

                if (!writeResult?.success) {

                    return {
                        success: false,
                        code: "write_failed",
                        error: writeResult?.error || "Tiedoston kirjoitus epäonnistui.",
                    }

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
                body: buildPrBody({ title, explanation, prompt, fileCount: validated.length }),
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

export default writeCodeChangePullRequestSkill
