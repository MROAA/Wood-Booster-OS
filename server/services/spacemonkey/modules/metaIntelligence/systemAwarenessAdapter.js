const MODULE_ID =
  "system-awareness-adapter"



import {

  collectLiveSystemAwareness

} from "./systemAwarenessLiveAdapter.js"







function collectSystemAwareness(){


  return {


    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),



    mode:

      "live-read-only-observation",



    liveSystem:

      collectLiveSystemAwareness(),



    awareness:

      {


        modules:
          "observed",


        dependencies:
          "observed",


        capabilities:
          "observed",


        health:
          "observed"


      },



    readOnly:
      true,



    requiresApproval:
      true


  }


}







export {

  MODULE_ID,

  collectSystemAwareness

}
