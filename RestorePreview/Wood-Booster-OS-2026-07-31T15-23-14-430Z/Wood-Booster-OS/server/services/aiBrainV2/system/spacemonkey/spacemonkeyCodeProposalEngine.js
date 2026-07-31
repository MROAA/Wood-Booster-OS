const proposalHistory = []



function createCodeProposal({

  filePath,

  sourceCode,

  codeChangePlan,

  instruction

}) {


  const proposal = {


    status:
      "proposal_created",


    filePath:
      filePath || null,


    instruction:
      instruction || null,


    currentCodeSize:
      sourceCode?.length || 0,


    analysis:

    {

      target:
        codeChangePlan?.target || null,


      action:
        codeChangePlan?.action || null,


      language:
        codeChangePlan?.analysis?.language || null,


      components:
        codeChangePlan?.analysis?.components || [],


      hooks:
        codeChangePlan?.analysis?.hooks || []

    },


    proposal:

    [

      "Nykyinen rakenne säilytetään.",

      "Muutos tehdään pienimpänä toimivana versiona.",

      "API-kutsuja ei rikota ilman syytä.",

      "Koko tiedosto palautetaan ennen hyväksyntää."

    ],


    confidence:
      0.8,


    requiresApproval:
      true,


    createdAt:
      new Date().toISOString()

  }



  proposalHistory.push(

    proposal

  )



  return proposal

}



function getCodeProposalStatus(){


  return {

    engine:
      "Spacemonkey Code Proposal Engine",


    version:
      "0.1.0",


    proposals:
      proposalHistory.length

  }

}



export {

  createCodeProposal,

  getCodeProposalStatus

}
