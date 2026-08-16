/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Revert Python Code Skill
 *
 * Peruuttaa jo levylle kirjoitetun (status: "written")
 * PythonCodeDraftin - sama idea kuin JS-puolen
 * revertCodeChangeSkill.js:llä, mutta kirjoituskohde on aina tämän
 * pluginin oma generated-python-hakemisto (ei koko projektin
 * PROJECT_ROOT), samasta syystä kuin writePythonCodeSkill.js:llä.
 *
 * Sama haarautuminen kuin JS-puolella: jos varmuuskopio on olemassa
 * (tiedosto oli olemassa kirjoitushetkellä), sen sisältö palautetaan;
 * jos ei (kirjoitus loi tiedoston tyhjästä), tiedosto poistetaan.
 */

import path from "node:path"

import {
    resolveSafeFilePath,
    sha256,
} from "./writePythonCodeSkill.js"

import { PROJECT_ROOT } from "../../CodeChangeDeveloper/skills/projectSandbox.js"

const revertPythonCodeSkill = {

    id: "revert-python",

    name: "Revert Python",

    description:
        "Reverts an already-written PythonCodeDraft's target file " +
        "back to its pre-write state, using the backup taken at " +
        "write time (or deleting the file if the write created it " +
        "from nothing).",

    async execute(context) {

        const { draft, toolBus } = context || {}

        if (!draft) {

            return {
                success: false,
                code: "draft_not_found",
                error: "Koodiluonnosta ei löytynyt.",
            }

        }

        if (draft.status !== "written") {

            return {
                success: false,
                code: "draft_not_written",
                error:
                    `Luonnosta ei ole kirjoitettu levylle ` +
                    `(status: ${draft.status}).`,
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

        const expectedHash = sha256(draft.code)

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

            if (sha256(liveRead.content) !== expectedHash) {

                return {
                    success: false,
                    code: "file_changed_since_write",
                    error:
                        "Tiedostoa on muokattu sen jälkeen kun tämä " +
                        "muutos kirjoitettiin. Peruutusta ei tehty.",
                }

            }

        } else if (draft.backupPath !== null && draft.backupPath !== undefined) {

            return {
                success: false,
                code: "file_changed_since_write",
                error:
                    "Tiedosto on poistunut sen jälkeen kun tämä " +
                    "muutos kirjoitettiin. Peruutusta ei tehty.",
            }

        }

        if (draft.backupPath === null || draft.backupPath === undefined) {

            if (existsResult.exists) {

                const deleteResult = await toolBus.execute("file", {
                    action: "delete",
                    file: safePath,
                })

                if (!deleteResult?.success) {

                    return {
                        success: false,
                        code: "delete_failed",
                        error:
                            deleteResult?.error ||
                            "Tiedoston poisto epäonnistui.",
                    }

                }

                return {
                    success: true,
                    action: "deleted",
                    filePath: safePath,
                }

            }

            return {
                success: true,
                action: "already_absent",
                filePath: safePath,
            }

        }

        const backupAbsolutePath = path.join(
            PROJECT_ROOT,
            draft.backupPath,
        )

        const backupExists = await toolBus.execute("file", {
            action: "exists",
            file: backupAbsolutePath,
        })

        if (!backupExists?.success || !backupExists.exists) {

            return {
                success: false,
                code: "backup_missing",
                error: `Varmuuskopiota ei löytynyt (${draft.backupPath}).`,
            }

        }

        const backupRead = await toolBus.execute("file", {
            action: "read",
            file: backupAbsolutePath,
        })

        if (!backupRead?.success) {

            return {
                success: false,
                code: "backup_read_failed",
                error: backupRead?.error || "Varmuuskopion luku epäonnistui.",
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
            content: backupRead.content,
        })

        if (!writeResult?.success) {

            return {
                success: false,
                code: "write_failed",
                error: writeResult?.error || "Palautuksen kirjoitus epäonnistui.",
            }

        }

        return {
            success: true,
            action: "restored",
            filePath: safePath,
        }

    },

}

export default revertPythonCodeSkill
