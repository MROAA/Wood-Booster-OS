import {

  getPersonalityCore

} from "./services/spacemonkey/core/personalityCore.js"





const personality =

  getPersonalityCore()





console.log(

  JSON.stringify(

    personality,

    null,

    2

  )

)
