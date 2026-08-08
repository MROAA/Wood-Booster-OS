/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Python Developer Permissions
 *
 * "python.write" ja "filesystem.write" on merkitty ihmisen
 * hyväksyntää vaativiksi BOOSTERVERSE_SPEC.md:n Security Rulen
 * mukaisesti - toteutuu käytännössä siten, että
 * PUT /api/python-drafts/:id/write suorittaa pluginin vain jo
 * status:"approved"-tilaisille luonnoksille (ks.
 * server/routes/devStudio.js), ja skilli itse tarkistaa saman
 * lisäksi kirjoituspolun turvallisuuden.
 */

const pythonDeveloperPermissions = [

    {
        id: "python.write",
        description:
            "Allows generating Python code drafts for review.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "filesystem.write",
        description:
            "Allows writing an approved Python code draft to disk, " +
            "restricted to the plugin's generated-python directory.",
        destructive: true,
        requiresHumanApproval: true,
    },

]

export default pythonDeveloperPermissions
