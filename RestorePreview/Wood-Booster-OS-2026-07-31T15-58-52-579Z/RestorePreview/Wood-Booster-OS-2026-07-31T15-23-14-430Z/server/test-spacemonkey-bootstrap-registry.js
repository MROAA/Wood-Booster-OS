import {

  registerSpacemonkeyComponent,

  getSpacemonkeyComponents

} from "./services/spacemonkey/spacemonkeyBootstrapRegistry.js"





registerSpacemonkeyComponent({

  id:

    "dashboard",

  name:

    "Spacemonkey Dashboard API",

  status:

    "active"

})





registerSpacemonkeyComponent({

  id:

    "kernel",

  name:

    "Spacemonkey Kernel API",

  status:

    "active"

})





console.log(

  JSON.stringify(

    getSpacemonkeyComponents(),

    null,

    2

  )

)
