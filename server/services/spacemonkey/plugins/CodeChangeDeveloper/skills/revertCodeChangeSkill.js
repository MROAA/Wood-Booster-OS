/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Revert Code Change Skill
 *
 * Peruuttaa jo levylle kirjoitetun (status: "written") hyväksytyn
 * luonnoksen (draft-olio annetaan valmiiksi haettuna context.draft:ina,
 * samasta syystä kuin write-code-change-skillissä - sama skilli toimii
 * sekä CodeChangeDraftille että CodeChangeFileDraftille).
 *
 * write-code-change-skill ottaa varmuuskopion ennen kirjoitusta VAIN
 * jos kohdetiedosto oli jo olemassa - jos kirjoitus loi UUDEN
 * tiedoston, backupPath jää nulliksi koska palautettavaa ei ole.
 * Peruutus haarautuu siis samaan tapaan:
 *
 *  1. backupPath ei-null -> varmuuskopion sisältö palautetaan elävän
 *     tiedoston päälle.
 *  2. backupPath null -> kirjoitus loi tiedoston tyhjästä, joten
 *     peruutus poistaa sen.
 *
 * Ennen kumpaakaan tarkistetaan (sama puolustus-syvyys-periaate kuin
 * write-code-change-skillissä originalHash-tarkistuksella) että
 * elävä tiedosto vastaa edelleen sitä mitä kirjoitettiin - jos joku
 * on muokannut tiedostoa peruutettavan kirjoituksen JÄLKEEN, peruutus
 * kieltäytyy sen sijaan että hiljaa tuhoaisi sen uudemman muokkauksen.
 */

import path from "node:path"

import { resolveSafeProjectFilePath, PROJECT_ROOT } from "./projectSandbox.js"

import { sha256 } from "./writeCodeChangeSkill.js"

const revertCodeChangeSkill = {

    id: "revert-code-change",

    name: "Revert Code Change",

    description:
        "Reverts an already-written draft's target file back to its " +
        "pre-write state, using the backup taken at write time (or " +
        "deleting the file if the write created it from nothing).",

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

        const check = resolveSafeProjectFilePath(draft.filePath)

        if (!check.ok) {

            return {
                success: false,
                code: check.code,
                error:
                    "Tiedostopolku ei ole sallitun hiekkalaatikon " +
                    `sisällä (${check.code}).`,
            }

        }

        const existsResult = await toolBus.execute("file", {
            action: "exists",
            file: check.absolutePath,
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

        const expectedHash = sha256(draft.proposedCode)

        if (existsResult.exists) {

            const liveRead = await toolBus.execute("file", {
                action: "read",
                file: check.absolutePath,
            })

            if (!liveRead?.success) {

                return {
                    success: false,
                    code: "read_failed",
                    error:
                        liveRead?.error ||
                        "Tiedoston luku epäonnistui.",
                }

            }

            if (sha256(liveRead.content) !== expectedHash) {

                return {
                    success: false,
                    code: "file_changed_since_write",
                    error:
                        "Tiedostoa on muokattu sen jälkeen kun tämä " +
                        "muutos kirjoitettiin. Peruutusta ei tehty, " +
                        "jotta uudempaa muokkausta ei hukata.",
                }

            }

        } else if (draft.backupPath !== null) {

            // Tiedosto oli olemassa kirjoituksen jälkeen, mutta on nyt
            // odottamatta poistunut - myös tämä on ristiriita, ei
            // tilaisuus palauttaa varmuuskopiota hiljaa sen tilalle.
            return {
                success: false,
                code: "file_changed_since_write",
                error:
                    "Tiedosto on poistunut sen jälkeen kun tämä " +
                    "muutos kirjoitettiin. Peruutusta ei tehty.",
            }

        }

        if (draft.backupPath === null) {

            if (existsResult.exists) {

                const deleteResult = await toolBus.execute("file", {
                    action: "delete",
                    file: check.absolutePath,
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
                    filePath: check.absolutePath,
                }

            }

            // Tiedosto on jo poissa - tavoitetila on jo saavutettu.
            return {
                success: true,
                action: "already_absent",
                filePath: check.absolutePath,
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
                error:
                    "Varmuuskopiota ei löytynyt " +
                    `(${draft.backupPath}).`,
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
                error:
                    backupRead?.error ||
                    "Varmuuskopion luku epäonnistui.",
            }

        }

        const mkdirResult = await toolBus.execute("file", {
            action: "mkdir",
            file: path.dirname(check.absolutePath),
        })

        if (!mkdirResult?.success) {

            return {
                success: false,
                code: "mkdir_failed",
                error:
                    mkdirResult?.error ||
                    "Hakemiston luonti epäonnistui.",
            }

        }

        const writeResult = await toolBus.execute("file", {
            action: "write",
            file: check.absolutePath,
            content: backupRead.content,
        })

        if (!writeResult?.success) {

            return {
                success: false,
                code: "write_failed",
                error:
                    writeResult?.error ||
                    "Palautuksen kirjoitus epäonnistui.",
            }

        }

        return {
            success: true,
            action: "restored",
            filePath: check.absolutePath,
        }

    },

}

export default revertCodeChangeSkill
