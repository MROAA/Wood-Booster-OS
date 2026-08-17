/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Refactor Python Code Skill
 *
 * Lukee olemassa olevan .py-tiedoston projektin sisältä File Toolin
 * kautta ja pyytää AI:ta refaktoroimaan sen. Toisin kuin
 * explain-python/review-python, tämä skilli EI vain palauta tekstiä
 * - se tuottaa uutta koodia, joten tulos ei koskaan kirjoita mitään
 * suoraan. Kutsuja (reitti) tallentaa palautetun koodin
 * PythonCodeDraftiksi, joka kulkee saman draft/approve/write-
 * hyväksymiskierron läpi kuin write-python-skillin luonnokset ennen
 * kuin mitään päätyy levylle.
 *
 * Luettavat tiedostot rajoitetaan projektin juuren sisään ja vain
 * .py-tiedostoihin, jotta skilliä ei voi käyttää lukemaan
 * mielivaltaisia tiedostoja järjestelmästä (esim. .env).
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ROOT = path.resolve(
    currentDirectory,
    "../../../../../..",
)



function resolveSafeFilePath(filePath) {

    if (!filePath || !filePath.endsWith(".py")) {

        return null

    }

    const resolved = path.resolve(PROJECT_ROOT, filePath)

    const withinBase =
        resolved === PROJECT_ROOT ||
        resolved.startsWith(PROJECT_ROOT + path.sep)

    if (!withinBase) {

        return null

    }

    return resolved

}



const refactorPythonCodeSkill = {

    id: "refactor-python",

    name: "Refactor Python",

    description:
        "Reads an existing .py file from within the project and " +
        "asks the AI to produce a refactored version. Never writes " +
        "anything itself - the caller turns the result into a " +
        "PythonCodeDraft for human approval.",

    async execute(context) {

        const { filePath, model, toolBus, refactorPythonCode } = context || {}

        const safePath = resolveSafeFilePath(filePath)

        if (!safePath) {

            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallittu - vain projektin " +
                    "sisäiset .py-tiedostot voi refaktoroida.",
            }

        }

        const readResult = await toolBus.execute("file", {
            action: "read",
            file: safePath,
        })

        if (!readResult?.success) {

            return {
                success: false,
                code: "read_failed",
                error: readResult?.error || "Tiedoston luku epäonnistui.",
            }

        }

        const { title, explanation, code, model: resolvedModel } = await refactorPythonCode({
            code: readResult.content,
            model,
        })

        return {
            success: true,
            filePath: safePath,
            title,
            explanation,
            code,
            model: resolvedModel,
        }

    },

}

export default refactorPythonCodeSkill

export { PROJECT_ROOT, resolveSafeFilePath }
