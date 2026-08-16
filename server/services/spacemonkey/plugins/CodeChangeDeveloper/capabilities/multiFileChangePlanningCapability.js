/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Multi-File Change Planning Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const multiFileChangePlanningCapability = {

    name: "Multi-File Change Planning",

    description:
        "Propose which files a request needs (and why) before " +
        "generating any content, so the human can review and approve " +
        "the plan itself before Spacemonkey writes a single line of " +
        "code. Reuses the single-file generate/verify/write skills " +
        "per planned file rather than duplicating them.",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "developer",
    ],

    skills: [
        "generate-change-plan",
    ],

    workflows: [
        "generate-change-plan-workflow",
    ],

    permissions: [
        "codechange.plan",
    ],

}

export default multiFileChangePlanningCapability
