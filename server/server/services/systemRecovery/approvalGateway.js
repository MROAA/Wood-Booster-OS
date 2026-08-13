/*
WOOD-BOOSTER HQ

RECOVERY APPROVAL GATEWAY

Vastuut:

- yhdistää approval registry ja policy
- hallitsee palautuspyynnön elinkaarta
- toimii turvalukkona ennen palautusta

Ei:

- suorita palautusta
- muuta järjestelmätiedostoja
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

const result =
updateApprovalStatus(
id,
"approved"
)


return result

}



export function rejectRestore(
id
){

const result =
updateApprovalStatus(
id,
"rejected"
)


return result

}



export function getRestoreApprovalStatus(){

return {

latest:
getLatestApproval(),

history:
getApprovalRequests(),

}

}
