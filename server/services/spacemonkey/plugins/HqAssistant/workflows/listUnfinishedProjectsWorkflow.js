/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * List Unfinished Projects Workflow
 *
 * Yhden skillin workflow, samasta syystä kuin PythonDeveloperin
 * explainPythonCodeWorkflow.js: WorkflowEngine ajaa kaikki skillit
 * samalla context-oliolla.
 */

const listUnfinishedProjectsWorkflow = {

    id: "hq-list-unfinished-projects-workflow",

    name: "List Unfinished Projects Workflow",

    description:
        "Runs the single hq-list-unfinished-projects skill.",

    skills: [
        "hq-list-unfinished-projects",
    ],

}

export default listUnfinishedProjectsWorkflow
