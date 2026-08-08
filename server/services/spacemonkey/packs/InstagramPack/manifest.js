/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Instagram Capability Pack Manifest
 */

const InstagramPack = {

    id: "instagram-pack",

    name: "Instagram Pack",

    version: "1.0.0",

    author: "Wood-Booster",

    description:
        "Professional Instagram content creation and publishing capability.",

    category: "marketing",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    dependencies: [
        "development-pack",
        "image-pack",
        "video-pack",
    ],

    capabilities: [

        "instagram",

        "instagram-post",

        "instagram-carousel",

        "instagram-reels",

        "instagram-story",

        "instagram-caption",

        "instagram-hashtags",

        "instagram-analytics",

        "instagram-scheduling",

        "instagram-comments",

        "instagram-messages",

    ],

    skills: [

        "generate-caption",

        "generate-hashtags",

        "select-images",

        "edit-images",

        "generate-reel",

        "generate-story",

        "schedule-post",

        "publish-post",

        "reply-comments",

        "analyze-performance",

    ],

    workflows: [

        "publish-product",

        "publish-project",

        "weekly-content",

        "marketing-campaign",

        "customer-story",

    ],

    professions: [

        "social-media-manager",

        "marketing-manager",

        "content-creator",

        "brand-manager",

    ],

    tools: [

        "instagram",

        "image",

        "video",

        "filesystem",

        "browser",

    ],

    permissions: [

        "instagram.read",

        "instagram.publish",

        "instagram.messages",

        "filesystem.read",

    ],

}

export default InstagramPack
