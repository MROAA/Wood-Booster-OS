/*
=====================================

WOOD-BOOSTER OS

INSTALLER RESTORE APPROVAL

Vastuut:

- tarkistaa restore suunnitelman
- vaatii käyttäjän vahvistuksen
- hallitsee approval-tilan
- luo audit tiedon

Ei:

- palauta tiedostoja
- muuta järjestelmää
- suorita restorea

=====================================
*/


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



return {


system:

"Wood-Booster OS Restore Approval",



status,



requiresConfirmation:

true,



confirmed,



canRestore:

status === "approved",



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


approved:

status === "approved"


},



audit:

{

event:

confirmed

?

"restore-approved"

:

"restore-approval-requested",



createdAt:

new Date()
.toISOString(),



result:

confirmed

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
