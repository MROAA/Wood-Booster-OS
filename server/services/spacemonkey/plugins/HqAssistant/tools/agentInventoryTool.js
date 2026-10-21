/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Agent Inventory Tool
 *
 * Kertoo Spacemonkeyn agentit lähteistään (inventory/agentInventory.js).
 * Vain luku: lukee koodia ja ajossa olevan runtimen tilan, ei suorita
 * agentteja eikä kirjoita mitään. Runtime-riippuvuudet tulevat ToolBusin
 * runtime-argumenttina.
 */

import { buildAgentInventory } from "../../../inventory/agentInventory.js"

const agentInventoryTool = {

    id: "spacemonkey-agents",

    name: "Spacemonkey Agent Inventory (read-only)",

    description:
        "Lists Spacemonkey's agents from their real sources: Agent " +
        "Runtime registrations with health, chat personas, plugins, static " +
        "claims and agent classes found in code. Read-only.",

    readOnly: true,

    async execute(input = {}, runtime = null) {

        if (!runtime?.root) {
            return {
                success: false,
                code: "root_missing",
                error: "Projektijuuri puuttuu.",
            }
        }

        try {
            const inventory = await buildAgentInventory({
                root: runtime.root,
                agentRuntime: runtime.agentRuntime,
                pluginManager: runtime.pluginManager,
                capabilityRegistry: runtime.capabilityRegistry,
            })

            return { success: true, inventory }
        } catch (error) {
            return {
                success: false,
                code: "inventory_failed",
                error: error.message,
            }
        }

    },

}

export default agentInventoryTool
