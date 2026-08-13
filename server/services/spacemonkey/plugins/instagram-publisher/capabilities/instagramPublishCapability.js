/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Instagram Publish Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const instagramPublishCapability = {

    name: "Instagram Publishing",

    description:
        "Publish approved social media drafts (single image, " +
        "carousel, or Reel) to Instagram.",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "social-media-manager",
        "marketing-manager",
    ],

    skills: [
        "publish-instagram-post",
    ],

    workflows: [
        "publish-instagram-post-workflow",
    ],

    permissions: [
        "instagram.publish",
        "network.http",
    ],

}

export default instagramPublishCapability
