/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT STORE

Vastuut:

- säilyttää capability audit tapahtumat
- tarjoaa historian lukemiseen
- toimii pysyvän audit-kerroksen pohjana

Ei:
- suorita capabilityjä
- tee päätöksiä
- muuta pipeline-logiikkaa

=====================================
*/


const auditRecords = []



function addAuditRecord(record){

  const entry = {

    id:
      createAuditId(),

    ...record,

    createdAt:
      new Date()
        .toISOString(),

  }


  auditRecords.push(
    entry,
  )


  return entry

}





function createAuditId(){

  return (
    "audit-" +
    Date.now()
      .toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2,8)
  )

}





function getAuditRecords(){

  return [
    ...auditRecords,
  ]

}





function getAuditSummary(){

  const summary = {

    total:
      auditRecords.length,

    approved:
      0,

    blocked:
      0,

    approvalRequired:
      0,

  }



  for(
    const record
    of auditRecords
  ){

    if(
      record.status === "approved"
    ){

      summary.approved++

    }


    if(
      record.status === "blocked"
    ){

      summary.blocked++

    }


    if(
      record.status === "approval_required"
    ){

      summary.approvalRequired++

    }

  }



  return summary

}





function clearAuditRecords(){

  auditRecords.length = 0

}





export {

  addAuditRecord,

  getAuditRecords,

  getAuditSummary,

  clearAuditRecords,

}
