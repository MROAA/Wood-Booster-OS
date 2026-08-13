/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Instagram Publisher Permissions
 *
 * "instagram.publish" on merkitty ihmisen hyväksyntää vaativaksi
 * BOOSTERVERSE_SPEC.md:n Security Rulen mukaisesti - toteutuu
 * käytännössä siten, että PUT /api/social-drafts/:id/publish
 * suorittaa pluginin vain jo status:"approved"-tilaisille
 * luonnoksille (ks. server/routes/socialStudio.js).
 */

const instagramPublisherPermissions = [

    {
        id: "instagram.publish",
        description:
            "Allows publishing content to the connected " +
            "Instagram Business account.",
        destructive: true,
        requiresHumanApproval: true,
    },

    {
        id: "network.http",
        description:
            "Allows outbound HTTPS requests to graph.facebook.com.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default instagramPublisherPermissions
