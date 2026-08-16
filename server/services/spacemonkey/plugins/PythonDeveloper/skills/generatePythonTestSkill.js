/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Python Test Skill
 *
 * Kirjoittaa (muttei aja) pienen unittest-testin ehdotetulle Python-
 * muutokselle - vain luku/generointi hiekkalaatikkoon
 * (.dev-studio-verification/, sama jaettu hiekkalaatikko kuin JS-
 * puolella - ks. verificationSandbox.js), ei koskaan kosketa
 * todellista kohdetiedostoa.
 *
 * Toisin kuin JS-puolen generateVerificationTestSkill.js, tässä ei ole
 * tiedostotyyppikohtaista skip-logiikkaa - PythonCodeDraft on aina
 * .py, joten sellainen haara ei koskaan laukeaisi. Tarkoituksellinen
 * yksinkertaistus, ei unohdus.
 */

import path from "node:path"

import crypto from "node:crypto"

import { resolveSafeVerificationPath } from "../../CodeChangeDeveloper/skills/verificationSandbox.js"

const generatePythonTestSkill = {

    id: "generate-python-test",

    name: "Generate Python Test",

    description:
        "Writes a small unittest test for the specific proposed " +
        "Python change, into a sandboxed scratch directory. Never " +
        "touches the real target file.",

    async execute(context) {

        const {
            prompt,
            filePath,
            proposedCode,
            toolBus,
            generatePythonVerificationTest,
        } = context || {}

        const runId = crypto.randomUUID()

        const targetCheck = resolveSafeVerificationPath(runId, "target.py")

        const testCheck = resolveSafeVerificationPath(runId, "target_test.py")

        if (!targetCheck.ok || !testCheck.ok) {

            return {
                success: false,
                code: "verification_sandbox_error",
                error: "Testien hiekkalaatikon polkua ei voitu ratkaista.",
            }

        }

        const { title, explanation, code: testCode } =
            await generatePythonVerificationTest({
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

export default generatePythonTestSkill
