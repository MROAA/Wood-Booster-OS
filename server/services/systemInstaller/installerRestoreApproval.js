/*
=====================================

WOOD-BOOSTER HQ

INSTALLER RESTORE APPROVAL

Vastuut:

- tarkistaa restore suunnitelman
- vaatii käyttäjän vahvistuksen
- hallitsee approval-tilan
- luo audit tapahtuman

Ei:

- palauta tiedostoja
- muuta järjestelmää
- suorita restorea

=====================================
*/


import {
addInstallerAuditEvent,
} from "./installerAuditLog.js"



function getInstallerRestoreApproval({

restorePlan,
confirmed = false

}) {



const validPlan =

restorePlan &&
restorePlan.status === "ready"



const status =


!validPlan

?

"unavailable"


:

confirmed

?

"approved"


:

"waiting-confirmation"




const approved =

status === "approved"



if(approved){


addInstallerAuditEvent({

event:

"restore-approved",


snapshot:

restorePlan?.targetSnapshot?.id
||
null,


result:

"approved",


metadata: {

validation:

restorePlan?.validation
||
"unknown",


score:

restorePlan?.score
||
0

}

})


}



return {


system:

"Wood-Booster HQ Restore Approval",



status,



requiresConfirmation:

true,



confirmed,



canRestore:

approved,



targetSnapshot:

restorePlan?.targetSnapshot
||
null,



validation:

restorePlan?.validation
||
"unknown",



score:

restorePlan?.score
||
0,



approval:

{

requested:

true,


confirmed,


approved

},



audit:

{

event:

approved

?

"restore-approved"

:

"restore-approval-requested",



createdAt:

new Date()
.toISOString(),



result:

approved

?

"approved"

:

"pending"

},



checkedAt:

new Date()
.toISOString()


}



}



export {

getInstallerRestoreApproval

}
