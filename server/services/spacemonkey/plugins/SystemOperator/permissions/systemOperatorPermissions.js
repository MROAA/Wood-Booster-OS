/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * System Operator Permissions
 *
 * Vain luku -tasoinen järjestelmän tarkkailu ja kirjoitus Spacemonkeyn
 * omaan työtilaan. Palveluiden käynnistys, pysäytys ja muut
 * ylläpitotoimet (taso privileged-os) eivät kuulu tähän - ne tehdään
 * myöhemmin erillisellä rajatulla apupalvelulla ja hyväksynnällä.
 */

const systemOperatorPermissions = [

    {
        id: "system.observe",
        description:
            "Allows reading memory, load, disk, the status of allowed " +
            "services, allowed local health endpoints, git state and the " +
            "memory use of watched processes (name and size only).",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "workspace.read",
        description: "Allows reading Spacemonkey's own workspace.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "workspace.write",
        description:
            "Allows writing task files inside Spacemonkey's own workspace " +
            "only, within size and quota limits.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default systemOperatorPermissions
