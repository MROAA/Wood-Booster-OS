/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Access Levels
 *
 * Spacemonkeyn oikeustasot (Root Operator PRD V6, luku 8). Tasot EIVÄT
 * ole portaikko: korkeampi taso ei sisällä alempia, eikä esim. tason 4
 * valtuutus anna tason 5 oikeuksia. Jokainen kyvykkyys kertoo oman
 * tasonsa, ja kutsuja sallii joukon tasoja erikseen.
 */

const ACCESS_LEVELS = Object.freeze({
    observe: {
        level: 0,
        label: "vain luku",
        mutates: false,
    },
    workspace: {
        level: 1,
        label: "oma työtila",
        mutates: true,
    },
    "project-draft": {
        level: 2,
        label: "muutosluonnos",
        mutates: true,
    },
    "approved-execution": {
        level: 3,
        label: "hyväksytty suoritus",
        mutates: true,
    },
    "privileged-os": {
        level: 4,
        label: "järjestelmän ylläpito",
        mutates: true,
    },
    "external-publishing": {
        level: 5,
        label: "ulkoinen julkaisu",
        mutates: true,
    },
})

function isAccessLevel(value) {

    return typeof value === "string" &&
        Object.prototype.hasOwnProperty.call(ACCESS_LEVELS, value)

}

/**
 * Sallitaanko taso, kun kutsuja on sallinut nämä tasot. Ei portaikkoa:
 * taso sallitaan vain jos se on itse listalla.
 */
function isAccessAllowed(access, allowedLevels = []) {

    return isAccessLevel(access) && allowedLevels.includes(access)

}

export { ACCESS_LEVELS, isAccessAllowed, isAccessLevel }
