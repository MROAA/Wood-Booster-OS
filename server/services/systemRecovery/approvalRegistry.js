/*
WOOD-BOOSTER HQ

RECOVERY APPROVAL REGISTRY

Vastuut:

- tallentaa palautuspyynnöt pysyvästi
- ylläpitää hyväksynnän tilaa
- tarjoaa historian

Ei:

- suorita palautusta
- muuta järjestelmätiedostoja
- ohita validointia
*/


import fs from "fs"
import path from "path"
import {
fileURLToPath
} from "url"


const __filename =
fileURLToPath(
import.meta.url
)

const __dirname =
path.dirname(
__filename
)


const STORE_PATH =
path.join(
__dirname,
"approvalStore.json"
)



function readApprovals(){

if(
!fs.existsSync(
STORE_PATH
)
){

fs.writeFileSync(
STORE_PATH,
"[]"
)

}


return JSON.parse(
fs.readFileSync(
STORE_PATH,
"utf-8"
)
)

}



function saveApprovals(
approvals
){

fs.writeFileSync(
STORE_PATH,
JSON.stringify(
approvals,
null,
2
)
)

}



export function createApprovalRequest(
{
snapshot,
requestedBy = "system",
validation = {},
} = {}
){

const approvals =
readApprovals()


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


saveApprovals(
approvals
)


return request

}



export function getApprovalRequests(){

return readApprovals()

}



export function getLatestApproval(){

const approvals =
readApprovals()


return approvals[
approvals.length - 1
] || null

}



export function updateApprovalStatus(
id,
status
){

const approvals =
readApprovals()


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


saveApprovals(
approvals
)


return {

success:true,

approval

}

}
