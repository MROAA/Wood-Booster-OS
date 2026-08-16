/*
==================================================

SPACEMONKEY RECOVERY MANAGER

Turvallinen palautuksen hallintakerros.

Vastuut:

- löytää viimeisin snapshot
- tarkistaa palautettavuus
- valmistella palautus
- kirjoittaa audit tapahtuma

Ei:
- suorita automaattista palautusta
- ohita hyväksyntää
- muuta järjestelmää

Recovery valmistellaan ennen toteutusta.

==================================================
*/


import {

  getLatestSnapshot,

} from "./spacemonkeySnapshotRegistry.js"



import {

  createSnapshotAuditRecord,

} from "./spacemonkeySnapshotAuditService.js"







async function prepareRecovery({

  snapshotDirectory,

  reason =
    "manual_recovery_request",

} = {}){



  const snapshot =
    await getLatestSnapshot()



  if(
    !snapshot
  ){

    return {

      success:false,

      status:
        "no_snapshot",

      snapshot:null,

      message:
        "No snapshot available."

    }

  }





  const audit =
    await createSnapshotAuditRecord({

      event:
        "recovery_prepared",


      module:
        "Recovery Manager",


      changeType:
        "recovery",


      risk:
        "high",


      snapshot:
        snapshot.filename,


      status:
        "prepared",


      message:
        `Recovery prepared: ${reason}`

    })





  return {

    success:true,


    status:
      "ready",


    snapshot,


    audit,


    message:
      "Recovery prepared. Approval required before restore."

  }


}








function getRecoveryPolicy(){


  return {

    system:
      "Spacemonkey Recovery Manager",


    version:
      "1.0.0",


    rules:{

      automaticRestore:
        false,


      requireApproval:
        true,


      auditRecovery:
        true

    },


    safety:
      "Recovery requires explicit approval."

  }

}





export {

  prepareRecovery,

  getRecoveryPolicy

}
