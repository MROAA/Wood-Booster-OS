import {

  registerSpacemonkeyComponent

} from "./services/spacemonkey/spacemonkeyBootstrapRegistry.js"



import {

  getSpacemonkeyBootstrapStatus

} from "./services/spacemonkey/spacemonkeyBootstrapManager.js"







registerSpacemonkeyComponent({

  id:"dashboard",

  name:"Spacemonkey Dashboard API",

  status:"active"

})







console.log(

  JSON.stringify(

    getSpacemonkeyBootstrapStatus(),

    null,

    2

  )

)
