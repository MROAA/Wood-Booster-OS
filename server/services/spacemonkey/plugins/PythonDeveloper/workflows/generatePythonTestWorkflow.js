/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Python Test Workflow
 *
 * Ajaa generate-python-test-skillin ehdotetulle Python-sisällölle.
 */

const generatePythonTestWorkflow = {

    id: "generate-python-test-workflow",

    name: "Generate Python Test Workflow",

    description:
        "Runs the single generate-python-test skill against a " +
        "proposed Python change.",

    skills: [
        "generate-python-test",
    ],

}

export default generatePythonTestWorkflow
