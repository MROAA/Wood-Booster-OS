/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Verification Sandbox
 *
 * Erillinen hiekkalaatikko generoidulle testikoodille ja sen
 * ajamiselle. Ehdotettu tiedostosisältö ei ole vielä hyväksytty
 * (eikä ehkä koskaan tule olemaan), joten sitä EI KOSKAAN kirjoiteta
 * oikeaan kohdetiedostoon ennen hyväksyntää - sen sijaan se
 * kirjoitetaan tähän täysin erilliseen, kertakäyttöiseen hakemistoon,
 * jonka projectSandbox.js estää myös aina mahdollisena TODELLISEN
 * muutoksen kirjoituskohteena (VERIFICATION_DIR_NAME on siellä
 * BLOCKED_DIR_SEGMENTS-listalla).
 *
 * Jokainen ajo saa oman satunnaisen alihakemiston
 * (crypto.randomUUID()), jotta rinnakkaiset pyynnöt eivät voi
 * törmätä keskenään, ja se siivotaan pois heti ajon jälkeen
 * (ks. runVerificationTestSkill.js).
 */

import path from "node:path"

import { PROJECT_ROOT, VERIFICATION_DIR_NAME } from "./projectSandbox.js"

const VERIFICATION_ROOT = path.join(PROJECT_ROOT, VERIFICATION_DIR_NAME)

function resolveVerificationRunDir(runId) {

    return path.join(VERIFICATION_ROOT, runId)

}

function resolveSafeVerificationPath(runId, fileName) {

    const runDir = resolveVerificationRunDir(runId)

    const resolved = path.join(runDir, fileName)

    const withinRunDir =
        resolved === runDir ||
        resolved.startsWith(runDir + path.sep)

    if (!withinRunDir) {

        return {
            ok: false,
            code: "verification_path_traversal_blocked",
        }

    }

    return {
        ok: true,
        absolutePath: resolved,
    }

}

export {
    VERIFICATION_ROOT,
    resolveVerificationRunDir,
    resolveSafeVerificationPath,
}
