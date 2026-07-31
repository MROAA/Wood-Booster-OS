import {

  getSafetyCore

} from "./services/spacemonkey/core/safetyCore.js"





const safety =

  getSafetyCore()





console.log(

  JSON.stringify(

    safety,

    null,

    2

  )

)
