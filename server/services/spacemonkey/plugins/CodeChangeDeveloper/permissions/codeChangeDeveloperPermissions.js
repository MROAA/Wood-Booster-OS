/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Code Change Developer Permissions
 *
 * "filesystem.write" on merkitty ihmisen hyväksyntää vaativaksi
 * BOOSTERVERSE_SPEC.md:n Security Rulen mukaisesti - toteutuu
 * käytännössä siten, että PUT /api/dev-drafts/:id/write suorittaa
 * pluginin vain jo status:"approved"-tilaisille luonnoksille (ks.
 * server/routes/devCodeChangeStudio.js), ja skilli itse tarkistaa
 * saman lisäksi kirjoituspolun turvallisuuden ja sen, ettei
 * kohdetiedosto ole muuttunut luonnoksen luonnin jälkeen.
 */

const codeChangeDeveloperPermissions = [

    {
        id: "codechange.write",
        description:
            "Allows generating code change drafts for review.",
        destructive: false,
        requiresHumanApproval: false,
    },

    {
        id: "filesystem.write",
        description:
            "Allows writing an approved code change draft to disk, " +
            "restricted to the project root (excluding " +
            "node_modules, .git, backups, and sensitive files).",
        destructive: true,
        requiresHumanApproval: true,
    },

    {
        id: "codechange.verify",
        description:
            "Allows generating and running a small test for a " +
            "proposed change, strictly inside its own sandboxed " +
            "scratch directory (.dev-studio-verification/, always " +
            "cleaned up afterward) - never touches the real project " +
            "tree, so this runs automatically alongside draft " +
            "generation without a separate approval step.",
        destructive: false,
        requiresHumanApproval: false,
    },

]

export default codeChangeDeveloperPermissions
