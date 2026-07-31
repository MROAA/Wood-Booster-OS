import {

  registerSpacemonkeyModule,

  updateSpacemonkeyModule,

  getSpacemonkeyModule

} from "./services/spacemonkey/spacemonkeyModuleRegistry.js"





registerSpacemonkeyModule({

  id:"restore",

  state:"loaded"

})





updateSpacemonkeyModule(

  "restore",

  {

    state:"active"

  }

)





console.log(

  JSON.stringify(

    getSpacemonkeyModule("restore"),

    null,

    2

  )

)
