/*
WOOD-BOOSTER HQ

RESTORE ENGINE

Vastuut:

- muodostaa palautussuunnitelman
- valmistelee palautuksen
- varmistaa palautuksen ehdot
- yhdistää Restore Adapterin

Ei:

- ylikirjoita tiedostoja ilman adapterin lupaa
- poista nykyistä järjestelmää
- ohita hyväksyntää
*/


import {
prepareRestoreExecution,
} from "./restoreAdapter.js"



function validateRestoreInput(
approval,
integrity
){

const checks = {

approvalValid:
approval?.status === "approved",

integrityHealthy:
integrity?.status === "healthy",

snapshotAvailable:
Boolean(
approval?.snapshot
)

}



const failedChecks =
Object.entries(checks)
.filter(
([,value]) => !value
)
.map(
([key]) => key
)



return {

allowed:
failedChecks.length === 0,

checks,

failedChecks

}

}



function createRestorePlan(
approval
){

return {

source:
approval.snapshot,

target:
"Wood-Booster HQ",

operations:[

"backup current state",

"prepare restore environment",

"restore snapshot",

"validate restored files",

"run system health check"

],

rollbackAvailable:
true

}

}



export function createRestoreDryRun(
{
approval,
integrity
} = {}
){

const validation =
validateRestoreInput(
approval,
integrity
)



return {

system:
"Wood-Booster HQ Restore Engine",

mode:
"dry-run",

status:
validation.allowed
?
"ready"
:
"blocked",

validation,

restorePlan:
validation.allowed
?
createRestorePlan(
approval
)
:
null,

createdAt:
new Date()
.toISOString()

}

}




export function executeRestore(
{
approval,
integrity
} = {}
){

const validation =
validateRestoreInput(
approval,
integrity
)



if(
!validation.allowed
){

return {

success:false,

system:
"Wood-Booster HQ Restore Engine",

status:
"blocked",

validation,

createdAt:
new Date()
.toISOString()

}

}



const restorePlan =
createRestorePlan(
approval
)



const adapterResult =
prepareRestoreExecution({

approval,

integrity

})



return {

success:true,

system:
"Wood-Booster HQ Restore Engine",

mode:
"execution",

status:
adapterResult.status,

message:
"Restore execution prepared.",

validation,

restorePlan,

adapter:
adapterResult,

rollbackAvailable:
true,

createdAt:
new Date()
.toISOString()

}

}
