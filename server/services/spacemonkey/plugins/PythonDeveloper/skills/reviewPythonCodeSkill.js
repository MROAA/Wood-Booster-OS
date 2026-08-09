/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Review Python Code Skill
 *
 * Lukee olemassa olevan .py-tiedoston projektin sisältä File Toolin
 * kautta ja pyytää AI:ta antamaan rakentavan katselmoinnin
 * luonnollisella kielellä. Vain luku - ei koskaan kirjoita tai
 * suorita mitään, joten tälle ei tarvita hyväksymiskiertoa
 * (write-python-skillin draft/approve-mallista poiketen), samaan
 * tapaan kuin explain-python.
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



const reviewPythonCodeSkill = {

    id: "review-python",

    name: "Review Python",

    description:
        "Reads an existing .py file from within the project and " +
        "asks the AI for a constructive code review in plain " +
        "language.",

    async execute(context) {

        const { filePath, toolBus, reviewPythonCode } = context || {}

        const safePath = resolveSafeFilePath(filePath)

        if (!safePath) {

            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallittu - vain projektin " +
                    "sisäiset .py-tiedostot voi katselmoida.",
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

        const { review } = await reviewPythonCode({
            code: readResult.content,
        })

        return {
            success: true,
            filePath: safePath,
            review,
        }

    },

}

export default reviewPythonCodeSkill

export { PROJECT_ROOT, resolveSafeFilePath }
