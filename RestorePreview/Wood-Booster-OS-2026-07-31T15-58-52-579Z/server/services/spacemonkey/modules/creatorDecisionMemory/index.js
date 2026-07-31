const MODULE_ID = "creator-decision-memory"



const decisions = []



function createDecision({

  decision,

  reason,

  context,

  outcome,

  lesson,

}){

  const record = {

    id:
      `creator-decision-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    decision,

    reason,

    context,

    outcome,

    lesson,

    status:
      "stored",

  }


  decisions.push(record)


  return record

}



function getDecisionMemory(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      decisions.length,

    decisions,

  }

}



function findDecision(id){

  return decisions.find(
    item =>
      item.id === id
  ) || null

}



function getLessons(){

  return decisions.map(
    item => ({

      decision:
        item.decision,

      lesson:
        item.lesson,

    })
  )

}



function getLatestDecisions(){

  return decisions.slice(-5)

}



export {

  MODULE_ID,

  createDecision,

  getDecisionMemory,

  findDecision,

  getLessons,

  getLatestDecisions,

}
