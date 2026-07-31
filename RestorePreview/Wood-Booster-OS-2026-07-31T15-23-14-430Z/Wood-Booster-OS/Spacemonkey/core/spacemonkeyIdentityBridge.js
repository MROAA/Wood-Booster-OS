import {
  getSpacemonkeyIdentity,
} from "../../server/services/aiBrainV2/system/spacemonkey/spacemonkeyIdentity.js"


import {
  getIdentityGodFiles,
} from "./spacemonkeyGodFileBridge.js"





const identityHistory = []







function loadCoreIdentity(){


  const identity =

    getSpacemonkeyIdentity()



  const identityGodFiles =

    getIdentityGodFiles()





  const result = {


    system:

      "Spacemonkey Identity Bridge",



    identity:

      {

        name:

          identity.name,


        version:

          identity.version,


        purpose:

          identity.purpose,


        origin:

          identity.origin

      },



    source:

      {

        type:

          "Central Core GodFile Identity",



        domain:

          "identity",



        files:

          identityGodFiles?.files

          ||

          []

      },



    loadedAt:

      new Date().toISOString()

  }





  identityHistory.push(

    result

  )





  return result

}







function getIdentity(){


  return loadCoreIdentity()

}







function getIdentityStatus(){


  return {


    engine:

      "Spacemonkey Identity Bridge",


    version:

      "1.1.0",


    requests:

      identityHistory.length

  }

}







function getIdentityHistory(){


  return [

    ...identityHistory

  ]

}







export {

  getIdentity,

  loadCoreIdentity,

  getIdentityStatus,

  getIdentityHistory

}
