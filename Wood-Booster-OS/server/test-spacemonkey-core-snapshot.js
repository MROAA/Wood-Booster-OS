import {

  createCoreSnapshot

} from "./services/spacemonkey/core/coreSnapshot.js"





const snapshot =

  createCoreSnapshot()





console.log(

  JSON.stringify(

    snapshot,

    null,

    2

  )

)
