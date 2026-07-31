import {
  getCreatorCore
} from "./services/spacemonkey/core/creatorCore.js"



const creatorCore =

  getCreatorCore()



console.log(

  JSON.stringify(

    creatorCore,

    null,

    2

  )

)
