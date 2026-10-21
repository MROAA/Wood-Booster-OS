/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Browser Operator Permissions
 *
 * Selain saa vain lukea HQ:n paikallista käyttöliittymää. Lomakkeiden
 * lähettäminen, julkaisut ja muut kirjoittavat pyynnöt estetään
 * selaintasolla (browser/browserPolicy.js).
 */

const browserOperatorPermissions = [

    {
        id: "browser.local.read",
        description:
            "Allows an isolated browser to open HQ's local development UI " +
            "and its API with read-only requests (GET, HEAD, OPTIONS).",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default browserOperatorPermissions
