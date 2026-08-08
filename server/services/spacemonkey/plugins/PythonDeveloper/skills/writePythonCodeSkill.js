/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Python Code Skill
 *
 * Lukee hyväksytyn PythonCodeDraftin ja kirjoittaa sen koodin
 * levylle File Toolin kautta. Ei koskaan aja hyväksymätöntä
 * luonnosta - kutsujan (reitin) vastuulla on tarkistaa status ennen
 * suoritusta, mutta skilli tarkistaa saman uudelleen puolustuksena.
 *
 * Kirjoituspolku rajoitetaan aina tämän pluginin
 * generated-python-hakemiston sisään, jotta hyväksytty luonnos ei
 * voi koskaan kirjoittaa mihin tahansa tiedostojärjestelmässä
 * (esim. ".." -polkuliikenne tai absoluuttinen polku hylätään).
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const GENERATED_PYTHON_DIR = path.resolve(
    currentDirectory,
    "../../../../../generated-python",
)



function resolveSafeFilePath(filePath) {

    const resolved = path.resolve(GENERATED_PYTHON_DIR, filePath || "")

    const withinBase =
        resolved === GENERATED_PYTHON_DIR ||
        resolved.startsWith(GENERATED_PYTHON_DIR + path.sep)

    if (!withinBase) {

        return null

    }

    return resolved

}



const writePythonCodeSkill = {

    id: "write-python",

    name: "Write Python",

    description:
        "Reads an approved PythonCodeDraft and writes its code to " +
        "disk inside the plugin's sandboxed generated-python " +
        "directory.",

    async execute(context) {

        const { draftId, prisma, toolBus } = context || {}

        const draft = await prisma.pythonCodeDraft.findUnique({
            where: { id: draftId },
        })

        if (!draft) {

            return {
                success: false,
                code: "draft_not_found",
                error: "Koodiluonnosta ei löytynyt.",
            }

        }

        if (draft.status !== "approved") {

            return {
                success: false,
                code: "draft_not_approved",
                error: `Luonnos ei ole hyväksytty (status: ${draft.status}).`,
            }

        }

        const safePath = resolveSafeFilePath(draft.filePath)

        if (!safePath) {

            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallitun generated-python-" +
                    "hakemiston sisällä.",
            }

        }

        const mkdirResult = await toolBus.execute("file", {
            action: "mkdir",
            file: path.dirname(safePath),
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
            file: safePath,
            content: draft.code,
        })

        if (!writeResult?.success) {

            return {
                success: false,
                code: "write_failed",
                error: writeResult?.error || "Tiedoston kirjoitus epäonnistui.",
            }

        }

        return {
            success: true,
            filePath: safePath,
        }

    },

}

export default writePythonCodeSkill

export { GENERATED_PYTHON_DIR, resolveSafeFilePath }
