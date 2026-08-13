/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * WordPress Capability Pack Manifest
 */

const WordPressPack = {

    id: "wordpress-pack",

    name: "WordPress Pack",

    version: "1.0.0",

    author: "Wood-Booster",

    description:
        "Professional WordPress management capability.",

    category: "marketing",

    maturity: {

        level: 1,

        maxLevel: 4,

    },

    dependencies: [

        "development-pack",
        "linux-pack",
        "git-pack",

    ],

    capabilities: [

        "wordpress",

        "wordpress-core",

        "wordpress-admin",

        "wordpress-content",

        "wordpress-media",

        "wordpress-seo",

        "wordpress-security",

        "woocommerce",

        "wordpress-backup",

        "wordpress-analytics",

    ],

    skills: [

        "create-page",

        "edit-page",

        "delete-page",

        "create-post",

        "edit-post",

        "publish-post",

        "schedule-post",

        "upload-media",

        "manage-users",

        "manage-plugins",

        "manage-themes",

        "optimize-seo",

        "backup-site",

        "restore-site",

        "update-wordpress",

        "analyze-performance",

    ],

    workflows: [

        "publish-blog",

        "publish-product",

        "create-landing-page",

        "seo-review",

        "weekly-backup",

        "plugin-update",

        "security-check",

    ],

    professions: [

        "wordpress-developer",

        "content-manager",

        "seo-specialist",

        "marketing-manager",

    ],

    tools: [

        "wordpress",

        "browser",

        "filesystem",

        "terminal",

        "git",

    ],

    permissions: [

        "wordpress.read",

        "wordpress.write",

        "wordpress.publish",

        "wordpress.plugins",

        "filesystem.read",

        "filesystem.write",

    ],

}

export default WordPressPack
