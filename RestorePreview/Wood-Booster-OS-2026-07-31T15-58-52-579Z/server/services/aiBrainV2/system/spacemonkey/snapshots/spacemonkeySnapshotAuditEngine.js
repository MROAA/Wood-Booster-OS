/*
==================================================

SPACEMONKEY SNAPSHOT AUDIT ENGINE

Turvallinen historiakerros.

Vastuut:

- tallentaa snapshot tapahtumat
- pitää kehityshistoriaa
- ei tee muutoksia
- ei suorita palautuksia

Kaikki tärkeät tapahtumat jäävät näkyviin.

==================================================
*/



const auditHistory = []





function createSnapshotAudit({

  event = "snapshot_created",

  module =
    "Snapshot System",

  changeType =
    "unknown",

  risk =
    "unknown",

  snapshot = null,

  status =
    "completed",

  message = null,

} = {}){


  const audit = {


    id:
      `audit-${Date.now()}`,


    event,


    module,


    changeType,


    risk,


    snapshot,


    status,


    message:
      message ||
      `Snapshot audit event: ${event}`,


    createdAt:
      new Date()
        .toISOString()

  }





  auditHistory.push(
    audit
  )



  return audit

}






function getSnapshotAuditHistory(){


  return [

    ...auditHistory

  ]

}






function getLatestSnapshotAudit(){


  if(
    auditHistory.length === 0
  ){

    return null

  }



  return (

    auditHistory[
      auditHistory.length - 1
    ]

  )

}






function clearSnapshotAuditHistory(){


  auditHistory.length = 0


  return {

    success:true,

    message:
      "Snapshot audit history cleared."

  }

}





export {

  createSnapshotAudit,

  getSnapshotAuditHistory,

  getLatestSnapshotAudit,

  clearSnapshotAuditHistory

}
