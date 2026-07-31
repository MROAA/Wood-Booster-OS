const MODULE_ID = "creator-intelligence-knowledge-synchronizer"



const knowledgeUpdates = []



function validateLearning(learning){

  if (
    !learning.lesson
  ){

    return {

      valid:
        false,

      reason:
        "Learning has no lesson.",

    }

  }



  return {

    valid:
      true,

  }

}



function createKnowledgeProposal({

  learning,

  category,

}){

  const validation =
    validateLearning(
      learning
    )



  if (
    !validation.valid
  ){

    return validation

  }



  const proposal = {

    id:
      `knowledge-proposal-${Date.now()}`,


    timestamp:
      new Date().toISOString(),


    category,


    lesson:
      learning.lesson,


    source:
      learning.source,


    version:
      "1.0.0",


    status:
      "proposal",

  }


  knowledgeUpdates.push(
    proposal
  )


  return proposal

}



function approveKnowledgeUpdate(id){

  const update =
    knowledgeUpdates.find(
      item =>
        item.id === id
    )


  if (
    !update
  ){

    return {

      success:
        false,

      reason:
        "Proposal not found.",

    }

  }



  update.status =
    "approved"



  update.approvedAt =
    new Date().toISOString()



  return {

    success:
      true,

    update,

  }

}



function getKnowledgeUpdates(){

  return {

    moduleId:
      MODULE_ID,


    count:
      knowledgeUpdates.length,


    updates:
      knowledgeUpdates,

  }

}



function getApprovedKnowledge(){

  return knowledgeUpdates.filter(
    item =>
      item.status === "approved"
  )

}



export {

  MODULE_ID,

  validateLearning,

  createKnowledgeProposal,

  approveKnowledgeUpdate,

  getKnowledgeUpdates,

  getApprovedKnowledge,

}
