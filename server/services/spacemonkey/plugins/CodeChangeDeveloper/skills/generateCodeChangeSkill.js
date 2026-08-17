/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Code Change Skill
 *
 * Lukee kohdetiedoston nykyisen sisällön (jos tiedosto on jo
 * olemassa) projektin sisältä File Toolin kautta, ja pyytää AI:ta
 * tuottamaan ehdotuksen koko tiedoston uudesta sisällöstä annetun
 * pyynnön perusteella. Ei koskaan kirjoita mitään - kutsuja (reitti)
 * tallentaa tuloksen CodeChangeDraftiksi ihmisen hyväksyttäväksi,
 * sama draft/approve/write-kierto kuin PythonDeveloper-pluginilla.
 */

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const generateCodeChangeSkill = {

    id: "generate-code-change",

    name: "Generate Code Change",

    description:
        "Reads a project file (if it exists) and asks the AI to " +
        "propose new content for it based on a plain-language " +
        "request. Never writes anything itself.",

    async execute(context) {

        const { prompt, filePath, model, toolBus, generateCodeChange } =
            context || {}

        if (!prompt) {

            return {
                success: false,
                code: "missing_prompt",
                error: "Pyyntö (prompt) vaaditaan.",
            }

        }

        const check = resolveSafeProjectFilePath(filePath)

        if (!check.ok) {

            return {
                success: false,
                code: check.code,
                error:
                    "Tiedostopolku ei ole sallittu " +
                    `(${check.code}).`,
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

        let originalCode = null

        if (existsResult.exists) {

            const readResult = await toolBus.execute("file", {
                action: "read",
                file: check.absolutePath,
            })

            if (!readResult?.success) {

                return {
                    success: false,
                    code: "read_failed",
                    error:
                        readResult?.error ||
                        "Tiedoston luku epäonnistui.",
                }

            }

            originalCode = readResult.content

        }

        const {
            title,
            explanation,
            code: proposedCode,
            model: resolvedModel,
        } = await generateCodeChange({
            prompt,
            currentCode: originalCode,
            filePath: check.relativePath,
            model,
        })

        return {
            success: true,
            filePath: check.relativePath,
            title,
            explanation,
            originalCode,
            proposedCode,
            model: resolvedModel,
        }

    },

}

export default generateCodeChangeSkill
