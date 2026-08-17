/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Debug Python Code Skill
 *
 * Lukee olemassa olevan .py-tiedoston projektin sisältä File Toolin
 * kautta ja pyytää AI:ta diagnosoimaan mahdollisen ongelman (ja
 * valinnaisen virheilmoituksen) sekä ehdottamaan korjauksen. Ei
 * koskaan aja koodia - pelkkä lukemiseen perustuva päättely, samaan
 * tapaan kuin refactor-python. Tuottaa uutta koodia, joten tulos ei
 * koskaan kirjoita mitään suoraan - kutsuja (reitti) tallentaa
 * palautetun koodin PythonCodeDraftiksi samaan draft/approve/write-
 * hyväksymiskiertoon kuin write-python/refactor-python.
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



const debugPythonCodeSkill = {

    id: "debug-python",

    name: "Debug Python",

    description:
        "Reads an existing .py file from within the project and " +
        "asks the AI to diagnose a problem (optionally given an " +
        "error message) and propose a fix. Never runs the code - " +
        "reasoning only, same as a human reading a traceback.",

    async execute(context) {

        const {
            filePath,
            errorMessage,
            model,
            toolBus,
            debugPythonCode,
        } = context || {}

        const safePath = resolveSafeFilePath(filePath)

        if (!safePath) {

            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallittu - vain projektin " +
                    "sisäiset .py-tiedostot voi debugata.",
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

        const { title, diagnosis, code } = await debugPythonCode({
            code: readResult.content,
            errorMessage,
            model,
        })

        return {
            success: true,
            filePath: safePath,
            title,
            diagnosis,
            code,
        }

    },

}

export default debugPythonCodeSkill

export { PROJECT_ROOT, resolveSafeFilePath }
