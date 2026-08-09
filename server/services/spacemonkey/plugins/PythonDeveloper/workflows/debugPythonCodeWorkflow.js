/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Debug Python Code Workflow
 *
 * Ajaa debug-python-skillin annetulle tiedostopolulle ja
 * valinnaiselle virheilmoitukselle.
 *
 * Tarkoituksella yhden skillin workflow, samasta syystä kuin
 * refactorPythonCodeWorkflow.js.
 */

const debugPythonCodeWorkflow = {

    id: "debug-python-workflow",

    name: "Debug Python Code Workflow",

    description:
        "Runs the single debug-python skill for a given .py file " +
        "path and optional error message.",

    skills: [
        "debug-python",
    ],

}

export default debugPythonCodeWorkflow
