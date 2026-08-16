import path from "node:path"

/*
 * Dev Studion live-esikatselun (Phase 7, osa C) ylikirjoitusvarasto.
 * Pitää muistissa {absoluuttinen polku -> ehdotettu sisältö}
 * -kartan, jota esikatselu-Viten oma plugin (ks.
 * scripts/devstudio-preview-server.mjs) käyttää resolveId/load
 * -koukuissaan. Tämä tiedosto on tarkoituksella täysin riippumaton
 * Vitestä itsestään, jotta sen logiikka voidaan testata suoraan
 * node:testillä ilman oikeaa dev-palvelinta.
 *
 * Ei yritä toistaa Viten koko moduuliresoluutiota - vain sen verran
 * mitä Dev Studion itse generoima koodi (suhteelliset "./Foo"-tyyliset
 * importit) ja esikatselukuori itse (juuresta alkava "/src/..."
 * dynaaminen import) tarvitsevat.
 */

const CANDIDATE_EXTENSIONS = [".jsx", ".js", ".tsx", ".ts"]

function normalizeId(id) {

    return id.split("?")[0]

}

function createOverlayStore(projectRoot) {

    let overlay = new Map()

    function setFiles(files) {

        overlay = new Map(
            (files || []).map(
                file => [
                    path.resolve(projectRoot, file.filePath),
                    file.proposedCode ?? "",
                ],
            ),
        )

    }

    function has(id) {

        return overlay.has(normalizeId(id))

    }

    function get(id) {

        return overlay.get(normalizeId(id))

    }

    function resolveCandidate(source, importer) {

        // @vitejs/plugin-react lisää jokaiseen moduuliin Fast Refresh -
        // itseimportin, jonka source on jo VALMIIKSI täysi, ratkaistu
        // absoluuttinen polku (ei suhteellinen "./"-alkuinen eikä juuresta
        // alkava URL-tyylinen "/src/..."). Tämä on tarkistettava ENNEN
        // alla olevaa "/"-alkuisten polkujen tulkintaa "/src/..."-tyylisenä
        // juuripolkuna - muuten path.join yhdistäisi projectRootin jo
        // absoluuttisen polun eteen ja tuottaisi olemattoman kaksinkertaisen
        // polun (tämä oli oikea, tuotannossa löytynyt bugi: uuden - vielä
        // levylle kirjoittamattoman - tiedoston esikatselu kaatui 500:aan).
        if (overlay.has(source)) {

            return normalizeId(source)

        }

        let base

        if (source.startsWith("/")) {

            base = path.join(projectRoot, source)

        } else if (source.startsWith(".") && importer) {

            base = path.resolve(path.dirname(normalizeId(importer)), source)

        } else {

            return null

        }

        if (overlay.has(base)) {

            return base

        }

        const alreadyHasExtension = CANDIDATE_EXTENSIONS.some(
            extension => base.endsWith(extension),
        )

        if (alreadyHasExtension) {

            return null

        }

        for (const extension of CANDIDATE_EXTENSIONS) {

            const withExtension = base + extension

            if (overlay.has(withExtension)) {

                return withExtension

            }

        }

        return null

    }

    return {
        setFiles,
        has,
        get,
        resolveCandidate,
    }

}

export {
    CANDIDATE_EXTENSIONS,
    normalizeId,
    createOverlayStore,
}
