/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Revert Pull Request Skill
 *
 * Peruuttaa jo YHDISTETYN Dev Studio -Pull Requestin avaamalla TOISEN,
 * peruuttavan Pull Requestin - ei koskaan kirjoita suoraan Marcin
 * elävään hakemistoon. Sama turvallinen rytmi kuin alkuperäisellä
 * muutoksella (ks. writeCodeChangePullRequestSkill.js), koska
 * "written"-tilan Peruuta-nappi ei enää toimi PR:n yhdistämisen
 * jälkeen (git-historia on jo jaettu muiden kanssa).
 *
 * Puhtaasti git-plumbingia - ei tiedostoluku/kirjoitusta tämän oman
 * pluginin resolveSafeProjectFilePath-tarkistuksen kautta, joten sama
 * skilli toimii sellaisenaan sekä JS- että Python-luonnoksille
 * (SkillEngine/WorkflowEngine ovat jaettuja, ei plugin-kohtaisia -
 * rekisteröinti kerran CodeChangeDeveloperissa riittää).
 *
 * Yhdistetyllä PR:llä voi olla joko yksi vanhempi (squash/rebase) tai
 * kaksi (oikea merge-commit) - kumpaakaan ei voi päätellä repon
 * asetuksista (kaikki kolme tapaa ovat sallittuja), joten
 * vanhempien lukumäärä tarkistetaan aina erikseen jokaiselle PR:lle
 * ennen revertin ajamista (mainline-lippu vain jos >= 2 vanhempaa).
 */

import { resolveWorktreeDir } from "./worktreeSandbox.js"

import { PROJECT_ROOT } from "./projectSandbox.js"

import {
    buildRevertBranchName,
    buildRevertPrTitle,
    buildRevertPrBody,
} from "./pullRequestMessages.js"

import crypto from "node:crypto"

const revertPullRequestSkill = {

    id: "revert-pull-request",

    name: "Revert Pull Request",

    description:
        "Opens a second, reverting Pull Request against an already " +
        "merged Dev Studio PR - never writes directly to the live " +
        "checkout.",

    async execute(context) {

        const { prNumber, originalTitle, toolBus } = context || {}

        if (!prNumber || !originalTitle) {

            return {
                success: false,
                code: "missing_input",
                error: "prNumber ja originalTitle vaaditaan.",
            }

        }

        const viewResult = await toolBus.execute("git", {
            action: "prView",
            repoRoot: PROJECT_ROOT,
            prNumber,
        })

        if (!viewResult.success) {

            return {
                success: false,
                code: "pr_view_failed",
                error: viewResult.error,
            }

        }

        if (viewResult.state !== "MERGED") {

            return {
                success: false,
                code: "pr_not_merged",
                error: `PR #${prNumber} ei ole yhdistetty (tila: ${viewResult.state}).`,
            }

        }

        if (!viewResult.mergeCommitSha) {

            return {
                success: false,
                code: "merge_commit_missing",
                error: `PR #${prNumber}:lle ei löytynyt merge-commit-SHA:ta.`,
            }

        }

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

        const parentCountResult = await toolBus.execute("git", {
            action: "mergeParentCount",
            repoRoot: PROJECT_ROOT,
            sha: viewResult.mergeCommitSha,
        })

        if (!parentCountResult.success) {

            return {
                success: false,
                code: "merge_parent_count_failed",
                error: parentCountResult.error,
            }

        }

        const mainline = parentCountResult.parentCount >= 2

        const runId = crypto.randomUUID()

        const worktreeDir = resolveWorktreeDir(runId)

        const branch = buildRevertBranchName(originalTitle)

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

            const revertResult = await toolBus.execute("git", {
                action: "revert",
                worktreeDir,
                sha: viewResult.mergeCommitSha,
                mainline,
            })

            if (!revertResult.success) {

                return {
                    success: false,
                    code: "revert_failed",
                    error: revertResult.error,
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
                title: buildRevertPrTitle(originalTitle),
                body: buildRevertPrBody({ prNumber, title: originalTitle }),
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

export default revertPullRequestSkill
