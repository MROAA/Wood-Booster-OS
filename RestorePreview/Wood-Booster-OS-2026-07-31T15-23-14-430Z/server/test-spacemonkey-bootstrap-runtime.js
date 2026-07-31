import {

  loadSpacemonkeyBootstrap,

  activateSpacemonkeyBootstrap,

  getSpacemonkeyBootstrapRuntime

} from "./services/spacemonkey/spacemonkeyBootstrapRuntime.js"





console.log(

  "INITIAL"

)


console.log(

  JSON.stringify(

    getSpacemonkeyBootstrapRuntime(),

    null,

    2

  )

)





console.log(

  "LOAD"

)


console.log(

  JSON.stringify(

    loadSpacemonkeyBootstrap(),

    null,

    2

  )

)





console.log(

  "ACTIVE"

)


console.log(

  JSON.stringify(

    activateSpacemonkeyBootstrap(),

    null,

    2

  )

)
