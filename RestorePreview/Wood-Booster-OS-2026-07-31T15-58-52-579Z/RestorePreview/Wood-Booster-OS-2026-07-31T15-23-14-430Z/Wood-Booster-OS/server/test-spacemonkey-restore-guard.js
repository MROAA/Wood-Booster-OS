import {

  checkRestorePermission

} from "./services/spacemonkey/restoreGuard.js"





const result =

  checkRestorePermission()





console.log(

  JSON.stringify(

    result,

    null,

    2

  )

)
