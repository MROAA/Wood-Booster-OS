import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const testHistory = []



async function createCodeTestPlan({

  prisma,

  filePath,

  codeUnderstanding,

  proposal

}) {


  const testPlan = {


    status:
      "test_plan_created",


    filePath:
      filePath || null,


    analysis:

    {

      language:
        codeUnderstanding?.language || null,


      components:
        codeUnderstanding?.structure?.components || [],


      functions:
        codeUnderstanding?.structure?.functions || [],


      apiCalls:
        codeUnderstanding?.structure?.apiCalls || []

    },


    tests:

    [

      "Varmista että komponentti latautuu ilman virheitä.",

      "Varmista että olemassa olevat toiminnot säilyvät.",

      "Varmista että API-kutsut toimivat.",

      "Tarkista ettei uusi muutos aiheuta sivuvaikutuksia."

    ],


    proposalChecked:
      Boolean(proposal),


    risk:

      calculateRisk({

        codeUnderstanding,

        proposal

      }),


    nextStep:

      "run_tests",


    createdAt:

      new Date().toISOString()

  }



  await recordActivity({

    prisma,


    type:

      "code_test_plan_created",


    module:

      "Code Test Engine",


    status:

      "completed",


    message:

      `Test plan created for ${filePath || "unknown file"}`

  })



  testHistory.push(

    testPlan

  )



  return testPlan

}





function calculateRisk({

  codeUnderstanding,

  proposal

}) {


  if(

    !codeUnderstanding ||

    !proposal

  ){

    return "high"

  }



  if(

    codeUnderstanding.structure?.apiCalls?.length > 0

  ){

    return "medium"

  }



  return "low"

}





function getCodeTestStatus(){


  return {


    engine:

      "Spacemonkey Code Test Engine",


    version:

      "0.2.0",


    tests:

      testHistory.length

  }

}



export {

  createCodeTestPlan,

  getCodeTestStatus

}
