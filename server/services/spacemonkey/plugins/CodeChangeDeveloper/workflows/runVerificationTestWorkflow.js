/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Verification Test Workflow
 *
 * Yhden skillin workflow. Ks. generateVerificationTestWorkflow.js:n
 * kommentti siitä miksi tätä ei ketjuteta muihin skilleihin
 * workflow-tasolla.
 */

const runVerificationTestWorkflow = {

    id: "run-verification-test-workflow",

    name: "Run Verification Test Workflow",

    description:
        "Runs the single run-verification-test skill against an " +
        "already-generated, sandboxed test file.",

    skills: [
        "run-verification-test",
    ],

}

export default runVerificationTestWorkflow
