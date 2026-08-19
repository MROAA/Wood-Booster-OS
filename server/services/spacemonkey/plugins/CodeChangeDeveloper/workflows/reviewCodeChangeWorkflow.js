/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Review Code Change Workflow
 *
 * Ajaa review-code-change-skillin annetulle tiedostopolulle.
 * Tarkoituksella yhden skillin workflow.
 */

const reviewCodeChangeWorkflow = {

    id: "review-code-change-workflow",

    name: "Review Code Change Workflow",

    description:
        "Runs the single review-code-change skill for a given " +
        "project file path.",

    skills: [
        "review-code-change",
    ],

}

export default reviewCodeChangeWorkflow
