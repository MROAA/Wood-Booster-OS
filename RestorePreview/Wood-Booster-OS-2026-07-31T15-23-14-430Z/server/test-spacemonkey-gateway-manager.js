import {

  registerSpacemonkeyApiRoute

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



import {

  getGatewayStatus

} from "./services/spacemonkey/spacemonkeyGatewayManager.js"







registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})







console.log(

  JSON.stringify(

    getGatewayStatus(),

    null,

    2

  )

)
