/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT SNAPSHOT

Vastuut:

- lukee capability audit historian
- muodostaa turvallisen tilannekuvan
- tarjoaa debug-tiedon pipelineille
- ei suorita capabilityjä

=====================================
*/


import {
  getCapabilityAuditSummary,
  getCapabilityUsage,
} from "./capabilityAuditReader.js"



function createCapabilityAuditSnapshot(){

  const summary =
    getCapabilityAuditSummary()



  const usage =
    getCapabilityUsage()



  return {

    createdAt:
      new Date()
        .toISOString(),


    summary,


    usage,


    status:
      "available",

  }

}



function getLatestCapabilityAuditSnapshot(){

  return createCapabilityAuditSnapshot()

}



export {

  createCapabilityAuditSnapshot,

  getLatestCapabilityAuditSnapshot,

}
