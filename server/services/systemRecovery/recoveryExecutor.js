/*
WOOD-BOOSTER HQ

SYSTEM RECOVERY EXECUTOR

Vastuut:

- vastaanottaa hyväksytyn palautuksen
- tarkistaa hyväksynnän
- validoi palautuksen eheyden
- valmistaa palautussuunnitelman

Ei:

- suorita oikeaa palautusta
- ylikirjoita järjestelmää
- ohita hyväksyntää
*/


import {
getLatestApproval,
} from "./approvalRegistry.js"


import {
validateRecoveryIntegrity,
} from "./integrityValidator.js"



function validateExecutionRequest(
approval
){

const checks = {

approvalExists:
Boolean(
approval
),


statusApproved:
approval?.status === "approved",


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

failedChecks,

}

}



export function createRecoveryDryRun(){

const approval =
getLatestApproval()



const validation =
validateExecutionRequest(
approval
)


if(!validation.allowed){

return {

system:
"Wood-Booster HQ Recovery Executor",


mode:
"dry-run",


status:
"blocked",


approval:
approval || null,


validation,


integrity:
null,


plan:
[],


createdAt:
new Date().toISOString()

}

}



const integrity =
validateRecoveryIntegrity({

snapshot:
approval.snapshot,


metadata:
approval.validation?.metadata || {}

})



const ready =
integrity.status === "healthy"



return {

system:
"Wood-Booster HQ Recovery Executor",


mode:
"dry-run",


status:
ready
?
"ready"
:
"blocked",


approval,


validation,


integrity,


plan:
ready
?
[
"validate snapshot",
"prepare restore environment",
"restore files",
"verify system integrity",
"run health checks"
]
:
[],


createdAt:
new Date().toISOString()

}

}
