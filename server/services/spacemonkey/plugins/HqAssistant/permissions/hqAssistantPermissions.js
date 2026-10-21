/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * HQ Assistant Permissions
 *
 * Sprint 1 sisältää vain lukuoikeuden. Kirjoittavat HQ-toiminnot
 * (tarjoukset, projektien muutokset) lisätään vasta kun palvelintason
 * valtuutus on käytössä (Security Sprint, Human Approval Gateway).
 */

const hqAssistantPermissions = [

    {
        id: "hq.projects.read",
        description:
            "Allows reading HQ project status, workflow steps, " +
            "timeline tasks, quote status and note excerpts.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "spacemonkey.agents.read",
        description:
            "Allows reading Spacemonkey's own agent inventory: runtime " +
            "registrations, health, chat personas, plugins and agent " +
            "classes found in code. No file contents are returned.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "hq.atlas.read",
        description:
            "Allows building the HQ Project Atlas: which systems exist, " +
            "whether the server or app loads them, and on which branches. " +
            "Read-only git queries; protected paths are never read.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default hqAssistantPermissions
