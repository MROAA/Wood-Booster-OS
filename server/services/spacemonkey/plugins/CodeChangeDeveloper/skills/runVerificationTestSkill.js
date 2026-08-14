/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Verification Test Skill
 *
 * Turvallinen suorituskerros - TARKOITUKSELLA ei uudelleenkäytä
 * server/services/spacemonkey/skills/testing/TestRunnerSkill.js:ää,
 * joka ajaa mielivaltaisen komennon kutsujan syötteestä
 * (child_process.exec, ei aikakatkaisua, ei maxBuffer-rajaa). Tämä
 * skilli ajaa AINA täsmälleen saman, kiinteän komennon
 * ("node --test <sandboxed-polku>") execFile:lla (ei shell-tulkintaa)
 * yhtä juuri itse luotua, hiekkalaatikoitua testitiedostoa vastaan,
 * kiinteällä aikakatkaisulla ja tulosteen kokorajalla.
 *
 * Siivoaa ajon jälkeisen hiekkalaatikkohakemiston aina pois
 * finally-lohkossa, onnistui ajo tai ei.
 */

import path from "node:path"

import { execFile } from "node:child_process"

import { promisify } from "node:util"

import fs from "node:fs/promises"

import { PROJECT_ROOT } from "./projectSandbox.js"

import { resolveVerificationRunDir } from "./verificationSandbox.js"

const execFileAsync = promisify(execFile)

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 1_000_000

const MAX_OUTPUT_CHARS = 20000

/*
 * node --test asettaa itselleen NODE_TEST_CONTEXT/NODE_TEST_WORKER_ID
 * -ympäristömuuttujat kun se ajetaan toisen "node --test"-prosessin
 * sisällä (esim. tämän skillin OMAT yksikkötestit, jotka itsekin
 * ajetaan node --test:llä). execFile perii oletuksena koko
 * process.env:n, joten ilman tätä siivousta juuri luotu
 * lapsi-testiprosessi luulisi olevansa osa vanhemman testiajon
 * työntekijäpoolia ja raportoisi tuloksensa eri kanavaa pitkin exit
 * coden sijaan - jolloin epäonnistunutkin testi näyttäisi tässä aina
 * "läpäisseeltä" (havaittu juuri tämän skillin omia testejä
 * kirjoittaessa). Poistetaan nämä eksplisiittisesti, jotta lapsiajo
 * käyttäytyy aina itsenäisenä ylätason testiajona riippumatta siitä,
 * ajetaanko TÄTÄ skilliä itseään sattumalta jonkun toisen
 * node --test -prosessin sisällä.
 */
function buildChildEnv() {

    const env = { ...process.env }

    delete env.NODE_TEST_CONTEXT

    delete env.NODE_TEST_WORKER_ID

    return env

}

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

const runVerificationTestSkill = {

    id: "run-verification-test",

    name: "Run Verification Test",

    description:
        "Runs exactly one fixed command shape (`node --test " +
        "<sandboxed test file>`) via execFile, never a caller-supplied " +
        "command string, with a hard timeout and output cap. Always " +
        "cleans up its scratch directory afterward.",

    async execute(context) {

        const {
            runId,
            testFilePath,
            skipped,
            // Vain testauskäyttöön - reitti ei koskaan aseta tätä,
            // joten oletusarvo (TIMEOUT_MS) pätee aina oikeissa
            // pyynnöissä. Ilman tätä timeout-polun yksikkötestaus
            // vaatisi oikeasti 15 sekunnin odottamisen.
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
                "node",
                ["--test", testFilePath],
                {
                    cwd: PROJECT_ROOT,
                    timeout: timeoutMsOverride ?? TIMEOUT_MS,
                    maxBuffer: MAX_BUFFER_BYTES,
                    env: buildChildEnv(),
                },
            )

            return {
                success: true,
                testStatus: "passed",
                testOutput: truncateOutput(`${stdout}\n${stderr}`.trim()),
            }

        } catch (error) {

            // error.killed on tosi kun Node itse päätti lapsiprosessin
            // (aikakatkaisu TAI maxBuffer ylitys) - error.signal EI
            // luotettavasti sisällä "SIGTERM":ää täällä, koska
            // "node --test" nappaa signaalin ja sulkeutuu siististi
            // omalla poistumiskoodillaan ennen kuin raaka signaali
            // näkyisi execFile:n virheoliossa (havaittu manuaalisesti
            // testaamalla).
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

export default runVerificationTestSkill

export { TIMEOUT_MS, MAX_BUFFER_BYTES }
