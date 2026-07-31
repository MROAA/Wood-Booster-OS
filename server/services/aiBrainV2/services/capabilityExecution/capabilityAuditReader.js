/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY AUDIT READER

Vastuut:

- lukee capability execution historian
- muodostaa audit yhteenvedon
- tarjoaa järjestelmävalvonnalle tiedot

Ei:
- suorita capabilityjä
- muuta päätöksiä
- estä ajoja

=====================================
*/


import {
  getExecutionHistory,
} from "./capabilityExecutionLogger.js"




function getCapabilityAuditSummary(){

  const history =
    getExecutionHistory()



  let approved = 0

  let blocked = 0

  let approvalRequired = 0



  for(
    const entry of history
  ){

    if(
      entry.status === "approved"
    ){

      approved++

    }


    if(
      entry.status === "blocked"
    ){

      blocked++

    }


    if(
      entry.status === "approval_required"
    ){

      approvalRequired++

    }

  }



  return {

    total:
      history.length,


    approved,

    blocked,

    approvalRequired,

  }

}






function getCapabilityUsage(){

  const history =
    getExecutionHistory()



  const usage = {}



  for(
    const entry of history
  ){

    const id =
      entry.moduleId



    if(
      !usage[id]
    ){

      usage[id] = 0

    }


    usage[id]++

  }



  return usage

}






function getLatestCapabilityExecutions(
  limit = 10,
){

  const history =
    getExecutionHistory()



  return history
    .slice(
      -limit,
    )

}




export {

  getCapabilityAuditSummary,

  getCapabilityUsage,

  getLatestCapabilityExecutions,

}
