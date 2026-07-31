import {
  analyzeIntents,
  getIntentAnalyzerInfo,
} from "./services/actionPlanner/intentAnalyzer.js"


const testMessages = [
  "Luo projekti nimeltä Aurora",

  "Vaihda projektin tila valmistukseen",

  "Avaa Notes",

  "Vaihda projektin tila valmistukseen ja avaa Notes",

  "Aurora-projekti näyttää olevan valmis",

  "Voisitko avata muistiinpanot?",

  "Mitä kuuluu tänään?",
]


function printSeparator() {
  console.log(
    "\n" +
    "=".repeat(70),
  )
}


function printIntent(intent) {
  console.log(
    JSON.stringify(
      intent,
      null,
      2,
    ),
  )
}


function runTests() {
  console.log(
    "WOOD-BOOSTER INTENT ANALYZER TEST",
  )

  console.log(
    "\nAnalyzer info:",
  )

  console.log(
    JSON.stringify(
      getIntentAnalyzerInfo(),
      null,
      2,
    ),
  )

  for (
    const message
    of testMessages
  ) {
    printSeparator()

    console.log(
      `MESSAGE: ${message}`,
    )

    const result =
      analyzeIntents({
        message,
      })

    printIntent(
      result,
    )
  }

  printSeparator()

  console.log(
    "Intent Analyzer tests completed.",
  )
}


try {
  runTests()
} catch (error) {
  console.error(
    "Intent Analyzer test failed:",
    error,
  )

  process.exitCode = 1
}
