import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const releaseHistory = []



async function evaluateReleaseGate({

  prisma,

  quality,

  validation,

  testPlan,

  approval

}) {


  const score =
    quality?.score || 0



  const passed =

    score >= 75 &&

    Boolean(validation) &&

    Boolean(testPlan) &&

    Boolean(approval?.approved)



  const result = {


    status:

      passed
        ? "ready"
        : "blocked",


    approvedForRelease:

      passed,


    qualityScore:

      score,


    checks:

    {

      quality:

        score >= 75,


      validation:

        Boolean(validation),


      testing:

        Boolean(testPlan),


      approval:

        approval?.approved || false

    },


    reasons:

    passed

      ?

      [

        "Laatutarkistus hyväksytty.",

        "Validointi valmis.",

        "Testisuunnitelma olemassa.",

        "Hyväksyntä annettu."

      ]

      :

      [

        "Muutos ei täytä julkaisuehtoja.",

        "Lisätarkistus tarvitaan."

      ],


    nextStep:

      passed
        ? "prepare_write"
        : "review_required",


    createdAt:

      new Date().toISOString()

  }



  await recordActivity({

    prisma,


    type:

      "release_gate_evaluated",


    module:

      "Release Gate Engine",


    status:

      result.status,


    message:

      passed

        ?

        "Release approved."

        :

        "Release blocked. Review required."

  })



  releaseHistory.push(

    result

  )



  return result

}





function getReleaseGateStatus(){


  return {


    engine:

      "Spacemonkey Code Release Gate Engine",


    version:

      "0.2.0",


    releases:

      releaseHistory.length

  }

}



export {

  evaluateReleaseGate,

  getReleaseGateStatus

}
