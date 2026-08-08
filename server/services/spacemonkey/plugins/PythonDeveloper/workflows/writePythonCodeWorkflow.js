/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Python Code Workflow
 *
 * Ajaa write-python-skillin annetulle hyväksytylle
 * PythonCodeDraftille.
 *
 * Tarkoituksella yhden skillin workflow, samasta syystä kuin
 * publishInstagramPostWorkflow.js: WorkflowEngine ajaa kaikki
 * workflow'n skillit samalla context-oliolla, joten "hae luonnos",
 * "tarkista polku" ja "kutsu Toolia" pitäminen yhtenä skillinä on
 * tämän moottorin mallille luontevin ratkaisu.
 */

const writePythonCodeWorkflow = {

    id: "write-python-workflow",

    name: "Write Python Code Workflow",

    description:
        "Runs the single write-python skill for an approved " +
        "PythonCodeDraft.",

    skills: [
        "write-python",
    ],

}

export default writePythonCodeWorkflow
