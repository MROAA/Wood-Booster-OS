/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Python Draft Workflow
 *
 * Ajaa run-python-draft-skillin luonnoksen omalle koodille.
 * Tarkoituksella yhden skillin workflow.
 */

const runPythonDraftWorkflow = {

    id: "run-python-draft-workflow",

    name: "Run Python Draft Workflow",

    description:
        "Runs the single run-python-draft skill against a draft's " +
        "own code.",

    skills: [
        "run-python-draft",
    ],

}

export default runPythonDraftWorkflow
