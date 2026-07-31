/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY EXECUTION LOGGER

Vastuut:

- tallentaa capability-suoritukset
- lähettää audit-tiedon Storeen
- tarjoaa historian lukemiseen

Ei:
- suorita capabilityjä
- tee päätöksiä

=====================================
*/


import {
  addAuditRecord,
} from "./capabilityAuditStore.js"



const executionHistory = []





function createExecutionId(){

  return (
    "cap-" +
    Date.now()
      .toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2,8)
  )

}





function createExecutionLog({

  moduleId,

  capability,

  status,

  requestId,

  metadata = {},

}){

  const log = {

    id:
      createExecutionId(),

    moduleId,

    capability,

    status,

    requestId,

    metadata,

    createdAt:
      new Date()
        .toISOString(),

  }



  executionHistory.push(
    log,
  )



  addAuditRecord({

    moduleId,

    capability,

    status,

    requestId,

    metadata,

  })



  return log

}





function getExecutionHistory(){

  return [

    ...executionHistory,

  ]

}





function clearExecutionHistory(){

  executionHistory.length = 0

}





export {

  createExecutionLog,

  getExecutionHistory,

  clearExecutionHistory,

}
