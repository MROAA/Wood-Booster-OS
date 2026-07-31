import {

  transitionModuleState

} from "./services/spacemonkey/spacemonkeyModuleLifecycle.js"





const runtime = {


  id:

    "restore",


  state:

    "loaded"


}







const result =

  transitionModuleState(

    runtime,

    "active"

  )







console.log(

  JSON.stringify(

    result,

    null,

    2

  )

)
