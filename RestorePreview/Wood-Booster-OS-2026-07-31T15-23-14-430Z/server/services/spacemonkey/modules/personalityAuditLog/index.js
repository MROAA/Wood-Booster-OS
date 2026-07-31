const MODULE_ID = "personality-audit-log"



const events = []



function recordPersonalityEvent({

  type,

  source,

  description,

  context,

}){

  const event = {

    id:
      `personality-event-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    type,

    source,

    description,

    context:

      context || {},

  }


  events.push(event)


  return event

}



function getAuditHistory(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      events.length,

    events,

  }

}



function getEventsByType(type){

  return events.filter(
    event =>
      event.type === type
  )

}



function getLatestEvents(){

  return events.slice(-10)

}



export {

  MODULE_ID,

  recordPersonalityEvent,

  getAuditHistory,

  getEventsByType,

  getLatestEvents,

}
