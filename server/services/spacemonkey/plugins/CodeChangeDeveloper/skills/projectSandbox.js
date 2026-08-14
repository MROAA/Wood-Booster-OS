/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Project Sandbox
 *
 * Yksi ainoa turvatarkistus, jota sekä generate-code-change- että
 * write-code-change-skilli kutsuvat samalla tavalla. Näin se mitä
 * Spacemonkey saa LUKEA ehdotusta varten ja se mitä se saa KIRJOITTAA
 * hyväksynnän jälkeen eivät voi koskaan erkaantua toisistaan.
 *
 * Toisin kuin PythonDeveloper-pluginin write-python-skill (joka
 * kirjoittaa vain pluginin omaan kertakäyttöiseen
 * generated-python-hakemistoon), tämä plugin koskee projektin oikeaa,
 * elävää lähdekoodia. Siksi rajaus on tiukempi kuin pelkkä
 * projektijuuren sisäpuoli:
 *
 *  - node_modules/, .git/, tämän pluginin omat varmuuskopiot ja oma
 *    testien hiekkalaatikko (.dev-studio-verification/, ks.
 *    verificationSandbox.js) on aina estetty todellisena
 *    kirjoituskohteena - ehdotettu muutos ei koskaan saa osua sinne
 *    "vahingossa"
 *  - tunnetut arkaluontoiset tiedostonimet (.env, avaimet,
 *    kredentiaalit) on aina estetty
 *  - vain lähdekoodin kaltaiset tiedostopäätteet ovat sallittuja
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

// skills/ -> CodeChangeDeveloper -> plugins -> spacemonkey -> services
// -> server -> repo root (sama syvyys kuin PythonDeveloper-pluginin
// skills-hakemistolla, ks. refactorPythonCodeSkill.js:n PROJECT_ROOT).
const PROJECT_ROOT = path.resolve(
    currentDirectory,
    "../../../../../..",
)

const BACKUP_DIR_NAME = ".dev-studio-backups"

const VERIFICATION_DIR_NAME = ".dev-studio-verification"

const BLOCKED_DIR_SEGMENTS = new Set([
    "node_modules",
    ".git",
    BACKUP_DIR_NAME,
    VERIFICATION_DIR_NAME,
])

const BLOCKED_FILENAME_PATTERNS = [
    /^\.env(\..+)?$/i,
    /\.pem$/i,
    /\.key$/i,
    /^credentials/i,
    /^secrets/i,
    /^id_rsa/i,
]

const ALLOWED_EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".css",
    ".html",
    ".py",
    ".prisma",
])

function resolveSafeProjectFilePath(filePath) {

    if (!filePath) {

        return {
            ok: false,
            code: "missing_file_path",
        }

    }

    // Hylätään alusta asti yritykset antaa absoluuttinen polku -
    // path.resolve tulkitsisi sen sellaisenaan eikä suhteessa
    // PROJECT_ROOTiin.
    const relative = filePath.replace(/^[/\\]+/, "")

    const resolved = path.resolve(PROJECT_ROOT, relative)

    const withinBase =
        resolved === PROJECT_ROOT ||
        resolved.startsWith(PROJECT_ROOT + path.sep)

    if (!withinBase) {

        return {
            ok: false,
            code: "path_traversal_blocked",
        }

    }

    const relativeFromRoot = path.relative(PROJECT_ROOT, resolved)

    const segments = relativeFromRoot.split(path.sep)

    if (segments.some(segment => BLOCKED_DIR_SEGMENTS.has(segment))) {

        return {
            ok: false,
            code: "blocked_directory",
        }

    }

    const baseName = path.basename(resolved)

    if (BLOCKED_FILENAME_PATTERNS.some(pattern => pattern.test(baseName))) {

        return {
            ok: false,
            code: "sensitive_file_blocked",
        }

    }

    const extension = path.extname(baseName).toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(extension)) {

        return {
            ok: false,
            code: "extension_not_allowed",
        }

    }

    return {
        ok: true,
        absolutePath: resolved,
        relativePath: relativeFromRoot,
    }

}

export {
    PROJECT_ROOT,
    BACKUP_DIR_NAME,
    VERIFICATION_DIR_NAME,
    resolveSafeProjectFilePath,
}
