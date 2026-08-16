/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Generate Verification Test Workflow
 *
 * Yhden skillin workflow, sama malli kuin muutkin tämän pluginin
 * workflow't. Tarkoituksella ei ketjuteta generate-code-change /
 * generate-verification-test / run-verification-test -skillejä
 * yhdeksi moniskilliseksi workflow'ksi: WorkflowEngine.execute()
 * antaa jokaiselle skillille saman context-olion muuttumattomana,
 * eikä yhdistele tuloksia automaattisesti seuraavalle skillille -
 * ketjuttaminen vaatisi joko WorkflowEnginen muuttamista (vaikuttaisi
 * kaikkiin muihinkin pluginneihin) tai skillien piilotettua
 * context-olion mutatointia (ei-toivottu sivuvaikutus). Sen sijaan
 * reitti (devCodeChangeStudio.js) kutsuu näitä kolmea
 * yhden-skillin-workflow'ta peräkkäin ja rakentaa seuraavan kontekstin
 * eksplisiittisesti edellisen tuloksesta.
 */

const generateVerificationTestWorkflow = {

    id: "generate-verification-test-workflow",

    name: "Generate Verification Test Workflow",

    description:
        "Runs the single generate-verification-test skill for a " +
        "proposed code change.",

    skills: [
        "generate-verification-test",
    ],

}

export default generateVerificationTestWorkflow
