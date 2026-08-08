/*
=====================================

WOOD-BOOSTER HQ

INSTALLER AUDIT LOG V2

Vastuut:

- tallentaa Installer tapahtumat
- tallentaa approval tapahtumat
- antaa tapahtumahistorian
- näyttää viimeisimmän tapahtuman
- säilyttää audit historian

Ei:

- muuta järjestelmää
- suorita restorea
- tee automaattisia päätöksiä

=====================================
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



const dataRoot =
path.resolve(
__dirname,
"../../data"
)



const auditFile =
path.join(
dataRoot,
"installer-audit.json"
)



function ensureStorage(){


if(
!fs.existsSync(
dataRoot
)
){

fs.mkdirSync(
dataRoot,
{
recursive:true
}
)

}



if(
!fs.existsSync(
auditFile
)
){

fs.writeFileSync(
auditFile,
JSON.stringify(
{
events:[]
},
null,
2
)
)

}


}



function readAuditEvents(){


ensureStorage()



try {


const data =
JSON.parse(
fs.readFileSync(
auditFile,
"utf-8"
)
)



return data.events || []


}

catch(error){


return []


}


}



function writeAuditEvents(events){


ensureStorage()



fs.writeFileSync(
auditFile,
JSON.stringify(
{
events
},
null,
2
)
)


}



function addInstallerAuditEvent({

event,
snapshot = null,
result = "unknown",
metadata = {}

}) {


const events =
readAuditEvents()



const entry = {


event,


snapshot,


result,


metadata,


createdAt:

new Date()
.toISOString()


}



events.push(
entry
)



writeAuditEvents(
events
)



return entry

}




function getInstallerAuditLog(){


const events =
readAuditEvents()



return {


system:

"Wood-Booster HQ Installer Audit Log V2",



count:

events.length,



latest:

events.length > 0

?

events[
events.length - 1
]

:

null,



events,



storage:

auditFile,



checkedAt:

new Date()
.toISOString()


}


}



export {

addInstallerAuditEvent,

getInstallerAuditLog

}
