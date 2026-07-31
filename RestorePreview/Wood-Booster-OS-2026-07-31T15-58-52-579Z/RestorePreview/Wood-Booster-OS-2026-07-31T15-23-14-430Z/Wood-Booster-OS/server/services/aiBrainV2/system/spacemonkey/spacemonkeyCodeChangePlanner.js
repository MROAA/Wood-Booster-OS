const planningHistory = []



function createCodeChangePlan({

  codingContext,

  codeUnderstanding,

  instruction

}) {


  const plan = {


    target:

      codingContext?.target || null,


    filePath:

      codingContext?.filePath || null,


    action:

      codingContext?.action || "unknown",


    analysis:


    {

      language:

        codeUnderstanding?.language || null,


      components:

        codeUnderstanding?.structure?.components || [],


      hooks:

        codeUnderstanding?.structure?.hooks || [],


      functions:

        codeUnderstanding?.structure?.functions || [],


      apiCalls:

        codeUnderstanding?.structure?.apiCalls || []

    },


    requestedChange:

      instruction || null,


    steps:

    [

      "Varmista nykyinen toiminta.",

      "Määritä pienin turvallinen muutos.",

      "Tee muutos kokonaisena tiedostona.",

      "Testaa toiminta.",

      "Arvioi mahdolliset sivuvaikutukset."

    ],


    safety:

    [

      "Älä muuta toimivaa rakennetta ilman syytä.",

      "Säilytä nykyiset API-kutsut.",

      "Testaa ennen seuraavaa vaihetta."

    ],


    createdAt:

      new Date().toISOString()

  }



  planningHistory.push(

    plan

  )



  return plan

}



function getCodeChangePlannerStatus(){


  return {

    engine:

      "Spacemonkey Code Change Planner",


    version:

      "0.1.0",


    plans:

      planningHistory.length

  }

}



export {

  createCodeChangePlan,

  getCodeChangePlannerStatus

}
