import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const EVOLUTION_TYPES = {

  CAPABILITY:
    "capability_growth",

  MODULE:
    "module_improvement",

  PERFORMANCE:
    "performance_improvement",

  KNOWLEDGE:
    "knowledge_expansion"

}



let evolutionHistory = []



function analyzeDevelopmentNeed({

  learningRecord,

}) {


  const needs = []



  if(
    !learningRecord
  ){

    return needs

  }



  if(
    learningRecord.lessons.length > 0
  ){

    needs.push({

      type:
        EVOLUTION_TYPES.CAPABILITY,


      reason:
        "Lessons indicate opportunity for capability improvement."

    })

  }



  return needs

}



function createEvolutionProposal({

  learningRecord,

}) {


  const needs =
    analyzeDevelopmentNeed({

      learningRecord

    })



  const proposal = {


    id:
      `evolution-${Date.now()}`,


    type:
      needs.length > 0

        ?
        needs[0].type

        :
        EVOLUTION_TYPES.KNOWLEDGE,


    changes:


    needs,


    status:
      "proposed",


    createdAt:
      new Date().toISOString()

  }



  evolutionHistory.push(
    proposal
  )



  return proposal

}



function approveEvolution({

  proposalId,

}) {


  const proposal =
    evolutionHistory.find(

      item =>
        item.id === proposalId

    )



  if(
    !proposal
  ){

    return {

      success:false,

      reason:
        "Proposal not found"

    }

  }



  proposal.status =
    "approved"



  proposal.approvedAt =
    new Date().toISOString()



  return {


    success:true,


    proposal

  }

}



function getEvolutionHistory(){


  return [

    ...evolutionHistory

  ]

}



function getEvolutionStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    currentVersion:
      core.version,


    proposals:
      evolutionHistory.length,


    history:
      evolutionHistory

  }

}



export {

  EVOLUTION_TYPES,

  createEvolutionProposal,

  approveEvolution,

  getEvolutionHistory,

  getEvolutionStatus

}
