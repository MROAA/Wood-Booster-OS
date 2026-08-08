/*
WOOD-BOOSTER HQ

RESTORE AUDIT

Vastuut:

- kirjaa palautustapahtumat
- säilyttää palautushistorian
- tarjoaa audit datan

Ei:

- suorita palautusta
- muuta järjestelmätiedostoja
*/


import fs from "fs"
import path from "path"



const auditFile =
path.resolve(
"server/data/restore-audit.json"
)



function ensureAuditFile(){

if(
!fs.existsSync(auditFile)
){

fs.writeFileSync(
auditFile,
JSON.stringify(
[],
null,
2
)
)

}

}



export function recordRestoreEvent(
event
){

ensureAuditFile()


const history =
JSON.parse(
fs.readFileSync(
auditFile,
"utf-8"
)
)



const entry = {

id:
`restore-${Date.now()}`,

event:
event.event || "restore",

snapshot:
event.snapshot || null,

status:
event.status || "unknown",

operator:
event.operator || "unknown",

metadata:
event.metadata || {},

createdAt:
new Date()
.toISOString()

}



history.push(
entry
)



fs.writeFileSync(
auditFile,
JSON.stringify(
history,
null,
2
)
)



return entry

}



export function getRestoreAudit(){

ensureAuditFile()


return JSON.parse(
fs.readFileSync(
auditFile,
"utf-8"
)
)

}
