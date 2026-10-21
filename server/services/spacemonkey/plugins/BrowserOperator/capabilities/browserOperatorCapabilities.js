/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Browser Operator Capabilities
 *
 * Käyttöliittymätesti on tasoa "workspace": se tallentaa raportin ja
 * kuvakaappaukset Spacemonkeyn omaan työtilaan. Selain itse saa tehdä
 * vain lukevia pyyntöjä HQ:n paikallisiin osoitteisiin, joten HQ:n
 * tietoja se ei voi muuttaa.
 */

const browserOperatorCapabilities = [

    {
        id: "browser.ui.check",
        name: "Käyttöliittymätesti selaimessa",
        description:
            "Tarkistaa että HQ:n käyttöliittymä ja backend vastaavat, ajaa " +
            "ennalta määritellyn testin eristetyssä selaimessa ja tallentaa " +
            "raportin ja kuvakaappaukset Spacemonkeyn työtilaan.",
        workspace: "hq",
        category: "browser",
        access: "workspace",
        mutates: true,
        requiresApproval: false,
        workflows: ["run-ui-check-workflow"],
        requires: ["workspace"],
        permissions: ["browser.local.read", "workspace.write"],
        sources: ["HQ:n kehityskäyttöliittymä (localhost:5173)", "Playwright"],
        maturity: { level: 1, maxLevel: 4 },
    },

]

export default browserOperatorCapabilities
