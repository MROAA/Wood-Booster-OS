import {

  loadSpacemonkeyModule,

  getLoadedSpacemonkeyModules

} from "./services/spacemonkey/spacemonkeyModuleLoader.js"





loadSpacemonkeyModule({

  id:"snapshot",

  version:"1.0.0",

  status:"active"

})





loadSpacemonkeyModule({

  id:"restore",

  version:"1.0.0",

  status:"active"

})





console.log(

  JSON.stringify(

    getLoadedSpacemonkeyModules(),

    null,

    2

  )

)
