/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Explain Code Change Skill
 *
 * JS-monitiedostopuolen vastine explainPythonCodeSkill.js:lle. Lukee
 * olemassa olevan projektitiedoston (minkä tahansa sallitun
 * tiedostotyypin - ei vain .py) File Toolin kautta ja pyytää AI:ta
 * selittämään sen luonnollisella kielellä. Vain luku - ei koskaan
 * kirjoita tai suorita mitään, joten tälle ei tarvita
 * hyväksymiskiertoa.
 *
 * Käyttää resolveSafeProjectFilePath:ia (sama polkuturva kuin
 * generateCodeChangeSkill.js:llä) sen sijaan että kirjoittaisi oman,
 * kapeamman .py-rajoitetun tarkistuksen kuten Python-puolen skilli
 * tekee - tämä skilli kohdistuu tarkoituksella mihin tahansa
 * projektitiedostoon.
 */

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const explainCodeChangeSkill = {

    id: "explain-code-change",

    name: "Explain Code Change",

    description:
        "Reads an existing project file and asks the AI to explain " +
        "what it does in plain language.",

    async execute(context) {

        const { filePath, toolBus, explainCodeChange } = context || {}

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

        const { explanation } = await explainCodeChange({
            code: readResult.content,
        })

        return {
            success: true,
            filePath: check.absolutePath,
            explanation,
        }

    },

}

export default explainCodeChangeSkill
