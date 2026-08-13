/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Python Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const writePythonCapability = {

    name: "Python Writing",

    description:
        "Generate a Python file from a plain-language request and " +
        "write an approved draft to disk.",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "developer",
    ],

    skills: [
        "write-python",
    ],

    workflows: [
        "write-python-workflow",
    ],

    permissions: [
        "python.write",
        "filesystem.write",
    ],

}

export default writePythonCapability
