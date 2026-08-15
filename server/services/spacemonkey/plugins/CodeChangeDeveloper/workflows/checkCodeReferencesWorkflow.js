/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check Code References Workflow
 *
 * Ajaa check-code-references-skillin ehdotetulle sisällölle.
 */

const checkCodeReferencesWorkflow = {

    id: "check-code-references-workflow",

    name: "Check Code References Workflow",

    description:
        "Runs the single check-code-references skill against " +
        "proposed code, looking for hallucinated local imports.",

    skills: [
        "check-code-references",
    ],

}

export default checkCodeReferencesWorkflow
