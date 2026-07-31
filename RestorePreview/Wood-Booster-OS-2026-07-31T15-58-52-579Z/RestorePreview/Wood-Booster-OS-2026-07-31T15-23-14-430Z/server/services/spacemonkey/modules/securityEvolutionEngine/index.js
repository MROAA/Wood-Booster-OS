const MODULE_ID = "security-evolution-engine"



const improvements = []



function createSecurityObservation({

  area,

  observation,

  severity,

}){

  const entry = {

    id:
      `observation-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    area,

    observation,

    severity,

    status:
      "recorded",

  }


  improvements.push(entry)


  return entry

}



function createImprovementProposal({

  title,

  reason,

  priority,

}){

  const proposal = {

    id:
      `proposal-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    title,

    reason,

    priority,

    status:
      "pending-review",

  }


  improvements.push(proposal)


  return proposal

}



function getSecurityEvolution(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      improvements.length,

    evolution:
      improvements,

  }

}



function getHighPriorityItems(){

  return improvements.filter(
    item =>
      item.priority === "high" ||
      item.severity === "high" ||
      item.severity === "critical"
  )

}



export {

  MODULE_ID,

  createSecurityObservation,

  createImprovementProposal,

  getSecurityEvolution,

  getHighPriorityItems,

}
