/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DECISION MODULE V2

Vastuut:
- vastaanottaa Reasoning Modulen analyysin
- muodostaa rakenteisen päätöksen
- valitsee kohdemoduulin
- antaa Spacemonkey Identitylle korkean prioriteetin

Decision Module ei:
- kutsu kielimallia
- suorita toimintoja
- kirjoita tietokantaan
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"





const supportedTargetModules = [

  "credentials",

  "action",

  "memory",

  "knowledge",

  "conversation",

  "spacemonkey_identity",

]








function normalizeConfidence(value){

  const confidence =
    Number(value)


  if(!Number.isFinite(confidence)){

    return 0

  }


  if(confidence < 0){

    return 0

  }


  if(confidence > 1){

    return 1

  }


  return confidence

}








function normalizeReasoningAnalysis(
  value,
){

  if(
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ){

    return null

  }


  return {

    intent:
      String(
        value.intent ||
        "conversation",
      )
      .trim()
      .toLowerCase(),


    domains:
      Array.isArray(value.domains)
        ? value.domains
        : [],


    isQuestion:
      value.isQuestion === true,


    requiresAction:
      value.requiresAction === true,


    moduleNeeds:
      value.moduleNeeds || {},


    missingInformation:
      Array.isArray(
        value.missingInformation,
      )
      ? value.missingInformation
      : [],


    confidence:
      normalizeConfidence(
        value.confidence,
      ),

  }

}









function isSpacemonkeyIdentityRequest(
  analysis,
){

  const intent =
    String(
      analysis?.intent ||
      "",
    )
    .toLowerCase()



  const domains =
    Array.isArray(
      analysis?.domains,
    )
    ? analysis.domains.join(" ")
    : ""



  const text =
    `${intent} ${domains}`
      .toLowerCase()



  const keywords = [

    "spacemonkey",

    "identiteetti",

    "kuka olet",

    "kerro itsestäsi",

    "mikä olet",

  ]



  return keywords.some(
    keyword =>
      text.includes(keyword)
  )

}








function selectTargetModule(
  analysis,
){


  if(
    isSpacemonkeyIdentityRequest(
      analysis,
    )
  ){

    return "spacemonkey_identity"

  }



  if(
    analysis.moduleNeeds?.credentials
  ){

    return "credentials"

  }



  if(
    analysis.moduleNeeds?.memory
  ){

    return "memory"

  }



  if(
    analysis.moduleNeeds?.knowledge &&
    !analysis.requiresAction
  ){

    return "knowledge"

  }



  if(
    analysis.moduleNeeds?.action ||
    analysis.requiresAction
  ){

    return "action"

  }



  return "conversation"

}








function createDecisionReason({
  targetModule,
}){


  if(
    targetModule === "spacemonkey_identity"
  ){

    return (
      "Spacemonkey identiteettipyyntö " +
      "ohjataan Identity Moduleen."
    )

  }



  return (

    `Pyyntö ohjataan moduulille "${targetModule}".`

  )

}








function createDecision(
  reasoningAnalysis,
){

  const analysis =
    normalizeReasoningAnalysis(
      reasoningAnalysis,
    )


  if(!analysis){

    return {

      decision:
        "clarify",

      targetModule:
        null,

      reason:
        "Reasoning-analyysi puuttuu.",

      confidence:
        0,

    }

  }



  const targetModule =
    selectTargetModule(
      analysis,
    )



  return {

    decision:
      "delegate",


    targetModule:
      supportedTargetModules.includes(
        targetModule,
      )
      ? targetModule
      : "conversation",



    reason:
      createDecisionReason({
        targetModule,
      }),


    confidence:
      Number(
        Math.max(
          analysis.confidence,
          0.9,
        )
        .toFixed(2),
      ),


    missingInformation:
      analysis.missingInformation,


    analysis,

  }

}








function getReasoningAnalysis({
  request,
  runtimeContext,
}){

  return (

    runtimeContext?.reasoningAnalysis ||

    request?.reasoningAnalysis ||

    null

  )

}









function createDecisionModule(){

  return createBrainModule({

    id:
      "decision",


    name:
      "Decision Module",


    version:
      "2.0.0",


    description:
      "Valitsee turvallisesti oikean AI Brain moduulin.",


    priority:
      40,



    canHandle({

      request,

      runtimeContext,

    }){


      const analysis =
        getReasoningAnalysis({

          request,

          runtimeContext,

        })



      return {

        matched:
          runtimeContext?.decisionOnly === true &&
          analysis !== null,


        confidence:
          1,

      }


    },



    async execute({

      request,

      runtimeContext,

    }){


      const analysis =
        getReasoningAnalysis({

          request,

          runtimeContext,

        })



      const decision =
        createDecision(
          analysis,
        )



      return {

        type:
          "decision_result",


        requestId:
          request.requestId,


        ...decision,

      }

    },

  })

}







export {

  createDecision,

  createDecisionModule,

  normalizeReasoningAnalysis,

}
