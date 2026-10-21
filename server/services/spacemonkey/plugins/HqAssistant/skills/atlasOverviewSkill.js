/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Atlas Overview Skill
 *
 * Hakee HQ:n Atlasin hq-atlas-työkalun kautta. Vain luku.
 */

const atlasOverviewSkill = {

    id: "hq-atlas-overview",

    name: "Atlas Overview",

    description:
        "Builds the HQ Project Atlas through the hq-atlas tool. Read-only.",

    async execute(context) {

        const { toolBus, projectRoot } = context || {}

        return toolBus.execute(
            "hq-atlas",
            {},
            { root: projectRoot },
        )

    },

}

export default atlasOverviewSkill
