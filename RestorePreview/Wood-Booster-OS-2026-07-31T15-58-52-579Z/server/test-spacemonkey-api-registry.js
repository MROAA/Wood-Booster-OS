import {

  registerSpacemonkeyApiRoute,

  getSpacemonkeyApiRoutes

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})



console.log(

  JSON.stringify(

    getSpacemonkeyApiRoutes(),

    null,

    2

  )

)
