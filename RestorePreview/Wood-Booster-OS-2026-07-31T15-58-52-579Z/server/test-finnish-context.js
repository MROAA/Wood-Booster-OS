import {
  runBrain
} from "./services/aiBrainV2/index.js"





console.log("")

console.log(
  "🇫🇮 FINNISH CONTEXT TEST"
)

console.log(
  "======================"
)





const result =
  await runBrain({

    message:
      "Kerro suomalaisesta käsityöstä ja Puustaajasta",

    source:
      "finnish-context-test",

    runtimeContext: {

      identityContext: {

        name:
          "Spacemonkey",

        role:
          "Enterprise AI Operator"

      }

    }

  })





console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)





console.log("")

console.log(
  "✅ FINNISH CONTEXT TEST COMPLETE"
)
