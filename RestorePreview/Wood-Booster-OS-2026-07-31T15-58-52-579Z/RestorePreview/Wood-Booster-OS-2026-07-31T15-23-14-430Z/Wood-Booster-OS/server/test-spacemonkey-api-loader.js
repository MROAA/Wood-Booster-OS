import {

  registerSpacemonkeyApiRoute

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



import {

  loadSpacemonkeyApis

} from "./services/spacemonkey/spacemonkeyApiLoader.js"





registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})





console.log(

  JSON.stringify(

    loadSpacemonkeyApis(),

    null,

    2

  )

)
