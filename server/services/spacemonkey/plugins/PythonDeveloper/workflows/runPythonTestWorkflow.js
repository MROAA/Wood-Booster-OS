/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run Python Test Workflow
 *
 * Ajaa run-python-test-skillin jo generoidulle testille.
 */

const runPythonTestWorkflow = {

    id: "run-python-test-workflow",

    name: "Run Python Test Workflow",

    description:
        "Runs the single run-python-test skill against an already " +
        "generated Python test file.",

    skills: [
        "run-python-test",
    ],

}

export default runPythonTestWorkflow
