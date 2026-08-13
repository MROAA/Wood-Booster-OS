/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM KNOWLEDGE PROVIDER V2


Vastuut:

- tarjoaa AI Brain järjestelmätiedon
- yhdistää system core -lähteet
- muuttaa tiedon Knowledge Layer muotoon


Ei:

- ei kutsu LLM:ää
- ei tee päätöksiä
- ei muuta system-moduuleita


=====================================
*/


import {
  getAIIdentity,
} from "../../system/aiIdentity.js"



import {
  getAIConstitution,
} from "../../system/aiConstitution.js"



import {
  getBrainVersionSummary,
} from "../../system/brainVersion.js"



import {
  getSpacemonkeyCoreSummary,
} from "../../system/spacemonkeyCore.js"







function safeString(value){

  if(
    typeof value === "string"
  ){

    return value

  }


  return JSON.stringify(
    value,
    null,
    2
  )

}







function loadSystemKnowledge(){


  const identity =
    getAIIdentity()



  const constitution =
    getAIConstitution()



  const brainVersion =
    getBrainVersionSummary()



  const spacemonkey =
    getSpacemonkeyCoreSummary()





  const content = [

    "AI IDENTITY",

    safeString(
      identity
    ),


    "",


    "AI CONSTITUTION",

    safeString(
      constitution
    ),


    "",


    "BRAIN VERSION",

    safeString(
      brainVersion
    ),


    "",


    "SPACEMONKEY CORE SUMMARY",

    safeString(
      spacemonkey
    ),

  ].join("\n")







  return {

    id:
      "SYSTEM_RULES",


    source:
      "system",


    category:
      "rules",


    content,


    priority:
      100

  }


}







export {

  loadSystemKnowledge

}
