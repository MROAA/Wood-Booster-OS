import {
  runSpacemonkeyAdapter,
} from "./services/aiBrainV2/personality/spacemonkeyAIBrainAdapter.js"



console.log(
  "\n================================"
)

console.log(
  " SPACEMONKEY AI BRAIN ADAPTER TEST"
)

console.log(
  "================================\n"
)



const result =
  await runSpacemonkeyAdapter({

    message:
      "Suunnitellaan uusi muistijärjestelmä Wood-Booster AI Brainiin",


    knowledge:

    [

      {

        title:
          "AI Brain V2 Architecture",

        source:
          "internal"

      }

    ],


    memory:

    [

      {

        event:
          "Spacemonkey Core development started"

      }

    ],


    systemContext:

    {

      project:
        "Wood-Booster OS",


      environment:
        "development",


      activeSystem:
        "AI Brain V2"

    }

  })



console.log(
  "\nRESULT:"
)


console.dir(
  result,
  {
    depth:null
  }
)



console.log(
  "\n================================"
)

console.log(
  " ADAPTER TEST COMPLETE"
)

console.log(
  "================================\n"
)
