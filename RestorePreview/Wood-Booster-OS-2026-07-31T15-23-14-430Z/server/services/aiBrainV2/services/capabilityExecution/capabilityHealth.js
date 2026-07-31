/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY HEALTH

Vastuut:

- kertoo capability-järjestelmän tilan
- lukee audit-palvelun tietoja
- antaa System Pulse -käyttöön tilaraportin

Ei:
- suorita capabilityjä
- kirjoita audit-dataa
- muuta pipelinea

=====================================
*/


import {
  getCapabilityAuditStatus,
  getRecentAuditEvents,
  getCapabilityUsage,
} from "./capabilityAuditService.js"





function getCapabilityHealth(){

  const auditStatus =
    getCapabilityAuditStatus()


  const usage =
    getCapabilityUsage()


  const recent =
    getRecentAuditEvents(5)



  return {

    status:
      auditStatus.status,


    healthy:
      auditStatus.status === "available",


    summary:
      auditStatus.summary,


    usage,


    recent,


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getCapabilityHealth,

}
