/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * List Unfinished Projects Skill
 *
 * Hakee HQ:n keskeneräiset projektit (tila jokin muu kuin "Valmis",
 * sama raja kuin Dashboardilla) hq-projects-työkalun kautta. Vain luku.
 */

const listUnfinishedProjectsSkill = {

    id: "hq-list-unfinished-projects",

    name: "List Unfinished Projects",

    description:
        "Lists HQ projects whose status is not Valmis, with the " +
        "number of open workflow steps. Read-only.",

    async execute(context) {

        const { toolBus, prisma } = context || {}

        return toolBus.execute(
            "hq-projects",
            { action: "list-unfinished" },
            { prisma },
        )

    },

}

export default listUnfinishedProjectsSkill
