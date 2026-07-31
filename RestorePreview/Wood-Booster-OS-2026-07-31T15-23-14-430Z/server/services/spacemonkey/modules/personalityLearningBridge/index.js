const MODULE_ID = "personality-learning-bridge"



const learningProposals = []



function analyzePersonalityEvent({

  type,

  source,

  context,

}){

  const proposal = {

    id:
      `learning-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    source,

    eventType:
      type,

    context,

    observation:
      generateObservation(type),

    suggestion:
      generateSuggestion(type),

    status:
      "proposal",

  }


  learningProposals.push(proposal)


  return proposal

}



function generateObservation(type){

  const observations = {

    "humor-used":
      "Humor interaction was detected.",


    "rule-applied":
      "A personality rule affected communication.",


    "style-changed":
      "Communication style was modified.",


  }


  return (
    observations[type]
    ||
    "Unknown personality event."
  )

}



function generateSuggestion(type){

  const suggestions = {

    "humor-used":
      "Review if humor improves user interaction.",


    "rule-applied":
      "Evaluate if the rule supports Spacemonkey identity.",


    "style-changed":
      "Check whether communication remains consistent.",

  }


  return (
    suggestions[type]
    ||
    "Collect more information before changing behavior."
  )

}



function getLearningProposals(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      learningProposals.length,

    proposals:
      learningProposals,

  }

}



function getLatestProposals(){

  return learningProposals.slice(-5)

}



export {

  MODULE_ID,

  analyzePersonalityEvent,

  getLearningProposals,

  getLatestProposals,

}
