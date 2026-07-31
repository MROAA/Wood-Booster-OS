/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY EXECUTION LOGGER

Vastuut:

- tallentaa capability-suoritukset
- säilyttää audit historian levyllä
- tarjoaa historian lukemisen

Ei suorita capabilityjä.

=====================================
*/


import {
  saveAuditEntry,
  readAuditEntries,
} from "./capabilityAuditStorage.js"



function createExecutionId(){

  return (
    "cap-" +
    Date.now().toString(36) +
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



  return saveAuditEntry(
    log,
  )

}





function getExecutionHistory(){

  return readAuditEntries()

}





function clearExecutionHistory(){

  return saveAuditEntry([])

}





export {

  createExecutionLog,

  getExecutionHistory,

  clearExecutionHistory,

}
