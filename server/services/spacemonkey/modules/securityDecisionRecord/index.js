const MODULE_ID = "security-decision-record"



const decisions = []



function createDecisionRecord({

  action,

  risk,

  decision,

  reason,

  approvedBy,

}){

  const record = {

    id:
      `decision-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    action,

    risk,

    decision,

    reason,

    approvedBy,

    outcome:
      "pending",

  }


  decisions.push(record)


  return record

}



function updateDecisionOutcome({

  id,

  outcome,

}){

  const record =
    decisions.find(
      item =>
        item.id === id
    )


  if (!record){

    return null

  }


  record.outcome =
    outcome


  record.updatedAt =
    new Date().toISOString()


  return record

}



function getDecisionHistory(){

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



function getCriticalDecisions(){

  return decisions.filter(
    decision =>
      decision.risk === "critical"
  )

}



export {

  MODULE_ID,

  createDecisionRecord,

  updateDecisionOutcome,

  getDecisionHistory,

  getCriticalDecisions,

}
