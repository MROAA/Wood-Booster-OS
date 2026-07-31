import {

  requestRestoreApproval,

  getRestoreApproval

} from "./services/spacemonkey/restoreApproval.js"





const approval =

  requestRestoreApproval({

    approvedBy:

      "Marc Järvinen"

  })





console.log(

  JSON.stringify(

    approval,

    null,

    2

  )

)





console.log(

  JSON.stringify(

    getRestoreApproval(),

    null,

    2

  )

)
