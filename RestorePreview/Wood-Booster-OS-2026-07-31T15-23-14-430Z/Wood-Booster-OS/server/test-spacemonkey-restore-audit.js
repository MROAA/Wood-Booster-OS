import {

  createRestoreAuditEvent,

  getRestoreAuditLog

} from "./services/spacemonkey/restoreAudit.js"





const event =

  createRestoreAuditEvent({

    event:

      "RESTORE_DRY_RUN",


    user:

      "Marc Järvinen",


    snapshot:

      "Spacemonkey Core v1.0.0",


    status:

      "READY"

  })





console.log(

  JSON.stringify(

    event,

    null,

    2

  )

)





console.log(

  JSON.stringify(

    getRestoreAuditLog(),

    null,

    2

  )

)
