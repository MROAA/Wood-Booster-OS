/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Verification Test Skill
 *
 * Kirjoittaa (muttei aja) pienen node:test-testin ehdotetulle
 * muutokselle - vain luku/generointi hiekkalaatikkoon, ei koskaan
 * kosketa todellista kohdetiedostoa.
 *
 * Rehellinen rajaus: toiminnallinen testaus on tässä vaiheessa
 * mielekästä vain "tavalliselle" JS/TS-logiikalle (funktiot,
 * palvelut, skillit), jotka voi tuoda ja kutsua suoraan. Projektissa
 * ei ole (eikä tämä skilli lisää) React-komponenttien
 * käyttöliittymätestaukseen tarvittavaa työkalua (esim. jsdom,
 * @testing-library/react) eikä Python-testausajuria (esim. pytest) -
 * .jsx/.tsx- ja .py-tiedostoille (ja muille ei-koodi-tiedostoille
 * kuten .json/.md/.css/.html/.prisma) tämä skilli palauttaa
 * skipped:true selkeällä syyllä sen sijaan että väittäisi testanneensa
 * jotain mitä ei oikeasti voitu testata.
 */

import path from "node:path"

import crypto from "node:crypto"

import { resolveSafeVerificationPath } from "./verificationSandbox.js"

const TESTABLE_EXTENSIONS = new Set([".js", ".ts"])

const SKIP_REASONS = {
    ".jsx":
        "Tämä on käyttöliittymäkomponentti (JSX). Projektissa ei ole " +
        "vielä työkaluja komponenttien toiminnalliseen testaamiseen, " +
        "joten vain koodimuutos näytetään ilman testiä.",
    ".tsx":
        "Tämä on käyttöliittymäkomponentti (TSX). Projektissa ei ole " +
        "vielä työkaluja komponenttien toiminnalliseen testaamiseen, " +
        "joten vain koodimuutos näytetään ilman testiä.",
    ".py":
        "Python-tiedostoille ei ole vielä automaattista " +
        "toiminnallista testausta tässä vaiheessa.",
}

function classifyTestability(filePath) {

    const lastDot = filePath.lastIndexOf(".")

    const extension =
        lastDot === -1 ? "" : filePath.slice(lastDot).toLowerCase()

    if (TESTABLE_EXTENSIONS.has(extension)) {

        return { testable: true }

    }

    return {
        testable: false,
        reason:
            SKIP_REASONS[extension] ||
            "Tämä tiedostotyyppi ei sisällä suoraan testattavaa " +
                "logiikkaa, joten vain koodimuutos näytetään ilman " +
                "testiä.",
    }

}

const generateVerificationTestSkill = {

    id: "generate-verification-test",

    name: "Generate Verification Test",

    description:
        "Writes a small node:test test for the specific proposed " +
        "change, into a sandboxed scratch directory. Never touches " +
        "the real target file. Skips honestly for file types that " +
        "can't be functionally tested yet (.jsx/.tsx/.py and non-code " +
        "files).",

    async execute(context) {

        const {
            prompt,
            filePath,
            proposedCode,
            toolBus,
            generateVerificationTest,
        } = context || {}

        const classification = classifyTestability(filePath || "")

        if (!classification.testable) {

            return {
                success: true,
                skipped: true,
                skippedReason: classification.reason,
            }

        }

        const runId = crypto.randomUUID()

        const targetCheck = resolveSafeVerificationPath(runId, "target.mjs")

        const testCheck = resolveSafeVerificationPath(runId, "target.test.mjs")

        if (!targetCheck.ok || !testCheck.ok) {

            return {
                success: false,
                code: "verification_sandbox_error",
                error: "Testien hiekkalaatikon polkua ei voitu ratkaista.",
            }

        }

        const { title, explanation, code: testCode } =
            await generateVerificationTest({
                prompt,
                proposedCode,
                filePath,
            })

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
                    "Testien hiekkalaatikkohakemiston luonti epäonnistui.",
            }

        }

        const writeTargetResult = await toolBus.execute("file", {
            action: "write",
            file: targetCheck.absolutePath,
            content: proposedCode,
        })

        const writeTestResult = await toolBus.execute("file", {
            action: "write",
            file: testCheck.absolutePath,
            content: testCode,
        })

        if (!writeTargetResult?.success || !writeTestResult?.success) {

            return {
                success: false,
                code: "verification_write_failed",
                error:
                    writeTargetResult?.error ||
                    writeTestResult?.error ||
                    "Testien hiekkalaatikkoon kirjoitus epäonnistui.",
            }

        }

        return {
            success: true,
            skipped: false,
            runId,
            testCode,
            testTitle: title,
            testExplanation: explanation,
            testFilePath: testCheck.absolutePath,
        }

    },

}

export default generateVerificationTestSkill

export { classifyTestability }
