import {
  generateAIActions,
  getSupportedAIActionInfo,
} from "./services/aiActionGenerator.js"


const runtimeContext = {
  activeProject: {
    id: "test-project-1",
    name: "Aurora-pöytä",
    status: "Suunnittelu",
    notes: "",
  },
}


const tests = [
  {
    name:
      "Projektin luominen",

    message:
      "Luo projekti nimeltä Aurora-pöytä",
  },

  {
    name:
      "Projektin tilan muuttaminen",

    message:
      "Vaihda projektin tila valmistukseen",
  },

  {
    name:
      "Notes-välilehden avaaminen",

    message:
      "Avaa Notes",
  },

  {
    name:
      "Kaksi toimintoa samassa viestissä",

    message:
      "Vaihda projektin tila valmistukseen ja avaa Notes",
  },

  {
    name:
      "Tuntematon komento",

    message:
      "Kerro minulle puusta",
  },
]


console.log(
  "\n=== ACTION PLANNER TESTI ===\n",
)


for (const test of tests) {
  const result =
    generateAIActions({
      message:
        test.message,

      runtimeContext,
    })

  console.log(
    `TESTI: ${test.name}`,
  )

  console.log(
    `VIESTI: ${test.message}`,
  )

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )

  console.log(
    "\n--------------------------\n",
  )
}


console.log(
  "TUETUT TOIMINNOT:",
)

console.log(
  JSON.stringify(
    getSupportedAIActionInfo(),
    null,
    2,
  ),
)
