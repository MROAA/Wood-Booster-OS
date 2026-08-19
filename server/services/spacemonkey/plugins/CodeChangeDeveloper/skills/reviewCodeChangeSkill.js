/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Review Code Change Skill
 *
 * JS-monitiedostopuolen vastine reviewPythonCodeSkill.js:lle. Lukee
 * olemassa olevan projektitiedoston ja pyytää AI:ta antamaan
 * rakentavan katselmoinnin luonnollisella kielellä. Vain luku - ei
 * hyväksymiskiertoa, ei tallennusta.
 *
 * Käyttää resolveSafeProjectFilePath:ia (ks. explainCodeChangeSkill.js
 * vastaava perustelu) sen sijaan että rajoittaisi tiedostotyypin
 * yhteen päätteeseen.
 */

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const reviewCodeChangeSkill = {

    id: "review-code-change",

    name: "Review Code Change",

    description:
        "Reads an existing project file and asks the AI to give a " +
        "constructive review of it in plain language.",

    async execute(context) {

        const { filePath, toolBus, reviewCodeChange } = context || {}

        const check = resolveSafeProjectFilePath(filePath)

        if (!check.ok) {

            return {
                success: false,
                code: check.code,
                error: `Tiedostopolku ei ole sallittu (${check.code}).`,
            }

        }

        const readResult = await toolBus.execute("file", {
            action: "read",
            file: check.absolutePath,
        })

        if (!readResult?.success) {

            return {
                success: false,
                code: "read_failed",
                error: readResult?.error || "Tiedoston luku epäonnistui.",
            }

        }

        const { review } = await reviewCodeChange({
            code: readResult.content,
        })

        return {
            success: true,
            filePath: check.absolutePath,
            review,
        }

    },

}

export default reviewCodeChangeSkill
