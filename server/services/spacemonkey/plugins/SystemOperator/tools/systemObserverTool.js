/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * System Observer Tool
 *
 * Koneen ja HQ-palveluiden tila (os/systemObserver.js). Vain luku:
 * kiinteät palvelut ja terveysreitit, ei shelliä, ei käyttäjän antamia
 * komentoja eikä osoitteita. Projektin ja työtilan juuret tulevat
 * ToolBusin runtime-argumenttina.
 */

import {
    checkHealthEndpoints,
    checkService,
    observeSystem,
} from "../../../os/systemObserver.js"

const systemObserverTool = {

    id: "system-observer",

    name: "System Observer (read-only)",

    description:
        "Reads memory, load, disk, allowed services, allowed local health " +
        "endpoints, git state and watched process memory. Never runs a " +
        "free-form command or reads process command lines or environments.",

    readOnly: true,

    actions: ["snapshot", "service", "endpoints"],

    async execute(input = {}, runtime = null) {

        if (input.action === "service") {
            const service = await checkService(input.serviceId)

            return service.allowed
                ? { success: true, service }
                : { success: false, code: "unknown_service", error: `Palvelua ${input.serviceId} ei ole sallittu.` }
        }

        if (input.action === "endpoints") {
            const endpoints = await checkHealthEndpoints(
                Array.isArray(input.endpointIds) ? input.endpointIds : [],
                { deps: runtime?.observerDeps || {} },
            )

            return { success: true, endpoints }
        }

        if (input.action !== "snapshot") {
            return { success: false, code: "unknown_action", error: `Tuntematon toiminto: ${input.action}` }
        }

        if (!runtime?.projectRoot) {
            return { success: false, code: "root_missing", error: "Projektijuuri puuttuu." }
        }

        try {
            return {
                success: true,
                report: await observeSystem({
                    projectRoot: runtime.projectRoot,
                    workspaceRoot: runtime.workspaceRoot || null,
                    deps: runtime.observerDeps || {},
                }),
            }
        } catch (error) {
            return { success: false, code: "observe_failed", error: error.message }
        }

    },

}

export default systemObserverTool
