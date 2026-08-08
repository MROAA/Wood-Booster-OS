/*
WOOD-BOOSTER HQ

SYSTEM PULSE RECOVERY MANAGER

Vastuut:

- System Pulse palautushallinta
- snapshot tilan yhdistäminen
- palautuskelpoisuuden tarkistus
- restoreService kutsuminen

Ei:

- tee omaa backupia
- pura archiveja itse
- ohita restoreService turvallisuuksia
*/


import {
  getSnapshotRegistry,
  findSnapshot,
} from "../../../snapshotRegistryService.js"


import {
  restoreSnapshot,
} from "../../../restoreService.js"



export async function getRecoveryStatus(){

const snapshots =
  await getSnapshotRegistry()


const latest =
  snapshots[0] || null


return {

  status:
    latest
      ? "ready"
      : "empty",


  snapshotCount:
    snapshots.length,


  latestSnapshot:
    latest,


  canRestore:
    Boolean(latest),


  checkedAt:
    new Date()
      .toISOString()

}

}



export async function getRecoverySnapshot(file){

const snapshot =
  await findSnapshot(
    file
  )


return {

  found:
    Boolean(snapshot),


  snapshot,

  checkedAt:
    new Date()
      .toISOString()

}

}



export async function executeRecovery(
  file,
  confirm
){

const snapshot =
  await findSnapshot(
    file
  )


if(!snapshot){

return {

  success:false,

  error:
    "Snapshot not found"

}

}


const result =
  await restoreSnapshot(
    file,
    {
      confirm
    }
  )


return {

  success:
    result.success,


  recovery:
    "completed",


  restoredFrom:
    file,


  safetyBackup:
    result.safetyBackup,


  checkedAt:
    new Date()
      .toISOString()

}

}
