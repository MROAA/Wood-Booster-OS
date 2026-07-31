/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT STORE

Vastuut:

- säilyttää capability audit tapahtumat
- lataa historian levyltä
- tallentaa uudet tapahtumat
- tarjoaa yhteenvetotiedot

Ei:
- suorita capabilityjä
- tee päätöksiä

=====================================
*/


import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"



const __filename =
  fileURLToPath(
    import.meta.url,
  )


const __dirname =
  path.dirname(
    __filename,
  )



const auditFile =
  path.join(
    __dirname,
    "capability-audit.json",
  )





function loadAuditRecords(){

  try {

    if(
      !fs.existsSync(
        auditFile,
      )
    ){

      return []

    }


    const data =
      fs.readFileSync(
        auditFile,
        "utf-8",
      )


    return JSON.parse(
      data,
    )


  } catch {

    return []

  }

}





let auditRecords =
  loadAuditRecords()





function saveAuditRecords(){

  fs.writeFileSync(

    auditFile,

    JSON.stringify(
      auditRecords,
      null,
      2,
    ),

    "utf-8",

  )

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


  saveAuditRecords()



  return entry

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

  auditRecords = []

  saveAuditRecords()

}





export {

  addAuditRecord,

  getAuditRecords,

  getAuditSummary,

  clearAuditRecords,

}
