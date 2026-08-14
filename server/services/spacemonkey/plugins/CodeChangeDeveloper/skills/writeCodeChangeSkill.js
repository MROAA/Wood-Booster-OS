/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Code Change Skill
 *
 * Lukee hyväksytyn CodeChangeDraftin ja kirjoittaa sen ehdotetun
 * sisällön levylle File Toolin kautta - mutta vasta kolmen
 * tarkistuksen jälkeen:
 *
 *  1. Luonnos on oikeasti hyväksytty (status: "approved"). Tarkistus
 *     tehdään myös täällä, vaikka reitti tarkistaa saman jo ennen
 *     workflow'n käynnistämistä - puolustus syvyydessä, sama malli
 *     kuin write-python-skillillä.
 *  2. Kirjoituspolku on edelleen sallitun hiekkalaatikon sisällä.
 *  3. Tiedosto ei ole muuttunut sen jälkeen kun luonnos luotiin
 *     (verrataan tallennettua originalHashia elävän tiedoston
 *     hashiin). Tämä tarkistus ei ollut tarpeen PythonDeveloperin
 *     write-python-skillillä, koska se kirjoittaa vain omaan
 *     kertakäyttöiseen hakemistoonsa jota kukaan muu ei koske - mutta
 *     tässä ollaan kirjoittamassa oikeaan, elävään lähdekoodiin, joten
 *     hiljainen päällekirjoitus torjutaan mieluummin kuin sallitaan.
 *
 * Ennen kirjoitusta olemassa olevasta tiedostosta otetaan
 * aikaleimattu varmuuskopio omaan .dev-studio-backups-hakemistoonsa
 * (ei tiedoston viereen, jotta useampi peräkkäinen hyväksytty muutos
 * samaan tiedostoon ei tuhoa edellistä varmuuskopiota).
 */

import path from "node:path"

import crypto from "node:crypto"

import { resolveSafeProjectFilePath, PROJECT_ROOT, BACKUP_DIR_NAME } from "./projectSandbox.js"

function sha256(text) {

    return crypto
        .createHash("sha256")
        .update(text ?? "", "utf8")
        .digest("hex")

}

function buildBackupRelativePath(relativePath) {

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")

    return path.join(
        BACKUP_DIR_NAME,
        `${relativePath}.${timestamp}.bak`,
    )

}

const writeCodeChangeSkill = {

    id: "write-code-change",

    name: "Write Code Change",

    description:
        "Reads an approved CodeChangeDraft and writes its proposed " +
        "content to disk, inside the project sandbox, after " +
        "re-checking approval, path safety, and that the live file " +
        "has not changed since the draft was generated.",

    async execute(context) {

        const { draftId, prisma, toolBus } = context || {}

        const draft = await prisma.codeChangeDraft.findUnique({
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
                error:
                    `Luonnos ei ole hyväksytty ` +
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

        let liveContent = null

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

            liveContent = liveRead.content

            const liveHash = sha256(liveContent)

            if (liveHash !== draft.originalHash) {

                return {
                    success: false,
                    code: "file_changed_since_draft",
                    error:
                        "Tiedosto on muuttunut sen jälkeen kun " +
                        "luonnos luotiin. Luo luonnos uudelleen.",
                }

            }

        } else if (draft.originalHash !== null) {

            // Tiedosto oli olemassa luonnosta luotaessa, mutta on nyt
            // poistunut - myös tämä on ristiriita, ei tilaisuus
            // luoda se hiljaa uudelleen eri sisällöllä.
            return {
                success: false,
                code: "file_changed_since_draft",
                error:
                    "Tiedosto on poistunut sen jälkeen kun luonnos " +
                    "luotiin. Luo luonnos uudelleen.",
            }

        }

        let backupRelativePath = null

        if (existsResult.exists) {

            backupRelativePath = buildBackupRelativePath(
                check.relativePath,
            )

            const backupAbsolutePath = path.join(
                PROJECT_ROOT,
                backupRelativePath,
            )

            const mkdirResult = await toolBus.execute("file", {
                action: "mkdir",
                file: path.dirname(backupAbsolutePath),
            })

            if (!mkdirResult?.success) {

                return {
                    success: false,
                    code: "backup_mkdir_failed",
                    error:
                        mkdirResult?.error ||
                        "Varmuuskopiohakemiston luonti epäonnistui.",
                }

            }

            const backupWrite = await toolBus.execute("file", {
                action: "write",
                file: backupAbsolutePath,
                content: liveContent,
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
            content: draft.proposedCode,
        })

        if (!writeResult?.success) {

            return {
                success: false,
                code: "write_failed",
                error:
                    writeResult?.error ||
                    "Tiedoston kirjoitus epäonnistui.",
            }

        }

        return {
            success: true,
            filePath: check.absolutePath,
            backupPath: backupRelativePath,
        }

    },

}

export default writeCodeChangeSkill

export { sha256 }
