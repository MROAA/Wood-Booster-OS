/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Code Change Draft Workflow
 *
 * Ajaa run-code-change-draft-skillin paketin yhdelle tiedostolle.
 * Tarkoituksella yhden skillin workflow.
 */

const runCodeChangeDraftWorkflow = {

    id: "run-code-change-draft-workflow",

    name: "Run Code Change Draft Workflow",

    description:
        "Runs the single run-code-change-draft skill against one " +
        "file in a multi-file draft set.",

    skills: [
        "run-code-change-draft",
    ],

}

export default runCodeChangeDraftWorkflow
