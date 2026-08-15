/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Revert Code Change Workflow
 *
 * Ajaa revert-code-change-skillin annetulle kirjoitetulle
 * CodeChangeDraftille (tai CodeChangeFileDraftille).
 */

const revertCodeChangeWorkflow = {

    id: "revert-code-change-workflow",

    name: "Revert Code Change Workflow",

    description:
        "Runs the single revert-code-change skill for a written " +
        "CodeChangeDraft.",

    skills: [
        "revert-code-change",
    ],

}

export default revertCodeChangeWorkflow
