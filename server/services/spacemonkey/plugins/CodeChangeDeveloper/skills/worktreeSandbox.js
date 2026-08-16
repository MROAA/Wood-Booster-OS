/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Worktree Sandbox
 *
 * Ratkaisee polun kertakäyttöiselle git worktreelle jonne Pull
 * Request -kirjoitus tapahtuu - AINA PROJECT_ROOTin SISARUKSENA (sama
 * käytäntö kuin docs/GIT_WORKFLOW.md:n `git worktree add
 * ../Wood-Booster-OS-<nimi> ...`), EI KOSKAAN sen sisällä. Marcin
 * elävä, käynnissä oleva hakemisto (PROJECT_ROOT itse) ei koskaan ole
 * kirjoituskohde tämän ominaisuuden kautta.
 */

import path from "node:path"

import { PROJECT_ROOT } from "./projectSandbox.js"

const WORKTREE_PARENT_DIR = path.resolve(PROJECT_ROOT, "..")

function resolveWorktreeDir(runId) {

    return path.join(WORKTREE_PARENT_DIR, `Wood-Booster-OS-devstudio-${runId}`)

}

export { WORKTREE_PARENT_DIR, resolveWorktreeDir }
