const generationHistory = []



function generateCodeChange({

  filePath,

  sourceCode,

  changePlan,

  instruction

}) {


  const proposal = {


    filePath,


    originalSize:
      sourceCode?.length || 0,


    status:
      "generated_proposal",


    instruction:
      instruction || null,


    analysis:
    {

      target:
        changePlan?.target || null,


      action:
        changePlan?.action || null,


      steps:
        changePlan?.steps || []

    },


    proposedChanges:

      createChangeProposal({

        changePlan,

        instruction

      }),


    originalCode:

      sourceCode,


    requiresApproval:
      true,


    createdAt:
      new Date().toISOString()

  }



  generationHistory.push(

    proposal

  )



  return proposal

}





function createChangeProposal({

  changePlan,

  instruction

}) {


  const changes = []



  if(
    changePlan?.action === "update"
  ){

    changes.push(
      "Säilytä nykyinen toimiva rakenne."
    )


    changes.push(
      "Tee pienin turvallinen muutos."
    )


    changes.push(
      "Älä riko olemassa olevia API-kutsuja."
    )


    changes.push(
      "Palauta kokonainen valmis tiedosto."
    )

  }



  if(
    changePlan?.action === "create"
  ){

    changes.push(
      "Luo uusi komponenttirakenne."
    )


    changes.push(
      "Integroi olemassa olevaan järjestelmään."
    )

  }



  return {

    instruction,

    changes,

    confidence:
      0.8

  }

}





function approveGeneratedChange(){

  return {

    status:
      "approved",

    message:
      "Muutos hyväksytty. Kirjoitusvaihe voidaan suorittaa."

  }

}





function getCodeGeneratorStatus(){


  return {

    engine:
      "Spacemonkey Code Generator",


    version:
      "0.2.0",


    generations:
      generationHistory.length

  }

}



export {

  generateCodeChange,

  approveGeneratedChange,

  getCodeGeneratorStatus

}
