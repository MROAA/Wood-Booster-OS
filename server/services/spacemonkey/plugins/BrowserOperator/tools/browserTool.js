/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Browser Operator Tool
 *
 * Ajaa ennalta määritellyn käyttöliittymäskenaarion eristetyssä
 * selaimessa (browser/BrowserOperator.js). Skenaario valitaan
 * tunnisteella - osoitteita tai askelia ei oteta keskustelusta.
 * Työtila, tehtävä ja (testeissä) selaimen korvike tulevat ToolBusin
 * runtime-argumenttina.
 */

import { runBrowserScenario } from "../../../browser/BrowserOperator.js"

import { getScenario } from "../../../browser/scenarios.js"

const browserTool = {

    id: "browser-operator",

    name: "Browser Operator",

    description:
        "Runs a predefined UI scenario in an isolated Playwright browser " +
        "against HQ's local development UI. Only HQ's local origins and " +
        "read-only requests are allowed; no in-page script execution.",

    readOnly: false,

    actions: ["run-scenario"],

    async execute(input = {}, runtime = null) {

        if (input.action !== "run-scenario") {
            return { success: false, code: "unknown_action", error: `Tuntematon toiminto: ${input.action}` }
        }

        const scenario = getScenario(input.scenarioId)

        if (!scenario) {
            return { success: false, code: "unknown_scenario", error: `Tuntematon testi: ${input.scenarioId}` }
        }

        if (!runtime?.workspace || !input.taskId) {
            return { success: false, code: "workspace_missing", error: "Työtila tai tehtävä puuttuu." }
        }

        const report = await runBrowserScenario({
            scenario,
            workspace: runtime.workspace,
            taskId: input.taskId,
            ...(runtime.launcher ? { launcher: runtime.launcher } : {}),
            ...(runtime.memoryGuard ? { memoryGuard: runtime.memoryGuard } : {}),
            ...(runtime.signal ? { signal: runtime.signal } : {}),
        })

        return { success: true, report }

    },

}

export default browserTool
