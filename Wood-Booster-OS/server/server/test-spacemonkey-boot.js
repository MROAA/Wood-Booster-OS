import {
  bootSpacemonkey,
} from "./services/aiBrainV2/personality/spacemonkeyBootSequence.js"


import {
  getSpacemonkeyState,
} from "./services/aiBrainV2/personality/spacemonkeyStateManager.js"



console.log(
  "\n================================="
)

console.log(
  " SPACEMONKEY BOOT TEST"
)

console.log(
  "=================================\n"
)



console.log(
  "Starting Spacemonkey boot sequence...\n"
)



const result =
  await bootSpacemonkey()



console.log(
  "BOOT RESULT:\n"
)


console.dir(

  result,

  {

    depth:null

  }

)



console.log(
  "\nCURRENT STATE:\n"
)


console.dir(

  getSpacemonkeyState(),

  {

    depth:null

  }

)



console.log(
  "\n================================="
)

console.log(
  " SPACEMONKEY BOOT TEST COMPLETE"
)

console.log(
  "=================================\n"
)
