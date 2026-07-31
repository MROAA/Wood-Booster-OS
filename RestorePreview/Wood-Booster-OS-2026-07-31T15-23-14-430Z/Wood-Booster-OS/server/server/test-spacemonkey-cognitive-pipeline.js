import {
  runSpacemonkeyPipeline,
} from "./services/aiBrainV2/personality/spacemonkeyCognitivePipeline.js"



console.log(
  "\n===================================="
)

console.log(
  " SPACEMONKEY COGNITIVE PIPELINE TEST"
)

console.log(
  "====================================\n"
)



const result =
  await runSpacemonkeyPipeline({

    message:

      "Suunnitellaan Wood-Booster AI Brainiin parempi muistijärjestelmä",



    memory:

    [

      {

        type:
          "experience",

        content:
          "AI Brain V2 modulaarinen rakenne on kehityksessä"

      }

    ],



    knowledge:

    [

      {

        type:
          "fact",

        content:
          "Memory ja Knowledge erotetaan omiksi kerroksiksi"

      }

    ],



    systemState:

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
  "\nPIPELINE RESULT\n"
)


console.dir(

  result,

  {

    depth:null

  }

)



console.log(
  "\n===================================="
)

console.log(
  " PIPELINE TEST COMPLETE"
)

console.log(
  "====================================\n"
)
