/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Pull Request Messages
 *
 * Haaran nimen, commit-viestin ja PR-kuvauksen rakentaminen Dev
 * Studion hyväksytylle muutokselle. Jaettu sekä CodeChangeDeveloper-
 * että PythonDeveloper-pluginin uusien PR-skillien kesken - sama
 * cross-plugin-import-käytäntö kuin writePythonCodeSkill.js:llä joka
 * jo tuo PROJECT_ROOT/BACKUP_DIR_NAME:n projectSandbox.js:stä.
 */

import crypto from "node:crypto"

function slugify(text) {

    return (text || "muutos")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "muutos"

}

/*
 * Lyhyt satunnaisliite estää haaran nimikonfliktin jos "Tee Pull
 * Request" yritetään uudelleen edellisen epäonnistumisen jälkeen -
 * haara ei häviä worktree-poiston yhteydessä (vain työhakemisto
 * poistetaan, ei itse haaraa), joten sama slugi uudelleen törmäisi
 * ilman tätä.
 */
function buildBranchName(title) {

    const shortId = crypto.randomUUID().split("-")[0]

    return `devstudio/${slugify(title)}-${shortId}`

}

function buildCommitMessage({ title, explanation, prompt }) {

    return `${title}\n\n${explanation || prompt || ""}`.trim()

}

// title ei ole osa PR-kuvausta - gh pr create --title kantaa sen jo
// erikseen, GitHub näyttää sen omana otsikkonaan PR-sivulla, joten sen
// toistaminen kuvauksen alussa olisi vain turhaa toistoa.
function buildPrBody({ explanation, prompt, fileCount }) {

    return (
        `${explanation || prompt || ""}\n\n` +
        `${fileCount} tiedosto${fileCount === 1 ? "" : "a"} muutettu.\n\n` +
        "— Ehdottanut Dev Studio (Wood-Booster HQ), Marcin hyväksynnän jälkeen."
    )

}

function buildRevertBranchName(title) {

    const shortId = crypto.randomUUID().split("-")[0]

    return `devstudio/revert-${slugify(title)}-${shortId}`

}

function buildRevertPrTitle(title) {

    return `Revert: ${title}`

}

function buildRevertPrBody({ prNumber, title }) {

    return (
        `Peruuttaa PR #${prNumber}: ${title}\n\n` +
        "— Ehdottanut Dev Studio (Wood-Booster HQ), Marcin hyväksynnän jälkeen."
    )

}

export {
    slugify,
    buildBranchName,
    buildCommitMessage,
    buildPrBody,
    buildRevertBranchName,
    buildRevertPrTitle,
    buildRevertPrBody,
}
