/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Browser Policy
 *
 * Mihin Spacemonkeyn selain saa mennä ja mitä se saa tehdä:
 *
 * - vain HQ:n omat paikalliset kehitysosoitteet: käyttöliittymä
 *   (Vite :5173) ja sen käyttämä API (:3001). Muut portit (esim.
 *   Ollama, Portainer, muut palvelut), muut koneet, sisäverkon ja
 *   metadatarajapintojen osoitteet sekä ulkoiset sivut estetään.
 * - vain lukevat pyynnöt (GET, HEAD, OPTIONS). Selaintesti ei voi
 *   muuttaa HQ:n tietoja, vaikka se klikkaisi painiketta joka yrittää
 *   tallentaa jotain - pyyntö estetään ja kirjataan.
 *
 * Osoitteita ei koskaan oteta keskustelun tekstistä: testit kulkevat
 * ennalta määriteltyinä skenaarioina (scenarios.js).
 */

export const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

export const READ_ONLY_METHODS = ["GET", "HEAD", "OPTIONS"]

// Selain avaa sivut tästä osoitteesta.
export const DEFAULT_APP_ORIGIN = "http://localhost:5173"

function originOf(url) {

    try {
        const parsed = new URL(url)

        if (parsed.username || parsed.password) {
            return null
        }

        return parsed.origin

    } catch {
        return null
    }

}

export function isAllowedUrl(url) {

    const origin = originOf(url)

    return origin !== null && ALLOWED_ORIGINS.includes(origin)

}

export function isAllowedRequest({ url, method }) {

    return isAllowedUrl(url) && READ_ONLY_METHODS.includes(String(method).toUpperCase())

}

/**
 * Sovelluksen sisäinen polku -> täysi osoite. Vain "/"-alkuinen polku
 * kelpaa, ja tuloksen on pysyttävä samassa originissa (esim. "//toinen"
 * hylätään originin vertailussa).
 */
export function appUrl(pathname, origin = DEFAULT_APP_ORIGIN) {

    if (typeof pathname !== "string" || !pathname.startsWith("/")) {
        return null
    }

    const url = new URL(pathname, origin)

    return url.origin === origin ? url.href : null

}
