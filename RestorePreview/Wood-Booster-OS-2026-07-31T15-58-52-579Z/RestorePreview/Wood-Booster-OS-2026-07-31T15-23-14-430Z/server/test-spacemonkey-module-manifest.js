import {

  createModuleManifest

} from "./services/spacemonkey/spacemonkeyModuleManifest.js"





const restoreModule =

  createModuleManifest({

    id:

      "restore",


    name:

      "Spacemonkey Restore Module"

  })





console.log(

  JSON.stringify(

    restoreModule,

    null,

    2

  )

)
