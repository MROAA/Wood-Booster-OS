/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Python Test Skill
 *
 * Python-vastine JS-puolen runVerificationTestSkill.js:lle - sama
 * turvallinen suorituskerros: ajaa AINA täsmälleen saman, kiinteän
 * komennon ("python3 <sandboxed-polku>") execFile:lla (ei shell-
 * tulkintaa), kiinteällä aikakatkaisulla ja tulosteen kokorajalla.
 *
 * Ajaa testitiedoston SUORAAN skriptinä (python3 <polku>), ei
 * "python3 -m unittest <moduulipolku>" -moduulihakuna - runId on
 * crypto.randomUUID(), joka sisältää väliviivoja, eivätkä ne kelpaa
 * Python-moduulinimen merkeiksi, joten moduulihaku olisi rikki jo
 * lähtökohtaisesti. Suora skriptiajo ei tarvitse tätä ollenkaan:
 * Python lisää automaattisesti skriptin oman hakemiston
 * sys.path[0]:ksi, joten testitiedoston "from target import ..."
 * -tuonti toimii sellaisenaan (ks. pythonVerificationTestGenerator.js,
 * joka vaatii testin päättyvän unittest.main()-kutsuun juuri tätä
 * suoraa ajotapaa varten).
 *
 * Siivoaa ajon jälkeisen hiekkalaatikkohakemiston aina pois
 * finally-lohkossa, onnistui ajo tai ei.
 */

import { execFile } from "node:child_process"

import { promisify } from "node:util"

import fs from "node:fs/promises"

import { PROJECT_ROOT } from "../../CodeChangeDeveloper/skills/projectSandbox.js"

import { resolveVerificationRunDir } from "../../CodeChangeDeveloper/skills/verificationSandbox.js"

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

const runPythonTestSkill = {

    id: "run-python-test",

    name: "Run Python Test",

    description:
        "Runs exactly one fixed command shape (`python3 <sandboxed " +
        "test file>`) via execFile, never a caller-supplied command " +
        "string, with a hard timeout and output cap. Always cleans up " +
        "its scratch directory afterward.",

    async execute(context) {

        const {
            runId,
            testFilePath,
            skipped,
            // Vain testauskäyttöön - reitti ei koskaan aseta tätä,
            // joten oletusarvo (TIMEOUT_MS) pätee aina oikeissa
            // pyynnöissä.
            timeoutMsOverride,
        } = context || {}

        if (skipped) {

            return {
                success: true,
                testStatus: "skipped",
            }

        }

        if (!runId || !testFilePath) {

            return {
                success: false,
                code: "missing_verification_run",
                error: "Ajettavaa testiä ei löytynyt.",
            }

        }

        const runDir = resolveVerificationRunDir(runId)

        try {

            const { stdout, stderr } = await execFileAsync(
                "python3",
                [testFilePath],
                {
                    cwd: PROJECT_ROOT,
                    timeout: timeoutMsOverride ?? TIMEOUT_MS,
                    maxBuffer: MAX_BUFFER_BYTES,
                    env: process.env,
                },
            )

            return {
                success: true,
                testStatus: "passed",
                testOutput: truncateOutput(`${stdout}\n${stderr}`.trim()),
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
                testStatus: timedOut ? "timeout" : "failed",
                testOutput: combinedOutput,
            }

        } finally {

            await fs.rm(runDir, { recursive: true, force: true })

        }

    },

}

export default runPythonTestSkill

export { TIMEOUT_MS, MAX_BUFFER_BYTES }
