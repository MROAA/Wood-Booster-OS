/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT SERVICE

Vastuut:

- yhdistää audit-toiminnot yhteen palveluun
- tarjoaa turvallisen rajapinnan audit-tietoihin
- valmistaa System Pulse käyttöä varten
- erottaa Constitution Audit -tapahtumat

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





function getConstitutionAuditEvents(
  limit = 10,
){

  const records =
    getAuditRecords()


  return records
    .filter(
      (record) =>
        record.type ===
        "constitution_check",
    )
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

    const id =
      record.moduleId ||
      record.capability ||
      "unknown"



    if(
      !usage[id]
    ){

      usage[id] =
        0

    }


    usage[id]++

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

    constitution:
      getConstitutionAuditEvents(),

  }

}





export {

  getCapabilityAuditStatus,

  getRecentAuditEvents,

  getConstitutionAuditEvents,

  getCapabilityUsage,

  createAuditReport,

}
