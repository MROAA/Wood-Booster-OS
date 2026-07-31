import {

  registerSpacemonkeyApiRoute

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



import {

  getSpacemonkeyApiStatus

} from "./services/spacemonkey/spacemonkeyApiBridge.js"







registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})







console.log(

  JSON.stringify(

    getSpacemonkeyApiStatus(),

    null,

    2

  )

)
