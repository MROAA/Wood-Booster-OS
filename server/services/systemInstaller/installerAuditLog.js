/*
=====================================

WOOD-BOOSTER OS

INSTALLER AUDIT LOG

Vastuut:

- tallentaa Installer tapahtumat
- tallentaa approval tapahtumat
- antaa tapahtumahistorian
- näyttää viimeisimmän tapahtuman

Ei:

- muuta järjestelmää
- suorita restorea
- tee automaattisia päätöksiä

=====================================
*/


const auditEvents = []



function addInstallerAuditEvent({

event,
snapshot = null,
result = "unknown",
metadata = {}

}) {


const entry = {


event,


snapshot,


result,


metadata,


createdAt:

new Date()
.toISOString()


}



auditEvents.push(
entry
)



return entry

}




function getInstallerAuditLog(){


return {


system:

"Wood-Booster OS Installer Audit Log",



count:

auditEvents.length,



latest:

auditEvents.length > 0

?
auditEvents[
auditEvents.length - 1
]

:
null,



events:

auditEvents,



checkedAt:

new Date()
.toISOString()


}


}




export {

addInstallerAuditEvent,

getInstallerAuditLog

}
