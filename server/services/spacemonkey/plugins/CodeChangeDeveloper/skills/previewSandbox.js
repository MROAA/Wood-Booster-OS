/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Preview Sandbox
 *
 * Live-esikatselu (Dev Studio Phase 7, osa C) ajaa ehdotettua koodia
 * oikeasti selaimessa ENNEN hyväksyntää - siksi sen kirjo on tiukempi
 * kuin tavallisen projectSandbox.js:n. Frontend-koodi (src/**) suoritetaan
 * vain hiekkalaatikoidussa selainvälilehdessä, joten sen riski on
 * rajattu. Backend-koodin (server/**) suorittaminen esikatselun aikana
 * osuisi oikeaan tietokantaan, tiedostojärjestelmään ja verkkoon - siksi
 * se ei ole koskaan sallittua täällä, vaikka projectSandbox.js sallisi
 * sen kirjoituskohteena hyväksynnän jälkeen.
 */

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const PREVIEWABLE_ROOT_SEGMENT = "src"

function isPreviewableRelativePath(relativePath) {

    if (!relativePath) {

        return false

    }

    const segments = relativePath.split("/")

    return segments[0] === PREVIEWABLE_ROOT_SEGMENT

}

function resolveSafePreviewFilePath(filePath) {

    const projectResult = resolveSafeProjectFilePath(filePath)

    if (!projectResult.ok) {

        return projectResult

    }

    if (!isPreviewableRelativePath(projectResult.relativePath)) {

        return {
            ok: false,
            code: "outside_preview_scope",
        }

    }

    return projectResult

}

export {
    PREVIEWABLE_ROOT_SEGMENT,
    isPreviewableRelativePath,
    resolveSafePreviewFilePath,
}
