/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Code Change Workflow
 *
 * Yhden skillin workflow, samasta syystä kuin PythonDeveloperin
 * vastaavat workflow't: WorkflowEngine ajaa kaikki workflow'n
 * skillit samalla context-oliolla, joten "tarkista polku", "lue
 * tiedosto" ja "kutsu AI:ta" pitäminen yhtenä skillinä on tämän
 * moottorin mallille luontevin ratkaisu.
 */

const generateCodeChangeWorkflow = {

    id: "generate-code-change-workflow",

    name: "Generate Code Change Workflow",

    description:
        "Runs the single generate-code-change skill for a " +
        "plain-language request against a project file.",

    skills: [
        "generate-code-change",
    ],

}

export default generateCodeChangeWorkflow
