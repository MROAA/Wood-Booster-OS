import {

  getSpacemonkeyCore

} from "./services/spacemonkey/core/coreRegistry.js"





const core =

  getSpacemonkeyCore()





console.log(

  JSON.stringify(

    core,

    null,

    2

  )

)
