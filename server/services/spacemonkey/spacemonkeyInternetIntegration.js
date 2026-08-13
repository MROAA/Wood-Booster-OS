/*
=====================================

SPACEMONKEY INTERNET INTEGRATION V2

Yhdistää:

Spacemonkey Kernel
        |
        v
Internet Safety Gateway


Vastuut:

- hallitsee internet capability tilaa
- välittää turvallisuustarkistukset
- tarjoaa kontrolloidun rajapinnan


Ei:

- ei hae internetistä
- ei suorita ulkoisia toimintoja
- ei ohita hyväksyntöjä
- ei tallenna muistia


=====================================
*/


import {
  getInternetSafetyModel,
  evaluateExternalRequest,
  getCriticalPolicies,
} from "./modules/internetSafetyGateway/index.js"







let internetEnabled = false







function startSpacemonkeyInternetIntegration(){

  internetEnabled = true


  return {

    success:
      true,


    status:
      "started",


    capability:

      {

        internet:
          internetEnabled

      }

  }

}







function stopSpacemonkeyInternetIntegration(){

  internetEnabled = false


  return {

    success:
      true,


    status:
      "stopped",


    capability:

      {

        internet:
          internetEnabled

      }

  }

}







function evaluateInternetRequest(request){


  return evaluateExternalRequest(
    request
  )

}







function getSpacemonkeyInternetCapability(){

  return {

    internet:
      internetEnabled,


    status:
      internetEnabled
        ? "ACTIVE"
        : "READY"

  }

}







function getSpacemonkeyInternetIntegrationStatus(){


  return {

    system:
      "Spacemonkey Internet Integration",


    version:
      "2.0.0",


    status:
      internetEnabled
        ? "ACTIVE"
        : "READY",



    gateway:

      getInternetSafetyModel(),



    criticalPolicies:

      getCriticalPolicies(),



    capability:

      getSpacemonkeyInternetCapability()

  }

}







export {

  startSpacemonkeyInternetIntegration,

  stopSpacemonkeyInternetIntegration,

  evaluateInternetRequest,

  getSpacemonkeyInternetCapability,

  getSpacemonkeyInternetIntegrationStatus,

}
