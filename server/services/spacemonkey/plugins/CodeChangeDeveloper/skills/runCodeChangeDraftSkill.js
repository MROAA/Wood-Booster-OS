/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Code Change Draft Skill
 *
 * "Aja ja näytä tulostus" - JS-monitiedostopuolen vastine
 * runPythonDraftSkill.js:lle. Kirjoittaa kohdetiedoston JA kaikki
 * saman paketin sisarustiedostot (jotta paketin sisäiset suhteelliset
 * tuonnit ratkeavat) hiekkalaatikkoon, ja ajaa VAIN kohdetiedoston
 * suoraan node:lla - ei koskaan kosketa todellista projektipuuta.
 *
 * Tarkoituksellinen, ei korjattava rajoitus: monitiedostopaketin
 * tiedostot ovat tyypillisesti React/JSX-selainkoodia, jota plain
 * node ei osaa ajaa (ei JSX-muunnosta, ei selain-API:a) - se on jo
 * olemassa olevan live-esikatselun (previewServer.js, oikea Vite-
 * palvelin) tehtävä. Tämä toiminto on tarkoitettu yksinkertaisille,
 * ei-selainkoodia sisältäville tiedostoille (esim. apufunktiot) -
 * React-komponenttitiedostolle ajo epäonnistuu odotetusti selkeällä
 * virheellä, mikä on silti hyödyllistä tietoa, ei kaatuminen.
 *
 * Sama turvallinen suorituskerros kuin runPythonDraftSkill.js:ssä:
 * täsmälleen sama, kiinteä komentomuoto ("node <hiekkalaatikkopolku>")
 * execFile:lla (ei shell-tulkintaa), sama aikakatkaisu ja tulosteen
 * kokorajoitus, ja hiekkalaatikkohakemisto siivotaan aina pois
 * finally-lohkossa.
 */

import { execFile } from "node:child_process"

import { promisify } from "node:util"

import path from "node:path"

import crypto from "node:crypto"

import fs from "node:fs/promises"

import { PROJECT_ROOT } from "./projectSandbox.js"

import { resolveVerificationRunDir, resolveSafeVerificationPath } from "./verificationSandbox.js"

const execFileAsync = promisify(execFile)

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 1_000_000

const MAX_OUTPUT_CHARS = 20000

function truncateOutput(text) {

    const value = text || ""

    if (value.length <= MAX_OUTPUT_CHARS) {

        return value

    }

    return (
        value.slice(0, MAX_OUTPUT_CHARS) +
        "\n... (tuloste katkaistu)"
    )

}

const runCodeChangeDraftSkill = {

    id: "run-code-change-draft",

    name: "Run Code Change Draft",

    description:
        "Writes a set's target file AND its sibling files into a " +
        "sandboxed scratch directory (so same-set relative imports " +
        "resolve), then runs only the target file directly " +
        "(`node <sandboxed path>`) via execFile, never a caller-" +
        "supplied command string, with a hard timeout and output cap. " +
        "Always cleans up its scratch directory afterward. Never " +
        "touches the real project tree.",

    async execute(context) {

        const {
            targetFilePath,
            targetCode,
            siblingFiles,
            toolBus,
            // Vain testauskäyttöön - reitti ei koskaan aseta tätä,
            // joten oletusarvo (TIMEOUT_MS) pätee aina oikeissa
            // pyynnöissä.
            timeoutMsOverride,
        } = context || {}

        const runId = crypto.randomUUID()

        const allFiles = [
            { filePath: targetFilePath, code: targetCode },
            ...(siblingFiles || []),
        ]

        for (const file of allFiles) {

            const check = resolveSafeVerificationPath(runId, file.filePath)

            if (!check.ok) {

                return {
                    success: false,
                    code: "verification_sandbox_error",
                    error: `Ajon hiekkalaatikon polkua ei voitu ratkaista: ${file.filePath}`,
                }

            }

            const mkdirResult = await toolBus.execute("file", {
                action: "mkdir",
                file: path.dirname(check.absolutePath),
            })

            if (!mkdirResult?.success) {

                return {
                    success: false,
                    code: "verification_mkdir_failed",
                    error:
                        mkdirResult?.error ||
                        `Ajon hiekkalaatikkohakemiston luonti epäonnistui: ${file.filePath}`,
                }

            }

            const writeResult = await toolBus.execute("file", {
                action: "write",
                file: check.absolutePath,
                content: file.code || "",
            })

            if (!writeResult?.success) {

                return {
                    success: false,
                    code: "verification_write_failed",
                    error:
                        writeResult?.error ||
                        `Ajettavan koodin kirjoitus hiekkalaatikkoon epäonnistui: ${file.filePath}`,
                }

            }

        }

        const targetCheck = resolveSafeVerificationPath(runId, targetFilePath)

        const runDir = resolveVerificationRunDir(runId)

        try {

            const { stdout, stderr } = await execFileAsync(
                "node",
                [targetCheck.absolutePath],
                {
                    cwd: PROJECT_ROOT,
                    timeout: timeoutMsOverride ?? TIMEOUT_MS,
                    maxBuffer: MAX_BUFFER_BYTES,
                    env: process.env,
                },
            )

            return {
                success: true,
                status: "passed",
                output: truncateOutput(`${stdout}\n${stderr}`.trim()),
            }

        } catch (error) {

            // error.killed on tosi kun Node itse päätti lapsiprosessin
            // (aikakatkaisu TAI maxBuffer ylitys).
            const timedOut = Boolean(error.killed)

            const combinedOutput = truncateOutput(
                `${error.stdout || ""}\n${error.stderr || ""}`.trim() ||
                    error.message,
            )

            return {
                success: true,
                status: timedOut ? "timeout" : "failed",
                output: combinedOutput,
            }

        } finally {

            await fs.rm(runDir, { recursive: true, force: true })

        }

    },

}

export default runCodeChangeDraftSkill

export { TIMEOUT_MS, MAX_BUFFER_BYTES }
