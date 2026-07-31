/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT STORAGE

Vastuut:

- tallentaa capability audit lokit levylle
- lukee historian
- säilyttää tiedot prosessien välillä

=====================================
*/


import fs from "fs"
import path from "path"



const auditFile =
  path.resolve(
    "services/aiBrainV2/data/capabilityRegistry/capability-audit.json",
  )



function ensureAuditFile(){

  const directory =
    path.dirname(
      auditFile,
    )


  if(
    !fs.existsSync(directory)
  ){

    fs.mkdirSync(
      directory,
      {
        recursive:true,
      },
    )

  }


  if(
    !fs.existsSync(auditFile)
  ){

    fs.writeFileSync(
      auditFile,
      "[]",
      "utf-8",
    )

  }

}





function saveAuditEntry(entry){

  ensureAuditFile()


  const history =
    JSON.parse(
      fs.readFileSync(
        auditFile,
        "utf-8",
      ),
    )


  history.push(
    entry,
  )


  fs.writeFileSync(
    auditFile,
    JSON.stringify(
      history,
      null,
      2,
    ),
    "utf-8",
  )


  return entry

}





function readAuditEntries(){

  ensureAuditFile()


  return JSON.parse(
    fs.readFileSync(
      auditFile,
      "utf-8",
    ),
  )

}





export {
  saveAuditEntry,
  readAuditEntries,
}
