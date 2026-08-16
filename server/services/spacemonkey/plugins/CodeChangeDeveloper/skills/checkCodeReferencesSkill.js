/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check Code References Skill
 *
 * Puhtaasti tiedottava turvaverkko, ei koskaan estä mitään: pieni
 * paikallinen malli keksii toisinaan uskottavan näköisiä
 * import-polkuja tiedostoihin joita ei koskaan luotu
 * ("hallusinoitu viittaus") - tämä poimii ehdotetun sisällön
 * paikalliset (suhteelliset) import/require-polut ja tarkistaa
 * osoittavatko ne oikeasti johonkin olemassa olevaan tiedostoon,
 * jotta ongelma näkyy selvästi diffin vieressä sen sijaan että se
 * huomataan vasta kun kirjoitettu koodi rikkoutuu.
 *
 * npm-paketit (ei-suhteelliset polut, esim. "react") jätetään
 * tarkoituksella tarkistamatta - niiden olemassaolo riippuu
 * node_modulesista, ei projektin lähdekoodista.
 *
 * Useamman tiedoston suunnitelmassa kaksi UUTTA tiedostoa voivat
 * aivan pätevästi viitata toisiinsa (esim. sivu tuo saman
 * suunnitelman komponentin) ennen kuin kumpaakaan on vielä
 * kirjoitettu levylle - context.siblingFilePaths kertoo mitkä muut
 * polut kuuluvat samaan suunnitelmaan, jotta näitä ei virheellisesti
 * merkitä hallusinaatioksi.
 */

import path from "node:path"

import { resolveSafeProjectFilePath } from "./projectSandbox.js"

const IMPORT_PATTERN =
    /(?:\bimport\s+(?:[\s\S]*?\bfrom\s+)?|\brequire\(\s*)["']([^"']+)["']/g

const RESOLVABLE_SUFFIXES = [
    "",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    "/index.js",
    "/index.jsx",
]

function extractRelativeImports(code) {

    const specifiers = new Set()

    let match

    IMPORT_PATTERN.lastIndex = 0

    while ((match = IMPORT_PATTERN.exec(code)) !== null) {

        const specifier = match[1]

        if (specifier.startsWith("./") || specifier.startsWith("../")) {

            specifiers.add(specifier)

        }

    }

    return [...specifiers]

}

const checkCodeReferencesSkill = {

    id: "check-code-references",

    name: "Check Code References",

    description:
        "Flags local (relative) imports in proposed code that don't " +
        "resolve to a real file anywhere in the project or the same " +
        "plan - never blocks anything, purely informational.",

    async execute(context) {

        const {
            proposedCode,
            filePath,
            toolBus,
            siblingFilePaths = [],
        } = context || {}

        if (!proposedCode || !filePath || !toolBus) {

            return {
                success: true,
                unresolvedReferences: [],
            }

        }

        const check = resolveSafeProjectFilePath(filePath)

        if (!check.ok) {

            return {
                success: true,
                unresolvedReferences: [],
            }

        }

        const targetDirectory = path.dirname(check.absolutePath)

        const siblingAbsolutePaths = new Set(

            siblingFilePaths
                .map(siblingPath => resolveSafeProjectFilePath(siblingPath))
                .filter(result => result.ok)
                .map(result => result.absolutePath)

        )

        const specifiers = extractRelativeImports(proposedCode)

        const unresolved = []

        // Puhtaasti tiedottava tarkistus - jos toolBus itse
        // epäonnistuu (esim. odottamaton virhe tiedostojärjestelmässä),
        // tämä ei koskaan saa estää itse ehdotuksen näyttämistä.
        // Palautetaan silloin mieluummin "ei huomautettavaa" kuin
        // heitetään poikkeus kutsujalle asti.
        try {

        for (const specifier of specifiers) {

            const base = path.resolve(targetDirectory, specifier)

            let found = false

            for (const suffix of RESOLVABLE_SUFFIXES) {

                const candidate = base + suffix

                if (siblingAbsolutePaths.has(candidate)) {

                    found = true

                    break

                }

                const existsResult = await toolBus.execute("file", {
                    action: "exists",
                    file: candidate,
                })

                if (existsResult?.success && existsResult.exists) {

                    found = true

                    break

                }

            }

            if (!found) {

                unresolved.push(specifier)

            }

        }

        } catch {

            return {
                success: true,
                unresolvedReferences: [],
            }

        }

        return {
            success: true,
            unresolvedReferences: unresolved,
        }

    },

}

export default checkCodeReferencesSkill

export { extractRelativeImports }
