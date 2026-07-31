/*
=====================================

SPACEMONKEY TOOLS INTEGRATION V1

Yhdistää:

Spacemonkey System Kernel
        |
        v
Tool Security Gateway
        |
        v
AI Brain Action Layer


Vastuut:

- tarjoaa työkalujen turvallisuusmallin
- tarkistaa työkalujen käyttöoikeudet
- antaa Kernelille työkalutilan


Ei:

- suorita työkaluja
- ohita hyväksyntää
- tee päätöksiä
- kutsu ulkoisia palveluita

=====================================
*/


import {
  getToolSecurityModel,
  checkToolPermission,
  getCriticalTools,
} from "./modules/toolSecurityGateway/index.js"







function getSpacemonkeyToolsIntegrationStatus(){

  return {

    system:
      "Spacemonkey Tools Integration",

    version:
      "1.0.0",

    status:
      "READY",


    gateway:

      getToolSecurityModel(),


    criticalTools:

      getCriticalTools(),

  }

}







function validateToolRequest(
  toolId
){

  return checkToolPermission(
    toolId
  )

}







export {

  getSpacemonkeyToolsIntegrationStatus,

  validateToolRequest,

}
