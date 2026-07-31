/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY BIRTH MEMORY SERVICE TEST

=====================================
*/


import {
  createSpacemonkeyBirthMemoryProposal,
} from "./services/aiBrainV2/services/spacemonkeyBirthMemoryService.js"



async function run(){

  const result =
    await createSpacemonkeyBirthMemoryProposal()


  console.log(
    result,
  )

}


run()
