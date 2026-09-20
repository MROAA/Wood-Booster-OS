/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Python Draft Skill
 *
 * "Aja ja näytä tulostus" - ajaa luonnoksen OMAN koodin suoraan
 * hiekkalaatikossa, ei generoitua testiä (vrt.
 * generatePythonTestSkill.js/runPythonTestSkill.js, jotka ajavat
 * erillisen unittest-testin). Ei koskaan kosketa todellista
 * kohdetiedostoa, ei koskaan tallenna mitään - kertaluontoinen,
 * uudelleenajettava esikatselu ihmisen omasta pyynnöstä.
 *
 * Sama turvallinen suorituskerros kuin runPythonTestSkill.js:ssä:
 * täsmälleen sama, kiinteä komentomuoto ("python3 <hiekkalaatikkopolku>")
 * execFile:lla (ei shell-tulkintaa), sama aikakatkaisu ja tulosteen
 * kokorajoitus, ja hiekkalaatikkohakemisto siivotaan aina pois
 * finally-lohkossa.
 */

import { execFile } from "node:child_process"

import { promisify } from "node:util"

import path from "node:path"

import crypto from "node:crypto"

import fs from "node:fs/promises"

import { PROJECT_ROOT } from "../../CodeChangeDeveloper/skills/projectSandbox.js"

import { resolveVerificationRunDir, resolveSafeVerificationPath } from "../../CodeChangeDeveloper/skills/verificationSandbox.js"

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

const runPythonDraftSkill = {

    id: "run-python-draft",

    name: "Run Python Draft",

    description:
        "Writes a draft's own code into a sandboxed scratch directory " +
        "and runs it directly (`python3 <sandboxed path>`) via " +
        "execFile, never a caller-supplied command string, with a " +
        "hard timeout and output cap. Always cleans up its scratch " +
        "directory afterward. Never touches the real target file.",

    async execute(context) {

        const {
            draftCode,
            toolBus,
            // Vain testauskäyttöön - reitti ei koskaan aseta tätä,
            // joten oletusarvo (TIMEOUT_MS) pätee aina oikeissa
            // pyynnöissä.
            timeoutMsOverride,
        } = context || {}

        const runId = crypto.randomUUID()

        const targetCheck = resolveSafeVerificationPath(runId, "target.py")

        if (!targetCheck.ok) {

            return {
                success: false,
                code: "verification_sandbox_error",
                error: "Ajon hiekkalaatikon polkua ei voitu ratkaista.",
            }

        }

        const mkdirResult = await toolBus.execute("file", {
            action: "mkdir",
            file: path.dirname(targetCheck.absolutePath),
        })

        if (!mkdirResult?.success) {

            return {
                success: false,
                code: "verification_mkdir_failed",
                error:
                    mkdirResult?.error ||
                    "Ajon hiekkalaatikkohakemiston luonti epäonnistui.",
            }

        }

        const writeResult = await toolBus.execute("file", {
            action: "write",
            file: targetCheck.absolutePath,
            content: draftCode || "",
        })

        if (!writeResult?.success) {

            return {
                success: false,
                code: "verification_write_failed",
                error:
                    writeResult?.error ||
                    "Ajettavan koodin kirjoitus hiekkalaatikkoon epäonnistui.",
            }

        }

        const runDir = resolveVerificationRunDir(runId)

        try {

            const { stdout, stderr } = await execFileAsync(
                "python3",
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

export default runPythonDraftSkill

export { TIMEOUT_MS, MAX_BUFFER_BYTES }
