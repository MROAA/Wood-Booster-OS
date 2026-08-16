/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check Python References Workflow
 *
 * Ajaa check-python-references-skillin ehdotetulle Python-sisällölle.
 */

const checkPythonReferencesWorkflow = {

    id: "check-python-references-workflow",

    name: "Check Python References Workflow",

    description:
        "Runs the single check-python-references skill against " +
        "proposed Python code, looking for hallucinated imports.",

    skills: [
        "check-python-references",
    ],

}

export default checkPythonReferencesWorkflow
