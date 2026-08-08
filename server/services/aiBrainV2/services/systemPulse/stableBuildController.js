/*
WOOD-BOOSTER HQ

SYSTEM PULSE

STABLE BUILD CONTROLLER

Vastuut:

- luo vakaan buildin palautuspisteen
- estää turhat snapshotit
- yhdistää snapshot-järjestelmän
- rekisteröi stable build tiedon
- kirjoittaa Installer Audit tapahtuman

Ei:

- suorita build-komentoa
- muuta lähdekoodia
- palauta järjestelmää
*/


import path from "path"

import {
createSnapshot,
} from "../../../backupService.js"



import {
registerStableBuild,
getStableBuildStatus,
} from "./buildGuardian.js"



import {
addInstallerAuditEvent,
} from "../../../systemInstaller/installerAuditLog.js"




export async function createStableBuildCheckpoint(
{
version,
commit,
} = {},
){


try {


const current =
await getStableBuildStatus()



const latest =
current.latestStableBuild




if(
latest &&
latest.version === version &&
latest.commit === commit
){


console.log(
"[StableBuild] Already stable, snapshot skipped"
)



return {

success:true,

status:
"already_stable",

build:
latest,

}

}




console.log(
"[StableBuild] New stable build detected"
)



console.log(
"[StableBuild] Creating snapshot..."
)




const snapshot =
await Promise.race([


createSnapshot(),



new Promise(
(
_,
reject,
)=>{


setTimeout(
()=>{


reject(
new Error(
"Snapshot timeout after 60 seconds"
)
)


},
60000
)


},
),


])




const snapshotFile =
path.basename(
snapshot.file,
)




console.log(
"[StableBuild] Snapshot created:",
snapshotFile,
)




const result =
await registerStableBuild({

version,

commit,

snapshot:
snapshotFile,

})




addInstallerAuditEvent({

event:
"stable-build-created",


snapshot:
snapshotFile,


result:
"stable",


metadata: {

version,

commit

}

})




console.log(
"[StableBuild] Registry updated"
)



return {

success:true,

status:
"stable",

snapshot:
snapshot.file,

build:
result.build,

}

}



catch(error){


console.error(
"[StableBuild] Failed:",
error,
)



addInstallerAuditEvent({

event:
"stable-build-failed",


result:
"failed",


metadata: {

error:
error.message

}

})



return {

success:false,

status:
"failed",

error:
error.message,

}

}


}





export async function getStableBuild(){

return getStableBuildStatus()

}
