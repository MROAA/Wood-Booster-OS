/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * List Spacemonkey Agents Skill
 *
 * Hakee agentti-inventaarion spacemonkey-agents-työkalun kautta.
 * Vain luku.
 */

const listSpacemonkeyAgentsSkill = {

    id: "list-spacemonkey-agents",

    name: "List Spacemonkey Agents",

    description:
        "Builds the agent inventory through the spacemonkey-agents tool. " +
        "Read-only.",

    async execute(context) {

        const { toolBus, inventoryRuntime } = context || {}

        return toolBus.execute(
            "spacemonkey-agents",
            {},
            inventoryRuntime,
        )

    },

}

export default listSpacemonkeyAgentsSkill
