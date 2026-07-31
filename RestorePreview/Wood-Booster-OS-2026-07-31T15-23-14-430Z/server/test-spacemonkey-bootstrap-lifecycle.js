import {

  loadBootstrapLifecycle,

  activateBootstrapLifecycle,

  getBootstrapLifecycleState

} from "./services/spacemonkey/spacemonkeyBootstrapLifecycle.js"



console.log(

  "LOAD"

)


console.log(

  JSON.stringify(

    loadBootstrapLifecycle(),

    null,

    2

  )

)



console.log(

  "ACTIVE"

)


console.log(

  JSON.stringify(

    activateBootstrapLifecycle(),

    null,

    2

  )

)



console.log(

  "STATE"

)


console.log(

  JSON.stringify(

    getBootstrapLifecycleState(),

    null,

    2

  )

)
