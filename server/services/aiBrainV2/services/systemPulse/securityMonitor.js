/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE SECURITY MONITOR V1.1

Vastuut:

- lukee audit turvallisuustiedot
- muodostaa Security Pulse yhteenvedon
- muodostaa security health tilan
- tarjoaa näkyvyyden System Pulse käyttöön

Ei:
- tee päätöksiä
- estä toimintoja
- muuta pipelinea
- kirjoita audit-dataa

=====================================
*/


import {
  createAuditReport,
} from "../capabilityExecution/capabilityAuditService.js"



const SECURITY_MONITOR_ID =
  "system-pulse-security-monitor"


const SECURITY_MONITOR_VERSION =
  "1.1.0"





function getSecurityStatus(summary){

  if(
    summary.blocked > 0
  ){

    return "warning"

  }



  if(
    summary.approvalRequired > 0
  ){

    return "attention"

  }



  return "healthy"

}





function getSecurityMessage(summary){

  if(
    summary.blocked > 0
  ){

    return (
      "Constitution Guard havaitsi estettyjä tapahtumia."
    )

  }



  if(
    summary.approvalRequired > 0
  ){

    return (
      "Järjestelmä odottaa hyväksyntää vaativia toimintoja."
    )

  }



  return (
    "Ei havaittuja turvallisuustapahtumia."
  )

}





function getSecurityPulseStatus(){

  const report =
    createAuditReport()



  return {

    id:
      SECURITY_MONITOR_ID,


    version:
      SECURITY_MONITOR_VERSION,


    status:
      "available",


    auditSummary:
      report.summary,


    securityEvents:
      report.constitution,


    recentEvents:
      report.recent,

  }

}





function getSecurityHealth(){

  const report =
    createAuditReport()



  const summary =
    report.summary



  return {

    status:
      getSecurityStatus(
        summary,
      ),


    healthy:
      summary.blocked === 0 &&
      summary.approvalRequired === 0,


    blockedEvents:
      summary.blocked,


    approvalRequired:
      summary.approvalRequired,


    totalEvents:
      summary.total,


    message:
      getSecurityMessage(
        summary,
      ),

  }

}





export {

  SECURITY_MONITOR_ID,

  SECURITY_MONITOR_VERSION,

  getSecurityPulseStatus,

  getSecurityHealth,

}
