import {
  initializeSpacemonkeyRoot
} from "./root/spacemonkeyRootDatabaseBridge.js"



import {
  SPACEMONKEY_ROOT_MANIFEST
} from "./root/spacemonkeyRootManifest.js"





async function loadSpacemonkeyGenesis({

  rootPath

}) {


  const root =
    await initializeSpacemonkeyRoot({

      rootPath

    })



  return {


    system:
      "Spacemonkey Genesis Loader",


    version:
      "1.0.0",


    status:
      "READY",



    identity:
      SPACEMONKEY_ROOT_MANIFEST,



    root,



    message:
      "Spacemonkey genesis environment loaded."

  }


}





export {

  loadSpacemonkeyGenesis

}
