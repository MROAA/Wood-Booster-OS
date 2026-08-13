/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * WordPress Publisher Permissions
 *
 * "wordpress.publish" on merkitty ihmisen hyväksyntää vaativaksi
 * BOOSTERVERSE_SPEC.md:n Security Rulen mukaisesti - toteutuu
 * käytännössä siten, että PUT /api/blog-drafts/:id/publish
 * suorittaa pluginin vain jo status:"approved"-tilaisille
 * luonnoksille (ks. server/routes/wordpressStudio.js).
 */

const wordpressPublisherPermissions = [

    {
        id: "wordpress.publish",
        description:
            "Allows publishing content to the connected " +
            "WordPress site.",
        destructive: true,
        requiresHumanApproval: true,
    },

    {
        id: "network.http",
        description:
            "Allows outbound HTTPS requests to the configured " +
            "WordPress base URL.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default wordpressPublisherPermissions
