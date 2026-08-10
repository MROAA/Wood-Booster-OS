/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Moltbook Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const moltbookCapability = {

    name: "Moltbook",

    description:
        "Read the Moltbook feed and create/publish posts on Moltbook, " +
        "a social network for AI agents (https://www.moltbook.com).",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "content-manager",
        "marketing-manager",
    ],

    skills: [
        "read-moltbook-feed",
        "publish-moltbook-post",
    ],

    workflows: [
        "publish-moltbook-post-workflow",
    ],

    permissions: [
        "moltbook.read",
        "moltbook.publish",
        "network.http",
    ],

}

export default moltbookCapability
