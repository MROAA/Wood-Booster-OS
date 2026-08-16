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
 *
 * Jos kohde on jo olemassa (esim. sama tiedostonimi on ehdotettu
 * uudelleen), sen elävä sisältö tarkistetaan draft.originalHashia
 * vasten (sama puolustus-syvyys-periaate kuin JS-puolen
 * write-code-change-skillillä) ja varmuuskopioidaan
 * .dev-studio-backups-hakemistoon ennen ylikirjoitusta, jotta
 * revert-python-code-skill voi palauttaa sen tarvittaessa.
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

import crypto from "node:crypto"

import { BACKUP_DIR_NAME, PROJECT_ROOT } from "../../CodeChangeDeveloper/skills/projectSandbox.js"

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



function sha256(text) {

    return crypto
        .createHash("sha256")
        .update(text ?? "", "utf8")
        .digest("hex")

}



function buildBackupRelativePath(absoluteTargetPath) {

    const relativeFromRoot = path.relative(PROJECT_ROOT, absoluteTargetPath)

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")

    return path.join(
        BACKUP_DIR_NAME,
        `${relativeFromRoot}.${timestamp}.bak`,
    )

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

        const existsResult = await toolBus.execute("file", {
            action: "exists",
            file: safePath,
        })

        if (!existsResult?.success) {

            return {
                success: false,
                code: "exists_check_failed",
                error:
                    existsResult?.error ||
                    "Tiedoston olemassaolon tarkistus epäonnistui.",
            }

        }

        let backupRelativePath = null

        if (existsResult.exists) {

            const liveRead = await toolBus.execute("file", {
                action: "read",
                file: safePath,
            })

            if (!liveRead?.success) {

                return {
                    success: false,
                    code: "read_failed",
                    error: liveRead?.error || "Tiedoston luku epäonnistui.",
                }

            }

            if (sha256(liveRead.content) !== draft.originalHash) {

                return {
                    success: false,
                    code: "file_changed_since_draft",
                    error:
                        "Tiedosto on muuttunut sen jälkeen kun luonnos " +
                        "luotiin. Luo luonnos uudelleen.",
                }

            }

            backupRelativePath = buildBackupRelativePath(safePath)

            const backupAbsolutePath = path.join(
                PROJECT_ROOT,
                backupRelativePath,
            )

            const backupMkdirResult = await toolBus.execute("file", {
                action: "mkdir",
                file: path.dirname(backupAbsolutePath),
            })

            if (!backupMkdirResult?.success) {

                return {
                    success: false,
                    code: "backup_mkdir_failed",
                    error:
                        backupMkdirResult?.error ||
                        "Varmuuskopiohakemiston luonti epäonnistui.",
                }

            }

            const backupWrite = await toolBus.execute("file", {
                action: "write",
                file: backupAbsolutePath,
                content: liveRead.content,
            })

            if (!backupWrite?.success) {

                return {
                    success: false,
                    code: "backup_write_failed",
                    error:
                        backupWrite?.error ||
                        "Varmuuskopion kirjoitus epäonnistui.",
                }

            }

        } else if (draft.originalHash !== null && draft.originalHash !== undefined) {

            // Tiedosto oli olemassa luonnosta luotaessa, mutta on nyt
            // poistunut - sama ristiriita kuin JS-puolella.
            return {
                success: false,
                code: "file_changed_since_draft",
                error:
                    "Tiedosto on poistunut sen jälkeen kun luonnos " +
                    "luotiin. Luo luonnos uudelleen.",
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
            backupPath: backupRelativePath,
        }

    },

}

export default writePythonCodeSkill

export { GENERATED_PYTHON_DIR, resolveSafeFilePath, sha256 }
