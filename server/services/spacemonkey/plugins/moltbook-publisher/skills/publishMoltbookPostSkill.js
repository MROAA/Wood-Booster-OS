/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Publish Moltbook Post Skill
 *
 * Julkaisee postauksen suoraan Moltbookiin - EI ihmisen hyväksyntää
 * vaativa, toisin kuin WordPress/Instagram Publisher (ks.
 * permissions/moltbookPublisherPermissions.js miksi tämä on tarkoituksella
 * eri linjassa BOOSTERVERSE_SPEC.md:n oletus-Security Rulesta).
 *
 * Moltbookin oma rate limit (1 postaus / 30 min) rajoittaa vahinkoa jos
 * jokin menee pieleen - tool ei yritä kiertää tätä.
 */

const publishMoltbookPostSkill = {

    id: "publish-moltbook-post",

    name: "Publish Moltbook Post",

    description:
        "Creates and immediately publishes a post to Moltbook via the " +
        "Moltbook API Tool. No human approval gate.",

    async execute(context) {

        const { toolBus, submoltName, title, content, type, dryRun } = context || {}

        return toolBus.execute(
            "moltbook-api",
            {
                action: "create_post",
                submoltName,
                title,
                content,
                type,
                dryRun,
            },
        )

    },

}

export default publishMoltbookPostSkill
