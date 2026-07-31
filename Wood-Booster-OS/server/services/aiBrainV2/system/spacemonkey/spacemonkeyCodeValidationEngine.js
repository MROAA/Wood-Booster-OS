import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const validationHistory = []



async function validateCodeProposal({

  prisma,

  proposal,

  codeInspection,

  changeApproval

}) {


  const validation = {


    status:
      "validated",


    file:

    {

      exists:
        codeInspection?.exists || false,


      path:
        proposal?.filePath || null

    },


    proposal:

    {

      exists:
        Boolean(proposal),


      requiresApproval:
        proposal?.requiresApproval || false

    },


    approval:

    {

      status:
        changeApproval?.status || "missing",


      approved:
        changeApproval?.approved || false

    },


    risk:

      calculateRisk({

        proposal,

        codeInspection,

        changeApproval

      }),


    checks:

    [

      "Tiedoston olemassaolo tarkistettu.",

      "Muutos ehdotus tarkistettu.",

      "Hyväksyntätila tarkistettu."

    ],


    nextStep:

      "await_approval",


    createdAt:

      new Date().toISOString()

  }



  await recordActivity({

    prisma,


    type:

      "code_validation_completed",


    module:

      "Code Validation Engine",


    status:

      "completed",


    message:

      `Code proposal validation completed for ${proposal?.filePath || "unknown file"}`

  })



  validationHistory.push(

    validation

  )



  return validation

}





function calculateRisk({

  proposal,

  codeInspection,

  changeApproval

}) {


  if(

    !proposal ||

    !codeInspection?.exists

  ){

    return "high"

  }



  if(

    changeApproval?.approved

  ){

    return "low"

  }



  return "medium"

}





function getCodeValidationStatus(){


  return {


    engine:

      "Spacemonkey Code Validation Engine",


    version:

      "0.2.0",


    validations:

      validationHistory.length

  }

}



export {

  validateCodeProposal,

  getCodeValidationStatus

}
