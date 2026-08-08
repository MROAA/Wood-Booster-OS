/*
WOOD-BOOSTER HQ

RECOVERY APPROVAL GATEWAY

Vastuut:

- yhdistää registry ja policy
- hallitsee palautuspyynnön elinkaarta
- toimii turvalukkona ennen palautusta

Ei:

- suorita palautusta
- muuta tiedostoja
- ohita validointia
*/


import {
createApprovalRequest,
getApprovalRequests,
getLatestApproval,
updateApprovalStatus,
} from "./approvalRegistry.js"


import {
validateRestoreApproval,
} from "./approvalPolicy.js"



export function requestRestoreApproval(
{
snapshot,
requestedBy = "system",
validation = {},
} = {}
){

const policy =
validateRestoreApproval({
snapshot,
validation,
})


if(!policy.allowed){

return {

success:false,

status:"blocked",

policy,

}

}



const approval =
createApprovalRequest({

snapshot,

requestedBy,

validation:{

...validation,

policy,

},

})



return {

success:true,

status:"waiting-confirmation",

approval,

}

}



export function approveRestore(
id
){

return updateApprovalStatus(
id,
"approved"
)

}



export function rejectRestore(
id
){

return updateApprovalStatus(
id,
"rejected"
)

}



export function getRestoreApprovalStatus(){

return {

latest:
getLatestApproval(),

history:
getApprovalRequests(),

}

}
