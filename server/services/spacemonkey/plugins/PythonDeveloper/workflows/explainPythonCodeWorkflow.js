/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Explain Python Code Workflow
 *
 * Ajaa explain-python-skillin annetulle tiedostopolulle.
 *
 * Tarkoituksella yhden skillin workflow, samasta syystä kuin
 * writePythonCodeWorkflow.js: WorkflowEngine ajaa kaikki workflow'n
 * skillit samalla context-oliolla, joten "tarkista polku", "lue
 * tiedosto" ja "kutsu AI:ta" pitäminen yhtenä skillinä on tämän
 * moottorin mallille luontevin ratkaisu.
 */

const explainPythonCodeWorkflow = {

    id: "explain-python-workflow",

    name: "Explain Python Code Workflow",

    description:
        "Runs the single explain-python skill for a given .py file " +
        "path.",

    skills: [
        "explain-python",
    ],

}

export default explainPythonCodeWorkflow
