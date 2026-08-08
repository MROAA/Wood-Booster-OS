/*
WOOD-BOOSTER HQ

RECOVERY APPROVAL REGISTRY

Vastuut:

- tallentaa palautuspyynnöt
- ylläpitää hyväksynnän tilaa
- tarjoaa historian

Ei:

- suorita palautusta
- muuta järjestelmätiedostoja
- ohita validointia
*/


const approvals = []



export function createApprovalRequest(
{
snapshot,
requestedBy = "system",
validation = {},
} = {}
){

const request = {

id:
`restore-request-${Date.now()}`,

snapshot,

requestedBy,

status:
"waiting-confirmation",

validation,

createdAt:
new Date().toISOString(),

updatedAt:
new Date().toISOString(),

}


approvals.push(
request
)


return request

}



export function getApprovalRequests(){

return approvals

}



export function getLatestApproval(){

return approvals[
approvals.length - 1
] || null

}



export function updateApprovalStatus(
id,
status
){

const approval =
approvals.find(
item =>
item.id === id
)


if(!approval){

return {

success:false,

error:
"Approval request not found"

}

}



approval.status =
status


approval.updatedAt =
new Date().toISOString()



return {

success:true,

approval

}

}
