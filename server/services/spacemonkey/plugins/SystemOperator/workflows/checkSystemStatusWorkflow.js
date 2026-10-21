/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check System Status Workflow
 *
 * Yhden skillin workflow, samasta syystä kuin muiden pluginien
 * vastaavat.
 */

const checkSystemStatusWorkflow = {

    id: "check-system-status-workflow",

    name: "Check System Status Workflow",

    description:
        "Runs the single check-system-status skill.",

    skills: [
        "check-system-status",
    ],

}

export default checkSystemStatusWorkflow
