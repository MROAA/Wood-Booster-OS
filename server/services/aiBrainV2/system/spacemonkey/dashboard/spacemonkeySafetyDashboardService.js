/*
==================================================

SPACEMONKEY SAFETY DASHBOARD SERVICE

Turvallisuusjärjestelmän tilannekuva.

Vastuut:

- näyttää snapshot tilanteen
- näyttää recovery tilanteen
- näyttää approval tilanteen
- näyttää viimeisen audit tapahtuman

Ei:
- muuta järjestelmää
- suorita toimintoja

==================================================
*/


import prisma from "../../../../../prisma.js"







async function getSafetyDashboard(){


  const snapshots =
    await prisma
      .spacemonkeySnapshot
      .findMany({

        orderBy: {

          createdAt:
            "desc"

        }

      })





  const approvals =
    await prisma
      .spacemonkeyApproval
      .findMany({

        orderBy: {

          createdAt:
            "desc"

        }

      })





  const audits =
    await prisma
      .spacemonkeySnapshotAudit
      .findMany({

        orderBy: {

          createdAt:
            "desc"

        },

        take: 10

      })






  const latestSnapshot =
    snapshots[0] ||
    null





  const latestAudit =
    audits[0] ||
    null





  const pendingApprovals =
    approvals.filter(

      item =>
        item.status ===
        "waiting"

    )







  return {


    system:
      "Spacemonkey Safety Dashboard",



    version:
      "1.0.0",



    status:
      "protected",





    snapshots: {

      count:
        snapshots.length,


      latest:
        latestSnapshot

    },





    recovery: {

      available:
        snapshots.length > 0,


      approvalRequired:
        true,


      pending:
        pendingApprovals.length

    },





    audit: {

      latest:
        latestAudit,


      total:
        audits.length

    },





    approvals: {

      total:
        approvals.length,


      waiting:
        pendingApprovals.length

    }


  }


}







export {

  getSafetyDashboard

}
