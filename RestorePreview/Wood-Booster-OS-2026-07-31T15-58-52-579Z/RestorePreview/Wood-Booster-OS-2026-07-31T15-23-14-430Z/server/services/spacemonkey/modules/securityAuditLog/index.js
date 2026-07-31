const MODULE_ID = "security-audit-log"



const auditEvents = []



function createAuditEvent({

  action,

  module,

  risk,

  status,

}){

  const event = {

    id:
      `audit-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    action,

    module,

    risk,

    status,

  }


  auditEvents.push(event)


  return event

}



function getAuditLog(){

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



function getEventsByRisk(risk){

  return auditEvents.filter(
    event =>
      event.risk === risk
  )

}



function getCriticalEvents(){

  return auditEvents.filter(
    event =>
      event.risk === "critical"
  )

}



export {

  MODULE_ID,

  createAuditEvent,

  getAuditLog,

  getEventsByRisk,

  getCriticalEvents,

}
