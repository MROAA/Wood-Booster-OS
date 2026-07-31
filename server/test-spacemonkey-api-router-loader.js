import {

  registerSpacemonkeyApiRoute

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



import {

  loadSpacemonkeyApiRouters

} from "./services/spacemonkey/spacemonkeyApiRouterLoader.js"







registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})







console.log(

  JSON.stringify(

    loadSpacemonkeyApiRouters(),

    null,

    2

  )

)
