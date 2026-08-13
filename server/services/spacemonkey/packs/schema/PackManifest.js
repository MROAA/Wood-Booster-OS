/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Pack Manifest
 *
 * Yhtenäinen rakenne kaikille Capability Packeille.
 */

export const PACK_SCHEMA_VERSION = "1.0.0"

export function createPackManifest({

    id,

    name,

    version = "1.0.0",

    description = "",

    author = "Wood-Booster",

    category = "general",

    maturity = 1,

    dependencies = [],

    capabilities = [],

    skills = [],

    workflows = [],

    professions = [],

    tools = [],

    permissions = [],

    prompts = [],

    tests = [],

    documentation = [],

}) {

    return {

        schema:
            PACK_SCHEMA_VERSION,

        id,

        name,

        version,

        description,

        author,

        category,

        maturity,

        dependencies,

        capabilities,

        skills,

        workflows,

        professions,

        tools,

        permissions,

        prompts,

        tests,

        documentation,

        enabled: true,

    }

}

export function validateManifest(
    manifest
) {

    if (!manifest)
        throw new Error(
            "Manifest missing"
        )

    if (!manifest.id)
        throw new Error(
            "Manifest id missing"
        )

    if (!manifest.name)
        throw new Error(
            "Manifest name missing"
        )

    if (!manifest.version)
        throw new Error(
            "Manifest version missing"
        )

    if (
        !Array.isArray(
            manifest.capabilities
        )
    ) {
        throw new Error(
            "Capabilities missing"
        )
    }

    if (
        !Array.isArray(
            manifest.skills
        )
    ) {
        throw new Error(
            "Skills missing"
        )
    }

    if (
        !Array.isArray(
            manifest.tools
        )
    ) {
        throw new Error(
            "Tools missing"
        )
    }

    return true

}
