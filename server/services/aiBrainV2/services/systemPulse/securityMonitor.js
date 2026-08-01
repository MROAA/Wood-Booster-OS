/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE SECURITY MONITOR V1

Vastuut:

- lukee audit turvallisuustiedot
- muodostaa Security Pulse yhteenvedon
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
  "1.0.0"





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



  const blocked =
    report.summary.blocked


  const approvalRequired =
    report.summary.approvalRequired



  return {

    healthy:
      blocked === 0 &&
      approvalRequired === 0,


    blocked,

    approvalRequired,


    totalEvents:
      report.summary.total,


  }

}





export {

  SECURITY_MONITOR_ID,

  SECURITY_MONITOR_VERSION,

  getSecurityPulseStatus,

  getSecurityHealth,

}
