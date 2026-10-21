/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Browser Scenarios
 *
 * Ennalta määritellyt käyttöliittymätestit. Keskustelu valitsee
 * skenaarion tunnisteella - sivuja, osoitteita tai askelia ei koskaan
 * muodosteta keskustelun tekstistä, eikä mikään askel suorita
 * JavaScriptiä sivun sisällä.
 *
 * Askeleet (BrowserOperator.js):
 *   open        { path }                       avaa sovelluksen polun
 *   heading     { level, name? }               otsikko näkyy (nimi valinnainen)
 *   countLinks  { hrefPrefix, min }            linkkejä vähintään min
 *   clickLink   { hrefPrefix, index }          klikkaa linkkiä (navigointi)
 *   expectPath  { pattern }                    osoitepolku vastaa mallia
 *   headingInClickedLink { level }             jokin otsikko löytyy klikatun linkin tekstistä
 *   screenshot  { name }                       kuvakaappaus työtilaan
 */

const SCENARIOS = {

    "projects-view": {
        id: "projects-view",
        name: "Projektinäkymä",
        description:
            "Avaa projektilistan, tarkistaa että projekteja näkyy, avaa " +
            "ensimmäisen projektin ja tarkistaa että sen sivu näyttää saman projektin.",
        steps: [
            { action: "open", path: "/projects" },
            { action: "heading", level: 1, name: "Projektit" },
            { action: "screenshot", name: "projects" },
            { action: "countLinks", hrefPrefix: "/projects/", min: 1 },
            { action: "clickLink", hrefPrefix: "/projects/", index: 0 },
            { action: "expectPath", pattern: "^/projects/\\d+$" },
            { action: "headingInClickedLink", level: 1 },
            { action: "screenshot", name: "project-details" },
        ],
    },

}

export function getScenario(id) {

    return Object.prototype.hasOwnProperty.call(SCENARIOS, id) ? SCENARIOS[id] : null

}

export function listScenarios() {

    return Object.values(SCENARIOS).map(({ id, name, description }) => ({ id, name, description }))

}
