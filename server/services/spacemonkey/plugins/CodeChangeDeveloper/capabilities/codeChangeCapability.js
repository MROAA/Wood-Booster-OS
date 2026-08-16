/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Code Change Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const codeChangeCapability = {

    name: "Code Change Writing",

    description:
        "Propose a change to a real project file from a " +
        "plain-language request, and write an approved draft to " +
        "disk inside the project sandbox.",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "developer",
    ],

    skills: [
        "generate-code-change",
        "write-code-change",
    ],

    workflows: [
        "generate-code-change-workflow",
        "write-code-change-workflow",
    ],

    permissions: [
        "codechange.write",
        "filesystem.write",
    ],

}

export default codeChangeCapability
