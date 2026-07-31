/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT SERVICE

Vastuut:

- yhdistää audit-toiminnot yhteen palveluun
- tarjoaa turvallisen rajapinnan audit-tietoihin
- valmistaa System Pulse käyttöä varten

Ei:
- suorita capabilityjä
- tee päätöksiä
- muuta pipelinea

=====================================
*/


import {
  getAuditRecords,
  getAuditSummary,
} from "./capabilityAuditStore.js"





function getCapabilityAuditStatus(){

  const summary =
    getAuditSummary()


  return {

    status:
      "available",

    summary,

    totalEvents:
      summary.total,

  }

}





function getRecentAuditEvents(
  limit = 10,
){

  const records =
    getAuditRecords()


  return records
    .slice(
      -limit,
    )

}





function getCapabilityUsage(){

  const usage = {}


  const records =
    getAuditRecords()



  for(
    const record
    of records
  ){

    if(
      !usage[record.moduleId]
    ){

      usage[record.moduleId] =
        0

    }


    usage[record.moduleId]++

  }


  return usage

}





function createAuditReport(){

  return {

    createdAt:
      new Date()
        .toISOString(),

    status:
      "available",

    summary:
      getAuditSummary(),

    usage:
      getCapabilityUsage(),

    recent:
      getRecentAuditEvents(),

  }

}





export {

  getCapabilityAuditStatus,

  getRecentAuditEvents,

  getCapabilityUsage,

  createAuditReport,

}
