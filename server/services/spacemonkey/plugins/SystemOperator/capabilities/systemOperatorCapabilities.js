/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * System Operator Capabilities
 *
 * Keskustelussa valittavat kyvykkyydet (capabilities/chatCapability.js).
 * Koneen tilan tarkistus on tasoa "workspace", koska se tallentaa
 * raporttinsa Spacemonkeyn omaan työtilaan - se ei muuta projektia,
 * palveluita eikä järjestelmää. Työtilan katselu on "observe".
 */

const systemOperatorCapabilities = [

    {
        id: "system.status.check",
        name: "Koneen ja palveluiden tila",
        description:
            "Lukee muistin, kuorman, levytilan, sallittujen palveluiden " +
            "tilan, paikalliset terveysreitit, git-tilan ja " +
            "kehitysprosessien muistinkäytön, ja tallentaa raportin " +
            "Spacemonkeyn työtilaan. Ei root-oikeuksia, ei komentoja " +
            "keskustelun tekstistä.",
        workspace: "hq",
        category: "system",
        access: "workspace",
        mutates: true,
        requiresApproval: false,
        workflows: ["check-system-status-workflow"],
        requires: ["workspace"],
        permissions: ["system.observe", "workspace.write"],
        sources: ["/proc/meminfo", "systemctl show (sallitut palvelut)", "paikalliset terveysreitit", "git"],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "spacemonkey.workspace.overview",
        name: "Spacemonkeyn työtila",
        description:
            "Kertoo mitä Spacemonkeyn omassa työtilassa on: tehtävät " +
            "tiloineen ja käytetty tila.",
        workspace: "hq",
        category: "system",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["describe-workspace-workflow"],
        requires: ["workspace"],
        permissions: ["workspace.read"],
        sources: ["Spacemonkeyn työtila"],
        maturity: { level: 1, maxLevel: 4 },
    },

]

export default systemOperatorCapabilities
