/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * WordPress Publish Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const wordpressPublishCapability = {

    name: "WordPress Publishing",

    description:
        "Publish approved blog drafts (title + content) to a " +
        "connected WordPress site.",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "content-manager",
        "marketing-manager",
    ],

    skills: [
        "publish-wordpress-post",
    ],

    workflows: [
        "publish-wordpress-post-workflow",
    ],

    permissions: [
        "wordpress.publish",
        "network.http",
    ],

}

export default wordpressPublishCapability
