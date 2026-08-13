/*
=====================================

SPACEMONKEY SECURITY INTEGRATION V1

Yhdistää:

Spacemonkey System Kernel
        |
        v
Security Integration Adapter
        |
        v
Tool Security Layer


Vastuut:

- tarjoaa Security Layer tilan Kernelille
- yhdistää olemassa olevat turvarajapinnat
- toimii turvallisena adapterina


Ei:

- tee päätöksiä
- suorita työkaluja
- hyväksy toimintoja automaattisesti
- ohita security layeria

=====================================
*/


import {
  createSecurityContext,
  evaluateAction,
  getIntegrationStatus,
} from "./modules/securityIntegrationAdapter/index.js"







function getSpacemonkeySecurityIntegrationStatus(){


  return {

    system:
      "Spacemonkey Security Integration",

    version:
      "1.0.0",

    status:
      "READY",


    adapter:

      getIntegrationStatus(),


    securityContext:

      createSecurityContext(),

  }

}







function validateSpacemonkeyAction(
  action
){

  return evaluateAction(
    action
  )

}







export {

  getSpacemonkeySecurityIntegrationStatus,

  validateSpacemonkeyAction,

}
