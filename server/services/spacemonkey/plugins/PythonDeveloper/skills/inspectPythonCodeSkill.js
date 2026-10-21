/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Inspect Python Code Skill
 *
 * Lukee olemassa olevan .py-tiedoston projektin sisältä File Toolin
 * kautta ja palauttaa sen rakenteen tosiasiat: rivimäärä, funktiot,
 * luokat, importit ja syntaksin kelpoisuus. EI kutsu kielimallia -
 * tämä on se osa koodin tarkistuksesta joka toimii aina, myös kun
 * katselmointimalli ei ole asennettu tai ei vastaa (PRD: read-only-
 * työkaluja ei estetä vain siksi että kielimalli puuttuu).
 *
 * Polkurajaus on sama kuin review-python-skillillä (vain projektin
 * sisäiset .py-tiedostot), ja lisäksi symlinkin todellisen kohteen on
 * oltava projektin sisällä, ettei projektiin sijoitettu linkki voi
 * osoittaa esim. kotihakemiston tiedostoon.
 *
 * Syntaksi tarkistetaan injektoidulla isValidPythonSyntax-funktiolla
 * (server/services/pythonSyntaxValidator.js), joka kääntää kopion
 * väliaikaishakemistossa - itse tiedostoa ei koskaan ajeta eikä sen
 * viereen kirjoiteta mitään.
 */

import fs from "node:fs/promises"

import path from "node:path"

import { PROJECT_ROOT, resolveSafeFilePath } from "./reviewPythonCodeSkill.js"

const MAX_FILE_BYTES = 500000

const MAX_LISTED_NAMES = 25

const FUNCTION_PATTERN = /^[ \t]*(?:async[ \t]+)?def[ \t]+([A-Za-z_]\w*)/gm

const CLASS_PATTERN = /^[ \t]*class[ \t]+([A-Za-z_]\w*)/gm

const IMPORT_PATTERN = /^[ \t]*(?:from[ \t]+([.\w]+)[ \t]+import|import[ \t]+([.\w]+))/gm

const TODO_PATTERN = /#.*\b(?:TODO|FIXME|XXX)\b/g

function collectNames(code, pattern) {

    const names = []

    pattern.lastIndex = 0

    let match

    while ((match = pattern.exec(code)) !== null) {
        const name = match[1] || match[2]

        if (name && !names.includes(name)) {
            names.push(name)
        }
    }

    return names

}

async function realPathInsideProject(safePath) {

    try {
        const [realFile, realRoot] = await Promise.all([
            fs.realpath(safePath),
            fs.realpath(PROJECT_ROOT),
        ])

        return realFile.startsWith(realRoot + path.sep)
    } catch {
        // Puuttuva tiedosto: annetaan File Toolin lukea ja palauttaa
        // tavallinen read_failed, ei erillistä virhettä tästä.
        return true
    }

}

function describePythonCode(code) {

    const functions = collectNames(code, FUNCTION_PATTERN)

    const classes = collectNames(code, CLASS_PATTERN)

    const imports = collectNames(code, IMPORT_PATTERN)

    return {
        lines: code.length === 0 ? 0 : code.split("\n").length,
        functions: functions.slice(0, MAX_LISTED_NAMES),
        functionCount: functions.length,
        classes: classes.slice(0, MAX_LISTED_NAMES),
        classCount: classes.length,
        imports: imports.slice(0, MAX_LISTED_NAMES),
        importCount: imports.length,
        todoCount: (code.match(TODO_PATTERN) || []).length,
    }

}

const inspectPythonCodeSkill = {

    id: "inspect-python",

    name: "Inspect Python",

    description:
        "Reads an existing .py file from within the project and " +
        "reports its structure (lines, functions, classes, imports) " +
        "and whether it compiles. No AI call, read-only.",

    async execute(context) {

        const { filePath, toolBus, isValidPythonSyntax } = context || {}

        const safePath = resolveSafeFilePath(filePath)

        if (!safePath || !(await realPathInsideProject(safePath))) {
            return {
                success: false,
                code: "unsafe_file_path",
                error:
                    "Tiedostopolku ei ole sallittu - vain projektin " +
                    "sisäiset .py-tiedostot voi tarkistaa.",
            }
        }

        const readResult = await toolBus.execute("file", {
            action: "read",
            file: safePath,
        })

        if (!readResult?.success) {
            return {
                success: false,
                code: "read_failed",
                error: readResult?.error || "Tiedoston luku epäonnistui.",
            }
        }

        const code = readResult.content

        if (Buffer.byteLength(code, "utf8") > MAX_FILE_BYTES) {
            return {
                success: false,
                code: "file_too_large",
                error: "Tiedosto on liian suuri tarkistettavaksi keskustelussa.",
            }
        }

        const syntaxValid =
            typeof isValidPythonSyntax === "function" && code.trim()
                ? await isValidPythonSyntax(code)
                : null

        return {
            success: true,
            filePath: safePath,
            relativePath: path.relative(PROJECT_ROOT, safePath),
            syntaxValid,
            ...describePythonCode(code),
        }

    },

}

export default inspectPythonCodeSkill

export { describePythonCode }
