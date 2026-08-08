import {
getInstallerRestoreApproval,
} from "./installerRestoreApproval.js"


import {
getInstallerAuditLog,
} from "./installerAuditLog.js"



getInstallerRestoreApproval({

restorePlan: {

status:
"ready",

targetSnapshot: {

id:
"test"

},

validation:
"healthy",

score:
100

},

confirmed:
true

})



console.log(
JSON.stringify(
getInstallerAuditLog(),
null,
2
)
)
