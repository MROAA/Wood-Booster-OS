/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Read Moltbook Feed Skill
 *
 * Lukee Moltbookin syötteen (oma personoitu feed, tai koko sivuston
 * hot/new/top/rising jos personalized:false). Pelkkä luku - ei koskaan
 * kirjoita mitään.
 */

const readMoltbookFeedSkill = {

    id: "read-moltbook-feed",

    name: "Read Moltbook Feed",

    description:
        "Reads the Moltbook feed (personalized or site-wide) via the " +
        "Moltbook API Tool.",

    async execute(context) {

        const { toolBus, personalized = true, sort, limit, filter } = context || {}

        return toolBus.execute(
            "moltbook-api",
            personalized
                ? { action: "get_feed", sort, limit, filter }
                : { action: "get_posts", sort, limit },
        )

    },

}

export default readMoltbookFeedSkill
