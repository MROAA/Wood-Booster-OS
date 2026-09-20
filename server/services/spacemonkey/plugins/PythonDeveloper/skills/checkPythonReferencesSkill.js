/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check Python References Skill
 *
 * Puhtaasti tiedottava turvaverkko, ei koskaan estä mitään - Python-
 * puolen vastine JS-puolen checkCodeReferencesSkill.js:lle. Poimii
 * ehdotetun Python-koodin importit ja tarkistaa osoittavatko ne
 * johonkin oikeasti olemassa olevaan tiedostoon.
 *
 * Kolme tapausta:
 *
 *  - "from . import x" / "from .pkg import y" (piste-suhteellinen
 *    import) - Python Developer -pluginin generated-python-hakemisto
 *    on litteä pudotuspaikka ilman __init__.py-pakettirakennetta,
 *    joten tällainen ei voi KOSKAAN osoittaa mihinkään oikeaan -
 *    merkitään aina, ei yritetä edes ratkaista.
 *  - paljas "import x" / "from x import y" jossa x on Python-
 *    standardikirjaston moduuli tai pieni tunnettu kolmannen
 *    osapuolen paketti - ohitetaan, näiden olemassaolo ei riipu
 *    generated-python-hakemistosta.
 *  - muu paljas import - tarkistetaan löytyykö generated-python-
 *    hakemistosta samanniminen "<x>.py" (ainoa realistinen
 *    "paikallinen" haku tälle kertakäyttöiselle, ei-pakettimuotoiselle
 *    hakemistolle - ei sisarustiedostokonseptia kuten JS-puolen
 *    monitiedostosuunnitelmilla, koska Python-puolella ei ole
 *    monitiedostosuunnitelmia).
 *
 * Tunnettu, tarkoituksellinen yksinkertaistus: rivi jossa on useampi
 * nimi pilkulla eroteltuna (esim. "import os, requests") poimii vain
 * ensimmäisen nimen per regex-läpikäynti - hyväksyttävää koska tämä
 * tarkistus on puhtaasti tiedottava eikä koskaan estä mitään, samaa
 * riskitasoa kuin JS-puolen omat yksinkertaistukset.
 */

import path from "node:path"

import { execFile } from "node:child_process"

import { promisify } from "node:util"

import { GENERATED_PYTHON_DIR } from "./writePythonCodeSkill.js"

const execFileAsync = promisify(execFile)

const DOT_RELATIVE_PATTERN = /^\s*from\s+\.+\S*\s+import\s+.+$/gm

const BARE_FROM_IMPORT_PATTERN = /^\s*from\s+([A-Za-z_]\w*)\s+import\b/gm

const BARE_IMPORT_PATTERN = /^\s*import\s+([A-Za-z_]\w*)/gm

// Pieni, käsin ylläpidetty lista yleisimmistä kolmannen osapuolen
// paketeista joita tämän ympäristön AI todennäköisesti käyttäisi.
// Standardikirjasto EI ole täällä käsin ylläpidettynä (ks. alla) -
// se olisi virhealtista (esim. zoneinfo/tomllib unohtuisi helposti).
const KNOWN_THIRD_PARTY = new Set([
    "numpy", "pandas", "requests", "flask", "django", "matplotlib",
    "scipy", "sklearn", "yaml", "dotenv", "sqlalchemy", "pydantic",
    "fastapi", "click", "boto3", "PIL", "bs4", "pytest",
])

let cachedStdlibModuleNames = null

async function getStdlibModuleNames() {

    if (cachedStdlibModuleNames) {

        return cachedStdlibModuleNames

    }

    try {

        const { stdout } = await execFileAsync(
            "python3",
            ["-c", "import sys, json; print(json.dumps(sorted(sys.stdlib_module_names)))"],
        )

        cachedStdlibModuleNames = new Set(JSON.parse(stdout))

    } catch {

        // Jos python3 ei jostain syystä ole käytettävissä, ei estetä
        // koko tarkistusta - vain kohdellaan standardikirjastoa
        // tyhjänä joukkona (jolloin tunnetut kolmannen osapuolen
        // paketit yhä ohitetaan, mutta stdlib-nimet saatetaan
        // virheellisesti merkitä - hyväksyttävää, koska tämä on
        // puhtaasti tiedottava eikä koskaan estä mitään).
        cachedStdlibModuleNames = new Set()

    }

    return cachedStdlibModuleNames

}

function extractDotRelativeImports(code) {

    const matches = new Set()

    let match

    DOT_RELATIVE_PATTERN.lastIndex = 0

    while ((match = DOT_RELATIVE_PATTERN.exec(code)) !== null) {

        matches.add(match[0].trim())

    }

    return [...matches]

}

function extractBareImportNames(code) {

    const names = new Set()

    for (const pattern of [BARE_FROM_IMPORT_PATTERN, BARE_IMPORT_PATTERN]) {

        pattern.lastIndex = 0

        let match

        while ((match = pattern.exec(code)) !== null) {

            names.add(match[1])

        }

    }

    return [...names]

}

const checkPythonReferencesSkill = {

    id: "check-python-references",

    name: "Check Python References",

    description:
        "Flags Python imports in proposed code that don't resolve to " +
        "a real file - dot-relative imports always (this lane has no " +
        "package structure), bare imports only when they're not " +
        "stdlib/a known third-party package and no matching file " +
        "exists in generated-python/. Never blocks anything.",

    async execute(context) {

        const { proposedCode, toolBus } = context || {}

        if (!proposedCode || !toolBus) {

            return {
                success: true,
                unresolvedReferences: [],
            }

        }

        try {

            const unresolved = [
                ...extractDotRelativeImports(proposedCode),
            ]

            const stdlibModuleNames = await getStdlibModuleNames()

            const bareNames = extractBareImportNames(proposedCode)

            for (const name of bareNames) {

                if (stdlibModuleNames.has(name) || KNOWN_THIRD_PARTY.has(name)) {

                    continue

                }

                const candidate = path.join(GENERATED_PYTHON_DIR, `${name}.py`)

                const existsResult = await toolBus.execute("file", {
                    action: "exists",
                    file: candidate,
                })

                if (!existsResult?.success || !existsResult.exists) {

                    unresolved.push(name)

                }

            }

            return {
                success: true,
                unresolvedReferences: unresolved,
            }

        } catch {

            return {
                success: true,
                unresolvedReferences: [],
            }

        }

    },

}

export default checkPythonReferencesSkill

export { extractDotRelativeImports, extractBareImportNames, getStdlibModuleNames }
