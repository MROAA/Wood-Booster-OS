/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Code Change Verification Capability
 *
 * Kuvaa osaamisen - ei suorita mitään itse
 * (BOOSTERVERSE_SPEC.md: "Capability EI suorita mitään").
 */

const codeChangeVerificationCapability = {

    name: "Code Change Verification",

    description:
        "Write and safely run one small, targeted node:test test for " +
        "a proposed code change, in a sandboxed scratch directory, " +
        "before the change is approved. Honestly skips file types it " +
        "cannot functionally verify yet (.jsx/.tsx UI components, " +
        ".py, and non-code files).",

    maturity: {
        level: 1,
        maxLevel: 4,
    },

    professions: [
        "developer",
    ],

    skills: [
        "generate-verification-test",
        "run-verification-test",
    ],

    workflows: [
        "generate-verification-test-workflow",
        "run-verification-test-workflow",
    ],

    permissions: [
        "codechange.verify",
    ],

}

export default codeChangeVerificationCapability
