import {

  registerSpacemonkeyModule,

  getSpacemonkeyModules

} from "./services/spacemonkey/spacemonkeyModuleRegistry.js"



registerSpacemonkeyModule({

  id:"restore",

  version:"1.0.0",

  status:"active"

})



console.log(

 JSON.stringify(

  getSpacemonkeyModules(),

  null,

  2

 )

)
