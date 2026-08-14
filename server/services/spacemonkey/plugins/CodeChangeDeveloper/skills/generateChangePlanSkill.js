/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Change Plan Skill
 *
 * Pyytää AI:ta ehdottamaan suunnitelman (mitkä tiedostot ja miksi)
 * useamman tiedoston muutokselle. Ei koskaan generoi tiedostojen
 * sisältöä eikä kirjoita mihinkään - vain listan, jonka kutsuja
 * (reitti) tallentaa CodeChangeDraftSetiksi ihmisen hyväksyttäväksi.
 *
 * Jokainen suunnitelman tiedosto tarkistetaan heti saman
 * hiekkalaatikon (resolveSafeProjectFilePath) läpi jota
 * generate-code-change ja write-code-change jo käyttävät - jos AI
 * ehdottaa jotain kiellettyä (esim. .env tai node_modules), se
 * merkitään suunnitelmassa selvästi estetyksi sen sijaan että koko
 * suunnitelma hylättäisiin tai estetty tiedosto käsiteltäisiin
 * hiljaa myöhemmin.
 */

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const generateChangePlanSkill = {

    id: "generate-change-plan",

    name: "Generate Change Plan",

    description:
        "Asks the AI which files a multi-file request needs and why, " +
        "without generating any file content yet. Every proposed file " +
        "path is validated against the same project sandbox used " +
        "elsewhere in this plugin.",

    async execute(context) {

        const { prompt, generateChangePlan } = context || {}

        if (!prompt) {

            return {
                success: false,
                code: "missing_prompt",
                error: "Pyyntö (prompt) vaaditaan.",
            }

        }

        const { files, explanation } = await generateChangePlan({ prompt })

        const checkedFiles = files.map(file => {

            const check = resolveSafeProjectFilePath(file.filePath)

            if (!check.ok) {

                return {
                    ...file,
                    filePath: file.filePath,
                    blocked: true,
                    blockedCode: check.code,
                }

            }

            return {
                ...file,
                filePath: check.relativePath,
                blocked: false,
                blockedCode: null,
            }

        })

        return {
            success: true,
            explanation,
            files: checkedFiles,
        }

    },

}

export default generateChangePlanSkill
