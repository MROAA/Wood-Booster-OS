import {

  requestRestoreApproval

} from "./services/spacemonkey/restoreApproval.js"



import {

  createRestorePlan

} from "./services/spacemonkey/restoreController.js"







requestRestoreApproval({

  approvedBy:

    "Marc Järvinen"

})







const plan =

  createRestorePlan()





console.log(

  JSON.stringify(

    plan,

    null,

    2

  )

)
