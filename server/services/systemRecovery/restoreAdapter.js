/*
WOOD-BOOSTER HQ

RESTORE ADAPTER

Vastuut:

- yhdistää Restore Enginen oikeaan palautuskerrokseen
- valmistelee snapshot-palautuksen
- hallitsee turvallisen palautuksen vaiheet

Ei:

- ylikirjoita tiedostoja ilman varmistusta
- poista nykyistä järjestelmää
- ohita hyväksyntää
*/


function validateAdapterInput(
{
approval,
integrity
} = {}
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



export function prepareRestoreExecution(
{
approval,
integrity
} = {}
){


const validation =
validateAdapterInput({
approval,
integrity
})



if(
!validation.allowed
){

return {

success:false,

status:"blocked",

validation

}

}



return {

success:true,

system:
"Wood-Booster HQ Restore Adapter",

status:"prepared",

snapshot:
approval.snapshot,

steps:[

"backup current system state",

"verify snapshot archive",

"prepare restore directory",

"restore snapshot files",

"validate restored system"

],

rollbackAvailable:true,

validation,

createdAt:
new Date()
.toISOString()

}

}
