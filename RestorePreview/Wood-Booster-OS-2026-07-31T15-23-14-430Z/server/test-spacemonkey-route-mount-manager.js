import {

  registerSpacemonkeyMount

} from "./services/spacemonkey/spacemonkeyRouteMountRegistry.js"



import {

  getSpacemonkeyRouteMountStatus

} from "./services/spacemonkey/spacemonkeyRouteMountManager.js"





registerSpacemonkeyMount({

  id:"os",

  path:"/api/spacemonkey/os",

  status:"active"

})





console.log(

  JSON.stringify(

    getSpacemonkeyRouteMountStatus(),

    null,

    2

  )

)
