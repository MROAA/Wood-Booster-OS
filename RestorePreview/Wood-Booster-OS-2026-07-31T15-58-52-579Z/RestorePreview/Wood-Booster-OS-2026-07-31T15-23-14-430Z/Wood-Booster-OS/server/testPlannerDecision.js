import {
  analyzeIntents,
} from "./services/actionPlanner/intentAnalyzer.js"

import {
  decidePlanners,
  getPlannerDecisionInfo,
} from "./services/actionPlanner/plannerDecision.js"


const tests = [
  {
    name:
      "Projektin luominen",

    message:
      "Luo projekti nimeltä Aurora",
  },

  {
    name:
      "Projektin tilan muuttaminen",

    message:
      "Vaihda projektin tila valmistukseen",
  },

  {
    name:
      "Projektin välilehden avaaminen",

    message:
      "Avaa Notes",
  },

  {
    name:
      "Kaksi komentoa",

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
  "\n=== PLANNER DECISION TESTI ===\n",
)


for (const test of tests) {
  const intentAnalysis =
    analyzeIntents({
      message:
        test.message,
    })

  const plannerDecision =
    decidePlanners({
      intentAnalysis,
    })

  console.log(
    `TESTI: ${test.name}`,
  )

  console.log(
    `VIESTI: ${test.message}`,
  )

  console.log(
    JSON.stringify(
      {
        intentAnalysis,
        plannerDecision,
      },
      null,
      2,
    ),
  )

  console.log(
    "\n--------------------------\n",
  )
}


console.log(
  "PLANNER DECISION INFO:",
)

console.log(
  JSON.stringify(
    getPlannerDecisionInfo(),
    null,
    2,
  ),
)
