const MODULE_ID = "creator-intent-understanding"



const intents = []



function analyzeIntent({

  request,

  goal,

  motivation,

  constraints,

  desiredOutcome,

}){

  const intent = {

    id:
      `creator-intent-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    request,

    goal,

    motivation,

    constraints:
      constraints || [],

    desiredOutcome,

    status:
      "stored",

  }


  intents.push(intent)


  return intent

}



function getIntentMemory(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      intents.length,

    intents,

  }

}



function findIntent(id){

  return intents.find(
    item =>
      item.id === id
  ) || null

}



function getLatestIntents(){

  return intents.slice(-5)

}



function getGoals(){

  return intents.map(
    item => ({

      request:
        item.request,

      goal:
        item.goal,

    })
  )

}



export {

  MODULE_ID,

  analyzeIntent,

  getIntentMemory,

  findIntent,

  getLatestIntents,

  getGoals,

}
