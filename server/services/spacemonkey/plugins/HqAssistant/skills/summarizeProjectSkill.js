/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Summarize Project Skill
 *
 * Hakee yhden HQ-projektin yhteenvetotiedot hq-projects-työkalun
 * kautta. Projekti tulee aina oikeana tunnisteena (käyttäjän avaama
 * projekti, runtimeContext.activeProject.id), ei selaimen tekstistä
 * arvattuna. Vain luku.
 */

const summarizeProjectSkill = {

    id: "hq-summarize-project",

    name: "Summarize Project",

    description:
        "Reads one HQ project's status, workflow steps, timeline, " +
        "quote status and latest note by its real id. Read-only.",

    async execute(context) {

        const { toolBus, prisma, projectId } = context || {}

        return toolBus.execute(
            "hq-projects",
            { action: "summary", projectId },
            { prisma },
        )

    },

}

export default summarizeProjectSkill
