import {
  bootSpacemonkey,
} from "./services/aiBrainV2/personality/spacemonkeyBootSequence.js"


import {
  startController,

  processTask,

  getControllerStatus

} from "./services/aiBrainV2/personality/spacemonkeyRuntimeController.js"



console.log(
  "\n===================================="
)

console.log(
  " SPACEMONKEY RUNTIME CONTROLLER TEST"
)

console.log(
  "====================================\n"
)



console.log(
  "1. Booting Spacemonkey...\n"
)



const boot =
  await bootSpacemonkey()



console.log(
  boot
)



console.log(
  "\n2. Starting Runtime Controller...\n"
)



const controller =
  startController()



console.log(
  controller
)



console.log(
  "\n3. Sending Intelligence Task...\n"
)



const result =
  await processTask({

    message:
      "Suunnitellaan Wood-Booster OS:n seuraava AI Brain kehitysvaihe",


    memory:

    [

      {

        type:
          "experience",

        content:
          "Spacemonkey Core rakennetaan modulaarisesti"

      }

    ],


    knowledge:

    [

      {

        type:
          "fact",

        content:
          "AI Brain V2 sisältää modulaarisen arkkitehtuurin"

      }

    ],


    systemState:

    {

      project:
        "Wood-Booster OS",


      component:
        "Spacemonkey"


    }

  })



console.log(
  "\nTASK RESULT:\n"
)



console.dir(

  result,

  {

    depth:null

  }

)



console.log(
  "\n4. Controller Status:\n"
)



console.dir(

  getControllerStatus(),

  {

    depth:null

  }

)



console.log(
  "\n===================================="
)

console.log(
  " RUNTIME CONTROLLER TEST COMPLETE"
)

console.log(
  "====================================\n"
)
