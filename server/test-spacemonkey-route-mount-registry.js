import {

  registerSpacemonkeyMount,

  getSpacemonkeyMounts

} from "./services/spacemonkey/spacemonkeyRouteMountRegistry.js"



registerSpacemonkeyMount({

  id:"os",

  path:"/api/spacemonkey/os",

  status:"active"

})



registerSpacemonkeyMount({

  id:"kernel",

  path:"/api/spacemonkey/kernel",

  status:"active"

})



console.log(

  JSON.stringify(

    getSpacemonkeyMounts(),

    null,

    2

  )

)
