/*
==================================================

SPACEMONKEY SNAPSHOT ORCHESTRATOR

Turvallinen muutosten valmistelukerros.

Vastuut:

- tarkistaa snapshot tarpeen
- luo turvallisen snapshotin
- rekisteröi snapshotin
- tallentaa audit historian

Ei:
- suorita muutoksia
- hyväksy muutoksia
- palauta automaattisesti

==================================================
*/


import {

  evaluateSnapshotNeed,

} from "./spacemonkeySnapshotPolicyEngine.js"



import {

  createSnapshot,

} from "./spacemonkeySnapshotEngine.js"



import {

  registerSnapshot,

} from "./spacemonkeySnapshotRegistry.js"



import {

  createSnapshotAuditRecord,

} from "./spacemonkeySnapshotAuditService.js"





async function prepareSafeChange({

  changeType,

  riskLevel = "low",

  snapshotDirectory,

  state,

  registry = true,

  audit = true,

} = {}){


  const policy =
    evaluateSnapshotNeed({

      changeType,

      riskLevel,

    })





  if(
    !policy.snapshotRequired
  ){

    return {

      success:true,

      snapshotCreated:false,

      policy,

      message:
        "Snapshot not required."

    }

  }





  const snapshot =
    await createSnapshot({

      snapshotDirectory,

      state,

    })






  if(
    !snapshot
  ){

    return {

      success:false,

      snapshotCreated:false,

      policy,

      message:
        "Snapshot creation failed."

    }

  }





  let registryResult =
    null



  if(
    registry
  ){

    registryResult =
      await registerSnapshot({

        filename:
          snapshot.filename,


        path:
          snapshot.filePath,


        version:
          state?.version ||
          "unknown",


        description:
          `Safety snapshot before ${changeType}`

      })

  }







  let auditResult =
    null



  if(
    audit
  ){

    auditResult =
      await createSnapshotAuditRecord({

        event:
          "snapshot_created",


        module:
          "Snapshot Orchestrator",


        changeType,


        risk:
          riskLevel,


        snapshot:
          snapshot.filename,


        status:
          "completed",


        message:
          "Safety snapshot created before change."

      })

  }







  return {

    success:true,


    snapshotCreated:true,


    policy,


    snapshot,


    registry:
      registryResult,


    audit:
      auditResult,


    message:
      "Safety snapshot created before change."

  }


}






export {

  prepareSafeChange

}
