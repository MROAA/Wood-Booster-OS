/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Change Plan Workflow
 *
 * Yhden skillin workflow, sama malli kuin tämän pluginin muut
 * workflow't.
 */

const generateChangePlanWorkflow = {

    id: "generate-change-plan-workflow",

    name: "Generate Change Plan Workflow",

    description:
        "Runs the single generate-change-plan skill for a multi-file " +
        "request.",

    skills: [
        "generate-change-plan",
    ],

}

export default generateChangePlanWorkflow
