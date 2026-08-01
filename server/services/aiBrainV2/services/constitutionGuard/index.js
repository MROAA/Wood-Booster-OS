/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CONSTITUTION GUARD V1

Vastuut:

- tarkistaa AI Constitution säännöt
- toimii päätöksen ja capability layerin välissä
- palauttaa sallitun etenemisen tilan


Ei:

- ei suorita moduuleja
- ei tee Decision-päätöksiä
- ei kutsu LLM:ää
- ei kirjoita muistia
- ei muuta käyttäjän viestiä

=====================================
*/


import {
  evaluateConstitutionalAction,
} from "../../system/aiConstitution.js"



const CONSTITUTION_GUARD_ID =
  "constitution-guard"



const CONSTITUTION_GUARD_VERSION =
  "1.0.0"





function evaluateConstitutionGuard({

  actionType,

  writesPermanentMemory = false,

  exposesPrivateData = false,

  requiresHumanApproval = false,

} = {}){


  const constitutionResult =

    evaluateConstitutionalAction({

      actionType,

      writesPermanentMemory,

      exposesPrivateData,

      requiresHumanApproval,

    })





  return {

    guard:

      {

        id:
          CONSTITUTION_GUARD_ID,


        version:
          CONSTITUTION_GUARD_VERSION,

      },


    success:
      true,


    decision:
      constitutionResult.decision,


    reason:
      constitutionResult.reason,


    constitution:
      constitutionResult,

  }

}





function getConstitutionGuardStatus(){

  return {

    id:
      CONSTITUTION_GUARD_ID,


    name:
      "Constitution Guard",


    version:
      CONSTITUTION_GUARD_VERSION,


    status:
      "active",

  }

}





export {

  CONSTITUTION_GUARD_ID,

  CONSTITUTION_GUARD_VERSION,

  evaluateConstitutionGuard,

  getConstitutionGuardStatus,

}
