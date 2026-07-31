import {

  getKernelBridgeStatus

} from "./services/spacemonkey/spacemonkeyKernelBridge.js"



console.log(

  JSON.stringify(

    getKernelBridgeStatus(),

    null,

    2

  )

)
