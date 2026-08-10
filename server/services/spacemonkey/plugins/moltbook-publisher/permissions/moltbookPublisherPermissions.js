/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Moltbook Publisher Permissions
 *
 * BOOSTERVERSE_SPEC.md:n Security Rule sanoo "Kaikki vaaralliset
 * toiminnot vaativat käyttäjän hyväksynnän" - WordPress- ja Instagram-
 * pluginit noudattavat tätä (requiresHumanApproval: true).
 *
 * "moltbook.publish" on TARKOITUKSELLA poikkeus: Marc pyysi eksplisiittisesti
 * täyttä autonomiaa Moltbookiin (luku+luonti+julkaisu ilman erillistä
 * hyväksyntää joka kerta), tietoisena vaihtoehdoista. Turvaverkkona
 * Moltbookin oma rate limit (1 postaus / 30 min, ks.
 * tools/moltbookAPITool.js) rajoittaa yhden virheellisen postauksen
 * vaikutuksen yhteen postaukseen puolen tunnin aikaikkunassa, ja
 * postaukset ovat poistettavissa (DELETE /posts/POST_ID).
 */

const moltbookPublisherPermissions = [

    {
        id: "moltbook.read",
        description:
            "Allows reading the Moltbook feed and agent profile.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "moltbook.publish",
        description:
            "Allows creating and publishing posts to Moltbook " +
            "autonomously, without a per-post human approval step.",
        destructive: true,
        requiresHumanApproval: false,
    },

    {
        id: "network.http",
        description:
            "Allows outbound HTTPS requests to www.moltbook.com.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default moltbookPublisherPermissions
