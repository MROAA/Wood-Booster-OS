import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"



import {

  getSpacemonkeyModules

} from "./services/spacemonkey/spacemonkeyModuleAdapter.js"







registerModule({

  id:

    "restore",


  name:

    "Spacemonkey Restore Module"

})







console.log(

  JSON.stringify(

    getSpacemonkeyModules(),

    null,

    2

  )

)
