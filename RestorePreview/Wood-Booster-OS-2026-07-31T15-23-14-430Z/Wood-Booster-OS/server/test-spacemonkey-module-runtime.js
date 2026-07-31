import {

  createModuleRuntime,

  setModuleRuntimeState,

  getAllModuleRuntime

} from "./services/spacemonkey/spacemonkeyModuleRuntime.js"





createModuleRuntime(

  "restore"

)





setModuleRuntimeState(

  "restore",

  "active"

)





console.log(

  JSON.stringify(

    getAllModuleRuntime(),

    null,

    2

  )

)
