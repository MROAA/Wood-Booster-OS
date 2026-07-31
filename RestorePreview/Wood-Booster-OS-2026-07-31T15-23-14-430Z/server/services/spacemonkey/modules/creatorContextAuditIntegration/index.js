const MODULE_ID = "creator-context-audit-integration"



const auditEvents = []



function createAuditEvent({

  requester,

  action,

  dataScope,

  purpose,

  result,

}){

  const event = {

    id:
      `creator-context-audit-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    requester,

    action,

    dataScope,

    purpose,

    result,

  }


  auditEvents.push(event)


  return event

}



function getAuditEvents(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      auditEvents.length,

    events:
      auditEvents,

  }

}



function getEventsByRequester(requester){

  return auditEvents.filter(
    event =>
      event.requester === requester
  )

}



function getLatestEvents(){

  return auditEvents.slice(-10)

}



export {

  MODULE_ID,

  createAuditEvent,

  getAuditEvents,

  getEventsByRequester,

  getLatestEvents,

}
