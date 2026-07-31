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

  getSpacemonkeyKernel

} from "./services/spacemonkey/spacemonkeyKernelAdapter.js"







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

    getSpacemonkeyKernel(),

    null,

    2

  )

)
