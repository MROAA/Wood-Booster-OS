import {

  registerModule

} from "./services/spacemonkey/spacemonkeyModuleManager.js"



import {

  registerRoute

} from "./services/spacemonkey/spacemonkeyRouteManager.js"



import {

  registerSpacemonkeyApiRoute

} from "./services/spacemonkey/spacemonkeyApiRegistry.js"



import {

  createKernelCatalog

} from "./services/spacemonkey/spacemonkeyKernelCatalog.js"







registerModule({

  id:"restore",

  name:"Spacemonkey Restore Module"

})







registerRoute({

  id:"modules",

  name:"Spacemonkey Modules API",

  path:"/spacemonkey/modules"

})







registerSpacemonkeyApiRoute({

  id:"system",

  version:"1.0.0",

  status:"active"

})







console.log(

  JSON.stringify(

    createKernelCatalog(),

    null,

    2

  )

)
